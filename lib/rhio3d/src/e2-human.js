/* RHIO — humanoid rig builder: soft stylized body, expressive face, outfits. */
(function (G) {
'use strict';
const T = G.THREE, R = G.RHIO;
const { TAU, clamp, lerp } = R.util;
const { lathe, taper, shell, sphere, capsule, torus, cyl, cone, rbox, circle, cached } = R.geo;
const add = R.add, joint = R.joint;
const PI = Math.PI;

const BUILDS = {
  slim:    { sh: 0.158, chest: 0.128, waist: 0.1, hip: 0.118, arm: 0.92, leg: 0.95, h: 0.97 },
  regular: { sh: 0.172, chest: 0.14, waist: 0.108, hip: 0.124, arm: 1, leg: 1, h: 1 },
  curvy:   { sh: 0.158, chest: 0.134, waist: 0.1, hip: 0.14, arm: 0.95, leg: 1.02, h: 0.98 },
  broad:   { sh: 0.19, chest: 0.155, waist: 0.122, hip: 0.13, arm: 1.12, leg: 1.08, h: 1.04 },
};
R.BUILDS = BUILDS;

// ellipsoid head surface helper
function headPt(H, lon, lat, out = 0) {
  const f = chinTaper(lat);
  const d = new T.Vector3(Math.sin(lon) * Math.cos(lat) * f, Math.sin(lat), Math.cos(lon) * Math.cos(lat) * f);
  const n = new T.Vector3(d.x / H.r.x, d.y / H.r.y, d.z / H.r.z).normalize();
  const p = new T.Vector3(d.x * H.r.x, d.y * H.r.y, d.z * H.r.z).add(H.c).addScaledVector(n, out);
  return { p, n };
}
function chinTaper(lat) { return lat < 0 ? 1 - 0.14 * Math.pow(Math.sin(-lat), 2.2) : 1; }
function headGeo() { return cached('headGeo', () => { const pts = []; for (let i = 0; i <= 40; i++) { const lat = -Math.PI / 2 + (i / 40) * Math.PI; pts.push([Math.cos(lat) * chinTaper(lat), Math.sin(lat)]); } return lathe(pts, 44); }); }
function orient(o, n) { o.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), n); }
function placeOn(parent, H, lon, lat, out) { const { p, n } = headPt(H, lon, lat, out); const g = new T.Group(); g.position.copy(p); orient(g, n); parent.add(g); return g; }

/* ---------------- FACE ---------------- */
function buildFace(head, H, M, look) {
  const F = { eyes: [], irises: [], happy: [], closed: [], brows: [], mouths: {}, mouthS: {}, cur: {}, blinkT: 2 + Math.random() * 2, blink: 0, sacc: new T.Vector2(), saccT: 1, look: new T.Vector2(), screen: false };
  // eyes
  for (const s of [1, -1]) {
    const g = placeOn(head, H, 0.34 * s, -0.02, -0.004);
    const eye = new T.Group(); g.add(eye);
    add(eye, sphere(0.034), M.get('eyeW'), [0, 0, 0], null, [1, 1.2, 0.42], { noShadow: true });
    const ir = new T.Group(); ir.position.z = 0.009; eye.add(ir);
    add(ir, sphere(0.022), M.get('iris'), [0, 0, 0], null, [1, 1.1, 0.35], { noShadow: true });
    add(ir, sphere(0.0115), M.get('black'), [0, 0, 0.0055], null, [1, 1.05, 0.3], { noShadow: true });
    add(ir, sphere(0.0058), M.get('shine'), [0.0075 * s, 0.0095, 0.009], null, null, { noShadow: true });
    add(ir, sphere(0.003), M.get('shine'), [-0.006 * s, -0.008, 0.009], null, null, { noShadow: true });
    // upper lash line
    add(eye, torus(0.034, 0.0048, 6, 18, PI), M.get('dark'), [0, 0.002, 0.006], [0, 0, 0], [1.02, 1.22, 1], { noShadow: true });
    const hp = add(g, torus(0.024, 0.0062, 6, 16, PI), M.get('dark'), [0, -0.004, 0.006], null, null, { noShadow: true });
    const cl = add(g, torus(0.024, 0.0055, 6, 16, PI), M.get('dark'), [0, 0.006, 0.006], [0, 0, PI], [1, 0.55, 1], { noShadow: true });
    hp.visible = cl.visible = false;
    F.eyes.push(eye); F.irises.push(ir); F.happy.push(hp); F.closed.push(cl);
    // brow
    const bg = placeOn(head, H, 0.33 * s, 0.215, 0.002);
    const bw = new T.Group(); bg.add(bw);
    add(bw, capsule(0.0068, 0.036, 4, 8), M.get('brow'), [0, 0, 0], [0, 0, PI / 2 + 0.08 * s], [1, 1, 0.7], { noShadow: true });
    bw.userData.s = s; F.brows.push(bw);
    // cheek blush
    const ck = placeOn(head, H, 0.52 * s, -0.2, 0.001);
    add(ck, circle(0.03, 18), M.get('blush'), [0, 0, 0], null, [1, 0.65, 1], { noShadow: true });
    // ear
    const ep = headPt(H, 1.52 * s, -0.05, -0.012);
    add(head, sphere(0.034), M.get('skin'), [ep.p.x, ep.p.y, ep.p.z], [0, 0.35 * s, 0], [0.55, 1, 0.8]);
  }
  // nose
  const np = headPt(H, 0, -0.14, -0.006);
  add(head, sphere(0.02), M.get('skinShade'), [np.p.x, np.p.y, np.p.z + 0.002], null, [1.05, 0.85, 0.9], { noShadow: true });
  // mouth
  const mg = placeOn(head, H, 0, -0.34, look.facial === 'beard' ? 0.006 : 0.001);
  const mk = (k, build) => { const g = new T.Group(); build(g); mg.add(g); F.mouths[k] = g; F.mouthS[k] = 0; g.scale.setScalar(0.001); g.visible = false; };
  mk('smile', g => add(g, torus(0.03, 0.0056, 6, 22, PI), M.get('lip'), [0, 0.014, 0], [0, 0, PI], [1, 0.8, 1], { noShadow: true }));
  mk('soft', g => add(g, torus(0.024, 0.0052, 6, 20, PI), M.get('lip'), [0, 0.008, 0], [0, 0, PI], [1, 0.45, 1], { noShadow: true }));
  mk('flat', g => add(g, capsule(0.0052, 0.024, 4, 8), M.get('lip'), [0, 0, 0], [0, 0, PI / 2], null, { noShadow: true }));
  mk('open', g => { add(g, sphere(0.026), M.get('mouthIn'), [0, -0.004, -0.004], null, [1.15, 0.85, 0.3], { noShadow: true }); add(g, sphere(0.014), M.get('tongue'), [0, -0.014, 0.001], null, [1.2, 0.6, 0.3], { noShadow: true }); });
  mk('grin', g => { add(g, circle(0.036, 22, PI, PI), M.get('mouthIn'), [0, 0.006, 0.004], null, [1, 0.85, 1], { noShadow: true }); add(g, rbox(0.052, 0.009, 0.004, 0.0019, 2), M.get('teeth'), [0, 0.001, 0.0065], null, null, { noShadow: true }); });
  mk('o', g => add(g, sphere(0.016), M.get('mouthIn'), [0, -0.004, -0.002], null, [0.9, 1.1, 0.3], { noShadow: true }));
  F.set = function (e) { this.target = e; };
  F.target = { mouth: 'soft', eyes: 'open', brow: 0 };
  F.update = function (dt, lookX, lookY) {
    const e = this.target;
    for (const k in this.mouths) {
      const want = e.mouth === k ? 1 : 0; this.mouthS[k] = lerp(this.mouthS[k], want, 1 - Math.exp(-dt * 18));
      const g = this.mouths[k], s = this.mouthS[k]; g.visible = s > 0.02; g.scale.setScalar(Math.max(0.001, s));
    }
    // blink
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 0.16; this.blinkT = Math.random() < 0.18 ? 0.25 : 2.2 + Math.random() * 3.2; }
    let lid = 1;
    if (this.blink > 0) { this.blink -= dt; const p = 1 - this.blink / 0.16; lid = Math.abs(p * 2 - 1); lid = Math.max(0.06, lid); }
    const mode = e.eyes;
    this.eyes.forEach((ey, i) => {
      ey.visible = mode === 'open' || mode === 'wide' || mode === 'squint';
      const base = mode === 'wide' ? 1.12 : mode === 'squint' ? 0.55 : 1;
      ey.scale.set(1, base * lid, 1);
      this.happy[i].visible = mode === 'happy'; this.closed[i].visible = mode === 'closed';
    });
    // saccades + look
    this.saccT -= dt;
    if (this.saccT <= 0) { this.sacc.set((Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.004); this.saccT = 0.5 + Math.random() * 1.8; }
    this.look.x = lerp(this.look.x, clamp(lookX, -1, 1) * 0.009 + this.sacc.x, 1 - Math.exp(-dt * 20));
    this.look.y = lerp(this.look.y, clamp(lookY, -1, 1) * 0.007 + this.sacc.y + (e.eyesUp ? 0.008 : 0), 1 - Math.exp(-dt * 20));
    this.irises.forEach(ir => { ir.position.x = this.look.x; ir.position.y = this.look.y; });
    // brows
    const b = e.brow || 0, raise = (e.raise || 0);
    this.brows.forEach(bw => {
      const s = bw.userData.s;
      const tgtY = raise * 0.012 + (b < 0 ? b * 0.004 : b * 0.006);
      const tgtR = b < 0 ? s * -b * 0.35 : -s * b * 0.25; // furrow(-) inner down, sad(+) inner up
      bw.position.y = lerp(bw.position.y, tgtY + (1 - lid) * -0.004, 1 - Math.exp(-dt * 14));
      bw.rotation.z = lerp(bw.rotation.z, tgtR, 1 - Math.exp(-dt * 14));
    });
  };
  return F;
}

/* screen face used by androids & companions */
function buildScreenFace(parent, M, o) {
  const F = { eyes: [], happy: [], closed: [], mouths: {}, mouthS: {}, blinkT: 2, blink: 0, look: new T.Vector2(), screen: true, target: { mouth: 'soft', eyes: 'open', brow: 0 } };
  const glow = M.get('glow');
  const eg = new T.Group(); eg.position.set(o.x || 0, o.y || 0, o.z); parent.add(eg); F.group = eg;
  const sp = o.sp || 0.05, er = o.er || 0.017;
  for (const s of [1, -1]) {
    const e = add(eg, capsule(er, er * 1.2, 4, 10), glow, [sp * s, 0.006, 0], null, [1, 1, 0.35], { noShadow: true });
    const hp = add(eg, torus(er * 1.3, er * 0.35, 6, 14, PI), glow, [sp * s, 0, 0], null, [1, 1, 0.5], { noShadow: true });
    const cl = add(eg, torus(er * 1.3, er * 0.35, 6, 14, PI), glow, [sp * s, 0.008, 0], [0, 0, PI], [1, 0.6, 0.5], { noShadow: true });
    hp.visible = cl.visible = false; F.eyes.push(e); F.happy.push(hp); F.closed.push(cl);
  }
  const mk = (k, build) => { const g = new T.Group(); g.position.y = -(o.my || 0.045); build(g); eg.add(g); F.mouths[k] = g; F.mouthS[k] = 0; g.visible = false; };
  mk('smile', g => add(g, torus(0.022, 0.0055, 6, 16, PI), glow, [0, 0.01, 0], [0, 0, PI], [1, 0.7, 0.5], { noShadow: true }));
  mk('soft', g => add(g, torus(0.016, 0.005, 6, 16, PI), glow, [0, 0.006, 0], [0, 0, PI], [1, 0.45, 0.5], { noShadow: true }));
  mk('flat', g => add(g, capsule(0.005, 0.022, 4, 8), glow, [0, 0, 0], [0, 0, PI / 2], null, { noShadow: true }));
  mk('open', g => add(g, sphere(0.018), glow, [0, 0, 0], null, [1.2, 0.8, 0.25], { noShadow: true }));
  mk('grin', g => add(g, circle(0.024, 18, PI, PI), glow, [0, 0.006, 0], null, null, { noShadow: true }));
  mk('o', g => add(g, torus(0.011, 0.004, 6, 14), glow, [0, 0, 0], null, null, { noShadow: true }));
  F.set = function (e) { this.target = e; };
  F.update = function (dt, lx, ly) {
    const e = this.target;
    for (const k in this.mouths) { const w = e.mouth === k ? 1 : 0; this.mouthS[k] = lerp(this.mouthS[k], w, 1 - Math.exp(-dt * 18)); const g = this.mouths[k]; g.visible = this.mouthS[k] > 0.02; g.scale.setScalar(Math.max(0.001, this.mouthS[k])); }
    this.blinkT -= dt; if (this.blinkT <= 0) { this.blink = 0.14; this.blinkT = 2 + Math.random() * 3.5; }
    let lid = 1; if (this.blink > 0) { this.blink -= dt; lid = Math.max(0.1, Math.abs((1 - this.blink / 0.14) * 2 - 1)); }
    this.eyes.forEach((ey, i) => {
      const m = e.eyes; ey.visible = m !== 'happy' && m !== 'closed';
      ey.scale.set(1, (m === 'wide' ? 1.25 : m === 'squint' ? 0.5 : 1) * lid, 0.35);
      this.happy[i].visible = m === 'happy'; this.closed[i].visible = m === 'closed';
    });
    this.look.x = lerp(this.look.x, clamp(lx, -1, 1) * 0.018, 1 - Math.exp(-dt * 12));
    this.look.y = lerp(this.look.y, clamp(ly, -1, 1) * 0.012 + (e.eyesUp ? 0.01 : 0), 1 - Math.exp(-dt * 12));
    this.group.position.x = (o.x || 0) + this.look.x; this.group.position.y = (o.y || 0) + this.look.y;
  };
  return F;
}
R.buildScreenFace = buildScreenFace;

/* ---------------- HAIR ---------------- */
function buildHair(head, H, M, style, springs, look) {
  const hm = M.get('hair');
  if (style === 'none' || look.head === 'helmet' && style !== 'buzz' && false) return;
  const cap = (scale = 1.07, tilt = -0.42, tl = 1.78) => add(head, sphere(1, 36, 20, 0, TAU, 0, tl), hm, [H.c.x, H.c.y + 0.004, H.c.z - 0.004], [tilt, 0, 0], [H.r.x * scale, H.r.y * scale, H.r.z * scale]);
  const fringe = (n, lat, spread, side = 0, r = 0.05) => {
    for (let i = 0; i < n; i++) {
      const lon = (i - (n - 1) / 2) * spread + side;
      const { p, n: nn } = headPt(H, lon, lat, 0.004);
      const m = add(head, sphere(r, 16, 12), hm, [p.x, p.y, p.z], null, [1.15, 0.62, 0.62]);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), nn); m.rotateZ((i - (n - 1) / 2) * -0.25 + side * 0.6);
    }
  };
  const sides = (len = 1.9, open = 1.9, sc = 1.12) => add(head, sphere(1, 36, 18, PI / 2 + open / 2, TAU - open, 0.25, len), hm, [H.c.x, H.c.y - 0.015, H.c.z - 0.006], null, [H.r.x * sc, H.r.y * sc, H.r.z * (sc - 0.01)]).material.side = T.DoubleSide;
  const chain = (parent, pos, n, r0, seg, opts = {}) => {
    let par = parent, r = r0; const out = [];
    for (let i = 0; i < n; i++) {
      const b = joint(par, 'hair' + i, i === 0 ? pos : [0, -seg, 0]);
      if (i === 0 && opts.rot) b.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
      add(b, sphere(r, 18, 14), hm, [0, -seg * 0.5, 0], null, opts.scl || [1, 1.35, 0.9]);
      springs.push(new R.Spring(b, { k: opts.k || 55 - i * 8, d: 5, g: 0.45 + i * 0.1, i: 0.016 + i * 0.006, lim: 1.2 }));
      par = b; r *= opts.taper || 0.84; out.push(b);
    }
    return out;
  };
  switch (style) {
    case 'buzz': cap(1.035, -0.5, 1.72); break;
    case 'short': cap(); fringe(5, 0.5, 0.26, 0.12, 0.052); break;
    case 'swept': cap(1.08, -0.38); fringe(4, 0.56, 0.24, 0.35, 0.058); break;
    case 'spiky': {
      cap(1.06, -0.4);
      const spikes = [[0, 0.95], [0.5, 0.75], [-0.5, 0.75], [0.25, 0.55], [-0.25, 0.55], [1.2, 0.5], [-1.2, 0.5], [2.4, 0.6], [-2.4, 0.6], [PI, 0.7], [0, 0.45]];
      for (const [lon, lat] of spikes) { const { p, n } = headPt(H, lon, lat, -0.01); const m = add(head, cone(0.045, 0.13, 10), hm, [p.x, p.y, p.z]); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n.clone().add(new T.Vector3(0, 0.6, -0.5)).normalize()); m.translateY(0.05); }
      break;
    }
    case 'curly': case 'afro': {
      const big = style === 'afro' ? 1.35 : 1.0;
      cap(1.06 + (big - 1) * 0.2, -0.35);
      let k = 0;
      for (let lat = 0.05; lat < 1.5; lat += 0.28) {
        const ring = Math.max(1, Math.round(10 * Math.cos(lat)));
        for (let i = 0; i < ring; i++) {
          const lon = (i / ring) * TAU + lat * 1.7;
          const front = Math.cos(lon);
          if (front > 0.35 && lat < 0.5) continue;
          const { p } = headPt(H, lon, lat, 0.01 * big);
          const r = (0.052 + ((k++ * 37) % 10) * 0.0022) * big;
          add(head, sphere(r, 14, 10), hm, [p.x, p.y, p.z], null, null);
        }
      }
      break;
    }
    case 'bob': cap(1.08, -0.3); sides(1.75, 1.95); fringe(5, 0.52, 0.24, -0.05, 0.055); break;
    case 'long': {
      cap(1.08, -0.3); sides(1.9, 1.9, 1.11); fringe(4, 0.54, 0.26, 0.15, 0.056);
      const b = joint(head, 'hairBack', [H.c.x, H.c.y - 0.03, H.c.z - 0.09]);
      add(b, sphere(0.16, 22, 16), hm, [0, -0.14, -0.012], null, [1.0, 1.35, 0.42]);
      springs.push(new R.Spring(b, { k: 45, d: 6, g: 0.35, i: 0.012, lim: 0.8 }));
      const b2 = joint(b, 'hairBack2', [0, -0.26, -0.01]);
      add(b2, sphere(0.13, 20, 14), hm, [0, -0.07, 0], null, [1.02, 1.1, 0.38]);
      springs.push(new R.Spring(b2, { k: 38, d: 5, g: 0.5, i: 0.02, lim: 1 }));
      break;
    }
    case 'ponytail': {
      cap(1.07, -0.34); fringe(3, 0.56, 0.3, 0.2, 0.05);
      const { p } = headPt(H, PI, 0.42, 0.01);
      add(head, torus(0.03, 0.012, 6, 14), M.get('topAcc'), [p.x, p.y, p.z - 0.01], [0.9, 0, 0]);
      chain(head, [p.x, p.y, p.z - 0.02], 4, 0.056, 0.09, { rot: [-0.8, 0, 0], taper: 0.86 });
      break;
    }
    case 'twintails': {
      cap(1.07, -0.3); fringe(5, 0.52, 0.24, 0, 0.052);
      for (const s of [1, -1]) {
        const { p } = headPt(H, 1.75 * s, 0.4, 0.01);
        add(head, sphere(0.03, 12, 10), M.get('topAcc'), [p.x, p.y, p.z]);
        chain(head, [p.x + 0.015 * s, p.y, p.z], 4, 0.05, 0.095, { rot: [0.1, 0, 0.3 * s], taper: 0.88 });
      }
      break;
    }
    case 'bun': {
      cap(1.07, -0.34); fringe(4, 0.54, 0.26, -0.1, 0.05);
      const { p } = headPt(H, PI * 0.95, 0.75, 0.03);
      const b = joint(head, 'bun', [p.x, p.y, p.z]);
      add(b, sphere(0.072, 20, 14), hm, [0, 0.02, -0.01]);
      add(b, torus(0.052, 0.011, 6, 16), M.get('topAcc'), [0, -0.018, 0.0], [PI / 2 - 0.5, 0, 0]);
      springs.push(new R.Spring(b, { k: 120, d: 9, g: 0.05, i: 0.004, lim: 0.25 }));
      break;
    }
    case 'mohawk': {
      cap(1.03, -0.5, 1.7);
      for (let i = 0; i < 7; i++) { const lat = 1.2 - i * 0.28, lon = i > 4 ? PI : 0; const la = i > 4 ? 1.2 - (i - 4) * 0.35 : lat; const { p, n } = headPt(H, lon, la, -0.01); const m = add(head, cone(0.04, 0.12, 8), hm, [p.x, p.y, p.z], null, [0.6, 1, 1]); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n); m.translateY(0.045); }
      break;
    }
  }
}

/* ---------------- HEAD ACCESSORIES ---------------- */
function buildHeadAcc(head, H, M, kind, springs) {
  const acc = M.get('acc'), topAcc = M.get('topAcc'), glow = M.get('glow');
  switch (kind) {
    case 'cap': {
      add(head, sphere(1, 32, 14, 0, TAU, 0, PI / 2), acc, [H.c.x, H.c.y + 0.015, H.c.z - 0.005], [-0.2, 0, 0], [H.r.x * 1.13, H.r.y * 1.08, H.r.z * 1.13]);
      add(head, cyl(0.2, 0.2, 0.012, 28, false, -PI / 2, PI), acc, [H.c.x, H.c.y + 0.07, H.c.z + 0.07], [0.22, 0, 0], [0.85, 1, 1.02]);
      add(head, sphere(0.018, 10, 8), topAcc, [H.c.x, H.c.y + H.r.y * 1.1, H.c.z - 0.01]);
      break;
    }
    case 'beanie': {
      add(head, sphere(1, 32, 16, 0, TAU, 0, 1.75), acc, [H.c.x, H.c.y + 0.02, H.c.z], [-0.2, 0, 0], [H.r.x * 1.14, H.r.y * 1.2, H.r.z * 1.14]);
      add(head, torus(H.r.x * 1.1, 0.03, 10, 30), acc, [H.c.x, H.c.y + 0.02, H.c.z - 0.005], [PI / 2 - 0.2, 0, 0], [1, 0.93, 1]);
      const b = joint(head, 'pom', [H.c.x, H.c.y + H.r.y * 1.2 + 0.02, H.c.z - 0.02]);
      add(b, sphere(0.04, 14, 10), topAcc, [0, 0.03, 0]);
      springs.push(new R.Spring(b, { k: 90, d: 6, g: 0.0, i: 0.012, lim: 0.6 }));
      break;
    }
    case 'hat': {
      add(head, cyl(0.135, 0.155, 0.14, 26), acc, [H.c.x, H.c.y + 0.14, H.c.z - 0.01], [-0.12, 0, 0]);
      add(head, sphere(0.136, 26, 10, 0, TAU, 0, PI / 2), acc, [H.c.x, H.c.y + 0.2, H.c.z - 0.018], [-0.12, 0, 0], [1, 0.3, 1]);
      add(head, cyl(0.29, 0.29, 0.014, 32), acc, [H.c.x, H.c.y + 0.075, H.c.z], [-0.12, 0, 0]);
      add(head, cyl(0.157, 0.157, 0.03, 26, true), topAcc, [H.c.x, H.c.y + 0.095, H.c.z - 0.003], [-0.12, 0, 0]).material.side = T.DoubleSide;
      break;
    }
    case 'headphones': {
      add(head, torus(H.r.x * 1.18, 0.014, 8, 30, PI), acc, [H.c.x, H.c.y + 0.01, H.c.z], null, [1, 1.08, 1]);
      for (const s of [1, -1]) {
        add(head, cyl(0.055, 0.055, 0.045, 22), acc, [H.c.x + H.r.x * 1.1 * s, H.c.y - 0.01, H.c.z], [0, 0, PI / 2]);
        add(head, torus(0.04, 0.007, 6, 20), glow, [H.c.x + H.r.x * 1.1 * s + 0.024 * s, H.c.y - 0.01, H.c.z], [0, PI / 2, 0], null, { noShadow: true });
      }
      break;
    }
    case 'halo': {
      const b = joint(head, 'halo', [H.c.x, H.c.y + H.r.y + 0.12, H.c.z - 0.02]);
      add(b, torus(0.12, 0.013, 8, 36), glow, [0, 0, 0], [PI / 2 - 0.2, 0, 0], null, { noShadow: true });
      b.userData.bob = true; break;
    }
    case 'ears': {
      add(head, torus(H.r.x * 1.08, 0.009, 6, 26, PI), acc, [H.c.x, H.c.y + 0.02, H.c.z + 0.02], [0.2, 0, 0]);
      for (const s of [1, -1]) {
        const { p, n } = headPt(H, 0.62 * s, 0.9, 0.0);
        const e = add(head, cone(0.052, 0.1, 4), M.get('hair'), [p.x, p.y + 0.02, p.z], null, [1, 1, 0.45]);
        e.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n.clone().add(new T.Vector3(0.1 * s, 0.9, 0)).normalize()); e.translateY(0.035);
        const i = add(head, cone(0.03, 0.06, 4), M.get('blush'), [0, 0, 0], null, [1, 1, 0.3], { noShadow: true }); i.position.copy(e.position); i.quaternion.copy(e.quaternion); i.translateZ(0.012); i.translateY(-0.008);
      }
      break;
    }
    case 'helmet': {
      add(head, sphere(0.265, 36, 24), M.get('glass'), [H.c.x, H.c.y - 0.01, H.c.z + 0.01], null, null, { noShadow: true });
      add(head, torus(0.2, 0.03, 10, 30), M.get('white'), [H.c.x, H.c.y - 0.22, H.c.z], [PI / 2, 0, 0]);
      add(head, torus(0.2, 0.008, 6, 30), glow, [H.c.x, H.c.y - 0.195, H.c.z], [PI / 2, 0, 0], null, { noShadow: true });
      break;
    }
  }
}
function buildFaceAcc(head, H, M, kind) {
  if (kind === 'none') return;
  const ep = s => headPt(H, 0.34 * s, -0.02, 0.028);
  if (kind === 'glasses' || kind === 'shades') {
    const frame = kind === 'glasses' ? M.get('acc') : M.get('black');
    for (const s of [1, -1]) {
      const { p, n } = ep(s); const g = new T.Group(); g.position.copy(p); orient(g, n); head.add(g);
      if (kind === 'glasses') add(g, torus(0.043, 0.0055, 6, 24), frame, [0, 0, 0], null, [1, 0.9, 1], { noShadow: true });
      else add(g, rbox(0.085, 0.058, 0.01, 0.02, 3), M.get('lens'), [0, 0, 0], null, null, { noShadow: true });
      const arm = headPt(H, 1.35 * s, 0.0, 0.012);
      const a = add(head, capsule(0.0045, 0.1, 3, 6), frame, [(p.x + arm.p.x) / 2, (p.y + arm.p.y) / 2 + 0.005, (p.z + arm.p.z) / 2], null, null, { noShadow: true });
      a.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), arm.p.clone().sub(p).normalize());
    }
    const b = headPt(H, 0, 0.0, 0.03);
    add(head, capsule(0.005, 0.03, 3, 6), frame, [b.p.x, b.p.y, b.p.z], [0, 0, PI / 2], null, { noShadow: true });
  } else if (kind === 'visor') {
    add(head, sphere(1, 36, 10, PI / 2 - 1.35, 2.7, PI / 2 - 0.28, 0.46), M.get('visor'), [H.c.x, H.c.y + 0.0, H.c.z + 0.005], null, [H.r.x * 1.18, H.r.y * 1.1, H.r.z * 1.2], { noShadow: true });
    add(head, torus(H.r.x * 1.17, 0.006, 6, 30, 2.7), M.get('glow'), [H.c.x, H.c.y + 0.058, H.c.z + 0.005], [PI / 2, 0, -PI / 2 + 1.35 - 2.7 + PI], [1, H.r.z / H.r.x * 1.02, 1], { noShadow: true });
  }
}

/* ---------------- BUILD HUMAN ---------------- */
function buildHuman(look, M) {
  const B = BUILDS[look.build] || BUILDS.regular;
  const J = {}, springs = [], extras = { flare: [], float: [] };
  const root = new T.Group(); root.name = 'root'; J.root = root;
  const scaleG = new T.Group(); root.add(scaleG); J.scale = scaleG; scaleG.scale.setScalar(B.h);
  const top = look.top.type, bot = look.bottom.type;
  const isSuit = top === 'spacesuit', isAndroid = look.headStyle === 'screen';
  const mTop = M.get('top'), mBot = M.get('bottom'), mSkin = isAndroid ? M.get('body2') : M.get('skin');
  const legLen = 0.38 * B.leg, shinLen = 0.36 * B.leg;
  const hipY = 0.05 + legLen + shinLen + 0.05;
  const hips = joint(scaleG, 'hips', [0, hipY, 0], J);
  const spine = joint(hips, 'spine', [0, 0.07, 0], J);
  const chest = joint(spine, 'chest', [0, 0.17, 0], J);
  const neck = joint(chest, 'neck', [0, 0.215, -0.004], J);
  const head = joint(neck, 'head', [0, 0.07, 0.004], J);
  const H = { c: new T.Vector3(0, 0.14, 0.012), r: new T.Vector3(0.158, 0.168, 0.152) };
  J.H = H;

  /* torso */
  const w = B.waist, hp = B.hip, ch = B.chest;
  const pelvisKey = `pel${look.build}`;
  const pelvisGeo = cached(pelvisKey, () => lathe([[0, -0.13], [0.06, -0.125], [hp * 0.86, -0.1], [hp, -0.045], [hp * 0.99, 0.02], [w * 1.03, 0.09], [w, 0.12]], 30, 0, TAU, 24));
  const pelvisMat = (top === 'coat' || top === 'robe') ? mTop : (isSuit ? mTop : mBot);
  add(hips, pelvisGeo, pelvisMat, [0, 0, 0], null, [1.13, 1, 0.84]);
  const absGeo = cached(`abs${look.build}`, () => lathe([[0, -0.07], [w * 1.04, -0.065], [w * 0.99, 0.02], [w * 1.02, 0.1], [ch * 0.9, 0.18], [ch * 0.88, 0.22]], 30, 0, TAU, 20));
  const chestGeo = cached(`che${look.build}`, () => lathe([[0, -0.07], [ch * 0.86, -0.07], [ch * 0.93, 0.0], [ch, 0.07], [ch * 1.01, 0.13], [ch * 0.93, 0.18], [ch * 0.66, 0.212], [0.05, 0.226], [0, 0.228]], 30, 0, TAU, 26));
  const torsoMat = top === 'tank' || top === 'tee' || top === 'sweater' || top === 'hoodie' || top === 'tracksuit' || isSuit || top === 'robe' ? mTop : M.get('inner');
  add(spine, absGeo, torsoMat, [0, 0, 0], null, [1.16, 1, 0.8]);
  add(chest, chestGeo, torsoMat, [0, 0, 0], null, [1.2, 1, 0.78]);
  // neck
  add(neck, taper(0.043, 0.047, 0.07), mSkin, [0, 0.07, 0], [PI, 0, 0]);

  /* head */
  if (isAndroid) {
    add(head, rbox(0.3, 0.31, 0.29, 0.1, 5), M.get('body'), [H.c.x, H.c.y, H.c.z - 0.005]);
    add(head, rbox(0.25, 0.19, 0.03, 0.06, 4), M.get('screen'), [H.c.x, H.c.y - 0.005, H.c.z + 0.135]);
    for (const s of [1, -1]) add(head, cyl(0.035, 0.035, 0.03, 16), M.get('glow'), [H.c.x + 0.155 * s, H.c.y, H.c.z], [0, 0, PI / 2]);
    const ant = joint(head, 'ant', [H.c.x + 0.06, H.c.y + 0.15, H.c.z - 0.03]);
    add(ant, cyl(0.005, 0.005, 0.08, 6), M.get('metal'), [0, 0.04, 0]); add(ant, sphere(0.018), M.get('glow'), [0, 0.085, 0]);
    springs.push(new R.Spring(ant, { k: 70, d: 3, g: 0, i: 0.02, lim: 0.7 }));
    J.face = buildScreenFace(head, M, { z: H.c.z + 0.153, y: H.c.y + 0.0, sp: 0.058, er: 0.018, my: 0.05 });
  } else {
    add(head, headGeo(), mSkin, [H.c.x, H.c.y, H.c.z], null, [H.r.x, H.r.y, H.r.z]);
    J.face = buildFace(head, H, M, look);
    if (look.facial === 'beard' || look.facial === 'stubble') {
      const bm = look.facial === 'beard' ? M.get('hair') : M.get('brow');
      const sh = add(head, sphere(1, 32, 12, PI / 2 - 1.45, 2.9, 1.9, 0.95), bm, [H.c.x, H.c.y - 0.005, H.c.z + 0.002], null, [H.r.x * (look.facial === 'beard' ? 1.06 : 1.012), H.r.y * 1.03, H.r.z * (look.facial === 'beard' ? 1.09 : 1.015)]);
      sh.material.side = T.DoubleSide;
      if (look.facial === 'beard') { add(head, sphere(0.055, 16, 10), bm, [0, -0.045, 0.14], null, [1.35, 0.9, 0.8]); }
      const mp = headPt(H, 0, -0.26, 0.004);
      add(head, capsule(0.009, 0.04, 4, 8), bm, [mp.p.x, mp.p.y, mp.p.z], [0, 0, PI / 2], [1, 1, 0.7], { noShadow: true });
    }
    buildHair(head, H, M, look.hair.style, springs, look);
  }
  buildHeadAcc(head, H, M, look.head, springs);
  if (!isAndroid) buildFaceAcc(head, H, M, look.face);
  else if (look.face === 'visor') buildFaceAcc(head, { c: H.c, r: new T.Vector3(0.16, 0.16, 0.16) }, M, 'visor');

  /* arms */
  const armR0 = 0.05 * B.arm, sleeveFull = !['tee', 'tank'].includes(top), sleeveShort = top === 'tee';
  const armMat = sleeveFull ? mTop : mSkin;
  for (const s of [1, -1]) {
    const sd = s > 0 ? 'L' : 'R';
    const cl = joint(chest, 'cl' + sd, [0.05 * s, 0.168, -0.012], J);
    const ua = joint(cl, 'ua' + sd, [(B.sh - 0.05) * s, -0.004, 0], J);
    const fa = joint(ua, 'fa' + sd, [0, -0.27, 0], J);
    const ha = joint(fa, 'ha' + sd, [0, -0.245, 0], J);
    add(ua, sphere(armR0 * 1.18, 20, 14), top === 'tank' ? mSkin : mTop, [0, 0.005, 0], null, [1.05, 1, 1]); // deltoid
    add(ua, taper(armR0, armR0 * 0.84, 0.27), armMat);
    add(fa, taper(armR0 * 0.84, armR0 * 0.66, 0.245), sleeveFull && top !== 'armor-tee' ? mTop : mSkin);
    if (sleeveShort) add(ua, shell(armR0 * 1.28, armR0 * 1.14, 0.13), mTop).material.side = T.DoubleSide;
    if (sleeveFull) {
      const cuffMat = ['tracksuit', 'bomber', 'hoodie', 'sweater'].includes(top) ? M.get('topAcc') : top === 'suit' ? M.get('inner') : M.get('topDark');
      add(fa, cyl(armR0 * 0.74, armR0 * 0.74, 0.03, 18, true), cuffMat, [0, -0.225, 0]).material.side = T.DoubleSide;
      if (top === 'tracksuit') add(ua, rbox(0.014, 0.25, 0.012, 0.005, 2), M.get('topAcc'), [armR0 * 0.98 * s, -0.13, 0], [0, 0, 0.04 * s]);
    }
    // hand (mitten + thumb) — skin or glove
    const hm = isSuit ? M.get('white') : mSkin;
    const hand = new T.Group(); ha.add(hand); J['hand' + sd] = hand;
    add(hand, sphere(0.043, 18, 14), hm, [0, -0.045, 0.002], null, [0.72, 1.12, 0.52]);
    add(hand, sphere(0.034, 14, 10), hm, [0, -0.08, 0.004], null, [0.7, 0.8, 0.5]);
    const th = add(hand, capsule(0.012, 0.03, 4, 8), hm, [0.0, -0.035, 0.028], [0.5, 0, 0]);
    th.rotation.z = 0.2 * s;
    // armor pauldron
    if (top === 'armor') {
      add(ua, sphere(0.085, 22, 12, 0, TAU, 0, PI / 2), M.get('topAcc'), [0.01 * s, 0.01, 0], [0, 0, -0.35 * s], [1.15, 0.8, 1.05]);
      add(ua, torus(0.07, 0.006, 6, 20), M.get('glow'), [0.03 * s, -0.01, 0], [PI / 2, -0.35 * s, 0], [1, 1.1, 1], { noShadow: true });
      add(fa, cyl(armR0 * 0.95, armR0 * 0.82, 0.12, 18), M.get('topAcc'), [0, -0.15, 0]);
    }
    if (isSuit) add(fa, cyl(armR0 * 0.9, armR0 * 0.8, 0.04, 18), M.get('glow'), [0, -0.2, 0], null, null, { noShadow: true });
  }

  /* legs */
  const legR = 0.074 * (look.build === 'broad' ? 1.1 : look.build === 'curvy' ? 1.06 : 1);
  const pants = ['pants', 'cargo', 'joggers'].includes(bot) || isSuit;
  for (const s of [1, -1]) {
    const sd = s > 0 ? 'L' : 'R';
    const th = joint(hips, 'th' + sd, [0.088 * s, -0.05, 0], J);
    const sh = joint(th, 'shin' + sd, [0, -legLen, 0], J);
    const ft = joint(sh, 'ft' + sd, [0, -shinLen, 0], J);
    const thighMat = pants || bot === 'shorts' ? mBot : (bot === 'skirt' ? M.get(look.legwear === 'tights' ? 'bottomDark' : 'skin') : mSkin);
    add(th, taper(legR, legR * 0.76, legLen), bot === 'shorts' ? (look.legwear === 'tights' ? M.get('bottomDark') : mSkin) : (isSuit ? mTop : thighMat));
    add(sh, taper(legR * 0.76, legR * 0.58, shinLen), isSuit ? mTop : pants ? mBot : (look.legwear === 'tights' ? M.get('bottomDark') : mSkin));
    if (bot === 'shorts') add(th, shell(legR * 1.28, legR * 1.12, legLen * 0.55), mBot).material.side = T.DoubleSide;
    if (bot === 'cargo') { add(th, rbox(0.035, 0.09, 0.075, 0.012, 2), M.get('bottomDark'), [legR * 0.95 * s, -legLen * 0.52, 0.005]); add(sh, sphere(legR * 0.82, 16, 10), M.get('bottomDark'), [0, 0.0, 0.012], null, [1, 0.8, 1]); }
    if (bot === 'joggers' || top === 'tracksuit') { add(th, rbox(0.012, legLen * 0.95, 0.012, 0.005, 2), M.get('topAcc'), [legR * 0.97 * s, -legLen * 0.5, 0], [0, 0, 0.03 * s]); add(sh, rbox(0.012, shinLen * 0.9, 0.012, 0.005, 2), M.get('topAcc'), [legR * 0.72 * s, -shinLen * 0.47, 0], [0, 0, 0.02 * s]); }
    if (bot === 'joggers') add(sh, cyl(legR * 0.62, legR * 0.62, 0.03, 16, true), M.get('bottomDark'), [0, -shinLen + 0.03, 0]).material.side = T.DoubleSide;
    // shoes
    const shoe = new T.Group(); ft.add(shoe); J['shoe' + sd] = shoe;
    const shT = isSuit ? 'boot' : look.shoes.type;
    const mS = isSuit ? M.get('white') : M.get('shoe');
    if (shT === 'boot') {
      add(shoe, cyl(legR * 0.66, legR * 0.7, 0.1, 18), mS, [0, 0.02, 0]);
      add(shoe, sphere(0.058, 18, 12), mS, [0, -0.02, 0.04], null, [0.95, 0.72, 1.7]);
      add(shoe, rbox(0.11, 0.026, 0.21, 0.012, 2), M.get('sole'), [0, -0.048, 0.035]);
    } else if (shT === 'loafer') {
      add(shoe, sphere(0.055, 18, 12), mS, [0, -0.022, 0.04], null, [0.9, 0.6, 1.8]);
      add(shoe, rbox(0.1, 0.016, 0.2, 0.008, 2), M.get('black'), [0, -0.048, 0.035]);
    } else {
      add(shoe, sphere(0.058, 18, 12), mS, [0, -0.018, 0.042], null, [0.95, 0.7, 1.75]);
      add(shoe, rbox(0.112, 0.024, 0.212, 0.011, 2), M.get('sole'), [0, -0.046, 0.038]);
      add(shoe, torus(0.035, 0.006, 6, 14, PI), M.get('topAcc'), [0.05 * s, -0.022, 0.03], [0, PI / 2, 0], [1, 0.6, 1.6], { noShadow: true });
    }
  }

  /* top-specific details */
  if (top === 'tee' || top === 'tank' || top === 'sweater' || top === 'hoodie' || top === 'tracksuit') {
    add(chest, torus(0.052, 0.011, 8, 22), top === 'tracksuit' ? M.get('topAcc') : M.get('topDark'), [0, 0.206, 0.004], [PI / 2 + 0.25, 0, 0], [1.05, 1, 1]);
  }
  if (top === 'tracksuit') add(chest, rbox(0.008, 0.22, 0.012, 0.003, 2), M.get('topAcc'), [0, 0.09, ch * 0.78 + 0.004], [-0.1, 0, 0]);
  if (top === 'hoodie') {
    add(chest, sphere(0.14, 24, 14, 0, TAU, PI / 2 - 0.2, PI / 2 + 0.2), mTop, [0, 0.19, -0.075], [-0.5, 0, 0], [1, 0.75, 0.75]).material.side = T.DoubleSide;
    add(spine, rbox(0.16, 0.08, 0.03, 0.02, 3), M.get('topDark'), [0, 0.07, w * 0.8], [-0.08, 0, 0]);
    for (const s of [1, -1]) {
      const st = joint(chest, 'str' + s, [0.03 * s, 0.19, 0.1]);
      add(st, capsule(0.004, 0.09, 3, 6), M.get('topAcc'), [0, -0.05, 0]);
      add(st, sphere(0.008), M.get('metal'), [0, -0.1, 0]);
      springs.push(new R.Spring(st, { k: 90, d: 5, g: 0.8, i: 0.01, lim: 0.8 }));
    }
  }
  const jacketLike = ['jacket', 'suit', 'coat', 'bomber'].includes(top);
  if (jacketLike) {
    const gap = top === 'suit' ? 0.62 : top === 'coat' ? 0.55 : 0.5;
    const jc = cached(`jc${look.build}${gap}`, () => lathe([[ch * 0.96, -0.075], [ch * 1.0, 0.0], [ch * 1.06, 0.07], [ch * 1.07, 0.13], [ch * 0.99, 0.18], [ch * 0.72, 0.214], [0.06, 0.23]], 30, gap / 2, TAU - gap, 22));
    const ja = cached(`ja${look.build}${gap}`, () => lathe([[w * 1.13, -0.07], [w * 1.08, 0.02], [w * 1.1, 0.1], [ch * 0.96, 0.18], [ch * 0.94, 0.225]], 30, gap / 2, TAU - gap, 16));
    add(chest, jc, mTop, [0, 0, 0], null, [1.2, 1, 0.8]).material.side = T.DoubleSide;
    add(spine, ja, mTop, [0, 0, 0], null, [1.18, 1, 0.82]);
    // lapels / collar
    for (const s of [1, -1]) {
      if (top === 'suit' || top === 'coat') add(chest, rbox(0.045, 0.14, 0.012, 0.005, 2), M.get('topDark'), [0.042 * s, 0.13, ch * 0.77 + 0.01], [-0.28, 0.25 * s, 0.34 * s]);
      else add(chest, rbox(0.06, 0.05, 0.014, 0.008, 2), top === 'bomber' ? M.get('topAcc') : M.get('topDark'), [0.06 * s, 0.2, ch * 0.62], [-0.55, 0.3 * s, 0.4 * s]);
    }
    if (top === 'suit') {
      add(chest, rbox(0.022, 0.018, 0.012, 0.005, 2), M.get('topAcc'), [0, 0.19, ch * 0.72 + 0.012]);
      add(chest, rbox(0.03, 0.16, 0.008, 0.004, 2), M.get('topAcc'), [0, 0.1, ch * 0.78 + 0.004], [-0.14, 0, 0], [1, 1, 1]);
      add(chest, rbox(0.03, 0.012, 0.01, 0.003, 2), M.get('white'), [-0.075, 0.1, ch * 0.77 + 0.006], [-0.1, -0.3, 0]);
    }
    if (top === 'bomber') { add(spine, torus(w * 1.1, 0.014, 8, 26), M.get('topAcc'), [0, -0.06, 0], [PI / 2, 0, 0], [1.18, 0.82, 1]); add(chest, rbox(0.04, 0.012, 0.01, 0.004, 2), M.get('glow'), [-0.08, 0.13, ch * 0.78], [0, -0.35, 0]); }
    if (top === 'coat') {
      add(spine, torus(w * 1.14, 0.01, 6, 26), M.get('topDark'), [0, 0.0, 0], [PI / 2, 0, 0], [1.2, 0.84, 1]);
      for (const s of [1, -1]) {
        const tb = joint(hips, 'tail' + s, [0, 0.07, 0]);
        const g = cached(`tail${look.build}${s}`, () => lathe([[hp * 1.9, -0.52], [hp * 1.5, -0.25], [hp * 1.18, -0.02], [w * 1.16, 0.09]], 24, s > 0 ? 0.28 : PI, PI - 0.28, 16));
        const m = add(tb, g, mTop, [0, 0, 0], null, [1.1, 1, 0.84]); m.material.side = T.DoubleSide;
        springs.push(new R.Spring(tb, { k: 60, d: 7, g: 0.2, i: 0.006, lim: 0.45, spin: 0.05 }));
      }
    }
  }
  if (top === 'robe') {
    const tb = joint(hips, 'robe', [0, 0.06, 0]);
    const g = cached(`robe${look.build}`, () => lathe([[hp * 2.1, -0.66], [hp * 1.6, -0.3], [hp * 1.15, -0.02], [w * 1.12, 0.07]], 30, 0, TAU, 16));
    add(tb, g, mTop, [0, 0, 0], null, [1.1, 1, 0.9]).material.side = T.DoubleSide;
    add(tb, torus(hp * 2.08, 0.012, 6, 30), M.get('glow'), [0, -0.655, 0], [PI / 2, 0, 0], [1.1, 0.9, 1], { noShadow: true });
    add(spine, torus(w * 1.1, 0.014, 6, 26), M.get('topAcc'), [0, 0.02, 0], [PI / 2, 0, 0], [1.18, 0.84, 1]);
    springs.push(new R.Spring(tb, { k: 70, d: 8, g: 0.1, i: 0.005, lim: 0.3 }));
    extras.flare.push(tb);
  }
  if (top === 'armor') {
    add(chest, sphere(ch * 1.02, 24, 14, -PI / 2 + 0.2, PI - 0.4, 0.5, 1.4), M.get('topAcc'), [0, 0.08, 0.005], null, [1.22, 0.95, 0.9]).material.side = T.DoubleSide;
    add(chest, rbox(0.05, 0.05, 0.02, 0.012, 2), M.get('glow'), [0, 0.1, ch * 0.9], [-0.1, 0, 0], null, { noShadow: true });
    add(spine, torus(w * 1.1, 0.02, 8, 26), M.get('topAcc'), [0, -0.04, 0], [PI / 2, 0, 0], [1.2, 0.84, 1]);
  }
  if (isSuit) {
    add(chest, rbox(0.12, 0.08, 0.04, 0.014, 3), M.get('white'), [0, 0.08, ch * 0.8], [-0.05, 0, 0]);
    for (let i = 0; i < 3; i++) add(chest, rbox(0.016, 0.03, 0.01, 0.004, 2), M.get('glow'), [-0.03 + i * 0.03, 0.08, ch * 0.8 + 0.022], null, null, { noShadow: true });
    add(chest, rbox(0.26, 0.3, 0.12, 0.05, 3), M.get('white'), [0, 0.07, -0.16]);
    add(chest, cyl(0.02, 0.02, 0.2, 10), M.get('grey'), [0.09, 0.1, -0.22]);
    add(spine, torus(w * 1.12, 0.016, 8, 26), M.get('glow'), [0, 0.0, 0], [PI / 2, 0, 0], [1.18, 0.84, 1], { noShadow: true });
  }
  if (isAndroid) {
    add(chest, cyl(0.045, 0.045, 0.02, 20), M.get('glow'), [0, 0.1, ch * 0.78 + 0.003], [PI / 2, 0, 0], null, { noShadow: true });
    add(chest, rbox(0.2, 0.16, 0.03, 0.03, 3), M.get('grey'), [0, 0.09, ch * 0.72], null, [1, 1, 1]);
  }

  /* bottoms */
  if (bot === 'skirt') {
    const sb = joint(hips, 'skirt', [0, 0.04, 0]);
    const g = cached(`sk${look.build}`, () => lathe([[hp * 1.72, -0.3], [hp * 1.38, -0.15], [hp * 1.08, -0.02], [w * 1.08, 0.07]], 32, 0, TAU, 14));
    add(sb, g, mBot, [0, 0, 0], null, [1.12, 1, 0.9]).material.side = T.DoubleSide;
    springs.push(new R.Spring(sb, { k: 80, d: 8, g: 0.05, i: 0.004, lim: 0.25 }));
    extras.flare.push(sb);
  }
  if (pants || bot === 'shorts') add(hips, torus(w * 1.06, 0.012, 6, 26), M.get('bottomDark'), [0, 0.1, 0], [PI / 2, 0, 0], [1.15, 0.86, 1]);

  /* back accessories */
  if (look.back === 'backpack') {
    add(chest, rbox(0.24, 0.28, 0.12, 0.05, 3), M.get('acc'), [0, 0.07, -0.16]);
    add(chest, rbox(0.18, 0.1, 0.03, 0.02, 2), M.get('topAcc'), [0, 0.0, -0.225]);
    for (const s of [1, -1]) add(chest, torus(0.1, 0.012, 6, 16, PI), M.get('acc'), [0.08 * s, 0.1, -0.02], [0, PI / 2, PI / 2], [1.4, 1, 1]);
  } else if (look.back === 'jetpack') {
    for (const s of [1, -1]) {
      add(chest, cyl(0.055, 0.055, 0.26, 16), M.get('metal'), [0.07 * s, 0.07, -0.17]);
      add(chest, sphere(0.055, 16, 8, 0, TAU, 0, PI / 2), M.get('metal'), [0.07 * s, 0.2, -0.17]);
      add(chest, cyl(0.045, 0.03, 0.05, 14), M.get('glow'), [0.07 * s, -0.08, -0.17]);
      const n = joint(chest, 'nozzle' + (s > 0 ? 'L' : 'R'), [0.07 * s, -0.11, -0.17], J);
    }
  } else if (look.back === 'cape') {
    const cb = joint(chest, 'cape', [0, 0.2, -0.05]);
    const g = cached('cape', () => lathe([[0.36, -0.95], [0.26, -0.5], [0.19, -0.1], [0.14, 0]], 30, PI - 1.25, 2.5, 16));
    add(cb, g, M.get('acc'), [0, 0, 0.04], null, [1, 1, 0.55]).material.side = T.DoubleSide;
    springs.push(new R.Spring(cb, { k: 40, d: 5, g: 0.25, i: 0.02, lim: 0.9, spin: 0.08 }));
    add(chest, torus(0.09, 0.016, 8, 22), M.get('topAcc'), [0, 0.205, -0.005], [PI / 2 + 0.2, 0, 0], [1.2, 1, 1]);
  } else if (look.back === 'scarf') {
    add(chest, torus(0.07, 0.035, 10, 24), M.get('acc'), [0, 0.215, 0.0], [PI / 2 + 0.2, 0, 0], [1.1, 1, 0.9]);
    const t1 = joint(chest, 'scarf1', [0.05, 0.19, 0.08]);
    add(t1, rbox(0.06, 0.2, 0.02, 0.01, 2), M.get('acc'), [0, -0.1, 0]);
    add(t1, rbox(0.062, 0.02, 0.022, 0.006, 2), M.get('topAcc'), [0, -0.17, 0]);
    springs.push(new R.Spring(t1, { k: 50, d: 5, g: 0.6, i: 0.02, lim: 1.0 }));
  }

  return { root, J, springs, extras, kind: 'human', H, face: J.face };
}
R.buildHuman = buildHuman;
})(window);
