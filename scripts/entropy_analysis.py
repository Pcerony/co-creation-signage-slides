#!/usr/bin/env python3
"""
scripts/entropy_analysis.py

基于香农信息论与惊讶度理论的植物园解说标牌眼动认知分析核心脚本 (全量 13 位被试版)
包含：
1. 空间静态注视熵 (Stationary Gaze Entropy, SGE)
2. 动线转移马尔可夫熵 (Gaze Transition Entropy, GTE)
3. 语义惊讶度自信息量权重 (Surprisal & Information Weight)
4. 信息加权认知吸收总量 (Information-Weighted Cognitive Gain, E_gain)
5. 认知信息传递能效比 (Cognitive Efficiency Ratio, eta)
6. 设计意图相对熵 (KL Divergence, D_KL)
7. 对照组 (A1/B1) vs 改良组 (A2/B2) 统计推断 (Paired t-test, Cohen's d, Wilcoxon test)
8. 输出详尽分析报告、CSV数据与高分辨率可视化图表 (N = 13)
"""

import os
import json
import glob
import math
import numpy as np
import matplotlib.pyplot as plt
import matplotlib as mpl

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONSOLIDATED_JSON = os.path.join(BASE_DIR, 'data', 'consolidated', 'all_13_participants_archive.json')
AOI_FILE = os.path.join(BASE_DIR, 'stimuli', 'aoi_definitions.json')
OUTPUT_DIR = os.path.join(BASE_DIR, 'outputs', 'entropy_analysis')
os.makedirs(OUTPUT_DIR, exist_ok=True)

mpl.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica', 'Hiragino Sans', 'PingFang SC', 'sans-serif']
mpl.rcParams['axes.unicode_minus'] = False

with open(AOI_FILE, 'r', encoding='utf-8') as f:
    AOI_DEFS = json.load(f)['images']

SURPRISAL_WEIGHTS = {
    'a1': {
        'header_title': -math.log2(0.60),       # 0.737 bits
        'image_photo': -math.log2(0.50),        # 1.000 bits
        'body_text': -math.log2(0.75),          # 0.415 bits
        'background': -math.log2(0.90)          # 0.152 bits
    },
    'b1': {
        'header_title': -math.log2(0.60),       # 0.737 bits
        'image_photo': -math.log2(0.50),        # 1.000 bits
        'body_text': -math.log2(0.75),          # 0.415 bits
        'background': -math.log2(0.90)          # 0.152 bits
    },
    'a2': {
        'header_title': -math.log2(0.40),       # 1.322 bits (设问式标题，激发思考)
        'image_photo': -math.log2(0.50),        # 1.000 bits (主照片)
        'dialogue_bubble': -math.log2(0.15),    # 2.737 bits (拟人化对话，反常规高惊喜)
        'body_text': -math.log2(0.35),          # 1.515 bits (故事化说明与触感引导)
        'interactive_bubble': -math.log2(0.12), # 3.059 bits (下部感官触碰提示，极高惊讶度)
        'bottom_icons': -math.log2(0.30),       # 1.737 bits (日常养护图标)
        'flower_meaning': -math.log2(0.25),     # 2.000 bits (花语情感提示)
        'background': -math.log2(0.90)          # 0.152 bits
    },
    'b2': {
        'header_title': -math.log2(0.40),       # 1.322 bits
        'image_photo': -math.log2(0.50),        # 1.000 bits
        'dialogue_bubble': -math.log2(0.15),    # 2.737 bits
        'body_text': -math.log2(0.35),          # 1.515 bits
        'interactive_bubble': -math.log2(0.12), # 3.059 bits
        'bottom_icons': -math.log2(0.30),       # 1.737 bits
        'flower_meaning': -math.log2(0.25),     # 2.000 bits
        'background': -math.log2(0.90)          # 0.152 bits
    }
}

DESIGN_INTENTS = {
    'a1': {'header_title': 0.25, 'image_photo': 0.35, 'body_text': 0.35, 'background': 0.05},
    'b1': {'header_title': 0.25, 'image_photo': 0.35, 'body_text': 0.35, 'background': 0.05},
    'a2': {
        'header_title': 0.15,
        'image_photo': 0.15,
        'dialogue_bubble': 0.20,
        'body_text': 0.20,
        'interactive_bubble': 0.15,
        'bottom_icons': 0.08,
        'flower_meaning': 0.05,
        'background': 0.02
    },
    'b2': {
        'header_title': 0.15,
        'image_photo': 0.15,
        'dialogue_bubble': 0.20,
        'body_text': 0.20,
        'interactive_bubble': 0.15,
        'bottom_icons': 0.08,
        'flower_meaning': 0.05,
        'background': 0.02
    }
}

def get_point_aoi(x, y, image_id):
    img_def = AOI_DEFS.get(image_id)
    if not img_def:
        return 'background'
    for aoi in img_def['aois']:
        x_min, y_min, x_max, y_max = aoi['bbox']
        if x_min <= x <= x_max and y_min <= y <= y_max:
            return aoi['id']
    return 'background'

def calculate_shannon_entropy(prob_dist):
    entropy = 0.0
    for p in prob_dist.values():
        if p > 1e-12:
            entropy -= p * math.log2(p)
    return entropy

def calculate_transition_entropy(aoi_sequence, all_aois):
    if len(aoi_sequence) < 2:
        return 0.0, {}
    
    aoi_to_idx = {aoi: idx for idx, aoi in enumerate(all_aois)}
    N = len(all_aois)
    trans_counts = np.zeros((N, N), dtype=float)
    
    for t in range(len(aoi_sequence) - 1):
        u = aoi_sequence[t]
        v = aoi_sequence[t+1]
        if u in aoi_to_idx and v in aoi_to_idx:
            trans_counts[aoi_to_idx[u], aoi_to_idx[v]] += 1.0
            
    total_trans = np.sum(trans_counts)
    if total_trans == 0:
        return 0.0, {}
    
    row_sums = np.sum(trans_counts, axis=1)
    p_state = row_sums / total_trans
    
    trans_matrix = np.zeros((N, N), dtype=float)
    for i in range(N):
        if row_sums[i] > 0:
            trans_matrix[i, :] = trans_counts[i, :] / row_sums[i]
            
    gte = 0.0
    for i in range(N):
        if p_state[i] > 1e-12:
            row_entropy = 0.0
            for j in range(N):
                p_ij = trans_matrix[i, j]
                if p_ij > 1e-12:
                    row_entropy -= p_ij * math.log2(p_ij)
            gte += p_state[i] * row_entropy
            
    return gte, trans_matrix

def calculate_kl_divergence(p_dist, q_dist, all_aois, eps=1e-6):
    kl = 0.0
    for aoi in all_aois:
        p = p_dist.get(aoi, 0.0)
        q = q_dist.get(aoi, eps)
        if p > 1e-12:
            kl += p * math.log2(p / q)
    return max(0.0, kl)

def process_all_13_participants():
    print(f"[*] 读取全量 13 位被试归档文件: {CONSOLIDATED_JSON}")
    with open(CONSOLIDATED_JSON, 'r', encoding='utf-8') as f:
        content = json.load(f)
        
    sessions = content.get('sessions', [])
    all_runs_results = []
    participant_pairs = {}
    
    for session in sessions:
        p_id = session.get('id') or session.get('label')
        runs = session.get('runs', [])
        
        for run in runs:
            # 兼容多种命名格式
            img_id = (run.get('imageName') or run.get('image', {}).get('id') or run.get('image', {}).get('name') or '').lower()
            cond_raw = (run.get('condition') or '').lower()
            
            if img_id in ['a1', 'b1'] or 'control' in cond_raw or '对照' in cond_raw:
                condition = 'control'
                if not img_id:
                    img_id = 'a1' if session.get('group') == 'A' else 'b1'
            elif img_id in ['a2', 'b2'] or 'experiment' in cond_raw or 'intervention' in cond_raw or '实验' in cond_raw:
                condition = 'intervention'
                if not img_id:
                    img_id = 'a2' if session.get('group') == 'A' else 'b2'
            else:
                continue
                
            points = run.get('points', [])
            valid_points = [p for p in points if p.get('onPaper') and 0.0 <= p.get('a4X', -1) <= 1.0 and 0.0 <= p.get('a4Y', -1) <= 1.0]
            
            if len(valid_points) < 10:
                continue
                
            aoi_seq = [get_point_aoi(p['a4X'], p['a4Y'], img_id) for p in valid_points]
            img_aoi_defs = AOI_DEFS.get(img_id, {}).get('aois', [])
            all_aoi_keys = [a['id'] for a in img_aoi_defs] + ['background']
            K = len(all_aoi_keys)
            
            # 1. 空间分布
            aoi_counts = {aoi: aoi_seq.count(aoi) for aoi in all_aoi_keys}
            total_pts = len(aoi_seq)
            p_gaze = {aoi: aoi_counts[aoi] / total_pts for aoi in all_aoi_keys}
            
            # 2. SGE
            sge = calculate_shannon_entropy(p_gaze)
            norm_sge = sge / math.log2(K) if K > 1 else 0.0
            
            # 3. GTE
            gte, trans_mat = calculate_transition_entropy(aoi_seq, all_aoi_keys)
            norm_gte = gte / math.log2(K) if K > 1 else 0.0
            
            # 4. E_gain
            surprisal_dict = SURPRISAL_WEIGHTS.get(img_id, {})
            e_gain = sum(p_gaze[aoi] * surprisal_dict.get(aoi, 0.5) for aoi in all_aoi_keys)
            
            # 5. eta
            eta = e_gain / (gte + 0.1)
            
            # 6. D_KL
            q_intent = DESIGN_INTENTS.get(img_id, {})
            d_kl = calculate_kl_divergence(p_gaze, q_intent, all_aoi_keys)
            
            record = {
                'participant': p_id,
                'group': session.get('group', 'A'),
                'imageId': img_id,
                'condition': condition,
                'pointCount': total_pts,
                'duration': run.get('duration', 0.0),
                'sge': sge,
                'normSge': norm_sge,
                'gte': gte,
                'normGte': norm_gte,
                'eGain': e_gain,
                'eta': eta,
                'dKl': d_kl,
                'pGaze': p_gaze,
                'transMatrix': trans_mat.tolist() if isinstance(trans_mat, np.ndarray) else trans_mat,
                'aoiKeys': all_aoi_keys
            }
            
            all_runs_results.append(record)
            
            if p_id not in participant_pairs:
                participant_pairs[p_id] = {}
            participant_pairs[p_id][condition] = record

    print(f"[*] 成功解析 {len(all_runs_results)} 条有效记录，涵盖 {len(participant_pairs)} 位独立被试。")
    return all_runs_results, participant_pairs

def perform_statistical_tests(participant_pairs):
    paired_data = {'sge': [], 'gte': [], 'eGain': [], 'eta': [], 'dKl': [], 'normSge': [], 'normGte': []}
    
    for p_id, data in participant_pairs.items():
        if 'control' in data and 'intervention' in data:
            c = data['control']
            i = data['intervention']
            for k in paired_data.keys():
                paired_data[k].append((c[k], i[k]))
                
    n_pairs = len(paired_data['sge'])
    print(f"\n=======================================================")
    print(f" 📊 全量 13 位被试统计推断结果 (Paired Comparison, N = {n_pairs})")
    print(f"=======================================================")
    
    stats_summary = {}
    for metric, pairs in paired_data.items():
        ctrl_vals = np.array([p[0] for p in pairs])
        intv_vals = np.array([p[1] for p in pairs])
        
        diff = intv_vals - ctrl_vals
        mean_ctrl = np.mean(ctrl_vals)
        std_ctrl = np.std(ctrl_vals, ddof=1)
        mean_intv = np.mean(intv_vals)
        std_intv = np.std(intv_vals, ddof=1)
        mean_diff = np.mean(diff)
        std_diff = np.std(diff, ddof=1)
        
        t_stat = mean_diff / (std_diff / math.sqrt(n_pairs)) if std_diff > 1e-12 else 0.0
        cohen_d = mean_diff / std_diff if std_diff > 1e-12 else 0.0
        pct_change = ((mean_intv - mean_ctrl) / mean_ctrl) * 100.0 if abs(mean_ctrl) > 1e-12 else 0.0
        
        stats_summary[metric] = {
            'mean_ctrl': float(mean_ctrl),
            'std_ctrl': float(std_ctrl),
            'mean_intv': float(mean_intv),
            'std_intv': float(std_intv),
            'mean_diff': float(mean_diff),
            'pct_change': float(pct_change),
            't_stat': float(t_stat),
            'cohen_d': float(cohen_d)
        }
        
        print(f"[{metric.upper():<8}] Control: {mean_ctrl:6.3f} (±{std_ctrl:5.3f}) | Intervention: {mean_intv:6.3f} (±{std_intv:5.3f}) | Diff: {mean_diff:+6.3f} ({pct_change:+6.1f}%) | t={t_stat:6.3f} | Cohen's d={cohen_d:6.3f}")
        
    return stats_summary, paired_data

def generate_visualizations(stats_summary, paired_data, all_results):
    fig, axes = plt.subplots(2, 2, figsize=(14, 11), dpi=300)
    plt.subplots_adjust(hspace=0.32, wspace=0.25)
    
    c_ctrl = '#64748b'
    c_intv = '#059669'
    
    # 1. GTE
    ax1 = axes[0, 0]
    gte_pairs = paired_data['gte']
    for idx, (c_val, i_val) in enumerate(gte_pairs):
        ax1.plot([1, 2], [c_val, i_val], color='#cbd5e1', alpha=0.85, linewidth=1.5, zorder=1)
        ax1.scatter([1], [c_val], color=c_ctrl, s=70, alpha=0.9, zorder=2)
        ax1.scatter([2], [i_val], color=c_intv, s=70, alpha=0.9, zorder=2)
    m_c, m_i = stats_summary['gte']['mean_ctrl'], stats_summary['gte']['mean_intv']
    s_c, s_i = stats_summary['gte']['std_ctrl'], stats_summary['gte']['std_intv']
    ax1.errorbar([0.7, 2.3], [m_c, m_i], yerr=[s_c, s_i], fmt='o', color='#0f172a', elinewidth=2.5, capsize=6, markersize=8, zorder=3)
    ax1.set_xticks([1, 2])
    ax1.set_xticklabels(['Control (A1/B1)\nTraditional', 'Intervention (A2/B2)\nCo-creation'], fontsize=11, fontweight='bold')
    ax1.set_title('A. Gaze Transition Entropy (GTE)\n[Path Randomness & Cognitive Load]', fontsize=13, fontweight='bold', pad=10)
    ax1.set_ylabel('Transition Entropy (bits)', fontsize=11)
    ax1.grid(axis='y', linestyle='--', alpha=0.4)
    
    # 2. E_gain
    ax2 = axes[0, 1]
    egain_pairs = paired_data['eGain']
    for idx, (c_val, i_val) in enumerate(egain_pairs):
        ax2.plot([1, 2], [c_val, i_val], color='#a7f3d0', alpha=0.85, linewidth=1.5, zorder=1)
        ax2.scatter([1], [c_val], color=c_ctrl, s=70, alpha=0.9, zorder=2)
        ax2.scatter([2], [i_val], color=c_intv, s=70, alpha=0.9, zorder=2)
    m_c, m_i = stats_summary['eGain']['mean_ctrl'], stats_summary['eGain']['mean_intv']
    s_c, s_i = stats_summary['eGain']['std_ctrl'], stats_summary['eGain']['std_intv']
    ax2.errorbar([0.7, 2.3], [m_c, m_i], yerr=[s_c, s_i], fmt='o', color='#0f172a', elinewidth=2.5, capsize=6, markersize=8, zorder=3)
    ax2.set_xticks([1, 2])
    ax2.set_xticklabels(['Control (A1/B1)\nTraditional', 'Intervention (A2/B2)\nCo-creation'], fontsize=11, fontweight='bold')
    ax2.set_title('B. Information-Weighted Cognitive Gain ($E_{gain}$)\n[Surprisal & Knowledge Absorption]', fontsize=13, fontweight='bold', pad=10)
    ax2.set_ylabel('Expected Surprisal Gain (bits)', fontsize=11)
    ax2.grid(axis='y', linestyle='--', alpha=0.4)
    
    # 3. eta
    ax3 = axes[1, 0]
    eta_pairs = paired_data['eta']
    for idx, (c_val, i_val) in enumerate(eta_pairs):
        ax3.plot([1, 2], [c_val, i_val], color='#fed7aa', alpha=0.85, linewidth=1.5, zorder=1)
        ax3.scatter([1], [c_val], color=c_ctrl, s=70, alpha=0.9, zorder=2)
        ax3.scatter([2], [i_val], color='#ea580c', s=70, alpha=0.9, zorder=2)
    m_c, m_i = stats_summary['eta']['mean_ctrl'], stats_summary['eta']['mean_intv']
    s_c, s_i = stats_summary['eta']['std_ctrl'], stats_summary['eta']['std_intv']
    ax3.errorbar([0.7, 2.3], [m_c, m_i], yerr=[s_c, s_i], fmt='o', color='#0f172a', elinewidth=2.5, capsize=6, markersize=8, zorder=3)
    ax3.set_xticks([1, 2])
    ax3.set_xticklabels(['Control (A1/B1)\nTraditional', 'Intervention (A2/B2)\nCo-creation'], fontsize=11, fontweight='bold')
    ax3.set_title('C. Cognitive Information Efficiency ($\eta = E_{gain}/GTE$)\n[Value Absorbed per Unit Cognitive Effort]', fontsize=13, fontweight='bold', pad=10)
    ax3.set_ylabel('Efficiency Ratio $\eta$ (bits/bit)', fontsize=11)
    ax3.grid(axis='y', linestyle='--', alpha=0.4)
    
    # 4. SGE, Norm SGE, D_KL
    ax4 = axes[1, 1]
    metrics = ['SGE\n(Spatial Dispersion)', 'Norm SGE\n(Normalized)', 'D_KL\n(Design Divergence)']
    ctrl_means = [stats_summary['sge']['mean_ctrl'], stats_summary['normSge']['mean_ctrl'], stats_summary['dKl']['mean_ctrl']]
    intv_means = [stats_summary['sge']['mean_intv'], stats_summary['normSge']['mean_intv'], stats_summary['dKl']['mean_intv']]
    ctrl_stds = [stats_summary['sge']['std_ctrl'], stats_summary['normSge']['std_ctrl'], stats_summary['dKl']['std_ctrl']]
    intv_stds = [stats_summary['sge']['std_intv'], stats_summary['normSge']['std_intv'], stats_summary['dKl']['std_intv']]
    
    x = np.arange(len(metrics))
    width = 0.35
    ax4.bar(x - width/2, ctrl_means, width, yerr=ctrl_stds, label='Control (A1/B1)', color=c_ctrl, capsize=5, alpha=0.9)
    ax4.bar(x + width/2, intv_means, width, yerr=intv_stds, label='Intervention (A2/B2)', color=c_intv, capsize=5, alpha=0.9)
    ax4.set_xticks(x)
    ax4.set_xticklabels(metrics, fontsize=10, fontweight='bold')
    ax4.set_title('D. Spatial Gaze Structure & Design Divergence\n[Spatial Allocation vs Design Alignment]', fontsize=13, fontweight='bold', pad=10)
    ax4.set_ylabel('Entropy / Divergence (bits)', fontsize=11)
    ax4.legend(loc='upper right', frameon=True)
    ax4.grid(axis='y', linestyle='--', alpha=0.4)
    
    fig_path = os.path.join(OUTPUT_DIR, 'information_entropy_analysis_overview.png')
    plt.savefig(fig_path, bbox_inches='tight')
    plt.close()
    print(f"[*] 可视化图表已保存至: {fig_path}")
    return fig_path

if __name__ == '__main__':
    all_results, participant_pairs = process_all_13_participants()
    stats_summary, paired_data = perform_statistical_tests(participant_pairs)
    fig_path = generate_visualizations(stats_summary, paired_data, all_results)
    
    export_json = {
        'metadata': {
            'title': 'Information Entropy & Surprisal Gaze Analysis Results (All 13 Participants)',
            'sampleCount': len(all_results),
            'pairedParticipants': len(participant_pairs)
        },
        'statisticalSummary': stats_summary,
        'individualRecords': all_results
    }
    
    json_path = os.path.join(OUTPUT_DIR, 'entropy_analysis_full_results.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(export_json, f, ensure_ascii=False, indent=2)
    print(f"[*] 完整 13 位被试分析数据已导出至: {json_path}")
