# C5: COMPLETE TREE MOCKUP v2. python C5-gen.py -> C5-*.html ; node C5-shot.mjs -> ../C5-*.png
# Combines R2 chrome (header, Next lights, banner), R3 carved-stone night + hero/companion panel, B3 gardens/skeletons, B3b scatter.
# Illustrative: names, costs, counts and conditions are invented; weapon colours are mockup colours (in-game colours differ, pending).
import importlib.util, math, os, random, re
D = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(D, 'R3-gen.py'), encoding='utf8').read().split('# ---------- scale / zoom board')[0])


def load(n, f):
    sp = importlib.util.spec_from_file_location(n, os.path.join(D, f))
    m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m


b3b = load('b3b', 'B3b-gen.py'); b3 = b3b.b3; b2 = b3.b2; b1 = b2.b1
Curve, woven_spoke, bowed, EMB = b2.Curve, b2.woven_spoke, b2.bowed, b2.EMB
GOLD, CREAM, INKC = '#ffd27a', '#d9c9a0', '#e9eefc'
GREY, GREYF = '#8392b8', '#27304e'
C_ORB, C_BOLT, C_CHAIN = '#ffd27a', '#ff9b52', '#5fe6df'
RC = {'orbit': C_ORB, 'bolt': C_BOLT, 'chain': C_CHAIN, 'wolf': '#9fd8ff', 'raven': '#b79cff'}

SIL_DEF = ('<filter id="sil" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0 0 0 0 .13  0 0 0 0 .16  0 0 0 0 .27  0 0 0 1 0"/></filter>'
           '<filter id="desat" x="0" y="0" width="100%" height="100%"><feColorMatrix type="saturate" values=".35"/></filter>'
           '<filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
           '<filter id="gls" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="2.6"/></filter>')
DEFS_C = DEFS3.replace('</defs>', SIL_DEF + '</defs>')

SZ = {
    'mid': dict(hr=28, sr=15, dr=3.3, qr=4.6, fr=3.1, fq=4.1, sat=2.2, nm=22, sb=14, coin=33, gl=1.0),
    'far': dict(hr=17, sr=9.5, dr=2.6, qr=3.7, fr=2.4, fq=3.2, sat=1.6, nm=17, sb=13, coin=17, gl=.8),
    'phone': dict(hr=25, sr=14, dr=3.4, qr=4.6, fr=3.2, fq=4.0, sat=2.2, nm=19, sb=13, coin=27, gl=.9),
}


class T(b2.S):
    def __init__(s):
        super().__init__(); s.glows = []; s.defs = []; s.n_id = 0; s.top = []; s.rects = []

    # ---- tiers: tiny dot / diamond ----
    def dot(s, p, col, lit=True, r=6.5, ghost=False, avail=False):
        x, y = p
        if ghost:
            s.nodes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="none" stroke="{GREY}" stroke-width="1.1" stroke-dasharray="2 3" opacity=".55"/>'); return
        if avail:
            s.glows.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*2.8:.1f}" fill="{GOLD}" opacity=".5" filter="url(#gls)"/>')
            s.nodes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*2.1:.1f}" fill="none" stroke="{GOLD}" stroke-width="1.4" opacity=".8"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#fff0c8" stroke="{GOLD}" stroke-width="{max(1.2, r/2.6):.1f}"/>'); return
        if lit:
            s.glows.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*2.3:.1f}" fill="{col}" opacity=".5" filter="url(#gls)"/>')
            s.nodes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#fff6e0" stroke="{col}" stroke-width="{max(1.2, r/2.4):.1f}"/>')
        else:
            s.nodes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{GREYF}" stroke="{GREY}" stroke-width="{max(1, r/3.2):.1f}" opacity=".95"/>')

    def dia(s, p, col, lit=True, r=8, ghost=False, avail=False):
        x, y = p; q = r * 1.4
        pts = f'{x:.1f},{y-q:.1f} {x+q:.1f},{y:.1f} {x:.1f},{y+q:.1f} {x-q:.1f},{y:.1f}'
        if ghost:
            s.nodes.append(f'<polygon points="{pts}" fill="none" stroke="{GREY}" stroke-width="1.1" stroke-dasharray="2 3" opacity=".55"/>'); return
        if avail:
            s.glows.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{q*2:.1f}" fill="{GOLD}" opacity=".55" filter="url(#gls)"/>')
            s.nodes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{q*1.65:.1f}" fill="none" stroke="{GOLD}" stroke-width="1.5" opacity=".85"/><polygon points="{pts}" fill="#5b4a38" stroke="{GOLD}" stroke-width="{max(1.3, r/3):.1f}" stroke-linejoin="round"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r*.38:.1f}" fill="{GOLD}"/>'); return
        if lit:
            s.glows.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{q*1.7:.1f}" fill="{col}" opacity=".5" filter="url(#gls)"/>')
            s.nodes.append(f'<polygon points="{pts}" fill="{col}" stroke="#fff3dc" stroke-width="{max(1.2, r/3.2):.1f}" stroke-linejoin="round"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r*.36:.1f}" fill="#fffbe8"/>')
        else:
            s.nodes.append(f'<polygon points="{pts}" fill="{GREYF}" stroke="{GREY}" stroke-width="{max(1.2, r/3.4):.1f}" stroke-linejoin="round"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r*.3:.1f}" fill="{GREY}" opacity=".8"/>')

    def path(s, P, col, lit=True, w=2.2, op=None, ghost=False, glow=True):
        if len(P) == 2: d = 'M%.1f %.1f L%.1f %.1f' % (*P[0], *P[1])
        else: d = 'M%.1f %.1f %s ' % (*P[0], 'Q' if len(P) == 3 else 'C') + ' '.join('%.1f %.1f' % p for p in P[1:])
        if ghost or not lit:
            s.lines.append(f'<path d="{d}" fill="none" stroke="{GREY}" stroke-opacity="{.32 if ghost else .55}" stroke-width="{max(1, w*.7):.1f}" stroke-linecap="round"{" stroke-dasharray=%s2 5%s" % (chr(34), chr(34)) if ghost else ""}/>'); return
        if glow: s.lines.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-opacity=".22" stroke-width="{w*3.2:.1f}" stroke-linecap="round"/>')
        s.lines.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-opacity=".95" stroke-width="{w:.1f}" stroke-linecap="round"/>')

    def part(s, cv, d0, d1, col, w, glow=True):
        """lit portion of a curve between arc lengths d0..d1"""
        pts = [cv.at(d0 + (d1 - d0) * i / 24) for i in range(25)]
        d = 'M' + ' L'.join('%.1f %.1f' % p for p in pts)
        if glow: s.lines.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-opacity=".22" stroke-width="{w*3.2:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')
        s.lines.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-opacity=".95" stroke-width="{w:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')

    # ---- medallion: picture coin (gold-rimmed lantern glass) ----
    def med(s, p, r, kind, col, lit=True, veiled=False, state=None, prog=None, face=None, hot=False, pips=None):
        x, y = p
        st = state or ('veiled' if veiled else ('lit' if lit else 'dim'))
        if st == 'veiled':
            s.nodes.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#141b30" stroke="#8d9ab8" stroke-width="{max(1.6, r/10):.1f}" stroke-dasharray="5 4" opacity=".95"/><text x="{x:.1f}" y="{y+r*.36:.1f}" font-size="{max(13, r*1.05):.0f}" text-anchor="middle" fill="#a3b0cc" font-family="Georgia,serif">?</text>'); return
        s.n_id += 1; gid = f'cm{s.n_id}'
        bright = st in ('lit', 'avail')
        s.defs.append(f'<radialGradient id="{gid}" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="{col if st == "lit" else ("#8a6a3a" if st == "avail" else "#46507a")}" stop-opacity="{.62 if st == "lit" else (.55 if st == "avail" else 1)}"/><stop offset=".7" stop-color="#232c52"/><stop offset="1" stop-color="#171d3a"/></radialGradient>')
        ring = '#e6c27a' if bright else '#8d9bbd'
        rw = max(2.2, r / 8.5)
        if st == 'lit':
            s.glows.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*1.7:.1f}" fill="{col}" opacity=".42" filter="url(#gl2)"/>')
        if st == 'avail':
            s.glows.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*1.8:.1f}" fill="{GOLD}" opacity=".55" filter="url(#gl2)"/>')
        g = [f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r+r*.18:.1f}" fill="#0e1328" opacity=".75"/>',
             f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="url(#{gid})" stroke="{ring}" stroke-width="{rw:.1f}"/>']
        if bright: g.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r-rw-1.5:.1f}" fill="none" stroke="#fff3dc" stroke-opacity=".32" stroke-width="1.2"/>')
        fillc = col if st == 'lit' else ('#fff0c8' if st == 'avail' else '#a6b2d0')
        if face:
            d = r * 1.5
            filt = {'lit': '', 'dim': ' filter="url(#desat)" opacity=".8"', 'sil': ' filter="url(#sil)"'}.get(face[1], '')
            g.append(f'<g transform="translate({x-d/2:.1f},{y-d/2+r*.06:.1f})"{filt}>{face[0].replace("{s}", f"{d:.0f}")}</g>')
        elif kind in ('wolf', 'raven', 'bolt', 'chain', 'orbit', 'elias', 'lucinda', 'hush', 'dusk', 'night', 'gem'):
            g.append(f'<g transform="translate({x:.1f},{y:.1f}) scale({r/40*.95:.3f})" opacity="{1 if bright else .82}">{icon(kind, fillc)}</g>')
        elif kind == 'star':
            g.append(f'<g transform="translate({x:.1f},{y:.1f}) scale({r/40*.95:.3f})" opacity="{1 if bright else .82}">{icon("bolt", fillc)}</g>')
        elif kind == 'zap':
            g.append(f'<g transform="translate({x:.1f},{y:.1f}) scale({r/40*.95:.3f})" opacity="{1 if bright else .82}">{icon("chain", fillc)}</g>')
        elif kind == 'lantern':
            g.append(f'<g transform="translate({x:.1f},{y:.1f}) scale({r/40:.3f})">{b1.lantern(0, 0, 24, fillc)}</g>')
        else:
            g.append(b1.GLYPH.get(kind, b1.GLYPH['sigil'])(x, y, r * .6, fillc))
        if prog is not None:
            R = r + max(5, r * .26); C_ = 2 * math.pi * R
            g.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{R:.1f}" fill="none" stroke="#0e1328" stroke-opacity=".6" stroke-width="{max(3, r/7):.1f}"/>'
                     f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{R:.1f}" fill="none" stroke="{col}" stroke-width="{max(3, r/7):.1f}" stroke-linecap="round" stroke-dasharray="{C_*prog:.1f} {C_:.1f}" transform="rotate(-90 {x:.1f} {y:.1f})"/>')
        if pips:  # keepsake hunt: n of m pips around the coin
            have, tot = pips
            R = r + max(8, r * .36)
            for i in range(tot):
                a = math.radians(-90 + 360 / tot * i)
                px, py = x + R * math.cos(a), y + R * math.sin(a)
                if i < have:
                    s.glows.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="7" fill="{GOLD}" opacity=".6" filter="url(#gls)"/>')
                    g.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{max(3.2, r*.12):.1f}" fill="#fff0c8" stroke="{GOLD}" stroke-width="1.4"/>')
                else:
                    g.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{max(3.2, r*.12):.1f}" fill="#1a2140" stroke="{GREY}" stroke-width="1.3"/>')
        if st == 'avail':
            g.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r+r*.42:.1f}" fill="none" stroke="{GOLD}" stroke-width="{max(2, r/12):.1f}"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r+r*.66:.1f}" fill="none" stroke="{GOLD}" stroke-width="1.4" opacity=".5"/>')
        if hot:
            g.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r+r*.5:.1f}" fill="none" stroke="#fff3dc" stroke-width="3"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r+r*.74:.1f}" fill="none" stroke="{GOLD}" stroke-width="2" opacity=".7"/>')
        s.nodes.append(''.join(g))

    # ---- labels ----
    def nm(s, x, y, name, sub=None, col=GOLD, size=22, ssize=14, anchor='middle', dim=False, subcol=None):
        c = '#aeb9d6' if dim else '#fff3dc'
        w_ = max(len(name) * size * .5, (len(sub) * ssize * .5 if sub else 0)) + 10
        x0_ = x - w_ / 2 if anchor == 'middle' else (x if anchor == 'start' else x - w_)
        s.rects.append((x0_, y - size, x0_ + w_, y + (ssize + 8 if sub else 6)))
        s.text.append(f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" class="nm" font-size="{size}" fill="{c}">{name}</text>')
        if sub:
            s.text.append(f'<text x="{x:.1f}" y="{y+ssize+4:.1f}" text-anchor="{anchor}" class="sb" font-size="{ssize}" fill="{subcol or (col if not dim else "#98a6c6")}">{sub}</text>')

    def chip(s, p, txt, col=GOLD):
        w = len(txt) * 6.9 + 22
        s.top.append(f'<rect x="{p[0]-w/2:.1f}" y="{p[1]-11:.1f}" width="{w:.1f}" height="22" rx="11" fill="#12172c" fill-opacity=".94" stroke="{col}" stroke-width="1.6"/><text x="{p[0]:.1f}" y="{p[1]+4.6:.1f}" text-anchor="middle" class="sb" font-size="13" fill="#fff3dc" style="stroke:none">{txt}</text>')

    def sml(s, x, y, t, col='#cfe0ff', size=13, anchor='middle', w=700):
        s.text.append(f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" class="sb" font-size="{size}" fill="{col}">{t}</text>')

    def engr(s, p, t, rot_=0, size=13):
        s.text.append(f'<text x="{p[0]:.1f}" y="{p[1]:.1f}" font-size="{size}" fill="#a9b9dc" fill-opacity=".6" text-anchor="middle" letter-spacing="4" font-weight="700" stroke="#070b14" stroke-width="2.6" paint-order="stroke" transform="rotate({rot_:.1f} {p[0]:.1f} {p[1]:.1f})">{t}</text>')

    def svg(s):
        return '<defs>' + ''.join(s.defs) + '</defs>' + ''.join(s.back) + ''.join(s.glows) + ''.join(s.lines) + ''.join(s.nodes) + ''.join(s.text) + ''.join(s.top)


def u(a, b):
    d = (b[0] - a[0], b[1] - a[1]); l = math.hypot(*d) or 1
    return (d[0] / l, d[1] / l), l


def ad(a, v, k): return (a[0] + v[0] * k, a[1] + v[1] * k)


def seal_med(s, p, r, kind, col, st):
    """st in lit / avail / veiled / dim"""
    s.med(p, r, kind, col, state=st)


def garden2(s, emb, C, sc, P, heart='lit', seals=None, lead=None, forkl=None, sealk=None, rng=None, ghosts=0, sil=.07, awake=True):
    seals = seals or dict(a='veiled', b='veiled', c='veiled'); lead = lead or dict(a=0, b=0, c=0)
    forkl = forkl or {}; sealk = sealk or {}
    M = lambda p: (C[0] + p[0] * sc, C[1] + p[1] * sc)
    col = emb['col']; Hh = M(emb['heart'])
    hr, sr = P['hr'], P['sr']
    b2.back_shape(s, emb, M, sc, col if heart != 'dim' else GREY, fill=sil if heart != 'dim' else sil * .6)
    sk = {k: M(emb['sock'][k]) for k in 'abc'}
    sp = {}
    for k in 'abc':
        sgn = 1 if sk[k][0] < Hh[0] - 4 else (-1 if sk[k][0] > Hh[0] + 4 else 0)
        sp[k] = woven_spoke(Hh, sk[k], 0.11 * sgn) if sgn else Curve([Hh, ad(Hh, u(Hh, sk[k])[0], u(Hh, sk[k])[1] / 2), sk[k]])
    if heart != 'dim':
        sd = [u(Hh, sk[k])[0] for k in 'abc']
        for i in range(8):
            a = math.radians(22.5 + 45 * i); v = (math.cos(a), math.sin(a))
            if any(v[0] * d[0] + v[1] * d[1] > math.cos(math.radians(30)) for d in sd): continue
            tip = ad(Hh, v, hr * 2.4); c = ad(ad(Hh, v, hr * 1.4), (-v[1], v[0]), hr * .7)
            b3.petal_k(s, ad(Hh, v, hr * 1.05), tip, c, col if heart == 'lit' else GOLD, heart == 'lit', 1.0, .8)
    occ = []; info = dict(heart=Hh, seals=sk, lead={})
    for k in 'abc':
        cv = sp[k]; n = lead[k]; stt = seals[k]
        off = hr + 12 + P['qr']; margin = sr + 11 + P['qr']
        step = max((cv.L - off - margin) / 3.0, 8)
        s.curve(cv, col, False, w=2.2 * (P['dr'] / 3.8) ** .5)  # grey base path
        ds = [off + step * i for i in range(4)]
        if n > 0:
            full = n >= 4 and stt in ('lit',)
            end = cv.L - sr if full else (ds[min(n, 4) - 1])
            s.part(cv, hr * .8, end, col, 2.4 * (P['dr'] / 3.8) ** .5, glow=P['gl'] > .8)
        pos = []
        for i, d in enumerate(ds):
            p = cv.at(d); pos.append(p)
            if i < 3: s.dot(p, col, i < n, r=P['dr'], avail=(i == n and sealk.get(k) == 'next' and n < 4))
            else: s.dia(p, col, i < n, r=P['qr'], avail=(n == 3 and sealk.get(k) == 'next'))
        info['lead'][k] = pos; occ += cv.pts
        if stt == 'lit':
            av = [u(sk[k], Hh)[0]]
            for j, T_ in enumerate(emb['targ'][k]):
                Tp = M(T_); fc, pc = b3.fork_curve(sk[k], Tp, Hh)
                b3.petal_k(s, sk[k], Tp, pc, col, True, 1.0, .9)
                cnt = (forkl.get(k) or (3, 3))[j]
                a_ = sr + 9 + P['fr']; L = fc.L
                fd = [a_, a_ + (L - a_) * .5, L]
                s.curve(fc, col, False, w=1.9 * (P['dr'] / 3.8) ** .5)
                if cnt > 0: s.part(fc, sr * .6, fd[min(cnt, 3) - 1], col, 2.1 * (P['dr'] / 3.8) ** .5, glow=P['gl'] > .8)
                for i2, d in enumerate(fd):
                    p = fc.at(d)
                    if i2 < 2: s.dot(p, col, i2 < cnt, r=P['fr'], avail=(i2 == cnt and k in sealk.get('forknext', '')))
                    else: s.dia(p, col, i2 < cnt, r=P['fq'], avail=(i2 == cnt and k in sealk.get('forknext', '')))
                occ += fc.pts; av.append(u(sk[k], fc.at(30))[0])
            for i in range(9):  # satellites round the small hub
                a = math.radians(360 / 9 * i + 12); v = (math.cos(a), math.sin(a))
                if any(v[0] * d[0] + v[1] * d[1] > math.cos(math.radians(36)) for d in av): continue
                s.dot(ad(sk[k], v, sr * 1.7), col, True, r=P['sat'])
    if ghosts and rng:
        xs = [p[0] for p in occ]; ys = [p[1] for p in occ]
        x0, x1, y0, y1 = min(xs) - 40, max(xs) + 40, min(ys) - 40, max(ys) + 40
        g = []; tries = 0
        while len(g) < ghosts and tries < 3000:
            tries += 1
            p = (rng.uniform(x0, x1), rng.uniform(y0, y1))
            if any(math.dist(p, q) < 46 for q in occ[::2]) or any(math.dist(p, q) < 44 for q in g) or math.dist(p, Hh) < hr * 2.8: continue
            g.append(p)
        for i, p in enumerate(g):
            for q in [q for q in g if q is not p and math.dist(p, q) < 80][:1]:
                s.lines.append(f'<line x1="{p[0]:.1f}" y1="{p[1]:.1f}" x2="{q[0]:.1f}" y2="{q[1]:.1f}" stroke="{GREY}" stroke-opacity=".2" stroke-width="1"/>')
            if i % 6 == 0: s.dia(p, col, False, r=P['qr'] * .8)
            else: s.nodes.append(f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{P["dr"]*.7:.1f}" fill="#222b47" stroke="{GREY}" stroke-width="1" opacity=".6"/>')
    if heart == 'dim' and awake == 'starter':
        s.glows.append(f'<circle cx="{Hh[0]:.1f}" cy="{Hh[1]:.1f}" r="{hr*1.9:.1f}" fill="{GOLD}" opacity=".5" filter="url(#gl2)"/>')
    s.med(Hh, hr, emb['kind'], col, state=heart, prog=info.get('prog'))
    for k in 'abc':
        s.med(sk[k], sr, sealk.get('kind', 'sigil') if isinstance(sealk.get('kind'), str) else 'sigil', col, state=seals[k])
    return info


# ------------------------------------------------------------------ world
HUBW = (0, 0)
W_POS = dict(
    orbit=(-310, -50), bolt=(300, 95), chain=(900, -60), meteor=(880, 420),
    wren=(-520, 120), wolves=(-420, 255), mara=(-70, -235), ravens=(115, -262), elias=(-105, 195), lucinda=(-630, -320),
    almanac=(60, -150), wardrobe=(-630, -150), satchel=(640, 330), cardfan=(120, 330),
    twilight=(-130, 330), dusk=(-430, 385), longnight=(-640, 385),
    hush=(420, -212), far3=(700, -560), future=(-300, -650),
)


class Cam:
    def __init__(s, z, cam, S0): s.z, s.cam, s.S0 = z, cam, S0

    def __call__(s, k):
        w = W_POS[k] if isinstance(k, str) else k
        return (s.S0[0] + (w[0] - s.cam[0]) * s.z, s.S0[1] + (w[1] - s.cam[1]) * s.z)


def dotted_path(s, a, b, hub, n, lit_n, col, bend=.05, w=1.5, lm=0, lm_lit=0, dr=3.0, side=1):
    cv = Curve([a, bowed(a, b, hub, bend * side), b])
    s.curve(cv, CREAM, False, w=w)
    if lit_n > 0: s.part(cv, 0, cv.L * min(1, (lit_n + .6) / (n + 1)), col, w + .4, glow=False)
    for i in range(1, n + 1):
        d = 26 + (cv.L - 60) * i / (n + 1)
        s.dot(cv.at(d), col, i <= lit_n, r=dr)
    for j in range(lm):
        s.dia(cv.at(cv.L * (.34 + .27 * j)), GOLD, j < lm_lit, r=dr * 1.55)
    return cv


def scene(state, z, cam, S0, lod, vis=(262, 0, 1280, 720), hover=None, ctx='desk'):
    """state: 'first' or 'mid'. Returns (svg_string, sky landmarks dict, lit list)."""
    P = SZ[lod]; s = T(); C = Cam(z, cam, S0); rng = random.Random(5)
    first = state == 'first'
    far = lod == 'far'
    gk = {'mid': 1.0, 'far': 1.0, 'phone': 1.12}[lod]
    inview = lambda p, m=200: vis[0] - m < p[0] < vis[2] + m and vis[1] - m < p[1] < vis[3] + m
    hub = C(HUBW); lit_pts = [(hub[0], hub[1], '#ff9f45')]
    LMs = {}
    emb = {k: dict(EMB[k], col=RC[k]) for k in ('orbit', 'bolt', 'chain')}
    gsc = {'orbit': 1.45, 'bolt': 1.55, 'chain': 1.5}
    # ---- far fog regions + engraved names + dim dot rows (edges) ----
    far_rows = [((-1080, 300), 1, 1), ((-1080, 350), 1, 1), ((860, 560), -1, -1), ((900, 510), -1, -1), ((-860, -520), 1, 1), ((520, -560), 1, 1)] if far else [((-760, 380), 1, 1), ((520, 330), 1, 1), ((470, 395), 1, 1)]
    for (w0, dx, dy) in far_rows:
        p0 = C(w0)
        n = 9 if far else 8
        pts = [(p0[0] + dx * i * 26 * (1 if far else z * 1.0), p0[1] + (i % 2) * 0) for i in range(n)]
        for a_, b_ in zip(pts, pts[1:]): s.lines.append(f'<line x1="{a_[0]:.1f}" y1="{a_[1]:.1f}" x2="{b_[0]:.1f}" y2="{b_[1]:.1f}" stroke="{GREY}" stroke-opacity=".28" stroke-width="1"/>')
        for i, p in enumerate(pts):
            if inview(p, 0): (s.dia(p, GREY, False, r=P['qr'] * .6) if i % 4 == 3 else s.dot(p, GREY, False, r=P['dr'] * .7))
    if far:
        for (w0, nmx) in (((-1050, -120), 'FAR HOLLOW'), ((-300, -650), None)):
            pass
    # ---- hub, hearth ring ----
    hs = {'mid': .5, 'far': .24, 'phone': .46}[lod]
    ringr = {'mid': 62, 'far': 33, 'phone': 56}[lod]
    ring = [(hub[0] + ringr * math.cos(math.radians(360 / 10 * i - 90)), hub[1] + ringr * math.sin(math.radians(360 / 10 * i - 90))) for i in range(10)]
    lit_ring = 3 if first else 7
    s.lines.append('<path d="M' + ' L'.join('%.1f %.1f' % q for q in ring) + 'Z" fill="none" stroke="%s" stroke-opacity=".4" stroke-width="1.2"/>' % GREY)
    for i, p in enumerate(ring):
        if i in (3, 8): s.dia(p, GOLD, i < lit_ring, r=P['qr'] * .8, avail=(first and i == 3))
        else: s.dot(p, '#ffc766', i < lit_ring, r=P['dr'] * .85)
    # ---- regions ----
    regs = {}
    stt = dict(
        orbit=dict(heart='dim' if first else 'lit', seals=dict(a='veiled', b='veiled', c='veiled') if first else dict(a='lit', b='avail', c='veiled'),
                   lead=dict(a=0, b=0, c=0) if first else dict(a=4, b=4, c=2), forkl={'a': (3, 2)} if not first else {}, sealk={} if first else {'c': 'next', 'forknext': 'a'}),
        bolt=dict(heart='dim' if first else 'lit', seals=dict(a='veiled', b='veiled', c='veiled') if first else dict(a='lit', b='veiled', c='veiled'),
                  lead=dict(a=0, b=0, c=0) if first else dict(a=4, b=3, c=0), forkl={'a': (3, 1)} if not first else {}, sealk={'forknext': 'a'} if not first else {}),
        chain=dict(heart='dim' if first else 'avail', seals=dict(a='veiled', b='veiled', c='veiled'), lead=dict(a=0, b=0, c=0), forkl={}, sealk={}))
    ggl = 0
    names_off = dict(orbit=(0, 1.0), bolt=(0, 1.0), chain=(0, 1.0))
    for key in ('orbit', 'bolt', 'chain'):
        Cg = C(key); sc = gsc[key] * z * gk
        rad = 190 * sc
        if not inview(Cg, rad): continue
        st = stt[key]
        fp = 0 if not far else 0
        info = garden2(s, emb[key], Cg, sc, P, st['heart'], st['seals'], st['lead'], st['forkl'], st['sealk'], rng=rng, ghosts=ggl, sil=.07, awake=('starter' if (first and key == 'orbit') else st['heart'] != 'dim'))
        regs[key] = info
    # coloured light returning behind lit regions
    lit_glow = []
    if not first:
        for key, op in (('orbit', .16), ('bolt', .13)):
            if key in regs:
                cx_, cy_ = C(key); lit_pts.append((cx_, cy_, RC[key])); rr = 150 * gsc[key] * z
                s.back.insert(0, f'<ellipse cx="{cx_:.0f}" cy="{cy_:.0f}" rx="{rr:.0f}" ry="{rr*.8:.0f}" fill="{RC[key]}" opacity="{op}" filter="url(#bl60)" style="mix-blend-mode:screen"/>')
    else:
        cx_, cy_ = C('orbit'); lit_pts.append((cx_, cy_, C_ORB))
        s.back.insert(0, f'<ellipse cx="{cx_:.0f}" cy="{cy_:.0f}" rx="{130*z:.0f}" ry="{105*z:.0f}" fill="{C_ORB}" opacity=".10" filter="url(#bl60)" style="mix-blend-mode:screen"/>')
    # ---- landmark medallions: heroes, chapter, nights, tools ----
    cr = P['coin']; nmS, sbS = P['nm'], P['sb']

    def hero(key, nm_, face, sub, kind='lit', pips=None, state='dim', col=GOLD, below=1):
        p = C(key)
        if not inview(p, 120): return None
        s.med(p, cr, 'lantern', col, state=state, face=(face, kind), pips=pips)
        y0 = p[1] + cr + (nmS * .45 + 16 if pips else nmS * .45 + 8) + 2
        s.nm(p[0], y0 + nmS * .5, nm_, None if (far or (first and key != 'wren')) else sub, col=GOLD if state == 'lit' else '#c9d4ef', size=nmS * (.85 if far else .95), ssize=sbS, dim=state != 'lit')
        return p
    wren_p = hero('wren', 'Wren', HEAD_WREN, 'Hero awake', 'lit', None, 'lit')
    elias_p = hero('elias', 'Elias', HEAD_ELI, 'Keepsakes 0 of 5' if first else 'Keepsakes 3 of 5', 'dim', (0 if first else 3, 5), 'dim')
    mara_p = hero('mara', 'Mara', HEAD_WREN, 'Keepsakes 0 of 5' if first else 'Keepsakes 1 of 5', 'sil', (0 if first else 1, 5), 'dim')
    luc_p = hero('lucinda', 'Lucinda', HEAD_LUC, 'Keepsakes 0 of 5', 'sil', (0, 5), 'dim') if far else None
    if elias_p is None and far: pass
    # companion-to-be clusters
    def mini(key, base, kind, col, name, lit_n):
        p = C(key)
        if not inview(p, 160): return
        sz = {'mid': 1.15, 'far': .55, 'phone': 1.0}[lod]
        r = (14 if not far else 9) * sz * (1.25 if lod != 'far' else 1.45)
        pts = []
        for side in (-1, 1):
            prev = p
            for i in range(1, 4):
                q = (p[0] + side * (28 + 22 * i) * sz, p[1] + (14 * (i - 1) * (1 if side < 0 else -1)) * sz)
                col_on = col if len(pts) < lit_n else None
                s.curve(Curve([prev, q]), col, col_on is not None, w=1.8 * sz ** .5, glow=False)
                s.dot(q, col, col_on is not None, r=P['dr'] * .95); pts.append(q); prev = q
        top = (p[0], p[1] - 38 * sz)
        s.curve(Curve([p, top]), col, lit_n > 0, w=1.8 * sz ** .5, glow=False); s.dia(top, col, lit_n > 3, r=P['qr'] * .95)
        s.med(p, r, kind, col, state='lit' if lit_n > 0 else 'dim')
        if lit_n > 0:
            s.back.insert(0, f'<ellipse cx="{p[0]:.0f}" cy="{p[1]:.0f}" rx="{90*sz:.0f}" ry="{60*sz:.0f}" fill="{col}" opacity=".13" filter="url(#bl20)" style="mix-blend-mode:screen"/>')
            lit_pts.append((p[0], p[1], col))
        s.nm(p[0], p[1] + r + 20 * sz + (0 if far else 4), name, None if (first or far) else 'companion-to-be', size=nmS * .72, ssize=13, col=col, subcol='#a9b8d8', dim=lit_n == 0)
    mini('wolves', 0, 'wolf', RC['wolf'], 'Ghost Wolves', 0 if first else 5)
    mini('ravens', 0, 'raven', RC['raven'], 'Raven Flock', 0 if first else 2)
    # chapter gate + nights as medallions (display-ish landmarks)
    def landmark(key, kind, col, name, sub, st='dim', prog=None, r=None, hot=False, scale=1.0):
        p = C(key)
        if not inview(p, 120) or (lod != 'far' and p[1] > 628): return None
        r_ = (r or cr) * scale
        s.med(p, r_, kind, col, state=st, prog=prog, hot=hot)
        if st == 'dim' and kind in ('hush', 'dusk', 'night'): pass
        s.nm(p[0], p[1] + r_ + nmS * .5 + 14 + (6 if prog is not None else 0), name, sub, col=col, size=nmS * (.85 if far else 1), ssize=sbS, dim=(st == 'dim'))
        return p
    hush_p = landmark('hush', 'hush', '#d4ecff', 'Hushbell Hamlet', 'Chapter 2', 'dim', hot=(hover == 'hush'), scale=1.12)
    tw = landmark('twilight', 'dusk', '#9fb0ff', 'Twilight', 'Night awake' if not first else 'Night awake', 'lit' if not first else 'lit', scale=.95)
    dd = landmark('dusk', 'dusk', '#9fb0ff', 'Deep Dusk', 'Clear Ch.1 to wake', 'dim', scale=.95)
    ln = landmark('longnight', 'night', '#c9b8ff', 'Long Night', 'Hardest night', 'dim', scale=.95)
    f3 = landmark('far3', 'hush', '#9aa4c0', 'Chapter 3', 'Far Hollow', 'dim', scale=.9) if far else None
    # tools
    tools = {}
    for key, kind, nm_, st in (('almanac', 'lantern', 'Almanac', 'lit'), ('wardrobe', 'raven', 'Wardrobe', 'lit' if not first else 'dim'), ('satchel', 'orbit', 'Satchel', 'dim'), ('cardfan', 'star', 'Card fan', 'dim')):
        p = C(key)
        if not inview(p, 100) or (lod != 'far' and p[1] > 628): continue
        rr = cr * .62
        if far: rr = cr * .8
        s.med(p, rr, kind, '#cfe4ff', state='lit' if st == 'lit' else 'dim')
        for q in range(5):
            aa = math.radians(72 * q + 20); s.dot((p[0] + (rr + 11) * math.cos(aa), p[1] + (rr + 11) * math.sin(aa)), '#cfe4ff', q < (2 if st == 'lit' else 0), r=P['dr'] * .7)
        if not (far and key == 'almanac') and not (first and key in ('almanac', 'wardrobe', 'satchel', 'cardfan') and not far): s.nm(p[0], p[1] + rr + 30, nm_, None, size=nmS * .68 if not far else 14, col='#cfe4ff', dim=st != 'lit')
        tools[key] = p
    # reserved Dragonfire Meteor slot
    mp = C('meteor')
    if inview(mp, 120):
        sc_ = 0.5 * z * (1.0 if not far else 1.0)
        flame = [(0, -112), (30, -52), (66, -20), (58, 40), (22, 100), (0, 112), (-22, 100), (-58, 40), (-66, -20), (-30, -52)]
        fp_ = [(mp[0] + x_ * sc_ * 1.4, mp[1] + y_ * sc_ * 1.4) for x_, y_ in flame]
        s.back.append('<path d="M' + ' L'.join('%.1f %.1f' % q for q in fp_) + 'Z" fill="#ff9a5a" fill-opacity=".05" stroke="#ff9a5a" stroke-opacity=".3" stroke-width="1.6" stroke-dasharray="2 7"/>')
        s.med(mp, P['sr'] * 1.1, 'zap', '#ff9a5a', veiled=True)
        s.nm(mp[0], mp[1] + 112 * sc_ * 1.4 + 20, 'Dragonfire Meteor', 'reserved slot', size=nmS * .7, ssize=13, col='#c8a58c', dim=True)
    for key in ('orbit', 'bolt', 'chain'):
        if key not in regs: continue
        h = regs[key]['heart']
        stk = stt[key]['heart']
        if key == 'orbit': sub = 'Free first light' if first else '9 of 34 lit'
        elif key == 'bolt': sub = 'Wake: 500 gold' if first else '6 of 34 lit'
        else: sub = 'Wake: 1,200 gold' if not first else 'Far out'
        scn = gsc[key] * z * gk
        yoff = {'orbit': -(108 * scn + 26), 'bolt': 100 * scn + 8, 'chain': 70 * scn + 30}[key]
        if far: yoff = {'orbit': 82, 'bolt': -88, 'chain': 62}[key]
        if lod == 'phone': yoff = 108 * scn + 34
        s.nm(h[0], h[1] + yoff, emb[key]['name'], sub, col=RC[key] if stk == 'lit' else (GOLD if stk == 'avail' else '#9fb0d0'), size=nmS * (.82 if far else 1.05), ssize=sbS, dim=(stk == 'dim'), subcol=GOLD if stk in ('avail',) else None)
    # ---- backbone: every landmark is REACHED by a chain of lanterns; chains continue onward (spine) ----
    ra = {'mid': 70, 'far': 38, 'phone': 62}[lod]
    qd, dd_ = P['dr'] * .85, P['qr'] * .85
    chip_pos = []; diamonds = []; obst = []
    CHIPS = ('Holy Orbit', 'Spirit Bolts') if first else (('Chain Lightning',) if far else ('Chain Lightning', 'Hushbell Hamlet'))
    def heart_of(key): return regs[key]['heart'] if key in regs else C(key)
    def kinds(n): return ['d' if ((i + 1) % 4 == 0 or i == n - 1) else 'o' for i in range(n)]
    def chain_path(a, b, n, lit, col, bend=.05, ra_=0, rb_=0, w=1.6, nxt=True, name=None, chipf=None):
        cv = Curve([a, bowed(a, b, hub, bend), b])
        d0 = ra_ + 12; d1 = cv.L - rb_ - 12; st_ = (d1 - d0) / max(n - 1, 1)
        s.curve(cv, col, False, w=w)
        ks = kinds(n); pos = [cv.at(d0 + st_ * i) for i in range(n)]
        if lit > 0: s.part(cv, 0 if ra_ == 0 else max(0, ra_ - 8), (d0 + st_ * (lit - 1)) if lit < n else cv.L - rb_ + 4, col, w + .5, glow=False)
        for i, (k_, p_) in enumerate(zip(ks, pos)):
            av = nxt and i == lit and lit < n
            if k_ == 'o': s.dot(p_, col, i < lit, r=qd, avail=av)
            else:
                s.dia(p_, col, i < lit, r=dd_, avail=av)
                v, _ = u(cv.at(max(0, d0 + st_ * i - 6)), cv.at(d0 + st_ * i + 6)); diamonds.append((p_, (-v[1], v[0]), i < lit, col, w))
        if name and lit < n and name in CHIPS:
            fr_ = chipf or (.62 if ra_ else .5); m = cv.at(cv.L * fr_); v, _ = u(cv.at(cv.L * fr_ - 6), cv.at(cv.L * fr_ + 6)); nx_, ny_ = -v[1], v[0]
            if ny_ > 0: nx_, ny_ = -nx_, -ny_
            chip_pos.append(((m[0] + nx_ * 26, m[1] + ny_ * 26), f'{lit} of {n} to {name}'))
        return cv, pos
    HR = P['hr']; CR = cr
    if 'orbit' in regs: obst.append((C('orbit'), 175 * gsc['orbit'] * z * gk * .95))
    if 'bolt' in regs: obst.append((C('bolt'), 170 * gsc['bolt'] * z * gk * .95))
    if 'chain' in regs: obst.append((C('chain'), 150 * gsc['chain'] * z * gk))
    obst.append((hub, ra + 4))
    for k_ in ('wren', 'wolves', 'mara', 'ravens', 'elias', 'lucinda', 'almanac', 'wardrobe', 'satchel', 'cardfan', 'twilight', 'dusk', 'longnight', 'hush', 'far3', 'meteor'):
        obst.append((C(k_), (cr * 1.7) if k_ != 'wolves' and k_ != 'ravens' else cr * 2.8))
    chain_path(hub, heart_of('orbit'), 4, 0 if first else 4, C_ORB, .06, ra, HR, name='Holy Orbit' if first else None)
    chain_path(hub, heart_of('bolt'), 6, 0 if first else 6, C_BOLT, -.05, ra, HR, name='Spirit Bolts' if first else None)
    sp_a = HR + (150 * gsc['bolt'] * z * .62 if lod != 'far' else 40)
    chain_path(heart_of('bolt'), heart_of('chain'), 12, 0 if first else 5, C_CHAIN, -.14, sp_a, HR, name='Chain Lightning')
    chain_path(heart_of('chain'), mp, 8, 0, GREY, .1, HR, P['sr'] * 1.4, w=1.2)
    for key, p, nn, lit in (('wren', wren_p, 3, 3), ('elias', elias_p, 5, 0 if first else 1), ('mara', mara_p, 4, 0), ('lucinda', luc_p, 8, 0)):
        if p is not None: chain_path(hub, p, nn, lit, GOLD, -.05, ra, CR + 14, w=1.2)
    for key, p, nn in (('almanac', tools.get('almanac'), 2), ('satchel', tools.get('satchel'), 6), ('cardfan', tools.get('cardfan'), 4)):
        if p is not None: chain_path(hub, p, nn, 2 if key == 'almanac' else 0, '#cfe4ff', -.04, ra, CR * .62 + 18, w=1.1)
    wd = tools.get('wardrobe') if tools.get('wardrobe') is not None else C('wardrobe')
    chain_path(heart_of('orbit'), wd, 5, 0 if first else 3, '#cfe4ff', .08, HR + (150 * gsc['orbit'] * z * .62 if lod != 'far' else 36), CR * .62 + 18, w=1.1)
    if tw is not None: chain_path(hub, tw, 5, 5, '#b9c5ff', .08, ra, CR * .95, w=1.2, nxt=False)
    if dd is not None: chain_path(tw, dd, 6, 0 if first else 2, '#b9c5ff', .06, CR, CR, w=1.2, name='Deep Dusk')
    if ln is not None: chain_path(dd, ln, 7, 0, '#b9c5ff', .06, CR, CR, w=1.2, name='Long Night')
    if hush_p is not None:
        chain_path(hub, hush_p, 10, 0, GREY, .1, ra, CR * 1.12, w=1.2, name='Hushbell Hamlet', chipf=.55)
        if f3 is not None: chain_path(hush_p, f3, 8, 0, GREY, .06, CR * 1.12, CR * .9, w=1.1)
    for hk, ck in (('wren', 'wolves'), ('mara', 'ravens')):
        a_, b_ = C(hk), C(ck)
        if inview(a_, 60) and inview(b_, 60): s.thread(a_, b_, hub, .1, .6, 1.3)
    _q0 = (len(s.glows), len(s.lines), len(s.nodes))
    # ---- fullness: short clusters hanging off diamonds (3 dots / ring of 6 / hook), like the reference rhythm ----
    frng = random.Random(17); placed = []
    fs = {'mid': 17, 'far': 8.5, 'phone': 14}[lod]
    def free_spot(p, r):
        if any(rc[0] - r < p[0] < rc[2] + r and rc[1] - r < p[1] < rc[3] + r for rc in s.rects): return False
        return not any(math.dist(p, o[0]) < o[1] + r for o in obst) and not any(math.dist(p, q) < r + 6 for q in placed) and inview(p, -6) if lod != 'far' else (not any(math.dist(p, o[0]) < o[1] + r for o in obst) and not any(math.dist(p, q) < r + 4 for q in placed) and inview(p, -6))
    for idx, (dp, nrm, dlit, dcol, dw) in enumerate(diamonds):
        if not inview(dp, -10): continue
        sd = 1 if idx % 2 == 0 else -1
        typ = idx % 3
        lit_c = dlit and (idx % 4 != 1)
        ccol = dcol if dlit else GREY
        base = (dp[0] + nrm[0] * sd * fs * .55, dp[1] + nrm[1] * sd * fs * .55)
        if typ in (0, 1):
            ends = (dp[0] + nrm[0] * sd * fs * 3.6, dp[1] + nrm[1] * sd * fs * 3.6)
            if not free_spot(ends, fs * 1.2): continue
            pts = [(dp[0] + nrm[0] * sd * fs * (1.1 + 1.0 * j), dp[1] + nrm[1] * sd * fs * (1.1 + 1.0 * j)) for j in range(3)]
            s.curve(Curve([dp, pts[-1]]), dcol, lit_c, w=1.1, glow=False)
            for j, q in enumerate(pts):
                if typ == 1 and j == 2: s.dia(q, dcol, lit_c, r=P['dr'] * 1.1)
                else: s.dot(q, dcol, lit_c, r=P['dr'] * .8)
            placed.append(pts[1])
        else:  # ring of 6 dots hanging on a short stem
            ctr = (dp[0] + nrm[0] * sd * fs * 2.7, dp[1] + nrm[1] * sd * fs * 2.7)
            if not free_spot(ctr, fs * 1.9): continue
            s.curve(Curve([dp, (dp[0] + nrm[0] * sd * fs * 1.2, dp[1] + nrm[1] * sd * fs * 1.2)]), dcol, lit_c, w=1.1, glow=False)
            for j in range(6):
                a = math.radians(60 * j + 90 * sd)
                s.dot((ctr[0] + fs * .95 * math.cos(a), ctr[1] + fs * .95 * math.sin(a)), dcol, lit_c and j < 4, r=P['dr'] * .75)
            placed.append(ctr)
    # ---- fullness: islands (2 dots -> diamond -> cluster) that hang off the nearest diamond; nothing floats alone ----
    srcs = [(d[0], d[2], d[3]) for d in diamonds]
    for kk_, inf_ in regs.items():
        for lk_, lp_ in inf_['lead'].items():
            srcs.append((lp_[3], stt[kk_]['lead'][lk_] >= 4, RC[kk_]))
    for i_ in (3, 8): srcs.append((ring[i_], i_ < lit_ring, '#ffc766'))
    nisl = {'mid': 120, 'far': 90, 'phone': 40}[lod]
    tries = 0; isl = 0
    gap = fs * 1.0
    while isl < nisl and tries < 9000 and srcs:
        tries += 1
        q = (frng.uniform(vis[0] + 14, vis[2] - 14), frng.uniform(max(vis[1] + 14, 196 if lod != 'phone' else 246), vis[3] - 14))
        near = min(srcs, key=lambda sdp: math.dist(sdp[0], q))
        d_ = math.dist(near[0], q)
        if not (gap * 2.6 < d_ < gap * 5.0): continue
        if not free_spot(q, fs * 1.75): continue
        if q[1] > vis[3] - 96 and vis[2] > 800 and 470 < q[0] < 1150: continue
        isl += 1
        lit_i = near[1] and frng.random() < .55
        col_i = near[2] if near[1] else GREY
        v, _ = u(near[0], q)
        pa = [(near[0][0] + v[0] * d_ * f, near[0][1] + v[1] * d_ * f) for f in (.34, .67)]
        s.thread(near[0], q, hub, 0, 0, 1.0) if False else None
        s.curve(Curve([near[0], q]), col_i, lit_i, w=1.1, glow=False)
        for pp in pa: s.dot(pp, col_i, lit_i, r=P['dr'] * .8)
        s.dia(q, col_i, lit_i, r=P['qr'] * .9)
        nrm = (-v[1], v[0]); sd = 1 if isl % 2 else -1; typ = isl % 3
        placed.append(q)
        if typ == 0:
            pts = [(q[0] + v[0] * gap * (j + 1), q[1] + v[1] * gap * (j + 1)) for j in range(3)]
            s.curve(Curve([q, pts[-1]]), col_i, lit_i, w=1.1, glow=False)
            for pp in pts: s.dot(pp, col_i, lit_i and frng.random() < .7, r=P['dr'] * .8)
            placed.append(pts[1])
        elif typ == 1:
            ctr = (q[0] + v[0] * gap * 2.5, q[1] + v[1] * gap * 2.5)
            s.curve(Curve([q, (q[0] + v[0] * gap * 1.3, q[1] + v[1] * gap * 1.3)]), col_i, lit_i, w=1.1, glow=False)
            for j in range(6):
                a = math.radians(60 * j + 30)
                s.dot((ctr[0] + gap * .9 * math.cos(a), ctr[1] + gap * .9 * math.sin(a)), col_i, lit_i and j < 3, r=P['dr'] * .75)
            placed.append(ctr)
        else:
            for sg in (-1, 1):
                pts = [(q[0] + (v[0] * .6 + nrm[0] * sg * .8) * gap * (j + 1), q[1] + (v[1] * .6 + nrm[1] * sg * .8) * gap * (j + 1)) for j in range(2)]
                s.curve(Curve([q, pts[-1]]), col_i, lit_i, w=1.1, glow=False)
                for j, pp in enumerate(pts): (s.dia(pp, col_i, lit_i, r=P['dr'] * 1.2) if j == 1 and sg == 1 else s.dot(pp, col_i, lit_i, r=P['dr'] * .8))
            placed.append((q[0] + v[0] * gap, q[1] + v[1] * gap))
        srcs.append((q, lit_i, col_i))
    # ---- cobweb cross-links between diamonds of different chains (fine cream threads) ----
    nlink = 0
    for i, (p1, n1, l1, c1, _) in enumerate(diamonds):
        for (p2, n2, l2, c2, _) in diamonds[i + 1:]:
            d_ = math.dist(p1, p2)
            if 30 * (z if lod != 'far' else 1.2) < d_ < 150 * (z if lod != 'far' else .9) and inview(p1, -5) and inview(p2, -5) and (c1 != c2 or d_ > 70):
                s.thread(p1, p2, hub, .12, .5, .9); nlink += 1
                break
    # hearth spokes (reference sunburst): 3 dots, diamond, small cluster, between the region chains
    for i_ in range(10):
        ang = math.radians(36 * i_ - 90 + 18); v = (math.cos(ang), math.sin(ang))
        b0 = (hub[0] + v[0] * (ringr + 6), hub[1] + v[1] * (ringr + 6))
        pts = [(b0[0] + v[0] * fs * (1.0 + j), b0[1] + v[1] * fs * (1.0 + j)) for j in range(4)]
        endp = (b0[0] + v[0] * fs * 6, b0[1] + v[1] * fs * 6)
        if not free_spot(endp, fs * 1.5) or not free_spot(pts[1], fs): continue
        s.curve(Curve([b0, pts[-1]]), GOLD, i_ < lit_ring, w=1.0, glow=False)
        for j, pp in enumerate(pts): (s.dia(pp, '#ffc766', i_ < lit_ring, r=P['dr'] * 1.2) if j == 3 else s.dot(pp, '#ffc766', i_ < lit_ring, r=P['dr'] * .75))
        nrm_ = (-v[1], v[0])
        for sg in (-1, 1):
            hk = [(pts[3][0] + (v[0] * .5 + nrm_[0] * sg * .85) * fs * (j + 1), pts[3][1] + (v[1] * .5 + nrm_[1] * sg * .85) * fs * (j + 1)) for j in range(2)]
            s.curve(Curve([pts[3], hk[-1]]), GOLD, i_ < lit_ring, w=1.0, glow=False)
            for pp in hk: s.dot(pp, '#ffc766', i_ < lit_ring, r=P['dr'] * .7)
        placed.append(endp)
    _q1 = _q0
    for nm_, L_ in (('glows', s.glows), ('lines', s.lines), ('nodes', s.nodes)):
        i0 = _q0[('glows', 'lines', 'nodes').index(nm_)]
        seg = L_[i0:]; del L_[i0:]
        L_.append('<g opacity="%s">' % ('.62' if lod != 'far' else '.55') + ''.join(seg) + '</g>')
    # woven cross-links between regions
    if len(regs) > 1:
        keys = list(regs)
        for i, a in enumerate(keys):
            for b in keys[i + 1:]:
                best = min(((math.dist(pa, pb), pa, pb) for pa in regs[a]['seals'].values() for pb in regs[b]['seals'].values()), key=lambda t: t[0])
                if best[0] < 600 * z * (1 if not far else 1.6): s.thread(best[1], best[2], hub, .22, .5, 1.1)
    for (cp, ct) in chip_pos:
        if inview(cp, -20): s.chip(cp, ct)
    if first and lod == 'mid':
        rp = ring[3]; s.nm(rp[0] + 14, rp[1] + 36, 'Second Glance', '80 gold', col=GOLD, size=16, ssize=13, anchor='start', subcol='#ffd27a')
    # ---- engraved region names ----
    if far:
        s.engr(C((-170, -40)), 'NEAR MAGIC', -12, 13); s.engr(C((520, 330)), 'FAR MAGIC', 20, 13)
        s.engr(C((330, -470)), 'COMPANIONS TO BE', 0, 13)
        s.engr(C((-1130, 90)), 'FAR HOLLOW', -80, 13); pass
    else:
        s.engr((hub[0] - 4, hub[1] + 96), 'HEARTH', 0, 13)
    # hub last (on top)
    s.glows.append(f'<circle cx="{hub[0]:.0f}" cy="{hub[1]:.0f}" r="{150*hs*(1 if not far else 2.2):.0f}" fill="url(#hubg)"/>')
    s.nodes.append(lantern(hub[0], hub[1], hs))
    for key, p in (('wren', wren_p), ('elias', elias_p), ('mara', mara_p)): pass
    s.regs = regs; s.wren_p = wren_p
    s.pos = dict(hub=hub, hush=hush_p, orbit=C('orbit'), bolt=C('bolt'), regs=regs)
    return s, lit_pts, C


def set_sky(lit_pts, hub, lm):
    global HUB, LIT, LM
    HUB = (round(hub[0]), round(hub[1])); LIT = lit_pts; LM = lm


def desk_sky(s, lit_pts, C):
    lm = {}
    for k in ('orbit', 'bolt', 'chain', 'wren', 'elias', 'mara', 'hush', 'twilight'):
        p = C(k)
        lm[k] = (p[0], p[1], 'x', '#fff')
    set_sky([(x, y, c) for x, y, c in lit_pts], C(HUBW), lm)
    return sky_b().replace('<g opacity=".5" filter="url(#gl)">', '<g opacity=".28" filter="url(#gl)">') + '<rect y="160" width="1280" height="560" fill="#050816" opacity=".24"/>'


def pager(sky_svg, web_svg, over, w=1280, h=720, extra_css='', clipx=262, clipy=0):
    return (f'<!doctype html><html><head><meta charset="utf-8"><title>Wispwick tree mockup C5</title><style>{FONTS}{CSS}{CSS3}{extra_css}'
            '.note{position:absolute;left:274px;bottom:12px;width:250px;font-size:13px;line-height:16px;color:#9fb0d2;font-weight:600;text-shadow:0 1px 3px #000}</style></head><body>'
            f'<div class="scr" style="width:{w}px;height:{h}px"><svg class="abs" style="left:0;top:0" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{DEFS_C}{sky_svg}<clipPath id="wc"><rect x="{clipx}" y="{clipy}" width="{w}" height="{h}"/></clipPath><g clip-path="url(#wc)">{web_svg}</g></svg>{over}</div></body></html>')


NOTE = '<div class="note">Illustrative: names, costs, colours invented. In-game weapon colours differ (pending).</div>'


def hero_panel_c(gold, shards):
    h = hero_panel3()
    h = h.replace('1,860', gold).replace('>14</span>', f'>{shards}</span>')
    return h


NEXT_FIRST_C = ('<div class="next" style="left:540px;bottom:14px;width:650px;height:76px"><div class="hd">Next lights</div>'
                '<div class="card hot"><div class="t">Free first light</div><div class="s"><b>Free</b><span>Holy Orbit</span></div></div>'
                '<div class="card"><div class="t">Second Glance (reroll)</div><div class="s"><b>80 gold</b><span>you can light it</span></div></div>'
                '<div class="card"><div class="t">Spirit Bolts: 6 to go</div><div class="s"><b>~1,900 gold</b><span>next 60</span></div><div class="pb"><i style="width:3%"></i></div></div></div>')
NEXT_MID_C = ('<div class="next" style="left:540px;bottom:14px;width:650px;height:76px"><div class="hd">Next lights</div>'
              '<div class="card hot"><div class="t">Chain Lightning: 7 to go</div><div class="s"><b>~3,100 gold</b><span>next 220</span></div><div class="pb"><i style="width:42%"></i></div></div>'
              '<div class="card"><div class="t">Judgement Wheel seal</div><div class="s"><b>600 gold</b><span>31 / 40 husks</span></div><div class="pb"><i style="width:77%"></i></div></div>'
              '<div class="card"><div class="t">Hushbell: 10 to go</div><div class="s"><b>~2,600 gold</b><span>+ Treant 0/1</span></div><div class="pb"><i style="width:4%"></i></div></div></div>')


def desk(state, hover=None, zoom_far=False):
    first = state == 'first'
    if zoom_far:
        s, lit_pts, C = scene(state, .55, (200, -40), (771, 372), 'far')
    else:
        s, lit_pts, C = scene(state, .85, (30, 0), (771, 372), 'mid', hover=hover)
    sk = desk_sky(s, lit_pts, C)
    over = hero_panel_c('620' if first else '1,860', '0' if first else '14') + top_bar(0 if first else 47, '3 goals glowing' if first else '9 can light')
    over = over.replace('<div class="top">', '<div class="top" style="z-index:3">')
    over += NEXT_FIRST_C if first else NEXT_MID_C
    over += NOTE
    web = s.svg()
    # pointer to the off-screen chain goal (midgame)
    if not first and not zoom_far:
        web += ('<g transform="translate(1160,290)"><rect x="-6" y="-17" width="136" height="34" rx="17" fill="#12172c" fill-opacity=".94" stroke="#ffd27a" stroke-width="2"/>'
                '<circle cx="12" cy="0" r="6" fill="#5fe6df"/><text x="26" y="5" class="sb" font-size="14" fill="#fff3dc" style="stroke:none">Chain Lightning</text></g>'
                '<path d="M1282,290 l-8,-8 M1282,290 l-8,8" stroke="#ffd27a" stroke-width="2.5" stroke-linecap="round"/>')
    if first and not zoom_far:
        # "Second Glance" diamond label on the thread to Holy Orbit
        pass
    return pager(sk, web, over), s, C


def banner_view():
    html, s, C = desk('mid', hover='hush')
    hp = s.pos['hush']
    conn = f'<path d="M{hp[0]-40:.0f},{hp[1]+4:.0f} C{hp[0]-80:.0f},{hp[1]+30:.0f} {hp[0]-100:.0f},{hp[1]+60:.0f} {hp[0]-110:.0f},{hp[1]+78:.0f}" fill="none" stroke="#ffd27a" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>'
    cur = f'<path d="M{hp[0]+8:.0f},{hp[1]+10:.0f} l0,30 l8,-7 l6,15 l6,-3 l-6,-14 l11,0Z" fill="#fff" stroke="#10152c" stroke-width="2"/>'
    ban = (f'<div class="banner" style="left:{hp[0]-470:.0f}px;top:{hp[1]+78:.0f}px"><div class="rib">Chapter 2 - Hushbell Hamlet: gate<small>A snowbound village where a brass bell still rings.</small></div>'
           f'<div class="tile"><div class="bd"><svg width="54" height="54" viewBox="-30 -30 60 60">{enemy_glyph("treant")}</svg></div><div style="flex:1"><div class="c"><span>Defeat Elder Treant</span><b>0 / 1</b></div>'
           '<div class="p">Cursed Forest - on Deep Dusk</div><div class="pb"><i style="width:4%"></i></div><div class="g"><span>Path: 10 lanterns to go</span><b>~2,600 gold</b></div></div></div></div>')
    html = html.replace('</svg>{', '</svg>{') .replace('</div></body>', conn + cur + '</div></body>') if False else html
    html = html.replace('</svg><div class="hero3"', '</svg><div class="hero3"')
    # inject overlays: svg bits into the main svg, banner into overlay
    html = html.replace('</svg>', conn + cur + '</svg>', 1)
    html = html.replace('<div class="note">', ban + '<div class="note">', 1)
    return html


def phone():
    z = .78
    s, lit_pts, C = scene('first', z, (-175, 10), (195, 440), 'phone', vis=(0, 112, 390, 700), ctx='phone')
    set_sky([(x, y, c) for x, y, c in lit_pts], C(HUBW), {'orbit': (C('orbit')[0], C('orbit')[1], 'x', '#fff')})
    sky = sky_b()
    sky = f'<g transform="translate({195-1.25*HUB[0]*0 - 1.2*HUB[0]*0:.1f},0)">{sky}</g>'
    sk = (f'<g transform="translate({195 - 1.2*771:.1f},{440 - 1.2*372:.1f}) scale(1.2)">' + sky_b().replace('<rect width="1280" height="720" filter="url(#grain)"/>', '') + '</g>')
    css = '''.pt{position:absolute;left:0;right:0;top:0;height:112px;background:linear-gradient(180deg,rgba(14,18,36,.97),rgba(26,32,58,.9));border-bottom:1.5px solid rgba(230,194,122,.55);padding:10px 12px;display:flex;align-items:center;gap:12px;z-index:3}
.pt .face{width:76px;height:76px;border-radius:50%;overflow:hidden;border:3px solid #e6c27a;background:radial-gradient(circle,#ffd27a55,#1a2144);flex:none;position:relative}
.pt .wolf{position:absolute;left:-10px;bottom:-12px}
.pb2{position:absolute;left:0;right:0;bottom:0;padding:30px 12px 14px;background:linear-gradient(180deg,rgba(14,18,36,0),rgba(14,18,36,.97) 22%);z-index:3}
.row{display:flex;gap:8px;margin-top:8px}.row .btn{flex:1;height:46px;font-size:16px;border-radius:12px}
.nl{background:linear-gradient(180deg,rgba(46,58,92,.95),rgba(18,24,44,.96));border:1.5px solid rgba(255,210,122,.85);border-radius:14px;padding:8px 12px;display:flex;align-items:center;gap:10px;min-height:56px}
.sheet{width:44px;height:5px;border-radius:3px;background:rgba(255,255,255,.35);margin:0 auto 8px}
.zc{position:absolute;right:12px;top:162px;display:flex;flex-direction:column;gap:8px;z-index:3}.zc .pill{width:44px;height:44px;padding:0;justify-content:center;font-size:24px}
.hp{position:absolute;left:12px;top:162px;display:flex;flex-direction:column;gap:6px;z-index:3}'''
    head = WREN_ALONE.split('<!-- head -->')[1].split('<!-- lantern hand -->')[0]
    face = f'<svg width="76" height="76" viewBox="46 46 144 144">{head}</svg>'
    wolf = WOLF.format(w=40, h=36)
    over = (f'<div class="pt"><div class="face">{face}</div><div style="flex:1"><div class="disp" style="font-size:30px;line-height:1">Wren</div><div style="font-size:14px;font-weight:700;color:#ffd27a">Level 4 - with her spirit wolf</div>'
            '<div style="font-size:14px;color:#d6dcee;margin-top:2px">Hollow restored 0%</div></div><div class="btn play" style="height:50px;width:98px;font-size:24px">Play</div></div>'
            '<div class="abs" style="left:12px;top:122px;display:flex;gap:8px;z-index:3"><span class="pill" style="height:36px;font-size:15px"><i class="dot" style="background:radial-gradient(circle at 40% 35%,#fff2b8,#ffb84a)"></i>620</span><span class="pill" style="height:36px;font-size:15px"><i class="dot" style="background:radial-gradient(circle at 40% 35%,#e6dcff,#8f78e8)"></i>0</span></div>'
            '<div class="abs disp" style="right:12px;top:122px;font-size:22px;color:#ffd27a;line-height:36px;z-index:3;text-shadow:0 2px 8px #000">Restore the Hollow</div>'
            '<div class="zc"><span class="pill">+</span><span class="pill">-</span></div>'
            '<div class="pb2"><div class="sheet"></div><div class="disp" style="font-size:18px;color:#ffd27a;margin:0 0 6px 4px;line-height:1">Next lights</div>'
            '<div class="nl"><div style="flex:1"><div style="font-weight:700;font-size:16px">Free first light: Holy Orbit</div><div style="font-size:14px;color:#d6dcee"><b style="color:#ffd27a">Free</b> - then Second Glance 80 gold</div></div><div class="btn" style="height:44px;width:84px;font-size:16px;background:linear-gradient(180deg,#ffe9a8,#ffbf5c);color:#3a2410">Light</div></div>'
            '<div class="row"><div class="btn">Almanac</div><div class="btn">Goals <span style="margin-left:6px;background:#ffd27a;color:#3a2410;border-radius:99px;padding:0 8px;font-size:14px">3</span></div><div class="btn">Back</div></div></div>')
    # swap row as 44px targets (small, left under header)
    sw = '<div class="abs" style="left:12px;top:164px;z-index:3">' + heads_row('wren', True, 44).replace('gap:14px', 'gap:6px').replace('justify-content:center', 'justify-content:flex-start') + '</div>'
    over = over.replace('<div class="zc">', sw + '<div class="zc">')
    web = s.svg()
    # pointer to Spirit Bolts off the right edge
    web += ('<g transform="translate(246,520)"><rect x="0" y="-17" width="132" height="34" rx="17" fill="#12172c" fill-opacity=".94" stroke="#ffd27a" stroke-width="2"/>'
            '<circle cx="16" cy="0" r="6" fill="#ff9b52"/><text x="28" y="5" class="sb" font-size="14" fill="#fff3dc" style="stroke:none">Spirit Bolts</text></g><path d="M384,520 l-8,-8 M384,520 l-8,8" stroke="#ffd27a" stroke-width="2.5" stroke-linecap="round"/>')
    html = pager(sk, web, over, 390, 844, css, 0, 0)
    return html


if __name__ == '__main__':
    out = {}
    out['C5-first-open'] = desk('first')[0]
    out['C5-midgame'] = desk('mid')[0]
    out['C5-banner-hover'] = banner_view()
    out['C5-far-overview'] = desk('mid', zoom_far=True)[0]
    out['C5-phone-390x844'] = phone()
    for n, h in out.items():
        open(os.path.join(D, n + '.html'), 'w', encoding='utf-8').write(h)
    print('ok')
