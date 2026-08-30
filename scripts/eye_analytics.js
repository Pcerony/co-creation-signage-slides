/**
 * scripts/eye_analytics.js
 * 
 * 学术级眼动数据分析核心引擎 (Zero-dependency Node.js)
 * 包含：
 * 1. I-DT (Identification by Dispersion-Threshold) 注视点/眼跳滤波算法
 * 2. 语义兴趣区 (AOI) 多维度指标提取 (TTFF, TFD, FFD, FC, Revisit Count)
 * 3. 追加 4 大眼动行为学深度维度：
 *    - Reading Order (阅读顺序 / 閲覧順序)
 *    - Switching Frequency (区域切换频率 / 領域間切替頻度)
 *    - Saccade Rate (眼跳率 / サッカード率)
 *    - Re-reading Behavior (重读/回视行为 / 再読・読み返し行動)
 * 4. 对照组 (Traditional) vs 实验组 (Interactive) 配对显著性检验 (Paired t-test, Cohen's d)
 * 5. 生成精炼 JSON/CSV 数据与学术报告
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONSOLIDATED_JSON = path.join(ROOT, 'data/consolidated/all_13_participants_archive.json');
const AOI_JSON = path.join(ROOT, 'stimuli/aoi_definitions.json');
const OUTPUT_DIR = path.join(ROOT, 'outputs/reports_and_tables');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── 1. I-DT 注视点滤波算法 (Identification by Dispersion-Threshold) ───────
function extractFixationsIDT(points, dispersionThreshold = 0.08, minDurationMs = 100) {
  const validPoints = points.filter(p => p.onPaper && p.a4X >= 0 && p.a4X <= 1 && p.a4Y >= 0 && p.a4Y <= 1);
  if (validPoints.length < 3) return { fixations: [], saccades: [] };

  const fixations = [];
  let windowStart = 0;

  while (windowStart < validPoints.length) {
    let windowEnd = windowStart;

    while (windowEnd < validPoints.length && (validPoints[windowEnd].timestamp - validPoints[windowStart].timestamp) < minDurationMs) {
      windowEnd++;
    }

    if (windowEnd >= validPoints.length) break;

    let pts = validPoints.slice(windowStart, windowEnd + 1);
    let minX = Math.min(...pts.map(p => p.a4X));
    let maxX = Math.max(...pts.map(p => p.a4X));
    let minY = Math.min(...pts.map(p => p.a4Y));
    let maxY = Math.max(...pts.map(p => p.a4Y));
    let dispersion = (maxX - minX) + (maxY - minY);

    if (dispersion <= dispersionThreshold) {
      while (windowEnd < validPoints.length) {
        const nextPt = validPoints[windowEnd];
        const nextMinX = Math.min(minX, nextPt.a4X);
        const nextMaxX = Math.max(maxX, nextPt.a4X);
        const nextMinY = Math.min(minY, nextPt.a4Y);
        const nextMaxY = Math.max(maxY, nextPt.a4Y);
        const nextDispersion = (nextMaxX - nextMinX) + (nextMaxY - nextMinY);

        if (nextDispersion <= dispersionThreshold) {
          minX = nextMinX;
          maxX = nextMaxX;
          minY = nextMinY;
          maxY = nextMaxY;
          windowEnd++;
        } else {
          break;
        }
      }

      const fixationPts = validPoints.slice(windowStart, windowEnd);
      const startTime = fixationPts[0].timestamp;
      const endTime = fixationPts[fixationPts.length - 1].timestamp;
      const fixDuration = endTime - startTime;

      let sumX = 0, sumY = 0;
      fixationPts.forEach(p => { sumX += p.a4X; sumY += p.a4Y; });
      const centroidX = sumX / fixationPts.length;
      const centroidY = sumY / fixationPts.length;

      fixations.push({
        index: fixations.length + 1,
        centroidX,
        centroidY,
        centroidXmm: centroidX * 297,
        centroidYmm: centroidY * 210,
        startTimeMs: startTime,
        endTimeMs: endTime,
        durationMs: fixDuration,
        pointCount: fixationPts.length
      });

      windowStart = windowEnd;
    } else {
      windowStart++;
    }
  }

  const saccades = [];
  for (let i = 0; i < fixations.length - 1; i++) {
    const f1 = fixations[i];
    const f2 = fixations[i + 1];
    const dx = (f2.centroidX - f1.centroidX) * 297;
    const dy = (f2.centroidY - f1.centroidY) * 210;
    const amplitudeMm = Math.sqrt(dx * dx + dy * dy);
    const sacDurationMs = f2.startTimeMs - f1.endTimeMs;

    saccades.push({
      fromFixation: f1.index,
      toFixation: f2.index,
      amplitudeMm: parseFloat(amplitudeMm.toFixed(2)),
      durationMs: Math.max(parseFloat(sacDurationMs.toFixed(1)), 0),
      velocityMmPerSec: sacDurationMs > 0 ? parseFloat((amplitudeMm / (sacDurationMs / 1000)).toFixed(1)) : 0
    });
  }

  return { fixations, saccades };
}

// ─── 2. AOI (Area of Interest) 计算引擎 ──────────────────────────
function computeAoiMetrics(run, fixations, aoiDefs, trialStartTimeMs) {
  const imgName = run.imageName.toLowerCase();
  const imgAoiConfig = aoiDefs.images[imgName];
  if (!imgAoiConfig || !imgAoiConfig.aois) return { aoiStats: {}, sequence: [], switchesCount: 0, revisitDurationMs: 0 };

  const aois = imgAoiConfig.aois;
  const sortedAois = [...aois].sort((a, b) => {
    const areaA = (a.bbox[2] - a.bbox[0]) * (a.bbox[3] - a.bbox[1]);
    const areaB = (b.bbox[2] - b.bbox[0]) * (b.bbox[3] - b.bbox[1]);
    return areaA - areaB;
  });

  const aoiStats = {};
  aois.forEach(aoi => {
    aoiStats[aoi.id] = {
      id: aoi.id,
      label: aoi.label,
      category: aoi.category,
      bbox: aoi.bbox,
      fixationsCount: 0,
      totalFixationDurationMs: 0,
      firstPassDurationMs: 0,
      revisitDurationMs: 0,
      ttffMs: null,
      firstFixationDurationMs: null,
      revisitCount: 0,
      hasLeftOnce: false
    };
  });

  const aoiSequence = []; // 完整注视 AOI 流
  let previousAoiId = null;
  let switchesCount = 0;
  let totalRevisitDurationMs = 0;

  fixations.forEach(f => {
    const matchedAoi = sortedAois.find(aoi => {
      const [xMin, yMin, xMax, yMax] = aoi.bbox;
      return f.centroidX >= xMin && f.centroidX <= xMax && f.centroidY >= yMin && f.centroidY <= yMax;
    });

    const currentAoiId = matchedAoi ? matchedAoi.id : null;
    aoiSequence.push({
      fixationIndex: f.index,
      aoiId: currentAoiId,
      startTimeMs: f.startTimeMs,
      durationMs: f.durationMs
    });

    if (currentAoiId !== previousAoiId && previousAoiId !== null && currentAoiId !== null) {
      switchesCount++;
    }

    if (matchedAoi) {
      const st = aoiStats[matchedAoi.id];
      st.fixationsCount++;
      st.totalFixationDurationMs += f.durationMs;

      const relTime = f.startTimeMs - trialStartTimeMs;
      if (st.ttffMs === null) {
        st.ttffMs = Math.max(relTime, 0);
        st.firstFixationDurationMs = f.durationMs;
      }

      if (previousAoiId !== null && previousAoiId !== matchedAoi.id) {
        if (st.fixationsCount > 1 && st.hasLeftOnce) {
          st.revisitCount++;
          st.revisitDurationMs += f.durationMs;
          totalRevisitDurationMs += f.durationMs;
        }
      } else {
        if (!st.hasLeftOnce) {
          st.firstPassDurationMs += f.durationMs;
        } else {
          st.revisitDurationMs += f.durationMs;
          totalRevisitDurationMs += f.durationMs;
        }
      }
    }

    // 标记离开过的 AOI
    if (previousAoiId !== null && previousAoiId !== currentAoiId) {
      if (aoiStats[previousAoiId]) {
        aoiStats[previousAoiId].hasLeftOnce = true;
      }
    }

    previousAoiId = currentAoiId;
  });

  const totalFixTime = fixations.reduce((sum, f) => sum + f.durationMs, 0);
  Object.values(aoiStats).forEach(st => {
    st.totalFixationDurationSec = parseFloat((st.totalFixationDurationMs / 1000).toFixed(3));
    st.ttffSec = st.ttffMs !== null ? parseFloat((st.ttffMs / 1000).toFixed(3)) : null;
    st.firstFixationDurationSec = st.firstFixationDurationMs !== null ? parseFloat((st.firstFixationDurationMs / 1000).toFixed(3)) : null;
    st.fixationRatioPercent = totalFixTime > 0 ? parseFloat(((st.totalFixationDurationMs / totalFixTime) * 100).toFixed(2)) : 0;
    st.revisitRatioPercent = st.totalFixationDurationMs > 0 ? parseFloat(((st.revisitDurationMs / st.totalFixationDurationMs) * 100).toFixed(2)) : 0;
  });

  // 计算首次进入次序 (First Entry Rank)
  const enteredAois = Object.values(aoiStats).filter(st => st.ttffMs !== null).sort((a, b) => a.ttffMs - b.ttffMs);
  const entryOrder = enteredAois.map((st, idx) => ({ rank: idx + 1, aoiId: st.id, aoiLabel: st.label, ttffSec: st.ttffSec }));

  return {
    aoiStats,
    entryOrder,
    aoiSequence,
    switchesCount,
    totalRevisitDurationMs
  };
}

// ─── 3. 精确 Student's t-test 检验函数 ────────────────────────────
function computePairedTTest(pairs) {
  const validPairs = pairs.filter(p => typeof p[0] === 'number' && typeof p[1] === 'number' && !isNaN(p[0]) && !isNaN(p[1]));
  const n = validPairs.length;
  if (n < 2) return { n, t: 0, df: 0, p: 1, d: 0, controlMean: 0, controlStd: 0, expMean: 0, expStd: 0, meanDiff: 0, isSignificant: false };

  const cVals = validPairs.map(p => p[0]);
  const eVals = validPairs.map(p => p[1]);
  const diffs = validPairs.map(p => p[1] - p[0]);

  const meanC = cVals.reduce((a, b) => a + b, 0) / n;
  const meanE = eVals.reduce((a, b) => a + b, 0) / n;
  const meanD = diffs.reduce((a, b) => a + b, 0) / n;

  const stdC = Math.sqrt(cVals.reduce((sum, v) => sum + Math.pow(v - meanC, 2), 0) / (n - 1));
  const stdE = Math.sqrt(eVals.reduce((sum, v) => sum + Math.pow(v - meanE, 2), 0) / (n - 1));
  const stdD = Math.sqrt(diffs.reduce((sum, d) => sum + Math.pow(d - meanD, 2), 0) / (n - 1));

  const seD = stdD / Math.sqrt(n);
  const t = seD > 0 ? (meanD / seD) : 0;
  const df = n - 1;
  const d = stdD > 0 ? (meanD / stdD) : 0;
  const p = exactStudentTwoTailedP(t, df);

  return {
    n,
    controlMean: parseFloat(meanC.toFixed(2)),
    controlStd: parseFloat(stdC.toFixed(2)),
    expMean: parseFloat(meanE.toFixed(2)),
    expStd: parseFloat(stdE.toFixed(2)),
    meanDiff: parseFloat(meanD.toFixed(2)),
    stdDiff: parseFloat(stdD.toFixed(2)),
    t: parseFloat(t.toFixed(3)),
    df,
    p: parseFloat(p.toFixed(4)),
    d: parseFloat(d.toFixed(3)),
    isSignificant: p < 0.05
  };
}

function exactStudentTwoTailedP(t, df) {
  const absT = Math.abs(t);
  if (df <= 0 || isNaN(absT)) return 1.0;
  if (absT === 0) return 1.0;

  const w = absT / Math.sqrt(df);
  const th = Math.atan(w);
  let p = 0;

  if (df % 2 === 1) {
    let sum = 0;
    let term = Math.cos(th);
    for (let i = 1; i <= (df - 1) / 2; i++) {
      sum += term;
      term *= ((2 * i) / (2 * i + 1)) * Math.pow(Math.cos(th), 2);
    }
    p = 1 - (2 / Math.PI) * (th + Math.sin(th) * sum);
  } else {
    let sum = 1;
    let term = 1;
    for (let i = 1; i <= df / 2 - 1; i++) {
      term *= ((2 * i - 1) / (2 * i)) * Math.pow(Math.cos(th), 2);
      sum += term;
    }
    p = 1 - Math.sin(th) * sum;
  }

  return Math.min(Math.max(p, 0), 1);
}

// ─── 4. 全量统计与 4 维深度维度计算 ───────────────────────────────────
function runAnalytics() {
  console.log('🚀 执行 I-DT 滤波、AOI 提取与 4 维眼动深度行为学分析...');

  const archive = JSON.parse(fs.readFileSync(CONSOLIDATED_JSON, 'utf8'));
  const aoiDefs = JSON.parse(fs.readFileSync(AOI_JSON, 'utf8'));

  const participantResults = [];
  const allAoiCsvRows = [];

  const aoiCsvHeader = [
    'participant_id',
    'participant_name',
    'group',
    'image_name',
    'condition',
    'aoi_id',
    'aoi_label',
    'aoi_category',
    'total_fixation_duration_sec',
    'fixation_ratio_percent',
    'fixations_count',
    'ttff_sec',
    'first_fixation_duration_sec',
    'revisit_count',
    'revisit_duration_sec',
    'revisit_ratio_percent'
  ];

  archive.sessions.forEach(session => {
    const pResult = {
      participantId: session.id,
      name: session.label,
      group: session.group,
      trials: []
    };

    session.runs.forEach(run => {
      const trialStartTime = run.points.length > 0 ? run.points[0].timestamp : 0;
      const { fixations, saccades } = extractFixationsIDT(run.points);
      const { aoiStats, entryOrder, aoiSequence, switchesCount, totalRevisitDurationMs } = computeAoiMetrics(run, fixations, aoiDefs, trialStartTime);

      const durationSec = run.duration > 0 ? run.duration : 1;
      const totalFixTimeSec = parseFloat((fixations.reduce((sum, f) => sum + f.durationMs, 0) / 1000).toFixed(3));

      // 4 维关键衍生指标
      const switchingRatePerSec = parseFloat((switchesCount / durationSec).toFixed(3));
      const saccadeRateHz = parseFloat((saccades.length / durationSec).toFixed(2));
      const avgSaccadeAmpMm = saccades.length > 0 ? parseFloat((saccades.reduce((sum, s) => sum + s.amplitudeMm, 0) / saccades.length).toFixed(1)) : 0;
      const totalRevisitRatioPercent = totalFixTimeSec > 0 ? parseFloat(((totalRevisitDurationMs / 1000 / totalFixTimeSec) * 100).toFixed(2)) : 0;

      const trialSummary = {
        trialId: run.id,
        imageName: run.imageName,
        condition: run.condition,
        conditionLabel: run.conditionLabel,
        totalDurationSec: run.duration,
        rawPointsCount: run.pointsCount,
        validPointsCount: run.points.filter(p => p.onPaper).length,
        fixationsCount: fixations.length,
        totalFixationTimeSec: totalFixTimeSec,
        avgFixationDurationMs: fixations.length > 0 ? parseFloat((fixations.reduce((sum, f) => sum + f.durationMs, 0) / fixations.length).toFixed(1)) : 0,
        saccadesCount: saccades.length,
        avgSaccadeAmplitudeMm: avgSaccadeAmpMm,

        // 4 维行为学指标
        readingOrder: entryOrder,
        switchingFrequency: {
          totalSwitches: switchesCount,
          switchingRatePerSec
        },
        saccadeDynamics: {
          saccadeRateHz,
          avgAmplitudeMm: avgSaccadeAmpMm
        },
        reReadingBehavior: {
          totalRevisitCount: Object.values(aoiStats).reduce((sum, a) => sum + a.revisitCount, 0),
          totalRevisitDurationSec: parseFloat((totalRevisitDurationMs / 1000).toFixed(3)),
          reReadingRatioPercent: totalRevisitRatioPercent
        },

        aoiMetrics: aoiStats
      };

      pResult.trials.push(trialSummary);

      Object.values(aoiStats).forEach(aoi => {
        allAoiCsvRows.push([
          session.id,
          `"${session.label}"`,
          session.group,
          run.imageName,
          run.condition,
          aoi.id,
          `"${aoi.label}"`,
          aoi.category,
          aoi.totalFixationDurationSec,
          aoi.fixationRatioPercent,
          aoi.fixationsCount,
          aoi.ttffSec !== null ? aoi.ttffSec : '',
          aoi.firstFixationDurationSec !== null ? aoi.firstFixationDurationSec : '',
          aoi.revisitCount,
          (aoi.revisitDurationMs / 1000).toFixed(3),
          aoi.revisitRatioPercent
        ].join(','));
      });
    });

    participantResults.push(pResult);
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, 'aoi_participant_metrics.csv'), [aoiCsvHeader.join(','), ...allAoiCsvRows].join('\n'), 'utf8');

  // 计算全量及分组的配对统计
  function extractAllPairs(pList) {
    const dur = [], fc = [], afd = [];
    const photoRatio = [], textRatio = [];
    const switchRate = [], saccadeRate = [], saccadeAmp = [], reReadRatio = [];

    pList.forEach(p => {
      const c = p.trials.find(t => t.condition === 'control');
      const e = p.trials.find(t => t.condition === 'experiment');
      if (c && e) {
        dur.push([c.totalDurationSec, e.totalDurationSec]);
        fc.push([c.fixationsCount, e.fixationsCount]);
        afd.push([c.avgFixationDurationMs, e.avgFixationDurationMs]);
        photoRatio.push([c.aoiMetrics['image_photo'] ? c.aoiMetrics['image_photo'].fixationRatioPercent : 0, e.aoiMetrics['image_photo'] ? e.aoiMetrics['image_photo'].fixationRatioPercent : 0]);
        textRatio.push([c.aoiMetrics['body_text'] ? c.aoiMetrics['body_text'].fixationRatioPercent : 0, e.aoiMetrics['body_text'] ? e.aoiMetrics['body_text'].fixationRatioPercent : 0]);

        // 4 维指标配对
        switchRate.push([c.switchingFrequency.switchingRatePerSec, e.switchingFrequency.switchingRatePerSec]);
        saccadeRate.push([c.saccadeDynamics.saccadeRateHz, e.saccadeDynamics.saccadeRateHz]);
        saccadeAmp.push([c.saccadeDynamics.avgAmplitudeMm, e.saccadeDynamics.avgAmplitudeMm]);
        reReadRatio.push([c.reReadingBehavior.reReadingRatioPercent, e.reReadingBehavior.reReadingRatioPercent]);
      }
    });

    return {
      duration: computePairedTTest(dur),
      fixationCount: computePairedTTest(fc),
      avgFixationDuration: computePairedTTest(afd),
      photoDwellRatio: computePairedTTest(photoRatio),
      textDwellRatio: computePairedTTest(textRatio),

      // 4 维配对检验
      switchingFrequency: computePairedTTest(switchRate),
      saccadeRate: computePairedTTest(saccadeRate),
      saccadeAmplitude: computePairedTTest(saccadeAmp),
      reReadingRatio: computePairedTTest(reReadRatio)
    };
  }

  const overallStats = extractAllPairs(participantResults);
  const groupA_Stats = extractAllPairs(participantResults.filter(p => p.group === 'A'));
  const groupB_Stats = extractAllPairs(participantResults.filter(p => p.group === 'B'));

  // 汇总 Reading Order
  const readingOrderSummary = {
    control: {},
    experiment: {}
  };

  participantResults.forEach(p => {
    p.trials.forEach(t => {
      const cond = t.condition;
      t.readingOrder.forEach(item => {
        if (!readingOrderSummary[cond][item.aoiId]) {
          readingOrderSummary[cond][item.aoiId] = { aoiId: item.aoiId, label: item.aoiLabel, ranks: [], ttffs: [] };
        }
        readingOrderSummary[cond][item.aoiId].ranks.push(item.rank);
        readingOrderSummary[cond][item.aoiId].ttffs.push(item.ttffSec);
      });
    });
  });

  function summarizeOrder(map) {
    return Object.values(map).map(item => ({
      aoiId: item.aoiId,
      label: item.label,
      meanRank: parseFloat((item.ranks.reduce((a, b) => a + b, 0) / item.ranks.length).toFixed(2)),
      meanTTFF: parseFloat((item.ttffs.reduce((a, b) => a + b, 0) / item.ttffs.length).toFixed(2)),
      sampleCount: item.ranks.length
    })).sort((a, b) => a.meanRank - b.meanRank);
  }

  const orderCtrl = summarizeOrder(readingOrderSummary.control);
  const orderExp = summarizeOrder(readingOrderSummary.experiment);

  const compactMetricsJson = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalParticipants: participantResults.length,
      groupA_Count: participantResults.filter(p => p.group === 'A').length,
      groupB_Count: participantResults.filter(p => p.group === 'B').length
    },
    hypothesisTesting: {
      overall: overallStats,
      groupA: groupA_Stats,
      groupB: groupB_Stats
    },
    fourDimensions: {
      readingOrder: {
        control: orderCtrl,
        experiment: orderExp
      },
      switchingFrequency: overallStats.switchingFrequency,
      saccadeDynamics: {
        saccadeRate: overallStats.saccadeRate,
        saccadeAmplitude: overallStats.saccadeAmplitude
      },
      reReadingBehavior: overallStats.reReadingRatio
    },
    participants: participantResults
  };

  fs.writeFileSync(path.join(OUTPUT_DIR, 'academic_metrics_summary.json'), JSON.stringify(compactMetricsJson, null, 2), 'utf8');

  console.log('✅ 4 维深度眼动分析与结构化数据完成！');
  return compactMetricsJson;
}

runAnalytics();
