const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '../ppt/index.html');
let content = fs.readFileSync(indexHtmlPath, 'utf8');

const startMarker = '<div id="deck">';
const endMarker = '</div>\n</main>';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find markers in ppt/index.html");
  process.exit(1);
}

const startIndex = startIdx + startMarker.length;

const newSlides = `
<style>
  /* Style overrides to ensure all slide texts are fully visible and readable */
  .slide .stack-block.b-accent .layer-desc {
    color: rgba(255, 255, 255, 0.9) !important;
  }
  /* Slide font scale overrides for presentation visibility */
  .slide h2.h-xl-zh {
    font-size: 52px !important;
    line-height: 1.15 !important;
    margin-bottom: 1.5vh !important;
  }
  .slide .t-body {
    font-size: 26px !important;
    line-height: 1.6 !important;
  }
  .slide .t-body-sm {
    font-size: 22px !important;
    line-height: 1.55 !important;
  }
  .slide .t-h-prod, .slide h3 {
    font-size: 32px !important;
    font-weight: 600 !important;
    line-height: 1.35 !important;
  }
  .slide .t-meta {
    font-size: 16px !important;
    letter-spacing: 0.08em !important;
  }
  .slide .process-detail .detail-list div {
    font-size: 22px !important;
    line-height: 1.5 !important;
  }
  .slide .process-detail .phase {
    font-size: 26px !important;
  }
  /* Results 1 tower chart label scale overrides */
  .slide .bar-tower .sub {
    font-size: 16px !important;
    line-height: 1.4 !important;
  }
  .slide .bar-tower .lbl {
    font-size: 18px !important;
    font-weight: 600 !important;
  }

  /* ============ Cover Page Language Switcher (Inverse Scale) ============ */
  .cover-lang-switch {
    display: flex;
    gap: calc(6px / var(--slide-scale, 1)) !important;
    background: rgba(255, 255, 255, 0.08);
    padding: calc(4px / var(--slide-scale, 1)) !important;
    border-radius: calc(20px / var(--slide-scale, 1)) !important;
    border: calc(1px / var(--slide-scale, 1)) solid rgba(255, 255, 255, 0.12) !important;
    pointer-events: auto;
  }
  .cover-lang-switch .lang-top-btn {
    border: 0;
    background: transparent;
    padding: calc(4px / var(--slide-scale, 1)) calc(10px / var(--slide-scale, 1)) !important;
    border-radius: calc(16px / var(--slide-scale, 1)) !important;
    font-family: var(--sans);
    font-size: calc(12px / var(--slide-scale, 1)) !important;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .cover-lang-switch .lang-top-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
  }
  .cover-lang-switch .lang-top-btn.active {
    background: #ffffff;
    color: var(--accent) !important;
    font-weight: 600;
    box-shadow: 0 calc(2px / var(--slide-scale, 1)) calc(6px / var(--slide-scale, 1)) rgba(0, 0, 0, 0.1);
  }

  /* ============ Mobile Evidence Media Alignment & Responsiveness ============ */
  @media (max-width: 900px) {
    .slide .evidence-media {
      align-items: center !important;
    }
    /* Hide Cover Top-left language switcher on mobile viewports since the new cover switcher is prominent */
    .slide[data-layout="SWISS-COVER-ASCII"] .chrome-min .l {
      display: none !important;
    }
  }
</style>

<!-- Chapter 1: 研究背景与目的 -->
<section class="slide accent" data-chapter="1" data-chapter-title="研究背景与目的" data-short-title="研究主题" data-layout="SWISS-COVER-ASCII" data-animate="hero">
  <div class="canvas-card">
    <canvas class="ascii-bg" aria-hidden="true"></canvas>
    <div class="chrome-min">
      <div class="l" style="pointer-events: auto; display: flex; align-items: center; gap: 8px;">
        <span class="lang-top-label" style="opacity: 0.6; font-size: 16px;">Language:</span>
        <button class="lang-top-btn" onclick="applyLanguage('zh')">ZH</button>
        <button class="lang-top-btn" onclick="applyLanguage('en')">EN</button>
        <button class="lang-top-btn" onclick="applyLanguage('ja')">JA</button>
        <button class="lang-top-btn" onclick="applyLanguage('es-MX')">ES</button>
      </div>
      <div class="r">MASTER'S REPORT · 2026.06 · 01 / 19</div>
    </div>
    <div style="flex:1;padding:0;display:grid;grid-template-rows:auto 1fr auto;gap:2.6vh">
      <div data-anim="kicker" class="t-meta" style="color:rgba(255,255,255,.78);letter-spacing:.22em">INTERIM RESEARCH REPORT</div>
      <h1 data-anim="title" style="align-self:center;font-family:var(--sans),var(--sans-zh);font-weight:200;font-size:52px;line-height:1.02;letter-spacing:0;color:#fff;max-width:17ch;hyphens:none">关于用于设计解说标识的共创工具的研究<br/><span style="display:block;margin-top:1.1vh;font-size:24px;line-height:1.08;letter-spacing:0">以福冈市植物园温室区域为例</span></h1>
      <div data-anim="bottom" style="display:grid;grid-template-rows:auto auto;gap:1.6vh;border-top:1px solid rgba(255,255,255,.22);padding-top:2vh">
        <div class="lead" style="max-width:54ch;color:rgba(255,255,255,.86);font-weight:300">植物解说标识的 A/R/S 设计改良与眼动评估实验分析</div>
        <div style="display:flex;gap:1.4vw;align-items:center;color:rgba(255,255,255,.76);font-family:var(--mono);font-size:14px;letter-spacing:.16em;text-transform:uppercase">
          <span style="display:inline-flex;align-items:center;gap:.5em"><i data-lucide="leaf" style="width:18px;height:18px;stroke-width:1.6"></i>Plant</span>
          <span style="display:inline-flex;align-items:center;gap:.5em"><i data-lucide="eye" style="width:18px;height:18px;stroke-width:1.6"></i>Gaze</span>
          <span style="display:inline-flex;align-items:center;gap:.5em"><i data-lucide="signpost" style="width:18px;height:18px;stroke-width:1.6"></i>Signage</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:end">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <div class="t-meta" style="color:rgba(255,255,255,.6)">PINGCHENG WANG · 2026.06</div>
            <div class="t-meta" style="color:rgba(255,255,255,.6)">KYUSHU UNIVERSITY</div>
          </div>
          <!-- Prominent language switcher -->
          <div class="cover-lang-switch" style="pointer-events:auto;">
            <button class="lang-top-btn" onclick="applyLanguage('zh')">ZH</button>
            <button class="lang-top-btn" onclick="applyLanguage('en')">EN</button>
            <button class="lang-top-btn" onclick="applyLanguage('ja')">JA</button>
            <button class="lang-top-btn" onclick="applyLanguage('es-MX')">ES</button>
          </div>
        </div>
      </div>
    </div>
</section>

<section class="slide evidence-slide" data-chapter="1" data-chapter-title="研究背景与目的" data-short-title="困境：知识超载" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">CONTEXT & PROBLEM STATEMENT</div><div class="r">02 / 19</div></div>

    <div class="evidence-layout" style="display:grid;grid-template-columns:1fr 1.2fr;gap:40px;align-items:start;flex:1;min-height:0;padding-top:20px;">
      <!-- Left column: Heading and copy -->
      <div style="display:flex;flex-direction:column;gap:24px;">
        <h2 class="h-xl-zh" style="color:var(--ink);margin:0;">现实困境一：专家导向的知识超载</h2>
        <div style="width:60px;height:4px;background-color:var(--accent);"></div>
        <p class="t-body" style="color:var(--text-primary);margin:0;font-weight:400;">
          “标识被设置，但不等于被阅读”。现行标识多陷入学术名词堆砌与线性灌输模式，缺乏对普通游客日常认知经验的合理过渡。这导致游客在视线接触的黄金前 10 秒内便产生认知疲劳并放弃阅读，形成信息流的不连贯。
        </p>
      </div>

      <!-- Right column: Dominant field image -->
      <div class="evidence-media" style="display:flex;flex-direction:column;gap:12px;align-self:stretch;justify-content:center;">
        <div class="frame-img fit-cover" style="height:360px;width:480px;border-radius:10px;border:1px solid var(--border-subtle);overflow:hidden;">
          <img src="images/01-field-observation.jpg" alt="福冈市植物园温室实地环境" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <span class="t-meta" style="color:var(--text-helper);font-size:16px;">SITE: 福冈市植物园温室大棚区 · N = 70 BASELINE AUDIT</span>
      </div>
    </div>
  </div>
</section>

<section class="slide evidence-slide" data-chapter="1" data-chapter-title="研究背景与目的" data-short-title="困境：评估局限" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">CONTEXT & PROBLEM STATEMENT</div><div class="r">03 / 19</div></div>

    <div class="evidence-layout" style="display:grid;grid-template-columns:1fr 1.2fr;gap:40px;align-items:start;flex:1;min-height:0;padding-top:20px;">
      <!-- Left column: Heading and copy -->
      <div style="display:flex;flex-direction:column;gap:24px;">
        <h2 class="h-xl-zh" style="color:var(--ink);margin:0;">现实困境二：主观定性的评估局限</h2>
        <div style="width:60px;height:4px;background-color:var(--accent);"></div>
        <p class="t-body" style="color:var(--text-primary);margin:0;font-weight:400;">
          传统评估工具的客观度缺失。设计改良缺乏客观、细粒度的生理量化指标。传统评估高度依赖定性问卷与回顾访谈，无法在不打扰被试的自然阅读状态下，精准解耦不同文本版面模块的眼动注意力流向。
        </p>
      </div>

      <!-- Right column: Dominant field image -->
      <div class="evidence-media" style="display:flex;flex-direction:column;gap:12px;align-self:stretch;justify-content:center;">
        <div class="frame-img fit-cover" style="height:360px;width:480px;border-radius:10px;border:1px solid var(--border-subtle);overflow:hidden;">
          <img src="images/02-experiment-scene.jpg" alt="游客在植物园阅读标识场景" style="width:100%;height:100%;object-fit:cover;">
        </div>
        <span class="t-meta" style="color:var(--text-helper);font-size:16px;">FIELD TRIAL: 游客自然状态下的无感视线捕捉与记录</span>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-chapter="1" data-chapter-title="研究背景与目的" data-short-title="研究目的：RQ1" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">RESEARCH OBJECTIVES</div><div class="r">04 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto 1fr;gap:3vh;flex:1;min-height:0">
      <div>
        <h2 class="h-xl-zh" style="color:var(--ink)">探究解说标识的实证化改良路径</h2>
      </div>
      
      <p class="t-body" style="color:var(--text-primary);margin:0;font-size:26px">
        本研究旨在通过提出共创导向的设计原则，并开发开源、低成本的非接触式眼动追踪系统，建立从“发现问题 → 提炼原则 → 定量诊断”的完整评价与验证闭环。帮助解说标识实现从静态的“知识陈列板”向“体验诱导型媒介”的转型。
      </p>

      <div style="background:#fff;border:1px solid var(--border-subtle);padding:3.5vh 3vw;display:flex;flex-direction:column;gap:1.5vh">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-family:var(--mono);font-size:20px;color:var(--accent);font-weight:700">RESEARCH QUESTION 1</span>
          <i data-lucide="eye" style="color:var(--accent);width:28px;height:28px"></i>
        </div>
        <h3 class="t-h-prod" style="margin:0;font-size:32px;color:var(--ink);font-weight:600">Q1 · 初期文字区域完读率提升</h3>
        <p class="t-body" style="color:var(--text-primary);margin:0;font-size:26px">
          A/R设计是否能在游客与标识接触的黄金前 10 秒（视觉入口期）内，有效提高游客对核心文字内容的整体空间覆盖率，降低盲目扫视率？
        </p>
        <span class="t-meta" style="color:var(--text-helper);margin-top:1.5vh">EVALUATION METRIC: TEXT COVERAGE (10S)</span>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-chapter="1" data-chapter-title="研究背景与目的" data-short-title="研究目的：RQ2/3" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">RESEARCH OBJECTIVES</div><div class="r">05 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto 1fr;gap:3vh;flex:1;min-height:0">
      <div>
        <h2 class="h-xl-zh" style="color:var(--ink)">语义区注意力配额与视线转换机制</h2>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2.5vw;align-items:stretch">
        <div style="background:#fff;border:1px solid var(--border-subtle);padding:3.5vh 2.5vw;display:flex;flex-direction:column;gap:1.5vh">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1vh">
            <span style="font-family:var(--mono);font-size:16px;color:var(--accent);font-weight:700">RQ2</span>
            <i data-lucide="layout-grid" style="color:var(--accent);width:24px;height:24px"></i>
          </div>
          <h3 class="t-h-prod" style="margin:0;font-size:32px;color:var(--ink);font-weight:600">A/R 兴趣区注意力配额</h3>
          <p class="t-body-sm" style="color:var(--text-primary);margin:0;font-size:22px;">
            通过精确分割 A 区域（启发背景）与 R 区域（感官与栽培用途）的语义兴趣区（AOI），检验实验组设计是否实现了注意力从背景噪声区向关键行为诱导区的结构化转移。
          </p>
          <span class="t-meta" style="color:var(--text-helper);margin-top:auto">METRIC: SEMANTIC AOI SHARE</span>
        </div>

        <div style="background:#fff;border:1px solid var(--border-subtle);padding:3.5vh 2.5vw;display:flex;flex-direction:column;gap:1.5vh">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1vh">
            <span style="font-family:var(--mono);font-size:16px;color:var(--accent);font-weight:700">RQ3</span>
            <i data-lucide="activity" style="color:var(--accent);width:24px;height:24px"></i>
          </div>
          <h3 class="t-h-prod" style="margin:0;font-size:32px;color:var(--ink);font-weight:600">双维协同的动作映射机制</h3>
          <p class="t-body-sm" style="color:var(--text-primary);margin:0;font-size:22px;">
            揭示以“问句”为首的启发性氛围（A）和以“感官用途”为首的观众关联（R）如何相互支撑，在长效阅读流中共同充当视觉引导漏斗与动作诱导锚点。
          </p>
          <span class="t-meta" style="color:var(--text-helper);margin-top:auto">ANALYSIS: GAZE DYNAMICS MODEL</span>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Chapter 2: 研究策略与整体设计 -->
<section class="slide" data-layout="S11" data-chapter="2" data-chapter-title="研究策略与整体设计" data-short-title="整体设计" data-animate="timeline-walk">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">RESEARCH PIPELINE · CO-CREATION TO VALIDATION (ROADMAP)</div><div class="r">06 / 19</div></div>
    <div style="display:flex;flex-direction:column;gap:1.2vh">
      <h2 class="h-xl-zh" style="font-size:52px;color:var(--ink)">研究整体技术路线</h2>
    </div>
    <div class="timeline-h process-timeline">
      <div class="tl-row">
        <button class="th-node up" type="button" data-process-node="0"><span class="dot"></span><span class="label"><span class="yr">2024.11</span><span class="name">课题收集</span><span class="desc">GGJ2024</span></span></button>
        <button class="th-node down" type="button" data-process-node="1"><span class="dot"></span><span class="label"><span class="yr">2025.04-09</span><span class="name">方向确立</span><span class="desc">调查到验证</span></span></button>
        <button class="th-node up" type="button" data-process-node="2"><span class="dot"></span><span class="label"><span class="yr">2025.10-2026.01</span><span class="name">原则与工具</span><span class="desc">ARS产出 & 工具开发</span></span></button>
        <button class="th-node down" type="button" data-process-node="3"><span class="dot"></span><span class="label"><span class="yr">2026.03-04</span><span class="name">预备验证</span><span class="desc">v3 更新</span></span></button>
        <button class="th-node up" type="button" data-process-node="4"><span class="dot"></span><span class="label"><span class="yr">2026.05</span><span class="name">设计与原型</span><span class="desc">ARS原则视觉映射</span></span></button>
        <button class="th-node down accent" type="button" data-process-node="5"><span class="dot"></span><span class="label"><span class="yr">2026.05</span><span class="name">实验验证</span><span class="desc">ARS有效性验证</span></span></button>
        <button class="th-node up" type="button" data-process-node="6"><span class="dot"></span><span class="label"><span class="yr">2026.06</span><span class="name">快速产出</span><span class="desc">Quick Data</span></span></button>
        <button class="th-node down" type="button" data-process-node="7"><span class="dot"></span><span class="label"><span class="yr">2026.08-10</span><span class="name">后续计划</span><span class="desc">数据细化与撰写</span></span></button>
      </div>
    </div>
    <div class="process-detail" data-process-detail>
      <article class="process-panel" data-process-panel="0">
        <div class="phase"><span>2024.11</span>课题收集</div>
        <div class="detail-list"><div><strong>GGJ2024</strong><span>通过实地调查、焦点小组与 KJ 法收集用户反馈。</span></div></div>
        <div class="detail-list"><div><strong>问题入口</strong><span>明确植物园温室解说标识在阅读范围与记忆保持上的初始课题。</span></div></div>
      </article>
      <article class="process-panel" data-process-panel="1">
        <div class="phase"><span>2025.04-09</span>方向确立</div>
        <div class="detail-list"><div><strong>文献调查</strong><span>根据已收集课题，通过论文调查检讨研究方向。</span></div><div><strong>现状画像分析</strong><span>对标识图像按主题编码，确认问题普遍性并收束课题。</span></div></div>
        <div class="detail-list"><div><strong>专家访谈</strong><span>与专家讨论可行方向，确定研究问题.</span></div><div><strong>GGJ2025</strong><span>用焦点小组、问卷与记忆测试验证研究必要性。</span></div></div>
      </article>
      <article class="process-panel" data-process-panel="2">
        <div class="phase"><span>2025.10-2026.01</span>原则与工具</div>
        <div class="detail-list"><div><strong>ARS 原则产出</strong><span>基于前期画像分析与访谈提炼启发性氛围(A)、观众关联性(R)与结构清晰性(S)原则。</span></div><div><strong>学术发表</strong><span>将前期方法论与 ARS 框架整理并进行学术发表，奠定理论基础。</span></div></div>
        <div class="detail-list"><div><strong>编码与分析工具研发</strong><span>开发多人标识编码工具 Signage Annotator 与视线分析工具 VisualAnalytics。</span></div></div>
      </article>
      <article class="process-panel" data-process-panel="3">
        <div class="phase"><span>2026.03-04</span>预备验证</div>
        <div class="detail-list"><div><strong>予備実験</strong><span>在实验室进行小规模验证，确认 VisualAnalytics 和实验本身的可行性。</span></div></div>
        <div class="detail-list"><div><strong>工具开发 3</strong><span>根据预备实验结果与反馈，将工具更新为 VisualAttention v3。</span></div></div>
      </article>
      <article class="process-panel" data-process-panel="4">
        <div class="phase"><span>2026.05</span>设计与原型</div>
        <div class="detail-list"><div><strong>ARS原则视觉映射</strong><span>将提炼 of A/R/S 理论原则映射为具体的版面排版特征与语义区域（AOI）。</span></div></div>
        <div class="detail-list"><div><strong>Dynamic Signage</strong><span>基于 VisualAnalytics 技术，设计并实现动态解说标识原型。</span></div></div>
      </article>
      <article class="process-panel" data-process-panel="5">
        <div class="phase"><span>2026.05</span>实验验证</div>
        <div class="detail-list"><div><strong>A/B TEST 验证</strong><span>在植物园实施眼动实验，全面验证 A/R/S 改良版标识的视线引导有效性。</span></div><div><strong>实地测试</strong><span>实地收集来园者在自然状态下的真实眼动轨迹与注视分布。</span></div></div>
        <div class="detail-list"><div><strong>PROTOTYPE TRIAL</strong><span>包含 Dynamic Signage 原型试用阶段，观察动态标识的可用性。</span></div><div><strong>分析重点</strong><span>本阶段重点针对 A/B 眼动实验的 Quick Data 与 AOI 数据进行多维分析。</span></div></div>
      </article>
      <article class="process-panel" data-process-panel="6">
        <div class="phase"><span>2026.06</span>快速产出</div>
        <div class="detail-list"><div><strong>Quick Data 分析</strong><span>迅速分析本实验 A/B 测试结果，形成早期结论。</span></div></div>
        <div class="detail-list"><div><strong>修士报告</strong><span>基于 Quick Data 分析结果，完成博士出愿用修士报告。</span></div></div>
      </article>
      <article class="process-panel" data-process-panel="7">
        <div class="phase"><span>2026.08-10</span>后续计划 (未来规划)</div>
        <div class="detail-list"><div><strong>Data 分析</strong><span>详细分析本实验得到的全部数据，细化指标与图表。</span></div><div><strong>修士论文</strong><span>进入修士论文写作阶段，将实验结果整合到完整研究论述中。</span></div></div>
      </article>
    </div>
    <div class="t-body-sm" style="border-top:1px solid var(--border-subtle);padding-top:1.6vh">核心研究流程：原则产出——工具设计——利用工具验证原则有效性</div>
  </div>
</section>

<!-- Chapter 3: 研究方法 -->
<section class="slide" data-chapter="3" data-chapter-title="研究方法" data-short-title="阶段1：文献调查" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">METHODOLOGY · PHASE 1</div><div class="r">07 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto 1fr;gap:3vh;flex:1;min-height:0">
      <div>
        <h2 class="h-xl-zh" style="color:var(--ink)">阶段 1：文献调查与经典理论模型</h2>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3vw;align-items:stretch">
        <div style="background:#fff;border:1px solid var(--border-subtle);padding:3.5vh 3vw;display:flex;flex-direction:column;gap:1.5vh">
          <h3 class="t-h-prod" style="color:var(--accent);margin:0;font-weight:600;display:flex;align-items:center;gap:8px">
            <i data-lucide="book-open" style="width:22px;height:22px"></i>
            文献脉络梳理
          </h3>
          <p class="t-body" style="color:var(--text-primary);margin:0">
            综合 Tilden (1957) 的解说六原则、Ham (2016) 的 EROT 解释机制、与 Serrell (2015) 的微观排版规约。锁定视觉注意力瓶颈与游客认知负荷的对立关系，推导出了适用于动态园艺环境的低负荷传达框架。
          </p>
        </div>

        <div style="background:#fff;border:1px solid var(--border-subtle);padding:3.5vh 3vw;display:flex;flex-direction:column;gap:1.5vh">
          <h3 class="t-h-prod" style="color:var(--ink);margin:0;font-weight:600;display:flex;align-items:center;gap:8px">
            <i data-lucide="brain" style="width:22px;height:22px"></i>
            解说学的三大理论支柱
          </h3>
          <ul class="t-body-sm" style="color:var(--text-primary);margin:0;padding-left:1.5em;display:flex;flex-direction:column;gap:1vh">
            <li><strong>Tilden 原则</strong>：解说必须与来园者的个人经验及日常利益建立关联；</li>
            <li><strong>EROT 模型</strong>：强调解说的启发性（Provocative）与组织清晰度；</li>
            <li><strong>Serrell 策略</strong>：关注微观版面层级对短文本加工负荷的直接影响。</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-chapter="3" data-chapter-title="研究方法" data-short-title="阶段2：共创工坊" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">METHODOLOGY · PHASE 2</div><div class="r">08 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto auto 1fr;gap:2.5vh;flex:1;min-height:0">
      <div>
        <h2 class="h-xl-zh" style="color:var(--ink)">阶段 2：三方共创工坊与市民访谈</h2>
      </div>

      <div style="background:#fff;border:1px solid var(--border-subtle);padding:3vh 3vw;display:flex;flex-direction:column;gap:1.2vh">
        <h3 class="t-h-prod" style="color:var(--accent);margin:0;font-weight:600;display:flex;align-items:center;gap:8px">
          <i data-lucide="users" style="width:20px;height:20px"></i>
          三方视角下的 KJ 痛点审计与编码
        </h3>
        <p class="t-body-sm" style="color:var(--text-primary);margin:0">
          在九州大学举办多轮 Global Goals Jam 共创设计坊。通过半结构化访谈与市民发声，对旧标识的阅读障碍进行扎根理论主轴编码，归纳得出以下 <strong>5 大核心认知痛点分类</strong>：
        </p>
        <div style="display:flex;flex-wrap:wrap;gap:1vw;margin-top:1.5vh">
          <span style="font-size:20px;background:#f5f5f4;padding:8px 16px;color:var(--ink);font-weight:600;border-radius:4px;margin:2px">1. 排版拥挤字号小</span>
          <span style="font-size:20px;background:#f5f5f4;padding:8px 16px;color:var(--ink);font-weight:600;border-radius:4px;margin:2px">2. 信息超载无焦点</span>
          <span style="font-size:20px;background:#f5f5f4;padding:8px 16px;color:var(--ink);font-weight:600;border-radius:4px;margin:2px">3. 缺乏日常经验联结</span>
          <span style="font-size:20px;background:#f5f5f4;padding:8px 16px;color:var(--ink);font-weight:600;border-radius:4px;margin:2px">4. 学术词汇过密难读</span>
          <span style="font-size:20px;background:#f5f5f4;padding:8px 16px;color:var(--ink);font-weight:600;border-radius:4px;margin:2px">5. 缺互动行动性引导</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr auto;gap:2vw;align-items:center;border-top:1px solid var(--border-subtle);padding-top:1.5vh">
        <span style="font-size:16px;color:var(--text-helper)">IMAGE: Global Goals Jam 2025 九州共创现场讨论记录</span>
        <div class="frame-img fit-cover" style="height:12vh;width:24vw;border-radius:0;border:1px solid var(--border-subtle)">
          <img src="images/02-experiment-scene.jpg" alt="共创工坊现场照片" style="width:100%;height:100%;object-fit:cover">
        </div>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-chapter="3" data-chapter-title="研究方法" data-short-title="阶段3：AR原则" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">METHODOLOGY · PHASE 3 PRINCIPLES</div><div class="r">09 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto 1fr;gap:3vh;flex:1;min-height:0">
      <div>
        <h2 class="h-xl-zh" style="color:var(--ink)">阶段 3：A/R/S 设计原则之 A 与 R</h2>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3vw;align-items:stretch">
        <div style="background:#fff;border:1px solid var(--border-subtle);padding:3.5vh 3vw;display:flex;flex-direction:column;gap:1.5vh">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="t-meta" style="color:var(--accent);font-family:var(--mono)">A / ATMOSPHERE</span>
            <i data-lucide="help-circle" style="color:var(--accent);width:24px;height:24px"></i>
          </div>
          <h3 class="t-h-prod" style="color:var(--ink);margin:0">启发性氛围</h3>
          <p class="t-body" style="color:var(--text-primary);margin:0">
            拒绝平铺直叙的客观描述，通过问句启发（如“你能在这片叶子下找到什么？”）或情感隐喻，创造亲和的注意导入切面，诱导游客停下视线并切入深度加工。
          </p>
        </div>

        <div style="background:#fff;border:1px solid var(--border-subtle);padding:3.5vh 3vw;display:flex;flex-direction:column;gap:1.5vh">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="t-meta" style="color:var(--accent);font-family:var(--mono)">R / RELEVANCE</span>
            <i data-lucide="leaf" style="color:var(--accent);width:24px;height:24px"></i>
          </div>
          <h3 class="t-h-prod" style="color:var(--ink);margin:0">观众关联性</h3>
          <p class="t-body" style="color:var(--text-primary);margin:0">
            将植物客观性状映射到日常感官经验（如触觉对比“干巴巴/肉乎乎”、手工原料用途），唤醒知觉。这是吸引持续阅读、防止注意流失的决定性视觉抓手。
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-chapter="3" data-chapter-title="研究方法" data-short-title="阶段3：S原则" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">METHODOLOGY · PHASE 3 PRINCIPLES</div><div class="r">10 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto 1fr;gap:3vh;flex:1;min-height:0">
      <div>
        <h2 class="h-xl-zh" style="color:var(--ink)">阶段 3：A/R/S 设计原则之 S 结构清晰</h2>
      </div>

      <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:3vw;align-items:stretch">
        <div style="background:#fff;border:1px solid var(--border-subtle);padding:3.5vh 3vw;display:flex;flex-direction:column;gap:1.5vh">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="t-meta" style="color:var(--accent);font-family:var(--mono)">S / STRUCTURE</span>
            <i data-lucide="layout" style="color:var(--accent);width:24px;height:24px"></i>
          </div>
          <h3 class="t-h-prod" style="color:var(--ink);margin:0">结构清晰性</h3>
          <p class="t-body" style="color:var(--text-primary);margin:0">
            采用分区模块设计（如左右解耦框架）、显著的层级字重与直观功能图标，避免大面积文字疲劳。优化短文本的视觉流通道，实现高效获取。
          </p>
        </div>

        <div style="background:#fff;border:1px solid var(--border-subtle);padding:2vh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1vh">
          <img src="images/07-intervention-sign.jpg" alt="A/R/S原则版面映射" style="height:32vh;width:20vw;object-fit:contain;border:1px solid var(--border-subtle)">
          <span style="font-size:16px;color:var(--text-helper)">A/R/S 原则的版面语义映射样例 (实验组 A2)</span>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-chapter="3" data-chapter-title="研究方法" data-short-title="阶段3：现状审计" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">METHODOLOGY · PHASE 3 AUDIT</div><div class="r">11 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto auto 1fr;gap:2.5vh;flex:1;min-height:0">
      <div>
        <h2 class="h-xl-zh" style="color:var(--ink)">阶段 3：现有标识的基线现状审计</h2>
      </div>

      <div style="background:#fff;border:1px solid var(--border-subtle);padding:3vh 3vw;display:flex;flex-direction:column;gap:1.5vh">
        <h3 class="t-h-prod" style="color:var(--accent);font-weight:600;margin:0;display:flex;align-items:center;gap:8px">
          <i data-lucide="database" style="width:20px;height:20px"></i>
          N = 70 块大棚标识审计结论
        </h3>
        <p class="t-body-sm" style="color:var(--text-primary);margin:0">
          基于自主开发的 Signage Annotator 多人协同标注平台，对温室大棚内现存 70 块传统解说标识进行系统审计。结果显示 91.4% 的旧标识在 A（启发性）与 R（关联性）维度上完全缺位，证明了进行设计重构与优化的紧迫必要性。
        </p>
      </div>

      <div style="display:grid;grid-template-columns:1fr auto;gap:2vw;align-items:center;border-top:1px solid var(--border-subtle);padding-top:1.5vh">
        <span style="font-size:16px;color:var(--text-helper)">ILLUSTRATION: Signage Annotator 标识分类与定量标注工具界面</span>
        <div class="frame-img fit-cover" style="height:12vh;width:24vw;border-radius:0;border:1px solid var(--border-subtle)">
          <img src="images/08-tool-annotator.jpg" alt="Signage Annotator 标注系统" style="width:100%;height:100%;object-fit:cover">
        </div>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-chapter="3" data-chapter-title="研究方法" data-short-title="阶段4：干预对比" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">METHODOLOGY · PHASE 4 DESIGN</div><div class="r">12 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto 1fr;gap:2.5vh;flex:1;min-height:0">
      <div>
        <h2 class="h-xl-zh" style="color:var(--ink)">阶段 4：眼动实验组与控制组刺激物对比</h2>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:3vw;align-items:stretch">
        <div style="background:#fff;border:1px solid var(--border-subtle);padding:2.5vh 2.5vw;display:flex;align-items:center;justify-content:space-between;gap:1.5vw">
          <div style="flex:1">
            <span class="t-meta" style="color:var(--text-helper)">CONTROL GROUP</span>
            <h4 class="t-h-prod" style="font-size:16px;margin-bottom:0.5vh;color:var(--ink)">控制组 A1 (经典版)</h4>
            <p class="t-body-sm" style="line-height:1.4;color:var(--text-primary);margin:0;font-size:22px;">传统的全通栏大段正文排版，缺乏视觉分区，导致游客无焦点地随意浏览。</p>
          </div>
          <img src="images/06-control-sign.jpg" alt="控制组经典标识" style="height:15vh;width:11vw;object-fit:contain;background:#fff;border:1px solid var(--border-subtle)">
        </div>
        
        <div style="background:#fff;border:1px solid var(--accent);padding:2.5vh 2.5vw;display:flex;align-items:center;justify-content:space-between;gap:1.5vw">
          <div style="flex:1">
            <span class="t-meta" style="color:var(--accent)">INTERVENTION GROUP</span>
            <h4 class="t-h-prod" style="font-size:16px;margin-bottom:0.5vh;color:var(--accent)">实验组 A2 (改良版)</h4>
            <p class="t-body-sm" style="line-height:1.4;color:var(--text-primary);margin:0;font-size:22px;">整合大气泡问句引导（A）与感官用途框（R），运用模块设计引导动作映射。</p>
          </div>
          <img src="images/07-intervention-sign.jpg" alt="实验组改良标识" style="height:15vh;width:11vw;object-fit:contain;background:#fff;border:1px solid var(--border-subtle)">
        </div>
      </div>
    </div>
  </div>
</section>

<section class="slide" data-chapter="3" data-chapter-title="研究方法" data-short-title="阶段4：视线系统" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">METHODOLOGY · PHASE 4 EYE TRACKING</div><div class="r">13 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto auto 1fr;gap:2.5vh;flex:1;min-height:0">
      <div>
        <h2 class="h-xl-zh" style="color:var(--ink)">阶段 4：眼动系统部署与射影校准</h2>
      </div>

      <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:3vw;align-items:stretch">
        <div style="background:#fff;border:1px solid var(--border-subtle);padding:3vh 2.5vw;display:flex;flex-direction:column;gap:1.2vh">
          <h3 class="t-h-prod" style="color:var(--accent);font-weight:600;margin:0;display:flex;align-items:center;gap:8px">
            <i data-lucide="settings" style="width:20px;height:20px"></i>
            非接触估计与漂移补偿
          </h3>
          <p class="t-body-sm" style="color:var(--text-primary);margin:0">
            基于 WebGazer.js 研发 non-contact 视线估计 system SIGN Visual Attention。仅利用设备自带摄像头实时捕获面部反射。开发手动漂移补偿与光照过滤算法，彻底过滤室外反光畸变。
          </p>
        </div>

        <div style="background:#fff;border:1px solid var(--border-subtle);padding:3vh 2.5vw;display:flex;flex-direction:column;gap:1.2vh">
          <h3 class="t-h-prod" style="color:var(--ink);font-weight:600;margin:0;display:flex;align-items:center;gap:8px">
            <i data-lucide="crosshair" style="width:20px;height:20px"></i>
            纸面 9 点校准映射
          </h3>
          <p class="t-body-sm" style="color:var(--text-primary);margin:0">
            游客在测试前依次观看纸质标识四周的 9 个物理定标点。系统计算头部姿态，并利用单应性矩阵（Homography）将屏幕空间估计点投影映射到纸质标识的 2D 坐标系上。
          </p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr auto;gap:2vw;align-items:center;border-top:1px solid var(--border-subtle);padding-top:1.5vh">
        <span style="font-size:16px;color:var(--text-helper)">ILLUSTRATION: Web 端 9点视线偏移物理校准与误差补偿界面</span>
        <div class="frame-img fit-cover" style="height:11vh;width:24vw;border-radius:0;border:1px solid var(--border-subtle)">
          <img src="images/10-calibration.jpg" alt="眼动校准界面" style="width:100%;height:100%;object-fit:cover">
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Chapter 4: 结果与讨论 -->
<section class="slide" data-chapter="4" data-chapter-title="结果与讨论" data-short-title="热力图一览" data-layout="S21" data-animate="statement-rise">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">HEATMAP OVERVIEW · CONTROL VS INTERVENTION</div><div class="r">08 / 13</div></div>
    <div class="heatmap-overview" data-heatmap-overview>
      <div style="display:flex;justify-content:space-between;align-items:end;gap:3vw">
        <h2 class="h-xl-zh" style="font-size:52px;margin:0">结果热力图一览</h2>
        <div class="t-meta" data-heatmap-current style="color:var(--accent);padding-bottom:.9vh">P01</div>
      </div>
      <div class="heatmap-stage">
        <section class="heatmap-side">
          <div class="heatmap-label"><span>CONTROL GROUP</span><span>控制组</span></div>
          <div class="heatmap-stack" data-heatmap-stack="control">
            <figure class="heatmap-card active" data-heatmap-card="control" data-heatmap-index="0"><img src="../ab2/academic_heatmap_akama%20kumiko_a1%20%E4%BF%AE%E6%AD%A3%E7%89%881%20(1).png" alt="P01 控制组热力图"><figcaption>P01</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="control" data-heatmap-index="1"><img src="../ab2/academic_heatmap_ataqi_a1.png" alt="P02 控制组热力图"><figcaption>P02</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="control" data-heatmap-index="2"><img src="../ab2/academic_heatmap_harada%20keiko_a1%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P03 控制组热力图"><figcaption>P03</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="control" data-heatmap-index="3"><img src="../ab2/academic_heatmap_kimura_b1%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P04 控制组热力图"><figcaption>P04</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="control" data-heatmap-index="4"><img src="../ab2/academic_heatmap_koga%20eiichi_a1%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P05 控制组热力图"><figcaption>P05</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="control" data-heatmap-index="5"><img src="../ab2/academic_heatmap_moro%20izumi_a1%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P06 控制组热力图"><figcaption>P06</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="control" data-heatmap-index="6"><img src="../ab2/academic_heatmap_saku%20yoshisuke_a1%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P07 控制组热力图"><figcaption>P07</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="control" data-heatmap-index="8"><img src="../ab2/academic_heatmap_yamada%20rena_a1%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P09 控制组热力图"><figcaption>P09</figcaption></figure>
          </div>
        </section>
        <nav class="heatmap-wheel" aria-label="Participant selector">
          <button class="heatmap-picker active" type="button" data-heatmap-pick="0">P01</button>
          <button class="heatmap-picker" type="button" data-heatmap-pick="1">P02</button>
          <button class="heatmap-picker" type="button" data-heatmap-pick="2">P03</button>
          <button class="heatmap-picker" type="button" data-heatmap-pick="3">P04</button>
          <button class="heatmap-picker" type="button" data-heatmap-pick="4">P05</button>
          <button class="heatmap-picker" type="button" data-heatmap-pick="5">P06</button>
          <button class="heatmap-picker" type="button" data-heatmap-pick="6">P07</button>
          <button class="heatmap-picker" type="button" data-heatmap-pick="7">P08</button>
          <button class="heatmap-picker" type="button" data-heatmap-pick="8">P09</button>
        </nav>
        <section class="heatmap-side">
          <div class="heatmap-label"><span>INTERVENTION GROUP</span><span>实验组</span></div>
          <div class="heatmap-stack" data-heatmap-stack="intervention">
            <figure class="heatmap-card active" data-heatmap-card="intervention" data-heatmap-index="0"><img src="../ab2/academic_heatmap_akama%20kumiko_a2%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P01 实验组热力图"><figcaption>P01</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="intervention" data-heatmap-index="1"><img src="../ab2/academic_heatmap_ataqi_a2%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P02 实验组热力图"><figcaption>P02</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="intervention" data-heatmap-index="2"><img src="../ab2/academic_heatmap_harada%20keiko_a2%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P03 实验组热力图"><figcaption>P03</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="intervention" data-heatmap-index="3"><img src="../ab2/academic_heatmap_kimura_b2%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P04 实验组热力图"><figcaption>P04</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="intervention" data-heatmap-index="4"><img src="../ab2/academic_heatmap_koga%20eiichi_a2%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P05 实验组热力图"><figcaption>P05</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="intervention" data-heatmap-index="5"><img src="../ab2/academic_heatmap_moro%20izumi_a2%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P06 实验组热力图"><figcaption>P06</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="intervention" data-heatmap-index="6"><img src="../ab2/academic_heatmap_saku%20yoshisuke_a2%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P07 实验组热力图"><figcaption>P07</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="intervention" data-heatmap-index="7"><img src="../ab2/academic_heatmap_umetu%20ayane_b2%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P08 实验组热力图"><figcaption>P08</figcaption></figure>
            <figure class="heatmap-card" data-heatmap-card="intervention" data-heatmap-index="8"><img src="../ab2/academic_heatmap_yamada%20rena_a2%20%E4%BF%AE%E6%AD%A3%E7%89%881.png" alt="P09 实验组热力图"><figcaption>P09</figcaption></figure>
          </div>
        </section>
      </div>
    </div>
  </div>
</section>

<!-- Chapter 4: 结果与讨论 - Q1 文字区域完读率提升 -->
<section class="slide" data-chapter="4" data-chapter-title="结果与讨论" data-short-title="结果一：完读率提升" data-layout="S06" data-animate="tower-grow">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">DATA 01 · INITIAL 10 SECONDS TEXT READING COVERAGE (Q1)</div><div class="r">15 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto 1fr;gap:3vh;flex:1;min-height:0">
      <!-- Top Row: Academic discussion -->
      <div style="display:grid;grid-template-columns:5fr 7fr;gap:4vw;align-items:center">
        <div>
          <h2 class="h-xl-zh" style="color:var(--ink)">结果 (1)：初期文字区域完读率提升</h2>
        </div>
        <p class="t-body-sm" style="line-height:1.6;color:var(--text-primary)">
          文字区域完读率网格差分分析表明，在前10秒黄金阅读窗口中，实验组的文字区域完读率均值由对照组的 38.6% 提升至实验组 of 45.3%（提升了 6.7pp）。9 名被试中有 6 名呈现出显著上升趋势，中位提升幅度达到 +8.2pp。这证明了实验组成功将视线从盲目扫视引流至感官行动区。
        </p>
      </div>
      <!-- Bottom Row: Towers -->
      <div class="bar-towers" style="height:38vh;margin-top:auto;margin-bottom:auto">
        <div class="bar-tower"><div class="cap"><i data-lucide="baseline"></i></div><div class="body-block h-2" style="background:#fff;border:1px solid var(--border-subtle);color:var(--ink)"><div class="lbl">CONTROL</div><div class="nb">38.6<span class="unit">%</span></div><div class="sub">对照组完读率 (10s)</div></div></div>
        <div class="bar-tower"><div class="cap"><i data-lucide="move-up-right"></i></div><div class="body-block h-3 b-accent" style="background:var(--accent);color:#fff"><div class="lbl">INTERVENTION</div><div class="nb">45.3<span class="unit">%</span></div><div class="sub">实验组完读率 (10s)</div></div></div>
        <div class="bar-tower"><div class="cap"><i data-lucide="plus"></i></div><div class="body-block h-1" style="background:#fff;border:1px solid var(--border-subtle);color:var(--ink)"><div class="lbl">DELTA</div><div class="nb">+6.7<span class="unit">pp</span></div><div class="sub">平均完读率净增量</div></div></div>
        <div class="bar-tower"><div class="cap"><i data-lucide="users"></i></div><div class="body-block h-2" style="background:#fff;border:1px solid var(--border-subtle);color:var(--ink)"><div class="lbl">RELIABILITY</div><div class="nb">6/9<span class="unit">人↑</span></div><div class="sub">中位提升 +8.2pp</div></div></div>
      </div>
    </div>
  </div>
</section>

<!-- Chapter 4: 结果与讨论 - Q2 & Q3 R原则与AOI注意力分配 -->
<section class="slide" data-chapter="4" data-chapter-title="结果与讨论" data-short-title="结果二：R原则效应" data-layout="S20" data-animate="stacked-ledger">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">DATA 03 · AUDIENCE RELEVANCE EFFECT (Q3)</div><div class="r">16 / 19</div></div>
    <div style="display:grid;grid-template-rows:auto 1fr;gap:3vh;flex:1;min-height:0">
      <!-- Top Row: Academic Discussion -->
      <div style="display:grid;grid-template-columns:5fr 7fr;gap:4vw;align-items:center">
        <div>
          <h2 class="h-xl-zh" style="color:var(--ink)">结果 (2)：R原则发挥核心决定性效应</h2>
        </div>
        <p class="t-body-sm" style="line-height:1.55;color:var(--text-primary)">
          对各语义兴趣区（AOI）进行分类分析，结果证实了 Audience Relevance（R原则，感官与栽培用途） 获得了极强的注意力捕获效能，注意力从其他装饰区（21.2% -> 8.9%）成功引流。而 Inspirational Atmosphere（A原则）主要充当阅读情境的引导漏斗。
        </p>
      </div>
      <!-- Bottom Row: Stacked Ledger -->
      <div style="display:flex;flex-direction:column;justify-content:center;gap:0">
        <div class="ledger-row" style="display:grid;grid-template-columns:5fr 4fr 3fr;gap:2vw;align-items:end;border-bottom:1px solid var(--border-subtle);padding:1.8vh 0">
          <div style="font-family:var(--sans);font-weight:200;font-size:72px;line-height:.9;letter-spacing:-.04em;color:var(--accent)">5.0 → 21.4<span style="font-size:18px;font-weight:300;margin-left:.2em">%</span></div>
          <div class="t-h-prod" style="color:var(--ink)">前 10 秒 R 区注意力占比</div>
          <div class="t-body-sm" style="color:var(--text-primary)">提升 16.4pp，表明观众关联信息能被迅速捕捉，成为极佳的“视觉锚点”。</div>
        </div>
        <div class="ledger-row" style="display:grid;grid-template-columns:5fr 4fr 3fr;gap:2vw;align-items:end;border-bottom:1px solid var(--border-subtle);padding:1.8vh 0">
          <div style="font-family:var(--sans);font-weight:200;font-size:72px;line-height:.9;letter-spacing:-.04em;color:var(--accent)">8.5 → 35.1<span style="font-size:18px;font-weight:300;margin-left:.2em">%</span></div>
          <div class="t-h-prod" style="color:var(--ink)">全程时间 R 区注意力占比</div>
          <div class="t-body-sm" style="color:var(--text-primary)">大幅增长 26.6pp，视线结构发生了长效重组，吸引受众进行深度信息加工。</div>
        </div>
        <div class="ledger-row" style="display:grid;grid-template-columns:5fr 4fr 3fr;gap:2vw;align-items:end;padding:1.8vh 0">
          <div style="font-family:var(--sans);font-weight:200;font-size:72px;line-height:.9;letter-spacing:-.04em;color:var(--ink)">9 / 9人</div>
          <div class="t-h-prod" style="color:var(--ink)">全样本表现一致</div>
          <div class="t-body-sm" style="color:var(--text-primary)">在被测试的 9 名有效被试中，R 区的注意力占比无一例外均发生显著提升。</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Chapter 5: 结论与未来展望 -->
<section class="slide split" data-chapter="5" data-chapter-title="结论与未来展望" data-short-title="研究结论" data-layout="SWISS-CLOSING-ASCII" data-animate="split-statement">
  <div class="canvas-card">
    <div class="split-half">
      <div class="half b-accent" style="padding:5.6vh 3.6vw 4.4vh;justify-content:space-between;position:relative;overflow:hidden">
        <canvas class="ascii-bg" aria-hidden="true"></canvas>
        <div class="chrome-min" style="margin-bottom:0;position:relative;z-index:1"><div class="l">17 / 19</div><div class="r">CONCLUSIONS</div></div>
        <div data-anim="manifesto" style="display:flex;flex-direction:column;gap:2vh;position:relative;z-index:1">
          <h2 class="slide16-title" style="font-family:var(--sans),var(--sans-zh);font-size:52px;line-height:.96;letter-spacing:-.025em;font-weight:200;color:#fff">结论：解决非正式学习中的结构性失败</h2>
          <div style="font-family:var(--sans),var(--sans-zh);font-size:26px;line-height:1.6;color:rgba(255,255,255,.82);font-weight:400;max-width:38ch;margin-top:1.4vh">本研究成功搭建了从“共创痛点分析”到“眼动生理指标评估”的学术诊断全链路，用数据实证了感官及行动经验对视觉引导的根本作用。</div>
        </div>
        <div data-anim="signature" style="display:flex;justify-content:space-between;align-items:end;border-top:1px solid rgba(255,255,255,.22);padding-top:2vh;position:relative;z-index:1"><div class="t-meta" style="color:rgba(255,255,255,.62)">MASTER'S REPORT</div><div class="t-meta" style="color:rgba(255,255,255,.62)">KYUSHU UNIVERSITY</div></div>
      </div>
      <div class="half" style="padding:5.6vh 3.6vw 4.4vh;justify-content:space-between">
        <div class="chrome-min"><div class="l">CONTRIBUTIONS</div><div class="r">THREE PILLARS</div></div>
        <div data-anim="rules" style="display:flex;flex-direction:column;gap:2.2vh">
          <div style="display:grid;grid-template-columns:4em 1fr;gap:1.4vw;border-top:1px solid var(--border-subtle);padding-top:2vh">
            <div class="t-meta" style="color:var(--ink);font-weight:600">01</div>
            <div>
              <h3 class="t-h-prod" style="color:var(--ink)">方法论贡献 (Methodological)</h3>
              <p class="t-body-sm" style="line-height:1.5;color:var(--text-primary)">建立标准化转化闭环，将杂散的用户行为数据或共创意见，结构化输出为具备证据支撑的解说设计系统参数。</p>
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:4em 1fr;gap:1.4vw;border-top:1px solid var(--border-subtle);padding-top:2vh">
            <div class="t-meta" style="color:var(--ink);font-weight:600">02</div>
            <div>
              <h3 class="t-h-prod" style="color:var(--ink)">应用实践价值 (Applied)</h3>
              <p class="t-body-sm" style="line-height:1.5;color:var(--text-primary)">A/R/S 设计优化原则突破了场域限制，可直接移植运用至科学馆、历史博览会和自然博物馆等非正式教育界面中。</p>
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:4em 1fr;gap:1.4vw;border-top:1px solid var(--accent);padding-top:2vh">
            <div class="t-meta" style="color:var(--accent);font-weight:600">03</div>
            <div>
              <h3 class="t-h-prod" style="color:var(--accent)">工具链支持 (Instrumental)</h3>
              <p class="t-body-sm" style="line-height:1.5;color:var(--text-primary)">
                开源非接触式视线系统 SIGN Visual Attention 证明了利用常规摄像头和大棚本地计算开展学术分析的轻量化潜能。
              </p>
            </div>
          </div>
        </div>
        <div data-anim="foot" class="t-meta" style="color:var(--text-helper);text-align:right">RESEARCH CONCLUSIONS</div>
      </div>
    </div>
  </div>
</section>

<section class="slide split" data-chapter="5" data-chapter-title="结论与未来展望" data-short-title="博士阶段展望" data-layout="SWISS-CLOSING-ASCII" data-animate="split-statement">
  <div class="canvas-card">
    <div class="split-half">
      <div class="half b-accent" style="padding:5.6vh 3.6vw 4.4vh;justify-content:space-between;position:relative;overflow:hidden;background-color:var(--ink)">
        <canvas class="ascii-bg" aria-hidden="true"></canvas>
        <div class="chrome-min" style="margin-bottom:0;position:relative;z-index:1;color:#fff"><div class="l">18 / 19</div><div class="r">FUTURE AGENDA</div></div>
        <div data-anim="manifesto" style="display:flex;flex-direction:column;gap:2vh;position:relative;z-index:1">
          <h2 class="slide16-title" style="font-family:var(--sans),var(--sans-zh);font-size:52px;line-height:.96;letter-spacing:-.025em;font-weight:200;color:#fff">博士阶段展望：从视觉捕获到信息提取</h2>
          <div style="font-family:var(--sans),var(--sans-zh);font-size:26px;line-height:1.6;color:rgba(255,255,255,.82);font-weight:400;max-width:38ch;margin-top:1.4vh">在第一阶段突破了“视觉可达性与注意力分流”屏障后，博士阶段将向大脑的信息解码与空间导航连贯性发起挑战。</div>
        </div>
        <div data-anim="signature" style="display:flex;justify-content:space-between;align-items:end;border-top:1px solid rgba(255,255,255,.22);padding-top:2vh;position:relative;z-index:1;color:#fff"><div class="t-meta" style="color:rgba(255,255,255,.62)">DOCTORAL RESEARCH AGENDA</div></div>
      </div>
      <div class="half" style="padding:5.6vh 3.6vw 4.4vh;justify-content:space-between">
        <div class="chrome-min"><div class="l">NEXT STEPS</div><div class="r">TARGETING PROBLEM 2</div></div>
        <div data-anim="rules" style="display:flex;flex-direction:column;gap:2.2vh">
          <div style="display:grid;grid-template-columns:4em 1fr;gap:1.4vw;border-top:1px solid var(--border-subtle);padding-top:2vh">
            <div class="t-meta" style="color:var(--ink);font-weight:600">STEP 1</div>
            <div>
              <h3 class="t-h-prod">解决第二痛点：信息记忆衰退</h3>
              <p class="t-body-sm" style="line-height:1.5;color:var(--text-primary)">引入认知负荷理论 (Sweller, 1988) 与双重编码理论 (Paivio, 1971)，研究如何通过合理的图文匹配优化大脑记忆编码强度。</p>
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:4em 1fr;gap:1.4vw;border-top:1px solid var(--border-subtle);padding-top:2vh">
            <div class="t-meta" style="color:var(--ink);font-weight:600">STEP 2</div>
            <div>
              <h3 class="t-h-prod">全生命周期眼动与延迟信息召回</h3>
              <p class="t-body-sm" style="line-height:1.5;color:var(--text-primary)">结合更长期的动态视线数据流，在游客离开温室 10-30 分钟后开展延迟记忆提取实验，探明注视时间与最终知识存留的关系系数。</p>
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:4em 1fr;gap:1.4vw;border-top:1px solid var(--accent);padding-top:2vh">
            <div class="t-meta" style="color:var(--accent);font-weight:600">STEP 3</div>
            <div>
              <h3 class="t-h-prod" style="color:var(--accent)">突破空间不连续性</h3>
              <p class="t-body-sm" style="line-height:1.5;color:var(--text-primary)">
                从单体标识研究过渡到系统布局（空间动线引导、 inter-sign continuity），研究标识群的空间排布对游客在大温室中建立连贯心智地图的价值。
              </p>
            </div>
          </div>
        </div>
        <div data-anim="foot" class="t-meta" style="color:var(--text-helper);text-align:right">DOCTORAL AGENDA</div>
      </div>
    </div>
  </div>
</section>

<!-- Chapter 6: 参考文献 -->
<section class="slide" data-chapter="6" data-chapter-title="参考文献" data-short-title="References" data-layout="S16" data-animate="field-notes">
  <div class="canvas-card">
    <div class="chrome-min"><div class="l">REFERENCES</div><div class="r">19 / 19</div></div>
    <div style="display:flex;flex-direction:column;gap:1.4vh">
      <h2 class="h-xl-zh" style="font-size:52px">参考文献 (References)</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:1.6vh;margin-top:3vh;flex:1">
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:1.5vh">
        <li style="padding-bottom:1.5vh;border-bottom:1px solid var(--border-subtle)">
          <p class="t-body-sm" style="line-height:1.6"><strong>Bitgood, S. (2013).</strong> Attention and value: Keys to understanding museum visitors. <i>Left Coast Press</i>.</p>
        </li>
        <li style="padding-bottom:1.5vh;border-bottom:1px solid var(--border-subtle)">
          <p class="t-body-sm" style="line-height:1.6"><strong>Ham, S. (2016).</strong> Interpretation: Making a difference on purpose. <i>Fulcrum Publishing</i>.</p>
        </li>
        <li style="padding-bottom:1.5vh;border-bottom:1px solid var(--border-subtle)">
          <p class="t-body-sm" style="line-height:1.6"><strong>Paivio, A. (1971).</strong> Imagery and verbal processes. <i>Holt, Rinehart, and Winston</i>.</p>
        </li>
        <li style="padding-bottom:1.5vh;border-bottom:1px solid var(--border-subtle)">
          <p class="t-body-sm" style="line-height:1.6"><strong>Serrell, B. (2015).</strong> Exhibit labels: An interpretive approach. <i>Bloomsbury Publishing</i>.</p>
        </li>
        <li style="padding-bottom:1.5vh;border-bottom:1px solid var(--border-subtle)">
          <p class="t-body-sm" style="line-height:1.6"><strong>Spooner, S. L., et al. (2024).</strong> Using eye-tracking to create impactful interpretation signage for botanic gardens. <i>Journal of Zoological and Botanical Gardens, 5(3)</i>, 434-454.</p>
        </li>
        <li style="padding-bottom:1.5vh;border-bottom:1px solid var(--border-subtle)">
          <p class="t-body-sm" style="line-height:1.6"><strong>Sweller, J. (1988).</strong> Cognitive load during problem solving: Effects on learning. <i>Cognitive Science, 12(2)</i>, 257-285.</p>
        </li>
        <li style="padding-bottom:1.5vh;border-bottom:1px solid var(--border-subtle)">
          <p class="t-body-sm" style="line-height:1.6"><strong>Tilden, F. (1957).</strong> Interpreting our heritage. <i>University of North Carolina Press</i>.</p>
        </li>
      </ul>
    </div>
  </div>
</section>
`;

const newContent = content.substring(0, startIndex) + newSlides + content.substring(endIdx);
fs.writeFileSync(indexHtmlPath, newContent, 'utf8');
console.log('v3 Master Slides successfully updated!');
