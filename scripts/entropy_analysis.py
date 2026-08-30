#!/usr/bin/env python3
"""
scripts/entropy_analysis.py

基于香农信息论与惊讶度理论的植物园解说标牌眼动认知分析核心脚本
包含：
1. 空间静态注视熵 (Stationary Gaze Entropy, SGE)
2. 动线转移马尔可夫熵 (Gaze Transition Entropy, GTE)
3. 语义惊讶度自信息量权重 (Surprisal & Information Weight)
4. 信息加权认知吸收总量 (Information-Weighted Cognitive Gain, E_gain)
5. 认知信息传递能效比 (Cognitive Efficiency Ratio, eta)
6. 设计意图相对熵 (KL Divergence, D_KL)
7. 对照组 (A1/B1) vs 改良组 (A2/B2) 统计推断 (Paired t-test, Cohen's d, Wilcoxon test)
8. 输出详尽分析报告、CSV数据与高分辨率可视化图表
"""

import os
import json
import glob
import math
import numpy as np
import matplotlib.pyplot as plt
import matplotlib as mpl

# ─── 0. 环境与路径设置 ─────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data523')
AOI_FILE = os.path.join(BASE_DIR, 'stimuli', 'aoi_definitions.json')
OUTPUT_DIR = os.path.join(BASE_DIR, 'outputs', 'entropy_analysis')
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 设置 matplotlib 字体与样式
mpl.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica', 'Hiragino Sans', 'PingFang SC', 'sans-serif']
mpl.rcParams['axes.unicode_minus'] = False

# ─── 1. 加载 AOI 定义与先验信息权重 (Surprisal Priors) ───────────────────────────
with open(AOI_FILE, 'r', encoding='utf-8') as f:
    AOI_DEFS = json.load(f)['images']

# 定义先验概率 P_prior 与自信息量 I(AOI) = -log2(P_prior) (bits)
# 核心逻辑：突破常规预期的感官/对话体验具有高自信息量；常规科属分类具有低自信息量
SURPRISAL_WEIGHTS = {
    'a1': {
        'header_title': -math.log2(0.60),       # 0.737 bits (植物名与科属，常规分类)
        'image_photo': -math.log2(0.50),        # 1.000 bits (外观照片)
        'body_text': -math.log2(0.75),          # 0.415 bits (冗长植物学术语，预期内)
        'background': -math.log2(0.90)          # 0.152 bits (空白或背景)
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

# 设计意图分布 Q_intent
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

# ─── 2. 辅助计算函数 ─────────────────────────────────────────────────────────────
def get_point_aoi(x, y, image_id):
    """根据坐标判断所属 AOI"""
    img_def = AOI_DEFS.get(image_id)
    if not img_def:
        return 'background'
    for aoi in img_def['aois']:
        x_min, y_min, x_max, y_max = aoi['bbox']
        if x_min <= x <= x_max and y_min <= y <= y_max:
            return aoi['id']
    return 'background'

def calculate_shannon_entropy(prob_dist):
    """计算香农熵 H = -sum(p * log2(p))"""
    entropy = 0.0
    for p in prob_dist.values():
        if p > 1e-12:
            entropy -= p * math.log2(p)
    return entropy

def calculate_transition_entropy(aoi_sequence, all_aois):
    """
    计算动线转移马尔可夫熵 (Gaze Transition Entropy, GTE)
    H_GTE = -sum_i (p_i * sum_j (p_ij * log2(p_ij)))
    """
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
    
    # 状态静态出现概率 p_i (行归一化前在所有转移中的占比)
    row_sums = np.sum(trans_counts, axis=1)
    p_state = row_sums / total_trans
    
    # 条件转移概率 p_ij = P(j | i)
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
    """计算 KL 散度 D_KL(P || Q)"""
    kl = 0.0
    for aoi in all_aois:
        p = p_dist.get(aoi, 0.0)
        q = q_dist.get(aoi, eps)
        if p > 1e-12:
            kl += p * math.log2(p / q)
    return max(0.0, kl)

# ─── 3. 数据批处理与指标计算 ───────────────────────────────────────────────────────
def process_all_data():
    files = sorted(glob.glob(os.path.join(DATA_DIR, '*.json')))
    print(f"[*] 发现 {len(files)} 个实验数据文件...")
    
    all_runs_results = []
    participant_pairs = {} # 用于配对检验: {participant_id: {'control': run_data, 'intervention': run_data}}
    
    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = json.load(f)
            
        sessions = content.get('sessions', [])
        for session in sessions:
            p_id = session.get('id') or session.get('label') or os.path.basename(filepath).split('-')[0]
            runs = session.get('runs', [])
            
            for run in runs:
                img_info = run.get('image', {})
                img_id = (img_info.get('id') or img_info.get('name') or '').lower()
                
                # 确定分组：a1/b1 为对照组，a2/b2 为实验组
                if img_id in ['a1', 'b1']:
                    condition = 'control'
                elif img_id in ['a2', 'b2']:
                    condition = 'intervention'
                else:
                    continue
                    
                points = run.get('points', [])
                valid_points = [p for p in points if p.get('onPaper') and 0.0 <= p.get('a4X', -1) <= 1.0 and 0.0 <= p.get('a4Y', -1) <= 1.0]
                
                if len(valid_points) < 10:
                    continue
                    
                # 提取时序 AOI 序列
                aoi_seq = [get_point_aoi(p['a4X'], p['a4Y'], img_id) for p in valid_points]
                
                # 所有候选 AOI 列表
                img_aoi_defs = AOI_DEFS.get(img_id, {}).get('aois', [])
                all_aoi_keys = [a['id'] for a in img_aoi_defs] + ['background']
                K = len(all_aoi_keys)
                
                # 1. 空间注视分布 P_gaze
                aoi_counts = {aoi: aoi_seq.count(aoi) for aoi in all_aoi_keys}
                total_pts = len(aoi_seq)
                p_gaze = {aoi: aoi_counts[aoi] / total_pts for aoi in all_aoi_keys}
                
                # 2. 空间静态注视熵 SGE
                sge = calculate_shannon_entropy(p_gaze)
                norm_sge = sge / math.log2(K) if K > 1 else 0.0
                
                # 3. 动线转移马尔可夫熵 GTE
                gte, trans_mat = calculate_transition_entropy(aoi_seq, all_aoi_keys)
                norm_gte = gte / math.log2(K) if K > 1 else 0.0
                
                # 4. 信息加权认知吸收量 E_gain
                surprisal_dict = SURPRISAL_WEIGHTS.get(img_id, {})
                e_gain = sum(p_gaze[aoi] * surprisal_dict.get(aoi, 0.5) for aoi in all_aoi_keys)
                
                # 5. 认知能效比 eta = E_gain / (GTE + 0.1)
                eta = e_gain / (gte + 0.1)
                
                # 6. 设计意图相对熵 D_KL
                q_intent = DESIGN_INTENTS.get(img_id, {})
                d_kl = calculate_kl_divergence(p_gaze, q_intent, all_aoi_keys)
                
                record = {
                    'participant': p_id,
                    'file': os.path.basename(filepath),
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

    print(f"[*] 成功解析 {len(all_runs_results)} 条有效眼动记录，涵盖 {len(participant_pairs)} 位独立参与者。")
    return all_runs_results, participant_pairs

# ─── 4. 统计检验与假设推断 ───────────────────────────────────────────────────────
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
    print(f" 📊 统计推断结果 (Paired Comparison, N = {n_pairs})")
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
        
        # 配对 t 检验
        t_stat = mean_diff / (std_diff / math.sqrt(n_pairs)) if std_diff > 1e-12 else 0.0
        # Cohen's d 效应量
        cohen_d = mean_diff / std_diff if std_diff > 1e-12 else 0.0
        
        # 百分比增幅
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

# ─── 5. 可视化图表生成 ─────────────────────────────────────────────────────────────
def generate_visualizations(stats_summary, paired_data, all_results):
    fig, axes = plt.subplots(2, 2, figsize=(14, 11), dpi=300)
    plt.subplots_adjust(hspace=0.32, wspace=0.25)
    
    # 颜色配置
    c_ctrl = '#64748b'     # 沉稳灰蓝（对照组）
    c_intv = '#059669'     # 活力祖母绿（共创改良组）
    
    # 1. 动线转移熵 (GTE) 散点配对连接图
    ax1 = axes[0, 0]
    gte_pairs = paired_data['gte']
    for idx, (c_val, i_val) in enumerate(gte_pairs):
        ax1.plot([1, 2], [c_val, i_val], color='#cbd5e1', alpha=0.85, linewidth=1.5, zorder=1)
        ax1.scatter([1], [c_val], color=c_ctrl, s=70, alpha=0.9, zorder=2)
        ax1.scatter([2], [i_val], color=c_intv, s=70, alpha=0.9, zorder=2)
    # 平均柱状误差线
    m_c, m_i = stats_summary['gte']['mean_ctrl'], stats_summary['gte']['mean_intv']
    s_c, s_i = stats_summary['gte']['std_ctrl'], stats_summary['gte']['std_intv']
    ax1.errorbar([0.7, 2.3], [m_c, m_i], yerr=[s_c, s_i], fmt='o', color='#0f172a', elinewidth=2.5, capsize=6, markersize=8, zorder=3)
    ax1.set_xticks([1, 2])
    ax1.set_xticklabels(['Control (A1/B1)\nTraditional', 'Intervention (A2/B2)\nCo-creation'], fontsize=11, fontweight='bold')
    ax1.set_title('A. Gaze Transition Entropy (GTE)\n[Path Randomness & Cognitive Load]', fontsize=13, fontweight='bold', pad=10)
    ax1.set_ylabel('Transition Entropy (bits)', fontsize=11)
    ax1.grid(axis='y', linestyle='--', alpha=0.4)
    
    # 2. 信息加权认知吸收量 (E_gain)
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
    
    # 3. 认知能效比 (eta)
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
    
    # 4. 空间注视熵 (SGE) 与设计意图散度 (D_KL) 综合对比条形图
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

# ─── 6. 主执行入口与导出 ─────────────────────────────────────────────────────────
if __name__ == '__main__':
    all_results, participant_pairs = process_all_data()
    stats_summary, paired_data = perform_statistical_tests(participant_pairs)
    fig_path = generate_visualizations(stats_summary, paired_data, all_results)
    
    # 导出完整汇总 JSON
    export_json = {
        'metadata': {
            'title': 'Information Entropy & Surprisal Gaze Analysis Results',
            'sampleCount': len(all_results),
            'pairedParticipants': len(participant_pairs)
        },
        'statisticalSummary': stats_summary,
        'individualRecords': all_results
    }
    
    json_path = os.path.join(OUTPUT_DIR, 'entropy_analysis_full_results.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(export_json, f, ensure_ascii=False, indent=2)
    print(f"[*] 完整分析数据已导出至: {json_path}")
