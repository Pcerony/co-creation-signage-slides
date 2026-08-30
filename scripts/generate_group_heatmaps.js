/**
 * scripts/generate_group_heatmaps.js
 * 
 * 群体综合热力图与注视点分布生成器 (Zero-dependency Node.js)
 * 自动聚合：
 * - A1 全体 7 人综合数据 (对照组)
 * - A2 全体 7 人综合数据 (实验组)
 * - B1 全体 6 人综合数据 (对照组)
 * - B2 全体 6 人综合数据 (实验组)
 * 
 * 产出：
 * 1. outputs/heatmaps_group/group_comparison_viewer.html (交互式高清群体热力图查看器与导出工具)
 * 2. outputs/heatmaps_group/a1_group_density.svg
 * 3. outputs/heatmaps_group/a2_group_density.svg
 * 4. outputs/heatmaps_group/b1_group_density.svg
 * 5. outputs/heatmaps_group/b2_group_density.svg
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONSOLIDATED_JSON = path.join(ROOT, 'data/consolidated/all_13_participants_archive.json');
const AOI_JSON = path.join(ROOT, 'stimuli/aoi_definitions.json');
const OUTPUT_DIR = path.join(ROOT, 'outputs/heatmaps_group');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function runGroupHeatmaps() {
  console.log('🎨 正在生成组级综合注视点分布与热力图产物...');

  const archive = JSON.parse(fs.readFileSync(CONSOLIDATED_JSON, 'utf8'));
  const aoiDefs = JSON.parse(fs.readFileSync(AOI_JSON, 'utf8'));

  // 聚合各刺激图的点位与被试
  const groupData = {
    a1: { name: 'A1', label: 'Bougainvillea (传统标牌 / 对照组)', plant: 'Bougainvillea', condition: 'control', participants: [], points: [], totalDuration: 0 },
    a2: { name: 'A2', label: 'Sennichikobou (互动标牌 / 实验组)', plant: 'Sennichikobou', condition: 'experiment', participants: [], points: [], totalDuration: 0 },
    b1: { name: 'B1', label: 'Sennichikobou (传统标牌 / 对照组)', plant: 'Sennichikobou', condition: 'control', participants: [], points: [], totalDuration: 0 },
    b2: { name: 'B2', label: 'Bougainvillea (互动标牌 / 实验组)', plant: 'Bougainvillea', condition: 'experiment', participants: [], points: [], totalDuration: 0 }
  };

  archive.sessions.forEach(s => {
    s.runs.forEach(r => {
      const img = r.imageName.toLowerCase();
      if (groupData[img]) {
        if (!groupData[img].participants.includes(s.label)) {
          groupData[img].participants.push(s.label);
        }
        groupData[img].totalDuration += r.duration;
        r.points.forEach(p => {
          if (p.onPaper && p.a4X >= 0 && p.a4X <= 1 && p.a4Y >= 0 && p.a4Y <= 1) {
            groupData[img].points.push({
              participant: s.id,
              x: p.a4X,
              y: p.a4Y,
              t: p.timestamp
            });
          }
        });
      }
    });
  });

  // 1. 生成各组独立的 SVG 密度图 (带 AOI 框与注视点云)
  ['a1', 'a2', 'b1', 'b2'].forEach(imgKey => {
    const data = groupData[imgKey];
    const aois = aoiDefs.images[imgKey] ? aoiDefs.images[imgKey].aois : [];
    const svgContent = buildGroupSvg(imgKey, data, aois);
    fs.writeFileSync(path.join(OUTPUT_DIR, `${imgKey}_group_density.svg`), svgContent, 'utf8');
  });

  // 2. 生成交互式 HTML 查看器
  const viewerHtml = buildViewerHtml(groupData, aoiDefs);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'group_comparison_viewer.html'), viewerHtml, 'utf8');

  console.log('✅ 群体热力图与查看器生成完毕！');
  console.log(`- HTML 查看器: ${path.relative(ROOT, path.join(OUTPUT_DIR, 'group_comparison_viewer.html'))}`);
  console.log(`- SVG 密度图: outputs/heatmaps_group/{a1,a2,b1,b2}_group_density.svg`);
}

function buildGroupSvg(imgKey, data, aois) {
  const width = 1188; // 297 * 4
  const height = 840; // 210 * 4

  const aoiRects = aois.map(a => {
    const x = a.bbox[0] * width;
    const y = a.bbox[1] * height;
    const w = (a.bbox[2] - a.bbox[0]) * width;
    const h = (a.bbox[3] - a.bbox[1]) * height;
    return `
      <g class="aoi-box" id="aoi-${a.id}">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(59, 130, 246, 0.08)" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4,4" rx="4" />
        <rect x="${x}" y="${y - 20}" width="${a.label.length * 14 + 16}" height="20" fill="#3b82f6" rx="2" />
        <text x="${x + 6}" y="${y - 6}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">${a.label}</text>
      </g>
    `;
  }).join('\n');

  // 点云 (采样绘制，避免 SVG 过于庞大)
  const sampledPoints = data.points.filter((_, idx) => idx % 2 === 0);
  const pointCircles = sampledPoints.map(p => {
    const cx = (p.x * width).toFixed(1);
    const cy = (p.y * height).toFixed(1);
    return `<circle cx="${cx}" cy="${cy}" r="4" fill="rgba(239, 68, 68, 0.25)" />`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    .bg { fill: #f8fafc; }
    .title { font-family: system-ui, sans-serif; font-size: 20px; font-weight: bold; fill: #0f172a; }
    .meta { font-family: system-ui, sans-serif; font-size: 13px; fill: #64748b; }
  </style>
  <rect width="${width}" height="${height}" class="bg" />
  
  <!-- 标牌背景刺激图 -->
  <image href="../../stimuli/${imgKey.toUpperCase()}.png" width="${width}" height="${height}" preserveAspectRatio="none" opacity="0.85" />
  
  <!-- 注视点云 -->
  <g id="gaze-points">
    ${pointCircles}
  </g>
  
  <!-- AOI 兴趣区标注 -->
  <g id="aois">
    ${aoiRects}
  </g>
  
  <!-- 顶部统计信息栏 -->
  <rect x="16" y="16" width="380" height="60" rx="8" fill="rgba(15, 23, 42, 0.85)" />
  <text x="32" y="42" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">${data.name}: ${data.label}</text>
  <text x="32" y="62" font-family="system-ui, sans-serif" font-size="12" fill="#94a3b8">样本: ${data.participants.length} 位被试 | 总采样点: ${data.points.length} 点 | 累计时长: ${data.totalDuration.toFixed(1)}s</text>
</svg>`;
}

function buildViewerHtml(groupData, aoiDefs) {
  const jsonStr = JSON.stringify({ groupData, aoiDefs });
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>群体综合眼动热力图与对比分析看板</title>
  <style>
    :root { --primary: #2563eb; --bg: #0f172a; --panel: #1e293b; --text: #f8fafc; --muted: #94a3b8; }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 24px; }
    header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
    h1 { font-size: 24px; font-weight: 700; }
    .subtitle { color: var(--muted); font-size: 14px; margin-top: 4px; }
    .controls { display: flex; gap: 12px; }
    button { background: var(--panel); border: 1px solid #334155; color: var(--text); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; transition: all .2s; }
    button:hover { background: #334155; }
    button.active { background: var(--primary); border-color: var(--primary); color: #fff; }
    .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 16px; }
    .card { background: var(--panel); border-radius: 12px; border: 1px solid #334155; overflow: hidden; padding: 16px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .card-title { font-size: 16px; font-weight: 600; }
    .card-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge-control { background: #334155; color: #cbd5e1; }
    .badge-exp { background: #166534; color: #86efac; }
    .canvas-wrap { position: relative; width: 100%; aspect-ratio: 297/210; background: #000; border-radius: 8px; overflow: hidden; }
    canvas { width: 100%; height: 100%; display: block; }
    .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #334155; font-size: 13px; }
    .meta-item { color: var(--muted); }
    .meta-val { color: var(--text); font-weight: 600; margin-top: 2px; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>🌿 植物标牌群体综合热力图对比看板</h1>
      <div class="subtitle">2×2 交叉平衡设计 | Group A (7位被试) vs Group B (6位被试) 全量群体注视点聚合</div>
    </div>
    <div class="controls">
      <button id="btn-group-a" class="active" onclick="switchGroup('A')">Group A 对比 (A1 对照 vs A2 实验)</button>
      <button id="btn-group-b" onclick="switchGroup('B')">Group B 对比 (B1 对照 vs B2 实验)</button>
      <button onclick="toggleAoi()">开关 AOI 框线</button>
    </div>
  </header>

  <div class="grid-container" id="cards-container">
    <!-- 动态插入两个对比卡片 -->
  </div>

  <script>
    const DATA = ${jsonStr};
    let currentGroup = 'A';
    let showAoi = true;

    function renderGroup(group) {
      currentGroup = group;
      document.getElementById('btn-group-a').className = group === 'A' ? 'active' : '';
      document.getElementById('btn-group-b').className = group === 'B' ? 'active' : '';

      const container = document.getElementById('cards-container');
      container.innerHTML = '';

      const leftKey = group === 'A' ? 'a1' : 'b1';
      const rightKey = group === 'A' ? 'a2' : 'b2';

      [leftKey, rightKey].forEach(k => {
        const item = DATA.groupData[k];
        const aois = DATA.aoiDefs.images[k] ? DATA.aoiDefs.images[k].aois : [];
        const isExp = item.condition === 'experiment';

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = \`
          <div class="card-header">
            <div>
              <div class="card-title">\${item.name}: \${item.plant}</div>
              <div class="subtitle">\${item.label}</div>
            </div>
            <span class="card-badge \${isExp ? 'badge-exp' : 'badge-control'}">\${isExp ? '实验组 (互动标牌)' : '对照组 (传统标牌)'}</span>
          </div>
          <div class="canvas-wrap">
            <canvas id="canvas-\${k}"></canvas>
          </div>
          <div class="meta-grid">
            <div class="meta-item">聚合被试数<div class="meta-val">\${item.participants.length} 人</div></div>
            <div class="meta-item">总采样点数<div class="meta-val">\${item.points.length} pts</div></div>
            <div class="meta-item">累计注视时长<div class="meta-val">\${item.totalDuration.toFixed(1)} s</div></div>
          </div>
        \`;
        container.appendChild(card);

        drawHeatmapCanvas(k, item, aois);
      });
    }

    function drawHeatmapCanvas(k, item, aois) {
      const canvas = document.getElementById(\`canvas-\${k}\`);
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = \`../../stimuli/\${k.toUpperCase()}.png\`;
      img.onload = () => {
        canvas.width = 1188;
        canvas.height = 840;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 绘制离屏热力密度
        const heatCanvas = document.createElement('canvas');
        heatCanvas.width = canvas.width;
        heatCanvas.height = canvas.height;
        const hCtx = heatCanvas.getContext('2d');

        item.points.forEach(p => {
          const x = p.x * canvas.width;
          const y = p.y * canvas.height;
          const rad = 35;
          const grad = hCtx.createRadialGradient(x, y, 0, x, y, rad);
          grad.addColorStop(0, 'rgba(0,0,0,0.15)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          hCtx.fillStyle = grad;
          hCtx.beginPath();
          hCtx.arc(x, y, rad, 0, Math.PI * 2);
          hCtx.fill();
        });

        // 伪彩色渐变上色
        const imgData = hCtx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const alpha = d[i + 3];
          if (alpha > 0) {
            const norm = Math.min(alpha / 180, 1);
            // 蓝 -> 绿 -> 黄 -> 红
            let r = 0, g = 0, b = 0;
            if (norm < 0.25) { b = 255; g = norm * 4 * 255; }
            else if (norm < 0.5) { g = 255; b = (1 - (norm - 0.25) * 4) * 255; }
            else if (norm < 0.75) { g = 255; r = (norm - 0.5) * 4 * 255; }
            else { r = 255; g = (1 - (norm - 0.75) * 4) * 255; }

            d[i] = r;
            d[i + 1] = g;
            d[i + 2] = b;
            d[i + 3] = Math.min(alpha * 1.5, 200);
          }
        }
        hCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(heatCanvas, 0, 0);

        // AOI 框线
        if (showAoi) {
          aois.forEach(a => {
            const ax = a.bbox[0] * canvas.width;
            const ay = a.bbox[1] * canvas.height;
            const aw = (a.bbox[2] - a.bbox[0]) * canvas.width;
            const ah = (a.bbox[3] - a.bbox[1]) * canvas.height;
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.strokeRect(ax, ay, aw, ah);
            ctx.setLineDash([]);

            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(ax, ay - 24, a.label.length * 15 + 16, 24);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px system-ui, sans-serif';
            ctx.fillText(a.label, ax + 8, ay - 7);
          });
        }
      };
    }

    function switchGroup(g) { renderGroup(g); }
    function toggleAoi() { showAoi = !showAoi; renderGroup(currentGroup); }

    renderGroup('A');
  </script>
</body>
</html>`;
}

runGroupHeatmaps();
