# B1 branch-structure mockups. python B1-gen.py -> B1-*.html next to this file. Illustrative: names/numbers invented.
import math, os
D = os.path.dirname(os.path.abspath(__file__))
BLUE = '#9fd8ff'; GOLD = '#ffd27a'; DIM = '#4a5878'; INK = '#e9eefc'
W, H = 1280, 720


def pole(c, ang, r, e=(1.45, 0.8)):
    return (c[0] + e[0] * r * math.cos(math.radians(ang)), c[1] + e[1] * r * math.sin(math.radians(ang)))


def pol(c, ang, r):
    return (c[0] + r * math.cos(math.radians(ang)), c[1] + r * math.sin(math.radians(ang)))


class Sc:
    def __init__(s):
        s.lines = []; s.nodes = []; s.text = []

    def link(s, a, b, lit=True, ghost=False):
        col = BLUE if lit else DIM
        op = 0.9 if lit else 0.55
        dash = ' stroke-dasharray="3 5"' if ghost else ''
        s.lines.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{col}" stroke-opacity="{op}" stroke-width="{2.2 if lit else 1.6}"{dash}/>')

    def thread(s, a, b, bend=0.12, op=0.5):
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        cx, cy = mx - (b[1] - a[1]) * bend, my + (b[0] - a[0]) * bend
        s.lines.append(f'<path d="M{a[0]:.1f} {a[1]:.1f} Q{cx:.1f} {cy:.1f} {b[0]:.1f} {b[1]:.1f}" fill="none" stroke="#d9c9a0" stroke-opacity="{op}" stroke-width="1.1"/>')

    def dot(s, p, lit=True, r=6.5, ghost=False):
        if ghost:
            s.nodes.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{r}" fill="none" stroke="{DIM}" stroke-width="1.4" stroke-dasharray="2 3" opacity=".8"/>'); return
        if lit:
            s.nodes.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{r}" fill="{BLUE}" stroke="#eaf7ff" stroke-width="1.5" filter="url(#glow)"/>')
        else:
            s.nodes.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{r}" fill="#1c2438" stroke="{DIM}" stroke-width="1.6"/>')

    def dia(s, p, lit=True, r=8, ghost=False, gold=False):
        pts = f'{p[0]:.1f},{p[1]-r*1.4:.1f} {p[0]+r*1.4:.1f},{p[1]:.1f} {p[0]:.1f},{p[1]+r*1.4:.1f} {p[0]-r*1.4:.1f},{p[1]:.1f}'
        if ghost:
            s.nodes.append(f'<polygon points="{pts}" fill="none" stroke="{DIM}" stroke-width="1.4" stroke-dasharray="2 3" opacity=".8"/>'); return
        if lit:
            s.nodes.append(f'<polygon points="{pts}" fill="{GOLD if gold else "#cfeaff"}" stroke="#fff6dc" stroke-width="1.6" filter="url(#glow)"/><circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="3" fill="#1d2a44"/>')
        else:
            s.nodes.append(f'<polygon points="{pts}" fill="#1c2438" stroke="{DIM}" stroke-width="1.8"/><circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="2.6" fill="{DIM}"/>')

    def med(s, p, r, kind, lit=True, veiled=False):
        x, y = p
        ring = GOLD if lit else '#6b7898'
        if veiled:
            s.nodes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#141b2c" stroke="#8d9ab8" stroke-width="2.4" stroke-dasharray="5 4"/><text x="{x:.1f}" y="{y+r*.38:.1f}" font-size="{r*1.1:.0f}" text-anchor="middle" fill="#8d9ab8" font-family="Georgia,serif">?</text>'); return
        s.nodes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r+5}" fill="{BLUE}" opacity="{.28 if lit else 0}" filter="url(#glow)"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#16213a" stroke="{ring}" stroke-width="{3 if r>20 else 2.2}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{max(r-5,2)}" fill="none" stroke="{ring}" stroke-opacity=".4" stroke-width="1"/>')
        s.nodes.append(GLYPH[kind](x, y, r * 0.62, BLUE if lit else '#7a88a8'))

    def label(s, p, t, size=12, col=INK, anchor='middle', w=500):
        for i, line in enumerate(t.split('\n')):
            s.text.append(f'<text x="{p[0]:.1f}" y="{p[1]+i*(size+3):.1f}" font-size="{size}" fill="{col}" text-anchor="{anchor}" font-weight="{w}" stroke="#0a0f1c" stroke-width="3" paint-order="stroke">{line}</text>')

    def cap(s, p, t, col=GOLD, size=12.5, anchor='middle'):
        s.label(p, t, size, col, anchor, 700)


def wolf(x, y, r, c):
    return (f'<path d="M{x-r*.8:.1f} {y-r*.1:.1f} L{x-r*.75:.1f} {y-r*1.1:.1f} L{x-r*.25:.1f} {y-r*.55:.1f} Q{x:.1f} {y-r*.65:.1f} {x+r*.25:.1f} {y-r*.55:.1f} L{x+r*.75:.1f} {y-r*1.1:.1f} L{x+r*.8:.1f} {y-r*.1:.1f} Q{x+r*.7:.1f} {y+r*.7:.1f} {x:.1f} {y+r:.1f} Q{x-r*.7:.1f} {y+r*.7:.1f} {x-r*.8:.1f} {y-r*.1:.1f}Z" fill="{c}"/>'
            f'<circle cx="{x-r*.32:.1f}" cy="{y+r*.05:.1f}" r="{r*.1:.1f}" fill="#16213a"/><circle cx="{x+r*.32:.1f}" cy="{y+r*.05:.1f}" r="{r*.1:.1f}" fill="#16213a"/><path d="M{x-r*.12:.1f} {y+r*.5:.1f} h{r*.24:.1f} l{-r*.12:.1f} {r*.14:.1f}Z" fill="#16213a"/>')


def legion(x, y, r, c):
    s = ''.join(f'<circle cx="{x+dx*r:.1f}" cy="{y+dy*r:.1f}" r="{r*.26:.1f}" fill="{c}"/>' for dx, dy in [(-.55, .35), (.55, .35), (0, -.5)])
    return s + f'<path d="M{x-r:.1f} {y+r*.9:.1f} Q{x:.1f} {y+r*1.35:.1f} {x+r:.1f} {y+r*.9:.1f}" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round"/>'


def paw(x, y, r, c):
    s = f'<ellipse cx="{x:.1f}" cy="{y+r*.3:.1f}" rx="{r*.5:.1f}" ry="{r*.42:.1f}" fill="{c}"/>'
    s += ''.join(f'<circle cx="{x+dx*r:.1f}" cy="{y+dy*r:.1f}" r="{r*.17:.1f}" fill="{c}"/>' for dx, dy in [(-.6, -.12), (-.22, -.55), (.22, -.55), (.6, -.12)])
    return s + f'<path d="M{x-r*1.05:.1f} {y+r*.95:.1f} L{x-r*.2:.1f} {y+r*.7:.1f} M{x-r*.7:.1f} {y+r*1.15:.1f} L{x+r*.1:.1f} {y+r*.9:.1f}" stroke="{c}" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>'


def alpha(x, y, r, c):
    return (f'<path d="M{x-r*.9:.1f} {y-r*.7:.1f} L{x-r*.2:.1f} {y-r*.7:.1f} L{x-r*.55:.1f} {y+r*.9:.1f}Z" fill="{c}"/><path d="M{x+r*.9:.1f} {y-r*.7:.1f} L{x+r*.2:.1f} {y-r*.7:.1f} L{x+r*.55:.1f} {y+r*.9:.1f}Z" fill="{c}"/>'
            f'<path d="M{x-r*.35:.1f} {y-r*1.0:.1f} L{x:.1f} {y-r*1.35:.1f} L{x+r*.35:.1f} {y-r*1.0:.1f}" fill="none" stroke="{c}" stroke-width="2"/>')


def raven(x, y, r, c):
    return f'<path d="M{x-r:.1f} {y:.1f} Q{x-r*.4:.1f} {y-r*.9:.1f} {x:.1f} {y:.1f} Q{x+r*.4:.1f} {y-r*.9:.1f} {x+r:.1f} {y:.1f} Q{x:.1f} {y+r*.9:.1f} {x-r:.1f} {y:.1f}Z" fill="{c}"/>'


def bolt(x, y, r, c):
    return f'<path d="M{x+r*.2:.1f} {y-r:.1f} L{x-r*.5:.1f} {y+r*.1:.1f} L{x:.1f} {y+r*.1:.1f} L{x-r*.2:.1f} {y+r:.1f} L{x+r*.55:.1f} {y-r*.15:.1f} L{x+r*.05:.1f} {y-r*.15:.1f}Z" fill="{c}"/>'


def star(x, y, r, c):
    return ''.join(f'<path d="M{x:.1f} {y:.1f} L{x+r*math.cos(math.radians(a)):.1f} {y+r*math.sin(math.radians(a)):.1f}" stroke="{c}" stroke-width="2.2" stroke-linecap="round"/>' for a in range(0, 360, 45))


def orbit(x, y, r, c):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*.28:.1f}" fill="{c}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r*.85:.1f}" fill="none" stroke="{c}" stroke-width="2" stroke-dasharray="3 4"/>'


def lantern(x, y, r, c):
    return f'<rect x="{x-r*.45:.1f}" y="{y-r*.6:.1f}" width="{r*.9:.1f}" height="{r*1.25:.1f}" rx="3" fill="{GOLD}"/><path d="M{x:.1f} {y-r*.35:.1f} q{r*.22:.1f} {r*.3:.1f} 0 {r*.7:.1f} q{-r*.22:.1f} {-r*.4:.1f} 0 {-r*.7:.1f}" fill="#16213a"/>'


GLYPH = dict(wolf=wolf, legion=legion, paw=paw, alpha=alpha, raven=raven, bolt=bolt, star=star, orbit=orbit, lantern=lantern)


def page(body, title, rings=True):
    bricks = ''.join(f'<line x1="0" y1="{y}" x2="{W}" y2="{y}"/>' for y in range(0, H, 60))
    for ri, y in enumerate(range(0, H, 60)):
        for x in range((0 if ri % 2 else 60), W, 120):
            bricks += f'<line x1="{x}" y1="{y}" x2="{x}" y2="{y+60}"/>'
    rg = (f'<circle cx="640" cy="360" r="300" fill="none" stroke="{GOLD}" stroke-opacity=".10" stroke-width="2"/><circle cx="640" cy="360" r="215" fill="none" stroke="{GOLD}" stroke-opacity=".08" stroke-width="2" stroke-dasharray="4 10"/>') if rings else ''
    return f'''<!doctype html><meta charset="utf-8"><title>{title}</title>
<body style="margin:0;background:#0d1322;width:{W}px;height:{H}px;overflow:hidden;font-family:'Palatino Linotype',Georgia,serif">
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs><radialGradient id="bg" cx="50%" cy="48%" r="75%"><stop offset="0" stop-color="#2b3652"/><stop offset=".6" stop-color="#1a2338"/><stop offset="1" stop-color="#0a0f1c"/></radialGradient>
<radialGradient id="vg" cx="50%" cy="50%" r="70%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
<filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
<rect width="{W}" height="{H}" fill="url(#bg)"/><g stroke="#0b1120" stroke-opacity=".55" stroke-width="2">{bricks}</g>
{rg}{body}<rect width="{W}" height="{H}" fill="url(#vg)"/></svg>'''


def finish(sc):
    return ''.join(sc.lines) + ''.join(sc.nodes) + ''.join(sc.text)


def chain(sc, pts, lit_n, last_dia=True, start=None, golds=()):
    """link pts in order from start; first lit_n are lit; last may be a diamond."""
    prev = start
    for i, p in enumerate(pts):
        if prev is not None:
            sc.link(prev, p, i < lit_n)
        prev = p
    for i, p in enumerate(pts):
        if last_dia and i == len(pts) - 1:
            sc.dia(p, i < lit_n, gold=i in golds)
        else:
            sc.dot(p, i < lit_n)
    return pts[-1]


def follow(sc, seal, ang, lit, ghost=False, base=62, spread=36):
    a = pol(seal, ang - spread, base); b = pol(seal, ang + spread, base); d = pol(seal, ang, base + 46)
    for p in (a, b, d):
        sc.link(seal, p, lit and not ghost, ghost)
    sc.dot(a, lit, ghost=ghost); sc.dot(b, lit, ghost=ghost); sc.dia(d, lit, ghost=ghost)
    return a, b, d


def header(sc, title, sub):
    sc.label((28, 40), title, 24, GOLD, 'start', 700)
    sc.label((28, 64), sub, 13, '#b9c5e4', 'start', 500)


def legend(sc, x, y):
    sc.label((x, y), 'legend', 11, '#8d9ab8', 'start', 600)
    sc.dot((x + 8, y + 20)); sc.label((x + 22, y + 24), 'small dot = knot (+1-2%)', 11, INK, 'start')
    sc.dia((x + 8, y + 46)); sc.label((x + 24, y + 50), 'diamond = bead / choice (+3-4%)', 11, INK, 'start')
    sc.med((x + 8, y + 74), 9, 'wolf'); sc.label((x + 24, y + 78), 'medallion = heart / evolution seal', 11, INK, 'start')
    sc.dot((x + 8, y + 98), ghost=True); sc.label((x + 22, y + 102), 'dashed = hidden until the seal is lit', 11, INK, 'start')
    sc.label((x, y + 126), 'Illustrative: names and numbers invented.', 10.5, '#8d9ab8', 'start', 500)


# ================= OPTION A : three spokes, each seal forks =================
def forks(sc, seal, ang, lit, ghost, step=44, spread=40, ell=(1.45, 0.8), dot_r=6.5):
    """two forks out of a seal: 2 small dots then a small diamond each. returns list of end diamonds"""
    ends = []
    for sgn in (-1, 1):
        a = ang + sgn * spread
        r0 = 40 if step == 44 else step
        p1 = pole(seal, a, r0, ell); p2 = pole(seal, a, r0 + step, ell); p3 = pole(seal, a, r0 + 2 * step, ell)
        prev = seal
        for p in (p1, p2, p3):
            sc.link(prev, p, lit and not ghost, ghost); prev = p
        sc.dot(p1, lit, ghost=ghost, r=dot_r); sc.dot(p2, lit, ghost=ghost, r=dot_r); sc.dia(p3, lit, ghost=ghost, r=7 if dot_r > 5 else 5)
        ends.append(p3)
    return ends


def option_a():
    sc = Sc(); header(sc, 'Option A  -  Three spokes, each seal forks into two branches', 'Ghost Wolves, near zoom. Per spoke: 3 dots + diamond (lead-in) -> seal -> TWO forks of 2 dots + diamond, themed to that evolution.')
    c = (640, 345)
    sc.med(c, 40, 'wolf')
    sc.cap((640, 412), 'HEART: Ghost Wolves', GOLD, 11.5)
    spec = [
        dict(ang=205, kind='legion', lit=4, seal='lit', fol=True, name='Howling Legion', tag='zero-power landmark (free, starter evolution)', f1='fork 1: echo / pair flavour', f2='fork 2: status / utility'),
        dict(ang=335, kind='paw', lit=3, seal='veiled', fol=False, name='?  (veiled seal)', tag='lead-in neutral: no recipe hint', f1='', f2=''),
        dict(ang=90, kind='alpha', lit=1, seal='veiled', fol=False, name='?  (veiled seal)', tag='veiled until its condition is met', f1='', f2=''),
    ]
    for s in spec:
        rs = [64, 100, 136, 172]
        pts = [pole(c, s['ang'], r) for r in rs]
        chain(sc, pts, s['lit'], start=c)
        seal = pole(c, s['ang'], 224)
        sc.link(pts[-1], seal, s['lit'] >= 4 and s['seal'] == 'lit')
        sc.med(seal, 28, s['kind'], lit=s['seal'] == 'lit', veiled=s['seal'] == 'veiled')
        ends = forks(sc, seal, s['ang'], s['fol'], not s['fol'])
        right = math.cos(math.radians(s['ang'])) > .1; left = math.cos(math.radians(s['ang'])) < -.1
        m = pole(c, s['ang'], 118)
        if left:
            sc.label((m[0] - 6, m[1] + 30), 'lead-in: 3 dots + diamond', 11, BLUE, 'middle', 600)
            sc.cap((seal[0] - 80, seal[1] + 56), s['name'], GOLD, 13, 'middle')
            sc.label((seal[0] - 80, seal[1] + 72), s['tag'], 11, '#aebbd8', 'middle')
            sc.label((ends[0][0] - 10, ends[0][1] - 12), s['f1'], 10.5, '#ffe6b0', 'end')
            sc.label((ends[1][0] + 14, ends[1][1] - 16), s['f2'], 10.5, '#ffe6b0', 'start')
        elif right:
            sc.label((m[0] + 4, m[1] + 30), 'lead-in: 3 dots + diamond', 11, BLUE, 'middle', 600)
            sc.cap((seal[0] + 10, seal[1] + 50), s['name'], '#aebbd8', 13, 'middle')
            sc.label((seal[0] + 10, seal[1] + 66), s['tag'], 11, '#aebbd8', 'middle')
            sc.label((ends[1][0] + 10, ends[1][1] + 4), 'forks hidden until\nthe seal is lit', 10.5, '#aebbd8', 'start')
        else:
            sc.label((m[0] + 18, m[1] + 4), 'lead-in: 3 dots + diamond', 11, BLUE, 'start', 600)
            sc.cap((seal[0] - 44, seal[1] - 2), s['name'], '#aebbd8', 13, 'end')
            sc.label((seal[0] - 44, seal[1] + 14), s['tag'], 11, '#aebbd8', 'end')
            sc.label((ends[1][0] + 20, ends[1][1] - 4), 'forks hidden until\nthe seal is lit', 10.5, '#aebbd8', 'start')
    # cross-link threads to neighbouring constellations (visual only, start at lead-ins / seals, never at fork leaves)
    for a_, b_, t_, tp in [((413, 287), (560, 118), 'to Raven Flock', (566, 112)), ((935, 269), (1120, 150), 'to Spirit Bolts', (1126, 146)), ((818, 298), (1090, 470), 'to Chain Lightning', (1096, 474)), ((640, 524), (440, 690), 'to Holy Orbit', (432, 690))]:
        sc.thread(a_, b_); sc.label(tp, t_, 10.5, '#d9c9a0', 'start' if tp[0] > 600 else 'end' if tp[0] < 450 else 'start')
    sc.label((640, 90), 'woven threads join neighbours (visual only, no gating); forks are dead-end leaves', 11.5, '#d9c9a0', 'middle', 600)
    sc.cap((640, 710), '34 nodes per weapon (14 today + 20 new): 12 lead-in + 3 seals + 18 fork nodes + heart. Fork = 2 dots + diamond, both buyable.', '#b9c5e4', 12)
    legend(sc, 1010, 540)
    return page(finish(sc), 'B1 option A')


# ================= OPTION B : trunk then three seals =================
def option_b():
    sc = Sc(); header(sc, 'Option B  -  Shared trunk, three seals in a row', 'One trunk of 5 dots + diamond forks into three seals; each seal has its own follow-up cluster.')
    c = (170, 372)
    sc.med(c, 42, 'wolf'); sc.cap((c[0], 440), 'HEART', GOLD, 11.5)
    pts = [(c[0] + 80 + 50 * i, c[1]) for i in range(5)] + [(c[0] + 80 + 50 * 5, c[1])]
    last = chain(sc, pts, 6, start=c)
    sc.label((pts[2][0], pts[2][1] - 26), 'shared trunk: 5 dots + diamond (neutral)', 11.5, BLUE, 'middle', 600)
    seals = [((700, 170), 'legion', 'lit', 'Howling Legion', True), ((700, 372), 'paw', 'veiled', '?  (veiled seal)', False), ((700, 574), 'alpha', 'unlit', 'The Alpha', False)]
    for sp, kind, st, nm, fl in seals:
        mid = (last[0] + 70, sp[1])
        for t in (0.34, 0.67):
            q = (last[0] + (sp[0]-last[0])*t, last[1] + (sp[1]-last[1])*t); sc.dot(q, st != 'unlit' and (st=='lit'), r=5.5)
        sc.link(last, sp, st != 'unlit')
        sc.med(sp, 30, kind, lit=st == 'lit', veiled=st == 'veiled')
        a = (sp[0] + 80, sp[1] - 34); b = (sp[0] + 80, sp[1] + 34); d = (sp[0] + 150, sp[1])
        for p in (a, b, d): sc.link(sp, p, fl, not fl)
        sc.dot(a, fl, ghost=not fl); sc.dot(b, fl, ghost=not fl); sc.dia(d, fl, ghost=not fl)
        sc.cap((sp[0] - 8, sp[1] - 44), nm, GOLD if fl else '#aebbd8', 13)
    sc.label((870, 128), 'follow-ups (themed): echo / rend / pack', 11, '#ffe6b0', 'start')
    sc.label((870, 330), 'follow-ups appear after the seal is lit', 11, '#aebbd8', 'start')
    sc.label((870, 532), 'follow-ups (themed): jaw / rend / mark', 11, '#aebbd8', 'start')
    sc.cap((640, 700), '18 nodes (14 today + 4 new); 5 old nodes re-parented as follow-ups.  A 4th evolution needs a 4th fork slot.', '#b9c5e4', 12)
    legend(sc, 1010, 560)
    return page(finish(sc), 'B1 option B', rings=False)


# ================= OPTION C : ring and spokes =================
def option_c():
    sc = Sc(); header(sc, 'Option C  -  Ring and spokes', 'Heart in the middle, a ring of 6 dots, a spoke of 2 dots + diamond from every other ring dot to a seal, follow-ups beyond.')
    c = (640, 348)
    sc.med(c, 36, 'wolf'); sc.cap((640, 400), 'HEART', GOLD, 11)
    ring = [pol(c, 30 + 60 * k, 78) for k in range(6)]
    for k in range(6): sc.link(ring[k], ring[(k + 1) % 6], True)
    for p in ring: sc.link(c, p, True) if False else None
    for k in range(6): sc.dot(ring[k], True)
    sc.label((560, 440), 'ring of 6 dots (neutral)', 11, BLUE, 'end', 600)
    spokes = [(210, 'legion', 'lit', 'Howling Legion', True, 3), (330, 'paw', 'veiled', '?  (veiled seal)', False, 2), (90, 'alpha', 'unlit', 'The Alpha', False, 1)]
    for ang, kind, st, nm, fl, lit in spokes:
        root = pol(c, ang, 78)
        pts = [pole(c, ang, r) for r in (118, 158, 198)]
        last = chain(sc, pts, 3 if st == 'lit' else (2 if st == 'veiled' else 0), start=root)
        seal = pole(c, ang, 256)
        sc.link(last, seal, st == 'lit'); sc.med(seal, 29, kind, lit=st == 'lit', veiled=st == 'veiled')
        a, b, d = follow(sc, seal, ang, fl, ghost=not fl, base=58, spread=40)
        sx = -1 if math.cos(math.radians(ang)) < -.1 else 1
        sc.cap((seal[0] + sx * 48, seal[1] - 2) if ang != 90 else (seal[0] + 50, seal[1] - 2), nm, GOLD if fl else '#aebbd8', 13, 'end' if sx < 0 else 'start')
    sc.cap((640, 708), '27 nodes (14 today + 13 new).  Ring size is fixed at 6: a 4th spoke means re-laying the ring.', '#b9c5e4', 12)
    legend(sc, 1010, 560)
    return page(finish(sc), 'B1 option C')


# ================= WHOLE WEB (option A for all five) =================
def web():
    sc = Sc()
    sc.label((28, 40), 'Restore the Hollow  -  MID zoom, Option A branches on all five weapons', 20, GOLD, 'start', 700)
    sc.label((28, 62), 'Illustrative. Dim outer rows echo the reference: long quiet dot-rows far from the hub.', 12, '#b9c5e4', 'start', 500)
    hub = (640, 372)
    # outer dim rows (far region)
    for y in (125, 150, 595, 620):
        pts = [(60 + 41 * i, y) for i in range(30)]
        for a, b in zip(pts, pts[1:]): sc.link(a, b, False)
        for i, p in enumerate(pts): (sc.dia if i % 7 == 3 else sc.dot)(p, False, **({'r': 5} if i % 7 != 3 else {'r': 6}))
    sc.med(hub, 34, 'lantern')
    sc.cap((640, 424), 'Lantern', GOLD, 11)
    weapons = [('Ghost Wolves', 'wolf', 198), ('Raven Flock', 'raven', 270), ('Spirit Bolts', 'star', 342), ('Chain Lightning', 'bolt', 54), ('Holy Orbit', 'orbit', 126)]
    # pentagon: spoke from hub to each constellation heart
    for name, kind, a in weapons:
        h = pol(hub, a, 200)
        sc.link(hub, h, True)
        for r in (70, 100, 130, 160):
            sc.dot(pol(hub, a, r), True, r=4.5)
    for name, kind, a in weapons:
        h = pol(hub, a, 200)
        sc.med(h, 24, kind)
        sc.cap((h[0], h[1] + 41 if 20 < a < 160 else h[1] - 38), name, GOLD, 12)
        # three branches outward-ish: outward, outward+120.. keep inside canvas by using out+-70 and out
        for k, off in enumerate((-64, 0, 64)):
            ang = a + off
            lit = 4 if (name == 'Ghost Wolves' or (name == 'Holy Orbit' and k < 2)) else (2 if k == 1 else 0)
            rs = [24, 38, 52, 66]
            pts = [pol(h, ang, r) for r in rs]
            last = chain(sc, pts, lit, start=h) if False else None
            prev = h
            for i, p in enumerate(pts):
                sc.link(prev, p, i < lit); prev = p
            seal = pol(h, ang, 92)
            sc.link(prev, seal, lit >= 4)
            for i, p in enumerate(pts):
                (sc.dia if i == 3 else sc.dot)(p, i < lit, r=4.2) if i != 3 else sc.dia(p, i < lit, r=5.5)
            veil = (k != 0) and not (name == 'Ghost Wolves' and k == 1)
            sc.med(seal, 14, kind if not veil else 'wolf', lit=(lit >= 4 and not veil), veiled=veil and lit < 4 and k == 2 or (veil and lit < 4 and k == 1))
            if lit >= 4:
                forks(sc, seal, ang, True, False, step=15, spread=42, ell=(1, 1), dot_r=4.2)
    # woven cross-link threads between neighbouring constellations (visual only)
    seals = {}
    for name, kind, a in weapons:
        h = pol(hub, a, 200)
        seals[name] = [pol(h, a + off, 92) for off in (-64, 0, 64)]
    order = [w[0] for w in weapons]
    ring_order = ['Raven Flock', 'Spirit Bolts', 'Chain Lightning', 'Holy Orbit', 'Ghost Wolves']
    for i, nm in enumerate(ring_order):
        nx = ring_order[(i + 1) % 5]
        sc.thread(seals[nm][2], seals[nx][0], 0.18, 0.55)
        h1 = pol(hub, dict((w[0], w[2]) for w in weapons)[nm], 200); h2 = pol(hub, dict((w[0], w[2]) for w in weapons)[nx], 200)
        sc.thread(pol(hub, dict((w[0], w[2]) for w in weapons)[nm], 130), pol(hub, dict((w[0], w[2]) for w in weapons)[nx], 130), -0.2, 0.4)
    sc.thread((282, 360), seals['Ghost Wolves'][0], 0.1, 0.55); sc.thread((998, 360), seals['Chain Lightning'][1], -0.1, 0.55)
    sc.thread((183, 150), seals['Ghost Wolves'][2], 0.1, 0.4); sc.thread((1043, 150), seals['Spirit Bolts'][1], -0.1, 0.4)
    # heroes / chapters far corners (landmarks with their own short chains)
    for nm, kind, pos in [('Wren', 'lantern', (118, 360)), ('Elias', 'orbit', (1162, 360))]:
        sc.med(pos, 26, kind); sc.cap((pos[0], pos[1] + 44), nm + ' (hero)', '#ffe6b0', 11.5)
        for k in range(1, 4):
            p = (pos[0] + (62 + 34 * k) * (1 if pos[0] < 600 else -1), pos[1]); sc.link(pos if k == 1 else (pos[0] + (62 + 34 * (k - 1)) * (1 if pos[0] < 600 else -1), pos[1]), p, False); sc.dot(p, False, r=4.5)
    legend(sc, 1010, 590)
    sc.label((28, 700), 'Each constellation: heart, 3 spokes (lead-in 4 nodes -> seal -> 2 forks of 3). Gold-cream threads = woven cross-links (visual only). Forks are dead-end leaves; veiled seals show no forks.', 12, '#b9c5e4', 'start', 500)
    return page(finish(sc), 'B1 whole web', rings=True)


if __name__ == '__main__':
    for n, f in [('B1-wolves-option-a', option_a), ('B1-wolves-option-b', option_b), ('B1-wolves-option-c', option_c), ('B1-whole-web-with-branches', web)]:
        open(os.path.join(D, n + '.html'), 'w', encoding='utf-8').write(f())
    print('ok')
