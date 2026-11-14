/* Parametric 911 drawings: side, front and rear. Everything is generated from
   numeric geometry so one model can be tweened into another. Units are mm,
   y is up (the root group flips it). */
(function () {
  const GY = 1560; // ground line in SVG units
  const rnd = (n) => Math.round(n * 10) / 10;
  // path template: rounds numbers, joins [x,y] points
  const p = (s, ...v) => s.reduce((a, t, i) => a + t + (i < v.length ? (Array.isArray(v[i]) ? rnd(v[i][0]) + ' ' + rnd(v[i][1]) : typeof v[i] === 'number' ? rnd(v[i]) : v[i]) : ''), '');

  const hex2 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (h, to, a) => '#' + hex2(h).map((c, i) => Math.round(c + (to[i] - c) * a).toString(16).padStart(2, '0')).join('');
  const dark = (h, a) => mix(h, [0, 0, 0], a);
  const lite = (h, a) => mix(h, [255, 255, 255], a);
  const lum = (h) => { const [r, g, b] = hex2(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

  const bez = (P, t) => { const u = 1 - t; return [0, 1].map((i) => u * u * u * P[0][i] + 3 * u * u * t * P[1][i] + 3 * u * t * t * P[2][i] + t * t * t * P[3][i]); };
  const atX = (P, x) => { let a = 0, b = 1; for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (bez(P, m)[0] < x) a = m; else b = m; } return bez(P, (a + b) / 2); };

  const FIN = {
    silver: ['#c5c8cc', '#dcdfe2'], bright: ['#e2e4e7', '#f3f4f6'], black: ['#232427', '#303135'], dark: ['#4b4e53', '#5c5f64'],
    gold: ['#b08a4c', '#c29c5e'], red: ['#c8161d', '#d6262c'], blue: ['#1f4fb0', '#2c5cc0'], orange: ['#f26a1b', '#f57c33'], white: ['#e9e9e5', '#f6f6f3'],
  };
  const TYRE = { 16: 630, 17: 636, 18: 641, 19: 659, 20: 684, 21: 713 };

  function wheel(cx, cy, D, rim, w, cal, rearward) {
    const R = D / 2, rr = rim * 12.7 + 6, [fc, lip] = FIN[w.fin] || FIN.silver;
    const fu = w.st === 'fuchs', sc = fu ? '#dcdee1' : fc;
    let s = `<g transform="translate(${rnd(cx)} ${rnd(cy)})"><circle r="${rnd(R)}" fill="#161618"/>`;
    if (w.at) s += `<circle r="${rnd(R - 9)}" fill="none" stroke="#050505" stroke-width="18" stroke-dasharray="24 14"/>`;
    s += `<circle r="${rnd(R - 20)}" fill="none" stroke="#2c2c30" stroke-width="3"/><circle r="${rnd(rr)}" fill="#0d0d0f"/>`;
    const dr = rr * 0.76;
    s += `<circle r="${rnd(dr)}" fill="#7c7e82"/><circle r="${rnd(dr * 0.86)}" fill="none" stroke="#6a6c70" stroke-width="${rnd(dr * 0.2)}" stroke-dasharray="3 9"/><circle r="${rnd(rr * 0.34)}" fill="#3b3c3f"/>`;
    // caliper: annular sector
    const a0 = (rearward ? -32 : 148) * Math.PI / 180, a1 = (rearward ? 32 : 212) * Math.PI / 180, ri = rr * 0.44, ro = rr * 0.82;
    const pt = (r, a) => rnd(r * Math.cos(a)) + ' ' + rnd(r * Math.sin(a));
    s += `<path d="M ${pt(ri, a0)} L ${pt(ro, a0)} A ${rnd(ro)} ${rnd(ro)} 0 0 1 ${pt(ro, a1)} L ${pt(ri, a1)} A ${rnd(ri)} ${rnd(ri)} 0 0 0 ${pt(ri, a0)} Z" fill="${cal}"/>`;
    if (fu) s += `<circle r="${rnd(rr - 14)}" fill="#18181a" opacity=".92"/>`;
    const r0 = rr * 0.15, r1 = (w.st === 'split' ? rr * 0.8 : rr - 9), n = w.sp;
    const spoke = (a, w0, w1, tw = 0, ra = r0, rb = r1) => {
      const b = a + tw, c = Math.cos, q = Math.sin;
      const P = [[ra * c(a) - w0 * q(a), ra * q(a) + w0 * c(a)], [rb * c(b) - w1 * q(b), rb * q(b) + w1 * c(b)], [rb * c(b) + w1 * q(b), rb * q(b) - w1 * c(b)], [ra * c(a) + w0 * q(a), ra * q(a) - w0 * c(a)]];
      return `<path d="M ${P.map((x) => rnd(x[0]) + ' ' + rnd(x[1])).join(' L ')} Z" fill="${sc}"/>`;
    };
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2, k = Math.sqrt(5 / n);
      if (w.st === 'flat' || w.st === 'split') s += spoke(a, rr * 0.2 * k, rr * 0.125 * k);
      else if (w.st === 'twist') s += spoke(a, rr * 0.2, rr * 0.11, 0.3);
      else if (w.st === 'twin') s += spoke(a, rr * 0.07, rr * 0.05, -0.16) + spoke(a, rr * 0.07, rr * 0.05, 0.16);
      else if (w.st === 'multi') s += spoke(a, rr * 0.075 * k * 1.3, rr * (w.tw ? 0.1 : 0.05) * k * 1.3, w.tw ? 0.12 : 0);
      else if (w.st === 'fuchs') s += spoke(a, rr * 0.08, rr * 0.27);
      else if (w.st === 'y') {
        const rm = r1 * 0.55, c = Math.cos, q = Math.sin, e = (r, t) => rnd(r * c(t)) + ' ' + rnd(r * q(t));
        s += `<path d="M ${e(r0, a)} L ${e(rm, a)} M ${e(r1, a - 0.27)} L ${e(rm, a)} L ${e(r1, a + 0.27)}" fill="none" stroke="${sc}" stroke-width="${rnd(rr * 0.11)}" stroke-linejoin="round"/>`;
      }
    }
    if (w.st === 'split') s += `<circle r="${rnd(rr * 0.9)}" fill="none" stroke="${lip}" stroke-width="${rnd(rr * 0.2)}"/><circle r="${rnd(rr * 0.83)}" fill="none" stroke="#6b6d70" stroke-width="5" stroke-dasharray="5 ${rnd(rr * 0.83 * Math.PI / 15 - 5)}"/>`;
    s += `<circle r="${rnd(rr - 5)}" fill="none" stroke="${fu ? '#eceef0' : lip}" stroke-width="${fu ? 16 : 10}"/>`;
    s += `<circle r="${rnd(rr * 0.19)}" fill="${sc}"/>`;
    s += w.cl ? `<circle r="${rnd(rr * 0.15)}" fill="#1a1a1c"/><circle r="${rnd(rr * 0.085)}" fill="none" stroke="${sc}" stroke-width="5"/>` : `<circle r="${rnd(rr * 0.09)}" fill="#1a1a1c"/>`;
    return s + '</g>';
  }

  // ---- shared defs ---------------------------------------------------------
  function defs(u, c, H) {
    const met = c.paint.t === 'm' ? 1.25 : 1, lt = lum(c.paint.h);
    const hi = Math.min(0.5, (0.2 + (1 - lt) * 0.16) * met), lo = 0.2 + lt * 0.26;
    return `<linearGradient id="${u}sh" gradientUnits="userSpaceOnUse" x1="0" y1="${H + 40}" x2="0" y2="150">
      <stop offset="0" stop-color="#fff" stop-opacity="${rnd(hi)}"/><stop offset=".22" stop-color="#fff" stop-opacity="${rnd(hi * 0.25)}"/>
      <stop offset=".42" stop-color="#fff" stop-opacity="${rnd(hi * 0.45)}"/><stop offset=".5" stop-color="#000" stop-opacity=".04"/>
      <stop offset=".8" stop-color="#000" stop-opacity="${rnd(lo * 0.6)}"/><stop offset="1" stop-color="#000" stop-opacity="${rnd(lo + 0.15)}"/></linearGradient>
    <linearGradient id="${u}gl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#3d4a57"/><stop offset=".55" stop-color="#1b232c"/><stop offset="1" stop-color="#0d1217"/></linearGradient>
    <linearGradient id="${u}lg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f4f7f9"/><stop offset=".6" stop-color="#b9c4cc"/><stop offset="1" stop-color="#7d8992"/></linearGradient>
    <linearGradient id="${u}rd" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e3262b"/><stop offset="1" stop-color="#8f0f14"/></linearGradient>`;
  }
  const painted = (u, d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/><path d="${d}" fill="url(#${u}sh)" ${extra}/>`;
  const CARBON = '#1d1e20';

  // ---- side view -----------------------------------------------------------
  function sideShape(c) {
    const g = c.g, f = c.f, L = g.L, xf = g.FO, xr = g.FO + g.WB;
    const E = [g.cowlX, g.cowlY], F = [g.wsX, g.wsY], G = [g.peakX, g.H], T = [L - 85, g.tailY], S = [xr - 80, g.cowlY + 28];
    const sill = 195 - (f.skirt ? 18 : 0), acy = 318;
    const dxF = Math.sqrt(g.archF ** 2 - (acy - sill) ** 2), dxR = Math.sqrt(g.archR ** 2 - (acy - sill) ** 2);
    const D = [g.crestX, g.crestY], N = [45, g.noseTopY], B = [0, g.noseY], A = [75, g.chinY];
    const fe = [D, [D[0] + 380, D[1] + 30], [E[0] - 260, E[1] - 75], E];
    const dl = Math.hypot(380, 30), ux = -380 / dl, uy = -30 / dl;
    const dk = [S, [S[0] + 300, S[1] + 25], [T[0] - 250, T[1] + 15], T];
    const fb = [G, [G[0] + g.fbA, G[1] - 8], [T[0] - g.fbB, T[1] + g.fbC], T];
    const topTub = p`C ${dk[2]} ${dk[1]} ${S} L ${E}`;
    const tub = p`M ${A} L ${xf - dxF} ${sill} A ${g.archF} ${g.archF} 0 1 0 ${xf + dxF} ${sill} L ${xr - dxR} ${sill} A ${g.archR} ${g.archR} 0 1 0 ${xr + dxR} ${sill} L ${L - 95} ${g.rbY} C ${L - 10} ${g.rbY + 20} ${L} ${g.rmY - 130} ${L} ${g.rmY} C ${L} ${g.rmY + 90} ${T[0] + 65} ${T[1] - 8} ${T} ${topTub} C ${fe[2]} ${fe[1]} ${D} C ${D[0] + ux * g.noseK} ${D[1] + uy * g.noseK} ${N[0] + 8} ${N[1] + g.noseV} ${N} C ${N[0] - 30} ${N[1] - 50} 0 ${B[1] + 70} ${B} C 0 ${B[1] - 100} ${A[0] - 55} ${A[1] + 15} ${A} Z`;
    const roofF = p`M ${E} L ${F} C ${F[0] + 140} ${F[1] + 42} ${G[0] - 190} ${G[1]} ${G}`;
    const coupe = p`${roofF} C ${fb[1]} ${fb[2]} ${T} ${topTub} Z`;
    const belt = (x) => (x < E[0] ? atX(fe, Math.max(x, D[0] + 1))[1] : E[1] + ((x - E[0]) / (S[0] - E[0])) * 28);
    const doorF = xf + g.archF + 60, doorR = xr - g.archR - 300;
    return { g, f, L, xf, xr, E, F, G, T, S, D, N, A, fe, sill, acy, dxF, dxR, dk, fb, tub, coupe, roofF, topTub, belt, doorF, doorR };
  }

  function wingSide(u, c, s, deck) {
    const a = c.aero, T = s.T, paint = c.paint.h;
    if (!a || a.k === 'none') return '';
    let o = '';
    const sh = (d, fill) => painted(u, d, fill);
    if (a.k === 'lip') {
      const p0 = deck(T[0] - a.len - 60), p1 = deck(T[0] - 70), up = c.spUp ? a.h : 0;
      if (up) {
        const q1 = [p1[0] + 10, p1[1] + up], q0 = [p0[0], p0[1] + 12];
        o += p`<path d="M ${p0} L ${q1} L ${p1} Z" fill="#0c0c0d"/>`;
        o += sh(p`M ${q0} L ${q1[0]} ${q1[1] + 6} L ${q1[0] + 4} ${q1[1] - 26} L ${p0[0] + 20} ${p0[1] - 6} Z`, a.dark ? dark(paint, 0.1) : paint);
        if (a.gurney) o += p`<path d="M ${q1[0] - 4} ${q1[1]} L ${q1[0] + 6} ${q1[1] + 34}" stroke="#111" stroke-width="12"/>`;
      }
    }
    if (a.k === 'duck') {
      const p0 = deck(T[0] - 470), tip = [T[0] + 12, T[1] + a.h];
      o += sh(p`M ${p0} C ${p0[0] + 220} ${p0[1] - 40} ${tip[0] - 150} ${tip[1] - 6} ${tip} L ${tip[0] + 2} ${tip[1] - 26} C ${tip[0] - 20} ${T[1] + 30} ${T[0] + 30} ${T[1] + 10} ${T[0] + 20} ${T[1] - 20} L ${T[0] - 300} ${T[1] + 20} Z`, paint);
    }
    if (a.k === 'tray') {
      const p0 = deck(T[0] - a.len), tf = [T[0] - a.len * 0.5, T[1] + a.h], tr = [T[0] + 30, T[1] + a.h + 10];
      o += sh(p`M ${p0} C ${p0[0] + 120} ${p0[1] + 10} ${tf[0] - 120} ${tf[1]} ${tf} L ${tr} L ${tr[0]} ${tr[1] - 38} C ${T[0] - 60} ${tr[1] - 50} ${T[0] - 80} ${T[1] + 40} ${T[0] - 110} ${T[1] + 20} L ${p0[0] + 60} ${p0[1] - 30} Z`, paint);
      if (a.rub) o += p`<path d="M ${tf[0] + 60} ${tf[1] + 2} L ${tr[0]} ${tr[1] + 2} L ${tr[0] + 3} ${tr[1] - 38}" fill="none" stroke="#141415" stroke-width="16" stroke-linejoin="round"/>`;
    }
    const w = a.wing;
    if (w) {
      const bx = T[0] - w.off, by = T[1] + w.h, ch = w.c, th = w.th || 34, col = w.carbon ? CARBON : paint, dy = deck(bx)[1];
      const blade = p`M ${-ch / 2} 0 C ${-ch / 2} ${th} ${ch * 0.1} ${th} ${ch / 2} ${th * 0.3} L ${ch / 2} ${th * 0.05} C ${ch * 0.1} ${-th * 0.35} ${-ch / 2} ${-th * 0.5} ${-ch / 2} 0 Z`;
      if (w.swan) o += p`<path d="M ${bx - 110} ${dy - 20} C ${bx - 150} ${by - 60} ${bx - 190} ${by + 30} ${bx - 120} ${by + th + 34} C ${bx - 80} ${by + th + 50} ${bx - 40} ${by + th + 22} ${bx - 10} ${by + th * 0.7}" fill="none" stroke="#1a1b1d" stroke-width="36" stroke-linecap="round"/>`;
      else if (w.plate !== 'full') o += p`<path d="M ${bx - 70} ${dy - 20} L ${bx - 30} ${by} L ${bx + 40} ${by} L ${bx + 50} ${dy - 20} Z" fill="${dark(col, 0.25)}"/>`;
      o += `<g transform="translate(${rnd(bx)} ${rnd(by)}) rotate(7)">${w.carbon ? `<path d="${blade}" fill="${col}"/>` : `<path d="${blade}" fill="${col}"/><path d="${blade}" fill="#fff" opacity=".12"/>`}</g>`;
      const pw = w.pw || ch + 50;
      const pl = { small: [by - 60, by + 55], big: [by - 120, by + 70], huge: [by - 210, by + 85], full: [dy - 10, by + 60] }[w.plate];
      if (pl) {
        const d = w.plate === 'full' ? p`M ${deck(bx - pw / 2 - 30)} L ${bx - pw / 2 + 50} ${pl[1]} L ${bx + pw / 2} ${pl[1]} L ${bx + pw / 2 + 4} ${by - 24} L ${deck(bx + pw / 2 - 30)} Z` : p`M ${bx - pw / 2 + 70} ${pl[0]} L ${bx - pw / 2} ${by + 20} L ${bx - pw / 2 + 10} ${pl[1]} L ${bx + pw / 2} ${pl[1]} L ${bx + pw / 2 + 6} ${pl[0] + 20} Z`;
        o += w.carbon ? `<path d="${d}" fill="${CARBON}"/>` : sh(d, paint);
        if (w.pw) o += p`<path d="M ${bx - 150} ${by - 90} L ${bx - 40} ${by - 80} L ${bx - 50} ${by - 20} L ${bx - 140} ${by - 30} Z" fill="#0d0d0e"/>`;
      }
    }
    return o;
  }

  function sideBody(u, c) {
    const s = sideShape(c), { g, f, L, xf, xr, E, F, G, T, S, D, sill, acy, dxF, dxR, belt, doorF, doorR } = s;
    const paint = c.paint.h, body = c.body, isT = body === 'targa', bar = isT && f.targa === 'bar', glassT = isT && f.targa === 'glass';
    const closedCoupe = body === 'coupe' || glassT;
    const deck = (x) => atX(closedCoupe ? s.fb : s.dk, Math.max(x, (closedCoupe ? s.fb : s.dk)[0][0] + 1));
    const trim = c.trim === 'alu' ? '#c9ccd0' : '#141415';
    const seatH = body === 'speedster' ? 0.78 : 1, sx = doorR - 300, by = belt(sx);
    const seat = p`<path d="M ${sx} ${by - 150} L ${sx + 75} ${by + 235 * seatH} Q ${sx + 115} ${by + 300 * seatH} ${sx + 160} ${by + 240 * seatH} L ${sx + 125} ${by - 150} Z" fill="${c.interior}"/>`;
    const fbG = [E[0] + 95, E[1] + 18], ftG = [F[0] + 50, F[1] - 48];
    const frame = (Ft) => painted(u, p`M ${E} L ${Ft} L ${Ft[0] + 62} ${Ft[1] - 8} L ${E[0] + 100} ${E[1] + 4} Z`, body === 'speedster' ? '#17181a' : paint);
    let o = '', can = '', dlo = '', over = '';

    if (closedCoupe) {
      can = painted(u, s.coupe, paint);
      const Q = [xr - g.qIn + (glassT ? 90 : 0), E[1] + g.qUp + (glassT ? 25 : 0)];
      dlo = p`M ${fbG} L ${ftG} C ${G[0] - 60} ${G[1] - 54} ${Q[0] - 430} ${Q[1] + 225} ${Q} Q ${Q[0] - 30} ${Q[1] - 32} ${Q[0] - 90} ${Q[1] - 34} Z`;
      if (glassT) over += p`<path d="M ${F[0] + 30} ${F[1] + 6} C ${F[0] + 150} ${F[1] + 42} ${G[0] - 190} ${G[1]} ${G} C ${s.fb[1]} ${s.fb[2]} ${T}" fill="none" stroke="#10161c" stroke-width="64" stroke-dasharray="${rnd(g.peakX - g.wsX + 620)} 9000" clip-path="url(#${u}can)"/>`;
    } else if (body === 'cabrio') {
      const R1 = [G[0] + 60, G[1] - 22], R2 = [xr - 470, G[1] - 125], R3 = [xr - 60, S[1] + 22];
      if (!c.roofOpen) {
        can = p`<path d="M ${E} L ${F} C ${F[0] + 130} ${F[1] + 36} ${R1[0] - 200} ${R1[1]} ${R1} C ${R1[0] + 250} ${R1[1]} ${R2[0] - 130} ${R2[1] + 70} ${R2} L ${R3} L ${S} Z" fill="${c.top}"/><path d="M ${F[0] + 20} ${F[1] + 2} C ${F[0] + 140} ${F[1] + 30} ${R1[0] - 200} ${R1[1] - 6} ${R1[0]} ${R1[1] - 6} C ${R1[0] + 250} ${R1[1] - 6} ${R2[0] - 130} ${R2[1] + 62} ${R2[0] - 6} ${R2[1] - 4}" fill="none" stroke="#fff" stroke-opacity=".13" stroke-width="10"/>`;
        can += frame(F);
        dlo = p`M ${fbG} L ${ftG} C ${R1[0] - 80} ${R1[1] - 52} ${R2[0] - 320} ${R2[1] + 20} ${R2[0] - 110} ${R2[1] - 80} L ${R2[0] - 10} ${E[1] + 42} Z`;
      } else {
        can = seat + frame(F) + p`<path d="M ${xr - 620} ${belt(xr - 620) - 10} C ${xr - 540} ${S[1] + 70} ${xr - 220} ${S[1] + 85} ${xr - 20} ${S[1] + 5} Z" fill="${c.top}"/>`;
      }
    } else if (bar) {
      const hx = doorR + 30, top = G[1] - 10, hb = belt(hx);
      can = (c.roofOpen ? seat : '') + frame(F);
      // rear glass dome
      const gx = xr + 240, gp = atX(s.dk, gx);
      can += p`<path d="M ${hx + 170} ${top - 14} C ${hx + 470} ${top - 60} ${gx - 170} ${gp[1] + 150} ${gp} L ${S} L ${hx + 240} ${hb} Z" fill="url(#${u}gl)"/><path d="M ${hx + 200} ${top - 30} C ${hx + 470} ${top - 80} ${gx - 190} ${gp[1] + 140} ${gx - 30} ${gp[1] + 10}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="8"/>`;
      can += p`<path d="M ${hx} ${top} L ${hx + 180} ${top - 16} L ${hx + 250} ${hb - 4} L ${hx + 70} ${hb - 4} Z" fill="${f.hoop}"/><path d="M ${hx} ${top} L ${hx + 180} ${top - 16} L ${hx + 250} ${hb - 4} L ${hx + 70} ${hb - 4} Z" fill="url(#${u}sh)"/>`;
      if (lum(f.hoop) > 0.4) for (let i = 0; i < 3; i++) can += p`<path d="M ${hx + 95 + i * 30} ${hb + 150} l 10 60" stroke="#222" stroke-width="9" stroke-opacity=".7"/>`;
      if (!c.roofOpen) can += p`<path d="M ${F[0] + 20} ${F[1] + 4} C ${F[0] + 150} ${F[1] + 44} ${hx - 160} ${top + 6} ${hx + 6} ${top} L ${hx + 20} ${top - 44} C ${hx - 160} ${top - 34} ${F[0] + 170} ${F[1] - 4} ${F[0] + 56} ${F[1] - 40} Z" fill="${c.top}"/>`;
      dlo = c.roofOpen ? '' : p`M ${fbG} L ${ftG} C ${F[0] + 220} ${F[1] - 12} ${hx - 150} ${top - 46} ${hx + 16} ${top - 44} L ${hx + 76} ${hb + 14} Z`;
    } else if (body === 'speedster') {
      const Fs = [E[0] + 0.8 * (F[0] - E[0]), E[1] + 0.68 * (F[1] - E[1])];
      const hx = doorR - 30, hb = belt(hx);
      can = seat + frame(Fs) + painted(u, p`M ${hx} ${hb - 10} C ${hx + 90} ${hb + 215} ${xr - 280} ${hb + 205} ${xr - 40} ${S[1] + 110} C ${xr + 240} ${S[1] + 20} ${T[0] - 420} ${T[1] + 70} ${T[0] - 160} ${T[1] + 10} L ${S} Z`, paint);
      dlo = p`M ${fbG} L ${Fs[0] + 48} ${Fs[1] - 34} L ${doorR - 170} ${belt(doorR - 170) + 14} Z`;
    }

    // ---- lower body
    o += p`<path d="M ${xf - dxF} ${sill} A ${g.archF} ${g.archF} 0 1 0 ${xf + dxF} ${sill} Z M ${xr - dxR} ${sill} A ${g.archR} ${g.archR} 0 1 0 ${xr + dxR} ${sill} Z" fill="#0b0b0c"/>`;
    o += `<clipPath id="${u}can"><path d="${s.coupe}"/></clipPath><clipPath id="${u}tub"><path d="${s.tub}"/></clipPath>`;
    o += can + over + painted(u, s.tub, paint);

    let d = '';
    if (c.livery) d += p`<path d="M -50 0 H ${L + 50} V 600 L -50 520 Z" fill="#1e3987"/><path d="M -50 535 L ${L + 50} 615" stroke="#c41c22" stroke-width="22"/><path d="M -50 568 L ${L + 50} 648" stroke="#c9a23a" stroke-width="12"/>`;
    // lights
    const amber = /round|oval93|egg$/.test(f.lamp);
    if (f.lamp.startsWith('egg')) d += `<ellipse cx="${rnd(g.lx - 120)}" cy="${rnd(g.ly - 46)}" rx="110" ry="30" transform="rotate(${g.lrot} ${rnd(g.lx)} ${rnd(g.ly)})" fill="${f.lamp === 'egg' ? '#e2901f' : '#dfe6ea'}"/>`;
    d += `<ellipse cx="${rnd(g.lx)}" cy="${rnd(g.ly)}" rx="${rnd(g.lrx)}" ry="${rnd(g.lry)}" transform="rotate(${rnd(g.lrot)} ${rnd(g.lx)} ${rnd(g.ly)})" fill="url(#${u}lg)" stroke="${f.lamp === 'round' ? dark(paint, 0.25) : '#000'}" stroke-opacity="${f.lamp === 'round' ? 1 : 0.35}" stroke-width="${f.lamp === 'round' ? 16 : 6}"/>`;
    if (/^led/.test(f.lamp)) d += `<g transform="rotate(${rnd(g.lrot)} ${rnd(g.lx)} ${rnd(g.ly)})" fill="#fff"><rect x="${rnd(g.lx - 95)}" y="${rnd(g.ly + 10)}" width="46" height="12" rx="6"/><rect x="${rnd(g.lx - 100)}" y="${rnd(g.ly - 26)}" width="46" height="12" rx="6"/></g>`;
    const fi = f.fint || 0, ih = [95, 135, 170][fi];
    if (f.ind !== 'box964' || fi) d += p`<rect x="60" y="${g.chinY + 40}" width="${230 + fi * 45}" height="${ih}" rx="34" fill="#0e0e0f"/>`;
    if (f.ind === 'box964' && !fi) d += `<rect x="80" y="455" width="175" height="50" rx="9" fill="#e2901f"/><rect x="170" y="455" width="85" height="50" rx="9" fill="#e9edf0"/>`;
    if (f.ind === 'box993') d += `<rect x="95" y="${g.chinY + 245}" width="150" height="34" rx="12" fill="#e2901f"/>`;
    if (f.ind === 'strip') d += p`<rect x="105" y="${g.chinY + ih + 62}" width="210" height="24" rx="10" fill="#e8ecef"/>`;
    if (f.ind === 'led') d += p`<rect x="110" y="${g.chinY + ih + 18}" width="${190 + fi * 30}" height="11" rx="5" fill="#fff"/>`;
    if (f.canard) d += p`<path d="M 20 ${g.chinY + 120} L 215 ${g.chinY + 165} L 215 ${g.chinY + 148} L 30 ${g.chinY + 96} Z M 30 ${g.chinY + 200} L 190 ${g.chinY + 235} L 190 ${g.chinY + 220} L 38 ${g.chinY + 178} Z" fill="#111"/>`;
    if (f.rep) d += p`<ellipse cx="${xf + g.archF + 62}" cy="555" rx="24" ry="9" fill="${amber ? '#e2901f' : '#e3e7ea'}"/>`;
    d += p`<rect x="${L - g.tlx}" y="${g.tly - g.tlh / 2}" width="${g.tlx + 40}" height="${g.tlh}" rx="${Math.min(g.tlh / 2, 26)}" fill="url(#${u}rd)"/>`;
    if (/964|993/.test(f.tail)) d += p`<rect x="${L - g.tlx}" y="${g.tly + g.tlh / 2 - 22}" width="${g.tlx * 0.45}" height="22" rx="8" fill="#e2901f"/>`;
    // seams and shading
    const seam = 'fill="none" stroke="#000" stroke-opacity=".32" stroke-width="5" stroke-linecap="round"';
    d += f.lamp === 'round' ? p`<path d="M ${xf - g.archF + 8} 520 L 30 528" ${seam}/>` : p`<path d="M ${xf - g.archF + 10} 505 L ${g.lx - g.lrx * 0.2} ${g.ly - g.lry - 26}" ${seam}/>`;
    d += p`<path d="M ${xr + g.archR - 8} 520 L ${L - g.tlx - 20} ${g.tly - g.tlh / 2 - 26} L ${L + 10} ${g.tly - g.tlh / 2 - 34}" ${seam}/>`;
    d += p`<path d="M ${doorF + 34} ${belt(doorF + 34)} C ${doorF + 20} 700 ${doorF - 8} 420 ${doorF} ${sill + 38} L ${doorR - 6} ${sill + 38} C ${doorR + 36} 480 ${doorR + 14} 800 ${doorR - 12} ${belt(doorR)}" ${seam}/>`;
    d += p`<rect x="${xf + dxF}" y="${sill - 5}" width="${xr - dxR - xf - dxF}" height="${f.skirt ? 78 : 58}" fill="#000" opacity="${f.skirt ? 0.3 : 0.2}"/>`;
    d += p`<path d="M ${D[0] + 40} ${D[1] - 18} C ${s.fe[1][0]} ${s.fe[1][1] - 16} ${s.fe[2][0]} ${s.fe[2][1] - 16} ${E[0]} ${E[1] - 16} L ${S[0] + 40} ${S[1] - 14} C ${S[0] + 300} ${S[1] + 8} ${T[0] - 260} ${T[1] - 4} ${T[0] - 40} ${T[1] - 22}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="9" stroke-linecap="round"/>`;
    if (f.si) d += p`<path d="M ${doorR + 28} 430 L ${doorR + 170} 455 L ${doorR + 196} 700 L ${doorR + 62} 668 Z" fill="#0c0c0d"/>`;
    if (f.fv) d += p`<path d="M ${xf + g.archF + 6} 300 L ${xf + g.archF + 104} 318 L ${xf + g.archF + 92} 640 L ${xf + g.archF - 60} 600 Z" fill="#0c0c0d"/>`;
    if (f.louv) for (let i = 0; i < 5; i++) { const x = xf - 150 + i * 62; d += p`<path d="M ${x} ${belt(x) - 34} L ${x + 44} ${belt(x + 44) - 30}" stroke="#101011" stroke-width="13" stroke-linecap="round"/>`; }
    if (f.flare || f.clad) {
      const col = f.clad ? '#232427' : dark(paint, 0.12);
      d += p`<path d="M ${xf - dxF} ${sill} A ${g.archF} ${g.archF} 0 1 0 ${xf + dxF} ${sill} M ${xr - dxR} ${sill} A ${g.archR} ${g.archR} 0 1 0 ${xr + dxR} ${sill}" fill="none" stroke="${col}" stroke-width="${f.clad ? 46 : 60}"/>`;
      if (f.clad) d += p`<rect x="${xf + dxF}" y="${sill - 5}" width="${xr - dxR - xf - dxF}" height="70" fill="#232427"/>`;
    }
    if (c.decal && f.dec) {
      const col = f.decMatch && FIN[c.wheel.fin] && /red|blue|orange|gold/.test(c.wheel.fin) ? FIN[c.wheel.fin][0] : f.decMatch && f.stripe ? f.stripe : lum(paint) > 0.45 ? '#141415' : '#ecedee';
      d += p`<text transform="translate(${(doorF + doorR) / 2 + 20} ${sill + 78}) scale(1 -1)" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-style="italic" font-weight="800" font-size="${f.dec.length > 9 ? 62 : 84}" letter-spacing="3" fill="${col}">${f.dec}</text>`;
    }
    o += `<g clip-path="url(#${u}tub)">${d}</g>`;

    // glass
    if (dlo) {
      o += `<clipPath id="${u}dlo"><path d="${dlo}"/></clipPath><g clip-path="url(#${u}dlo)">${seat}<path d="${dlo}" fill="url(#${u}gl)" opacity=".86"/>`;
      o += p`<path d="M ${doorR - 30} ${belt(doorR) - 20} L ${doorR - 5} ${g.H}" stroke="#101112" stroke-width="${body === 'coupe' || glassT ? 46 : 0}"/>`;
      o += p`<path d="M ${fbG[0] + 120} ${fbG[1]} L ${ftG[0] + 190} ${g.H}" stroke="#fff" stroke-opacity=".1" stroke-width="90"/></g>`;
      o += `<path d="${dlo}" fill="none" stroke="${f.blk ? '#141415' : trim}" stroke-width="13" stroke-linejoin="round"/>`;
    }
    // mirror + handle
    const mp = [[E[0] + 150, E[1] + 42, 82, 46], [E[0] + 105, E[1] + 54, 80, 46], [E[0] + 240, E[1] + 34, 86, 42]][f.mirror];
    if (f.mirror === 2) o += p`<path d="M ${mp[0] + 20} ${mp[1] - 20} L ${mp[0] + 50} ${belt(mp[0] + 50) - 14}" stroke="#141415" stroke-width="24" stroke-linecap="round"/>`;
    o += p`<ellipse cx="${mp[0]}" cy="${mp[1]}" rx="${mp[2]}" ry="${mp[3]}" fill="${f.blk ? '#17181a' : paint}"/><ellipse cx="${mp[0]}" cy="${mp[1]}" rx="${mp[2]}" ry="${mp[3]}" fill="url(#${u}sh)"/><ellipse cx="${mp[0] + 6}" cy="${mp[1] - 14}" rx="${mp[2] - 10}" ry="${mp[3] - 16}" fill="#000" opacity=".22"/>`;
    const hx = doorR - 200, hy = belt(hx) - 108;
    o += [p`<rect x="${hx}" y="${hy}" width="124" height="32" rx="9" fill="#18181a"/>`, p`<rect x="${hx}" y="${hy}" width="130" height="34" rx="14" fill="#000" opacity=".35"/><rect x="${hx + 6}" y="${hy + 10}" width="118" height="22" rx="10" fill="${lite(paint, 0.12)}"/>`, p`<rect x="${hx}" y="${hy + 6}" width="136" height="18" rx="9" fill="none" stroke="#000" stroke-opacity=".4" stroke-width="5"/>`][f.handle];
    // engine-lid grille
    if (closedCoupe) { const a = deck(T[0] - 380), b = deck(T[0] - 110); o += p`<path d="M ${a[0]} ${a[1] + 3} L ${b[0]} ${b[1] + 3}" stroke="#101011" stroke-width="12" stroke-dasharray="14 8"/>`; }
    o += wingSide(u, c, s, deck);
    return { svg: o, s };
  }

  function side(c) {
    const u = c.uid || 'sd', g = c.g, ox = (5000 - g.L) / 2, ride = g.ride || 0;
    const { svg, s } = sideBody(u, c);
    const wf = [s.xf, g.tDF / 2], wr = [s.xr, g.tDR / 2];
    let o = `<defs>${defs(u, c, g.H)}<radialGradient id="${u}gs"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".7" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>`;
    o += `<ellipse cx="2500" cy="${GY + 6}" rx="${rnd(g.L / 2 + 60)}" ry="46" fill="url(#${u}gs)"/>`;
    if (c.ghost) o += ghostSide(c.ghost);
    o += `<g transform="translate(${rnd(ox)} ${GY}) scale(1 -1)"><g transform="translate(0 ${rnd(ride)})">${svg}</g>`;
    o += wheel(wf[0], wf[1], g.tDF, g.rimF, c.wheel, c.cal, true) + wheel(wr[0], wr[1], g.tDR, g.rimR, c.wheel, c.cal, false) + '</g>';
    return o;
  }

  function ghostSide(c) {
    const s = sideShape(c), g = c.g, ox = (5000 - g.L) / 2;
    const st = 'fill="none" stroke="var(--ghost)" stroke-width="9" stroke-dasharray="34 20" stroke-linejoin="round"';
    const top = c.body === 'coupe' || (c.body === 'targa' && c.f.targa === 'glass') ? `<path d="${s.coupe}" ${st}/>` : '';
    return `<g transform="translate(${rnd(ox)} ${GY}) scale(1 -1)" opacity=".9"><g transform="translate(0 ${rnd(g.ride || 0)})"><path d="${s.tub}" ${st}/>${top}</g><circle cx="${rnd(s.xf)}" cy="${rnd(g.tDF / 2)}" r="${rnd(g.tDF / 2)}" ${st}/><circle cx="${rnd(s.xr)}" cy="${rnd(g.tDR / 2)}" r="${rnd(g.tDR / 2)}" ${st}/></g>`;
  }

  // ---- front / rear --------------------------------------------------------
  function endShape(c, rear) {
    const g = c.g, W2 = g.W / 2, H = g.H, cab2 = g.cabW / 2, roof2 = g.roofW / 2, wb = g.cowlY + 30;
    const fw = (g.W0 + (g.W - g.W0) * 0.4) / 2 - 14, by0 = g.rbY - 25, ch = g.chinY, fY = g.crestY, dip = c.f.lamp === 'round' ? 78 : 46;
    const lower = rear
      ? p`M -1 ${by0} L ${W2 - 110} ${by0} Q ${W2 - 12} ${by0 + 8} ${W2 - 6} ${by0 + 130} C ${W2 + 6} ${by0 + 280} ${W2 + 2} ${g.tailY - 130} ${W2 - 28} ${g.tailY - 40} C ${W2 - 90} ${g.tailY + 60} ${cab2 + 130} ${wb - 40} ${cab2} ${wb} L -1 ${wb}`
      : p`M -1 ${ch} L ${fw - 120} ${ch} Q ${fw - 12} ${ch + 8} ${fw - 6} ${ch + 140} C ${fw + 6} ${ch + 300} ${fw} ${fY - 150} ${fw - 40} ${fY - 55} C ${fw - 75} ${fY + 5} ${fw - 150} ${fY + 8} ${fw - 185} ${fY + 4} C ${fw - 255} ${fY - 2} ${fw - 320} ${fY - dip} ${fw - 410} ${fY - dip} L -1 ${fY - dip + 20}`;
    const gb = rear ? wb - 6 : fY - 90, gx = rear ? cab2 : cab2 + 40;
    const house = p`M -1 ${gb} L ${gx} ${gb} C ${gx - 25} ${gb + 150} ${roof2 + 48} ${H - 75} ${roof2 - 10} ${H - 22} Q ${roof2 - 140} ${H} -1 ${H}`;
    return { g, W2, H, cab2, roof2, wb, fw, by0, ch, fY, lower, house };
  }

  function wingEnd(u, c, e, rear) {
    const a = c.aero, g = c.g, W2 = e.W2, paint = c.paint.h;
    if (!a || a.k === 'none') return '';
    let o = '';
    const ty = g.tailY;
    if (rear) {
      if (a.k === 'lip' && c.spUp) o += painted(u, p`M -1 ${ty + 62} L ${W2 * (g.L > 4450 ? 0.82 : 0.56)} ${ty + 62} l 16 ${a.h * 0.42} L -1 ${ty + 66 + a.h * 0.42}`, paint) + (a.gurney ? p`<path d="M -1 ${ty + 68 + a.h * 0.42} H ${W2 * 0.8}" stroke="#111" stroke-width="12"/>` : '');
      if (a.k === 'duck') o += painted(u, p`M -1 ${ty + 24} L ${W2 - 150} ${ty + 20} Q ${W2 - 110} ${ty + a.h * 0.7} ${W2 - 170} ${ty + a.h + 4} L -1 ${ty + a.h + 12}`, paint);
      if (a.k === 'tray') {
        o += painted(u, p`M -1 ${ty + 36} L ${W2 - 120} ${ty + 34} Q ${W2 - 50} ${ty + a.h * 0.6} ${W2 - 85} ${ty + a.h + 2} L -1 ${ty + a.h + 12}`, paint);
        if (a.rub) o += p`<path d="M -1 ${ty + a.h + 12} L ${W2 - 85} ${ty + a.h + 2}" stroke="#141415" stroke-width="18" stroke-linecap="round"/>`;
      }
    }
    const w = a.wing;
    if (w && (rear || ty + w.h > g.cowlY + 60)) {
      const y = ty + w.h, ww = W2 - (w.plate === 'huge' ? 22 : 62), col = w.carbon ? CARBON : paint, th = w.th ? 20 : 32;
      if (rear) o += w.swan ? p`<path d="M ${W2 * 0.3} ${ty + 30} L ${W2 * 0.3} ${y + 70} L ${W2 * 0.3 - 26} ${y + 20}" fill="none" stroke="#1a1b1d" stroke-width="22"/>` : w.plate === 'full' ? '' : p`<rect x="${W2 * 0.3}" y="${ty + 30}" width="26" height="${w.h - 30}" fill="${dark(col, 0.3)}"/>`;
      o += p`<path d="M -1 ${y} H ${ww} V ${y + th} L -1 ${y + th + 6}" fill="${col}"/>`;
      const pl = { small: [y - 55, 120], big: [y - 115, 190], huge: [y - 205, 300], full: [ty + 10, w.h + 55] }[w.plate];
      if (pl) o += p`<rect x="${ww - 12}" y="${pl[0]}" width="${w.pw ? 60 : 26}" height="${pl[1]}" rx="6" fill="${col}"/>`;
    }
    return o;
  }

  function endView(c, rear) {
    const u = (c.uid || 'e') + (rear ? 'r' : 'f'), g = c.g, f = c.f, e = endShape(c, rear), { W2, H, cab2, roof2, wb, fw, by0, ch, fY } = e;
    const paint = c.paint.h, body = c.body, isT = body === 'targa', bar = isT && f.targa === 'bar', open = (body === 'cabrio' || bar) && c.roofOpen, ride = g.ride || 0;
    const tr = rear ? g.trR : g.trF, tw = rear ? g.tyR : g.tyF, tD = rear ? g.tDR : g.tDF;
    let h = ''; // half (mirrored)
    h += p`<rect x="${tr / 2 - tw / 2}" y="0" width="${tw}" height="${tD * 0.62}" rx="34" fill="#161618"/>`;
    let b = ''; // body half, moves with ride height
    if (!rear) b += p`<path d="M ${fw - 80} 330 C ${W2 + 12} 400 ${W2 + 6} ${g.tailY - 150} ${W2 - 50} ${g.tailY - 30} L ${fw - 200} ${g.tailY - 30} Z" fill="${dark(paint, 0.28)}"/>`;
    if (!rear) b += wingEnd(u, c, e, false);
    // greenhouse
    const sp = body === 'speedster';
    const glassF = p`M -1 ${g.cowlY - 28} L ${cab2 - 30} ${g.cowlY - 28} L ${roof2 - 46} ${H - 64} Q ${roof2 - 120} ${H - 46} -1 ${H - 46}`;
    if (!rear && !(body === 'coupe' || (isT && !bar))) b += painted(u, p`M -1 ${fY - 90} L ${cab2 + 40} ${fY - 90} L ${cab2 - 16} ${g.cowlY - 14} L -1 ${g.cowlY - 14}`, paint);
    if (body === 'coupe' || (isT && !bar)) {
      b += painted(u, e.house, paint);
      if (isT) b += p`<path d="M -1 ${H - 40} L ${roof2 - 150} ${H - 44} L ${roof2 - 170} ${H - 6} L -1 ${H - 2}" fill="#10161c"/>`;
    } else if (body === 'cabrio' && !open) b += rear ? `<path d="${e.house}" fill="${c.top}"/>` : p`<path d="M -1 ${g.cowlY - 30} L ${cab2 - 6} ${g.cowlY - 30} C ${cab2 - 30} ${g.cowlY + 110} ${roof2 + 48} ${H - 75} ${roof2 - 10} ${H - 22} Q ${roof2 - 140} ${H} -1 ${H}" fill="${c.top}"/>`;
    else if (bar) {
      if (rear) b += p`<path d="M -1 ${H - 60} L ${roof2 - 30} ${H - 66} C ${roof2 + 50} ${H - 110} ${cab2 - 20} ${wb + 150} ${cab2} ${wb - 6} L ${cab2 - 110} ${wb - 6} C ${cab2 - 120} ${wb + 150} ${roof2 - 10} ${H - 150} ${roof2 - 90} ${H - 130} L -1 ${H - 124}" fill="${f.hoop}"/>`;
      if (rear) b += p`<path d="M -1 ${H - 128} L ${roof2 - 90} ${H - 134} C ${roof2 - 20} ${H - 150} ${cab2 - 130} ${wb + 150} ${cab2 - 116} ${wb} L -1 ${wb}" fill="url(#${u}gl)"/>`;
      if (!open) b += p`<path d="M -1 ${H - 20} L ${roof2 - 60} ${H - 30} L ${roof2 - 32} ${H - 66} L -1 ${H - 60}" fill="${c.top}"/>`;
    }
    if (open || sp) {
      const k = sp ? 0.7 : 1, top = g.cowlY - 28 + (H - 46 - g.cowlY + 28) * k;
      b += p`<rect x="150" y="${wb - 20}" width="190" height="${sp ? 200 : 250}" rx="60" fill="${sp && rear ? paint : c.interior}"/>`;
      if (!rear || !bar) b += p`<path d="M -1 ${g.cowlY - 28} L ${cab2 - 30} ${g.cowlY - 28} L ${cab2 - 30 - (cab2 - roof2 + 16) * k} ${top - 14} Q ${roof2 - 120} ${top} -1 ${top}" fill="url(#${u}gl)" opacity="${rear ? 0.5 : 0.8}" stroke="${sp ? '#17181a' : paint}" stroke-width="22"/>`;
      if (body === 'cabrio' && rear) b += p`<path d="M -1 ${wb - 10} L ${cab2 - 60} ${wb - 10} Q ${cab2 - 90} ${wb + 70} ${cab2 - 220} ${wb + 74} L -1 ${wb + 78}" fill="${c.top}"/>`;
    } else if (!rear) b += `<path d="${glassF}" fill="url(#${u}gl)"${bar ? ` stroke="${paint}" stroke-width="24"` : ''}/>`;
    else if (body === 'coupe' || (isT && !bar)) b += p`<path d="M -1 ${H - 78} L ${roof2 - 115} ${H - 84} Q ${roof2 - 62} ${H - 90} ${roof2 - 48} ${H - 126} L ${cab2 - 128} ${wb + 56} Q ${cab2 - 150} ${wb + 34} ${cab2 - 210} ${wb + 36} L -1 ${wb + 44}" fill="url(#${u}gl)"/>`;
    else if (body === 'cabrio') b += p`<rect x="0" y="${wb + 110}" width="300" height="${H - wb - 240}" rx="30" fill="url(#${u}gl)"/>`;
    // mirrors
    const mx = (rear ? W2 : fw) + (f.mirror === 0 ? 20 : 40);
    b += p`<path d="M ${cab2 - 20} ${g.cowlY + 30} L ${mx - 30} ${g.cowlY + 50}" stroke="${dark(paint, 0.35)}" stroke-width="26"/>`;
    b += p`<ellipse cx="${mx}" cy="${g.cowlY + 55}" rx="${f.mirror === 0 ? 70 : 84}" ry="46" fill="${f.blk ? '#17181a' : paint}"/><ellipse cx="${mx}" cy="${g.cowlY + 55}" rx="${f.mirror === 0 ? 70 : 84}" ry="46" fill="url(#${u}sh)"/>`;
    if (rear) b += p`<ellipse cx="${mx}" cy="${g.cowlY + 55}" rx="${f.mirror === 0 ? 54 : 66}" ry="32" fill="#3a4651"/>`;
    b += painted(u, e.lower, paint);
    let d = ''; // clipped details
    if (c.livery) d += p`<rect x="0" y="0" width="${W2 + 20}" height="560" fill="#1e3987"/><rect x="0" y="560" width="${W2 + 20}" height="22" fill="#c41c22"/><rect x="0" y="596" width="${W2 + 20}" height="12" fill="#c9a23a"/>`;
    let full = ''; // unmirrored extras (text, plate)
    if (rear) {
      const y = g.tly, t = f.tail;
      const lamp = (x0, x1, y0, y1, rx) => p`<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="${rx}" fill="url(#${u}rd)"/>`;
      const band = (x1, y0, y1) => p`<rect x="-5" y="${y0}" width="${x1 + 5}" height="${y1 - y0}" fill="#6d0e13"/><rect x="-5" y="${y1 - (y1 - y0) * 0.3}" width="${x1 + 5}" height="${(y1 - y0) * 0.3}" fill="#fff" opacity=".1"/>`;
      if (t === '964') d += band(W2 - 320, y - 30, y + 32) + lamp(W2 - 335, W2 - 28, y - 34, y + 36, 12) + p`<rect x="${W2 - 150}" y="${y - 34}" width="122" height="30" rx="8" fill="#e2901f"/>`;
      if (t === '993') d += band(W2 - 330, y - 20, y + 30) + lamp(W2 - 350, W2 - 24, y - 30, y + 46, 30) + p`<rect x="${W2 - 160}" y="${y - 30}" width="136" height="30" rx="12" fill="#e2901f"/>`;
      if (t === '996') d += (f.band ? band(W2 - 350, y - 20, y + 22) : '') + lamp(W2 - 372, W2 - 34, y - 46, y + 46, 42) + p`<rect x="${W2 - 190}" y="${y + 4}" width="130" height="26" rx="12" fill="#f0f2f3" opacity=".85"/>`;
      if (/^997/.test(t)) d += (f.band ? band(W2 - 290, y - 8, y + 8) : '') + lamp(W2 - 305, W2 - 40, y - 40, y + 40, 38) + (t === '9972' ? p`<path d="M ${W2 - 275} ${y + 10} H ${W2 - 80} M ${W2 - 260} ${y - 12} H ${W2 - 90}" stroke="#ff7a70" stroke-width="9" stroke-linecap="round"/>` : p`<rect x="${W2 - 180}" y="${y - 2}" width="100" height="22" rx="10" fill="#f0f2f3" opacity=".8"/>`);
      if (/^991/.test(t)) d += (f.band ? band(W2 - 420, y - 6, y + 6) : '') + lamp(W2 - 435, W2 - 34, y - 18, y + 18, 16) + (t === '9912' ? p`<path d="M ${W2 - 400} ${y + 6} H ${W2 - 250} M ${W2 - 400} ${y - 6} H ${W2 - 250}" stroke="#ff8a80" stroke-width="6"/>` : '');
      if (t === '992') d += p`<rect x="-5" y="${y - 13}" width="${W2 - 40}" height="26" rx="12" fill="url(#${u}rd)"/><rect x="-5" y="${y - 2}" width="${W2 - 62}" height="5" fill="#ff8a80"/>`;
      // grille, valance, exhaust
      const gw = g.W > 1800 ? 340 : 300, gy = g.tailY + 28;
      d += p`<rect x="-5" y="${gy}" width="${gw}" height="56" rx="10" fill="#0e0e0f"/>`;
      for (let i = 0; i < (f.vslat ? 9 : 4); i++) d += f.vslat ? p`<rect x="${12 + i * 36}" y="${gy + 6}" width="12" height="44" fill="#2a2b2e"/>` : p`<rect x="0" y="${gy + 8 + i * 12}" width="${gw - 14}" height="4" fill="#2a2b2e"/>`;
      d += p`<rect x="-5" y="${by0 - 5}" width="${W2 - 150}" height="${g.L > 4300 ? 95 : 55}" rx="14" fill="#0f0f10" opacity="${g.L > 4300 ? 0.9 : 0.5}"/>`;
      const ey = by0 + 44, tip = (x, rx, ry, sq) => (sq ? p`<rect x="${x - rx}" y="${ey - ry}" width="${rx * 2}" height="${ry * 2}" rx="12" fill="#c5c8cc"/><rect x="${x - rx + 8}" y="${ey - ry + 8}" width="${rx * 2 - 16}" height="${ry * 2 - 16}" rx="8" fill="#0b0b0c"/>` : p`<ellipse cx="${x}" cy="${ey}" rx="${rx}" ry="${ry}" fill="#c5c8cc"/><ellipse cx="${x}" cy="${ey}" rx="${rx - 9}" ry="${ry - 9}" fill="#0b0b0c"/>`);
      const ex = f.ex;
      if (ex === 'oval1r') full += `<g transform="scale(-1 1)">${tip(W2 - 330, 64, 30)}</g>`;
      if (ex === 'oval1') d += tip(W2 - 330, 62, 30);
      if (ex === 'oval2') d += tip(W2 - 330, 78, 36);
      if (ex === 'twin' || ex === 'quad') d += tip(W2 - 395, 38, 38) + tip(W2 - 300, 38, 38);
      if (ex === 'quadsq') d += tip(W2 - 400, 44, 34, 1) + tip(W2 - 295, 44, 34, 1);
      if (ex === 'center') d += tip(62, 46, 46);
      if (ex === 'center2') d += tip(170, 44, 44);
      if (ex === 'ovalIn') d += tip(340, 66, 36);
      if (f.fint === 2 || f.si) d += p`<rect x="${W2 - 190}" y="${by0 + 150}" width="120" height="110" rx="20" fill="#0e0e0f"/>`;
      if (f.stripe && body === 'coupe') b += p`<rect x="45" y="${H - 22}" width="75" height="22" fill="${f.stripe}"/>`, d += p`<rect x="45" y="${g.tailY + 90}" width="75" height="${wb - g.tailY - 90}" fill="${f.stripe}"/>`;
      full += p`<rect x="-260" y="${by0 + 110}" width="520" height="112" rx="8" fill="#d6d8da" stroke="#1a1a1c" stroke-width="6"/>`;
      if (t === '964' || t === '993' || t === '992') full += p`<text transform="translate(0 ${t === '992' ? y - 62 : y - 14}) scale(1 -1)" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="700" font-size="${t === '992' ? 40 : 34}" letter-spacing="${t === '992' ? 26 : 14}" fill="${t === '992' ? (lum(paint) > 0.45 ? '#141415' : '#d9dbdd') : '#f3c9c9'}">PORSCHE</text>`;
    } else {
      const hx = fw - 185, L = f.lamp, glass = `fill="url(#${u}lg)" stroke="#000" stroke-opacity=".35" stroke-width="6"`;
      const hy = fY - (L === 'round' ? 82 : 98);
      if (L === 'round') d += p`<circle cx="${hx}" cy="${hy}" r="90" fill="url(#${u}lg)" stroke="${dark(paint, 0.22)}" stroke-width="18"/><circle cx="${hx}" cy="${hy}" r="52" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5"/>`;
      if (L === 'oval93') d += p`<ellipse cx="${hx}" cy="${hy}" rx="98" ry="76" transform="rotate(-12 ${hx} ${hy})" ${glass}/><circle cx="${hx}" cy="${hy}" r="42" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5"/>`;
      if (/^egg/.test(L)) d += p`<path d="M ${hx - 150} ${hy - 78} Q ${hx - 60} ${hy - 110} ${hx + 60} ${hy - 62} L ${hx - 40} ${hy - 20} Z" fill="${L === 'egg' ? '#e2901f' : '#dfe6ea'}" stroke="#000" stroke-opacity=".3" stroke-width="6"/><ellipse cx="${hx}" cy="${hy}" rx="104" ry="72" transform="rotate(-10 ${hx} ${hy})" ${glass}/><circle cx="${hx + 10}" cy="${hy + 4}" r="38" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5"/>`;
      if (L === 'oval97' || L === 'oval91') d += p`<ellipse cx="${hx}" cy="${hy}" rx="${L === 'oval97' ? 82 : 86}" ry="92" ${glass}/><circle cx="${hx}" cy="${hy}" r="40" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5"/>`;
      if (/^led/.test(L)) { d += p`<ellipse cx="${hx}" cy="${hy}" rx="86" ry="90" fill="#27313a" stroke="#000" stroke-opacity=".35" stroke-width="6"/>`; for (const [a, bb] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) d += p`<rect x="${hx + a * 36 - 20}" y="${hy + bb * 36 - 7}" width="40" height="14" rx="7" fill="#fff"/>`; if (L === 'led2') d += p`<ellipse cx="${hx}" cy="${hy}" rx="70" ry="74" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5"/>`; }
      const fi = f.fint || 0, ih = [100, 135, 168][fi], iy = ch + 42;
      if (f.ind === 'box964' && !fi) {
        d += p`<rect x="${fw - 395}" y="${ch + 185}" width="285" height="64" rx="10" fill="#e9edf0" stroke="#000" stroke-opacity=".3" stroke-width="5"/><rect x="${fw - 215}" y="${ch + 185}" width="105" height="64" rx="10" fill="#e2901f"/><rect x="-5" y="${ch + 50}" width="230" height="52" rx="14" fill="#0e0e0f"/>`;
      } else {
        d += p`<rect x="${fw - 430}" y="${iy}" width="${330}" height="${ih}" rx="32" fill="#0e0e0f"/><rect x="-5" y="${iy}" width="${fi === 2 ? 290 : 240}" height="${ih * (fi ? 1 : 0.8)}" rx="26" fill="#0e0e0f"/>`;
        if (f.flaps) for (let i = 0; i < 5; i++) d += p`<rect x="${fw - 400 + i * 56}" y="${iy + 12}" width="10" height="${ih - 24}" fill="#2c2d30"/>`;
        else d += p`<path d="M ${fw - 410} ${iy + ih * 0.36} h 290 M ${fw - 410} ${iy + ih * 0.68} h 290" stroke="#2c2d30" stroke-width="7"/>`;
        if (f.ind === 'box964') d += p`<circle cx="${fw - 250}" cy="${ch + 215}" r="34" fill="#0e0e0f"/>`;
        if (f.ind === 'box993') d += p`<rect x="${fw - 380}" y="${iy + ih + 26}" width="230" height="36" rx="14" fill="#e2901f"/>`;
        if (f.ind === 'strip') d += p`<rect x="${fw - 405}" y="${iy + ih + 22}" width="270" height="26" rx="10" fill="#e8ecef"/>`;
        if (f.ind === 'led') d += p`<rect x="${fw - 405}" y="${iy + ih - 26}" width="270" height="12" rx="6" fill="#fff"/>`;
      }
      if (f.canard) d += p`<path d="M ${fw - 100} ${ch + 150} L ${fw + 30} ${ch + 190} L ${fw + 30} ${ch + 172} Z M ${fw - 100} ${ch + 230} L ${fw + 24} ${ch + 262} L ${fw + 24} ${ch + 246} Z" fill="#111"/>`;
      if (f.hoodv) d += p`<ellipse cx="170" cy="${fY - 88}" rx="100" ry="15" fill="#0e0e0f"/>`;
      if (f.stripe) d += p`<rect x="45" y="${fY - 60}" width="75" height="200" fill="${f.stripe}"/>`, b += body === 'coupe' ? p`<rect x="45" y="${H - 44}" width="75" height="44" fill="${f.stripe}"/>` : '';
      d += p`<path d="M -1 ${fY - 190} L ${fw - 330} ${fY - 200} Q ${fw - 190} ${fY - 215} ${fw - 60} ${fY - 300}" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="5"/>`;
    }
    if (f.flare || f.clad) d += p`<path d="M ${(rear ? W2 : fw) - 4} ${(rear ? by0 : ch) + 60} V ${(rear ? g.tailY : fY) - 190}" stroke="${f.clad ? '#232427' : dark(paint, 0.15)}" stroke-width="44"/>`;
    b += `<clipPath id="${u}cl"><path d="${e.lower}"/></clipPath><g clip-path="url(#${u}cl)">${d}</g>`;
    if (rear) b += wingEnd(u, c, e, true);
    let ghost = '';
    if (c.ghost) {
      const ge = endShape(c.ghost, rear), st = 'fill="none" stroke="var(--ghost)" stroke-width="9" stroke-dasharray="34 20"';
      ghost = `<g id="${u}gh" transform="translate(0 ${rnd(c.ghost.g.ride || 0)})"><path d="${ge.lower}" ${st}/>${c.ghost.body === 'coupe' ? `<path d="${ge.house}" ${st}/>` : ''}</g><use href="#${u}gh" transform="scale(-1 1)"/>`;
    }
    return `<defs>${defs(u, c, H)}<radialGradient id="${u}gs"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="1200" cy="${GY + 6}" rx="${rnd(W2 + 120)}" ry="40" fill="url(#${u}gs)"/>
      <g transform="translate(1200 ${GY}) scale(1 -1)">${ghost}<g id="${u}h">${h}<g transform="translate(0 ${rnd(ride)})">${b}</g></g><use href="#${u}h" transform="scale(-1 1)"/><g transform="translate(0 ${rnd(ride)})">${full}</g></g>`;
  }

  function wheelThumb(w) {
    return `<svg viewBox="-60 -60 120 120" aria-hidden="true"><g transform="scale(${(112 / TYRE[w.rr]).toFixed(4)})">${wheel(0, 0, TYRE[w.rr], w.rr, w, '#c8161d', true)}</g></svg>`;
  }

  window.NA.draw = { side, front: (c) => endView(c, false), rear: (c) => endView(c, true), wheelThumb, TYRE };
})();
