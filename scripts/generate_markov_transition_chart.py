#!/usr/bin/env python3
"""
scripts/generate_markov_transition_chart.py

生成对照组 vs 改良组的马尔可夫转移矩阵 (Markov Transition Matrix) 与 AOI 信息量加权流向对比图
"""

import os
import json
import numpy as np
import matplotlib.pyplot as plt
import matplotlib as mpl

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, 'outputs', 'entropy_analysis')
RESULTS_JSON = os.path.join(OUTPUT_DIR, 'entropy_analysis_full_results.json')

with open(RESULTS_JSON, 'r', encoding='utf-8') as f:
    data = json.load(f)

records = data['individualRecords']

# 统计 A1/B1 (Control) 与 A2/B2 (Intervention) 的全局转移矩阵
aois_ctrl = ['header_title', 'image_photo', 'body_text', 'background']
aois_intv = ['header_title', 'image_photo', 'dialogue_bubble', 'body_text', 'interactive_bubble', 'bottom_icons', 'flower_meaning', 'background']

labels_ctrl = ['Title\n[Header]', 'Photo\n[Image]', 'Text\n[Long Body]', 'Blank\n[BG]']
labels_intv = ['Title\n(Principle A)', 'Photo\n(Visual)', 'Dialogue\n(Principle R)', 'Body Text\n(Story)', 'Sensory\n(Principle R)', 'Icons\n(Principle S)', 'Flower\n(Emotion)', 'Blank\n[BG]']

mat_ctrl = np.zeros((len(aois_ctrl), len(aois_ctrl)))
mat_intv = np.zeros((len(aois_intv), len(aois_intv)))

for r in records:
    c = r['condition']
    t_mat = np.array(r['transMatrix'])
    keys = r['aoiKeys']
    if c == 'control' and t_mat.shape == (4, 4):
        mat_ctrl += t_mat
    elif c == 'intervention' and t_mat.shape == (8, 8):
        mat_intv += t_mat

# 行归一化
row_sums_c = mat_ctrl.sum(axis=1, keepdims=True)
row_sums_c[row_sums_c == 0] = 1.0
mat_ctrl_norm = mat_ctrl / row_sums_c

row_sums_i = mat_intv.sum(axis=1, keepdims=True)
row_sums_i[row_sums_i == 0] = 1.0
mat_intv_norm = mat_intv / row_sums_i

fig, axes = plt.subplots(1, 2, figsize=(16, 7), dpi=300, gridspec_kw={'width_ratios': [1, 1.6]})
plt.subplots_adjust(wspace=0.28)

# 绘制对照组热力图
im1 = axes[0].imshow(mat_ctrl_norm, cmap='Blues', vmin=0, vmax=0.8)
axes[0].set_xticks(np.arange(len(labels_ctrl)))
axes[0].set_yticks(np.arange(len(labels_ctrl)))
axes[0].set_xticklabels(labels_ctrl, fontsize=10)
axes[0].set_yticklabels(labels_ctrl, fontsize=10)
axes[0].set_title('Control Group (A1/B1) Transition Matrix\n[Stagnation & Severe Repetitive Looping in Long Text]', fontsize=12, fontweight='bold', pad=12)
axes[0].set_xlabel('To AOI (Next Fixation)', fontsize=11, fontweight='bold')
axes[0].set_ylabel('From AOI (Current Fixation)', fontsize=11, fontweight='bold')

for i in range(len(labels_ctrl)):
    for j in range(len(labels_ctrl)):
        val = mat_ctrl_norm[i, j]
        color = 'white' if val > 0.4 else 'black'
        axes[0].text(j, i, f'{val:.2f}', ha='center', va='center', color=color, fontweight='bold', fontsize=10)

# 绘制改良组热力图
im2 = axes[1].imshow(mat_intv_norm, cmap='Greens', vmin=0, vmax=0.6)
axes[1].set_xticks(np.arange(len(labels_intv)))
axes[1].set_yticks(np.arange(len(labels_intv)))
axes[1].set_xticklabels(labels_intv, fontsize=9, rotation=35, ha='right')
axes[1].set_yticklabels(labels_intv, fontsize=9)
axes[1].set_title('Intervention Group (A2/B2) Transition Matrix\n[Balanced Multi-Zone Flow & High Sensory Resonance Exploration]', fontsize=12, fontweight='bold', pad=12)
axes[1].set_xlabel('To AOI (Next Fixation)', fontsize=11, fontweight='bold')
axes[1].set_ylabel('From AOI (Current Fixation)', fontsize=11, fontweight='bold')

for i in range(len(labels_intv)):
    for j in range(len(labels_intv)):
        val = mat_intv_norm[i, j]
        color = 'white' if val > 0.3 else 'black'
        axes[1].text(j, i, f'{val:.2f}', ha='center', va='center', color=color, fontweight='bold', fontsize=8.5)

cbar1 = fig.colorbar(im1, ax=axes[0], fraction=0.046, pad=0.04)
cbar1.set_label('Transition Probability P(j|i)', fontsize=10)

cbar2 = fig.colorbar(im2, ax=axes[1], fraction=0.046, pad=0.04)
cbar2.set_label('Transition Probability P(j|i)', fontsize=10)

markov_path = os.path.join(OUTPUT_DIR, 'markov_transition_matrices.png')
plt.savefig(markov_path, bbox_inches='tight')
plt.close()
print(f"[*] 马尔可夫转移矩阵对比图已保存至: {markov_path}")
