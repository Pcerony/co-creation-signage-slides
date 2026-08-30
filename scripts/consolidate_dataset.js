/**
 * scripts/consolidate_dataset.js
 * 
 * 全量眼动追踪实验数据整合与导出脚本
 * 整合 13 位被试（Group A: 7人, Group B: 6人）全部 28 条有效实验记录
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW_MAY = path.join(ROOT, 'data/raw/20260523_session1_9p');
const RAW_JUNE = path.join(ROOT, 'data/raw/20260604_session2_4p');
const PARTICIPANTS_DIR = path.join(ROOT, 'data/participants');
const CONSOLIDATED_DIR = path.join(ROOT, 'data/consolidated');

// 规范化被试命名映射
const PARTICIPANT_META = {
  // Group A (A1 vs A2, N=7)
  'akama kumiko': { id: 'akama_kumiko', name: 'Akama Kumiko', group: 'A', conditionType: 'a1_vs_a2' },
  'ataqi': { id: 'ataqi', name: 'Ataqi', group: 'A', conditionType: 'a1_vs_a2' },
  'harada keiko': { id: 'harada_keiko', name: 'Harada Keiko', group: 'A', conditionType: 'a1_vs_a2' },
  'koga eiichi': { id: 'koga_eiichi', name: 'Koga Eiichi', group: 'A', conditionType: 'a1_vs_a2' },
  'moro izumi': { id: 'moro_izumi', name: 'Moro Izumi', group: 'A', conditionType: 'a1_vs_a2' },
  'saku yoshisuke': { id: 'saku_yoshisuke', name: 'Saku Yoshisuke', group: 'A', conditionType: 'a1_vs_a2' },
  'yamada rena': { id: 'yamada_rena', name: 'Yamada Rena', group: 'A', conditionType: 'a1_vs_a2' },

  // Group B (B1 vs B2, N=6)
  'kimura': { id: 'kimura', name: 'Kimura', group: 'B', conditionType: 'b1_vs_b2' },
  'umetu ayane': { id: 'umetu_ayane', name: 'Umetu Ayane', group: 'B', conditionType: 'b1_vs_b2' },
  'abcde': { id: 'abcde', name: 'Participant ABCDE', group: 'B', conditionType: 'b1_vs_b2' },
  'rep': { id: 'rep_chen', name: 'Participant Rep (Chen)', group: 'B', conditionType: 'b1_vs_b2' },
  '186': { id: 'p186', name: 'Participant 186', group: 'B', conditionType: 'b1_vs_b2' },
  'nonntixyan': { id: 'nonntixyan', name: 'Participant Nonntixyan', group: 'B', conditionType: 'b1_vs_b2' }
};

// 1. 读取并清洗 5 月被试数据
function loadMaySessions() {
  const sessions = [];
  const files = fs.readdirSync(RAW_MAY).filter(f => f.endsWith('.json'));

  files.forEach(f => {
    // 过滤 ataqi 重复的早期测试导出 (ataqi-16.16 是测试，ataqi-16.21 是完整版)
    if (f === 'ataqi-16.16-visual analytics.json') return;

    const filePath = path.join(RAW_MAY, f);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (content.sessions && content.sessions.length > 0) {
      content.sessions.forEach(s => {
        // 清洗 runs：过滤空 run 或极其短暂的误触 (如 ataqi 1.3s 的误触)
        const validRuns = (s.runs || []).filter(r => {
          const pts = r.points || [];
          return pts.length >= 200; // 过滤测试误触
        });
        s.runs = validRuns;
        sessions.push(s);
      });
    }
  });

  return sessions;
}

// 2. 读取并清洗 6 月新被试数据
function loadJuneSessions() {
  const sessions = [];
  const juneDirs = [
    path.join(RAW_JUNE, 'participant_abcde/archive.json'),
    path.join(RAW_JUNE, 'participant_rep_chen/archive.json'),
    path.join(RAW_JUNE, 'participant_186/archive.json'),
    path.join(RAW_JUNE, 'participant_nonntixyan/archive.json')
  ];

  juneDirs.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (content.sessions && content.sessions.length > 0) {
        sessions.push(...content.sessions);
      }
    }
  });

  return sessions;
}

function normalizeSession(rawSession) {
  const rawId = (rawSession.id || rawSession.label || '').trim();
  const meta = PARTICIPANT_META[rawId] || {
    id: rawId.replace(/\s+/g, '_').toLowerCase(),
    name: rawId,
    group: 'Unknown',
    conditionType: 'Unknown'
  };

  const runs = (rawSession.runs || []).map((r, idx) => {
    const pts = (r.points || []).map((p, pIdx) => ({
      index: p.index != null ? p.index : pIdx + 1,
      x: p.x || 0,
      y: p.y || 0,
      a4X: p.a4X != null ? p.a4X : (p.a4_x_norm != null ? p.a4_x_norm : 0),
      a4Y: p.a4Y != null ? p.a4Y : (p.a4_y_norm != null ? p.a4_y_norm : 0),
      a4Xmm: p.a4Xmm != null ? p.a4Xmm : (p.a4_x_mm != null ? p.a4_x_mm : (p.a4X || 0) * 297),
      a4Ymm: p.a4Ymm != null ? p.a4Ymm : (p.a4_y_mm != null ? p.a4_y_mm : (p.a4Y || 0) * 210),
      onPaper: p.onPaper != null ? p.onPaper : (p.on_a4_paper != null ? p.on_a4_paper : (p.a4X >= 0 && p.a4X <= 1 && p.a4Y >= 0 && p.a4Y <= 1)),
      timestamp: p.timestamp || 0
    }));

    const rawImg = (r.image && r.image.name) || r.imageName || r.id || '';
    const imgClean = rawImg.replace(/_副本|修正版\d+|\(\d+\)/g, '').trim().toLowerCase();
    const condition = (imgClean === 'a1' || imgClean === 'b1') ? 'control' : 'experiment';
    const conditionLabel = condition === 'control' ? '对照组' : '实验组';
    const duration = r.duration || (pts.length > 1 ? (pts[pts.length - 1].timestamp - pts[0].timestamp) / 1000 : 0);

    return {
      id: `${meta.id}_run_${idx + 1}_${imgClean}`,
      trialIndex: idx + 1,
      imageName: imgClean,
      imageGroup: meta.group,
      condition,
      conditionLabel,
      startedAt: r.startedAt || rawSession.calibratedAt,
      endedAt: r.endedAt || '',
      duration: parseFloat(duration.toFixed(3)),
      coordinateSystem: 'a4-landscape-paper',
      pointsCount: pts.length,
      points: pts
    };
  });

  return {
    id: meta.id,
    label: meta.name,
    group: meta.group,
    conditionType: meta.conditionType,
    calibratedAt: rawSession.calibratedAt,
    coordinateSystem: 'a4-landscape-paper',
    paperSizeMm: { width: 297, height: 210 },
    runs
  };
}

function runConsolidation() {
  console.log('--- 正在整合全量 13 位被试数据 ---');
  const may = loadMaySessions();
  const june = loadJuneSessions();

  const allRaw = [...may, ...june];
  const normalizedSessions = allRaw.map(normalizeSession);

  // 去重（按被试 ID）
  const uniqueMap = new Map();
  normalizedSessions.forEach(s => {
    if (!uniqueMap.has(s.id)) {
      uniqueMap.set(s.id, s);
    }
  });

  const finalSessions = Array.from(uniqueMap.values());

  // 1. 生成每个被试的独立档案
  finalSessions.forEach(session => {
    const subFolder = session.group === 'A' ? 'group_A_a1_vs_a2' : 'group_B_b1_vs_b2';
    const pDir = path.join(PARTICIPANTS_DIR, subFolder, session.id);
    fs.mkdirSync(pDir, { recursive: true });

    // 被试 JSON
    const participantArchive = {
      schema: 'browser-eye-tracking-archive',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      participantId: session.id,
      group: session.group,
      session
    };
    fs.writeFileSync(path.join(pDir, `${session.id}_archive.json`), JSON.stringify(participantArchive, null, 2), 'utf8');
  });

  // 2. 生成全量统一 JSON 归档（供 Web 工具一键加载）
  const fullArchive = {
    schema: 'browser-eye-tracking-archive',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    totalParticipants: finalSessions.length,
    sessions: finalSessions
  };
  fs.writeFileSync(path.join(CONSOLIDATED_DIR, 'all_13_participants_archive.json'), JSON.stringify(fullArchive, null, 2), 'utf8');

  // 3. 生成试次汇总 CSV 表 (all_trials_summary.csv)
  const summaryHeader = [
    'participant_id',
    'participant_name',
    'group',
    'trial_index',
    'image_name',
    'condition',
    'condition_label',
    'duration_seconds',
    'total_points',
    'valid_points',
    'valid_ratio_percent',
    'sampling_rate_hz',
    'centroid_x_norm',
    'centroid_y_norm',
    'centroid_x_mm',
    'centroid_y_mm',
    'calibrated_at'
  ];

  const summaryRows = [];
  const pointRows = [];

  const pointHeader = [
    'participant_id',
    'group',
    'image_name',
    'condition',
    'point_index',
    'a4_x_norm',
    'a4_y_norm',
    'a4_x_mm',
    'a4_y_mm',
    'on_paper',
    'timestamp_ms'
  ];

  let totalPointsCount = 0;

  finalSessions.forEach(s => {
    s.runs.forEach(r => {
      const validPts = r.points.filter(p => p.onPaper);
      const validRatio = r.points.length > 0 ? (validPts.length / r.points.length) : 0;
      const samplingRate = r.duration > 0 ? (r.points.length / r.duration) : 0;

      let sumX = 0, sumY = 0;
      validPts.forEach(p => { sumX += p.a4X; sumY += p.a4Y; });
      const cX = validPts.length ? sumX / validPts.length : 0;
      const cY = validPts.length ? sumY / validPts.length : 0;

      summaryRows.push([
        s.id,
        `"${s.label}"`,
        s.group,
        r.trialIndex,
        r.imageName,
        r.condition,
        `"${r.conditionLabel}"`,
        r.duration,
        r.points.length,
        validPts.length,
        (validRatio * 100).toFixed(2),
        samplingRate.toFixed(2),
        cX.toFixed(4),
        cY.toFixed(4),
        (cX * 297).toFixed(2),
        (cY * 210).toFixed(2),
        s.calibratedAt
      ].join(','));

      r.points.forEach(p => {
        totalPointsCount++;
        pointRows.push([
          s.id,
          s.group,
          r.imageName,
          r.condition,
          p.index,
          p.a4X.toFixed(4),
          p.a4Y.toFixed(4),
          p.a4Xmm.toFixed(2),
          p.a4Ymm.toFixed(2),
          p.onPaper ? 1 : 0,
          p.timestamp.toFixed(1)
        ].join(','));
      });
    });
  });

  const summaryCsvContent = [summaryHeader.join(','), ...summaryRows].join('\n');
  fs.writeFileSync(path.join(CONSOLIDATED_DIR, 'all_trials_summary.csv'), summaryCsvContent, 'utf8');

  const pointsCsvContent = [pointHeader.join(','), ...pointRows].join('\n');
  fs.writeFileSync(path.join(CONSOLIDATED_DIR, 'all_gaze_points_detail.csv'), pointsCsvContent, 'utf8');

  console.log('✅ 数据整合完成！');
  console.log(`- 总被试数: ${finalSessions.length} 位`);
  console.log(`  * Group A: ${finalSessions.filter(s => s.group === 'A').length} 位`);
  console.log(`  * Group B: ${finalSessions.filter(s => s.group === 'B').length} 位`);
  console.log(`- 总试次数 (Runs): ${summaryRows.length} 次`);
  console.log(`- 总采样点数: ${totalPointsCount} 个`);
  console.log(`- 输出文件:`);
  console.log(`  1. ${path.relative(ROOT, path.join(CONSOLIDATED_DIR, 'all_13_participants_archive.json'))}`);
  console.log(`  2. ${path.relative(ROOT, path.join(CONSOLIDATED_DIR, 'all_trials_summary.csv'))}`);
  console.log(`  3. ${path.relative(ROOT, path.join(CONSOLIDATED_DIR, 'all_gaze_points_detail.csv'))}`);
}

runConsolidation();
