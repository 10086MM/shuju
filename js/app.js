/* ===== js/charts.js ===== */
(function () {
  var FONT = '"Noto Serif SC", serif';
  var TEXT = 'rgba(240,235,225,0.78)';
  var TEXT_DIM = 'rgba(240,235,225,0.55)';
  var GRID = 'rgba(240,235,225,0.12)';
  var echartsPool = {};
  var visitorChartInstance = null;

  function disposeEcharts(id) {
    if (echartsPool[id]) {
      echartsPool[id].dispose();
      delete echartsPool[id];
    }
  }

  function getEchart(dom, forceRecreate) {
    if (!dom || typeof echarts === 'undefined') return null;

    var existing = echarts.getInstanceByDom(dom) || echartsPool[dom.id];
    if (existing && !forceRecreate) {
      echartsPool[dom.id] = existing;
      try { existing.resize(); } catch (e) { /* ignore */ }
      return existing;
    }

    disposeEcharts(dom.id);
    if (dom.clientWidth < 8 || dom.clientHeight < 8) {
      return null;
    }

    echartsPool[dom.id] = echarts.init(dom, null, { renderer: 'canvas' });
    return echartsPool[dom.id];
  }

  function ensureChart(dom, initFn) {
    if (!dom) return;
    try {
      if (dom.clientWidth < 8 || dom.clientHeight < 8) {
        dom.dataset.chartReady = '0';
        return;
      }
      initFn(dom);
      dom.dataset.chartReady = '1';
    } catch (err) {
      console.error('[charts]', dom.id || dom, err);
      dom.dataset.chartReady = '0';
    }
  }

  function resizeAllCharts() {
    Object.keys(echartsPool).forEach(function (id) {
      var inst = echartsPool[id];
      if (!inst) return;
      try { inst.resize(); } catch (e) { /* ignore */ }
    });
    if (visitorChartInstance) {
      try { visitorChartInstance.resize(); } catch (e) { /* ignore */ }
    }
  }

  function axisStyle() {
    return {
      axisLine: { lineStyle: { color: GRID } },
      axisTick: { show: false },
      axisLabel: { color: TEXT, fontFamily: FONT, fontSize: 17 },
      nameTextStyle: { color: TEXT_DIM, fontFamily: FONT, fontSize: 15 },
      splitLine: { lineStyle: { color: GRID } }
    };
  }

  function initFestivalPie(dom) {
    var chart = getEchart(dom);
    if (!chart) return;

    var INK = 'rgba(61, 43, 31, 0.88)';
    var INK_SOFT = 'rgba(61, 43, 31, 0.62)';

    chart.setOption({
      backgroundColor: 'transparent',
      textStyle: { fontFamily: FONT, color: INK },
      tooltip: {
        trigger: 'item',
        formatter: '{b}<br/>{c}%（{d}%）',
        textStyle: { fontFamily: FONT, fontSize: 15 }
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        textStyle: { color: INK, fontSize: 15, fontFamily: FONT },
        itemWidth: 16,
        itemHeight: 16,
        itemGap: 18
      },
      series: [{
        name: '节庆类型',
        type: 'pie',
        radius: ['38%', '64%'],
        center: ['50%', '44%'],
        padAngle: 2,
        data: [
          { value: 45, name: '十月年（秋收谢神·规模最大）' },
          { value: 30, name: '昂玛突（春耕祭祀）' },
          { value: 25, name: '苦扎扎（田间管护）' }
        ],
        color: ['#6b4a2e', '#d4a84b', '#c4885a'],
        label: {
          show: true,
          position: 'outside',
          formatter: '{c}%',
          color: INK,
          fontSize: 16,
          fontFamily: FONT,
          fontWeight: 600
        },
        labelLine: {
          show: true,
          length: 14,
          length2: 10,
          lineStyle: { color: INK_SOFT, width: 1 }
        },
        itemStyle: {
          borderRadius: 8,
          borderColor: 'rgba(245, 239, 230, 0.9)',
          borderWidth: 2
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: { fontSize: 18 }
        }
      }]
    });
  }

  function initVillageBox(dom) {
    var chart = getEchart(dom);
    if (!chart) return;

    var INK = 'rgba(61, 43, 31, 0.88)';
    var INK_SOFT = 'rgba(61, 43, 31, 0.55)';
    var GRID_LIGHT = 'rgba(61, 43, 31, 0.12)';
    var HINT_IDLE = '点击图例即可查看单项数据';
    var HINT_FOCUS = '再次点击即可返回';

    var xData = ['昂玛突', '苦扎扎', '十月年', '甲寅咪田'];
    var tableBoxData = [
      [255, 280, 300, 320, 345],
      [50, 65, 85, 105, 120],
      [30, 42, 55, 68, 80],
      [100, 112, 125, 138, 150]
    ];
    var userBoxData = [
      [850, 920, 1000, 1080, 1150],
      [200, 300, 400, 500, 600],
      [150, 210, 275, 330, 400],
      [500, 580, 650, 720, 800]
    ];

    var visibility = { showTables: true, showPeople: true };

    var hintEl = document.getElementById('chart-village-box-hint');
    if (!hintEl) {
      hintEl = document.createElement('p');
      hintEl.id = 'chart-village-box-hint';
      hintEl.className = 'chart-legend-hint';
      var wrap = dom.closest('.chart-block') || dom.parentElement;
      if (wrap) wrap.appendChild(hintEl);
    }

    function updateHint() {
      if (!hintEl) return;
      var focused = !(visibility.showTables && visibility.showPeople);
      hintEl.textContent = focused ? HINT_FOCUS : HINT_IDLE;
    }

    function lightAxis() {
      return {
        axisLine: { show: true, lineStyle: { color: INK_SOFT, width: 1.5 } },
        axisTick: { show: true, lineStyle: { color: INK_SOFT } },
        axisLabel: { color: INK, fontFamily: FONT, fontSize: 15 },
        nameTextStyle: { color: INK_SOFT, fontFamily: FONT, fontSize: 14 },
        splitLine: { show: true, lineStyle: { color: GRID_LIGHT } }
      };
    }

    function buildLegendData() {
      var items = [];
      if (visibility.showTables) {
        items.push({ name: '宴席桌数', icon: 'rect', itemStyle: { color: '#9a7ec8' } });
      }
      if (visibility.showPeople) {
        items.push({ name: '参与人数', icon: 'rect', itemStyle: { color: '#6a9e6a' } });
      }
      return items;
    }

    function applyVisibility() {
      var legendData = buildLegendData();
      var selected = {};
      legendData.forEach(function (item) {
        selected[item.name] = true;
      });
      chart.setOption({
        legend: { data: legendData, selected: selected },
        yAxis: [
          {
            show: visibility.showTables,
            name: visibility.showTables ? '宴席桌数' : ''
          },
          {
            show: visibility.showPeople,
            name: visibility.showPeople ? '参与人数' : '',
            splitLine: { show: false }
          }
        ],
        series: [
          { id: 'village-tables', data: visibility.showTables ? tableBoxData : [] },
          { id: 'village-people', data: visibility.showPeople ? userBoxData : [] }
        ]
      });
      updateHint();
    }

    var axis = lightAxis();

    chart.setOption({
      backgroundColor: 'transparent',
      textStyle: { fontFamily: FONT, color: INK },
      tooltip: {
        trigger: 'item',
        textStyle: { fontFamily: FONT, fontSize: 15, color: INK },
        formatter: function (params) {
          if (!params || !params.value) return '';
          var v = params.value;
          return params.seriesName + ' · ' + params.name +
            '<br/>最小值：' + v[1] +
            '<br/>下四分位：' + v[2] +
            '<br/>中位数：' + v[3] +
            '<br/>上四分位：' + v[4] +
            '<br/>最大值：' + v[5];
        }
      },
      legend: {
        data: buildLegendData(),
        bottom: 28,
        left: 'center',
        textStyle: { color: INK, fontSize: 16, fontFamily: FONT },
        itemWidth: 18,
        itemHeight: 18,
        itemGap: 28,
        selectedMode: true
      },
      grid: { left: '8%', right: '10%', top: '12%', bottom: '22%', containLabel: true },
      xAxis: Object.assign({
        type: 'category',
        data: xData,
        boundaryGap: true
      }, axis),
      yAxis: [
        Object.assign({
          type: 'value',
          name: '宴席桌数',
          min: 0,
          max: 375,
          interval: 75
        }, axis),
        Object.assign({
          type: 'value',
          name: '参与人数',
          min: 0,
          max: 1250,
          interval: 250,
          splitLine: { show: false }
        }, axis)
      ],
      series: [
        {
          id: 'village-tables',
          name: '宴席桌数',
          type: 'boxplot',
          yAxisIndex: 0,
          data: tableBoxData,
          itemStyle: { color: 'rgba(154,126,200,0.35)', borderColor: '#9a7ec8', borderWidth: 2 },
          emphasis: { itemStyle: { borderColor: '#b8a0e0', borderWidth: 2 } }
        },
        {
          id: 'village-people',
          name: '参与人数',
          type: 'boxplot',
          yAxisIndex: 1,
          data: userBoxData,
          itemStyle: { color: 'rgba(106,158,106,0.35)', borderColor: '#6a9e6a', borderWidth: 2 },
          emphasis: { itemStyle: { borderColor: '#8bc48b', borderWidth: 2 } }
        }
      ]
    });

    updateHint();

    chart.off('legendselectchanged');
    chart.on('legendselectchanged', function (params) {
      if (params.name === '宴席桌数') {
        if (visibility.showTables && visibility.showPeople) {
          visibility.showPeople = false;
        } else if (visibility.showTables && !visibility.showPeople) {
          visibility.showPeople = true;
        } else {
          visibility.showTables = true;
          visibility.showPeople = false;
        }
      } else if (params.name === '参与人数') {
        if (visibility.showTables && visibility.showPeople) {
          visibility.showTables = false;
        } else if (!visibility.showTables && visibility.showPeople) {
          visibility.showTables = true;
        } else {
          visibility.showPeople = true;
          visibility.showTables = false;
        }
      }
      applyVisibility();
    });
  }

  function initLuchunBars(dom) {
    var chart = getEchart(dom);
    if (!chart) return;

    var INK = 'rgba(61, 43, 31, 0.88)';
    var INK_SOFT = 'rgba(61, 43, 31, 0.55)';
    var GRID_LIGHT = 'rgba(61, 43, 31, 0.12)';
    var HINT_IDLE = '点击图例即可查看单项数据';
    var HINT_FOCUS = '再次点击即可返回';

    var yearList = ['2025', '2024', '2023', '2004'];
    var tableData = [3265, 3200, 4065, 2041];
    var peopleData = [13, 11.62, 12, 3];
    var TABLE_UNIT = 100;
    var PERSON_UNIT = 1;
    var ICON_SIZE = 18;
    var ICON_GAP = 2;
    var LABEL_RESERVE = 78;
    var TABLE_ICON = 'image/chart-icon-table.svg';
    var PERSON_ICON = 'image/chart-icon-person.svg';
    var TABLE_LEGEND = 'image://image/chart-icon-table.svg';
    var PERSON_LEGEND = 'image://image/chart-icon-person.svg';

    var tableIconCounts = tableData.map(function (v) {
      return Math.floor(v / TABLE_UNIT);
    });
    var peopleIconCounts = peopleData.map(function (v) {
      return Math.floor(v / PERSON_UNIT);
    });
    var maxTableIcons = Math.max.apply(null, tableIconCounts);
    var maxPeopleIcons = Math.max.apply(null, peopleIconCounts);
    var maxIcons = Math.max(maxTableIcons, maxPeopleIcons);

    var hintEl = document.getElementById('chart-luchun-bars-hint');
    if (!hintEl) {
      hintEl = document.createElement('p');
      hintEl.id = 'chart-luchun-bars-hint';
      hintEl.className = 'chart-legend-hint';
      var wrap = dom.closest('.chart-block') || dom.parentElement;
      if (wrap) wrap.appendChild(hintEl);
    }

    function updateHint() {
      if (!hintEl) return;
      var focused = !(luchunVisibility.showTables && luchunVisibility.showPeople);
      hintEl.textContent = focused ? HINT_FOCUS : HINT_IDLE;
    }

    function buildSeriesData(counts, rawValues) {
      return counts.map(function (count, i) {
        return [i, count, rawValues[i]];
      });
    }

    function formatValue(rawValue, isPeople) {
      var rawText = Number(rawValue);
      var num = Number.isInteger(rawText) ? String(rawText) : rawText.toFixed(2);
      return isPeople ? num + ' 万' : num + ' 桌';
    }

    function makePictorialRender(iconUrl, yShift, isPeople) {
      return function (params, api) {
        var iconCount = api.value(1);
        var rawValue = api.value(2);
        var catIdx = api.value(0);
        var origin = api.coord([0, catIdx]);
        var children = [];
        var plotWidth = api.size([maxIcons, 0])[0];
        var usable = Math.max(80, plotWidth - LABEL_RESERVE);
        var step = usable / Math.max(maxIcons, 1);
        var size = Math.max(10, Math.min(ICON_SIZE, step - 1));

        for (var i = 0; i < iconCount; i++) {
          children.push({
            type: 'image',
            style: {
              image: iconUrl,
              x: origin[0] + i * step,
              y: origin[1] - size / 2 + yShift,
              width: size,
              height: size
            }
          });
        }

        children.push({
          type: 'text',
          style: {
            text: formatValue(rawValue, isPeople),
            x: origin[0] + plotWidth - 4,
            y: origin[1] + yShift,
            fill: INK,
            font: '600 14px "Noto Serif SC", serif',
            textAlign: 'right',
            textVerticalAlign: 'middle'
          }
        });

        return { type: 'group', children: children };
      };
    }

    var tableSeriesData = buildSeriesData(tableIconCounts, tableData);
    var peopleSeriesData = buildSeriesData(peopleIconCounts, peopleData);
    var luchunVisibility = { showTables: true, showPeople: true };

    function buildLegendData() {
      var items = [];
      if (luchunVisibility.showTables) {
        items.push({ name: '宴席桌数（桌）', icon: TABLE_LEGEND });
      }
      if (luchunVisibility.showPeople) {
        items.push({ name: '参与人次（万）', icon: PERSON_LEGEND });
      }
      return items;
    }

    function applyLuchunVisibility() {
      var legendData = buildLegendData();
      var selected = {};
      legendData.forEach(function (item) {
        selected[item.name] = true;
      });
      chart.setOption({
        legend: { data: legendData, selected: selected },
        series: [
          { id: 'luchun-table-icons', data: luchunVisibility.showTables ? tableSeriesData : [] },
          { id: 'luchun-people-icons', data: luchunVisibility.showPeople ? peopleSeriesData : [] }
        ]
      });
      updateHint();
    }

    chart.setOption({
      backgroundColor: 'transparent',
      textStyle: { fontFamily: FONT, color: INK },
      tooltip: {
        trigger: 'item',
        textStyle: { fontFamily: FONT, fontSize: 15 },
        formatter: function (params) {
          if (!params.value) return '';
          var raw = params.value[2];
          var unit = params.seriesId === 'luchun-table-icons'
            ? '桌（每图标代表 ' + TABLE_UNIT + ' 桌）'
            : '万人次（每图标代表 ' + PERSON_UNIT + ' 万）';
          return params.seriesName + '<br/>' + yearList[params.value[0]] + '年：' + raw + unit;
        }
      },
      legend: {
        data: buildLegendData(),
        bottom: 8,
        left: 'center',
        textStyle: { color: INK, fontSize: 16, fontFamily: FONT },
        itemWidth: 22,
        itemHeight: 22,
        itemGap: 28
      },
      grid: { left: 12, right: 12, top: 24, bottom: 56, containLabel: true },
      yAxis: {
        type: 'category',
        data: yearList,
        inverse: false,
        axisLine: { show: true, lineStyle: { color: INK_SOFT, width: 1.5 } },
        axisTick: { show: true, lineStyle: { color: INK_SOFT } },
        axisLabel: {
          color: INK,
          fontFamily: FONT,
          fontSize: 16,
          formatter: function (v) { return v + '年'; }
        },
        splitLine: { show: false }
      },
      xAxis: {
        type: 'value',
        min: 0,
        max: maxIcons,
        axisLine: { show: true, lineStyle: { color: INK_SOFT, width: 1.5 } },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: true, lineStyle: { color: GRID_LIGHT, type: 'dashed' } }
      },
      series: [
        {
          id: 'luchun-table-icons',
          name: '宴席桌数（桌）',
          type: 'custom',
          renderItem: makePictorialRender(TABLE_ICON, -12, false),
          encode: { x: 1, y: 0 },
          data: tableSeriesData,
          z: 2
        },
        {
          id: 'luchun-people-icons',
          name: '参与人次（万）',
          type: 'custom',
          renderItem: makePictorialRender(PERSON_ICON, 12, true),
          encode: { x: 1, y: 0 },
          data: peopleSeriesData,
          z: 2
        }
      ]
    });

    updateHint();

    chart.off('legendselectchanged');
    chart.on('legendselectchanged', function (params) {
      if (params.name === '宴席桌数（桌）') {
        if (luchunVisibility.showTables && luchunVisibility.showPeople) {
          luchunVisibility.showPeople = false;
        } else if (luchunVisibility.showTables && !luchunVisibility.showPeople) {
          luchunVisibility.showPeople = true;
        } else {
          luchunVisibility.showTables = true;
          luchunVisibility.showPeople = false;
        }
      } else if (params.name === '参与人次（万）') {
        if (luchunVisibility.showTables && luchunVisibility.showPeople) {
          luchunVisibility.showTables = false;
        } else if (!luchunVisibility.showTables && luchunVisibility.showPeople) {
          luchunVisibility.showTables = true;
        } else {
          luchunVisibility.showPeople = true;
          luchunVisibility.showTables = false;
        }
      }
      applyLuchunVisibility();
    });
  }

  function initRegionDonut(dom) {
    var chart = getEchart(dom);
    if (!chart) return;

    var INK = 'rgba(61, 43, 31, 0.88)';
    var regions = [
      { name: '核心区（红河4县）', value: 45, color: '#e8c96a' },
      { name: '辐射区（普洱/建水）', value: 30, color: '#6a9e6a' },
      { name: '复刻区（景区展演）', value: 25, color: '#5a8ec4' }
    ];

    chart.setOption({
      backgroundColor: 'transparent',
      textStyle: { fontFamily: FONT, color: INK },
      tooltip: {
        trigger: 'item',
        formatter: '{b}<br/>占比：{c}%（{d}%）',
        textStyle: { fontFamily: FONT, fontSize: 15 }
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        textStyle: { color: INK, fontSize: 15, fontFamily: FONT },
        itemWidth: 16,
        itemHeight: 16,
        itemGap: 18,
        data: regions.map(function (r) { return r.name; })
      },
      series: [{
        name: '地域分布',
        type: 'pie',
        radius: '62%',
        center: ['50%', '44%'],
        padAngle: 1.5,
        data: regions.map(function (r) {
          return {
            name: r.name,
            value: r.value,
            itemStyle: { color: r.color }
          };
        }),
        label: {
          show: true,
          position: 'inside',
          formatter: '{c}%',
          color: INK,
          fontSize: 18,
          fontFamily: FONT,
          fontWeight: 700
        },
        labelLine: { show: false },
        itemStyle: {
          borderRadius: 4,
          borderColor: 'rgba(245, 239, 230, 0.92)',
          borderWidth: 2
        },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: { fontSize: 20 }
        }
      }]
    });
  }

  var pointValueLabelsPlugin = {
    id: 'pointValueLabels',
    afterDatasetsDraw: function (chart) {
      if (chart.canvas.id !== 'chart-visitor-line') return;
      var ctx = chart.ctx;
      var dataset = chart.data.datasets[0];
      var meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data) return;
      meta.data.forEach(function (point, i) {
        if (!point || point.skip) return;
        ctx.save();
        ctx.fillStyle = '#4a3c31';
        ctx.font = '600 17px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        var val = Number(dataset.data[i]);
        var text = Number.isInteger(val) ? String(val) : val.toFixed(2);
        ctx.fillText(text, point.x, point.y - 14);
        ctx.restore();
      });
    }
  };

  // 蓝色折线/填充向左右延展至绘图区边缘；数据点仍由 x.offset 保持不贴边
  var extendedBlueAreaPlugin = {
    id: 'extendedBlueArea',
    beforeDatasetsDraw: function (chart) {
      if (chart.canvas.id !== 'chart-visitor-line') return;
      var meta = chart.getDatasetMeta(0);
      var area = chart.chartArea;
      if (!meta || !meta.data || !meta.data.length || !area) return;

      var pts = meta.data.filter(function (p) { return p && !p.skip; });
      if (pts.length < 2) return;

      var first = pts[0];
      var last = pts[pts.length - 1];
      var ctx = chart.ctx;
      var fill = 'rgba(122, 184, 200, 0.12)';
      var stroke = '#7ab8c8';

      ctx.save();
      // 左侧延伸填充
      ctx.beginPath();
      ctx.moveTo(area.left, first.y);
      ctx.lineTo(first.x, first.y);
      ctx.lineTo(first.x, area.bottom);
      ctx.lineTo(area.left, area.bottom);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      // 右侧延伸填充
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(area.right, last.y);
      ctx.lineTo(area.right, area.bottom);
      ctx.lineTo(last.x, area.bottom);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      // 左右水平折线延伸
      ctx.beginPath();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;
      ctx.moveTo(area.left, first.y);
      ctx.lineTo(first.x, first.y);
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(area.right, last.y);
      ctx.stroke();
      ctx.restore();
    }
  };

  var avgLineValuePlugin = {
    id: 'avgLineValueLabel',
    afterDatasetsDraw: function (chart) {
      if (chart.canvas.id !== 'chart-visitor-line') return;
      var yScale = chart.scales.y;
      var area = chart.chartArea;
      if (!yScale || !area) return;
      var avg = chart.data.datasets[1] && chart.data.datasets[1].data[0];
      if (avg == null) return;
      var y = yScale.getPixelForValue(avg);
      var ctx = chart.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#e8a04a';
      ctx.lineWidth = 2;
      ctx.moveTo(area.left, y);
      ctx.lineTo(area.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e8a04a';
      ctx.font = '600 17px "Noto Serif SC", serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(Number(avg).toFixed(2), area.right - 44, y);
      ctx.restore();
    }
  };

  function drawVisitorLine(canvas) {
    if (typeof Chart === 'undefined') return;
    if (canvas.clientWidth < 8 || canvas.clientHeight < 8) return;

    if (visitorChartInstance) {
      try { visitorChartInstance.resize(); } catch (e) { /* ignore */ }
      return;
    }

    var avg = 12.21;
    var tickFont = { family: FONT, size: 17 };
    var axisColor = 'rgba(61, 52, 40, 0.72)';
    var gridColor = 'rgba(61, 52, 40, 0.12)';

    visitorChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['2023', '2024', '2025'],
        datasets: [
          {
            label: '参与人次（万）',
            data: [12, 11.62, 13],
            borderColor: '#7ab8c8',
            backgroundColor: 'rgba(122, 184, 200, 0.12)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#7ab8c8',
            pointBorderColor: '#7ab8c8',
            order: 1
          },
          {
            label: '平均参与人数（万人次）',
            data: [avg, avg, avg],
            borderColor: '#e8a04a',
            backgroundColor: 'transparent',
            borderDash: [6, 4],
            borderWidth: 2,
            showLine: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            order: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 28, left: 56, right: 32, bottom: 8 } },
        scales: {
          y: {
            min: 10,
            max: 15,
            grid: { color: gridColor },
            border: { display: false },
            ticks: { color: axisColor, font: tickFont, stepSize: 1 },
            title: { display: true, text: '参与人次（万）', color: axisColor, font: tickFont }
          },
          x: {
            offset: true,
            grid: { display: false },
            border: { display: false },
            ticks: { color: axisColor, font: { family: FONT, size: 18 }, padding: 8 }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            align: 'center',
            labels: {
              color: axisColor,
              font: tickFont,
              boxWidth: 32,
              padding: 18,
              filter: function (item) {
                return item.datasetIndex === 1;
              }
            }
          },
          tooltip: {
            filter: function (item) {
              return item.datasetIndex === 0;
            },
            callbacks: {
              label: function (ctx) {
                return '参与人次：' + ctx.raw + ' 万';
              }
            }
          }
        }
      },
      plugins: [extendedBlueAreaPlugin, pointValueLabelsPlugin, avgLineValuePlugin]
    });
  }

  function init() {
    ensureChart(document.getElementById('chart-festival-pie'), initFestivalPie);
    ensureChart(document.getElementById('chart-village-box'), initVillageBox);
    ensureChart(document.getElementById('chart-luchun-bars'), initLuchunBars);
    ensureChart(document.getElementById('chart-visitor-line'), drawVisitorLine);
    ensureChart(document.getElementById('chart-region-donut'), initRegionDonut);
    window.setTimeout(resizeAllCharts, 120);
    window.setTimeout(resizeAllCharts, 480);
  }

  function scheduleInitWhenVisible() {
    var targets = [
      'chart-festival-pie',
      'chart-village-box',
      'chart-luchun-bars',
      'chart-visitor-line',
      'chart-region-donut'
    ];

    init();

    if (typeof IntersectionObserver === 'undefined') return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.dataset.chartReady === '1') {
          resizeAllCharts();
          return;
        }
        init();
      });
    }, { threshold: [0.05, 0.2] });

    targets.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleInitWhenVisible);
  } else {
    scheduleInitWhenVisible();
  }

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      resizeAllCharts();
      init();
    }, 180);
  });

  window.HaniCharts = {
    init: init,
    resize: resizeAllCharts
  };
})();


/* ===== js/horizontal-story.js ===== */
(function () {
  var DESKTOP_MIN = 1024;
  var track = document.getElementById('story-track');
  var nav = document.getElementById('story-nav');
  if (!track) return;

  var panels = Array.prototype.slice.call(track.querySelectorAll('.story-panel'));
  var navItems = nav
    ? Array.prototype.slice.call(nav.querySelectorAll('.story-nav__item'))
    : [];

  function isStoryMode() {
    return window.innerWidth >= DESKTOP_MIN;
  }

  function enableStoryMode() {
    document.documentElement.classList.toggle('story-layered', isStoryMode());
    if (isStoryMode()) {
      window.setTimeout(resizeCharts, 400);
      observePanels();
    }
  }

  function resizeCharts() {
    if (window.HaniCharts && typeof window.HaniCharts.resize === 'function') {
      window.HaniCharts.resize();
      return;
    }
    if (typeof echarts === 'undefined') return;
    document.querySelectorAll('.chart-echarts').forEach(function (el) {
      var inst = echarts.getInstanceByDom(el);
      if (inst) inst.resize();
    });
  }

  function activeIndex() {
    var mid = window.scrollY + window.innerHeight * 0.42;
    var idx = 0;
    panels.forEach(function (panel, i) {
      var top = panel.offsetTop;
      if (top <= mid) idx = i;
    });
    return idx;
  }

  function panelScrollEl(panel) {
    return panel.querySelector('.story-panel__scroll');
  }

  function goToPanel(index) {
    if (index < 0 || index >= panels.length) return;
    var top = panels[index].offsetTop;
    window.scrollTo({ top: top, behavior: 'smooth' });
    setActiveNav(index);
  }

  function setActiveNav(index) {
    navItems.forEach(function (item, i) {
      item.classList.toggle('is-active', i === index);
    });
  }

  function nearestScrollable(target) {
    return target.closest('.story-panel__scroll');
  }

  function canScrollVertically(el, delta) {
    if (!el || el.scrollHeight <= el.clientHeight) return false;
    if (delta > 0) {
      return el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    }
    return el.scrollTop > 2;
  }

  var panelObserver = null;

  function observePanels() {
    if (!isStoryMode() || typeof IntersectionObserver === 'undefined') return;

    if (panelObserver) {
      panelObserver.disconnect();
    }

    panelObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-inview', entry.intersectionRatio >= 0.52);
      });
    }, { threshold: [0, 0.35, 0.52, 0.75, 1] });

    panels.forEach(function (panel) {
      panelObserver.observe(panel);
    });
  }

  var scrollRaf = 0;
  window.addEventListener('scroll', function () {
    if (!isStoryMode()) return;
    if (scrollRaf) return;
    scrollRaf = window.requestAnimationFrame(function () {
      scrollRaf = 0;
      setActiveNav(activeIndex());
    });
  }, { passive: true });

  function currentPanelInner() {
    var idx = activeIndex();
    var panel = panels[idx];
    if (!panel) return null;
    var inner = panelScrollEl(panel);
    if (inner) return inner;
    return document.activeElement && nearestScrollable(document.activeElement);
  }

  document.addEventListener('keydown', function (event) {
    if (!isStoryMode()) return;
    var idx = activeIndex();
    var inner = currentPanelInner();

    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      if (inner && canScrollVertically(inner, 1)) return;
      event.preventDefault();
      goToPanel(idx + 1);
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      if (inner && canScrollVertically(inner, -1)) return;
      event.preventDefault();
      goToPanel(idx - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      goToPanel(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      goToPanel(panels.length - 1);
    }
  });

  var wheelLock = false;
  var wheelUnlockTimer = 0;

  function canScrollHorizontally(el, delta) {
    if (!el || el.scrollWidth <= el.clientWidth + 2) return false;
    if (delta > 0) {
      return el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    }
    return el.scrollLeft > 2;
  }

  function nearestHorizontalScroll(target) {
    var el = target;
    while (el && el !== document.body) {
      if (el.scrollWidth > el.clientWidth + 2) {
        var ox = window.getComputedStyle(el).overflowX;
        if (ox === 'auto' || ox === 'scroll' || el.classList.contains('pattern-coverflow__viewport')) {
          return el;
        }
      }
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener('wheel', function (event) {
    if (!isStoryMode()) return;
    if (wheelLock) {
      event.preventDefault();
      return;
    }

    var horiz = nearestHorizontalScroll(event.target);
    if (horiz) {
      var hDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (hDelta && canScrollHorizontally(horiz, hDelta)) {
        event.preventDefault();
        horiz.scrollLeft += hDelta;
        return;
      }
    }

    var direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
    if (!direction) return;

    var inner = currentPanelInner();
    if (inner && canScrollVertically(inner, direction)) return;

    var idx = activeIndex();
    var next = idx + direction;
    if (next < 0 || next >= panels.length) return;

    event.preventDefault();
    wheelLock = true;
    if (wheelUnlockTimer) window.clearTimeout(wheelUnlockTimer);
    goToPanel(next);
    wheelUnlockTimer = window.setTimeout(function () {
      wheelLock = false;
      wheelUnlockTimer = 0;
    }, 700);
  }, { passive: false });

  navItems.forEach(function (item, index) {
    item.addEventListener('click', function (event) {
      event.preventDefault();
      goToPanel(index);
    });
  });

  var coverStartBtn = document.getElementById('cover-start-btn');
  if (coverStartBtn) {
    coverStartBtn.addEventListener('click', function () {
      goToPanel(1);
    });
  }

  /* 封面花纹：正中央对称整体约占界面 70%，5 秒后向两侧拉开并缩回；文字渐显 */
  (function initCoverOrnaments() {
    var cover = document.querySelector('.cover-screen');
    var left = cover && cover.querySelector('.cover-screen__ornament--left');
    var right = cover && cover.querySelector('.cover-screen__ornament--right');
    var title = cover && cover.querySelector('.cover-screen__title');
    var hook = cover && cover.querySelector('.cover-screen__hook');
    if (!cover || !left || !right || !title || !hook) return;

    var started = false;
    var scheduled = false;
    var resizeTimer = 0;
    var MOVE_DELAY_MS = 5000;

    function placeSymmetric() {
      var coverRect = cover.getBoundingClientRect();
      var edge = Math.max(10, Math.round(coverRect.width * 0.022));
      var centerTop = Math.round(coverRect.height / 2);
      /* 对称整体高度 ≈ 封面高度的 70% */
      var startH = Math.round(coverRect.height * 0.7);

      cover.style.setProperty('--cover-ornament-start-h', startH + 'px');
      cover.style.setProperty('--cover-ornament-left-start', '50%');
      cover.style.setProperty('--cover-ornament-right-start', '50%');
      cover.style.setProperty('--cover-ornament-start-top', centerTop + 'px');
      cover.style.setProperty('--cover-ornament-end-top', centerTop + 'px');
      cover.style.setProperty('--cover-ornament-left-end', edge + 'px');
      cover.style.setProperty('--cover-ornament-right-end-left', 'calc(100% - ' + edge + 'px)');
    }

    function showAtStart() {
      placeSymmetric();
      left.classList.add('is-ready');
      right.classList.add('is-ready');
    }

    function startOut() {
      if (started) return;
      started = true;
      placeSymmetric();
      requestAnimationFrame(function () {
        cover.classList.add('is-ornament-out');
        cover.classList.add('is-text-in');
      });
    }

    function scheduleMove() {
      if (scheduled) return;
      scheduled = true;
      showAtStart();
      window.setTimeout(startOut, MOVE_DELAY_MS);
    }

    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        placeSymmetric();
      }, 120);
    }

    function boot() {
      showAtStart();
      scheduleMove();
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(boot);
    } else {
      boot();
    }

    window.addEventListener('load', function () {
      placeSymmetric();
      if (!scheduled) scheduleMove();
    });
    window.addEventListener('resize', onResize);
  })();

  (function initEndpageFigures() {
    var endpage = document.querySelector('.endpage');
    if (!endpage) return;

    var risen = false;
    function rise() {
      if (risen) return;
      risen = true;
      endpage.classList.add('is-figures-rise');
    }

    if (typeof IntersectionObserver === 'undefined') {
      window.setTimeout(rise, 600);
      return;
    }

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        window.setTimeout(rise, 500);
        obs.disconnect();
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
    obs.observe(endpage);
  })();

  if (typeof IntersectionObserver !== 'undefined') {
    var chartObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          window.setTimeout(resizeCharts, 350);
        }
      });
    }, { threshold: 0.25 });
    panels.forEach(function (panel) {
      chartObserver.observe(panel);
    });
  }

  window.addEventListener('resize', function () {
    enableStoryMode();
    resizeCharts();
  });

  enableStoryMode();
  setActiveNav(0);
  if (isStoryMode() && panels[0]) {
    panels[0].classList.add('is-inview');
  }
})();


/* ===== js/pattern-gallery.js ===== */
(function () {
  var TRADITIONAL_DATA = [
    { file: '水车纹.jpg', name: '水车纹', meaning: '记录梯田灌溉智慧，承载哈尼族生产记忆。' },
    { file: '云雷纹.jpg', name: '云雷纹', meaning: '模拟哀牢山多变气候，呼应自然神秘性。' },
    { file: '太阳纹.jpg', name: '太阳纹', meaning: '崇拜万物根本，穿戴可获平安吉祥。' },
    { file: '犬齿纹.jpg', name: '犬齿纹', meaning: '纪念神狗赐粮传说，寓意辟邪祈福保平安。' },
    { file: '猫头鹰眼纹.jpg', name: '猫头鹰眼纹', meaning: '驱邪避鬼护身，多用于儿童帽饰与妇女衣襟。' },
    { file: '蝴蝶纹样.jpg', name: '蝴蝶纹', meaning: '取灵动之意，为黑色服饰增添鲜活气息。' },
    { file: '白鹇鸟纹.jpg', name: '白鹇鸟纹', meaning: '纪念救族神鸟，象征祥瑞降临。' },
    { file: '鱼纹.jpg', name: '鱼纹', meaning: '崇拜梯田鱼，象征生命富足，多见于挂饰。' },
    { file: '龙头纹.jpg', name: '龙头纹', meaning: '象征吉祥神圣，多用于银饰点缀。' },
    { file: '莲花纹.jpg', name: '莲花纹', meaning: '象征纯洁高尚，平衡服饰暗色调。' },
    { file: '蕨纹.jpg', name: '蕨纹', meaning: '取材山野野菜，体现与自然共生的生存智慧。' },
    { file: '八角花纹.jpg', name: '八角花纹', meaning: '原型为药用野草，象征顽强生命力与健康。' },
    { file: '几何纹样.jpg', name: '几何纹样', meaning: '象征秩序与理性，寓意生生不息、宇宙和谐。' },
    { file: '植物纹样.jpg', name: '植物纹样', meaning: '象征生命繁荣，寓意生机勃勃、多子多福。' },
    { file: '寿字纹.jpg', name: '寿字纹', meaning: '象征长寿安康，寓意福寿绵长、吉祥如意。' },
    { file: '卷草纹.jpg', name: '卷草纹', meaning: '象征连绵不断，寓意万代长春、吉庆有余。' },
    { file: '云气纹.jpg', name: '云气纹', meaning: '象征高升祥瑞，寓意平步青云、前程似锦。' },
    { file: '螃蟹纹.jpg', name: '螃蟹纹', meaning: '象征纵横驰骋，寓意金榜题名、富甲天下。' },
    { file: '三角纹.jpg', name: '三角纹', meaning: '象征稳定力量，寓意辟邪护身、步步高升。' }
  ];

  var INNOVATION_FILES = [
    '1d00b91cd09dad097762a53b02a4a5a2.jpg',
    '1ec1b8bec68531064c4d2e3d75582378.jpg',
    '274b07d66a03f4bad8f85e58c98fcb0b.jpg',
    '6c525a7df88990525b94964f9ef57331.jpg',
    '7df5c2f6a7ac9eeda3d8d400159760b6.jpg',
    '958101d3b08896a625b8d8f40e68ec86.jpg',
    'b3ff322331627c55feb0ea5a98bbd551.jpg',
    'db4ab697fb638d561c94f347fc28e52e.jpg',
    'f0f6f306a41669d8432395554d40ed9c.jpg'
  ];

  var INNOVATION_DATA = [
    { name: '简笔八角花', meaning: '保留八角花骨架，线条更利落，适合现代服饰留白。' },
    { name: '梯田线语', meaning: '以梯田层理为灵感，表达土地与劳作记忆。' },
    { name: '几何重组纹', meaning: '传统几何元素拆解重组，形成当代秩序感。' },
    { name: '色块图腾', meaning: '放大单一图腾符号，强化视觉识别与品牌感。' },
    { name: '渐变云雷', meaning: '云雷纹简化并渐变处理，适配潮流面料。' },
    { name: '折线犬齿', meaning: '犬齿纹抽象为折线，保留护佑寓意更现代。' },
    { name: '镜像太阳', meaning: '太阳纹对称延展，寓意光明与循环。' },
    { name: '织带复合纹', meaning: '多纹样拼接成织带，可用于服饰边饰。' },
    { name: '极简蕨叶', meaning: '蕨纹高度概括，强调自然与生命力。' }
  ];

  var CULTURAL_FILES = [
    '冰箱贴 (2).jpg', '冰箱贴.jpg', '手机气囊.jpg', '抱枕.jpg',
    '文件夹.jpg', '文件夹2.jpg', '明信片 (2).jpg', '明信片.jpg',
    '杯垫实拍图.jpg', '杯垫平面图.jpg', '编织袋.jpg'
  ];

  var CULTURAL_DATA = [
    { name: '冰箱贴', meaning: '日常备忘中的哈尼纹样，把记忆留在生活角落。' },
    { name: '冰箱贴', meaning: '可收藏可赠予的迷你符号，便于文化传播。' },
    { name: '手机气囊', meaning: '随身可带的纹样符号，让传统走进日常。' },
    { name: '抱枕', meaning: '居家软装中的民族色，舒适与审美并存。' },
    { name: '文件夹', meaning: '学习办公场景里的文化标识。' },
    { name: '文件夹', meaning: '纹样应用于文具，延续使用中的文化感知。' },
    { name: '明信片', meaning: '可寄可藏的梯田记忆，分享长街宴故事。' },
    { name: '明信片', meaning: '图像化叙事载体，连接外地游客与哈尼山水。' },
    { name: '杯垫', meaning: '餐桌上的纹样点缀，实用与礼仪并重。' },
    { name: '杯垫（设计稿）', meaning: '纹样产品化平面稿，便于批量生产。' },
    { name: '编织袋', meaning: '可重复使用的环保载体，纹样随行走传播。' }
  ];

  var TRADITIONAL_FOLDERS = ['image/传统纹样'];
  var INNOVATION_FOLDERS = ['image/创新纹样'];
  var CULTURAL_FOLDERS = ['image/文创产品'];

  var tooltipEl;
  var modalEl;
  var modalImg;
  var modalTitle;
  var modalMeaning;

  function encodePath(folder, file) {
    return folder.split('/').map(encodeURIComponent).join('/') + '/' + encodeURIComponent(file);
  }

  function resolveSrc(folders, file, img, opts) {
    opts = opts || {};
    if (!window.MediaLoadQueue) {
      img.src = encodePath(folders[0], file);
      return;
    }
    window.MediaLoadQueue.schedule(img, function (done) {
      var folderIndex = 0;
      var finished = false;
      function finish() {
        if (finished) return;
        finished = true;
        img.onerror = null;
        img.onload = null;
        done();
      }
      function tryNext() {
        if (folderIndex >= folders.length) {
          finish();
          return;
        }
        img.onerror = function () {
          folderIndex += 1;
          tryNext();
        };
        img.onload = finish;
        img.src = encodePath(folders[folderIndex], file);
        if (img.complete && img.naturalWidth > 0) finish();
      }
      tryNext();
    }, opts);
  }

  function ensurePatternUI() {
    if (tooltipEl) return;

    tooltipEl = document.createElement('div');
    tooltipEl.id = 'pattern-info-tooltip';
    tooltipEl.className = 'pattern-info-tooltip';
    tooltipEl.hidden = true;
    document.body.appendChild(tooltipEl);

    modalEl = document.createElement('div');
    modalEl.id = 'pattern-info-modal';
    modalEl.className = 'pattern-info-modal';
    modalEl.hidden = true;
    modalEl.innerHTML =
      '<div class="pattern-info-modal__panel" role="dialog" aria-modal="true" aria-labelledby="pattern-info-modal-title">' +
        '<button type="button" class="pattern-info-modal__close" aria-label="关闭">×</button>' +
        '<img class="pattern-info-modal__img" alt="">' +
        '<h3 class="pattern-info-modal__title" id="pattern-info-modal-title"></h3>' +
        '<p class="pattern-info-modal__meaning"></p>' +
      '</div>';
    document.body.appendChild(modalEl);

    modalImg = modalEl.querySelector('.pattern-info-modal__img');
    modalTitle = modalEl.querySelector('.pattern-info-modal__title');
    modalMeaning = modalEl.querySelector('.pattern-info-modal__meaning');

    modalEl.querySelector('.pattern-info-modal__close').addEventListener('click', closeModal);
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function showTooltip(meta, x, y) {
    tooltipEl.innerHTML = '<strong>' + meta.name + '</strong><span>' + meta.meaning + '</span>';
    tooltipEl.hidden = false;
    tooltipEl.classList.add('is-visible');
    var rect = tooltipEl.getBoundingClientRect();
    tooltipEl.style.left = Math.min(x + 14, window.innerWidth - rect.width - 12) + 'px';
    tooltipEl.style.top = Math.max(y - rect.height - 12, 8) + 'px';
  }

  function hideTooltip() {
    if (!tooltipEl) return;
    tooltipEl.classList.remove('is-visible');
    tooltipEl.hidden = true;
  }

  function openModal(meta, src, alt, folders, file) {
    ensurePatternUI();
    modalTitle.textContent = meta.name;
    modalMeaning.textContent = meta.meaning;
    modalImg.alt = alt || meta.name;
    modalEl.hidden = false;
    document.body.classList.add('pattern-modal-open');

    var url = src;
    if ((!url || !String(url).trim()) && folders && file) {
      url = encodePath(folders[0], file);
    }
    if (!url) return;

    delete modalImg.dataset.mediaQueued;
    modalImg.classList.remove('media-loaded');
    modalImg.classList.add('media-pending');
    if (window.MediaLoadQueue && typeof window.MediaLoadQueue.urgent === 'function') {
      window.MediaLoadQueue.urgent(modalImg, url);
    } else {
      modalImg.src = url;
      modalImg.classList.remove('media-pending');
      modalImg.classList.add('media-loaded');
    }
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.hidden = true;
    document.body.classList.remove('pattern-modal-open');
  }

  function bindInteractive(button, meta, img, folders, file) {
    button.addEventListener('mouseenter', function (e) {
      showTooltip(meta, e.clientX, e.clientY);
    });
    button.addEventListener('mousemove', function (e) {
      if (!tooltipEl.hidden) showTooltip(meta, e.clientX, e.clientY);
    });
    button.addEventListener('mouseleave', hideTooltip);
    button.addEventListener('click', function () {
      hideTooltip();
      var moduleEl = (img && img.closest) ? (img.closest('.pattern-showcase, .age-outfit, [data-media-module]') || img.parentElement) : null;
      if (window.MediaLoadQueue && moduleEl) {
        window.MediaLoadQueue.boost(moduleEl);
        if (img && (img.classList.contains('media-pending') || !img.currentSrc)) {
          var readySrc = folders && file ? encodePath(folders[0], file) : (img.getAttribute('data-src') || '');
          if (readySrc) window.MediaLoadQueue.urgent(img, readySrc);
        }
      }
      openModal(meta, (img && (img.currentSrc || img.src)) || (folders && file ? encodePath(folders[0], file) : ''), img && img.alt, folders, file);
    });
  }

  function buildCatalog(container) {
    buildTraditionalSpotlight(container);
  }

  function buildTraditionalSpotlight(container) {
    if (!container) return;
    ensurePatternUI();
    container.innerHTML = '';
    container.classList.add('pattern-showcase--spotlight');

    var wrap = document.createElement('div');
    wrap.className = 'pattern-spotlight';
    wrap.innerHTML =
      '<span class="pattern-showcase__tagline">✦ 聚光展台 · 19 种传统纹样</span>' +
      '<div class="pattern-spotlight__stage">' +
        '<div class="pattern-spotlight__glow"></div>' +
        '<img class="pattern-spotlight__hero-img" alt="">' +
        '<div class="pattern-spotlight__info">' +
          '<span class="pattern-spotlight__index"></span>' +
          '<h4 class="pattern-spotlight__name"></h4>' +
          '<p class="pattern-spotlight__meaning"></p>' +
        '</div>' +
      '</div>' +
      '<div class="pattern-spotlight__rail-wrap">' +
        '<p class="pattern-spotlight__rail-label">点击缩略图切换 · 大图查看寓意</p>' +
        '<div class="pattern-spotlight__rail"></div>' +
      '</div>' +
      '<p class="pattern-spotlight__hint">自动轮播中 · 悬停暂停</p>';

    container.appendChild(wrap);

    var stage = wrap.querySelector('.pattern-spotlight__stage');
    var heroImg = wrap.querySelector('.pattern-spotlight__hero-img');
    var indexEl = wrap.querySelector('.pattern-spotlight__index');
    var nameEl = wrap.querySelector('.pattern-spotlight__name');
    var meaningEl = wrap.querySelector('.pattern-spotlight__meaning');
    var rail = wrap.querySelector('.pattern-spotlight__rail');
    var activeIndex = 0;
    var timer = null;
    var paused = false;

    function showItem(index, fromUser) {
      activeIndex = index;
      var item = TRADITIONAL_DATA[index];
      stage.classList.add('is-switching');
      heroImg.classList.add('is-fade');

      setTimeout(function () {
        delete heroImg.dataset.mediaQueued;
        if (window.MediaLoadQueue) window.MediaLoadQueue.boost(container);
        resolveSrc(TRADITIONAL_FOLDERS, item.file, heroImg, { immediate: true, priority: true, boost: true });
        indexEl.textContent = String(index + 1).padStart(2, '0');
        nameEl.textContent = item.name;
        meaningEl.textContent = item.meaning;
        heroImg.classList.remove('is-fade');
        stage.classList.remove('is-switching');
      }, fromUser ? 180 : 220);

      rail.querySelectorAll('.pattern-spotlight__thumb').forEach(function (btn, i) {
        btn.classList.toggle('is-active', i === index);
      });
    }

    TRADITIONAL_DATA.forEach(function (item, index) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pattern-spotlight__thumb' + (index === 0 ? ' is-active' : '');
      btn.setAttribute('aria-label', item.name);

      var img = document.createElement('img');
      img.alt = item.name;
      img.loading = 'lazy';
      resolveSrc(TRADITIONAL_FOLDERS, item.file, img);

      btn.appendChild(img);
      btn.addEventListener('click', function () {
        if (window.MediaLoadQueue) {
          window.MediaLoadQueue.boost(container);
          if (!img.currentSrc && item.file) {
            window.MediaLoadQueue.urgent(img, encodePath(TRADITIONAL_FOLDERS[0], item.file));
          }
        }
        showItem(index, true);
        resetAuto();
      });
      btn.addEventListener('dblclick', function () {
        openModal(
          item,
          img.currentSrc || img.src,
          img.alt,
          TRADITIONAL_FOLDERS,
          item.file
        );
      });
      rail.appendChild(btn);
    });

    /* 缩略图滑到可视区时，提升本模块优先级 */
    if (typeof IntersectionObserver !== 'undefined') {
      var thumbObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (window.MediaLoadQueue) window.MediaLoadQueue.boost(container);
        });
      }, { root: rail, threshold: 0.4 });
      rail.querySelectorAll('.pattern-spotlight__thumb').forEach(function (thumb) {
        thumbObs.observe(thumb);
      });
    }

    heroImg.addEventListener('click', function () {
      var item = TRADITIONAL_DATA[activeIndex];
      openModal(
        item,
        heroImg.currentSrc || heroImg.src,
        item.name,
        TRADITIONAL_FOLDERS,
        item.file
      );
    });

    function tick() {
      if (paused) return;
      showItem((activeIndex + 1) % TRADITIONAL_DATA.length, false);
    }

    function resetAuto() {
      clearInterval(timer);
      timer = setInterval(tick, 4000);
    }

    wrap.addEventListener('mouseenter', function () { paused = true; });
    wrap.addEventListener('mouseleave', function () { paused = false; });

    showItem(0, false);
    resetAuto();
    observeAnimate(container);
  }

  function buildInnovationCoverflow(container) {
    if (!container) return;
    ensurePatternUI();
    container.innerHTML = '';
    container.classList.add('pattern-showcase--coverflow');

    var root = document.createElement('div');
    root.className = 'pattern-coverflow';
    root.innerHTML =
      '<span class="pattern-showcase__tagline">✦ 3D 流光廊 · 破圈创新纹样</span>' +
      '<div class="pattern-coverflow__shell">' +
        '<button type="button" class="pattern-coverflow__nav pattern-coverflow__nav--prev" aria-label="上一张">‹</button>' +
        '<div class="pattern-coverflow__viewport"><div class="pattern-coverflow__track"></div></div>' +
        '<button type="button" class="pattern-coverflow__nav pattern-coverflow__nav--next" aria-label="下一张">›</button>' +
      '</div>' +
      '<div class="pattern-coverflow__progress"><div class="pattern-coverflow__progress-bar"></div></div>' +
      '<p class="pattern-coverflow__hint">← 拖动 / 滚轮 / 箭头切换 · 居中卡片点击查看 →</p>';

    container.appendChild(root);

    var viewport = root.querySelector('.pattern-coverflow__viewport');
    var track = root.querySelector('.pattern-coverflow__track');
    var progressBar = root.querySelector('.pattern-coverflow__progress-bar');
    var prevBtn = root.querySelector('.pattern-coverflow__nav--prev');
    var nextBtn = root.querySelector('.pattern-coverflow__nav--next');
    var cards = [];
    var drag = { active: false, moved: false, startX: 0, scrollLeft: 0 };

    INNOVATION_FILES.forEach(function (file, index) {
      var meta = INNOVATION_DATA[index] || { name: '创新纹样', meaning: '' };
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'pattern-coverflow__card';

      var img = document.createElement('img');
      img.className = 'pattern-coverflow__img';
      img.alt = meta.name;
      img.loading = 'lazy';
      resolveSrc(INNOVATION_FOLDERS, file, img, index === 0 ? { immediate: true, priority: true } : null);

      var inner = document.createElement('div');
      inner.className = 'pattern-coverflow__card-inner';
      inner.innerHTML =
        '<div class="pattern-coverflow__cap">' +
          '<strong>' + meta.name + '</strong>' +
          '<p>' + meta.meaning + '</p>' +
        '</div>';
      inner.insertBefore(img, inner.firstChild);

      card.appendChild(inner);
      bindInteractive(card, meta, img, INNOVATION_FOLDERS, file);
      card.addEventListener('click', function (e) {
        if (drag.moved) {
          e.preventDefault();
          e.stopImmediatePropagation();
          drag.moved = false;
        }
      }, true);
      track.appendChild(card);
      cards.push(card);
    });

    function getCenterIndex() {
      var center = viewport.scrollLeft + viewport.clientWidth / 2;
      var idx = 0;
      var min = Infinity;
      cards.forEach(function (card, i) {
        var c = card.offsetLeft + card.offsetWidth / 2;
        var d = Math.abs(c - center);
        if (d < min) {
          min = d;
          idx = i;
        }
      });
      return idx;
    }

    function scrollToIndex(index, smooth) {
      var i = Math.max(0, Math.min(cards.length - 1, index));
      var card = cards[i];
      if (!card) return;
      var left = card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2;
      viewport.scrollTo({ left: left, behavior: smooth ? 'smooth' : 'auto' });
    }

    function snapToNearest() {
      scrollToIndex(getCenterIndex(), true);
    }

    function updateCoverflow() {
      var rect = viewport.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var maxDist = rect.width * 0.55;

      cards.forEach(function (card) {
        var cr = card.getBoundingClientRect();
        var dist = (cr.left + cr.width / 2 - centerX) / maxDist;
        dist = Math.max(-1, Math.min(1, dist));
        var abs = Math.abs(dist);
        var rotateY = dist * -52;
        var scale = 0.72 + (1 - abs) * 0.28;
        var translateZ = (1 - abs) * 80 - 30;
        card.style.transform = 'rotateY(' + rotateY.toFixed(1) + 'deg) translateZ(' + translateZ.toFixed(0) + 'px) scale(' + scale.toFixed(3) + ')';
        card.style.opacity = (0.35 + (1 - abs) * 0.65).toFixed(2);
        card.style.zIndex = String(Math.round((1 - abs) * 100));
        card.classList.toggle('is-center', abs < 0.15);
      });

      var scrollMax = track.scrollWidth - viewport.clientWidth;
      if (scrollMax > 0) {
        progressBar.style.width = (viewport.scrollLeft / scrollMax * 100) + '%';
      }
    }

    viewport.addEventListener('scroll', updateCoverflow, { passive: true });
    window.addEventListener('resize', updateCoverflow);

    viewport.addEventListener('pointerdown', function (e) {
      drag.active = true;
      drag.moved = false;
      drag.startX = e.clientX;
      drag.scrollLeft = viewport.scrollLeft;
      viewport.classList.add('is-dragging');
      if (viewport.setPointerCapture) viewport.setPointerCapture(e.pointerId);
    }, { capture: true });

    viewport.addEventListener('pointermove', function (e) {
      if (!drag.active) return;
      var dx = e.clientX - drag.startX;
      if (Math.abs(dx) > 5) drag.moved = true;
      viewport.scrollLeft = drag.scrollLeft - dx;
    });

    function endDrag(e) {
      if (!drag.active) return;
      drag.active = false;
      viewport.classList.remove('is-dragging');
      if (viewport.releasePointerCapture && e.pointerId != null) {
        try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
      }
      if (drag.moved) snapToNearest();
    }

    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    viewport.addEventListener('wheel', function (e) {
      var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!delta) return;
      e.preventDefault();
      e.stopPropagation();
      viewport.scrollLeft += delta;
      updateCoverflow();
    }, { passive: false });

    prevBtn.addEventListener('click', function () {
      scrollToIndex(getCenterIndex() - 1, true);
    });
    nextBtn.addEventListener('click', function () {
      scrollToIndex(getCenterIndex() + 1, true);
    });

    requestAnimationFrame(function () {
      scrollToIndex(0, false);
      updateCoverflow();
    });
    observeAnimate(container);
  }

  function buildCulturalBento(container) {
    if (!container) return;
    ensurePatternUI();
    container.innerHTML = '';
    container.classList.add('pattern-showcase--bento');

    var root = document.createElement('div');
    root.className = 'pattern-bento';
    root.innerHTML =
      '<span class="pattern-showcase__tagline">✦ 磁贴拼贴墙 · 可带走的哈尼记忆</span>' +
      '<div class="pattern-bento__grid"></div>' +
      '<p class="pattern-bento__hint">悬停上滑揭示寓意 · 点击查看大图</p>';

    container.appendChild(root);
    var grid = root.querySelector('.pattern-bento__grid');

    CULTURAL_FILES.forEach(function (file, index) {
      var meta = CULTURAL_DATA[index] || { name: '文创', meaning: '' };
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'pattern-bento__item';
      item.setAttribute('aria-label', meta.name + '：' + meta.meaning);

      var img = document.createElement('img');
      img.alt = meta.name;
      img.loading = 'lazy';
      resolveSrc(CULTURAL_FOLDERS, file, img, index === 0 ? { immediate: true } : null);

      item.innerHTML =
        '<span class="pattern-bento__tag">' + meta.name + '</span>' +
        '<div class="pattern-bento__shine"></div>' +
        '<div class="pattern-bento__img-wrap"></div>' +
        '<div class="pattern-bento__overlay">' +
          '<strong>' + meta.name + '</strong>' +
          '<p>' + meta.meaning + '</p>' +
        '</div>';

      item.querySelector('.pattern-bento__img-wrap').appendChild(img);

      item.addEventListener('mousemove', function (e) {
        var r = item.getBoundingClientRect();
        var sx = ((e.clientX - r.left) / r.width) * 100;
        var sy = ((e.clientY - r.top) / r.height) * 100;
        item.querySelector('.pattern-bento__shine').style.background =
          'radial-gradient(circle at ' + sx + '% ' + sy + '%, rgba(255,255,255,0.5), transparent 55%)';
      });

      item.addEventListener('click', function () {
        if (window.MediaLoadQueue) {
          window.MediaLoadQueue.boost(container);
          if (!img.currentSrc) {
            window.MediaLoadQueue.urgent(img, encodePath(CULTURAL_FOLDERS[0], file));
          }
        }
        openModal(meta, img.currentSrc || img.src, img.alt, CULTURAL_FOLDERS, file);
      });

      grid.appendChild(item);
    });

    observeAnimate(container);
  }

  function observeAnimate(el) {
    if (!el || typeof IntersectionObserver === 'undefined') {
      if (el) el.classList.add('is-animate');
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-animate');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    obs.observe(el);
  }

  function buildSlider(container, folders, files, dataList) {
    buildInnovationCoverflow(container);
  }

  function buildShelf(container) {
    buildCulturalBento(container);
  }

  function init() {
    buildCatalog(document.getElementById('pattern-catalog-traditional'));
    buildSlider(
      document.getElementById('pattern-slider-innovation'),
      INNOVATION_FOLDERS,
      INNOVATION_FILES,
      INNOVATION_DATA
    );
    buildShelf(document.getElementById('pattern-shelf-cultural'));
    if (window.MediaLoadQueue && typeof window.MediaLoadQueue.refresh === 'function') {
      window.MediaLoadQueue.refresh(document.getElementById('panel-act1') || document);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ===== js/age-outfit.js ===== */
(function () {
  var FOLDER = 'image/不同年龄穿搭';

  var AGE_GROUPS = [
    {
      id: 'male',
      label: '男子',
      files: ['哈尼族男子服饰.jpg']
    },
    {
      id: 'child',
      label: '儿童',
      files: ['哈尼儿童 (男).jpg', '哈尼儿童（女）.jpg']
    },
    {
      id: 'young',
      label: '青年女子',
      files: ['哈尼少女.jpg']
    },
    {
      id: 'married',
      label: '已婚妇女',
      files: ['已婚妇女.jpg']
    },
    {
      id: 'elder',
      label: '老年妇女',
      files: ['老年妇女.jpg']
    }
  ];

  function encodePath(file) {
    return FOLDER.split('/').map(encodeURIComponent).join('/') + '/' + encodeURIComponent(file);
  }

  function AgeOutfitCarousel(root) {
    this.root = root;
    this.index = 0;
    this.dragging = false;
    this.startX = 0;
    this.deltaX = 0;

    this.track = root.querySelector('.age-outfit__track');
    this.tabs = root.querySelectorAll('.age-outfit__tab');
    this.cards = [];
    this.listItems = document.querySelectorAll('.article-list--age li');

    this.buildCards();
    this.bindEvents();
    this.goTo(0, false);
  }

  AgeOutfitCarousel.prototype.buildCards = function () {
    var self = this;
    AGE_GROUPS.forEach(function (group, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'age-outfit__card';
      btn.setAttribute('data-index', String(i));
      btn.setAttribute('aria-label', group.label);

      var inner = document.createElement('div');
      inner.className = 'age-outfit__card-inner';

      var wrap = document.createElement('div');
      wrap.className = 'age-outfit__img-wrap' + (group.files.length > 1 ? ' age-outfit__img-wrap--dual' : '');

      group.files.forEach(function (file, fi) {
        var img = document.createElement('img');
        img.alt = group.label;
        img.loading = 'lazy';
        img.draggable = false;
        var src = encodePath(file);
        img.dataset.mediaSrc = src;
        if (window.MediaLoadQueue) {
          window.MediaLoadQueue.loadSrc(img, src, i === 0 && fi === 0
            ? { immediate: true, priority: true }
            : (Math.abs(i) <= 1 ? { priority: true } : null));
        } else {
          img.src = src;
        }
        wrap.appendChild(img);
      });

      var label = document.createElement('span');
      label.className = 'age-outfit__label';
      label.textContent = group.label;

      inner.appendChild(wrap);
      inner.appendChild(label);
      btn.appendChild(inner);
      btn.addEventListener('click', function () {
        self.goTo(i);
      });

      self.track.appendChild(btn);
      self.cards.push(btn);
    });
    if (window.MediaLoadQueue && typeof window.MediaLoadQueue.refresh === 'function') {
      window.MediaLoadQueue.refresh(self.root);
    }
  };

  AgeOutfitCarousel.prototype.layout = function () {
    var n = this.cards.length;
    var offset = this.dragging ? this.deltaX / 120 : 0;

    this.cards.forEach(function (card, i) {
      var diff = i - this.index - offset;
      var abs = Math.abs(diff);
      var clamped = Math.max(-2.5, Math.min(2.5, diff));
      var scale = i === this.index && !this.dragging ? 1 : Math.max(0.62, 1 - abs * 0.14);
      var rotateY = clamped * -22;
      var translateX = clamped * 58;
      var translateZ = i === this.index ? 80 : -abs * 60;
      var opacity = abs > 2.2 ? 0 : Math.max(0.25, 1 - abs * 0.22);

      card.classList.toggle('is-active', i === this.index && !this.dragging);
      card.style.transform =
        'translateX(' + translateX + '%) translateZ(' + translateZ + 'px) rotateY(' + rotateY + 'deg) scale(' + scale + ')';
      card.style.opacity = String(opacity);
      card.style.zIndex = String(100 - Math.round(abs * 10));
      card.style.pointerEvents = abs < 0.6 ? 'auto' : 'none';
    }, this);
  };

  AgeOutfitCarousel.prototype.goTo = function (i, animate) {
    this.index = (i + AGE_GROUPS.length) % AGE_GROUPS.length;
    this.tabs.forEach(function (tab, ti) {
      tab.classList.toggle('is-active', ti === this.index);
    }, this);
    this.listItems.forEach(function (li, lii) {
      li.classList.toggle('is-active', lii === this.index);
    }, this);
    this.layout();
    this.preloadAround(this.index);
  };

  AgeOutfitCarousel.prototype.preloadAround = function (center) {
    var self = this;
    [center, center - 1, center + 1].forEach(function (raw) {
      var i = (raw + AGE_GROUPS.length) % AGE_GROUPS.length;
      var card = self.cards[i];
      if (!card) return;
      card.querySelectorAll('img').forEach(function (img) {
        if (img.naturalWidth > 0) return;
        var src = img.dataset.mediaSrc;
        if (src && window.MediaLoadQueue && window.MediaLoadQueue.urgent) {
          window.MediaLoadQueue.urgent(img, src);
        } else if (src) {
          img.src = src;
        }
      });
    });
  };

  AgeOutfitCarousel.prototype.bindEvents = function () {
    var self = this;

    this.root.querySelector('.age-outfit__nav--prev').addEventListener('click', function () {
      self.goTo(self.index - 1);
    });
    this.root.querySelector('.age-outfit__nav--next').addEventListener('click', function () {
      self.goTo(self.index + 1);
    });

    this.tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        self.goTo(i);
      });
    });

    this.listItems.forEach(function (li, i) {
      li.addEventListener('click', function () {
        self.goTo(i);
        self.root.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });

    var viewport = this.root.querySelector('.age-outfit__viewport');

    function onStart(x) {
      self.dragging = true;
      self.startX = x;
      self.deltaX = 0;
    }

    function onMove(x) {
      if (!self.dragging) return;
      self.deltaX = x - self.startX;
      self.layout();
    }

    function onEnd() {
      if (!self.dragging) return;
      self.dragging = false;
      if (self.deltaX < -50) self.goTo(self.index + 1);
      else if (self.deltaX > 50) self.goTo(self.index - 1);
      else self.layout();
      self.deltaX = 0;
    }

    viewport.addEventListener('pointerdown', function (e) {
      viewport.setPointerCapture(e.pointerId);
      onStart(e.clientX);
    });
    viewport.addEventListener('pointermove', function (e) {
      onMove(e.clientX);
    });
    viewport.addEventListener('pointerup', onEnd);
    viewport.addEventListener('pointercancel', onEnd);

    window.addEventListener('keydown', function (e) {
      if (!self.root.matches(':hover') && document.activeElement && !self.root.contains(document.activeElement)) return;
      if (e.key === 'ArrowLeft') self.goTo(self.index - 1);
      if (e.key === 'ArrowRight') self.goTo(self.index + 1);
    });

    window.addEventListener('resize', function () {
      self.layout();
    });
  };

  function init() {
    var root = document.getElementById('age-outfit');
    if (!root) return;
    new AgeOutfitCarousel(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ===== js/act-five.js ===== */
(function () {
  var BRIEF_FOOTER = '哈尼长街宴 · 数据新闻观察纪念卡';
  var POSTER_SIGN = '以数据看见民俗·赋能乡村振兴';
  var POSTER_SOURCE = '数据来源：红河州文旅局 2023-2025 年度报告、云南省非遗保护中心';

  var BRIEF_COPY = {
    food: {
      title: '梯田农耕食俗',
      line: '从七彩饭到梯田鱼，每一口都是哈尼生态观的味觉翻译。',
      score: '关注维度：饮食 · 礼仪 · 产业链'
    },
    costume: {
      title: '哈尼服饰非遗',
      line: '针线是无字史书，纹样从衣角走向文创，传统美学正在寻找当代表达。',
      score: '关注维度：纹样 · 穿搭 · 文创转化'
    },
    dance: {
      title: '多民族共舞仪式',
      line: '拉手围圈，十二步十二转——歌舞是祭祀、团圆与民族团结的伦理展演。',
      score: '关注维度：乐作舞 · 仪式歌舞 · 社群凝聚'
    },
    tourism: {
      title: '乡村文旅发展',
      line: '三千桌宴席背后，是梯田产业、非遗政策与全域旅游交织的乡村振兴样本。',
      score: '关注维度：规模扩容 · 增收数据 · 文旅闭环'
    }
  };

  var POSTER_COPY = {
    food: {
      dim: '梯田农耕食俗',
      title: '梯田烟火·一席农味守乡土',
      subtitle: '山地农耕·食材溯源·乡村农产内循环',
      quoteLead: '山林 45%、梯田 35%、市集 20%',
      quote: '乡土物产完整赋能节庆经济',
      summary: '顺应山水而食，以节庆盘活梯田农业资源'
    },
    costume: {
      dim: '哈尼服饰非遗',
      title: '衣载山河·纹样藏史',
      subtitle: '多支系服饰活态传承·民族文化多样性留存',
      quote: '一针图腾记迁徙，一袭华服载千年',
      summary: '服饰是可穿戴的非遗，纹样是哈尼的无字史书'
    },
    dance: {
      dim: '多民族共舞仪式',
      title: '围圈同心·歌舞共生',
      subtitle: '全民共舞仪式·多民族交融公共文化场景',
      quote: '无边界共席共舞，构筑民族团结共同体',
      summary: '以舞为礼、以聚为和，实现村寨共生相融'
    },
    tourism: {
      dim: '乡村文旅发展',
      title: '古宴新生·非遗破局',
      subtitle: '五维数据复盘·文旅优势与发展短板',
      quote: '经济社会价值突出，文化文创仍待深耕',
      summary: '传统民俗现代化转型，助力村寨增收振兴'
    }
  };

  function setField(root, name, value) {
    var el = root.querySelector('[data-field="' + name + '"]');
    if (!el) return;
    if (value == null || value === '') {
      el.textContent = '';
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.textContent = value;
  }

  function wrapLines(ctx, text, maxWidth) {
    var lines = [];
    String(text || '').split('\n').forEach(function (para) {
      if (!para) {
        lines.push('');
        return;
      }
      var line = '';
      for (var i = 0; i < para.length; i++) {
        var test = line + para[i];
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = para[i];
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
    });
    return lines;
  }

  function drawCornerOrnament(ctx, x, y, size, flipX, flipY) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.strokeStyle = 'rgba(168, 120, 42, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, size);
    ctx.lineTo(0, 0);
    ctx.lineTo(size, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, size);
    ctx.lineTo(8, 8);
    ctx.lineTo(size, 8);
    ctx.stroke();
    ctx.restore();
  }

  function renderSouvenirCanvas(data) {
    var W = 900;
    var H = 1280;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#f8f1e4');
    g.addColorStop(0.45, '#f3e8d6');
    g.addColorStop(1, '#efe0c8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(139, 26, 26, 0.025)';
    for (var gy = 40; gy < H; gy += 72) {
      for (var gx = 40; gx < W; gx += 72) {
        ctx.beginPath();
        ctx.arc(gx, gy, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = '#b8893a';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.strokeStyle = 'rgba(139, 90, 30, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, W - 96, H - 96);

    drawCornerOrnament(ctx, 68, 68, 42, false, false);
    drawCornerOrnament(ctx, W - 68, 68, 42, true, false);
    drawCornerOrnament(ctx, 68, H - 68, 42, false, true);
    drawCornerOrnament(ctx, W - 68, H - 68, 42, true, true);

    var cx = W / 2;
    var y = 120;

    ctx.fillStyle = '#8b1a1a';
    ctx.font = '600 28px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.fillText('哈尼长街宴', cx, y);
    y += 42;

    ctx.fillStyle = 'rgba(139, 90, 30, 0.75)';
    ctx.font = '400 22px "Noto Serif SC", serif';
    ctx.fillText(data.dim || '', cx, y);
    y += 36;

    ctx.strokeStyle = 'rgba(184, 137, 58, 0.45)';
    ctx.beginPath();
    ctx.moveTo(cx - 80, y);
    ctx.lineTo(cx + 80, y);
    ctx.stroke();
    y += 70;

    ctx.fillStyle = '#3d2b1f';
    ctx.font = '700 52px "Ma Shan Zheng", "Noto Serif SC", cursive';
    wrapLines(ctx, data.title, W - 160).forEach(function (line) {
      ctx.fillText(line, cx, y);
      y += 66;
    });
    y += 18;

    ctx.fillStyle = 'rgba(61, 43, 31, 0.5)';
    ctx.font = '400 24px "Noto Serif SC", serif';
    wrapLines(ctx, data.subtitle, W - 180).forEach(function (line) {
      ctx.fillText(line, cx, y);
      y += 36;
    });
    y += 36;

    ctx.strokeStyle = 'rgba(184, 137, 58, 0.55)';
    ctx.beginPath();
    ctx.moveTo(cx - 160, y);
    ctx.lineTo(cx - 18, y);
    ctx.moveTo(cx + 18, y);
    ctx.lineTo(cx + 160, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#b8893a';
    ctx.fill();
    y += 64;

    ctx.fillStyle = '#2a1f16';
    if (data.quoteLead) {
      ctx.font = '700 28px "Noto Serif SC", serif';
      ctx.fillText(data.quoteLead, cx, y);
      y += 48;
    }
    ctx.font = '700 40px "Noto Serif SC", serif';
    wrapLines(ctx, data.quote, W - 170).forEach(function (line) {
      ctx.fillText(line, cx, y);
      y += 56;
    });
    y += 42;

    ctx.strokeStyle = 'rgba(184, 137, 58, 0.28)';
    ctx.beginPath();
    ctx.moveTo(cx - 100, y);
    ctx.lineTo(cx + 100, y);
    ctx.stroke();
    y += 54;

    ctx.fillStyle = 'rgba(61, 43, 31, 0.72)';
    ctx.font = '400 28px "Noto Serif SC", serif';
    wrapLines(ctx, data.summary, W - 190).forEach(function (line) {
      ctx.fillText(line, cx, y);
      y += 42;
    });

    y = Math.max(y + 70, H - 240);
    ctx.fillStyle = '#a8782a';
    ctx.font = '600 26px "Noto Serif SC", serif';
    ctx.fillText(POSTER_SIGN, cx, y);
    y += 40;

    ctx.fillStyle = 'rgba(61, 43, 31, 0.4)';
    ctx.font = '400 16px "Noto Serif SC", serif';
    wrapLines(ctx, POSTER_SOURCE, W - 200).forEach(function (line) {
      ctx.fillText(line, cx, y);
      y += 24;
    });

    var sealX = W - 168;
    var sealY = H - 210;
    ctx.save();
    ctx.translate(sealX, sealY);
    ctx.rotate(-0.12);
    ctx.strokeStyle = 'rgba(139, 26, 26, 0.78)';
    ctx.fillStyle = 'rgba(139, 26, 26, 0.08)';
    ctx.lineWidth = 3;
    ctx.strokeRect(-42, -42, 84, 84);
    ctx.fillRect(-42, -42, 84, 84);
    ctx.fillStyle = 'rgba(139, 26, 26, 0.82)';
    ctx.font = '700 30px "Noto Serif SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('长', 0, -14);
    ctx.fillText('街', 0, 18);
    ctx.restore();

    return canvas;
  }

  function downloadPng(canvas, filename) {
    var link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function initPoster() {
    var root = document.getElementById('memory-poster');
    if (!root) return;

    var briefTitle = root.querySelector('.memory-poster__brief-title');
    var briefLine = root.querySelector('.memory-poster__brief-line');
    var briefScore = root.querySelector('.memory-poster__brief-score');
    var briefFooter = root.querySelector('.memory-poster__brief-footer');

    var modal = document.getElementById('souvenir-modal');
    var card = document.getElementById('souvenir-card');
    var selected = 'food';
    var lastGenerated = null;

    if (modal && modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }

    function updateBrief(key) {
      var data = BRIEF_COPY[key];
      if (!data || !briefTitle) return;
      briefTitle.textContent = data.title;
      if (briefLine) briefLine.textContent = data.line;
      if (briefScore) briefScore.textContent = data.score;
      if (briefFooter) briefFooter.textContent = BRIEF_FOOTER;
    }

    function selectOption(key) {
      if (!BRIEF_COPY[key]) return;
      selected = key;
      root.querySelectorAll('.memory-poster__option').forEach(function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-key') === key);
      });
      updateBrief(key);
    }

    function closeModal() {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      window.setTimeout(function () {
        if (!modal.classList.contains('is-open')) modal.hidden = true;
      }, 280);
      document.body.classList.remove('souvenir-modal-open');
    }

    function openModal() {
      if (!modal) return;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      void modal.offsetWidth;
      modal.classList.add('is-open');
      document.body.classList.add('souvenir-modal-open');
    }

    function generatePoster(key) {
      var data = POSTER_COPY[key];
      if (!data || !card) return;
      lastGenerated = { key: key, data: data };
      setField(card, 'dim', data.dim);
      setField(card, 'title', data.title);
      setField(card, 'subtitle', data.subtitle);
      setField(card, 'quoteLead', data.quoteLead || '');
      setField(card, 'quote', data.quote);
      setField(card, 'summary', data.summary);
      setField(card, 'sign', POSTER_SIGN);
      setField(card, 'source', POSTER_SOURCE);
      openModal();
    }

    root.querySelectorAll('.memory-poster__option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectOption(btn.getAttribute('data-key'));
      });
    });

    var genBtn = root.querySelector('.memory-poster__generate');
    if (genBtn) {
      genBtn.addEventListener('click', function () {
        generatePoster(selected);
      });
    }

    if (modal) {
      modal.querySelectorAll('[data-modal-close]').forEach(function (el) {
        el.addEventListener('click', closeModal);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    var dlBtn = document.querySelector('.memory-poster__download');
    if (dlBtn) {
      dlBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!lastGenerated) return;
        var run = function () {
          var canvas = renderSouvenirCanvas(lastGenerated.data);
          var name = '哈尼长街宴-纪念卡-' + (lastGenerated.data.dim || '文化观察') + '.png';
          downloadPng(canvas, name);
        };
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(run).catch(run);
        } else {
          run();
        }
      });
    }

    updateBrief(selected);
  }

  function init() {
    initPoster();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ===== js/print-bg.js ===== */
/**
 * 民族图鉴背景 · 01/02 交替 + 滚动交叉淡入
 */
(function () {
  'use strict';

  var DESKTOP_MIN = 1024;

  function isStoryMode() {
    return window.innerWidth >= DESKTOP_MIN &&
      document.documentElement.classList.contains('story-layered');
  }

  function createPrintLayer(variant) {
    var el = document.createElement('div');
    el.className = 'ethnic-print-bg ethnic-print-bg--' + variant;
    var wash = document.createElement('div');
    wash.className = 'ethnic-print-bg__wash';
    el.appendChild(wash);
    return el;
  }

  function initFixedStack() {
    var root = document.querySelector('.ethnic-bg');
    if (!root || root.querySelector('.ethnic-print-stack')) return;

    var stack = document.createElement('div');
    stack.className = 'ethnic-print-stack';
    stack.setAttribute('aria-hidden', 'true');

    var layerA = createPrintLayer('a');
    layerA.classList.add('ethnic-print-stack__layer', 'ethnic-print-stack__layer--a', 'is-active');
    var layerB = createPrintLayer('b');
    layerB.classList.add('ethnic-print-stack__layer', 'ethnic-print-stack__layer--b');

    stack.appendChild(layerA);
    stack.appendChild(layerB);
    root.insertBefore(stack, root.querySelector('.ethnic-bg__corner'));
  }

  function initPanelPrint() {
    var panels = document.querySelectorAll('.story-panel');
    panels.forEach(function (panel, i) {
      if (panel.querySelector('.ethnic-print-bg')) return;
      var variant = i % 2 === 0 ? 'a' : 'b';
      panel.insertBefore(createPrintLayer(variant), panel.firstChild);
    });
  }

  function activePanelIndex() {
    var panels = document.querySelectorAll('.story-panel');
    if (!panels.length) return 0;
    var mid = window.scrollY + window.innerHeight * 0.42;
    var idx = 0;
    panels.forEach(function (panel, i) {
      if (panel.offsetTop <= mid) idx = i;
    });
    return idx;
  }

  function updateFixedCrossfade() {
    if (isStoryMode()) return;

    var stack = document.querySelector('.ethnic-print-stack');
    if (!stack) return;

    var layerA = stack.querySelector('.ethnic-print-stack__layer--a');
    var layerB = stack.querySelector('.ethnic-print-stack__layer--b');
    if (!layerA || !layerB) return;

    var idx = activePanelIndex();
    var panels = document.querySelectorAll('.story-panel');
    var panel = panels[idx];
    if (!panel) return;

    var start = panel.offsetTop;
    var span = Math.max(window.innerHeight * 0.85, 1);
    var t = Math.min(1, Math.max(0, (window.scrollY - start) / span));

    var showB = idx % 2 === 1;
    if (idx < panels.length - 1 && t > 0.35) {
      var nextEven = (idx + 1) % 2 === 0;
      var blend = Math.min(1, (t - 0.35) / 0.45);
      if (nextEven) {
        layerA.style.opacity = String(1 - blend);
        layerB.style.opacity = String(blend);
      } else {
        layerB.style.opacity = String(1 - blend);
        layerA.style.opacity = String(blend);
      }
      return;
    }

    layerA.style.opacity = showB ? '0' : '1';
    layerB.style.opacity = showB ? '1' : '0';
  }

  var rafId = 0;
  function onScroll() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(function () {
      rafId = 0;
      updateFixedCrossfade();
    });
  }

  function boot() {
    initFixedStack();
    initPanelPrint();
    updateFixedCrossfade();
  }

  function init() {
    boot();
    window.setTimeout(boot, 100);
    window.setTimeout(boot, 500);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', boot);

    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(boot).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ===== js/smart-content-decor.js ===== */
/**
 * 智能内容装饰 v4
 * 左右边距对称纹样为主 · 文字区少装饰
 */
(function () {
  'use strict';

  var ZONE_SELECTOR = '.page, .cover-screen, .article-block';
  var SECTION_SELECTOR = '.intro, .dashboard, .act-one-header, .content-block, .ritual-flow, .memory-poster, .cloth-section';

  var PLACEMENTS = {
    rich: [
      { role: 'margin', side: 'left',  pattern: 'pattern-papercut',       top: '4%',  size: 132 },
      { role: 'margin', side: 'right', pattern: 'pattern-papercut-window', top: '4%',  size: 120, flip: true },
      { role: 'margin', side: 'left',  pattern: 'pattern-octagon',        top: '18%', size: 96 },
      { role: 'margin', side: 'right', pattern: 'pattern-sun',            top: '18%', size: 96 },
      { role: 'margin', side: 'left',  pattern: 'pattern-fern',           top: '34%', size: 80 },
      { role: 'margin', side: 'right', pattern: 'pattern-yi-zigzag',      top: '34%', size: 76, flip: true },
      { role: 'margin', side: 'left',  pattern: 'pattern-papercut-bird',  top: '50%', size: 84 },
      { role: 'margin', side: 'right', pattern: 'pattern-papercut',       top: '50%', size: 84 },
      { role: 'margin', side: 'left',  pattern: 'pattern-miao',           top: '66%', size: 72 },
      { role: 'margin', side: 'right', pattern: 'pattern-diamond',        top: '66%', size: 72 },
      { role: 'margin', side: 'left',  pattern: 'pattern-scroll',         bottom: '10%', size: 108 },
      { role: 'margin', side: 'right', pattern: 'pattern-flower',         bottom: '10%', size: 64 }
    ],
    moderate: [
      { role: 'margin', side: 'left',  pattern: 'pattern-papercut',   top: '6%',  size: 108 },
      { role: 'margin', side: 'right', pattern: 'pattern-octagon',    top: '6%',  size: 100, flip: true },
      { role: 'margin', side: 'left',  pattern: 'pattern-cloud',    top: '38%', size: 88 },
      { role: 'margin', side: 'right', pattern: 'pattern-geometry', top: '38%', size: 68, flip: true },
      { role: 'margin', side: 'left',  pattern: 'pattern-fern',       top: '62%', size: 72 },
      { role: 'margin', side: 'right', pattern: 'pattern-scroll',   bottom: '8%', size: 88, flip: true }
    ],
    'light-text': [
      { role: 'margin', side: 'left',  pattern: 'pattern-scroll',   top: '5%',  size: 64 },
      { role: 'margin', side: 'right', pattern: 'pattern-scroll',   top: '5%',  size: 64, flip: true },
      { role: 'margin', side: 'left',  pattern: 'pattern-geometry', bottom: '8%', size: 48 },
      { role: 'margin', side: 'right', pattern: 'pattern-flower',   bottom: '8%', size: 44 }
    ],
    'light-image': [
      { role: 'margin', side: 'left',  pattern: 'pattern-octagon', top: '2%', size: 52 },
      { role: 'margin', side: 'right', pattern: 'pattern-diamond', top: '2%', size: 48, flip: true }
    ]
  };

  var SECTION_PLACEMENTS = {
    rich: [
      { role: 'margin', side: 'left',  pattern: 'pattern-papercut-bird', top: '4%',  size: 72 },
      { role: 'margin', side: 'right', pattern: 'pattern-papercut',      top: '4%',  size: 72, flip: true }
    ],
    moderate: [
      { role: 'margin', side: 'left',  pattern: 'pattern-scroll', top: '5%', size: 60 },
      { role: 'margin', side: 'right', pattern: 'pattern-scroll', top: '5%', size: 60, flip: true }
    ],
    'light-text': [
      { role: 'margin', side: 'left',  pattern: 'pattern-geometry', top: '3%', size: 40 },
      { role: 'margin', side: 'right', pattern: 'pattern-geometry', top: '3%', size: 40, flip: true }
    ],
    'light-image': []
  };

  var PAIR_COUNT = { rich: 5, moderate: 3, 'light-text': 2, 'light-image': 1 };

  var VIEWBOX_MAP = {
    'pattern-cloud': '0 0 120 60',
    'pattern-scroll': '0 0 100 30',
    'pattern-papercut-bird': '0 0 100 100',
    'pattern-papercut-window': '0 0 100 100',
    'pattern-fern': '0 0 100 100',
    'pattern-yi-zigzag': '0 0 100 100',
    'pattern-watermark': '0 0 100 100',
    'pattern-papercut': '0 0 100 100'
  };

  var ASPECT_MAP = {
    'pattern-cloud': 0.5,
    'pattern-scroll': 0.3
  };

  var SIDE_OFFSET = { left: '3.5%', right: '3.5%' };

  function countChars(zone) {
    var clone = zone.cloneNode(true);
    clone.querySelectorAll('.content-decor-container, script, style').forEach(function (n) { n.remove(); });
    return (clone.textContent || '').replace(/\s+/g, '').length;
  }

  function countMedia(zone) {
    var selectors = [
      'img', 'canvas', 'iframe', '.chart-echarts', '.figure-image',
      '.pattern-showcase', '.embed-frame', '.age-outfit__viewport',
      '.media-placeholder video', '.radar-dashboard', '.chart-canvas-wrap'
    ];
    var total = 0;
    selectors.forEach(function (sel) { total += zone.querySelectorAll(sel).length; });
    return total;
  }

  function analyzeDensity(zone, isSection) {
    var chars = countChars(zone);
    var images = countMedia(zone);

    if (isSection) {
      if (chars < 120 && images === 0) return 'rich';
      if (images >= 1) return 'light-image';
      if (chars > 400) return 'light-text';
      return chars < 250 ? 'moderate' : 'light-text';
    }

    if (chars < 300 && images === 0) return 'rich';
    if (images >= 3 && chars < 600) return 'light-image';
    if (images >= 2 && chars < 900) return 'light-image';
    if (chars > 900) return 'light-text';
    if (chars > 600 && images === 0) return 'light-text';

    return 'moderate';
  }

  /** 按密度选取：仅左右对称纹样，文字区不加中间水印 */
  function pickBalanced(placements, density) {
    var left   = placements.filter(function (p) { return p.side === 'left'; });
    var right  = placements.filter(function (p) { return p.side === 'right'; });
    var pairs  = Math.min(left.length, right.length, PAIR_COUNT[density] || 2);
    var picked = [];

    for (var i = 0; i < pairs; i++) {
      picked.push(left[i], right[i]);
    }
    return picked;
  }

  function createSvgDecor(config) {
    var wrap = document.createElement('div');
    var slug = config.pattern.replace('pattern-', '');
    wrap.className = 'content-decor content-decor--' + slug;
    if (config.role) wrap.classList.add('content-decor--' + config.role);
    if (config.side === 'left')  wrap.classList.add('content-decor--side-left');
    if (config.side === 'right') wrap.classList.add('content-decor--side-right');
    if (config.side === 'center') wrap.classList.add('content-decor--side-center');

    var size = config.size || 80;
    var aspect = ASPECT_MAP[config.pattern] || 1;
    wrap.style.width = size + 'px';
    wrap.style.height = Math.round(size * aspect) + 'px';

    if (config.side === 'center') {
      wrap.style.top = config.top || '20%';
      wrap.style.left = '50%';
      wrap.style.marginLeft = (-size / 2) + 'px';
      if (config.offsetY != null) wrap.style.marginTop = config.offsetY + 'px';
    } else {
      if (config.top != null)    wrap.style.top = config.top;
      if (config.bottom != null) wrap.style.bottom = config.bottom;
      if (config.side === 'left')  wrap.style.left = SIDE_OFFSET.left;
      if (config.side === 'right') wrap.style.right = SIDE_OFFSET.right;
    }

    var transforms = [];
    if (config.rotate) transforms.push('rotate(' + config.rotate + 'deg)');
    if (config.flip) transforms.push('scaleX(-1)');
    if (transforms.length) wrap.style.transform = transforms.join(' ');

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', VIEWBOX_MAP[config.pattern] || '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + config.pattern);
    svg.appendChild(use);
    wrap.appendChild(svg);
    return wrap;
  }

  function decorateZone(zone, isSection) {
    if (zone.dataset.decorSkip === 'true') return;
    if (zone.dataset.decorApplied === 'true' && zone.dataset.decorVersion === '4') return;

    if (zone.dataset.decorVersion !== '4') {
      zone.querySelectorAll('.content-decor-container').forEach(function (c) { c.remove(); });
      zone.classList.remove('content-decor-zone');
      zone.className = zone.className.replace(/decor-density--\S+/g, '').trim();
      delete zone.dataset.decorApplied;
      delete zone.dataset.decorDensity;
    }

    var density = analyzeDensity(zone, isSection);
    var pool = isSection ? SECTION_PLACEMENTS : PLACEMENTS;
    var placements = pool[density] || pool.moderate || [];

    if (!placements.length) {
      zone.dataset.decorApplied = 'skip';
      return;
    }

    zone.classList.add('content-decor-zone', 'decor-density--' + density);
    zone.dataset.decorDensity = density;

    var picked = pickBalanced(placements, density);

    var container = document.createElement('div');
    container.className = 'content-decor-container';
    container.setAttribute('aria-hidden', 'true');

    picked.forEach(function (cfg) {
      container.appendChild(createSvgDecor(cfg));
    });

    zone.insertBefore(container, zone.firstChild);
    zone.dataset.decorApplied = 'true';
    zone.dataset.decorVersion = '4';
  }

  /** 分层滚动模式下，为每幕面板复制左右纹样栏 */
  function cloneSideRailsToPanels() {
    var leftTpl = document.querySelector('.ethnic-bg__rail--left');
    var rightTpl = document.querySelector('.ethnic-bg__rail--right');
    if (!leftTpl || !rightTpl) return;

    document.querySelectorAll('.story-panel').forEach(function (panel) {
      if (panel.querySelector('.ethnic-panel-rails')) return;
      var layer = document.createElement('div');
      layer.className = 'ethnic-panel-rails';
      layer.setAttribute('aria-hidden', 'true');
      layer.appendChild(leftTpl.cloneNode(true));
      layer.appendChild(rightTpl.cloneNode(true));
      var veil = document.createElement('div');
      veil.className = 'ethnic-bg__veil';
      layer.appendChild(veil);
      panel.insertBefore(layer, panel.firstChild);
    });
  }

  function shouldDecorateSection(section) {
    if (section.dataset.decorApplied) return false;
    if (section.closest('.content-decor-container')) return false;
    var parentZone = section.closest('.content-decor-zone');
    if (!parentZone) return true;
    var pd = parentZone.dataset.decorDensity;
    if (pd === 'rich' || pd === 'light-text' || pd === 'light-image') return false;
    return true;
  }

  function scanZones() {
    document.querySelectorAll(ZONE_SELECTOR).forEach(function (zone) {
      if (zone.classList.contains('page') || zone.classList.contains('cover-screen') ||
          (zone.classList.contains('article-block') && !zone.classList.contains('page'))) {
        decorateZone(zone, false);
      }
    });

    document.querySelectorAll(SECTION_SELECTOR).forEach(function (section) {
      if (shouldDecorateSection(section)) decorateZone(section, true);
    });
  }

  function observeDynamicContent() {
    if (!window.MutationObserver) return;
    var timer = null;
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(scanZones, 500);
    });
    var track = document.getElementById('story-track');
    if (track) observer.observe(track, { childList: true, subtree: true });
  }

  function init() {
    cloneSideRailsToPanels();
    scanZones();
    observeDynamicContent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.EthnicContentDecor = { analyzeDensity: analyzeDensity, rescan: scanZones };
})();


/* ===== js/main.js ===== */
(function () {
  var navToggle = document.querySelector('.nav-toggle');

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('is-active');
    });
  }

  function setFrameHeight(iframe, height) {
    if (!(height > 0)) return;
    var next = Math.ceil(height) + 'px';
    if (iframe.style.height === next) return;
    iframe.style.height = next;
    iframe.style.minHeight = '0';
    iframe.style.maxHeight = 'none';
  }

  /* 子页 embed-child.js 负责测高；父页只接收 postMessage，不再自行把 iframe 拉高 */
  document.querySelectorAll('.embed-frame').forEach(function (iframe) {
    iframe.setAttribute('scrolling', 'no');
    iframe.style.minHeight = '0';
    iframe.addEventListener('load', function () {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'embed-parent-ready' }, '*');
        }
      } catch (_) {}
    });
  });

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'embed-resize') return;
    document.querySelectorAll('.embed-frame').forEach(function (iframe) {
      try {
        if (iframe.contentWindow === event.source) {
          setFrameHeight(iframe, event.data.height);
        }
      } catch (_) {}
    });
  });
})();


/* ===== embed-child 占位 ===== */
(function () {
  if (window.parent === window) return;
})();

/* ===== 内联环形礼仪图 ===== */
(function () {
  var chart = document.getElementById('ring-ritual-chart');
  if (!chart) return;
  var zones = Array.prototype.slice.call(chart.querySelectorAll('.ring-ritual__zone'));
  var tooltip = document.getElementById('ring-ritual-tooltip');
  var panel = document.getElementById('ring-ritual-panel');
  var titleEl = panel ? panel.querySelector('.ring-ritual__panel-title') : null;
  var descEl = panel ? panel.querySelector('.ring-ritual__panel-desc') : null;
  var pinned = null;

  function parseTip(zone) {
    var parts = (zone.getAttribute('data-tip') || '').split('|');
    return { title: parts[0] || '', desc: parts[1] || '' };
  }

  function setPanel(zone) {
    if (!titleEl || !descEl) return;
    var tip = parseTip(zone);
    titleEl.textContent = tip.title;
    descEl.textContent = tip.desc;
  }

  function setActive(zone) {
    zones.forEach(function (z) {
      z.classList.toggle('is-dim', z !== zone);
      z.classList.toggle('is-active', z === zone);
    });
  }

  function clearActive() {
    zones.forEach(function (z) { z.classList.remove('is-active', 'is-dim'); });
  }

  function showTip(html, x, y) {
    if (!tooltip) return;
    tooltip.innerHTML = html;
    tooltip.hidden = false;
    tooltip.classList.add('is-visible');
    var rect = tooltip.getBoundingClientRect();
    tooltip.style.left = Math.min(x + 12, window.innerWidth - rect.width - 10) + 'px';
    tooltip.style.top = Math.max(y - rect.height - 12, 8) + 'px';
  }

  function hideTip() {
    if (!tooltip) return;
    tooltip.classList.remove('is-visible');
    tooltip.hidden = true;
  }

  function activate(zone, clientX, clientY, pin) {
    var tip = parseTip(zone);
    setActive(zone);
    setPanel(zone);
    if (typeof clientX === 'number') {
      showTip('<strong>' + tip.title + '</strong>' + tip.desc, clientX, clientY);
    }
    if (pin) pinned = zone;
  }

  zones.forEach(function (zone) {
    zone.addEventListener('mouseenter', function (e) {
      activate(zone, e.clientX, e.clientY, false);
    });
    zone.addEventListener('mousemove', function (e) {
      if (pinned && pinned !== zone) return;
      var tip = parseTip(zone);
      showTip('<strong>' + tip.title + '</strong>' + tip.desc, e.clientX, e.clientY);
    });
    zone.addEventListener('mouseleave', function () {
      hideTip();
      if (pinned) {
        setActive(pinned);
        setPanel(pinned);
      } else {
        clearActive();
      }
    });
    zone.addEventListener('click', function (e) {
      e.preventDefault();
      if (pinned === zone) {
        pinned = null;
        hideTip();
        clearActive();
        if (titleEl && descEl) {
          titleEl.textContent = '尊老爱幼 · 长幼有序';
          descEl.textContent = '点击或悬停上方任一礼仪节点，查看该环节说明。';
        }
        return;
      }
      activate(zone, e.clientX, e.clientY, true);
    });
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        zone.click();
      }
    });
  });
})();


