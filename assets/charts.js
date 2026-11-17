(function () {
  'use strict';

  if (!window.echarts || !window.POKEDEX) return;

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var DATA = window.POKEDEX;

  // ---- type distribution ----
  var typeCount = {};
  DATA.forEach(function (d) {
    d.types.forEach(function (t) { typeCount[t] = (typeCount[t] || 0) + 1; });
  });
  var typeRows = Object.keys(typeCount).map(function (k) { return [k, typeCount[k]]; });
  typeRows.sort(function (a, b) { return a[1] - b[1]; });

  var elTypes = document.getElementById('chart-types');
  if (elTypes) {
    var c1 = echarts.init(elTypes, null, { renderer: 'svg' });
    c1.setOption({
      animation: false,
      grid: { left: 56, right: 44, top: 12, bottom: 28 },
      tooltip: { appendToBody: true, trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontFamily: 'JetBrains Mono' }
      },
      yAxis: {
        type: 'category',
        data: typeRows.map(function (r) { return r[0]; }),
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: { color: ink }
      },
      series: [{
        type: 'bar',
        data: typeRows.map(function (r) { return r[1]; }),
        barWidth: '62%',
        itemStyle: { color: accent, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: muted, fontFamily: 'JetBrains Mono', fontSize: 10 }
      }]
    });
    window.addEventListener('resize', function () { c1.resize(); });
  }

  // ---- generation composition ----
  var genCount = {};
  DATA.forEach(function (d) { genCount[d.gen] = (genCount[d.gen] || 0) + 1; });
  var gens = Object.keys(genCount).map(Number).sort(function (a, b) { return a - b; });

  var elGens = document.getElementById('chart-gens');
  if (elGens) {
    var c2 = echarts.init(elGens, null, { renderer: 'svg' });
    c2.setOption({
      animation: false,
      grid: { left: 40, right: 16, top: 16, bottom: 34 },
      tooltip: { appendToBody: true, trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: gens.map(function (g) { return '第' + g + '世代'; }),
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: { color: muted, fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: rule } },
        axisLabel: { color: muted, fontFamily: 'JetBrains Mono' }
      },
      series: [{
        type: 'bar',
        data: gens.map(function (g) { return genCount[g]; }),
        barWidth: '46%',
        itemStyle: { color: accent2, borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', color: muted, fontFamily: 'JetBrains Mono', fontSize: 10 }
      }]
    });
    window.addEventListener('resize', function () { c2.resize(); });
  }
})();
