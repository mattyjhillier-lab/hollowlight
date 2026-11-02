# B3: refined SATELLITE GARDEN (Matt's pick) + unlock sequence + whole web. python B3-gen.py -> B3-*.html
# Illustrative: names/numbers invented. Layout is generated from emblem data (heart, sockets a/b/c, fork targets);
# the animation shown in the sequence is render-only state derived from the saved lit set.
import importlib.util, math, os, random

D = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location('b2', os.path.join(D, 'B2-gen.py'))
b2 = importlib.util.module_from_spec(_s); _s.loader.exec_module(b2)
b1 = b2.b1
S, Curve, bez, perp, rot, woven_spoke, EMB, SEALS_WOLF = b2.S, b2.Curve, b2.bez, b2.perp, b2.rot, b2.woven_spoke, b2.EMB, b2.SEALS_WOLF
GOLD, INK, DIM, CREAM = b2.GOLD, b2.INK, b2.DIM, b2.CREAM


def unit(a, b):
    d = (b[0] - a[0], b[1] - a[1]); l = math.hypot(*d) or 1
    return (d[0] / l, d[1] / l), l


def add(a, v, k): return (a[0] + v[0] * k, a[1] + v[1] * k)


def side_away(u, a, away):
    p = (-u[1], u[0])
    q1 = add(a, p, 10); q2 = add(a, p, -10)
    return p if math.dist(q1, away) > math.dist(q2, away) else (-p[0], -p[1])


def fork_curve(seal, T, heart):
    """petal-edge fork: leaves the seal sideways (away from the spoke), curls forward onto its target."""
    u, L = unit(seal, T); pp = side_away(u, seal, heart)
    c1 = add(add(seal, u, 0.20 * L), pp, 0.46 * L)
    c2 = add(add(T, u, -0.30 * L), pp, 0.16 * L)
    pc = add(add(seal, u, 0.50 * L), pp, 0.30 * L)  # petal control
    return Curve([seal, c1, c2, T]), pc


def petal_k(s, a, tip, c, col, lit, k=1.0, op=1.0):
    tip = add(a, (tip[0] - a[0], tip[1] - a[1]), k); c = add(a, (c[0] - a[0], c[1] - a[1]), k)
    m = ((a[0] + tip[0]) / 2, (a[1] + tip[1]) / 2); c2 = (2 * m[0] - c[0], 2 * m[1] - c[1])
    s.back.append(f'<path d="M{a[0]:.1f} {a[1]:.1f} Q{c[0]:.1f} {c[1]:.1f} {tip[0]:.1f} {tip[1]:.1f} Q{c2[0]:.1f} {c2[1]:.1f} {a[0]:.1f} {a[1]:.1f}Z" fill="{col}" fill-opacity="{(.17 if lit else .05) * op:.3f}" stroke="{col}" stroke-opacity="{(.30 if lit else .12) * op:.3f}" stroke-width="1.2"/>')


def poly(s, pts, col, w, op=.95, glow=True):
    d = 'M' + ' L'.join('%.1f %.1f' % p for p in pts)
    if glow: s.lines.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-opacity=".2" stroke-width="{w*3.4:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
    s.lines.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-opacity="{op}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>')


def satellites(s, seal, col, lit, ns, sr, avoid_dirs, n=9, rad=1.75):
    for i in range(n):
        a = math.radians(360 / n * i + 12)
        v = (math.cos(a), math.sin(a))
        if any(v[0] * d[0] + v[1] * d[1] > math.cos(math.radians(34)) for d in avoid_dirs): continue
        p = add(seal, v, sr * rad)
        s.dot(p, col, lit, r=max(2.2, 3.1 * ns))


def garden(s, emb, C, sc, ns, states, lead, name_seals=None, sil=0.06, ghosts=0, rng=None, fork_fog=False):
    M = lambda p: (C[0] + p[0] * sc, C[1] + p[1] * sc)
    col = emb['col']; Hh = M(emb['heart']); ctr = M(emb['center'])
    b2.back_shape(s, emb, M, sc, col, fill=sil)
    hr, sr = 26 * ns, 24 * ns
    occ = []; seals = {}; leadpos = {}
    spokes = {}
    for k in 'abc':
        Sk = M(emb['sock'][k]); seals[k] = Sk
        sgn = 1 if Sk[0] < Hh[0] - 4 else (-1 if Sk[0] > Hh[0] + 4 else 0)
        cv = woven_spoke(Hh, Sk, 0.11 * sgn) if sgn else Curve([Hh, add(Hh, unit(Hh, Sk)[0], unit(Hh, Sk)[1] / 2), Sk])
        spokes[k] = cv
    # heart petals (skip toward spokes)
    sdirs = [unit(Hh, seals[k])[0] for k in 'abc']
    for i in range(8):
        a = math.radians(22.5 + 45 * i); v = (math.cos(a), math.sin(a))
        if any(v[0] * d[0] + v[1] * d[1] > math.cos(math.radians(30)) for d in sdirs): continue
        tip = add(Hh, v, hr * 2.7); c = add(add(Hh, v, hr * 1.5), (-v[1], v[0]), hr * .8)
        b2_petal = petal_k(s, add(Hh, v, hr * 1.15), tip, c, GOLD, True)
        s.dot(add(Hh, v, hr * 2.15), col, False, r=max(2.2, 3.3 * ns))
    for k in 'abc':
        cv = spokes[k]; lit_seal = states[k] == 'lit'
        s.curve(cv, col, lead[k] >= 4, w=3.0 * ns ** .3)
        leadpos[k] = b2.spoke_nodes(s, cv, col, lead[k], ns, hr, sr)
        occ += cv.pts
        avoid = [unit(seals[k], Hh)[0]]
        if lit_seal:
            for T in emb['targ'][k]:
                Tp = M(T); fc, pc = fork_curve(seals[k], Tp, Hh)
                petal_k(s, seals[k], Tp, pc, col, True)
                s.curve(fc, col, True, w=2.4 * ns ** .3)
                b2.fork_nodes(s, fc, col, True, ns, sr, False)
                occ += fc.pts
                avoid.append(unit(seals[k], fc.at(30))[0])
            satellites(s, seals[k], col, True, ns, sr, avoid)
        elif fork_fog:
            for T in emb['targ'][k]:
                Tp = M(T); fc, pc = fork_curve(seals[k], Tp, Hh)
                petal_k(s, seals[k], Tp, pc, '#8d9ab8', False, 0.8, .6)
    if ghosts and rng:
        g = []; tries = 0
        xs = [p[0] for p in occ]; ys = [p[1] for p in occ]
        x0, x1, y0, y1 = min(xs) - 60 * ns, max(xs) + 60 * ns, min(ys) - 60 * ns, max(ys) + 60 * ns
        while len(g) < ghosts and tries < 4000:
            tries += 1
            p = (rng.uniform(x0, x1), rng.uniform(y0, y1))
            if any(math.dist(p, q) < 44 * ns + 8 for q in occ[::2]): continue
            if any(math.dist(p, q) < 46 * ns + 8 for q in g): continue
            if math.dist(p, Hh) < 80 * ns + 30: continue
            g.append(p)
        for i, p in enumerate(g):
            for q in [q for q in g if q is not p and math.dist(p, q) < 84 * ns + 10][:1]:
                s.lines.append(f'<line x1="{p[0]:.1f}" y1="{p[1]:.1f}" x2="{q[0]:.1f}" y2="{q[1]:.1f}" stroke="{DIM}" stroke-opacity=".28" stroke-width="1"/>')
            if i % 6 == 0: s.dia(p, col, False, r=3.6 * ns + .6)
            else: s.nodes.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{2.6 * ns + .4:.1f}" fill="#26304a" stroke="{DIM}" stroke-width="1" opacity=".75"/>')
    s.med(Hh, hr, emb['kind'], col, lit=True)
    for k in 'abc':
        kind = (name_seals or {}).get(k, 'sigil')
        s.med(seals[k], sr, kind, col, lit=states[k] == 'lit', veiled=states[k] == 'veiled')
    return dict(M=M, heart=Hh, seals=seals, lead=leadpos)


# ---------------- 1. refined wolves garden (near zoom) ----------------
def wolves():
    s = S(); emb = EMB['wolf']; rng = random.Random(5)
    s.label((28, 40), 'Ghost Wolves  -  refined satellite garden', 24, GOLD, 'start', 700)
    s.label((28, 64), 'Layout generated from the wolf emblem (heart, eye/nose sockets, fork targets): S-curved spokes, petal forks, satellite rings, heart petals, ghost dots.', 13, '#b9c5e4', 'start', 500)
    g = garden(s, emb, (640, 402), 2.62, 1.0, dict(a='lit', b='lit', c='veiled'), dict(a=4, b=4, c=2), SEALS_WOLF, sil=0.055, ghosts=44, rng=rng)
    sa, sb, sc_ = g['seals']['a'], g['seals']['b'], g['seals']['c']
    # visual-only cross-threads between seals (never from fork leaves)
    s.thread(sa, sb, g['heart'], 0.55, 0.45); s.thread(sa, sc_, g['heart'], 0.12, 0.3); s.thread(sb, sc_, g['heart'], 0.12, 0.3)
    s.cap((g['heart'][0], g['heart'][1] - 52), 'HEART', GOLD, 11.5)
    s.cap((sa[0] - 150, sa[1] + 108), 'Howling Legion', GOLD, 13, 'end'); s.label((sa[0] - 150, sa[1] + 124), 'lit landmark (zero power)', 11, '#aebbd8', 'end')
    s.cap((sb[0] + 150, sb[1] + 108), 'Lightfoot Pack (lit)', GOLD, 13, 'start'); s.label((sb[0] + 150, sb[1] + 124), 'seal bought, both forks open', 11, '#aebbd8', 'start')
    s.cap((sc_[0] + 56, sc_[1] + 4), '?  veiled seal', '#aebbd8', 13, 'start'); s.label((sc_[0] + 56, sc_[1] + 20), 'no forks until it is lit', 11, '#aebbd8', 'start')
    s.label((640, 712), 'Dim dots and hairlines are texture, not nodes. Real nodes stay connected; forks are dead-end leaves.', 12, '#b9c5e4', 'middle', 600)
    return s.html('B3 wolves garden')


# ---------------- 2. unlock sequence (4 frames, one spoke) ----------------
def seq():
    s = S(); col = EMB['wolf']['col']
    PW, PH = 640, 360
    titles = ['1  Fresh: quiet ghost shapes', '2  Lead-in lit: the seal is about to wake', '3  Seal lit: the forks unfurl', '4  Forks bought: the garden glows']
    notes = ['static. Seal is a veiled "?"; only fog where forks will be (no node shapes shown).\nCalm motion: identical (nothing moves).',
             'animated: seal ring pulses (1.2 s loop), "next light" sparkle drifts up.\nCalm motion: pulse becomes a slow brightness fade.',
             'animated: seal flash 0.3 s, thread grows 0.8 s, petals scale 0.4 to 1.0 over 0.7 s, a light mote runs along each thread.\nCalm motion: threads and petals just fade in over 0.4 s.',
             'animated: one bloom of colour 0.6 s, then still. Hover pulses nothing.\nCalm motion: a single 0.3 s fade.']
    for idx in range(4):
        ox, oy = (idx % 2) * PW, (idx // 2) * PH
        st = idx + 1
        wash = f'<rect x="{ox+10}" y="{oy+10}" width="{PW-20}" height="{PH-20}" rx="14" fill="#0c1426" fill-opacity=".45" stroke="{GOLD}" stroke-opacity=".35" stroke-width="1.5"/>'
        s.back.append(wash)
        if st == 4:
            s.back.append(f'<ellipse cx="{ox+330}" cy="{oy+190}" rx="300" ry="150" fill="{col}" fill-opacity=".13" filter="url(#glow)"/><ellipse cx="{ox+330}" cy="{oy+190}" rx="190" ry="90" fill="{GOLD}" fill-opacity=".08" filter="url(#glow)"/>')
        if st <= 2:
            s.back.append(f'<rect x="{ox+10}" y="{oy+10}" width="{PW-20}" height="{PH-20}" rx="14" fill="#05080f" fill-opacity=".30"/>')
        s.label((ox + 28, oy + 36), titles[idx], 14, GOLD, 'start', 700)
        ns = 0.82
        H = (ox + 86, oy + 214); Sk = (ox + 372, oy + 196); T = [(ox + 560, oy + 112), (ox + 560, oy + 292)]
        cv = woven_spoke(H, Sk, 0.10)
        lit_lead = 4 if st >= 2 else 0
        s.curve(cv, col, st >= 2, w=2.8)
        b2.spoke_nodes(s, cv, col, lit_lead, ns, 26 * ns, 24 * ns)
        # heart petals (always lit: the weapon is unlocked)
        for i in range(6):
            a = math.radians(30 + 60 * i); v = (math.cos(a), math.sin(a))
            if v[0] > .55: continue
            tip = add(H, v, 56 * ns); petal_k(s, add(H, v, 28 * ns), tip, add(add(H, v, 40 * ns), (-v[1], v[0]), 16), GOLD, True)
        s.med(H, 26 * ns, 'wolf', col, True)
        # forks
        for j, Tp in enumerate(T):
            fc, pc = fork_curve(Sk, Tp, H)
            if st == 1:
                petal_k(s, Sk, Tp, pc, '#8d9ab8', False, 0.9, .7)  # fog only
            elif st == 3:
                k = 0.62 if j == 0 else 0.40
                petal_k(s, Sk, Tp, pc, col, True, k, .8)
                pts = [fc.at(fc.L * k * i / 40) for i in range(41)]
                poly(s, pts, col, 2.2 * ns ** .3)
                a_ = 24 * ns + 15 * ns
                d1 = a_; d2 = a_ + (fc.L - a_) * .5
                s.dot(fc.at(d1), col, fc.L * k > d1, r=6 * ns)
                s.dot(fc.at(d2), col, fc.L * k > d2, ghost=fc.L * k <= d2, r=6 * ns)
                s.dia(fc.at(fc.L), col, False, ghost=True, r=7.4 * ns)
                head = fc.at(fc.L * k)
                for q in range(1, 5):  # light mote with a trail
                    tp = fc.at(max(0, fc.L * k - q * 11)); s.nodes.append(f'<circle cx="{tp[0]:.1f}" cy="{tp[1]:.1f}" r="{max(1.6, 5 - q):.1f}" fill="#ffffff" opacity="{.6 - q * .12:.2f}"/>')
                s.nodes.append(f'<circle cx="{head[0]:.1f}" cy="{head[1]:.1f}" r="6" fill="#ffffff" filter="url(#glow)"/>')
            elif st == 4:
                petal_k(s, Sk, Tp, pc, col, True)
                s.curve(fc, col, True, w=2.4 * ns ** .3)
                b2.fork_nodes(s, fc, col, True, ns, 24 * ns, False)
        if st == 4:
            av = [unit(Sk, H)[0]] + [unit(Sk, fork_curve(Sk, Tp, H)[0].at(26))[0] for Tp in T]
            satellites(s, Sk, col, True, ns, 24 * ns, av)
        # the seal
        if st == 1: s.med(Sk, 24 * ns, 'paw', col, False, veiled=True)
        elif st == 2:
            for r_, o_ in ((24 * ns + 12, .22), (24 * ns + 24, .12)):
                s.nodes.append(f'<circle cx="{Sk[0]}" cy="{Sk[1]}" r="{r_:.1f}" fill="none" stroke="{GOLD}" stroke-opacity="{o_}" stroke-width="2"/>')
            s.med(Sk, 24 * ns, 'paw', col, False, veiled=True)
            for q in range(5):
                a = math.radians(-70 + q * 35); p = add(Sk, (math.cos(a), math.sin(a)), 24 * ns + 18 + q % 2 * 8)
                s.nodes.append(f'<polygon points="{p[0]:.1f},{p[1]-4:.1f} {p[0]+2:.1f},{p[1]:.1f} {p[0]:.1f},{p[1]+4:.1f} {p[0]-2:.1f},{p[1]:.1f}" fill="{GOLD}" opacity=".85"/>')
            s.label((Sk[0], Sk[1] + 56), 'next light: Lightfoot seal', 11, GOLD, 'middle', 600)
        else:
            if st == 3: s.nodes.append(f'<circle cx="{Sk[0]}" cy="{Sk[1]}" r="{24*ns+10:.1f}" fill="none" stroke="#fff6dc" stroke-opacity=".6" stroke-width="2.5" filter="url(#glow)"/>')
            s.med(Sk, 24 * ns, 'paw', col, True)
        if st == 3:  # hover card on the first new dot
            p = fork_curve(Sk, T[0], H)[0].at(24 * ns + 15 * ns); bx, by = p[0] + 24, p[1] - 76
            s.nodes.append(f'<rect x="{bx:.0f}" y="{by:.0f}" width="150" height="58" rx="8" fill="#101a30" stroke="{GOLD}" stroke-opacity=".7"/>')
            s.nodes.append(f'<line x1="{p[0]+7:.0f}" y1="{p[1]-6:.0f}" x2="{bx+10:.0f}" y2="{by+58:.0f}" stroke="{GOLD}" stroke-opacity=".7"/>')
            s.text.append(f'<text x="{bx+10:.0f}" y="{by+20:.0f}" font-size="12.5" fill="{GOLD}" font-weight="700">Light Paws</text><text x="{bx+10:.0f}" y="{by+36:.0f}" font-size="11" fill="{INK}">+1% Wolf speed</text><text x="{bx+10:.0f}" y="{by+51:.0f}" font-size="11" fill="#9fd8ff">140 gold  -  can light</text>')
        s.label((ox + 28, oy + PH - 38), notes[idx], 10.5, '#aebbd8', 'start', 500)
    s.label((640, 18), '', 1)
    return s.html('B3 unlock sequence')


# ---------------- 3. whole web, refined garden for all five ----------------
def whole():
    s = S(); rng = random.Random(9)
    s.label((28, 36), 'Restore the Hollow  -  MID zoom, satellite gardens', 20, GOLD, 'start', 700)
    s.label((28, 58), 'Each weapon grows from its own emblem: wolf head, raven wings, star, zigzag, rings. Veiled seals show no forks; cream threads are visual cross-links.', 12, '#b9c5e4', 'start', 500)
    hub = (640, 396)
    place = [('raven', (640, 200), 1.05, dict(a='lit', b='veiled', c='veiled'), dict(a=4, b=2, c=0)),
             ('wolf', (260, 322), 1.16, dict(a='lit', b='lit', c='veiled'), dict(a=4, b=4, c=2)),
             ('bolt', (1020, 322), 1.0, dict(a='lit', b='veiled', c='veiled'), dict(a=4, b=3, c=0)),
             ('orbit', (402, 596), 1.04, dict(a='lit', b='lit', c='veiled'), dict(a=4, b=4, c=1)),
             ('chain', (878, 596), 1.12, dict(a='lit', b='veiled', c='veiled'), dict(a=4, b=1, c=0))]
    ns = 0.62; res = {}
    for key, C, sc, st, ld in place:
        emb = EMB[key]
        res[key] = garden(s, emb, C, sc, ns, st, ld, SEALS_WOLF if key == 'wolf' else None, sil=0.07)
        bottom = {'raven': 78, 'wolf': 120, 'bolt': 124, 'orbit': 118, 'chain': 70}[key]
        s.cap((C[0], C[1] + bottom * sc + 16), emb['name'], GOLD, 12.5)
    for key, C, sc, st, ld in place:
        Hh = res[key]['heart']
        cv = Curve([hub, b2.bowed(hub, Hh, hub, 0.07), Hh])
        s.curve(cv, CREAM, True, w=1.5, glow=False)
        for i in range(1, 5): s.dot(cv.at(48 + (cv.L - 48 - 36) * i / 5), '#cfe4ff', True, r=3.4)
    s.med(hub, 30, 'lantern', GOLD); s.cap((hub[0], hub[1] + 46), 'Lantern', GOLD, 11.5)
    order = ['raven', 'bolt', 'chain', 'orbit', 'wolf']
    for i, a in enumerate(order):
        b = order[(i + 1) % 5]
        best = min(((math.dist(pa, pb), pa, pb) for pa in res[a]['seals'].values() for pb in res[b]['seals'].values()), key=lambda t: t[0])
        s.thread(best[1], best[2], hub, 0.25, 0.5, 1.2)
        bl = min(((math.dist(pa, pb), pa, pb) for pa in (v[3] for v in res[a]['lead'].values()) for pb in (v[3] for v in res[b]['lead'].values())), key=lambda t: t[0])
        s.thread(bl[1], bl[2], hub, 0.3, 0.3, 1.0)
    for nm, kind, pos, tgt in (('Wren', 'lantern', (70, 520), res['orbit']['seals']['a']), ('Elias', 'orbit', (1210, 520), res['chain']['seals']['b'])):
        s.med(pos, 20, kind, GOLD); s.cap((pos[0], pos[1] + 36), nm + ' (hero)', '#ffe6b0', 11)
        cv = Curve([pos, b2.bowed(pos, tgt, hub, 0.1), tgt]); s.curve(cv, CREAM, False, w=1.6)
        for i in range(1, 4): s.dot(cv.at(26 + (cv.L - 60) * i / 4), CREAM, False, r=3.8)
    s.label((28, 702), 'Gold ring = heart or seal. Blue / purple / orange / cyan / gold glow = weapon colour. Faint silhouette = the emblem the nodes grow from.', 12, '#b9c5e4', 'start', 500)
    return s.html('B3 whole web', rings=True)


if __name__ == '__main__':
    for n, f in [('B3-wolves-garden', wolves), ('B3-unlock-sequence', seq), ('B3-whole-web-garden', whole)]:
        open(os.path.join(D, n + '.html'), 'w', encoding='utf-8').write(f())
    print('ok')
