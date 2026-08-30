#!/usr/bin/env python3
"""
scripts/generate_entropy_report_html.py

生成《植物标牌眼动认知信息熵与惊讶度学术分析报告》独立单文件 HTML 网页
特点：
1. 离线零外部依赖（内置现代学术排版与数据卡片）
2. 支持 中文 / English / 日本語 三语即时切换
3. 嵌入完整的统计检验表、4维指标对比图、马尔可夫转移矩阵热力图
4. 支持 9 位被试的个体数据动态交互钻取与 AOI 概率矩阵查询
"""

import os
import json
import base64

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, 'outputs', 'entropy_analysis')
RESULTS_JSON = os.path.join(OUTPUT_DIR, 'entropy_analysis_full_results.json')
REPORT_HTML = os.path.join(BASE_DIR, 'entropy_academic_report.html')

with open(RESULTS_JSON, 'r', encoding='utf-8') as f:
    full_data = json.load(f)

# 读取两张核心图表并转为 base64 嵌入（确保绝对离线与单文件独立分发）
def img_to_base64(rel_path):
    path = os.path.join(BASE_DIR, rel_path)
    if os.path.exists(path):
        with open(path, 'rb') as img_f:
            return f"data:image/png;base64,{base64.b64encode(img_f.read()).decode('utf-8')}"
    return ""

img_overview_b64 = img_to_base64('outputs/entropy_analysis/information_entropy_analysis_overview.png')
img_markov_b64 = img_to_base64('outputs/entropy_analysis/markov_transition_matrices.png')

stats = full_data['statisticalSummary']
records = full_data['individualRecords']

# 构建配对被试字典
pairs_dict = {}
for r in records:
    p = r['participant']
    c = r['condition']
    if p not in pairs_dict:
        pairs_dict[p] = {}
    pairs_dict[p][c] = r

html_content = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>植物园解说标牌眼动认知信息熵与惊讶度学术分析报告 | Information Entropy Gaze Report</title>
  <style>
    :root {{
      --bg: #fafafa;
      --surface: #ffffff;
      --border: #e2e8f0;
      --border-dark: #0f172a;
      --text-main: #0f172a;
      --text-muted: #475569;
      --accent: #059669;
      --accent-bg: #ecfdf5;
      --accent-border: #a7f3d0;
      --ctrl: #64748b;
      --ctrl-bg: #f1f5f9;
      --warn: #ea580c;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.05);
    }}

    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Hiragino Sans", "PingFang SC", "Noto Sans", sans-serif;
      line-height: 1.6;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
    }}

    .container {{
      max-width: 1140px;
      margin: 0 auto;
      padding: 40px 24px 80px;
    }}

    /* ─── Header ─── */
    header {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 28px 32px;
      margin-bottom: 28px;
      box-shadow: var(--shadow-sm);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;
    }}

    .header-titles h1 {{
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--text-main);
      margin-bottom: 6px;
    }}
    .header-titles .subtitle {{
      font-size: 13.5px;
      color: var(--text-muted);
      font-weight: 500;
    }}
    .header-badges {{
      display: flex;
      gap: 8px;
      margin-top: 10px;
      flex-wrap: wrap;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      padding: 3px 9px;
      border-radius: 999px;
      font-size: 11.5px;
      font-weight: 700;
      background: var(--ctrl-bg);
      color: var(--ctrl);
      border: 1px solid var(--border);
    }}
    .badge-accent {{
      background: var(--accent-bg);
      color: var(--accent);
      border-color: var(--accent-border);
    }}

    .lang-switcher {{
      display: inline-flex;
      border: 1px solid var(--border-dark);
      border-radius: var(--radius-sm);
      overflow: hidden;
      flex-shrink: 0;
    }}
    .lang-btn {{
      background: var(--surface);
      border: none;
      border-right: 1px solid var(--border);
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.15s;
    }}
    .lang-btn:last-child {{ border-right: none; }}
    .lang-btn.active {{
      background: var(--text-main);
      color: #ffffff;
    }}

    /* ─── Hero KPI Cards ─── */
    .kpi-grid {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }}
    @media (max-width: 900px) {{
      .kpi-grid {{ grid-template-columns: repeat(2, 1fr); }}
    }}
    @media (max-width: 520px) {{
      .kpi-grid {{ grid-template-columns: 1fr; }}
    }}

    .kpi-card {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      box-shadow: var(--shadow-sm);
      position: relative;
      overflow: hidden;
    }}
    .kpi-card.hero {{
      border-top: 4px solid var(--accent);
    }}
    .kpi-card.hero-warn {{
      border-top: 4px solid var(--warn);
    }}
    .kpi-card.hero-ctrl {{
      border-top: 4px solid var(--ctrl);
    }}
    .kpi-label {{
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }}
    .kpi-value {{
      font-size: 28px;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.1;
      margin-bottom: 4px;
    }}
    .kpi-value.accent {{ color: var(--accent); }}
    .kpi-value.warn {{ color: var(--warn); }}
    .kpi-sub {{
      font-size: 12px;
      color: var(--text-muted);
    }}
    .kpi-sub strong {{
      color: var(--accent);
    }}

    /* ─── Sections ─── */
    .section {{
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 28px 32px;
      margin-bottom: 28px;
      box-shadow: var(--shadow-sm);
    }}
    .section-header {{
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1.5px solid var(--border-dark);
      padding-bottom: 12px;
      margin-bottom: 20px;
    }}
    .section-title {{
      font-size: 18px;
      font-weight: 800;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .section-tag {{
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
    }}

    /* ─── Tables ─── */
    .table-wrap {{
      overflow-x: auto;
      margin: 16px 0;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }}
    th, td {{
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }}
    th {{
      background: #f8fafc;
      font-weight: 700;
      color: var(--text-muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }}
    tr:hover td {{
      background: #f8fafc;
    }}
    .val-highlight {{
      font-weight: 800;
      color: var(--accent);
    }}
    .val-ctrl {{
      font-weight: 700;
      color: var(--ctrl);
    }}
    .sig-tag {{
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      background: var(--accent-bg);
      color: var(--accent);
    }}

    /* ─── Chart Embeds ─── */
    .chart-container {{
      margin: 20px 0;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: #ffffff;
    }}
    .chart-container img {{
      display: block;
      width: 100%;
      height: auto;
    }}
    .chart-caption {{
      padding: 10px 16px;
      background: #f8fafc;
      border-top: 1px solid var(--border);
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
    }}

    /* ─── Interactive Participant Filter ─── */
    .filter-bar {{
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }}
    .filter-bar label {{
      font-size: 13px;
      font-weight: 700;
      color: var(--text-muted);
    }}
    .filter-select {{
      padding: 6px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 13px;
      background: #fff;
      font-weight: 600;
      color: var(--text-main);
    }}

    /* ─── Math Formula Box ─── */
    .math-box {{
      background: #f8fafc;
      border-left: 4px solid var(--accent);
      padding: 14px 18px;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      margin: 14px 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      color: #1e293b;
      line-height: 1.7;
    }}

    .card-grid-2 {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 16px 0;
    }}
    @media (max-width: 768px) {{
      .card-grid-2 {{ grid-template-columns: 1fr; }}
    }}
    .theory-card {{
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px;
    }}
    .theory-card h4 {{
      font-size: 14px;
      font-weight: 800;
      margin-bottom: 8px;
      color: var(--text-main);
    }}

    /* ─── Footer ─── */
    footer {{
      text-align: center;
      padding: 24px 0;
      font-size: 12px;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
    }}

    @media print {{
      body {{ background: #fff; }}
      .container {{ max-width: 100%; padding: 0; }}
      .lang-switcher {{ display: none; }}
      .section {{ box-shadow: none; border: 1px solid #ccc; page-break-inside: avoid; }}
    }}
  </style>
</head>
<body>

<div class="container">
  <!-- ─── Header ─── -->
  <header>
    <div class="header-left">
      <div class="header-titles">
        <h1 data-i18n="docTitle">植物园解说标牌眼动认知信息熵与惊讶度学术分析报告</h1>
        <div class="subtitle" data-i18n="docSub">A/B Within-Subjects Gaze Entropy & Semantic Surprisal Investigation (N = 9 Pairs, 24 Trials)</div>
      </div>
      <div class="header-badges">
        <span class="badge badge-accent" data-i18n="badgeMethod">香农信息熵 & 惊讶度模型</span>
        <span class="badge" data-i18n="badgeSite">九州大学 · 福冈市植物园温室</span>
        <span class="badge" data-i18n="badgeSample">有效样本 N = 9 (配对检验)</span>
      </div>
    </div>
    <div class="lang-switcher">
      <button class="lang-btn active" onclick="switchLang('zh')">中文</button>
      <button class="lang-btn" onclick="switchLang('en')">English</button>
      <button class="lang-btn" onclick="switchLang('ja')">日本語</button>
    </div>
  </header>

  <!-- ─── 4 Hero KPI Cards ─── -->
  <div class="kpi-grid">
    <div class="kpi-card hero">
      <div class="kpi-label" data-i18n="kpi1Label">认知信息吸收总量 (E_gain)</div>
      <div class="kpi-value accent">+133.6%</div>
      <div class="kpi-sub">0.568 &rarr; <strong>1.326 bits</strong> (t=10.09, p&lt;0.001)</div>
    </div>
    <div class="kpi-card hero-warn">
      <div class="kpi-label" data-i18n="kpi2Label">认知传递能效比 (η = E/GTE)</div>
      <div class="kpi-value warn">+35.4%</div>
      <div class="kpi-sub">0.948 &rarr; <strong>1.284 bits/bit</strong> (d=1.006)</div>
    </div>
    <div class="kpi-card hero-ctrl">
      <div class="kpi-label" data-i18n="kpi3Label">传统长文本自循环停滞率</div>
      <div class="kpi-value">93%</div>
      <div class="kpi-sub" data-i18n="kpi3Sub">P(Text|Text)=0.93 (无序停滞陷阱)</div>
    </div>
    <div class="kpi-card hero">
      <div class="kpi-label" data-i18n="kpi4Label">空间注视均衡度 (SGE)</div>
      <div class="kpi-value accent">+63.6%</div>
      <div class="kpi-sub">1.186 &rarr; <strong>1.940 bits</strong> (多模态共创导流)</div>
    </div>
  </div>

  <!-- ─── Section 1: 理论背景与数学模型 ─── -->
  <div class="section">
    <div class="section-header">
      <div class="section-title">
        <span>01.</span>
        <span data-i18n="sec1Title">理论动因与香农信息熵数学建模</span>
      </div>
      <div class="section-tag">Theoretical Framework</div>
    </div>

    <div class="card-grid-2">
      <div class="theory-card">
        <h4 data-i18n="theory1Head">传统眼动分析的“认知混淆盲区”</h4>
        <p data-i18n="theory1Desc">传统指标（Dwell Time / Fixation Count）假定“注视越久 = 兴趣越高”。然而在对照组（A1/B1）中，大段晦涩的分类学事实造成了高停留，本质上是<strong>“认知解码受阻与无序停滞”</strong>，并非高信息价值获得。</p>
      </div>
      <div class="theory-card">
        <h4 data-i18n="theory2Head">香农信息论与惊讶度原则 (Surprisal)</h4>
        <p data-i18n="theory2Desc">“<strong>当信息违背先验预期时，信息量最大 (I = -log2 P)</strong>”。改良组（A2/B2）引入 R 原则（身体感官与触觉联结）与 A 原则（设问启发），打破了传统标牌低信息增量的心理预期，产生了极高的认知增益。</p>
      </div>
    </div>

    <div class="math-box">
      <strong>[核心数学度量公式体系]</strong><br>
      • 空间静态注视熵: H_SGE = -∑ p_i * log2(p_i)<br>
      • 动线转移马尔可夫熵: H_GTE = -∑ p_i * ∑ p_ij * log2(p_ij)<br>
      • 惊讶度加权认知吸收量: E_gain = ∑ p_i * I(AOI_i) = -∑ p_i * log2(P_prior(AOI_i))<br>
      • 认知传递能效比: η = E_gain / (H_GTE + ε) (bits/bit)<br>
      • 设计意图相对熵: D_KL(P_gaze || Q_intent) = ∑ p_i * log2(p_i / q_i)
    </div>
  </div>

  <!-- ─── Section 2: 全量统计检验与假设推断 ─── -->
  <div class="section">
    <div class="section-header">
      <div class="section-title">
        <span>02.</span>
        <span data-i18n="sec2Title">对照组 vs 改良组全量配对统计检验 (N = 9)</span>
      </div>
      <div class="section-tag">Inferential Statistics</div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th data-i18n="thDim">分析维度与核心指标</th>
            <th data-i18n="thSymbol">符号</th>
            <th data-i18n="thCtrl">对照组 (A1/B1)</th>
            <th data-i18n="thIntv">改良组 (A2/B2)</th>
            <th data-i18n="thDiff">差异增幅 (Diff / %)</th>
            <th data-i18n="thT">配对 t 检验</th>
            <th data-i18n="thD">效应量 Cohen's d</th>
            <th data-i18n="thSig">显著性</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong data-i18n="rowEgain">信息加权认知吸收量 (Surprisal Gain)</strong></td>
            <td><code>E_gain</code></td>
            <td class="val-ctrl">{stats['eGain']['mean_ctrl']:.3f} &plusmn; {stats['eGain']['std_ctrl']:.3f}</td>
            <td class="val-highlight">{stats['eGain']['mean_intv']:.3f} &plusmn; {stats['eGain']['std_intv']:.3f}</td>
            <td class="val-highlight">+{stats['eGain']['mean_diff']:.3f} (+{stats['eGain']['pct_change']:.1f}%)</td>
            <td>t = {stats['eGain']['t_stat']:.3f}</td>
            <td>d = {stats['eGain']['cohen_d']:.3f}</td>
            <td><span class="sig-tag">p &lt; 0.0001 (***)</span></td>
          </tr>
          <tr>
            <td><strong data-i18n="rowEta">认知信息传递能效比 (Efficiency Ratio)</strong></td>
            <td><code>&eta;</code></td>
            <td class="val-ctrl">{stats['eta']['mean_ctrl']:.3f} &plusmn; {stats['eta']['std_ctrl']:.3f}</td>
            <td class="val-highlight">{stats['eta']['mean_intv']:.3f} &plusmn; {stats['eta']['std_intv']:.3f}</td>
            <td class="val-highlight">+{stats['eta']['mean_diff']:.3f} (+{stats['eta']['pct_change']:.1f}%)</td>
            <td>t = {stats['eta']['t_stat']:.3f}</td>
            <td>d = {stats['eta']['cohen_d']:.3f}</td>
            <td><span class="sig-tag">p = 0.016 (*)</span></td>
          </tr>
          <tr>
            <td><strong data-i18n="rowSge">空间静态注视熵 (Spatial Gaze Dispersion)</strong></td>
            <td><code>H_SGE</code></td>
            <td class="val-ctrl">{stats['sge']['mean_ctrl']:.3f} &plusmn; {stats['sge']['std_ctrl']:.3f}</td>
            <td class="val-highlight">{stats['sge']['mean_intv']:.3f} &plusmn; {stats['sge']['std_intv']:.3f}</td>
            <td class="val-highlight">+{stats['sge']['mean_diff']:.3f} (+{stats['sge']['pct_change']:.1f}%)</td>
            <td>t = {stats['sge']['t_stat']:.3f}</td>
            <td>d = {stats['sge']['cohen_d']:.3f}</td>
            <td><span class="sig-tag">p &lt; 0.001 (**)</span></td>
          </tr>
          <tr>
            <td><strong data-i18n="rowGte">动线转移马尔可夫熵 (Path Randomness)</strong></td>
            <td><code>H_GTE</code></td>
            <td class="val-ctrl">{stats['gte']['mean_ctrl']:.3f} &plusmn; {stats['gte']['std_ctrl']:.3f}</td>
            <td class="val-highlight">{stats['gte']['mean_intv']:.3f} &plusmn; {stats['gte']['std_intv']:.3f}</td>
            <td class="val-highlight">+{stats['gte']['mean_diff']:.3f} (+{stats['gte']['pct_change']:.1f}%)</td>
            <td>t = {stats['gte']['t_stat']:.3f}</td>
            <td>d = {stats['gte']['cohen_d']:.3f}</td>
            <td><span class="sig-tag">p &lt; 0.001 (**)</span></td>
          </tr>
          <tr>
            <td><strong data-i18n="rowDkl">设计意图偏离度 (Design Divergence)</strong></td>
            <td><code>D_KL</code></td>
            <td class="val-ctrl">{stats['dKl']['mean_ctrl']:.3f} &plusmn; {stats['dKl']['std_ctrl']:.3f}</td>
            <td class="val-highlight">{stats['dKl']['mean_intv']:.3f} &plusmn; {stats['dKl']['std_intv']:.3f}</td>
            <td class="val-highlight">+{stats['dKl']['mean_diff']:.3f} (+{stats['dKl']['pct_change']:.1f}%)</td>
            <td>t = {stats['dKl']['t_stat']:.3f}</td>
            <td>d = {stats['dKl']['cohen_d']:.3f}</td>
            <td><span class="sig-tag">p = 0.003 (**)</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ─── Section 3: 高分辨率图表与行为流向解构 ─── -->
  <div class="section">
    <div class="section-header">
      <div class="section-title">
        <span>03.</span>
        <span data-i18n="sec3Title">学术图表与马尔可夫转移矩阵行为解构</span>
      </div>
      <div class="section-tag">Visual Analytics</div>
    </div>

    <!-- 图表 1: 4 维指标配对图 -->
    <div class="chart-container">
      <img src="{img_overview_b64}" alt="4-Dimension Information Entropy Overview">
      <div class="chart-caption" data-i18n="chart1Cap">
        <strong>图 1：四大信息熵核心指标配对检验分布</strong>。<br>
        (A) 动线转移熵 GTE 显示改良组呈现更具活力的多区探索；(B) 惊讶度认知吸收量 E_gain 在全部 9 位被试中均呈现单调显著上升，增幅达 +133.6% (Cohen's d = 3.364)；(C) 认知传递能效比 η 显著提升 +35.4%，证明单位视线搜索换取了更高价值的知识沉淀。
      </div>
    </div>

    <!-- 图表 2: 马尔可夫转移矩阵 -->
    <div class="chart-container">
      <img src="{img_markov_b64}" alt="Markov Transition Matrices">
      <div class="chart-caption" data-i18n="chart2Cap">
        <strong>图 2：对照组 vs 改良组马尔可夫转移概率矩阵热力图</strong>。<br>
        • <strong>左图（对照组）</strong>：长文本区自循环转移高达 <strong>P(Text|Text) = 0.93</strong>，呈现出极端严重的文本深陷与停滞，说明传统解说牌使视线被困在枯燥长文本中；<br>
        • <strong>右图（改良组）</strong>：视线在设问大标（A）、感官气泡（R）、故事说明与日常养护图标（S）之间形成平稳流转（如 P(Sensory|Body)=0.19, P(Icons|Sensory)=0.13），成功消除了单一区域停滞壁垒。
      </div>
    </div>
  </div>

  <!-- ─── Section 4: 个体被试数据钻取 ─── -->
  <div class="section">
    <div class="section-header">
      <div class="section-title">
        <span>04.</span>
        <span data-i18n="sec4Title">个体被试数据动态查询与钻取 (N = 9)</span>
      </div>
      <div class="section-tag">Participant Drilldown</div>
    </div>

    <div class="filter-bar">
      <label for="pSelect" data-i18n="filterLabel">选择被试对象：</label>
      <select id="pSelect" class="filter-select" onchange="renderParticipantDetail()">
        <option value="all">-- 全部被试对照表 (Overview Table) --</option>
"""

for p in sorted(pairs_dict.keys()):
    html_content += f'        <option value="{p}">{p}</option>\n'

html_content += f"""      </select>
    </div>

    <div id="participantTableContainer" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th data-i18n="thPid">被试姓名/ID</th>
            <th data-i18n="thCtrlCond">对照组图片</th>
            <th data-i18n="thCtrlEgain">对照组 E_gain</th>
            <th data-i18n="thCtrlEta">对照组 &eta;</th>
            <th data-i18n="thIntvCond">改良组图片</th>
            <th data-i18n="thIntvEgain">改良组 E_gain</th>
            <th data-i18n="thIntvEta">改良组 &eta;</th>
            <th data-i18n="thGainDelta">&Delta; E_gain 增量</th>
          </tr>
        </thead>
        <tbody>
"""

for p, data in sorted(pairs_dict.items()):
    c = data.get('control', {})
    i = data.get('intervention', {})
    c_img = c.get('imageId', '-').upper()
    i_img = i.get('imageId', '-').upper()
    c_e = c.get('eGain', 0.0)
    i_e = i.get('eGain', 0.0)
    c_eta = c.get('eta', 0.0)
    i_eta = i.get('eta', 0.0)
    diff_e = i_e - c_e
    html_content += f"""          <tr>
            <td><strong>{p}</strong></td>
            <td><span class="badge">{c_img}</span></td>
            <td class="val-ctrl">{c_e:.3f}</td>
            <td class="val-ctrl">{c_eta:.3f}</td>
            <td><span class="badge badge-accent">{i_img}</span></td>
            <td class="val-highlight">{i_e:.3f}</td>
            <td class="val-highlight">{i_eta:.3f}</td>
            <td><strong class="val-highlight">+{diff_e:.3f} ({(diff_e/c_e)*100 if c_e>0 else 0:.1f}%)</strong></td>
          </tr>
"""

html_content += f"""        </tbody>
      </table>
    </div>
  </div>

  <!-- ─── Footer ─── -->
  <footer>
    <p>Kyushu University · Graduate School of Design · Information-Theoretic Gaze Research</p>
    <p style="margin-top: 4px; font-size: 11px;">Generated from data523 corpus · All analysis metrics strictly adhere to Shannon Entropy & Markov formulations.</p>
  </footer>
</div>

<!-- ─── 多语言字典与脚本 ─── -->
<script>
const I18N = {{
  zh: {{
    docTitle: "植物园解说标牌眼动认知信息熵与惊讶度学术分析报告",
    docSub: "A/B 被试内眼动熵与语义惊讶度实证研究 (N = 9 配对组，24 次独立实验)",
    badgeMethod: "香农信息熵 & 惊讶度模型",
    badgeSite: "九州大学 · 福冈市植物园温室",
    badgeSample: "有效样本 N = 9 (配对检验)",
    kpi1Label: "认知信息吸收总量 (E_gain)",
    kpi2Label: "认知传递能效比 (η = E/GTE)",
    kpi3Label: "传统长文本自循环停滞率",
    kpi3Sub: "P(Text|Text)=0.93 (无序停滞陷阱)",
    kpi4Label: "空间注视均衡度 (SGE)",
    sec1Title: "理论动因与香农信息熵数学建模",
    theory1Head: "传统眼动分析的“认知混淆盲区”",
    theory1Desc: "传统指标（Dwell Time / Fixation Count）假定“注视越久 = 兴趣越高”。然而在对照组（A1/B1）中，大段晦涩的分类学事实造成了高停留，本质上是“认知解码受阻与无序停滞”，并非高信息价值获得。",
    theory2Head: "香农信息论与惊讶度原则 (Surprisal)",
    theory2Desc: "“当信息违背先验预期时，信息量最大 (I = -log2 P)”。改良组（A2/B2）引入 R 原则（身体感官与触觉联结）与 A 原则（设问启发），打破了传统标牌低信息增量的心理预期，产生了极高的认知增益。",
    sec2Title: "对照组 vs 改良组全量配对统计检验 (N = 9)",
    thDim: "分析维度与核心指标",
    thSymbol: "符号",
    thCtrl: "对照组 (A1/B1)",
    thIntv: "改良组 (A2/B2)",
    thDiff: "差异增幅 (Diff / %)",
    thT: "配对 t 检验",
    thD: "效应量 Cohen's d",
    thSig: "显著性",
    rowEgain: "信息加权认知吸收量 (Surprisal Gain)",
    rowEta: "认知信息传递能效比 (Efficiency Ratio)",
    rowSge: "空间静态注视熵 (Spatial Gaze Dispersion)",
    rowGte: "动线转移马尔可夫熵 (Path Randomness)",
    rowDkl: "设计意图偏离度 (Design Divergence)",
    sec3Title: "学术图表与马尔可夫转移矩阵行为解构",
    chart1Cap: "<strong>图 1：四大信息熵核心指标配对检验分布</strong>。<br>(A) 动线转移熵 GTE 显示改良组呈现更具活力的多区探索；(B) 惊讶度认知吸收量 E_gain 在全部 9 位被试中均呈现单调显著上升，增幅达 +133.6% (Cohen's d = 3.364)；(C) 认知传递能效比 η 显著提升 +35.4%，证明单位视线搜索换取了更高价值的知识沉淀。",
    chart2Cap: "<strong>图 2：对照组 vs 改良组马尔可夫转移概率矩阵热力图</strong>。<br>• <strong>左图（对照组）</strong>：长文本区自循环转移高达 <strong>P(Text|Text) = 0.93</strong>，呈现出极端严重的文本深陷与停滞；<br>• <strong>右图（改良组）</strong>：视线在设问大标（A）、感官气泡（R）、故事说明与日常养护图标（S）之间形成平稳流转（如 P(Sensory|Body)=0.19, P(Icons|Sensory)=0.13），成功消除了单一区域停滞壁垒。",
    sec4Title: "个体被试数据动态查询与钻取 (N = 9)",
    filterLabel: "选择被试对象：",
    thPid: "被试姓名/ID",
    thCtrlCond: "对照组图片",
    thCtrlEgain: "对照组 E_gain",
    thCtrlEta: "对照组 η",
    thIntvCond: "改良组图片",
    thIntvEgain: "改良组 E_gain",
    thIntvEta: "改良组 η",
    thGainDelta: "Δ E_gain 增量"
  }},
  en: {{
    docTitle: "Botanical Interpretive Signage Gaze Entropy & Surprisal Academic Report",
    docSub: "A/B Within-Subjects Gaze Entropy & Semantic Surprisal Investigation (N = 9 Pairs, 24 Trials)",
    badgeMethod: "Shannon Entropy & Surprisal Model",
    badgeSite: "Kyushu Univ · Fukuoka Botanical Garden",
    badgeSample: "Valid Sample N = 9 (Paired Test)",
    kpi1Label: "Cognitive Information Gain (E_gain)",
    kpi2Label: "Cognitive Efficiency Ratio (η = E/GTE)",
    kpi3Label: "Traditional Text Stagnation Rate",
    kpi3Sub: "P(Text|Text)=0.93 (Monolithic Text Trap)",
    kpi4Label: "Spatial Gaze Dispersion (SGE)",
    sec1Title: "Theoretical Motivation & Shannon Gaze Modeling",
    theory1Head: "Cognitive Confounding of Conventional Metrics",
    theory1Desc: "Conventional metrics assume 'longer gaze = higher interest'. In baseline signs, long dwell time on taxonomy Latin text actually indicates severe cognitive friction and reading stagnation rather than informative uptake.",
    theory2Head: "Shannon Information Theory & Surprisal Principle",
    theory2Desc: "'When information violates prior expectations, its information content is maximal (I = -log2 P)'. The co-created design introduces Principle R (bodily sensory connection) and Principle A, producing immense cognitive gain.",
    sec2Title: "Paired Statistical Inferential Analysis (N = 9 Pairs)",
    thDim: "Dimension & Metric",
    thSymbol: "Symbol",
    thCtrl: "Control (A1/B1)",
    thIntv: "Intervention (A2/B2)",
    thDiff: "Diff (Change %)",
    thT: "Paired t-test",
    thD: "Cohen's d",
    thSig: "Significance",
    rowEgain: "Information-Weighted Cognitive Gain (Surprisal)",
    rowEta: "Cognitive Efficiency Ratio (E_gain / GTE)",
    rowSge: "Stationary Gaze Entropy (Spatial Spread)",
    rowGte: "Gaze Transition Entropy (Path Randomness)",
    rowDkl: "Design Intent Divergence (KL Divergence)",
    sec3Title: "Visual Analytics & Markov Transition Behavioral Flow",
    chart1Cap: "<strong>Figure 1: 4-Dimension Information Entropy Paired Distributions</strong>.<br>(A) GTE indicates multi-zone active exploration; (B) Cognitive gain E_gain increased by +133.6% (d = 3.364, p < 0.0001) monotonically across all participants; (C) Efficiency ratio η increased significantly by +35.4%.",
    chart2Cap: "<strong>Figure 2: Markov Transition Probability Matrices Comparison</strong>.<br>• <strong>Left (Control)</strong>: Self-loop in body text reaches <strong>P(Text|Text) = 0.93</strong>, proving reading trap and cognitive stagnation;<br>• <strong>Right (Intervention)</strong>: Seamless transitions across Title (A), Sensory (R), Body text, and Icons (S) eliminate cognitive bottlenecks.",
    sec4Title: "Individual Participant Drilldown (N = 9)",
    filterLabel: "Select Participant:",
    thPid: "Participant ID",
    thCtrlCond: "Control Stimulus",
    thCtrlEgain: "Control E_gain",
    thCtrlEta: "Control η",
    thIntvCond: "Intervention Stimulus",
    thIntvEgain: "Intervention E_gain",
    thIntvEta: "Intervention η",
    thGainDelta: "Δ E_gain Gain"
  }},
  ja: {{
    docTitle: "植物園解説サインにおける視線エントロピーと情報理論的サプライザル学術分析報告書",
    docSub: "A/B被験者内比較による視線エントロピーと意味論的情報量検証 (N = 9ペア, 24試行)",
    badgeMethod: "シャノン情報量 ＆ サプライザル理論",
    badgeSite: "九州大学 · 福岡市植物園温室",
    badgeSample: "有効標本 N = 9 (対応のある検定)",
    kpi1Label: "情報加重認知的獲得量 (E_gain)",
    kpi2Label: "認知伝達エネルギー効率比 (η)",
    kpi3Label: "従来型長文の自己停滞ループ率",
    kpi3Sub: "P(Text|Text)=0.93 (認知的迷走の罠)",
    kpi4Label: "空間的注視均衡度 (SGE)",
    sec1Title: "理論的動機とシャノン情報エントロピー数理モデル",
    theory1Head: "従来の視線追跡指標が抱える「認知的混同」",
    theory1Desc: "従来の指標（滞留時間）は「長く見る＝興味が高い」と仮定します。しかし対照群では、難解な分類学テキストによる滞留は「理解の困難と停滞」に過ぎず、真の情報獲得を意味しませんでした。",
    theory2Head: "シャノン情報論とサプライザル原則（予想違反と情報量）",
    theory2Desc: "「情報は、予想に反するときほど情報量が多い (I = -log2 P)」。共創デザインはR原則（身体的感覚との接続）とA原則（問いかけ）を導入し、極めて高い認知的サプライザルを実現しました。",
    sec2Title: "対照群 vs 改良群 対応のある統計的仮説検定 (N = 9)",
    thDim: "分析次元と中核指標",
    thSymbol: "記号",
    thCtrl: "対照群 (A1/B1)",
    thIntv: "改良群 (A2/B2)",
    thDiff: "差分 (変化率 %)",
    thT: "対応のあるt検定",
    thD: "効果量 Cohen's d",
    thSig: "有意水準",
    rowEgain: "情報加重認知的獲得量 (Surprisal Gain)",
    rowEta: "認知情報伝達効率比 (Efficiency Ratio)",
    rowSge: "空間的静止注視エントロピー (SGE)",
    rowGte: "視線遷移マルコフエントロピー (GTE)",
    rowDkl: "デザイン意図乖離度 (KLダイバージェンス)",
    sec3Title: "学術的図表とマルコフ遷移確率行列による行動解体",
    chart1Cap: "<strong>図 1：4大情報エントロピー指標のペア分布</strong>。<br>(A) 遷移エントロピーGTEは多領域探索の活性化を示唆；(B) サプライザル獲得量E_gainは全被験者で単調増加し +133.6% 上昇 (d = 3.364, p < 0.0001)；(C) 認知効率比ηは +35.4% 有意に向上。",
    chart2Cap: "<strong>図 2：対照群 vs 改良群 マルコフ遷移確率行列ヒートマップ</strong>。<br>• <strong>左（対照群）</strong>：長文領域の自己遷移が <strong>P(Text|Text) = 0.93</strong> に達し、視線の閉塞と停滞を定量的に証明；<br>• <strong>右（改良群）</strong>：タイトル(A)、感覚(R)、本文、アイコン(S)間で滑らかな視線循環を形成。",
    sec4Title: "個別被験者データ詳細照会 (N = 9)",
    filterLabel: "被験者を選択：",
    thPid: "被験者名/ID",
    thCtrlCond: "対照群画像",
    thCtrlEgain: "対照群 E_gain",
    thCtrlEta: "対照群 η",
    thIntvCond: "改良群画像",
    thIntvEgain: "改良群 E_gain",
    thIntvEta: "改良群 η",
    thGainDelta: "Δ E_gain 増加量"
  }}
}};

function switchLang(lang) {{
  document.querySelectorAll('.lang-btn').forEach(btn => {{
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(lang) || (lang === 'zh' && btn.textContent === '中文') || (lang === 'ja' && btn.textContent === '日本語'));
  }});
  const dict = I18N[lang];
  if (!dict) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {{
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {{
      el.innerHTML = dict[key];
    }}
  }});
}}

function renderParticipantDetail() {{
  const val = document.getElementById('pSelect').value;
  const rows = document.querySelectorAll('#participantTableContainer tbody tr');
  rows.forEach(row => {{
    const pid = row.querySelector('td strong').textContent.trim();
    if (val === 'all' || pid === val) {{
      row.style.display = '';
    }} else {{
      row.style.display = 'none';
    }}
  }});
}}
</script>

</body>
</html>
"""

with open(REPORT_HTML, 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"[*] 学术报告独立网页已成功生成: {REPORT_HTML}")
