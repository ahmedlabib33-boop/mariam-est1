/* ============================================================
   Diagrams for the Geometry and Trigonometry lessons.

   Each figure is inline SVG that inherits the page's colours through
   CSS classes, so it works in light and dark without redrawing.
   Figures are keyed by the number that starts a lesson title
   ("19) Pythagoras' Theorem" -> 19).
   ============================================================ */

const Figures = (function(){

  /* ---------- tiny geometry helpers ---------- */
  const P = (x, y) => ({ x, y });
  const n2 = v => +v.toFixed(2);

  function unit(from, to){
    const dx = to.x - from.x, dy = to.y - from.y;
    const m = Math.hypot(dx, dy) || 1;
    return { x: dx / m, y: dy / m };
  }
  /* arc marking the angle at V, between the edges V->A and V->B */
  function angleArc(V, A, B, r){
    const u1 = unit(V, A), u2 = unit(V, B);
    const a = P(V.x + u1.x * r, V.y + u1.y * r);
    const b = P(V.x + u2.x * r, V.y + u2.y * r);
    const sweep = (u1.x * u2.y - u1.y * u2.x) > 0 ? 1 : 0;
    return `M${n2(a.x)} ${n2(a.y)} A${r} ${r} 0 0 ${sweep} ${n2(b.x)} ${n2(b.y)}`;
  }
  /* where to put the label for that angle */
  function angleLabelPos(V, A, B, r){
    const u1 = unit(V, A), u2 = unit(V, B);
    const m = { x: (u1.x + u2.x) / 2, y: (u1.y + u2.y) / 2 };
    const len = Math.hypot(m.x, m.y) || 1;
    return P(V.x + (m.x / len) * r, V.y + (m.y / len) * r);
  }
  /* the little square that marks a right angle at V */
  function rightAngle(V, A, B, s){
    const u1 = unit(V, A), u2 = unit(V, B);
    const p1 = P(V.x + u1.x * s, V.y + u1.y * s);
    const p3 = P(V.x + u2.x * s, V.y + u2.y * s);
    const p2 = P(p1.x + u2.x * s, p1.y + u2.y * s);
    return `${n2(p1.x)},${n2(p1.y)} ${n2(p2.x)},${n2(p2.y)} ${n2(p3.x)},${n2(p3.y)}`;
  }
  /* label placed just outside the midpoint of edge A-B */
  function sideLabel(A, B, away, off){
    const mid = P((A.x + B.x) / 2, (A.y + B.y) / 2);
    const u = unit(mid, away);
    return P(mid.x - u.x * off, mid.y - u.y * off);
  }
  const poly = pts => pts.map(p => `${n2(p.x)},${n2(p.y)}`).join(' ');

  const txt = (p, s, cls = 'fig-label', extra = '') =>
    `<text x="${n2(p.x)}" y="${n2(p.y)}" class="${cls}" text-anchor="middle" dominant-baseline="middle" ${extra}>${s}</text>`;

  const svg = (vb, body, caption) =>
    `<svg viewBox="${vb}" role="img" xmlns="http://www.w3.org/2000/svg">${body}</svg>` +
    (caption ? `<div class="fig-caption">${caption}</div>` : '');

  /* regular polygon points */
  function regular(cx, cy, r, n, rot = -90){
    const out = [];
    for(let i = 0; i < n; i++){
      const a = (rot + i * 360 / n) * Math.PI / 180;
      out.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a)));
    }
    return out;
  }

  /* ============================================================
     17) Angles in a triangle
     ============================================================ */
  function f17(){
    const A = P(45, 155), B = P(285, 155), C = P(165, 45);
    let s = '';
    s += `<polygon points="${poly([A,B,C])}" class="fig-shape"/>`;
    s += `<path d="${angleArc(A, B, C, 30)}" class="fig-angle"/>`;
    s += `<path d="${angleArc(B, C, A, 30)}" class="fig-angle"/>`;
    s += `<path d="${angleArc(C, A, B, 26)}" class="fig-angle fig-angle-q"/>`;
    s += txt(angleLabelPos(A, B, C, 48), '50&#176;', 'fig-dim');
    s += txt(angleLabelPos(B, C, A, 48), '70&#176;', 'fig-dim');
    s += txt(angleLabelPos(C, A, B, 44), '?', 'fig-dim fig-unknown');
    s += txt(P(165, 185), '50 + 70 = 120  →  180 − 120 = 60°', 'fig-note');
    return svg('0 0 330 200', s, 'The three angles of any triangle always add to 180°');
  }

  /* ============================================================
     18) Polygons and interior angles
     ============================================================ */
  function f18(){
    const pts = regular(110, 105, 72, 6);
    let s = `<polygon points="${poly(pts)}" class="fig-shape"/>`;
    /* split into 4 triangles from one vertex — that is where (n-2) comes from */
    for(let i = 2; i < pts.length - 1; i++){
      s += `<line x1="${n2(pts[0].x)}" y1="${n2(pts[0].y)}" x2="${n2(pts[i].x)}" y2="${n2(pts[i].y)}" class="fig-dash"/>`;
    }
    s += `<path d="${angleArc(pts[2], pts[1], pts[3], 22)}" class="fig-angle"/>`;
    s += txt(angleLabelPos(pts[2], pts[1], pts[3], 40), '120°', 'fig-dim');
    s += txt(P(110, 196), '6 sides → 4 triangles', 'fig-note');
    s += txt(P(258, 78), '(6 − 2) × 180', 'fig-label');
    s += txt(P(258, 102), '= 720°', 'fig-dim');
    s += txt(P(258, 130), '720 ÷ 6 = 120°', 'fig-note');
    return svg('0 0 330 210', s, 'Split a polygon into triangles: n sides give n − 2 triangles');
  }

  /* ============================================================
     19) Pythagoras — the classic squares-on-the-sides picture
     ============================================================ */
  function f19(){
    const u = 21;                        /* pixels per unit */
    const R = P(140, 182);               /* right angle */
    const T = P(140, 182 - 4 * u);       /* up 4 */
    const Q = P(140 + 3 * u, 182);       /* right 3 */

    /* square on the hypotenuse — of the two perpendiculars, take the one
       pointing away from the right angle, or it lands on top of the triangle */
    const d = unit(T, Q);
    const mid = P((T.x + Q.x) / 2, (T.y + Q.y) / 2);
    let perp = P(-d.y, d.x);
    if((R.x - mid.x) * perp.x + (R.y - mid.y) * perp.y > 0) perp = P(d.y, -d.x);
    const len = Math.hypot(Q.x - T.x, Q.y - T.y);
    const T2 = P(T.x + perp.x * len, T.y + perp.y * len);
    const Q2 = P(Q.x + perp.x * len, Q.y + perp.y * len);

    let s = '';
    s += `<rect x="${n2(R.x - 4 * u)}" y="${n2(T.y)}" width="${4 * u}" height="${4 * u}" class="fig-sq-b"/>`;
    s += `<rect x="${n2(R.x)}" y="${n2(R.y)}" width="${3 * u}" height="${3 * u}" class="fig-sq-a"/>`;
    s += `<polygon points="${poly([T, Q, Q2, T2])}" class="fig-sq-c"/>`;
    s += `<polygon points="${poly([R, T, Q])}" class="fig-shape"/>`;
    s += `<polygon points="${rightAngle(R, T, Q, 13)}" class="fig-right"/>`;

    s += txt(P(R.x - 2 * u, T.y + 2 * u), '16', 'fig-sq-label');
    s += txt(P(R.x + 1.5 * u, R.y + 1.5 * u), '9', 'fig-sq-label');
    s += txt(P((T.x + Q2.x) / 2, (T.y + Q2.y) / 2), '25', 'fig-sq-label');

    s += txt(sideLabel(R, T, Q, 14), '4', 'fig-dim');
    s += txt(sideLabel(R, Q, T, 14), '3', 'fig-dim');
    s += txt(sideLabel(T, Q, R, -18), '5', 'fig-dim');
    s += txt(P(168, 258), '9 + 16 = 25   so   3² + 4² = 5²', 'fig-note');
    return svg('40 20 264 254', s,
      'The square on the long side equals the two smaller squares added together');
  }

  /* ============================================================
     20) Area and perimeter
     ============================================================ */
  function f20(){
    let s = '';
    /* rectangle 6 x 4 */
    s += `<rect x="18" y="40" width="96" height="64" class="fig-shape"/>`;
    s += txt(P(66, 72), 'A = 24', 'fig-dim');
    s += txt(P(66, 118), '6', 'fig-label');
    s += txt(P(6, 72), '4', 'fig-label');
    s += txt(P(66, 22), 'Rectangle', 'fig-note');
    /* triangle base 10 height 3 */
    const A = P(140, 104), B = P(236, 104), C = P(196, 44);
    s += `<polygon points="${poly([A,B,C])}" class="fig-shape"/>`;
    s += `<line x1="196" y1="44" x2="196" y2="104" class="fig-dash"/>`;
    s += `<polygon points="${rightAngle(P(196,104), P(196,44), A, 9)}" class="fig-right"/>`;
    s += txt(P(188, 84), 'A = 15', 'fig-dim');
    s += txt(P(188, 118), '10', 'fig-label');
    s += txt(P(210, 72), '3', 'fig-label');
    s += txt(P(188, 22), 'Triangle', 'fig-note');
    /* circle */
    s += `<circle cx="300" cy="74" r="34" class="fig-shape"/>`;
    s += `<line x1="300" y1="74" x2="334" y2="74" class="fig-radius"/>`;
    s += `<circle cx="300" cy="74" r="2.6" class="fig-dot"/>`;
    s += txt(P(317, 64), 'r', 'fig-dim');
    s += txt(P(300, 90), 'πr²', 'fig-dim');
    s += txt(P(300, 22), 'Circle', 'fig-note');
    return svg('0 0 350 132', s, '½ × base × height for a triangle; πr² for a circle');
  }

  /* ============================================================
     21) Volume — a 2 x 3 x 4 box drawn in 3D
     ============================================================ */
  function f21(){
    const w = 108, h = 72, dx = 42, dy = -28;   /* depth offset */
    const x = 56, y = 128;
    const FBL = P(x, y), FBR = P(x + w, y), FTR = P(x + w, y - h), FTL = P(x, y - h);
    const off = p => P(p.x + dx, p.y + dy);
    const BTL = off(FTL), BTR = off(FTR), BBR = off(FBR);

    let s = '';
    s += `<polygon points="${poly([FTL, BTL, BTR, FTR])}" class="fig-face-top"/>`;
    s += `<polygon points="${poly([FTR, BTR, BBR, FBR])}" class="fig-face-side"/>`;
    s += `<polygon points="${poly([FBL, FBR, FTR, FTL])}" class="fig-face-front"/>`;
    [[FTL,BTL],[FTR,BTR],[FBR,BBR],[BTL,BTR],[BTR,BBR]].forEach(([a,b]) => {
      s += `<line x1="${n2(a.x)}" y1="${n2(a.y)}" x2="${n2(b.x)}" y2="${n2(b.y)}" class="fig-line"/>`;
    });
    s += txt(P(x + w / 2, y + 18), '4', 'fig-dim');
    s += txt(P(x - 14, y - h / 2), '3', 'fig-dim');
    s += txt(P(x + w + dx / 2 + 12, y - h - 8), '2', 'fig-dim');
    s += txt(P(x + w / 2, y - h / 2), 'V = 24', 'fig-dim');
    s += txt(P(175, 162), 'V = length × width × height = 4 × 3 × 2', 'fig-note');
    return svg('0 0 350 178', s, 'Volume fills the box; surface area covers its faces');
  }

  /* ============================================================
     22) Circle theorems
     ============================================================ */
  function f22(){
    const O = P(104, 110), r = 72;
    const at = deg => P(O.x + r * Math.cos(deg * Math.PI / 180),
                        O.y + r * Math.sin(deg * Math.PI / 180));
    const A = at(160), B = at(20), C = at(265);

    let s = `<circle cx="${O.x}" cy="${O.y}" r="${r}" class="fig-circle"/>`;
    s += `<line x1="${n2(A.x)}" y1="${n2(A.y)}" x2="${O.x}" y2="${O.y}" class="fig-line"/>`;
    s += `<line x1="${n2(B.x)}" y1="${n2(B.y)}" x2="${O.x}" y2="${O.y}" class="fig-line"/>`;
    s += `<line x1="${n2(A.x)}" y1="${n2(A.y)}" x2="${n2(C.x)}" y2="${n2(C.y)}" class="fig-line"/>`;
    s += `<line x1="${n2(B.x)}" y1="${n2(B.y)}" x2="${n2(C.x)}" y2="${n2(C.y)}" class="fig-line"/>`;
    s += `<path d="${angleArc(O, A, B, 26)}" class="fig-angle"/>`;
    s += `<path d="${angleArc(C, A, B, 26)}" class="fig-angle fig-angle-q"/>`;
    s += txt(angleLabelPos(O, A, B, 44), '140°', 'fig-dim');
    s += txt(angleLabelPos(C, A, B, 44), '70°', 'fig-dim');
    s += `<circle cx="${O.x}" cy="${O.y}" r="3" class="fig-dot"/>`;
    s += txt(P(O.x - 12, O.y + 12), 'O', 'fig-note');
    s += txt(P(A.x - 12, A.y - 6), 'A', 'fig-note');
    s += txt(P(B.x + 12, B.y - 6), 'B', 'fig-note');
    s += txt(P(C.x, C.y + 15), 'C', 'fig-note');
    s += txt(P(265, 86), 'centre angle', 'fig-note');
    s += txt(P(265, 108), '= 2 × edge angle', 'fig-dim');
    s += txt(P(265, 134), '140 = 2 × 70', 'fig-note');
    return svg('0 0 350 206', s, 'Both angles sit on the same arc AB');
  }

  /* ============================================================
     23) Transformations
     ============================================================ */
  function f23(){
    const ox = 150, oy = 95, g = 22;                 /* origin + grid step */
    const gx = n => ox + n * g, gy = n => oy - n * g;
    let s = '';
    for(let i = -4; i <= 4; i++){
      s += `<line x1="${gx(i)}" y1="${gy(-3.4)}" x2="${gx(i)}" y2="${gy(3.4)}" class="fig-grid"/>`;
    }
    for(let i = -3; i <= 3; i++){
      s += `<line x1="${gx(-4.4)}" y1="${gy(i)}" x2="${gx(4.4)}" y2="${gy(i)}" class="fig-grid"/>`;
    }
    s += `<line x1="${gx(-4.6)}" y1="${gy(0)}" x2="${gx(4.6)}" y2="${gy(0)}" class="fig-axis"/>`;
    s += `<line x1="${gx(0)}" y1="${gy(3.6)}" x2="${gx(0)}" y2="${gy(-3.6)}" class="fig-axis"/>`;

    s += `<circle cx="${gx(2)}" cy="${gy(3)}" r="5" class="fig-dot-a"/>`;
    s += txt(P(gx(2) + 32, gy(3)), '(2, 3)', 'fig-dim');
    s += `<circle cx="${gx(2)}" cy="${gy(-3)}" r="5" class="fig-dot-b"/>`;
    s += txt(P(gx(2) + 36, gy(-3)), '(2, −3)', 'fig-dim fig-unknown');
    s += `<line x1="${gx(2)}" y1="${gy(3)}" x2="${gx(2)}" y2="${gy(-3)}" class="fig-dash"/>`;
    s += txt(P(gx(-2.4), gy(0) - 12), 'mirror line', 'fig-note');
    s += txt(P(175, 182), 'Reflecting in the x-axis flips the sign of y', 'fig-note');
    return svg('0 0 350 196', s, 'Reflection in the x-axis: (x, y) → (x, −y)');
  }

  /* ============================================================
     24) Similar shapes and scale factor
     ============================================================ */
  function f24(){
    let s = '';
    s += `<rect x="22" y="62" width="72" height="48" class="fig-shape"/>`;
    s += txt(P(58, 126), '8', 'fig-dim');
    s += txt(P(10, 86), '4', 'fig-label');
    s += txt(P(58, 46), 'Area 12', 'fig-note');

    s += `<rect x="150" y="34" width="108" height="72" class="fig-shape fig-shape-alt"/>`;
    s += txt(P(204, 126), '12', 'fig-dim');
    s += txt(P(138, 70), '6', 'fig-label');
    s += txt(P(204, 18), 'Area 27', 'fig-note');

    s += `<path d="M104 86 L140 86" class="fig-arrow" marker-end="url(#figArrow)"/>`;
    s += txt(P(122, 104), '× 1.5', 'fig-dim');   /* below the arrow, clear of the "6" */
    s += txt(P(300, 62), 'lengths × k', 'fig-note');
    s += txt(P(300, 84), 'areas × k²', 'fig-dim');
    s += txt(P(300, 106), 'volumes × k³', 'fig-note');
    return svg('0 0 350 146', s, 'Scale factor 1.5: area grows by 1.5² = 2.25');
  }

  /* ============================================================
     25) SOH CAH TOA
     ============================================================ */
  function f25(){
    const R = P(90, 170), T = P(90, 58), B = P(268, 170);
    let s = `<polygon points="${poly([R, T, B])}" class="fig-shape"/>`;
    s += `<polygon points="${rightAngle(R, T, B, 14)}" class="fig-right"/>`;
    s += `<path d="${angleArc(B, R, T, 34)}" class="fig-angle"/>`;
    s += txt(angleLabelPos(B, R, T, 54), 'θ', 'fig-dim');

    s += `<line x1="${R.x}" y1="${R.y}" x2="${T.x}" y2="${T.y}" class="fig-side-o"/>`;
    s += `<line x1="${R.x}" y1="${R.y}" x2="${B.x}" y2="${B.y}" class="fig-side-a"/>`;
    s += `<line x1="${T.x}" y1="${T.y}" x2="${B.x}" y2="${B.y}" class="fig-side-h"/>`;

    s += txt(P(58, 114), 'Opposite', 'fig-dim fig-o', 'transform="rotate(-90 58 114)"');
    s += txt(P(179, 190), 'Adjacent', 'fig-dim fig-a');
    s += txt(P(196, 98), 'Hypotenuse', 'fig-dim fig-h', 'transform="rotate(-32 196 98)"');

    s += txt(P(305, 74), 'sin = O/H', 'fig-note');
    s += txt(P(305, 100), 'cos = A/H', 'fig-note');
    s += txt(P(305, 126), 'tan = O/A', 'fig-note');
    return svg('0 0 360 210', s,
      'Opposite and adjacent are named from where θ sits — the hypotenuse never moves');
  }

  /* ============================================================
     26) Finding a side with trig
     ============================================================ */
  function f26(){
    const R = P(96, 160), T = P(96, 70), B = P(262, 160);
    let s = `<polygon points="${poly([R, T, B])}" class="fig-shape"/>`;
    s += `<polygon points="${rightAngle(R, T, B, 13)}" class="fig-right"/>`;
    s += `<path d="${angleArc(B, R, T, 32)}" class="fig-angle"/>`;
    s += txt(angleLabelPos(B, R, T, 52), '30°', 'fig-dim');
    s += txt(sideLabel(T, B, R, -20), '10', 'fig-dim');
    s += txt(sideLabel(R, T, B, 18), '?', 'fig-dim fig-unknown');
    s += txt(P(180, 192), 'sin 30° = opposite ÷ 10', 'fig-note');
    s += txt(P(180, 212), 'opposite = 10 × 0.5 = 5', 'fig-dim');
    return svg('0 0 350 226', s, 'Pick the ratio that links the side you know to the one you want');
  }

  /* ============================================================
     27) Bearings and angle of elevation
     ============================================================ */
  function f27(){
    const O = P(88, 112), r = 62;
    let s = `<circle cx="${O.x}" cy="${O.y}" r="${r}" class="fig-circle fig-dash"/>`;
    s += `<line x1="${O.x}" y1="${O.y}" x2="${O.x}" y2="${O.y - r - 14}" class="fig-north"/>`;
    s += txt(P(O.x, O.y - r - 24), 'N', 'fig-dim');
    const bear = 120 - 90;                                   /* clockwise from north */
    const Bp = P(O.x + (r + 6) * Math.cos(bear * Math.PI / 180),
                 O.y + (r + 6) * Math.sin(bear * Math.PI / 180));
    s += `<line x1="${O.x}" y1="${O.y}" x2="${n2(Bp.x)}" y2="${n2(Bp.y)}" class="fig-side-h"/>`;
    s += `<path d="${angleArc(O, P(O.x, O.y - r), Bp, 30)}" class="fig-angle"/>`;
    s += txt(angleLabelPos(O, P(O.x, O.y - r), Bp, 48), '120°', 'fig-dim');
    s += `<circle cx="${O.x}" cy="${O.y}" r="3" class="fig-dot"/>`;
    s += txt(P(O.x - 13, O.y + 13), 'A', 'fig-note');
    s += txt(P(Bp.x + 12, Bp.y + 8), 'B', 'fig-note');
    s += txt(P(88, 206), 'measured clockwise from North', 'fig-note');

    /* elevation: 20 m tower, 20 m away */
    const G = P(222, 168), Tw = P(330, 168), Tp = P(330, 76);
    s += `<line x1="${G.x}" y1="${G.y}" x2="${Tw.x}" y2="${Tw.y}" class="fig-line"/>`;
    s += `<line x1="${Tw.x}" y1="${Tw.y}" x2="${Tp.x}" y2="${Tp.y}" class="fig-side-o"/>`;
    s += `<line x1="${G.x}" y1="${G.y}" x2="${Tp.x}" y2="${Tp.y}" class="fig-side-h"/>`;
    s += `<polygon points="${rightAngle(Tw, Tp, G, 11)}" class="fig-right"/>`;
    s += `<path d="${angleArc(G, Tw, Tp, 28)}" class="fig-angle"/>`;
    s += txt(angleLabelPos(G, Tw, Tp, 46), '45°', 'fig-dim');
    s += txt(P(276, 186), '20 m', 'fig-label');
    s += txt(P(352, 122), '20 m', 'fig-label');
    s += txt(P(282, 206), 'tan θ = 20/20 → 45°', 'fig-note');
    return svg('0 0 380 220', s, 'Bearings turn clockwise from North; elevation tilts up from the ground');
  }

  /* ============================================================
     28) Sine and cosine rules
     ============================================================ */
  function f28(){
    const A = P(60, 168), B = P(258, 168), C = P(176, 58);
    let s = `<polygon points="${poly([A,B,C])}" class="fig-shape"/>`;
    s += `<path d="${angleArc(A, B, C, 28)}" class="fig-angle"/>`;
    s += txt(angleLabelPos(A, B, C, 46), '60°', 'fig-dim');
    s += txt(P(A.x - 14, A.y + 12), 'A', 'fig-note');
    s += txt(P(B.x + 14, B.y + 12), 'B', 'fig-note');
    s += txt(P(C.x, C.y - 16), 'C', 'fig-note');
    s += txt(sideLabel(A, C, B, 18), '7', 'fig-dim');
    s += txt(sideLabel(A, B, C, 20), '9', 'fig-dim');
    s += txt(sideLabel(B, C, A, 20), '?', 'fig-dim fig-unknown');
    s += txt(P(176, 200), 'a² = 7² + 9² − 2(7)(9) cos 60°', 'fig-note');
    s += txt(P(176, 222), '= 49 + 81 − 63 = 67  →  a ≈ 8.2', 'fig-dim');
    return svg('0 0 350 236', s, 'Two sides and the angle between them — that is the cosine rule');
  }

  const MAP = { 17:f17, 18:f18, 19:f19, 20:f20, 21:f21, 22:f22, 23:f23, 24:f24,
                25:f25, 26:f26, 27:f27, 28:f28 };

  /* arrow marker shared by any figure that needs it */
  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <marker id="figArrow" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" class="fig-arrow-head"/>
      </marker></defs></svg>`;

  /* Lesson numbers restart per subject, so English also has a 17..28.
     The section name is what decides whether a diagram belongs here. */
  const DRAWN_SECTIONS = /^(Geometry|Trigonometry)$/i;

  function forLesson(sectionName, title){
    if(!DRAWN_SECTIONS.test(String(sectionName || '').trim())) return null;
    const m = /^\s*(\d+)\s*\)/.exec(title || '');
    if(!m) return null;
    const fn = MAP[+m[1]];
    return fn ? fn() : null;
  }

  return { forLesson, DEFS, has: (s, t) => !!forLesson(s, t) };
})();

window.Figures = Figures;
