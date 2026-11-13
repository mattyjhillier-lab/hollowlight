# B2 shape-language mockups for the branch structure (docs/design/tree-branches-v1.md, "Shape language").
# python B2-gen.py -> B2-*.html. Illustrative: names/numbers invented. Layout is GENERATED from emblem data:
# heart point, socket points (a,b,c) and per-socket fork targets; no hand-placed node coordinates.
import importlib.util, math, os, random

D = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location('b1', os.path.join(D, 'B1-gen.py'))
b1 = importlib.util.module_from_spec(_s); _s.loader.exec_module(b1)
GOLD, INK, DIM, W, H = b1.GOLD, b1.INK, b1.DIM, b1.W, b1.H
CREAM = '#d9c9a0'


# ---------------- geometry helpers ----------------
def bez(P, t):
    P = list(P)
    while len(P) > 1:
        P = [((1 - t) * a[0] + t * b[0], (1 - t) * a[1] + t * b[1]) for a, b in zip(P, P[1:])]
    return P[0]


class Curve:
    def __init__(s, P, n=90):
        s.P = P; s.pts = [bez(P, i / n) for i in range(n + 1)]
        s.cum = [0]
        for a, b in zip(s.pts, s.pts[1:]): s.cum.append(s.cum[-1] + math.dist(a, b))
        s.L = s.cum[-1]

    def at(s, d):
        d = max(0, min(s.L, d))
        for i in range(1, len(s.cum)):
            if s.cum[i] >= d:
                seg = s.cum[i] - s.cum[i - 1] or 1
                f = (d - s.cum[i - 1]) / seg
                a, b = s.pts[i - 1], s.pts[i]
                return (a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f)
        return s.pts[-1]


def perp(a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    l = math.hypot(dx, dy) or 1
    return (-dy / l, dx / l)


def bowed(a, b, away_from, bow):
    """quadratic control point: midpoint pushed sideways, on the side AWAY from `away_from`."""
    m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); p = perp(a, b); L = math.dist(a, b)
    c1 = (m[0] + p[0] * bow * L, m[1] + p[1] * bow * L); c2 = (m[0] - p[0] * bow * L, m[1] - p[1] * bow * L)
    return c1 if math.dist(c1, away_from) >= math.dist(c2, away_from) else c2


class S:
    def __init__(s): s.back = []; s.lines = []; s.nodes = []; s.text = []

    def path(s, P, col, lit=True, w=2.2, op=None, ghost=False, glow=True):
        if len(P) == 2: d = 'M%.1f %.1f L%.1f %.1f' % (*P[0], *P[1])
        else: d = 'M%.1f %.1f %s ' % (*P[0], 'Q' if len(P) == 3 else 'C') + ' '.join('%.1f %.1f' % p for p in P[1:])
        if ghost:
            s.lines.append(f'<path d="{d}" fill="none" stroke="{DIM}" stroke-opacity=".7" stroke-width="1.3" stroke-dasharray="2 5" stroke-linecap="round"/>'); return
        if lit and glow: s.lines.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-opacity=".20" stroke-width="{w*3.4:.1f}" stroke-linecap="round"/>')
        s.lines.append(f'<path d="{d}" fill="none" stroke="{col if lit else DIM}" stroke-opacity="{(op or .95) if lit else .65}" stroke-width="{w if lit else w*.72:.1f}" stroke-linecap="round"/>')

    def curve(s, c, col, lit, **k): s.path(c.P, col, lit, **k)

    def thread(s, a, b, sag_to=None, k=0.5, op=0.42, w=1.0):
        m = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)
        c = m if sag_to is None else (m[0] + (sag_to[0] - m[0]) * k, m[1] + (sag_to[1] - m[1]) * k)
        s.lines.append(f'<path d="M{a[0]:.1f} {a[1]:.1f} Q{c[0]:.1f} {c[1]:.1f} {b[0]:.1f} {b[1]:.1f}" fill="none" stroke="{CREAM}" stroke-opacity="{op}" stroke-width="{w}"/>')

    def dot(s, p, col, lit=True, r=6.5, ghost=False):
        if ghost: s.nodes.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{r}" fill="none" stroke="{DIM}" stroke-width="1.2" stroke-dasharray="2 3" opacity=".8"/>')
        elif lit: s.nodes.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{r}" fill="{col}" stroke="#f4fbff" stroke-width="{max(1, r/4.5):.1f}" filter="url(#glow)"/>')
        else: s.nodes.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{r}" fill="#1c2438" stroke="{DIM}" stroke-width="{max(1, r/4):.1f}"/>')

    def dia(s, p, col, lit=True, r=8, ghost=False):
        q = r * 1.4
        pts = f'{p[0]:.1f},{p[1]-q:.1f} {p[0]+q:.1f},{p[1]:.1f} {p[0]:.1f},{p[1]+q:.1f} {p[0]-q:.1f},{p[1]:.1f}'
        if ghost: s.nodes.append(f'<polygon points="{pts}" fill="none" stroke="{DIM}" stroke-width="1.2" stroke-dasharray="2 3" opacity=".8"/>')
        elif lit: s.nodes.append(f'<polygon points="{pts}" fill="#fff0c8" stroke="{GOLD}" stroke-width="{max(1, r/5):.1f}" filter="url(#glow)"/><circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{r*.38:.1f}" fill="#1d2a44"/>')
        else: s.nodes.append(f'<polygon points="{pts}" fill="#1c2438" stroke="{DIM}" stroke-width="{max(1, r/4.5):.1f}"/><circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{r*.3:.1f}" fill="{DIM}"/>')

    def med(s, p, r, kind, col, lit=True, veiled=False):
        x, y = p
        if veiled:
            s.nodes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#141b2c" stroke="#8d9ab8" stroke-width="{max(1.6, r/11):.1f}" stroke-dasharray="5 4"/><text x="{x:.1f}" y="{y+r*.36:.1f}" font-size="{r*1.1:.0f}" text-anchor="middle" fill="#8d9ab8" font-family="Georgia,serif">?</text>'); return
        ring = GOLD if lit else '#6b7898'
        s.nodes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r+5}" fill="{col}" opacity="{.3 if lit else 0}" filter="url(#glow)"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#16213a" stroke="{ring}" stroke-width="{max(1.8, r/10):.1f}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{max(r-4, 2):.1f}" fill="none" stroke="{ring}" stroke-opacity=".4" stroke-width="1"/>')
        s.nodes.append(b1.GLYPH[kind](x, y, r * 0.62, col if lit else '#7a88a8'))

    def label(s, p, t, size=12, col=INK, anchor='middle', w=500):
        for i, line in enumerate(t.split('\n')):
            s.text.append(f'<text x="{p[0]:.1f}" y="{p[1]+i*(size+3):.1f}" font-size="{size}" fill="{col}" text-anchor="{anchor}" font-weight="{w}" stroke="#0a0f1c" stroke-width="3" paint-order="stroke">{line}</text>')

    def cap(s, p, t, col=GOLD, size=12.5, anchor='middle'): s.label(p, t, size, col, anchor, 700)

    def html(s, title, rings=False):
        return b1.page(''.join(s.back) + ''.join(s.lines) + ''.join(s.nodes) + ''.join(s.text), title, rings=rings)


# ---------------- emblems (units; y down). Layout is generated from these points ----------------
def mirror(pts): return [(-x, y) for x, y in pts]


def poly(pts): return 'M' + ' L'.join('%.1f %.1f' % p for p in pts) + 'Z'


WOLF_SIL = [(-74, -108), (-30, -52), (-12, -58), (12, -58), (30, -52), (74, -108), (88, -26), (112, 18), (80, 30), (88, 62), (52, 64), (28, 96), (0, 108), (-28, 96), (-52, 64), (-88, 62), (-80, 30), (-112, 18), (-88, -26)]
RAVEN_L = [(-12, -30), (-60, -58), (-112, -72), (-142, -58), (-124, -44), (-148, -26), (-126, -14), (-142, 8), (-112, 10), (-116, 34), (-70, 24), (-26, 14), (-16, 44), (-28, 102)]
RAVEN_SIL = [(x, -y) for x, y in (RAVEN_L + [(0, 114)] + list(reversed(mirror(RAVEN_L))))]
STAR_SIL = [((118 if k % 2 == 0 else 50) * math.cos(math.radians(22.5 * k)), (118 if k % 2 == 0 else 50) * math.sin(math.radians(22.5 * k))) for k in range(16)]


def pr(a, r): return (r * math.cos(math.radians(a)), r * math.sin(math.radians(a)))


EMB = {
    'wolf': dict(kind='wolf', sil=poly(WOLF_SIL), center=(0, 0), heart=(0, -66), col='#9fd8ff', name='Ghost Wolves',
                 sock={'a': (-38, -2), 'b': (38, -2), 'c': (0, 42)},
                 targ={'a': [(-72, -100), (-96, 12)], 'b': [(72, -100), (96, 12)], 'c': [(-50, 68), (50, 68)]}),
    'raven': dict(kind='raven', sil=poly(RAVEN_SIL), center=(0, 0), heart=(0, 14), col='#b79cff', name='Raven Flock',
                  sock={'a': (-72, 34), 'b': (72, 34), 'c': (0, -56)},
                  targ={'a': [(-128, 58), (-112, -14)], 'b': [(128, 58), (112, -14)], 'c': [(-30, -92), (30, -92)]}),
    'bolt': dict(kind='star', sil=poly(STAR_SIL), center=(0, 0), heart=(0, 0), col='#ffb86b', name='Spirit Bolts',
                 sock={'a': pr(225, 62), 'b': pr(315, 62), 'c': pr(90, 62)},
                 targ={'a': [pr(180, 104), pr(270, 104)], 'b': [pr(270, 104), pr(0, 104)], 'c': [pr(45, 104), pr(135, 104)]}),
    'chain': dict(kind='bolt', sil=None, zig=[(-130, 14), (-86, -42), (-44, 20), (0, -42), (44, 20), (86, -42), (130, 14)], center=(0, 0), heart=(0, -8), col='#8ff0ff', name='Chain Lightning',
                  sock={'a': (-62, -14), 'b': (62, -14), 'c': (0, 36)},
                  targ={'a': [(-122, 10), (-96, -44)], 'b': [(122, 10), (96, -44)], 'c': [(-34, 68), (34, 68)]}),
    'orbit': dict(kind='orbit', sil=None, rings=[108, 72], center=(0, 0), heart=(0, 0), col='#ffd27a', name='Holy Orbit',
                  sock={'a': pr(210, 72), 'b': pr(330, 72), 'c': pr(90, 72)},
                  targ={'a': [pr(168, 108), pr(252, 108)], 'b': [pr(288, 108), pr(12, 108)], 'c': [pr(48, 108), pr(132, 108)]}),
}
def _sigil(x, y, r, c):
    return f'<polygon points="{x:.1f},{y-r:.1f} {x+r:.1f},{y:.1f} {x:.1f},{y+r:.1f} {x-r:.1f},{y:.1f}" fill="none" stroke="{c}" stroke-width="2"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r*.28:.1f}" fill="{c}"/>'


b1.GLYPH['sigil'] = _sigil
SEALS_WOLF = {'a': 'legion', 'b': 'paw', 'c': 'alpha'}


def back_shape(s, emb, M, sc, col, fill=0.10):
    if emb.get('sil'):
        pts = [M(p) for p in [tuple(map(float, q.split())) for q in emb['sil'][1:-1].replace('L', ' L').split(' L')]] if False else None
    # polygon again from raw lists (cheap): reparse
    if emb.get('sil'):
        raw = emb['sil'][1:-1].split(' L')
        pts = [M(tuple(float(v) for v in r.split())) for r in raw]
        d = 'M' + ' L'.join('%.1f %.1f' % p for p in pts) + 'Z'
        s.back.append(f'<path d="{d}" fill="{col}" fill-opacity="{fill}" stroke="{col}" stroke-opacity=".30" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round" stroke-linejoin="round"/>')
    if emb.get('zig'):
        pts = [M(p) for p in emb['zig']]
        d = 'M' + ' L'.join('%.1f %.1f' % p for p in pts)
        s.back.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-opacity="{fill*1.4}" stroke-width="{26*sc*.55:.1f}" stroke-linejoin="round" stroke-linecap="round"/><path d="{d}" fill="none" stroke="{col}" stroke-opacity=".28" stroke-width="2" stroke-dasharray="1 7"/>')
    for r in emb.get('rings', []):
        c = M((0, 0))
        s.back.append(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="{r*sc:.1f}" fill="none" stroke="{col}" stroke-opacity=".28" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round"/><circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="{r*sc:.1f}" fill="{col}" fill-opacity="{fill*.35}"/>')


def spoke_nodes(s, cv, col, lead_lit, ns, hr, sr):
    off = hr + 14 * ns; margin = sr + 15 * ns
    step = max((cv.L - off - margin) / 3.0, 12)
    pos = []
    for k in range(4):
        p = cv.at(off + step * k)
        pos.append(p)
        if k < 3: s.dot(p, col, k < lead_lit, r=6.5 * ns)
        else: s.dia(p, col, k < lead_lit, r=8 * ns)
    return pos


def fork_nodes(s, cv, col, lit, ns, sr, ghost):
    a = sr + 15 * ns; tip = cv.L
    ds = [a, a + (tip - a) * 0.5]
    out = []
    for d in ds:
        p = cv.at(d); out.append(p); s.dot(p, col, lit, r=6 * ns, ghost=ghost)
    s.dia(cv.at(tip), col, lit, r=7.4 * ns, ghost=ghost); out.append(cv.at(tip))
    return out


# ---------------- 1. EMBLEM SKELETON ----------------
def skeleton(s, emb, C, sc, ns, states, lead, hearts_lit=True, ghost_forks=True, seal_kinds=None, bow=0.20, fbow=0.22):
    M = lambda p: (C[0] + p[0] * sc, C[1] + p[1] * sc)
    col = emb['col']; Hh = M(emb['heart']); ctr = M(emb['center'])
    back_shape(s, emb, M, sc, col)
    hr, sr = 26 * ns, 24 * ns
    seals = {}; leadpos = {}
    for k in 'abc':
        Sk = M(emb['sock'][k]); lit_seal = states[k] == 'lit'
        ctrl = bowed(Hh, Sk, ctr, bow)
        cv = Curve([Hh, ctrl, Sk])
        n = lead[k]
        # lit portion drawn as full lit path when whole lead-in is bought, else dim path then lit overlay
        s.curve(cv, col, n >= 4, w=2.6 * (ns ** .3))
        if 0 < n < 4:
            part = Curve([bez(cv.P, 0), bez(cv.P, 0.5), bez(cv.P, 0.5)]) if False else None
        leadpos[k] = spoke_nodes(s, cv, col, n, ns, hr, sr)
        seals[k] = Sk
        for j, T in enumerate(emb['targ'][k]):
            Tp = M(T)
            fc = Curve([Sk, bowed(Sk, Tp, Hh, fbow), Tp])
            ghost = not lit_seal
            if ghost and not ghost_forks: continue
            s.curve(fc, col, lit_seal, w=2.2 * (ns ** .3), ghost=ghost)
            fork_nodes(s, fc, col, lit_seal, ns, sr, ghost)
    s.med(Hh, hr, emb['kind'], col, lit=hearts_lit)
    for k in 'abc':
        kind = (seal_kinds or {}).get(k, 'sigil')
        s.med(seals[k], sr, kind, col, lit=states[k] == 'lit', veiled=states[k] == 'veiled')
    return dict(M=M, heart=Hh, seals=seals, lead=leadpos)


def shape1():
    s = S(); emb = EMB['wolf']
    s.label((28, 40), 'Shape 1  -  Emblem skeleton', 24, GOLD, 'start', 700)
    s.label((28, 64), 'Ghost Wolves, near zoom. Seals sit on the wolf\'s eyes and nose; lead-ins arc from the brow; forks run out along the ears, cheeks and jaw.', 13, '#b9c5e4', 'start', 500)
    g = skeleton(s, emb, (640, 398), 2.62, 1.0, dict(a='lit', b='lit', c='veiled'), dict(a=4, b=4, c=2), seal_kinds=SEALS_WOLF)
    # visual-only cross-link threads between seals (never from fork leaves)
    sa, sb, sc_ = g['seals']['a'], g['seals']['b'], g['seals']['c']
    s.thread(sa, sb, g['heart'], 0.55); s.thread(sa, sc_, g['heart'], 0.15, 0.35); s.thread(sb, sc_, g['heart'], 0.15, 0.35)
    s.thread(g['lead'].get('a')[1], g['lead'].get('c')[0], None, 0, 0.3)
    s.cap((g['heart'][0], g['heart'][1] - 38), 'HEART', GOLD, 11.5)
    s.cap((sa[0] - 120, sa[1] + 112), 'Howling Legion', GOLD, 13, 'end'); s.label((sa[0] - 120, sa[1] + 128), 'lit landmark (zero power)', 11, '#aebbd8', 'end')
    s.cap((sb[0] + 120, sb[1] + 112), 'Lightfoot Pack (lit)', GOLD, 13, 'start'); s.label((sb[0] + 120, sb[1] + 128), 'seal bought, forks open', 11, '#aebbd8', 'start')
    s.cap((sc_[0] + 62, sc_[1] + 20), '?  veiled seal', '#aebbd8', 13, 'start'); s.label((sc_[0] + 62, sc_[1] + 36), 'forks stay hidden', 11, '#aebbd8', 'start')
    s.label((g['M']((-72, -100))[0] - 18, g['M']((-72, -100))[1] - 4), 'ear fork\n(pair flavour)', 10.5, '#ffe6b0', 'end')
    s.label((g['M']((-96, 12))[0] - 18, g['M']((-96, 12))[1] + 4), 'cheek fork\n(status / utility)', 10.5, '#ffe6b0', 'end')
    s.label((640, 710), 'Faint wolf silhouette is the weapon emblem; every node is generated from its heart, eye/nose sockets and fork targets.', 12, '#b9c5e4', 'middle', 600)
    return s.html('B2 shape 1')


# ---------------- 2. WOVEN WEB ----------------
def woven_spoke(Hh, Sk, A=0.13):
    d = (Sk[0] - Hh[0], Sk[1] - Hh[1]); L = math.hypot(*d); p = (-d[1] / L, d[0] / L)
    return Curve([Hh, (Hh[0] + d[0] * .33 + p[0] * A * L, Hh[1] + d[1] * .33 + p[1] * A * L), (Hh[0] + d[0] * .66 - p[0] * A * L, Hh[1] + d[1] * .66 - p[1] * A * L), Sk])


def rot(v, deg):
    a = math.radians(deg); return (v[0] * math.cos(a) - v[1] * math.sin(a), v[0] * math.sin(a) + v[1] * math.cos(a))


def shape2():
    s = S(); col = EMB['wolf']['col']
    s.label((28, 40), 'Shape 2  -  Woven web', 24, GOLD, 'start', 700)
    s.label((28, 64), 'Curved S-spokes; thin cross-threads join the same step of neighbouring spokes into web cells; lit threads glow.', 13, '#b9c5e4', 'start', 500)
    Hh = (640, 318); LS = 272
    seal = {k: (Hh[0] + math.cos(math.radians(a)) * LS, Hh[1] + math.sin(math.radians(a)) * LS) for k, a in (('a', 210), ('b', 330), ('c', 90))}
    st = dict(a='lit', b='lit', c='veiled'); lead = dict(a=4, b=4, c=2)
    cvs = {k: woven_spoke(Hh, seal[k], 0.10) for k in 'abc'}
    steps = {}
    for k in 'abc':
        cv = cvs[k]; off = 46; step = (cv.L - off - 42) / 3.0
        steps[k] = [cv.at(off + step * i) for i in range(4)]
    pairs = (('a', 'b'), ('b', 'c'), ('c', 'a'))
    # web cells: concentric arcs round the heart joining the same step of neighbouring spokes (a spider-web rosette)
    def ring_arc(p, q, bow=1.16, op=0.5, w=1.1):
        r = (math.dist(p, Hh) + math.dist(q, Hh)) / 2
        ma = math.atan2(p[1] - Hh[1], p[0] - Hh[0]); mb = math.atan2(q[1] - Hh[1], q[0] - Hh[0])
        dv = ((p[0] - Hh[0]) / math.dist(p, Hh) + (q[0] - Hh[0]) / math.dist(q, Hh), (p[1] - Hh[1]) / math.dist(p, Hh) + (q[1] - Hh[1]) / math.dist(q, Hh))
        l = math.hypot(*dv) or 1
        c = (Hh[0] + dv[0] / l * r * bow * 1.12, Hh[1] + dv[1] / l * r * bow * 1.12)
        s.lines.append(f'<path d="M{p[0]:.1f} {p[1]:.1f} Q{c[0]:.1f} {c[1]:.1f} {q[0]:.1f} {q[1]:.1f}" fill="none" stroke="{CREAM}" stroke-opacity="{op}" stroke-width="{w}"/>')
    for i in range(4):
        for a_, b_ in pairs:
            ring_arc(steps[a_][i], steps[b_][i], 1.16, 0.55 if i < 3 else 0.42)
    for a_, b_ in pairs:
        ring_arc(seal[a_], seal[b_], 1.16, 0.34)
        for i in range(3):
            ring_arc(steps[a_][i], steps[b_][i + 1], 1.0, 0.18, 0.8)
            ring_arc(steps[b_][i], steps[a_][i + 1], 1.0, 0.18, 0.8)
    s.back.append(f'<circle cx="{Hh[0]}" cy="{Hh[1]}" r="50" fill="none" stroke="{GOLD}" stroke-opacity=".4" stroke-width="1.5"/>')
    for k in 'abc':
        cv = cvs[k]; lit = st[k] == 'lit'
        s.curve(cv, col, lead[k] >= 4, w=3.0)
        spoke_nodes(s, cv, col, lead[k], 1.0, 26, 25)
        d = (seal[k][0] - Hh[0], seal[k][1] - Hh[1]); ang = math.atan2(d[1], d[0])
        for sg in (-1, 1):
            a2 = ang + sg * math.radians(38)
            tip = (seal[k][0] + math.cos(a2) * 118, seal[k][1] + math.sin(a2) * 118)
            fc = Curve([seal[k], bowed(seal[k], tip, Hh, 0.16), tip])
            s.curve(fc, col, lit, w=2.4, ghost=not lit)
            fork_nodes(s, fc, col, lit, 1.0, 25, not lit)
    s.med(Hh, 27, 'wolf', col)
    for k in 'abc': s.med(seal[k], 25, SEALS_WOLF[k], col, lit=st[k] == 'lit', veiled=st[k] == 'veiled')
    s.cap((Hh[0], Hh[1] - 42), 'HEART', GOLD, 11.5)
    s.cap((seal['a'][0] - 20, seal['a'][1] + 50), 'Howling Legion', GOLD, 13); s.cap((seal['b'][0] + 20, seal['b'][1] + 50), 'Lightfoot Pack (lit)', GOLD, 13)
    s.cap((seal['c'][0] + 74, seal['c'][1] - 2), '?  veiled seal', '#aebbd8', 13, 'start')
    s.label((640, 710), 'Cross-threads are visual only (no requires). Cells form between spokes; forks stay dead-end leaves.', 12, '#b9c5e4', 'middle', 600)
    return s.html('B2 shape 2', rings=False)


# ---------------- 3. SATELLITE GARDEN ----------------
def petal(s, a, tip, c, col, lit):
    m = ((a[0] + tip[0]) / 2, (a[1] + tip[1]) / 2); c2 = (2 * m[0] - c[0], 2 * m[1] - c[1])
    s.back.append(f'<path d="M{a[0]:.1f} {a[1]:.1f} Q{c[0]:.1f} {c[1]:.1f} {tip[0]:.1f} {tip[1]:.1f} Q{c2[0]:.1f} {c2[1]:.1f} {a[0]:.1f} {a[1]:.1f}Z" fill="{col}" fill-opacity="{.16 if lit else .05}" stroke="{col}" stroke-opacity="{.28 if lit else .12}" stroke-width="1.2"/>')


def shape3():
    s = S(); col = EMB['wolf']['col']; rnd = random.Random(11)
    s.label((28, 40), 'Shape 3  -  Satellite garden', 24, GOLD, 'start', 700)
    s.label((28, 64), 'S-curved spokes; hubs wear a ring of satellites; each fork pair opens like a flower of two petals; dim ghost dots are texture.', 13, '#b9c5e4', 'start', 500)
    Hh = (640, 330); LS = 262
    seal = {k: (Hh[0] + math.cos(math.radians(a)) * LS, Hh[1] + math.sin(math.radians(a)) * LS) for k, a in (('a', 205), ('b', 335), ('c', 90))}
    st = dict(a='lit', b='lit', c='veiled'); lead = dict(a=4, b=4, c=2)
    cvs = {k: woven_spoke(Hh, seal[k], -0.17) for k in 'abc'}
    occupied = []
    # hub: six faint petals around the heart + a ring of satellite nodes
    for i in range(6):
        a = 30 + 60 * i; u = (math.cos(math.radians(a)), math.sin(math.radians(a)))
        tip = (Hh[0] + u[0] * 84, Hh[1] + u[1] * 84)
        petal(s, (Hh[0] + u[0] * 30, Hh[1] + u[1] * 30), tip, (Hh[0] + rot(u, 22)[0] * 62, Hh[1] + rot(u, 22)[1] * 62), GOLD, True)
        s.dot((Hh[0] + u[0] * 60, Hh[1] + u[1] * 60), col, False, r=3.8)
    for k in 'abc':
        cv = cvs[k]; lit = st[k] == 'lit'
        s.curve(cv, col, lead[k] >= 4, w=3.0)
        spoke_nodes(s, cv, col, lead[k], 1.0, 26, 25)
        occupied += cv.pts
        d = (seal[k][0] - Hh[0], seal[k][1] - Hh[1]); L = math.hypot(*d); dv = (d[0] / L, d[1] / L)
        for sg in (-1, 1):
            # fork leaves the seal sideways then curls forward: a petal edge
            side = rot(dv, sg * 70); fwd = rot(dv, sg * 20)
            tip = (seal[k][0] + rot(dv, sg * 42)[0] * 132, seal[k][1] + rot(dv, sg * 42)[1] * 132)
            c1 = (seal[k][0] + side[0] * 78, seal[k][1] + side[1] * 78)
            c2 = (tip[0] - fwd[0] * 44, tip[1] - fwd[1] * 44)
            fc = Curve([seal[k], c1, c2, tip])
            petal(s, seal[k], tip, c1, col, lit)
            s.curve(fc, col, lit, w=2.4, ghost=not lit)
            fork_nodes(s, fc, col, lit, 1.0, 25, not lit)
            occupied += fc.pts
        for i in range(7):
            a = math.atan2(-dv[1], -dv[0]) + math.radians(-80 + 26.7 * i)
            p = (seal[k][0] + 41 * math.cos(a), seal[k][1] + 41 * math.sin(a))
            s.dot(p, col, lit, r=3.2)
    ghosts = []; tries = 0
    while len(ghosts) < 64 and tries < 6000:
        tries += 1
        p = (rnd.uniform(70, 1210), rnd.uniform(96, 690))
        if any(math.dist(p, q) < 50 for q in occupied[::2]): continue
        if any(math.dist(p, q) < 52 for q in ghosts): continue
        if math.dist(p, Hh) < 118: continue
        ghosts.append(p)
    for i, p in enumerate(ghosts):
        for q in [q for q in ghosts if q is not p and math.dist(p, q) < 90][:1]:
            s.lines.append(f'<line x1="{p[0]:.1f}" y1="{p[1]:.1f}" x2="{q[0]:.1f}" y2="{q[1]:.1f}" stroke="{DIM}" stroke-opacity=".3" stroke-width="1"/>')
        if i % 6 == 0: s.dia(p, col, False, r=4.0)
        else: s.nodes.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="2.8" fill="#26304a" stroke="{DIM}" stroke-width="1" opacity=".75"/>')
    s.med(Hh, 27, 'wolf', col)
    for k in 'abc': s.med(seal[k], 25, SEALS_WOLF[k], col, lit=st[k] == 'lit', veiled=st[k] == 'veiled')
    s.cap((Hh[0], Hh[1] + 100), 'HEART', GOLD, 11.5)
    s.cap((seal['a'][0] - 10, seal['a'][1] + 60), 'Howling Legion', GOLD, 13); s.cap((seal['b'][0] + 10, seal['b'][1] + 60), 'Lightfoot Pack (lit)', GOLD, 13)
    s.cap((seal['c'][0] + 78, seal['c'][1] - 2), '?  veiled seal', '#aebbd8', 13, 'start')
    s.label((640, 710), 'Dim texture dots are decoration, not nodes (no ids, no cost); real nodes stay connected, forks stay leaves.', 12, '#b9c5e4', 'middle', 600)
    return s.html('B2 shape 3')


# ---------------- WHOLE WEB (recommended: emblem skeleton for all five) ----------------
def whole():
    s = S()
    s.label((28, 40), 'Restore the Hollow  -  MID zoom, emblem-skeleton constellations', 20, GOLD, 'start', 700)
    s.label((28, 62), 'Wolf head, raven wings, star, zigzag, rings. Illustrative; veiled seals show no forks; cream threads are visual cross-links.', 12, '#b9c5e4', 'start', 500)
    hub = (640, 392)
    place = [('raven', (640, 196), 1.05, dict(a='lit', b='veiled', c='veiled'), dict(a=4, b=2, c=0)),
             ('wolf', (262, 318), 1.16, dict(a='lit', b='lit', c='veiled'), dict(a=4, b=4, c=2)),
             ('bolt', (1018, 318), 1.0, dict(a='lit', b='veiled', c='veiled'), dict(a=4, b=3, c=0)),
             ('orbit', (402, 594), 1.04, dict(a='lit', b='lit', c='veiled'), dict(a=4, b=4, c=1)),
             ('chain', (878, 594), 1.12, dict(a='lit', b='veiled', c='veiled'), dict(a=4, b=1, c=0))]
    ns = 0.62
    res = {}
    for key, C, sc, st, ld in place:
        emb = EMB[key]
        res[key] = skeleton(s, emb, C, sc, ns, st, ld, seal_kinds=SEALS_WOLF if key == 'wolf' else None, bow=0.18, fbow=0.2)
        bottom = {'raven': 74, 'wolf': 118, 'bolt': 122, 'orbit': 118, 'chain': 70}[key]
        s.cap((C[0], C[1] + bottom * sc + 18), emb['name'], GOLD, 12.5)
    # hub and hub-to-heart threads (4 dots each)
    for key, C, sc, st, ld in place:
        Hh = res[key]['heart']
        cv = Curve([hub, bowed(hub, Hh, (640, 392), 0.07), Hh])
        s.curve(cv, '#d9c9a0', True, w=1.5, glow=False)
        for i in range(1, 5):
            f = cv.at(cv.L * (0.12 + 0.16 * i)) if False else cv.at(48 + (cv.L - 48 - 36) * i / 5)
            s.dot(f, '#cfe4ff', True, r=3.4)
    s.med(hub, 30, 'lantern', GOLD)
    s.cap((hub[0], hub[1] + 46), 'Lantern', GOLD, 11.5)
    # cross-link threads between neighbouring constellations (nearest seal pairs)
    ring_order = ['raven', 'bolt', 'chain', 'orbit', 'wolf']
    for i, a in enumerate(ring_order):
        b = ring_order[(i + 1) % 5]
        best = min(((math.dist(pa, pb), pa, pb) for pa in res[a]['seals'].values() for pb in res[b]['seals'].values()), key=lambda t: t[0])
        s.thread(best[1], best[2], hub, 0.25, 0.5, 1.2)
        bl = min(((math.dist(pa, pb), pa, pb) for pa in (v[3] for v in res[a]['lead'].values()) for pb in (v[3] for v in res[b]['lead'].values())), key=lambda t: t[0])
        s.thread(bl[1], bl[2], hub, 0.3, 0.3, 1.0)
    # heroes at the sides (connected into the web by a short dot chain)
    for nm, kind, pos, tgt in (('Wren', 'lantern', (70, 520), res['orbit']['seals']['a']), ('Elias', 'orbit', (1210, 520), res['chain']['seals']['b'])):
        s.med(pos, 20, kind, GOLD); s.cap((pos[0], pos[1] + 36), nm + ' (hero)', '#ffe6b0', 11)
        cv = Curve([pos, bowed(pos, tgt, hub, 0.1), tgt]); s.curve(cv, CREAM, False, w=1.6)
        for i in range(1, 4): s.dot(cv.at(26 + (cv.L - 60) * i / 4), CREAM, False, r=3.8)
    b1.legend  # (legend omitted: keeps the MID picture clean)
    s.label((28, 700), 'Gold ring = heart or seal; blue/purple/orange glow = weapon colour; faint silhouette = the weapon emblem the nodes follow.', 12, '#b9c5e4', 'start', 500)
    return s.html('B2 whole web', rings=True)


if __name__ == '__main__':
    for n, f in [('B2-wolves-shape-1', shape1), ('B2-wolves-shape-2', shape2), ('B2-wolves-shape-3', shape3), ('B2-whole-web-shapes', whole)]:
        open(os.path.join(D, n + '.html'), 'w', encoding='utf-8').write(f())
    print('ok')
