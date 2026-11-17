(function () {
  'use strict';

  var DATA = window.POKEDEX || [];
  var TYPES = ['一般','格斗','飞行','毒','地面','岩石','虫','幽灵','钢','火','水','草','电','超能力','冰','龙','恶','妖精'];
  var LIGHT = { '一般':1, '电':1, '冰':1, '妖精':1, '虫':1 };
  var STAT_LABEL = ['HP','攻击','防御','特攻','特防','速度'];

  var BYN = {};
  DATA.forEach(function (d) { BYN[d.n] = d; });

  // 完整进化链：先向上回溯祖先，再沿“唯一后续”向下延伸
  // cond 表示“进化成该节点所需的条件”
  function chainPath(n) {
    var path = [];
    var cur = BYN[n];
    var guard = 0;
    while (cur && guard++ < 12) {
      path.unshift({ n: cur.n, name: cur.zh, cond: cur.from ? cur.from.cond : '' });
      cur = cur.from ? BYN[cur.from.n] : null;
    }
    cur = BYN[n];
    guard = 0;
    while (cur && cur.to && cur.to.length === 1 && guard++ < 12) {
      var next = BYN[cur.to[0].n];
      if (!next) break;
      path.push({ n: next.n, name: next.zh, cond: cur.to[0].cond });
      cur = next;
    }
    return path;
  }

  var state = { q: '', gen: 0, type: '', avail: '', sort: 'num' };

  var grid = document.getElementById('dex');
  var numindex = document.getElementById('numindex');
  var countEl = document.getElementById('count');
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function typeChip(t) {
    return '<span class="type t-' + esc(t) + (LIGHT[t] ? ' light' : '') + '" style="--tc:var(--t-' + esc(t) + ')">' + esc(t) + '</span>';
  }

  function statRows(d) {
    var out = '<div class="stats">';
    for (var i = 0; i < 6; i++) {
      var v = d.stats[i];
      var pct = Math.max(2, Math.round(v / 255 * 100));
      out += '<div class="stat"><span>' + STAT_LABEL[i] + '</span><span class="bar"><i style="width:' + pct + '%"></i></span><b>' + v + '</b></div>';
    }
    out += '<div class="stat total"><span>合计</span><span></span><b>' + d.total + '</b></div>';
    out += '</div>';
    return out;
  }

  function evoLink(n, name, current) {
    if (current) return '<span class="evo-cur">' + esc(name) + '</span>';
    return '<a class="evo-link" data-jump="' + n + '">' + esc(name) + '</a>';
  }

  function evoBlock(d) {
    var path = chainPath(d.n);
    var chain = '';
    for (var i = 0; i < path.length; i++) {
      if (i > 0) chain += '<span class="evo-arrow">—' + esc(path[i].cond) + '→</span>';
      chain += evoLink(path[i].n, path[i].name, path[i].n === d.n);
    }
    var out = '<div class="evo">';
    out += '<div class="evo-line"><span class="evo-label">进化链</span>' + chain + '</div>';

    if (d.to && d.to.length > 1) {
      var items = d.to.map(function (t) {
        return '<span class="evo-item"><a class="evo-link" data-jump="' + t.n + '">' + esc(t.name) + '</a> <span class="evo-cond">（' + esc(t.cond) + '）</span></span>';
      }).join('');
      out += '<div class="evo-line"><span class="evo-label">分支进化</span>' + items + '</div>';
    } else if (!d.to || !d.to.length) {
      out += '<div class="evo-line"><span class="evo-label">可进化</span><span class="evo-cond">无后续进化</span></div>';
    }
    out += '</div>';
    return out;
  }

  function availBlock(d) {
    if (!d.avail.length) return '<div class="avail"><span class="none">剑／盾不可获得</span></div>';
    var tags = d.avail.map(function (a) { return '<span class="tag">' + esc(a) + '</span>'; }).join('');
    return '<div class="avail">' + tags + '</div>';
  }

  function card(d) {
    var badges = '';
    if (d.legend) badges += '<span class="badge legend">传说</span>';
    if (d.myth) badges += '<span class="badge myth">幻兽</span>';
    if (!d.avail.length) badges += '<span class="badge noavail">不可获得</span>';

    var abils = d.abilities.map(function (a) {
      return '<span class="abil' + (a.hidden ? ' hidden' : '') + '">' + esc(a.name) + (a.hidden ? ' ·隐藏' : '') + '</span>';
    }).join('') || '<span class="abil">—</span>';

    var tt = d.types.map(typeChip).join('');
    var gender = d.gender || '—';
    var egg = d.egg.join(' / ') || '—';

    return '<article class="dex-card" id="p-' + d.n + '"' +
      ' data-gen="' + d.gen + '"' +
      ' data-types="' + esc(d.types.join(' ')) + '"' +
      ' data-avail="' + (d.avail.length ? '1' : '0') + '"' +
      ' data-total="' + d.total + '"' +
      ' data-key="' + esc((d.n + ' ' + d.zh + ' ' + d.en).toLowerCase()) + '">' +
      '<div class="card-top">' +
        '<div class="thumb" style="--tc:var(--t-' + esc(d.types[0]) + ')">' +
          '<img loading="lazy" decoding="async" src="./assets/img/' + d.n + '.webp" alt="' + esc(d.zh) + ' 预览图">' +
        '</div>' +
        '<div class="card-main">' +
          '<div class="card-head">' +
            '<span class="dex-no">No.' + String(d.n).padStart(3, '0') + '</span>' +
            '<span class="dex-name">' + esc(d.zh) + '</span>' +
            '<span class="dex-en">' + esc(d.en) + '</span>' +
          '</div>' +
          '<div class="card-sub">' + esc(d.genus || '宝可梦') + ' · 第 ' + d.gen + ' 世代</div>' +
          '<div class="types">' + tt + '</div>' +
          '<div class="badges">' + badges + '</div>' +
        '</div>' +
      '</div>' +
      statRows(d) +
      '<dl class="info">' +
        '<div><dt>特性</dt><dd class="abils">' + abils + '</dd></div>' +
        '<div><dt>性别</dt><dd>' + esc(gender) + '</dd></div>' +
        '<div><dt>蛋组</dt><dd>' + esc(egg) + '</dd></div>' +
        '<div><dt>身高/体重</dt><dd>' + d.height + ' m / ' + Number(d.weight).toFixed(1) + ' kg</dd></div>' +
        '<div><dt>捕获率</dt><dd>' + d.catch + '</dd></div>' +
        '<div><dt>基础经验</dt><dd>' + d.exp + '</dd></div>' +
      '</dl>' +
      evoBlock(d) +
      availBlock(d) +
      '</article>';
  }

  // ---- render all cards once ----
  grid.innerHTML = DATA.map(card).join('');

  // ---- number index ----
  var idxHtml = '';
  for (var i = 0; i < DATA.length; i++) {
    var d = DATA[i];
    idxHtml += '<a href="#p-' + d.n + '" data-n="' + d.n + '" class="' + (d.avail.length ? '' : 'off') + '" title="' + esc(d.zh) + '">' + String(d.n).padStart(3, '0') + '</a>';
  }
  numindex.innerHTML = idxHtml;

  // ---- type filter chips ----
  var typeWrap = document.getElementById('type-filters');
  var typeChips = TYPES.map(function (t) {
    return '<button class="chip type-chip t-' + t + '" data-type="' + t + '" aria-pressed="false" style="--tc:var(--t-' + t + ')">' + t + '</button>';
  }).join('');
  typeWrap.insertAdjacentHTML('beforeend', '<button class="chip" data-type="" aria-pressed="true">全部</button>' + typeChips);

  // ---- state helpers ----
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 1600);
  }

  function matches(el) {
    var gen = Number(el.getAttribute('data-gen'));
    var avail = el.getAttribute('data-avail');
    var types = el.getAttribute('data-types');
    if (state.gen && gen !== state.gen) return false;
    if (state.avail === 'yes' && avail !== '1') return false;
    if (state.avail === 'no' && avail !== '0') return false;
    if (state.type && types.split(' ').indexOf(state.type) < 0) return false;
    if (state.q) {
      var key = el.getAttribute('data-key');
      var q = state.q.toLowerCase().trim();
      var num = Number(q.replace(/^no\.?/i, ''));
      var ok = key.indexOf(q) >= 0;
      if (!ok && !isNaN(num)) ok = el.id === 'p-' + num;
      if (!ok) return false;
    }
    return true;
  }

  function applySort() {
    if (state.sort === 'num') return; // DOM already in dex order
    var cards = Array.prototype.slice.call(grid.children);
    cards.sort(function (a, b) {
      if (state.sort === 'total') {
        return Number(b.getAttribute('data-total')) - Number(a.getAttribute('data-total'));
      }
      return a.getAttribute('data-key').localeCompare(b.getAttribute('data-key'), 'zh-Hans-CN');
    });
    for (var i = 0; i < cards.length; i++) grid.appendChild(cards[i]);
  }

  function apply() {
    var shown = 0;
    var cards = grid.children;
    for (var i = 0; i < cards.length; i++) {
      var ok = matches(cards[i]);
      cards[i].classList.toggle('hidden', !ok);
      if (ok) shown++;
    }
    if (state.sort !== 'num') applySort();
    countEl.textContent = shown + ' / ' + DATA.length;
    return shown;
  }

  function refreshChips(sel, attr, value) {
    var chips = document.querySelectorAll(sel);
    for (var i = 0; i < chips.length; i++) {
      var v = chips[i].getAttribute(attr) || '';
      chips[i].setAttribute('aria-pressed', v === value ? 'true' : 'false');
    }
  }

  function resetAll(silent) {
    state = { q: '', gen: 0, type: '', avail: '', sort: 'num' };
    document.getElementById('q').value = '';
    document.getElementById('sort').value = 'num';
    refreshChips('.gen-chip', 'data-gen', '0');
    refreshChips('#type-filters .chip', 'data-type', '');
    refreshChips('.avail-chip', 'data-avail', '');
    apply();
    if (!silent) toast('已重置全部筛选');
  }

  function jumpTo(n) {
    var target = document.getElementById('p-' + n);
    if (!target) return;
    if (target.classList.contains('hidden')) resetAll(true);
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('flash');
    setTimeout(function () { target.classList.remove('flash'); }, 1500);
  }

  // ---- events ----
  document.getElementById('q').addEventListener('input', function (e) {
    state.q = e.target.value;
    apply();
  });

  document.querySelectorAll('.gen-chip').forEach(function (b) {
    b.addEventListener('click', function () {
      state.gen = Number(b.getAttribute('data-gen'));
      refreshChips('.gen-chip', 'data-gen', String(state.gen));
      apply();
      document.getElementById('dex').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  typeWrap.addEventListener('click', function (e) {
    var b = e.target.closest('.type-chip, [data-type]');
    if (!b) return;
    state.type = b.getAttribute('data-type') || '';
    refreshChips('#type-filters .chip', 'data-type', state.type);
    apply();
  });

  document.querySelectorAll('.avail-chip').forEach(function (b) {
    b.addEventListener('click', function () {
      state.avail = b.getAttribute('data-avail') || '';
      refreshChips('.avail-chip', 'data-avail', state.avail);
      apply();
    });
  });

  document.getElementById('sort').addEventListener('change', function (e) {
    state.sort = e.target.value;
    apply();
  });

  document.getElementById('reset').addEventListener('click', function () {
    resetAll(false);
  });

  // 图鉴卡片内：点击进化链中的宝可梦直接跳转
  grid.addEventListener('click', function (e) {
    var a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    jumpTo(a.getAttribute('data-jump'));
  });

  numindex.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    e.preventDefault();
    jumpTo(a.getAttribute('data-n'));
  });

  // ---- metrics ----
  var availCount = DATA.filter(function (d) { return d.avail.length; }).length;
  document.getElementById('m-total').textContent = DATA.length;
  document.getElementById('m-avail').textContent = availCount;
  document.getElementById('foot-avail').textContent = availCount;
  document.getElementById('m-gens').textContent = new Set(DATA.map(function (d) { return d.gen; })).size;

  apply();
})();
