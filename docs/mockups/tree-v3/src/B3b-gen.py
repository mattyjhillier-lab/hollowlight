# B3b: SCATTERED arrangement. Regions carry an `orbit` {tier, angle} (data, not coordinates); the generator places them.
# Full garden/skeleton regions = MAGIC weapons only (Holy Orbit, Spirit Bolts, Chain Lightning) + a reserved far slot for Dragonfire Meteor.
# Ghost Wolves and Raven Flock keep their small current clusters (companion-to-be) near their heroes.
# python B3b-gen.py -> B3-whole-web-garden.html, B3-full-tree-fit.html. Illustrative.
import importlib.util, math, os, random

D = os.path.dirname(os.path.abspath(__file__))
_s = importlib.util.spec_from_file_location('b3', os.path.join(D, 'B3-gen.py'))
b3 = importlib.util.module_from_spec(_s); _s.loader.exec_module(b3)
b2 = b3.b2
S, Curve, EMB, garden = b3.S, b3.Curve, b3.EMB, b3.garden
GOLD, DIM, CREAM = b3.GOLD, b3.DIM, b3.CREAM

# orbit table: region -> (tier, angle). Tier 1 near ... 5 far. Nearer tier = earlier landmark in the pacing cadence (Q7).
ORBIT = {'orbit': (1, 195), 'bolt': (1, 25), 'chain': (3, 140), 'meteor': (4, 330)}
STATES = {'orbit': (dict(a='lit', b='lit', c='veiled'), dict(a=4, b=4, c=2)),
          'bolt': (dict(a='lit', b='veiled', c='veiled'), dict(a=4, b=3, c=0)),
          'chain': (dict(a='lit', b='veiled', c='veiled'), dict(a=4, b=1, c=0))}
SC_FAR = {'orbit': .46, 'bolt': .44, 'chain': .52}


def path_to(s, a, b, dots, landmarks=0, col=CREAM, lit=True, bend=0.05, hub=None):
    cv = Curve([a, b2.bowed(a, b, hub or a, bend), b])
    s.curve(cv, col, lit, w=1.4, glow=False)
    for i in range(1, dots + 1): s.dot(cv.at(28 + (cv.L - 70) * i / (dots + 1)), '#cfe4ff' if lit else '#8d9ab8', lit, r=3.0)
    for j in range(landmarks): s.dia(cv.at(cv.L * (0.35 + 0.28 * j)), GOLD, lit, r=5)
    return cv


def mini_cluster(s, C, kind, col, name, size=1.0, lit_n=4):
    """the small current-style cluster for a companion-to-be (wolves, ravens): medallion, two short chains, one mastery diamond. No restructure."""
    r = 13 * size
    pts = []
    for side in (-1, 1):
        prev = C
        for i in range(1, 4):
            p = (C[0] + side * (26 + 20 * i) * size, C[1] + (14 * (i - 1) * (1 if side < 0 else -1)) * size)
            s.link = None
            s.lines.append(f'<line x1="{prev[0]:.1f}" y1="{prev[1]:.1f}" x2="{p[0]:.1f}" y2="{p[1]:.1f}" stroke="{col if len(pts) < lit_n else DIM}" stroke-opacity=".8" stroke-width="1.4"/>')
            s.dot(p, col, len(pts) < lit_n, r=3.8 * size); pts.append(p); prev = p
    top = (C[0], C[1] - 36 * size)
    s.lines.append(f'<line x1="{C[0]:.1f}" y1="{C[1]:.1f}" x2="{top[0]:.1f}" y2="{top[1]:.1f}" stroke="{col}" stroke-opacity=".8" stroke-width="1.4"/>')
    s.dia(top, col, True, r=5 * size)
    s.med(C, r, kind, col, lit=True)
    s.cap((C[0], C[1] + 34 * size), name, '#cfe4ff', 9.5)
    s.label((C[0], C[1] + 34 * size + 12), 'companion-to-be (small cluster)', 8.5, '#aebbd8', 'middle', 500)


def reserved(s, C, sc, name='Dragonfire Meteor', ns=0.34):
    """reserved far slot: a faint flame outline and a veiled seal; no nodes shown until the weapon exists."""
    flame = [(0, -112), (30, -52), (66, -20), (58, 40), (22, 100), (0, 112), (-22, 100), (-58, 40), (-66, -20), (-30, -52)]
    pts = [(C[0] + x * sc, C[1] + y * sc) for x, y in flame]
    s.back.append('<path d="M' + ' L'.join('%.1f %.1f' % p for p in pts) + 'Z" fill="#ff9a5a" fill-opacity=".04" stroke="#ff9a5a" stroke-opacity=".22" stroke-width="1.6" stroke-dasharray="2 7"/>')
    s.med(C, 13, 'bolt', '#ff9a5a', lit=False, veiled=True)
    s.cap((C[0], C[1] + 112 * sc + 14), name + ' (reserved)', '#c8a58c', 9.5)


def cross(s, res, hub, limit=330):
    keys = list(res)
    for i, a in enumerate(keys):
        for b in keys[i + 1:]:
            best = min(((math.dist(pa, pb), pa, pb) for pa in res[a]['seals'].values() for pb in res[b]['seals'].values()), key=lambda t: t[0])
            if best[0] < limit: s.thread(best[1], best[2], hub, 0.22, 0.5, 1.1)


# ---------------- whole web at MID zoom (scattered) ----------------
def whole():
    s = S()
    s.label((28, 36), 'Restore the Hollow  -  MID zoom, magic gardens', 20, GOLD, 'start', 700)
    s.label((28, 58), 'Holy Orbit and Spirit Bolts sit near the start, Chain Lightning farther out, Dragonfire Meteor reserved far away. Wolves and Ravens stay small beside their heroes.', 12, '#b9c5e4', 'start', 500)
    hub = (560, 404)
    place = {'orbit': ((300, 334), 1.1), 'bolt': ((830, 548), 1.0), 'chain': ((1120, 292), 1.12)}
    ns = 0.62; res = {}
    for key, (C, sc) in place.items():
        st, ld = STATES[key]
        res[key] = garden(s, EMB[key], C, sc, ns, st, ld, None, sil=0.07)
        bottom = {'bolt': 124, 'orbit': 118, 'chain': 70}[key]
        s.cap((C[0], C[1] + bottom * sc + 16), EMB[key]['name'], GOLD, 12.5)
    reserved(s, (1150, 610), 0.5)
    dots = {'orbit': 3, 'bolt': 3, 'chain': 8}; lm = {'orbit': 0, 'bolt': 0, 'chain': 2}
    for key in place: path_to(s, hub, res[key]['heart'], dots[key], lm[key], hub=hub)
    path_to(s, hub, (1150, 610), 10, 3, lit=False, hub=hub, col='#8d9ab8')
    s.med(hub, 30, 'lantern', GOLD); s.cap((hub[0] + 4, hub[1] + 46), 'Lantern', GOLD, 11.5)
    cross(s, res, hub, 520)
    # heroes with their companion-to-be clusters
    for nm, kind, pos, cl, ccol, cname in (('Wren', 'lantern', (70, 470), (190, 590), '#9fd8ff', 'Ghost Wolves'), ('Mara', 'star', (520, 130), (700, 150), '#b79cff', 'Raven Flock')):
        s.med(pos, 20, kind, GOLD); s.cap((pos[0], pos[1] - 32), nm + ' (hero)', '#ffe6b0', 11)
        cv = path_to(s, hub, pos, 5, 0, lit=False, hub=hub, col=CREAM, bend=-.06)
        mini_cluster(s, cl, 'wolf' if cname == 'Ghost Wolves' else 'raven', ccol, cname, 1.1)
        s.thread(pos, cl, hub, 0.1, 0.6, 1.2)
    s.label((28, 702), 'Gold ring = heart or seal. Glow colour = weapon. Faint silhouette = the emblem the nodes grow from. Distance = unlock order.', 12, '#b9c5e4', 'start', 500)
    return s.html('B3 whole web', rings=True)


# ---------------- the whole tree at FAR zoom (scattered) ----------------
def fulltree():
    s = S()
    CX, CY = 640, 384
    TIER = {0: 0, 1: 170, 2: 232, 3: 280, 4: 316, 5: 338}
    E = lambda r, a: (CX + 1.8 * r * math.cos(math.radians(a)), CY + r * math.sin(math.radians(a)))
    at = lambda tier, ang: E(TIER[tier], ang)

    def engr(p, t, rot_=0, size=10):
        s.text.append(f'<text x="{p[0]:.1f}" y="{p[1]:.1f}" font-size="{size}" fill="#9fb0d2" fill-opacity=".62" text-anchor="middle" letter-spacing="3" font-weight="700" stroke="#070b14" stroke-width="2.4" paint-order="stroke" transform="rotate({rot_:.1f} {p[0]:.1f} {p[1]:.1f})">{t}</text>')
    s.label((28, 36), 'The whole tree at FAR zoom', 20, GOLD, 'start', 700)
    s.label((28, 58), 'About 250 nodes at launch (about 320 with two more magic weapons). Regions scatter by orbit {tier, angle}; near = early. Illustrative.', 12, '#b9c5e4', 'start', 500)
    hub = (CX, CY)
    for r in (38, 78, 170, 232, 280, 316):
        s.back.append(f'<ellipse cx="{CX}" cy="{CY}" rx="{1.8*r:.1f}" ry="{r}" fill="none" stroke="{GOLD}" stroke-opacity="{.10 if r < 100 else .06}" stroke-width="1.5" stroke-dasharray="2 8"/>')
    for (x0, y0, dx) in ((40, 96, 1), (40, 640, 1), (1240, 96, -1), (1240, 640, -1)):
        for row in range(3):
            y = y0 + row * 26 * (1 if y0 < 300 else -1)
            pts = [(x0 + dx * (i * 24 + row * 10), y) for i in range(9)]
            for a, b in zip(pts, pts[1:]): s.lines.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="{DIM}" stroke-opacity=".4" stroke-width="1"/>')
            for i, p in enumerate(pts): (s.dia(p, '#8d9ab8', False, r=3.4) if i % 5 == 4 else s.dot(p, '#8d9ab8', False, r=2.4))

    def ring(r, n, lit_n, key_at=()):
        pts = [E(r, 360 / n * i - 90) for i in range(n)]
        s.lines.append('<path d="M' + ' L'.join('%.1f %.1f' % q for q in pts) + 'Z" fill="none" stroke="%s" stroke-opacity=".5" stroke-width="1"/>' % DIM)
        for i, p in enumerate(pts):
            if i in key_at: s.dia(p, GOLD, i < lit_n, r=3.4)
            else: s.dot(p, '#9fd8ff', i < lit_n, r=2.5)
        return pts
    hp = ring(38, 10, 7); wp = ring(78, 26, 15, key_at=(0, 7, 13, 20))
    for i in (4, 12, 21): s.dot(wp[i], '#8d9ab8', False, r=2.5, ghost=True)
    s.med(hub, 15, 'lantern', GOLD)
    res = {}
    for key in ('orbit', 'bolt', 'chain'):
        tier, ang = ORBIT[key]; C = at(tier, ang); st, ld = STATES[key]
        res[key] = garden(s, EMB[key], C, SC_FAR[key], 0.34, st, ld, None, sil=0.09)
        s.cap((C[0], C[1] + {'orbit': 62, 'bolt': -60, 'chain': 50}[key]), EMB[key]['name'] + f'  (tier {tier})', GOLD, 10)
    mt, ma = ORBIT['meteor']; MP = at(mt, ma); reserved(s, MP, .42)
    for key in ('orbit', 'bolt', 'chain'):
        tier = ORBIT[key][0]; path_to(s, hub, res[key]['heart'], {1: 3, 3: 6}[tier], tier - 1, hub=hub)
    path_to(s, hub, MP, 8, 3, lit=False, hub=hub, col='#8d9ab8')
    hero_pos = {}
    for nm, tier, a, kind, awake in (('Wren', 1, 300, 'lantern', True), ('Elias', 1, 112, 'orbit', True), ('Mara', 2, 255, 'star', False), ('Lucinda', 4, 168, 'star', False)):
        p = E(122, a) if tier == 1 else at(tier, a); hero_pos[nm] = p
        path_to(s, hub, p, 3 if tier == 1 else 7, 0 if tier == 1 else 1, lit=awake, hub=hub, bend=-0.05)
        s.med(p, 10.5, kind, GOLD, lit=awake); s.cap((p[0], p[1] - 18), nm + ' (hero)', '#ffe6b0', 9.5)
    # companion-to-be clusters beside their heroes (Wren's wolves, Mara's ravens): the small current look, no restructure
    mini_cluster(s, (hero_pos['Wren'][0] + 74, hero_pos['Wren'][1] - 40), 'wolf', '#9fd8ff', 'Ghost Wolves', 0.62)
    mini_cluster(s, (hero_pos['Mara'][0] - 72, hero_pos['Mara'][1] + 14), 'raven', '#b79cff', 'Raven Flock', 0.62)
    tool_pos = {}
    for nm, tier, a, kind in (('Almanac', 0, 252, 'lantern'), ('Wardrobe', 2, 175, 'raven'), ('Card fan', 2, 88, 'star'), ('Satchel', 2, 330, 'orbit')):
        p = E(118, a) if tier == 0 else at(tier, a); tool_pos[nm] = p
        s.curve(Curve([hub, b2.bowed(hub, p, hub, -0.04), p]), CREAM, False, w=0.9)
        for q in range(5):
            aa = math.radians(72 * q + 20); s.dot((p[0] + 19 * math.cos(aa), p[1] + 19 * math.sin(aa)), '#cfe4ff', q < 2, r=2.2)
        s.med(p, 8, kind, '#cfe4ff', lit=True); s.label((p[0], p[1] + 31), nm, 9, '#b9c5e4', 'middle', 600)
    s.label((hp[5][0] + 8, hp[5][1] + 18), 'Hearth key', 9, '#b9c5e4', 'start', 600)
    for nm, tier, a, lit in (('Twilight', 2, 350, True), ('Deep Dusk', 3, 60, False), ('Long Night', 4, 235, False)):
        p = at(tier, a); s.med(p, 11, 'orbit', '#b9c5ff', lit=lit)
        s.cap((p[0], p[1] + 26), nm, '#cdd8ff' if lit else '#8d9ab8', 9.5)
        path_to(s, hub, p, 4 + tier, 0, lit=lit, hub=hub, col='#b9c5ff', bend=.06)
    for nm, tier, a in (('Chapter 2 Hushbell', 5, 0), ('Chapter 3 Far Hollow', 5, 182), ('a future region', 5, 245)):
        p = at(tier, a); s.med(p, 12, 'bolt', '#9fb0d2', lit=False, veiled=True)
        s.label((p[0] + (14 if a == 0 else -14 if a == 182 else 0), p[1] + 28), nm, 9.5, '#8d9ab8', 'end' if a == 0 else 'start' if a == 182 else 'middle', 700)
        s.curve(Curve([hub, b2.bowed(hub, p, hub, 0.07), p]), DIM, False, w=1.1)
        d = (1 if a == 0 else -1 if a == 182 else 0); prev = p
        for k in range(1, 5):
            fp = (p[0] + d * k * 22, p[1]) if a != 245 else (p[0] - k * 10, p[1] - k * 16)
            s.lines.append(f'<line x1="{prev[0]:.1f}" y1="{prev[1]:.1f}" x2="{fp[0]:.1f}" y2="{fp[1]:.1f}" stroke="{DIM}" stroke-opacity=".4"/>'); s.dot(fp, '#8d9ab8', False, r=2.4); prev = fp
    cross(s, res, hub, 420)
    for key, nm in (('orbit', 'Wardrobe'), ('bolt', 'Satchel'), ('chain', 'Card fan')):
        s.thread(min(res[key]['seals'].values(), key=lambda q: math.dist(q, tool_pos[nm])), tool_pos[nm], hub, 0.15, 0.45, 1.0)
    for key, nm in (('orbit', 'Wren'), ('bolt', 'Elias'), ('chain', 'Lucinda')):
        s.thread(min(res[key]['seals'].values(), key=lambda q: math.dist(q, hero_pos[nm])), hero_pos[nm], hub, 0.15, 0.4, 1.0)
    engr(E(34, 232), 'HEARTH', 0, 8); engr((CX + 150, CY - 66), 'WICK', 0, 9)
    engr((CX - 440, CY - 170), 'NEAR MAGIC', -14, 10); engr((CX + 380, CY + 175), 'FAR MAGIC', 22, 10)
    engr((CX - 470, CY + 270), 'HEROES + NIGHTS', 0, 9); engr((CX + 470, CY - 255), 'COMPANIONS TO BE', 0, 9); engr((CX - 560, CY - 40), 'FAR HOLLOW', -80, 10)
    s.label((28, 702), 'Backbone = hub to each region; cream = woven cross-links (visual only). Gold diamonds on a path are landmarks on the way. Dim rows are future regions.', 12, '#b9c5e4', 'start', 500)
    return s.html('B3 full tree', rings=False)


if __name__ == '__main__':
    for n, f in [('B3-whole-web-garden', whole), ('B3-full-tree-fit', fulltree)]:
        open(os.path.join(D, n + '.html'), 'w', encoding='utf-8').write(f())
    print('ok')
