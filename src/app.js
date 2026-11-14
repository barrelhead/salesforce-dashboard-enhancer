/* UI + state. The car is redrawn from numeric geometry every frame, so a model
   change tweens the old shape into the new one. */
(function () {
  const { GENS, AERO, INTERIORS, CAL, draw } = window.NA;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const BODY = { coupe: 'Coupé', cabrio: 'Cabriolet', targa: 'Targa', speedster: 'Speedster' };

  const st = { gen: '964', model: 'c2', ph: 1, body: 'coupe', paint: 'Guards Red', wheel: 'd90', cal: 'black', aero: 'auto964', spUp: false, roofOpen: false, top: 0, interior: 0, decal: false, trim: 'black', livery: false, pin: null };

  const gen = () => GENS.find((g) => g.id === st.gen);
  const model = () => gen().models.find((m) => m.id === st.model);
  const paints = (g = gen(), m = model()) => { const all = [...(m.colors || []), ...g.colors]; return m.only ? all.filter((c) => m.only.includes(c.n)) : all; };
  const flags = (g = gen(), m = model()) => ({ ...g.f, ...((g.ph[m.ph || 1] || {}).f || {}), ...(m.f || {}) });

  function fit(fresh) {
    const g = gen(), m = model(), f = flags(), ps = paints();
    st.ph = m.ph || 1;
    if (!m.b.includes(st.body)) st.body = m.b[0];
    if (fresh && m.c0) st.paint = m.c0;
    if (!ps.some((c) => c.n === st.paint)) st.paint = (ps.find((c) => c.n === m.c0) || ps.find((c) => c.n === 'Guards Red') || ps[0]).n;
    if (!m.wh.includes(st.wheel)) st.wheel = m.wh[0];
    if (!m.cal.includes(st.cal)) st.cal = m.cal[0];
    if (!m.aero.includes(st.aero)) st.aero = m.aero[0];
    if (st.top >= g.tops.length) st.top = 0;
    if (fresh) { st.decal = !!f.decOn; st.livery = false; st.trim = f.alu ? 'alu' : 'black'; }
    if (!f.dec) st.decal = false;
    if (!canOpen()) st.roofOpen = false;
  }
  const canOpen = () => st.body === 'cabrio' || (st.body === 'targa' && flags().targa === 'bar');

  function resolve() {
    const g0 = gen(), m = model(), w = g0.wheels.find((x) => x.id === st.wheel);
    const g = { ...g0.g, W0: g0.g.W, ride: 0, ...(m.g || {}) };
    g.rimF = w.rf; g.rimR = w.rr; g.tDF = draw.TYRE[w.rf] + (w.at ? 44 : 0); g.tDR = draw.TYRE[w.rr] + (w.at ? 44 : 0);
    return { g, f: flags(), body: st.body, roofOpen: st.roofOpen, paint: paints().find((c) => c.n === st.paint), top: g0.tops[st.top].h, interior: INTERIORS[st.interior].h, wheel: w, cal: CAL[st.cal].h, aero: AERO[st.aero], spUp: st.spUp, decal: st.decal, trim: st.trim, livery: st.livery };
  }

  // ---- drawing with tween --------------------------------------------------
  let shown = null, raf = 0;
  function paint(cfg) {
    const c = { ...cfg, ghost: st.pin ? st.pin.cfg : null };
    $('#v-side').innerHTML = draw.side({ ...c, uid: 'sd' });
    $('#v-front').innerHTML = draw.front({ ...c, uid: 'fr' });
    $('#v-rear').innerHTML = draw.rear({ ...c, uid: 'rr' });
  }
  function show(animate) {
    const target = resolve();
    cancelAnimationFrame(raf);
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || !shown || reduce) { shown = target.g; paint(target); return; }
    const from = { ...shown }, t0 = performance.now(), dur = 650;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, g = {};
      for (const key in target.g) g[key] = (from[key] ?? target.g[key]) + (target.g[key] - (from[key] ?? target.g[key])) * e;
      shown = g; paint({ ...target, g });
      if (k < 1) raf = requestAnimationFrame(step); else { shown = target.g; paint(target); }
    };
    raf = requestAnimationFrame(step);
  }

  // ---- chrome --------------------------------------------------------------
  const seg = (key, opts, cur) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button type="button" data-set="${key}" data-v="${esc(v)}" aria-pressed="${String(v) === String(cur)}">${esc(l)}</button>`).join('')}</div>`;
  const sw = (key, list, cur, byIndex) => `<div class="sws">${list.map((c, i) => `<button type="button" class="sw${c.t === 'm' ? ' met' : ''}" style="--c:${c.h}" data-set="${key}" data-v="${esc(byIndex ? i : c.id || c.n)}" aria-pressed="${byIndex ? i === cur : (c.id || c.n) === cur}" title="${esc(c.n)}" aria-label="${esc(c.n)}"></button>`).join('')}</div>`;
  const group = (title, value, body) => `<section class="grp"><h3><span>${title}</span>${value ? `<b>${esc(value)}</b>` : ''}</h3>${body}</section>`;

  function specs(g0 = gen(), m = model(), g = resolve().g) {
    return [['Years', m.y], ['Engine', m.eng], ['Power', `${m.ps} PS · ${Math.round(m.ps * 0.7355)} kW`], ['Drive', m.drv], ['Length', `${g.L} mm`], ['Width', `${g.W} mm`], ['Height', `${g.H + g.ride} mm`], ['Wheelbase', `${g.WB} mm`]];
  }

  function chrome() {
    const g = gen(), m = model(), f = flags(), ps = paints(), cfg = resolve();
    $('#gens').innerHTML = GENS.map((x) => `<button type="button" data-gen="${x.id}" aria-pressed="${x.id === g.id}"><strong>${x.id}</strong><span>${x.years}</span></button>`).join('');
    $('#num').textContent = g.id;
    $('#name').innerHTML = `<span>${esc(g.ph[st.ph].label)}</span> ${esc(m.n)}${m.b.length > 1 ? ` <em>${BODY[st.body]}</em>` : ''}`;
    $('#sub').textContent = `${m.y} · ${m.eng} · ${m.ps} PS`;
    $('#specs').innerHTML = specs().map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');

    const phases = Object.entries(g.ph);
    let h = `<section class="grp models"><h3><span>Model</span><b>${esc(g.tag)}</b></h3>`;
    if (phases.length > 1) h += seg('ph', phases.map(([k, v]) => [k, `${v.label} · ${v.years}`]), st.ph);
    h += `<div class="mlist">${g.models.filter((x) => (x.ph || 1) === st.ph).map((x) => `<button type="button" data-model="${x.id}" aria-pressed="${x.id === m.id}"><span>${esc(x.n)}</span><small>${x.y} · ${x.ps} PS</small></button>`).join('')}</div>`;
    if (m.note) h += `<p class="note">${esc(m.note)}</p>`;
    h += '</section>';

    if (m.b.length > 1) h += group('Body', BODY[st.body], seg('body', m.b.map((b) => [b, BODY[b]]), st.body));
    if (canOpen()) h += group('Roof', st.roofOpen ? 'Open' : 'Closed', seg('roofOpen', [[false, 'Closed'], [true, 'Open']], st.roofOpen) + `<div class="sublabel">${st.body === 'targa' ? 'Roof panel' : 'Hood'} colour · ${esc(g.tops[st.top].n)}</div>` + sw('top', g.tops, st.top, true));
    h += group('Paint', st.paint, sw('paint', ps, st.paint) + (ps.length < 6 ? '<p class="hint">This model was offered in a restricted palette.</p>' : ''));
    if (f.livery) h += group('Livery', st.livery ? 'Rallye Design' : 'None', seg('livery', [[false, 'Single colour'], [true, 'Rallye Design']], st.livery));
    h += group('Wheels', g.wheels.find((w) => w.id === st.wheel).n, `<div class="wheels">${m.wh.map((id) => { const w = g.wheels.find((x) => x.id === id); return `<button type="button" data-set="wheel" data-v="${id}" aria-pressed="${id === st.wheel}">${draw.wheelThumb(w)}<span>${esc(w.n)}</span></button>`; }).join('')}</div>`);
    h += group('Brake calipers', CAL[st.cal].n, sw('cal', m.cal.map((id) => ({ ...CAL[id], id })), st.cal));
    const a = AERO[st.aero];
    let ah = m.aero.length > 1 ? seg('aero', m.aero.map((id) => [id, AERO[id].n]), st.aero) : `<p class="fixed">${esc(a.n)}</p>`;
    if (a.k === 'lip') ah += `<div class="sublabel">Spoiler position</div>` + seg('spUp', [[false, 'Retracted'], [true, 'Extended']], st.spUp);
    h += group('Rear aero', '', ah);
    let dh = '';
    if (f.dec) dh += `<div class="sublabel">Side script “${esc(f.dec)}”</div>` + seg('decal', [[false, 'Off'], [true, 'On']], st.decal);
    if (GENS.indexOf(g) >= 3 && !f.blk) dh += `<div class="sublabel">Window trim</div>` + seg('trim', [['black', 'Black'], ['alu', 'Aluminium']], st.trim);
    dh += `<div class="sublabel">Interior · ${esc(INTERIORS[st.interior].n)}</div>` + sw('interior', INTERIORS, st.interior, true);
    h += group('Details', '', dh);
    $('#panel').innerHTML = h;

    // lower section
    $('#cues').innerHTML = `<h3>How to spot a ${g.id}</h3><ul>${g.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`;
    const label = `${g.ph[st.ph].label} ${m.n}`;
    let c = `<h3>Compare</h3>`;
    if (!st.pin) c += `<p>Pin the car on screen, then pick any other model. The pinned car stays as a dashed outline at the same scale.</p><button type="button" class="btn" data-pin="1">Pin ${esc(label)}</button>`;
    else {
      const now = specs(), was = st.pin.specs, num = (s) => parseFloat(s);
      c += `<table><thead><tr><th></th><th>${esc(st.pin.label)} <i class="dash"></i></th><th>${esc(label)}</th><th>Change</th></tr></thead><tbody>${[2, 4, 5, 6, 7].map((i) => { const d = num(now[i][1]) - num(was[i][1]); return `<tr><th>${now[i][0]}</th><td>${esc(was[i][1].split(' · ')[0])}</td><td>${esc(now[i][1].split(' · ')[0])}</td><td class="${d ? 'chg' : ''}">${d > 0 ? '+' : ''}${d || '—'}</td></tr>`; }).join('')}</tbody></table><div class="row"><button type="button" class="btn" data-pin="1">Pin ${esc(label)} instead</button><button type="button" class="btn ghost" data-pin="0">Clear outline</button></div>`;
    }
    $('#compare').innerHTML = c;
    return cfg;
  }

  function update(animate, fresh) { fit(fresh); chrome(); show(animate); }

  document.addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    const d = b.dataset;
    if (d.gen) { if (d.gen === st.gen) return; st.gen = d.gen; const g = gen(); st.model = (g.models.find((m) => (m.ph || 1) === 1) || g.models[0]).id; update(true, true); }
    else if (d.model) { st.model = d.model; update(true, true); }
    else if (d.set === 'ph') { st.ph = +d.v; st.model = gen().models.find((m) => (m.ph || 1) === st.ph).id; update(true, true); }
    else if (d.set) {
      const k = d.set, v = d.v;
      st[k] = v === 'true' ? true : v === 'false' ? false : ['top', 'interior'].includes(k) ? +v : v;
      update(k === 'wheel' || k === 'body');
    } else if (d.pin) { st.pin = d.pin === '1' ? { cfg: resolve(), label: `${gen().ph[st.ph].label} ${model().n}`, specs: specs() } : null; update(false); }
    else return;
    // keep keyboard focus on the re-rendered control
    const sel = d.gen ? `[data-gen="${d.gen}"]` : d.model ? `[data-model="${d.model}"]` : d.set ? `[data-set="${d.set}"][data-v="${CSS.escape(d.v)}"]` : '[data-pin]';
    const n = document.querySelector(sel); if (n) n.focus({ preventScroll: true });
  });

  update(false, true);
})();
