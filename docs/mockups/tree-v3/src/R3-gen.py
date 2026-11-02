# Round 3 generator: python R3-gen.py -> R3-*.html ; node R3-shot.mjs -> PNGs. Reuses R2-gen.py (exec without its output loop).
import re, math, random, os
D = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(D, 'R2-gen.py'), encoding='utf8').read().split("for name, fn in [('R2-web")[0])

DEFS3 = DEFS.replace('stop-opacity=".95"', 'stop-opacity=".62"').replace('</defs>', '''<filter id="ml" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="20"/></filter>
<filter id="bl20" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="bl3"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="stone" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".035 .05" numOctaves="4" seed="9"/><feColorMatrix type="matrix" values="0 0 0 0 .6  0 0 0 0 .66  0 0 0 0 .85  0 0 0 .22 -.04"/></filter>
</defs>''')

def calm(w):
    """recede the web: softer thread/dot glows; medallion glows stay (landmarks are brightest)"""
    def f(s):
        if 'gl2' in s: return s
        k = .55 if s.startswith('<path') else .6
        return re.sub(r'opacity="([\d.]+)"', lambda m: 'opacity="%.2f"' % (float(m.group(1)) * k), s)
    w.gl = [f(s) for s in w.gl]
    w.th = [s if 'dasharray' in s else s.replace('stroke-linecap="round"/>', 'stroke-linecap="round" opacity=".8"/>') for s in w.th]

LIT = [(470, 440, COL['wolf']), (560, 185, COL['raven']), (940, 185, COL['bolt']), (790, 520, COL['orbit']), (1120, 470, COL['elias']), (335, 590, COL['dusk'])]

def pines(base, hmin, hmax, col, seed, gap, op=1.0, tiers=3):
    r = random.Random(seed); o = f'<g fill="{col}" opacity="{op}">'
    x = -30; items = []
    while x < 1320:
        th = r.uniform(hmin, hmax); tw = th * r.uniform(.34, .46)
        yb = base + 14 * math.sin(x / 190 + seed)
        d = ''
        for t in range(tiers):
            y0 = yb - th * t / tiers * .72; y1 = yb - th * (t + 1.15) / tiers * .78 - (th * .18 if t == tiers - 1 else 0)
            ww = tw * (1 - t * .26) / 2
            d += f'M{x-ww:.0f},{y0:.0f} L{x:.0f},{y1:.0f} L{x+ww:.0f},{y0:.0f}Z '
        items.append(d); x += gap * r.uniform(.6, 1.3)
    hill = 'M-20,720 L-20,%d ' % base + ' '.join(f'L{xx},{base + 12 * math.sin(xx / 190 + seed):.0f}' for xx in range(-20, 1340, 40)) + ' L1340,720Z'
    return o + f'<path d="{hill}"/>' + ''.join(f'<path d="{d}"/>' for d in items) + '</g>'

def bell_tower(x, y, col, op):
    return (f'<g transform="translate({x},{y})" opacity="{op}" fill="{col}"><path d="M-14,0 L-12,-96 L-18,-96 L0,-132 L18,-96 L12,-96 L14,0Z"/>'
            '<path d="M-12,-96 L12,-96 L12,-70 L-12,-70Z" fill="#0d1428" opacity=".6"/><path d="M-5,-92 q5,-9 10,0 l0,16 l-10,0Z" fill="#ffd27a" opacity=".55"/>'
            '<circle cx="0" cy="-136" r="3.4"/></g>')

def sky_a():
    r = random.Random(11)
    o = ('<defs><linearGradient id="skA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080c1c"/><stop offset=".45" stop-color="#141c3a"/>'
         '<stop offset=".78" stop-color="#2a3050"/><stop offset="1" stop-color="#3a3a54"/></linearGradient>'
         '<radialGradient id="moonA"><stop offset="0" stop-color="#e8f0ff" stop-opacity=".55"/><stop offset=".3" stop-color="#b9c8f0" stop-opacity=".22"/><stop offset="1" stop-color="#b9c8f0" stop-opacity="0"/></radialGradient>'
         '<radialGradient id="vigA" cx=".5" cy=".5" r=".75"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#03040a" stop-opacity=".8"/></radialGradient></defs>')
    o += '<rect width="1280" height="720" fill="url(#skA)"/>'
    for _ in range(90):
        o += f'<circle cx="{r.uniform(0,1280):.0f}" cy="{r.uniform(0,420):.0f}" r="{r.uniform(.5,1.4):.1f}" fill="#e9eeff" opacity="{r.uniform(.15,.5):.2f}"/>'
    o += '<circle cx="1010" cy="110" r="230" fill="url(#moonA)"/><circle cx="1010" cy="110" r="22" fill="#eef3ff" opacity=".55"/><circle cx="1010" cy="110" r="22" fill="#eef3ff" opacity=".4" filter="url(#bl3)"/>'
    o += pines(520, 60, 110, '#1e2745', 1, 17, .95, 2)
    o += bell_tower(1175, 560, '#1a2342', .8)
    o += '<ellipse cx="640" cy="545" rx="700" ry="26" fill="#9fb0d8" opacity=".16" filter="url(#ml)"/>'
    o += pines(575, 80, 140, '#161e38', 2, 22, 1, 3)
    o += '<ellipse cx="420" cy="590" rx="620" ry="28" fill="#aab8de" opacity=".14" filter="url(#ml)"/><ellipse cx="1000" cy="620" rx="420" ry="24" fill="#aab8de" opacity=".12" filter="url(#ml)"/>'
    o += pines(650, 110, 190, '#0b1021', 3, 30, 1, 3)
    o += '<ellipse cx="760" cy="700" rx="700" ry="22" fill="#8c9cc8" opacity=".14" filter="url(#ml)"/>'
    o += '<g style="mix-blend-mode:screen">'
    o += f'<ellipse cx="{HUB[0]}" cy="{HUB[1]}" rx="360" ry="250" fill="#ff9f45" opacity=".20" filter="url(#bl60)"/>'
    for (x, y, c) in LIT:
        o += f'<ellipse cx="{x}" cy="{y+40}" rx="190" ry="150" fill="{c}" opacity=".20" filter="url(#bl60)"/>'
    o += '</g>'
    o += '<rect width="1280" height="720" filter="url(#grain)"/><rect width="1280" height="720" fill="url(#vigA)"/>'
    return o

def rune(x, y, rot, a, col, sw, rr):
    k = rr.randint(0, 5)
    d = {0: f'M0,{-a} L0,{a} M0,{-a*.4} L{a*.7},{-a} M0,{a*.2} L{a*.7},{a*.8}',
         1: f'M{-a*.6},{-a} L{a*.6},{a} M{a*.6},{-a} L{-a*.6},{a}',
         2: f'M0,{-a} L{a*.7},0 L0,{a} L{-a*.7},0Z M0,{-a} L0,{a}',
         3: f'M{-a*.6},{-a} L{-a*.6},{a} M{-a*.6},0 L{a*.6},{-a*.6} M{-a*.6},0 L{a*.6},{a*.6}',
         4: f'M{-a*.6},{a} L0,{-a} L{a*.6},{a} M{-a*.4},{a*.2} L{a*.4},{a*.2}',
         5: f'M0,{-a} L0,{a*.3} M{-a*.6},{a*.3} A{a*.6},{a*.6} 0 0 0 {a*.6},{a*.3} M{-a*.5},{-a*.5} L{a*.5},{-a*.5}'}[k]
    return f'<path transform="translate({x:.1f},{y:.1f}) rotate({rot:.0f})" d="{d}" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>'

def lantern_motif(x, y, s, col, sw):
    return (f'<g transform="translate({x:.1f},{y:.1f}) scale({s})" fill="none" stroke="{col}" stroke-width="{sw/s:.2f}" stroke-linejoin="round" stroke-linecap="round">'
            '<path d="M-3,-11 q3,-6 6,0 M-6,-7 L6,-7 L8,8 L-8,8Z M-9,8 L9,8 M0,-3 q3,4 0,7 q-3,-3 0,-7"/></g>')

def carvings(col, sw):
    rr = random.Random(7); o = ''
    hx, hy = HUB
    for R in (118, 150, 236, 262, 340):
        da = ' stroke-dasharray="2 7"' if R == 340 else ''
        o += f'<circle cx="{hx}" cy="{hy}" r="{R}" fill="none" stroke="{col}" stroke-width="{sw}"{da}/>'
    for i in range(8):
        a = i * math.pi / 4 + math.pi / 8
        o += f'<path d="M{hx+150*math.cos(a):.0f},{hy+150*math.sin(a):.0f} L{hx+236*math.cos(a):.0f},{hy+236*math.sin(a):.0f}" stroke="{col}" stroke-width="{sw}" fill="none"/>'
    for k, (x, y, kind, c) in LM.items():
        a = math.atan2(y - hy, x - hx); d = math.hypot(x - hx, y - hy)
        o += f'<path d="M{hx+262*math.cos(a):.0f},{hy+262*math.sin(a):.0f} L{hx+(d+60)*math.cos(a):.0f},{hy+(d+60)*math.sin(a):.0f}" stroke="{col}" stroke-width="{sw}" fill="none" stroke-dasharray="14 6"/>'
    for i in range(36):
        a = i * 2 * math.pi / 36
        o += rune(hx + 249 * math.cos(a), hy + 249 * math.sin(a), math.degrees(a) + 90, 5, col, sw, rr)
    for i in range(24):
        a = i * 2 * math.pi / 24 + .13
        o += rune(hx + 134 * math.cos(a), hy + 134 * math.sin(a), math.degrees(a) + 90, 5, col, sw, rr)
    for i in range(12):
        a = i * math.pi / 6
        o += lantern_motif(hx + 300 * math.cos(a), hy + 300 * math.sin(a), 1.35, col, sw)
    for (x, y) in ((300, 130), (1230, 120), (1240, 560), (300, 690), (540, 690)):
        o += f'<circle cx="{x}" cy="{y}" r="22" fill="none" stroke="{col}" stroke-width="{sw}"/>' + lantern_motif(x, y, 1.6, col, sw)
    return o

WALL = 'M0,720 L0,205 L50,196 L96,210 L150,178 L205,186 L262,170 L330,196 L400,188 L470,205 L540,180 L620,196 L700,186 L760,204 L840,176 L910,192 L980,180 L1050,200 L1120,172 L1190,190 L1280,176 L1280,720Z'

def sky_b():
    r = random.Random(21)
    masks = ''.join(f'<circle cx="{x}" cy="{y}" r="150" fill="#fff" opacity=".9" filter="url(#bl60)"/>' for (x, y, c) in LIT)
    o = ('<defs><linearGradient id="skB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070b1a"/><stop offset="1" stop-color="#18213f"/></linearGradient>'
         '<radialGradient id="moonB"><stop offset="0" stop-color="#e8f0ff" stop-opacity=".6"/><stop offset=".3" stop-color="#b9c8f0" stop-opacity=".22"/><stop offset="1" stop-color="#b9c8f0" stop-opacity="0"/></radialGradient>'
         '<radialGradient id="vigB" cx=".5" cy=".52" r=".75"><stop offset=".42" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#03040a" stop-opacity=".82"/></radialGradient>'
         '<linearGradient id="wallg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3150"/><stop offset=".5" stop-color="#1c2340"/><stop offset="1" stop-color="#121830"/></linearGradient>'
         f'<mask id="lit"><rect width="1280" height="720" fill="#000"/>{masks}<circle cx="{HUB[0]}" cy="{HUB[1]}" r="190" fill="#fff" filter="url(#bl60)"/></mask>'
         f'<clipPath id="wallclip"><path d="{WALL}"/></clipPath></defs>')
    o += '<rect width="1280" height="720" fill="url(#skB)"/>'
    for _ in range(140):
        o += f'<circle cx="{r.uniform(0,1280):.0f}" cy="{r.uniform(0,200):.0f}" r="{r.uniform(.5,1.6):.1f}" fill="#eaf0ff" opacity="{r.uniform(.2,.65):.2f}"/>'
    o += '<circle cx="1040" cy="112" r="210" fill="url(#moonB)"/><circle cx="1040" cy="112" r="26" fill="#eef3ff" opacity=".75"/><circle cx="1040" cy="112" r="26" fill="#eef3ff" opacity=".4" filter="url(#bl3)"/>'
    o += '<ellipse cx="640" cy="205" rx="720" ry="26" fill="#9fb0d8" opacity=".14" filter="url(#ml)"/>'
    o += '<g clip-path="url(#wallclip)"><rect y="160" width="1280" height="560" fill="url(#wallg)"/>'
    y = 168; row = 0
    while y < 720:
        x = -(row % 2) * 60 - 20
        while x < 1290:
            w_ = r.uniform(96, 170); L = r.uniform(-8, 8)
            c = '#%02x%02x%02x' % (int(36 + L), int(43 + L), int(72 + L * 1.3))
            o += f'<rect x="{x:.0f}" y="{y}" width="{w_:.0f}" height="58" rx="3" fill="{c}" opacity=".55" stroke="#080b18" stroke-width="2.2"/>'
            o += f'<path d="M{x+3:.0f},{y+2.5} L{x+w_-3:.0f},{y+2.5}" stroke="#8d9ac8" stroke-opacity=".16" stroke-width="1.5"/>'
            x += w_
        y += 58; row += 1
    o += '<rect y="160" width="1280" height="560" filter="url(#stone)"/>'
    o += '<ellipse cx="1040" cy="260" rx="420" ry="190" fill="#b9c8f0" opacity=".10" filter="url(#bl60)"/>'
    o += f'<g transform="translate(1.5,1.8)" opacity=".55">{carvings("#04060f", 3.2)}</g>'
    o += f'<g opacity=".9">{carvings("#0a0f20", 2.4)}</g>'
    o += f'<g opacity=".2" transform="translate(-.8,-1)">{carvings("#aab8e8", 1.2)}</g>'
    o += f'<g mask="url(#lit)"><g opacity=".5" filter="url(#gl)">{carvings("#ffc766", 6)}</g><g opacity=".95">{carvings("#ffd98a", 2.4)}</g></g>'
    o += '</g>'
    edge = WALL.split(' L1280,720Z')[0].replace('M0,720 L0,205', 'M0,205')
    o += f'<path d="{edge}" fill="none" stroke="#8d9ac8" stroke-opacity=".28" stroke-width="2"/>'
    o += '<rect width="1280" height="720" filter="url(#grain)"/><rect width="1280" height="720" fill="url(#vigB)"/>'
    return o

# ---------- characters ----------
_wolf_old = WREN[WREN.index('<g opacity=".92" transform="translate(30,232)">'):WREN.index('<path d="M48,300')]
WREN_ALONE = WREN.replace(_wolf_old, '').replace('<svg width="236" height="300"', '<svg width="{w}" height="{h}"')

WOLF = '''<svg width="{w}" height="{h}" viewBox="0 0 170 150"><defs><radialGradient id="wfg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#bfe6ff" stop-opacity=".6"/><stop offset="1" stop-color="#bfe6ff" stop-opacity="0"/></radialGradient>
<linearGradient id="wfb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0faff"/><stop offset="1" stop-color="#b6dcf6"/></linearGradient></defs>
<circle cx="85" cy="85" r="82" fill="url(#wfg)"/>
<path d="M126,118 C158,110 166,78 152,56 C150,74 140,86 124,92Z" fill="#cfeaff" stroke="#7fb2e0" stroke-width="2.5"/>
<path d="M152,56 C158,44 156,34 150,26 C146,38 148,46 152,56Z" fill="#e8f7ff" opacity=".85"/>
<circle cx="160" cy="22" r="3" fill="#eaf8ff"/><circle cx="150" cy="12" r="2" fill="#eaf8ff" opacity=".7"/>
<ellipse cx="82" cy="116" rx="46" ry="30" fill="url(#wfb)" stroke="#7fb2e0" stroke-width="3"/>
<ellipse cx="62" cy="140" rx="14" ry="8" fill="#e6f5ff" stroke="#7fb2e0" stroke-width="2.5"/><ellipse cx="100" cy="140" rx="14" ry="8" fill="#e6f5ff" stroke="#7fb2e0" stroke-width="2.5"/>
<path d="M44,60 L50,22 L70,44Z M120,60 L114,22 L94,44Z" fill="#d6edff" stroke="#7fb2e0" stroke-width="3" stroke-linejoin="round"/><path d="M52,50 L54,32 L63,44Z M112,50 L110,32 L101,44Z" fill="#9fd1f3"/>
<path d="M30,86 C26,52 52,36 82,36 C112,36 138,52 134,86 C132,108 108,118 82,118 C56,118 32,108 30,86Z" fill="url(#wfb)" stroke="#7fb2e0" stroke-width="3"/>
<path d="M60,92 C68,86 96,86 104,92 C106,106 96,116 82,116 C68,116 58,106 60,92Z" fill="#fff" opacity=".85"/>
<ellipse cx="58" cy="76" rx="9.5" ry="12" fill="#1d3a66"/><ellipse cx="106" cy="76" rx="9.5" ry="12" fill="#1d3a66"/>
<circle cx="61" cy="71" r="3.8" fill="#fff"/><circle cx="109" cy="71" r="3.8" fill="#fff"/><circle cx="56" cy="81" r="1.8" fill="#fff"/><circle cx="104" cy="81" r="1.8" fill="#fff"/>
<path d="M75,92 L89,92 L82,101Z" fill="#2c4a7a"/><path d="M82,101 L82,106 M74,108 Q82,113 90,108" fill="none" stroke="#2c4a7a" stroke-width="2.5" stroke-linecap="round"/>
<ellipse cx="42" cy="94" rx="8" ry="5" fill="#ffb4b0" opacity=".55"/><ellipse cx="122" cy="94" rx="8" ry="5" fill="#ffb4b0" opacity=".55"/>
<path d="M82,38 L82,48" stroke="#9fd1f3" stroke-width="3" stroke-linecap="round"/></svg>'''

LUC_HEAD_SEG = None
LUC = '''<svg width="{w}" height="{h}" viewBox="0 0 236 300"><defs><radialGradient id="lg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff9a4a" stop-opacity=".75"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>
<linearGradient id="lrb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f27a3a"/><stop offset="1" stop-color="#c2412a"/></linearGradient></defs>
<path d="M60,286 C20,284 6,250 24,226 C30,246 44,254 64,252Z" fill="#d9532b" stroke="#8e2a1c" stroke-width="2.5"/><path d="M26,232 l8,-8 4,10Z M40,252 l8,-6 2,10Z" fill="#ffd0a0"/>
<path d="M48,300 C46,236 70,206 118,206 C166,206 190,236 188,300Z" fill="url(#lrb)" stroke="#8e2a1c" stroke-width="3"/>
<path d="M76,300 C76,262 90,244 118,244 C146,244 160,262 160,300Z" fill="#3a2a34" stroke="#241820" stroke-width="2.5"/>
<path d="M68,222 C90,238 146,238 168,222 L166,238 C146,254 90,254 70,238Z" fill="#ffc766" stroke="#b9822e" stroke-width="2.5"/>
<path d="M92,206 L118,226 L144,206Z" fill="#fff0d0" stroke="#d8b26a" stroke-width="2"/>
<!-- head -->
<path d="M54,58 C26,44 22,16 40,2 C42,24 56,34 70,40Z" fill="#fbe3b4" stroke="#b9822e" stroke-width="2.5"/>
<path d="M182,58 C210,44 214,16 196,2 C194,24 180,34 166,40Z" fill="#fbe3b4" stroke="#b9822e" stroke-width="2.5"/>
<circle cx="118" cy="132" r="64" fill="#f5cda4" stroke="#c98d5c" stroke-width="3"/>
<path d="M44,134 C36,70 84,46 120,48 C158,46 202,74 192,134 C186,104 160,88 128,92 C98,96 66,92 44,134Z" fill="#a8301d" stroke="#5e1a10" stroke-width="3"/>
<path d="M52,110 C40,138 46,170 60,186 C56,160 58,134 68,116Z M184,110 C196,138 190,170 176,186 C180,160 178,134 168,116Z" fill="#c1432a"/>
<path d="M96,60 C106,50 130,50 140,60" fill="none" stroke="#ff9a4a" stroke-width="3.5" stroke-linecap="round" opacity=".8"/>
<path d="M62,152 l5,-6 5,6 -5,6Z M70,162 l4,-5 4,5 -4,5Z M174,152 l-5,-6 -5,6 5,6Z M166,162 l-4,-5 -4,5 4,5Z" fill="#ff8a4a" opacity=".85"/>
<ellipse cx="92" cy="138" rx="11" ry="13" fill="#ffb23a" stroke="#6e3a14" stroke-width="2"/><ellipse cx="144" cy="138" rx="11" ry="13" fill="#ffb23a" stroke="#6e3a14" stroke-width="2"/>
<ellipse cx="92" cy="138" rx="3.6" ry="10" fill="#2a1410"/><ellipse cx="144" cy="138" rx="3.6" ry="10" fill="#2a1410"/>
<circle cx="96" cy="132" r="3.6" fill="#fff"/><circle cx="148" cy="132" r="3.6" fill="#fff"/><circle cx="89" cy="144" r="1.8" fill="#fff"/><circle cx="141" cy="144" r="1.8" fill="#fff"/>
<ellipse cx="76" cy="162" rx="10" ry="6" fill="#f2907a" opacity=".6"/><ellipse cx="160" cy="162" rx="10" ry="6" fill="#f2907a" opacity=".6"/>
<path d="M104,166 Q118,177 132,166" fill="none" stroke="#8a4a3a" stroke-width="3.5" stroke-linecap="round"/><path d="M125,170 l3,6 3,-7Z" fill="#fff"/>
<!-- hearth -->
<path d="M190,246 C204,232 208,214 204,196" fill="none" stroke="#d9532b" stroke-width="20" stroke-linecap="round"/>
<circle cx="204" cy="192" r="11" fill="#f5cda4" stroke="#c98d5c" stroke-width="2"/>
<circle cx="204" cy="222" r="50" fill="url(#lg)"/>
<path d="M188,222 L220,222 L214,246 L194,246Z" fill="#4a3a44" stroke="#241820" stroke-width="2.5"/><rect x="186" y="218" width="36" height="7" rx="3" fill="#6a5560" stroke="#241820" stroke-width="1.5"/>
<path d="M204,194 C214,206 214,214 204,220 C194,214 194,206 204,194Z" fill="#ffd98a"/><path d="M204,204 C209,210 209,214 204,218 C199,214 199,210 204,204Z" fill="#fffbe8"/></svg>'''

OPH = '''<svg width="{w}" height="{h}" viewBox="0 0 150 130"><defs><radialGradient id="og" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb070" stop-opacity=".6"/><stop offset="1" stop-color="#ffb070" stop-opacity="0"/></radialGradient></defs>
<circle cx="75" cy="72" r="70" fill="url(#og)"/>
<path d="M104,100 C136,104 146,76 130,60 C132,78 122,88 106,88Z" fill="#ff8d5c" stroke="#b9482a" stroke-width="2.5"/><path d="M130,60 C136,48 134,40 128,34 C124,46 126,52 130,60Z" fill="#ffd27a"/><path d="M130,56 C134,48 133,42 129,38 C127,46 128,50 130,56Z" fill="#fffbe8"/>
<path d="M46,70 C20,56 14,36 22,24 C34,30 46,44 54,58Z" fill="#ffb07a" stroke="#b9482a" stroke-width="2.5"/><path d="M104,70 C130,56 136,36 128,24 C116,30 104,44 96,58Z" fill="#ffb07a" stroke="#b9482a" stroke-width="2.5"/>
<ellipse cx="75" cy="92" rx="36" ry="28" fill="#ff8d5c" stroke="#b9482a" stroke-width="3"/><ellipse cx="75" cy="98" rx="22" ry="20" fill="#ffe3b0"/>
<ellipse cx="52" cy="116" rx="13" ry="8" fill="#ff8d5c" stroke="#b9482a" stroke-width="2.5"/><ellipse cx="98" cy="116" rx="13" ry="8" fill="#ff8d5c" stroke="#b9482a" stroke-width="2.5"/>
<path d="M44,32 C40,18 48,10 54,8 C54,16 56,22 62,26Z M106,32 C110,18 102,10 96,8 C96,16 94,22 88,26Z" fill="#fbe3b4" stroke="#b9822e" stroke-width="2"/>
<path d="M32,56 C30,30 52,22 75,22 C98,22 120,30 118,56 C118,76 98,84 75,84 C52,84 32,76 32,56Z" fill="#ff8d5c" stroke="#b9482a" stroke-width="3"/>
<path d="M54,66 C62,60 88,60 96,66 C96,78 88,84 75,84 C62,84 54,78 54,66Z" fill="#ffd9a8"/>
<ellipse cx="55" cy="50" rx="8.5" ry="10.5" fill="#2a1410"/><ellipse cx="95" cy="50" rx="8.5" ry="10.5" fill="#2a1410"/>
<circle cx="58" cy="45" r="3.4" fill="#fff"/><circle cx="98" cy="45" r="3.4" fill="#fff"/><circle cx="53" cy="55" r="1.6" fill="#fff"/><circle cx="93" cy="55" r="1.6" fill="#fff"/>
<circle cx="69" cy="66" r="1.8" fill="#8a3a22"/><circle cx="81" cy="66" r="1.8" fill="#8a3a22"/><path d="M68,74 Q75,79 82,74" fill="none" stroke="#8a3a22" stroke-width="2.4" stroke-linecap="round"/>
<ellipse cx="40" cy="64" rx="6" ry="4" fill="#ff6a5a" opacity=".55"/><ellipse cx="110" cy="64" rx="6" ry="4" fill="#ff6a5a" opacity=".55"/></svg>'''

HEAD_WREN = '<svg width="{s}" height="{s}" viewBox="34 24 168 180">' + WREN.split('<!-- head -->')[1].split('<!-- lantern hand -->')[0] + '</svg>'
HEAD_LUC = '<svg width="{s}" height="{s}" viewBox="14 -2 208 208">' + LUC.split('<!-- head -->')[1].split('<!-- hearth -->')[0] + '</svg>'
HEAD_ELI = ('<svg width="{s}" height="{s}" viewBox="0 0 100 100"><ellipse cx="50" cy="12" rx="22" ry="6" fill="none" stroke="#ffe08a" stroke-width="4"/>'
 '<path d="M14,60 C10,24 32,14 50,14 C68,14 90,24 86,60 L90,92 L10,92Z" fill="#f4e6c4" stroke="#b79a5a" stroke-width="2.5"/>'
 '<circle cx="50" cy="56" r="30" fill="#f8d6ae" stroke="#c98d5c" stroke-width="2.5"/><path d="M22,50 C26,30 40,26 50,26 C60,26 74,30 78,50 C68,40 32,40 22,50Z" fill="#e8dcc0" stroke="#b79a5a" stroke-width="2"/>'
 '<ellipse cx="39" cy="58" rx="4.4" ry="5.6" fill="#2a1a22"/><ellipse cx="61" cy="58" rx="4.4" ry="5.6" fill="#2a1a22"/><circle cx="40.6" cy="55.8" r="1.7" fill="#fff"/><circle cx="62.6" cy="55.8" r="1.7" fill="#fff"/>'
 '<ellipse cx="31" cy="68" rx="5" ry="3.2" fill="#f2907a" opacity=".6"/><ellipse cx="69" cy="68" rx="5" ry="3.2" fill="#f2907a" opacity=".6"/><path d="M44,72 Q50,77 56,72" fill="none" stroke="#8a4a3a" stroke-width="2.2" stroke-linecap="round"/></svg>')

LOCK_SVG = ('<span style="position:absolute;right:-5px;bottom:-5px;width:22px;height:22px;border-radius:50%;background:#252d4c;border:2px solid #b7c0da;display:flex;align-items:center;justify-content:center">'
            '<svg width="12" height="12" viewBox="0 0 12 12"><rect x="1.5" y="5" width="9" height="6" rx="1.2" fill="#d3d9ec"/><path d="M3.4,5 v-1.6 a2.6,2.6 0 0 1 5.2,0 v1.6" fill="none" stroke="#d3d9ec" stroke-width="1.6"/></svg></span>')

def heads_row(sel, luc_locked, size=46):
    def cell(svg, active, locked=False):
        bd = '#fff3dc' if active else ('#7f89a8' if locked else '#e6c27a')
        glow = 'box-shadow:0 0 16px rgba(255,210,122,.85),0 0 0 3px rgba(255,210,122,.4);' if active else ''
        inner = svg.replace('{s}', str(size - 8))
        if locked:
            inner = f'<div style="filter:brightness(0) opacity(.55);display:flex">{inner}</div>'
        lock = LOCK_SVG if locked else ''
        bgc = '#4a3a2a' if active else '#2e3658'
        ds = 'dashed' if locked else 'solid'
        return (f'<div style="position:relative;width:{size}px;height:{size}px;border-radius:50%;background:radial-gradient(circle at 50% 40%,{bgc},#171d3a);'
                f'border:2.5px {ds} {bd};display:flex;align-items:center;justify-content:center;{glow}">{inner}{lock}</div>')
    return ('<div style="display:flex;gap:14px;justify-content:center">'
            + cell(HEAD_WREN, sel == 'wren') + cell(HEAD_ELI, sel == 'elias')
            + cell(HEAD_LUC, sel == 'lucinda', locked=luc_locked) + '</div>')

def panel(variant, w=400):
    if variant == 'a':
        figs = (f'<div class="abs" style="left:128px;top:36px">{WREN_ALONE.format(w=236, h=300)}</div>'
                f'<div class="abs" style="left:14px;top:176px">{WOLF.format(w=150, h=132)}</div>')
        name, sub, sel, lock = 'Wren', 'Lantern-bearer - Level 4 - with her spirit wolf', 'wren', True
    elif variant == 'b':
        figs = (f'<div class="abs" style="left:134px;top:36px">{LUC.format(w=236, h=300)}</div>'
                f'<div class="abs" style="left:10px;top:188px">{OPH.format(w=150, h=130)}</div>')
        name, sub, sel, lock = 'Lucinda', 'Hearth-Warden - Level 2 - with Ophimber', 'lucinda', False
    else:
        spot = ('<div class="abs" style="left:6px;top:178px;width:150px;height:140px"><svg width="150" height="140" viewBox="0 0 150 140"><defs><radialGradient id="gs" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".55"/><stop offset=".5" stop-color="#ffc766" stop-opacity=".2"/><stop offset="1" stop-color="#ffc766" stop-opacity="0"/></radialGradient></defs>'
                '<circle cx="75" cy="76" r="68" fill="url(#gs)"/><ellipse cx="75" cy="112" rx="38" ry="9" fill="#ffd27a" opacity=".16"/>'
                '<path d="M40,40 l2.4,6 6,2.4 -6,2.4 -2.4,6 -2.4,-6 -6,-2.4 6,-2.4Z M112,62 l1.8,4.4 4.4,1.8 -4.4,1.8 -1.8,4.4 -1.8,-4.4 -4.4,-1.8 4.4,-1.8Z M84,22 l1.4,3.4 3.4,1.4 -3.4,1.4 -1.4,3.4 -1.4,-3.4 -3.4,-1.4 3.4,-1.4Z" fill="#fff3dc" opacity=".8"/></svg></div>')
        figs = spot + f'<div class="abs" style="left:82px;top:36px">{WREN_ALONE.format(w=236, h=300)}</div>'
        name, sub, sel, lock = 'Wren', 'Lantern-bearer - Level 4', 'wren', True
    return f'''<div class="hero3" style="width:{w}px;left:0;top:0">
<div class="abs disp" style="left:0;right:0;top:12px;text-align:center;font-size:22px;color:#d8c9a0">Your hero</div>
{figs}
<div class="abs" style="left:0;right:0;top:344px">{heads_row(sel, lock)}</div>
<div class="abs disp" style="left:0;right:0;top:402px;text-align:center;font-size:42px;line-height:1;text-shadow:0 2px 10px #000">{name}</div>
<div class="abs" style="left:0;right:0;top:450px;text-align:center;font-size:15px;font-weight:700;color:#ffd27a">{sub}</div>
<div class="abs" style="left:34px;right:34px;top:482px;display:flex;flex-direction:column;gap:10px"><div class="btn play">Play</div>
<div style="display:flex;gap:10px"><div class="btn" style="flex:1;font-size:16px;height:44px">Almanac</div><div class="btn" style="flex:1;font-size:16px;height:44px">Goals <span style="margin-left:4px;background:#ffd27a;color:#3a2410;border-radius:99px;padding:0 8px;font-size:14px">3</span></div><div class="btn" style="flex:1;font-size:16px;height:44px;color:#d6dcee">Back</div></div></div>
<div class="cur" style="left:34px;right:34px;bottom:12px;height:42px"><span style="display:flex;gap:8px;align-items:center"><i class="dot" style="width:20px;height:20px;background:radial-gradient(circle at 40% 35%,#fff2b8,#ffb84a)"></i>1,860</span><span style="display:flex;gap:8px;align-items:center"><i class="dot" style="width:20px;height:20px;background:radial-gradient(circle at 40% 35%,#e6dcff,#8f78e8)"></i>14</span></div>
</div>'''

CSS3 = '''.hero3{position:absolute;height:656px;border-radius:20px;overflow:hidden;background:linear-gradient(180deg,rgba(18,24,46,.96),rgba(34,38,66,.92) 60%,rgba(70,52,60,.92));border:1.5px solid rgba(230,194,122,.6);box-shadow:0 10px 40px rgba(0,0,0,.5)}'''

def hero_panel3():
    return f'''<div class="hero"><div class="abs disp" style="left:0;right:0;top:10px;text-align:center;font-size:20px;color:#d8c9a0">Your hero</div>
<div class="abs" style="left:68px;top:30px">{WREN_ALONE.format(w=188, h=238)}</div>
<div class="abs" style="left:4px;top:152px">{WOLF.format(w=100, h=88)}</div>
<div class="abs" style="left:0;right:0;top:272px">{heads_row('wren', True, 42)}</div>
<div class="abs disp" style="left:0;right:0;top:326px;text-align:center;font-size:36px;line-height:1;text-shadow:0 2px 10px #000">Wren</div>
<div class="abs" style="left:0;right:0;top:368px;text-align:center;font-size:14px;font-weight:700;color:#ffd27a">Lantern-bearer - Level 4</div>
<div class="abs" style="left:26px;right:26px;top:400px;display:flex;flex-direction:column;gap:9px"><div class="btn play" style="height:54px">Play</div><div class="btn" style="height:42px;font-size:17px">Almanac</div>
<div class="btn" style="height:42px;font-size:17px">Goals <span style="margin-left:6px;background:#ffd27a;color:#3a2410;border-radius:99px;padding:0 9px;font-size:15px">3</span></div><div class="btn" style="height:40px;font-size:16px;color:#d6dcee">Back</div></div>
{cur('1,860', '14')}</div>'''

def page3(sky_svg, web_svg, over):
    return f'''<!doctype html><html><head><meta charset="utf-8"><title>Wispwick tree mockup R3</title><style>{FONTS}{CSS}{CSS3}</style></head><body>
<div class="scr" style="width:1280px;height:720px"><svg class="abs" style="left:0;top:0" width="1280" height="720" viewBox="0 0 1280 720">{DEFS3}{sky_svg}{web_svg}</svg>{over}</div></body></html>'''

def tree_screen(sky_svg):
    w = build_web('mid'); calm(w)
    return page3(sky_svg, w.svg(), hero_panel3() + top_bar(47, '9 can light') + NEXT_MID)

def board():
    st_ = random.Random(3)
    st = ''.join(f'<circle cx="{st_.uniform(0,1280):.0f}" cy="{st_.uniform(0,720):.0f}" r="{st_.uniform(.5,1.5):.1f}" fill="#eaf0ff" opacity="{st_.uniform(.15,.5):.2f}"/>' for _ in range(110))
    bg = ('<defs><linearGradient id="bgb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f22"/><stop offset="1" stop-color="#1b2140"/></linearGradient></defs>'
          f'<rect width="1280" height="720" fill="url(#bgb)"/>{st}')
    over = ''
    for i, (v, t) in enumerate((('a', 'A. Hero + companion (Wren, spirit wolf)'), ('b', 'B. Companion unlocked (Lucinda, Ophimber)'), ('c', 'C. Interim, no companion yet'))):
        x = 20 + i * 420
        over += f'<div class="abs" style="left:{x}px;top:12px;width:400px;text-align:center;font-size:16px;font-weight:700;color:#d6dcee">{t}</div>'
        over += f'<div class="abs" style="left:{x}px;top:44px;width:400px;height:656px">{panel(v)}</div>'
    return page3(bg, '', over)

# ---------- scale / zoom board ----------
KINDS = ['wolf', 'raven', 'bolt', 'chain', 'orbit', 'elias', 'lucinda', 'hush', 'dusk', 'night']
REG = [  # name, angle, dist, colour, lit share, kinds, names, dim
 ('Cursed Forest', 185, 640, '#9fd8ff', .85, ['wolf', 'raven', 'bolt', 'chain', 'orbit'], ['Ghost Wolves', 'Raven Flock', 'Spirit Bolts', 'Storm Chain', 'Holy Orbit'], False),
 ('Hushbell', 335, 640, '#d4ecff', .4, ['hush', 'orbit', 'bolt', 'raven', 'wolf'], ['Hushbell', 'Frost Bell', 'Snow Hare', 'Belfry', 'Chimes'], False),
 ('Heroes', 50, 620, '#ffe08a', .6, ['elias', 'lucinda', 'elias', 'lucinda', 'elias'], ['Wren', 'Elias', 'Lucinda', 'Mara', 'Isolde'], False),
 ('Nights', 112, 620, '#c9b8ff', .4, ['dusk', 'night', 'dusk', 'night', 'dusk'], ['Twilight', 'Deep Dusk', 'Long Night', 'Starless', 'Dawn'], False),
 ('Far Hollow I', 268, 880, '#9aa4c0', 0, ['dusk', 'night', 'hush', 'orbit'], [], True),
 ('Far Hollow II', 222, 880, '#9aa4c0', 0, ['wolf', 'raven', 'bolt', 'chain'], [], True),
 ('Far Hollow III', 8, 880, '#9aa4c0', 0, ['elias', 'lucinda', 'dusk', 'night'], [], True),
]

def build_world():
    r = random.Random(5); meds = []; edges = []; nodes = []; regs = []
    for ri, (rn, ang, dist, col, lit, kinds, names, dim) in enumerate(REG):
        a = math.radians(ang); C = (dist * math.cos(a), dist * math.sin(a)); n = len(kinds); R = 170 if dim else 210
        regs.append((rn, C, col, dim, R))
        P = []
        for i in range(n):
            b = a + math.pi + 2 * math.pi * i / n
            P.append((C[0] + R * math.cos(b), C[1] + R * math.sin(b), b))
        nl = round(lit * n)
        for i, (x, y, b) in enumerate(P):
            ml = (i < nl) and not dim
            meds.append((x, y, kinds[i], names[i] if names else '', ml, col, dim, C))
            # ring edge to next
            x2, y2, _ = P[(i + 1) % n]
            edges.append(((x, y), (x2, y2), col, ml and (i + 1) % n < nl, dim))
            for t in (.25, .5, .75):
                nodes.append((x + (x2 - x) * t, y + (y2 - y) * t, False, ml and (i + 1) % n < nl and r.random() < .8, col, dim))
            for off in (-.55, .55):
                ba = b + off
                x0, y0 = x + 62 * math.cos(ba), y + 62 * math.sin(ba)
                edges.append(((x0, y0), (x0 + 5 * 50 * math.cos(ba), y0 + 5 * 50 * math.sin(ba)), col, ml, dim))
                for k in range(6):
                    nodes.append((x0 + k * 50 * math.cos(ba), y0 + k * 50 * math.sin(ba), k in (2, 5), ml and r.random() < .85 - k * .1, col, dim))
        gx, gy, _ = P[0]
        edges.append(((0, 0), (gx, gy), col, lit > 0 and not dim, dim))
        for k in range(1, 10):
            t = (80 + (math.hypot(gx, gy) - 160) * (k - 1) / 8) / math.hypot(gx, gy)
            nodes.append((gx * t, gy * t, k in (3, 6, 9), lit > 0 and not dim and k <= 3 + lit * 6, col, dim))
    return meds, edges, nodes, regs

WORLD = build_world()

def zoom_panel(mode, sc, cx, cy, W=410, H=640):
    meds, edges, nodes, regs = WORLD
    Pt = lambda x, y: ((x - cx) * sc + W / 2, (y - cy) * sc + H / 2)
    vis = lambda x, y, m=30: -m <= x <= W + m and -m <= y <= H + m
    RM = {'far': 12, 'mid': 22, 'near': 38}[mode]
    o = ('<defs><linearGradient id="zbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1020"/><stop offset=".6" stop-color="#171f3c"/><stop offset="1" stop-color="#2a3050"/></linearGradient>'
         f'<radialGradient id="zv" cx=".5" cy=".5" r=".75"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#03040a" stop-opacity=".7"/></radialGradient>'
         f'<clipPath id="zc{mode}"><rect width="{W}" height="{H}" rx="18"/></clipPath></defs>')
    o += f'<g clip-path="url(#zc{mode})"><rect width="{W}" height="{H}" fill="url(#zbg)"/>'
    o += f'<svg x="0" y="0" width="{W}" height="{H}" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMax slice">{pines(560, 50, 100, "#1a2342", 1, 18, .9, 2)}<ellipse cx="640" cy="560" rx="700" ry="26" fill="#9fb0d8" opacity=".14" filter="url(#ml)"/>{pines(640, 90, 150, "#0c1124", 3, 28, 1, 3)}</svg>'
    # haze
    for (rn, C, col, dim, R) in regs:
        x, y = Pt(*C)
        if mode == 'far': o += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{(R+80)*sc:.0f}" fill="{col}" opacity="{.10 if dim else .30}" filter="url(#bl20)"/>'
        elif mode == 'mid': o += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{(R+80)*sc:.0f}" fill="{col}" opacity="{.06 if dim else .14}" filter="url(#bl20)"/>'
    hx, hy = Pt(0, 0)
    o += f'<circle cx="{hx:.0f}" cy="{hy:.0f}" r="{(260 if mode=="far" else 200)*sc*1.6:.0f}" fill="#ff9f45" opacity=".26" filter="url(#bl20)"/>'
    # edges
    for (p0, p1, col, lit, dim) in edges:
        (x0, y0), (x1, y1) = Pt(*p0), Pt(*p1)
        if not (vis(x0, y0, 60) or vis(x1, y1, 60)): continue
        if mode == 'far':
            if lit: o += f'<path d="M{x0:.1f},{y0:.1f} L{x1:.1f},{y1:.1f}" stroke="{col}" stroke-width="1.5" opacity=".7"/>'
            else: o += f'<path d="M{x0:.1f},{y0:.1f} L{x1:.1f},{y1:.1f}" stroke="#a9b3d0" stroke-width="1" opacity="{.08 if dim else .18}"/>'
        elif mode == 'mid':
            c, op = (col, .9) if lit else ('#a9b3d0', .22 if dim else .4)
            o += f'<path d="M{x0:.1f},{y0:.1f} L{x1:.1f},{y1:.1f}" stroke="{c}" stroke-width="2.4" stroke-dasharray="0.1 6" stroke-linecap="round" opacity="{op}"/>'
        else:
            if lit:
                o += f'<path d="M{x0:.1f},{y0:.1f} L{x1:.1f},{y1:.1f}" stroke="{col}" stroke-width="8" opacity=".25" filter="url(#gl)"/><path d="M{x0:.1f},{y0:.1f} L{x1:.1f},{y1:.1f}" stroke="{col}" stroke-width="3" stroke-linecap="round" opacity=".85"/>'
            else:
                o += f'<path d="M{x0:.1f},{y0:.1f} L{x1:.1f},{y1:.1f}" stroke="#a9b3d0" stroke-width="2" stroke-dasharray="3 6" stroke-linecap="round" opacity="{.25 if dim else .5}"/>'
    # nodes
    for (x, y, dia, lit, col, dim) in nodes:
        X, Y = Pt(x, y)
        if not vis(X, Y): continue
        if mode == 'far':
            if lit: o += f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="1.6" fill="{col}" opacity=".5"/>'
        elif mode == 'mid':
            if dia:
                if lit: o += f'<rect x="{X-5:.1f}" y="{Y-5:.1f}" width="10" height="10" rx="2" transform="rotate(45 {X:.1f} {Y:.1f})" fill="{col}" stroke="#fff3dc" stroke-width="1.5"/>'
                else: o += f'<rect x="{X-5:.1f}" y="{Y-5:.1f}" width="10" height="10" rx="2" transform="rotate(45 {X:.1f} {Y:.1f})" fill="#3a4262" stroke="#9aa4c0" stroke-width="1.5" opacity="{.5 if dim else .9}"/>'
        else:
            if dia:
                if lit: o += f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="20" fill="{col}" opacity=".3" filter="url(#gl)"/><rect x="{X-10:.1f}" y="{Y-10:.1f}" width="20" height="20" rx="3" transform="rotate(45 {X:.1f} {Y:.1f})" fill="{col}" stroke="#fff3dc" stroke-width="2"/><circle cx="{X:.1f}" cy="{Y:.1f}" r="3.2" fill="#fffbe8"/>'
                else: o += f'<rect x="{X-10:.1f}" y="{Y-10:.1f}" width="20" height="20" rx="3" transform="rotate(45 {X:.1f} {Y:.1f})" fill="#3a4262" stroke="#9aa4c0" stroke-width="2" opacity="{.5 if dim else .95}"/>'
            else:
                if lit: o += f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="9" fill="{col}" opacity=".3" filter="url(#gl)"/><circle cx="{X:.1f}" cy="{Y:.1f}" r="4.2" fill="#fff6e0" stroke="{col}" stroke-width="2"/>'
                else: o += f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="4" fill="#6a7699" stroke="#b7c0da" stroke-width="1.4" opacity="{.35 if dim else .85}"/>'
    # hub
    if vis(hx, hy, 80):
        o += lantern(hx, hy, {'far': .26, 'mid': .42, 'near': .8}[mode])
    # medallions + names
    lab = ''
    for (x, y, kind, name, lit, col, dim, C) in meds:
        X, Y = Pt(x, y)
        if not vis(X, Y, 50): continue
        if lit: o += f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="{RM*1.9:.0f}" fill="{col}" opacity=".45" filter="url(#gl2)"/>'
        ring = '#e6c27a' if lit else '#9aa4c0'
        dsh = '' if lit else ' stroke-dasharray="4 3"'
        o += (f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="{RM+3}" fill="#10152c" opacity=".7"/><circle cx="{X:.1f}" cy="{Y:.1f}" r="{RM}" fill="{"#232c52" if lit else "#2a3150"}" stroke="{ring}" stroke-width="{max(2, RM/9):.1f}"{dsh} opacity="{.6 if dim else 1}"/>'
              f'<g transform="translate({X:.1f},{Y:.1f}) scale({RM/40:.3f})" opacity="{.45 if dim else (1 if lit else .75)}">{icon(kind, col if lit else "#aab4d0")}</g>')
        if name and not dim:
            fs = {'far': 13, 'mid': 15, 'near': 22}[mode]
            below = y >= C[1]
            ty = Y + RM + fs + 3 if below else Y - RM - 7
            lab += f'<text x="{X:.1f}" y="{ty:.1f}" text-anchor="middle" class="{"nm" if mode=="near" else "sb"}" font-size="{fs}" fill="{"#fff3dc" if lit else "#c4cce2"}">{name}</text>'
    o += lab
    # region labels
    for (rn, C, col, dim, R) in regs:
        X, Y = Pt(*C)
        if mode == 'far' and vis(X, Y, 10):
            o += f'<text x="{X:.1f}" y="{Y+5:.1f}" text-anchor="middle" class="nm" font-size="{15 if not dim else 14}" fill="{"#fff3dc" if not dim else "#c4cce2"}" opacity="{1 if not dim else .8}">{rn}</text>'
        elif mode == 'mid' and vis(X, Y, 10):
            o += f'<text x="{X:.1f}" y="{Y+6:.1f}" text-anchor="middle" class="nm" font-size="20" fill="{col}" opacity=".85">{rn}</text>'
    o += f'<rect width="{W}" height="{H}" fill="url(#zv)"/></g><rect x="1" y="1" width="{W-2}" height="{H-2}" rx="18" fill="none" stroke="#e6c27a" stroke-opacity=".6" stroke-width="2"/>'
    return o

def zoom_board():
    W, H = 410, 640
    specs = [('far', .205, 90, -120, 'FAR: landmarks only (zoom 0.2x)'), ('mid', .5, -330, 0, 'MID: regions, diamonds (zoom 0.5x)'), ('near', 1.0, -470, -40, 'NEAR: everything (zoom 1.0x)')]
    o = '<defs><linearGradient id="zb0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#080c1a"/><stop offset="1" stop-color="#1a2040"/></linearGradient></defs><rect width="1280" height="720" fill="url(#zb0)"/>'
    for i, (m, sc, cx, cy, cap) in enumerate(specs):
        x = 10 + i * 425
        o += f'<text x="{x+W/2}" y="30" text-anchor="middle" class="sb" font-size="17" fill="#fff3dc">{cap}</text>'
        o += f'<svg x="{x}" y="46" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{zoom_panel(m, sc, cx, cy, W, H)}</svg>'
    # legend inside far panel (empty space under world)
    ly = 46 + 545
    names = [('Cursed Forest', '#9fd8ff'), ('Hushbell', '#d4ecff'), ('Heroes', '#ffe08a'), ('Nights', '#c9b8ff'), ('Far Hollow (dim)', '#9aa4c0')]
    for j, (n, c) in enumerate(names):
        o += f'<circle cx="{28 + (j%2)*190}" cy="{ly + (j//2)*24 - 4}" r="6" fill="{c}"/><text x="{40 + (j%2)*190}" y="{ly + (j//2)*24}" class="sb" font-size="14" fill="#d6dcee">{n}</text>'
    return f'<!doctype html><html><head><meta charset="utf-8"><title>Wispwick tree mockup R3 zoom</title><style>{FONTS}{CSS}{CSS3}</style></head><body><div class="scr" style="width:1280px;height:720px"><svg class="abs" width="1280" height="720" viewBox="0 0 1280 720">{DEFS3}{o}</svg></div></body></html>'

OUT = [('R3-bgA-misty-forest-dusk', lambda: tree_screen(sky_a())), ('R3-bgB-carved-stone-night', lambda: tree_screen(sky_b())),
       ('R3-hero-panel-variants', board), ('R3-scale-zoom-levels', zoom_board)]
for name, fn in OUT:
    open(os.path.join(D, name + '.html'), 'w', encoding='utf8').write(fn()); print(name)
print('nodes', len(WORLD[2]), 'medallions', len(WORLD[0]))
