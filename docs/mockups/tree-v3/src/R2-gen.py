# Round 2 mockup generator: python R2-gen.py -> writes R2-*.html next to this file; node R2-shot.mjs renders PNGs
import re, math, random, os
D = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(D, 'A-restored-sky-later.html'), encoding='utf8').read()
FONTS = '\n'.join(re.findall(r'@font-face\{[^}]*\}', src))

HUB = (770, 345)
COL = dict(wolf='#9fd8ff', raven='#b79cff', bolt='#ffb35c', chain='#7ff0ff', orbit='#ffd27a',
           elias='#ffe08a', lucinda='#ff8a6b', hush='#d4ecff', dusk='#9fb0ff', night='#c9b8ff')
LM = dict(
 wolf=(470, 440, 'wolf', COL['wolf']), raven=(560, 185, 'raven', COL['raven']),
 bolt=(940, 185, 'bolt', COL['bolt']), chain=(1120, 270, 'chain', COL['chain']),
 orbit=(790, 520, 'orbit', COL['orbit']), elias=(1120, 470, 'elias', COL['elias']),
 lucinda=(385, 250, 'lucinda', COL['lucinda']), hush=(985, 375, 'hush', COL['hush']),
 dusk=(335, 590, 'dusk', COL['dusk']), night=(770, 100, 'night', COL['night']),
)
EVO = dict(trails=(600, 560, 'wolf', 'Light Trails'), vesper=(430, 112, 'raven', 'Vesper Tide'))

def icon(kind, f, ink='#1a2038'):
    if kind == 'wolf':
        return (f'<path d="M-25,-26 L-14,-9 L14,-9 L25,-26 L28,6 L13,27 L0,32 L-13,27 L-28,6Z" fill="{f}"/>'
                f'<ellipse cx="-10" cy="2" rx="3.4" ry="4.4" fill="{ink}"/><ellipse cx="10" cy="2" rx="3.4" ry="4.4" fill="{ink}"/>'
                f'<path d="M-5,16 L5,16 L0,23Z" fill="{ink}"/>')
    if kind == 'raven':
        return (f'<path d="M0,-6 C-14,-30 -34,-22 -40,-4 C-28,-9 -21,-4 -15,2 C-23,4 -27,10 -29,19 C-17,12 -8,12 0,21 C8,12 17,12 29,19 C27,10 23,4 15,2 C21,-4 28,-9 40,-4 C34,-22 14,-30 0,-6Z" fill="{f}"/>'
                f'<ellipse cx="0" cy="4" rx="7" ry="13" fill="{f}" stroke="{ink}" stroke-width="1.5"/><circle cx="-2.5" cy="-2" r="1.8" fill="{ink}"/>')
    if kind == 'bolt':
        return (f'<path d="M0,-34 L7,-7 L34,0 L7,7 L0,34 L-7,7 L-34,0 L-7,-7Z" fill="{f}"/>'
                f'<path d="M-20,-20 L-4,-4 M20,-20 L4,-4 M-20,20 L-4,4 M20,20 L4,4" stroke="{f}" stroke-width="4" stroke-linecap="round"/>'
                f'<circle r="5" fill="{ink}" opacity=".55"/>')
    if kind == 'chain':
        return (f'<path d="M10,-34 L-16,4 L-2,4 L-12,34 L18,-8 L3,-8Z" fill="{f}"/>'
                f'<circle cx="-24" cy="-20" r="5" fill="none" stroke="{f}" stroke-width="3"/><circle cx="26" cy="18" r="5" fill="none" stroke="{f}" stroke-width="3"/>')
    if kind == 'orbit':
        o = f'<circle r="26" fill="none" stroke="{f}" stroke-width="3"/><circle r="10" fill="{f}"/>'
        for a in (-90, 30, 150):
            o += f'<circle cx="{26*math.cos(math.radians(a)):.1f}" cy="{26*math.sin(math.radians(a)):.1f}" r="6" fill="{f}" stroke="{ink}" stroke-width="1.5"/>'
        return o
    if kind == 'elias':
        return (f'<ellipse cx="0" cy="-26" rx="15" ry="4.5" fill="none" stroke="{f}" stroke-width="3"/>'
                f'<path d="M-26,34 C-26,10 -18,2 0,2 C18,2 26,10 26,34Z" fill="{f}" opacity=".9"/>'
                f'<path d="M-17,0 C-17,-18 -10,-22 0,-22 C10,-22 17,-18 17,0 C17,8 10,10 0,10 C-10,10 -17,8 -17,0Z" fill="{f}"/>'
                f'<ellipse cx="0" cy="-2" rx="10" ry="11" fill="#f6d7b0" stroke="{ink}" stroke-width="1.2"/>'
                f'<circle cx="-4" cy="-3" r="1.6" fill="{ink}"/><circle cx="4" cy="-3" r="1.6" fill="{ink}"/>')
    if kind == 'lucinda':
        return (f'<path d="M-14,-8 L-20,-30 L-8,-16Z M14,-8 L20,-30 L8,-16Z" fill="{f}"/>'
                f'<path d="M-17,4 C-20,-22 -9,-26 0,-26 C9,-26 20,-22 17,4 L18,30 L8,22 L-8,22 L-18,30Z" fill="{f}" opacity=".95"/>'
                f'<ellipse cx="0" cy="-3" rx="10" ry="12" fill="#f6d7b0" stroke="{ink}" stroke-width="1.2"/>'
                f'<circle cx="-4" cy="-4" r="1.6" fill="{ink}"/><circle cx="4" cy="-4" r="1.6" fill="{ink}"/>'
                f'<circle cx="25" cy="24" r="13" fill="#2a2038" stroke="{f}" stroke-width="2"/>'
                f'<path d="M16,28 C18,20 24,16 32,18 L36,22 L31,23 C29,27 24,30 16,28Z M24,19 L22,13 L28,17Z" fill="{f}"/>')
    if kind == 'hush':
        return (f'<path d="M-30,24 L-30,6 L-20,-4 L-10,6 L-10,24Z M14,24 L14,2 L24,-8 L34,2 L34,24Z" fill="{f}" opacity=".55"/>'
                f'<path d="M-15,14 C-15,-6 -10,-22 0,-24 C10,-22 15,-6 15,14 L22,21 L-22,21Z" fill="{f}" stroke="{ink}" stroke-width="1.4"/>'
                f'<circle cx="0" cy="27" r="4.5" fill="{f}"/><circle cx="0" cy="-27" r="3" fill="{f}"/>'
                f'<circle cx="-26" cy="-22" r="2.4" fill="{f}"/><circle cx="28" cy="-18" r="2.4" fill="{f}"/><circle cx="-6" cy="-6" r="2" fill="{ink}" opacity=".4"/>')
    if kind == 'dusk':
        return (f'<circle r="27" fill="{f}"/><circle cx="12" cy="-6" r="23" fill="#232c52"/>'
                f'<path d="M22,-12 l2,5 5,2 -5,2 -2,5 -2,-5 -5,-2 5,-2Z" fill="{f}"/><circle cx="24" cy="18" r="2.4" fill="{f}"/>')
    if kind == 'night':
        return (f'<circle r="25" fill="{f}"/><circle cx="-8" cy="-6" r="5" fill="{ink}" opacity=".25"/><circle cx="9" cy="8" r="7" fill="{ink}" opacity=".2"/>'
                f'<path d="M-32,-20 l1.6,4 4,1.6 -4,1.6 -1.6,4 -1.6,-4 -4,-1.6 4,-1.6Z M30,-26 l1.4,3.4 3.4,1.4 -3.4,1.4 -1.4,3.4 -1.4,-3.4 -3.4,-1.4 3.4,-1.4Z" fill="{f}"/>'
                f'<path d="M-34,24 L34,24" stroke="{f}" stroke-width="3" stroke-linecap="round" opacity=".6"/>')
    if kind == 'gem':
        return f'<path d="M0,-24 L16,0 L0,24 L-16,0Z" fill="{f}"/><path d="M0,-24 L0,24 M-16,0 L16,0" stroke="{ink}" stroke-width="1.4" opacity=".4"/>'
    return ''

def enemy_glyph(kind):
    """original Wispwick-style enemy glyphs (code-drawn), box about +-24"""
    if kind == 'treant':
        return ('<path d="M-12,24 L-8,0 L-16,-10 L-6,-6 L-4,-20 L0,-8 L6,-22 L8,-6 L18,-12 L9,2 L13,24Z" fill="#6b4a32" stroke="#2e1e14" stroke-width="2"/>'
                '<circle cx="-14" cy="-14" r="9" fill="#7fb36a" stroke="#2f5a2c" stroke-width="2"/><circle cx="14" cy="-18" r="10" fill="#8fc476" stroke="#2f5a2c" stroke-width="2"/><circle cx="0" cy="-24" r="9" fill="#6fa65e" stroke="#2f5a2c" stroke-width="2"/>'
                '<circle cx="-4" cy="2" r="2.4" fill="#ffd27a"/><circle cx="5" cy="2" r="2.4" fill="#ffd27a"/>')
    if kind == 'hare':
        return ('<path d="M-10,-4 L-14,-26 L-6,-24 L-2,-6Z M10,-4 L14,-26 L6,-24 L2,-6Z" fill="#e6f3ff" stroke="#7aa8d6" stroke-width="2"/>'
                '<ellipse cx="0" cy="8" rx="17" ry="15" fill="#f2f9ff" stroke="#7aa8d6" stroke-width="2"/>'
                '<circle cx="-6" cy="6" r="2.4" fill="#2c5a92"/><circle cx="6" cy="6" r="2.4" fill="#2c5a92"/><path d="M-2,12 L2,12 L0,15Z" fill="#e58aa6"/>'
                '<path d="M-20,-16 l3,3 -3,3 -3,-3Z M20,-6 l3,3 -3,3 -3,-3Z" fill="#cfe9ff"/>')
    if kind == 'crawler':
        return ('<path d="M-22,10 C-14,-6 14,-6 22,10 C10,4 -10,4 -22,10Z" fill="#6b4a32" stroke="#2e1e14" stroke-width="2"/>'
                '<path d="M-20,12 L-26,22 M-10,14 L-12,24 M10,14 L12,24 M20,12 L26,22" stroke="#6b4a32" stroke-width="4" stroke-linecap="round"/>'
                '<circle cx="-5" cy="2" r="2.4" fill="#ffd27a"/><circle cx="5" cy="2" r="2.4" fill="#ffd27a"/>')
    return ''

def pt_on(p0, c, p1, t):
    return ((1-t)**2*p0[0] + 2*(1-t)*t*c[0] + t*t*p1[0], (1-t)**2*p0[1] + 2*(1-t)*t*c[1] + t*t*p1[1])

class Web:
    def __init__(s, k=1.0, dia=11, dot=4):
        s.k = k; s.dia = dia; s.dot = dot
        s.gl = []; s.th = []; s.n = []; s.top = []
    def font(s, px): return f'{px*s.k:.1f}'

    def thread(s, pts, col, on, dim=False):
        if len(pts) == 2:
            d = 'M%.1f,%.1f L%.1f,%.1f' % (pts[0] + pts[1])
        else:
            d = 'M%.1f,%.1f Q%.1f,%.1f %.1f,%.1f' % (pts[0] + pts[1] + pts[2])
        if on:
            s.gl.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="9" opacity=".5" filter="url(#gl)"/>')
            s.th.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="3" stroke-linecap="round"/>')
        else:
            s.th.append(f'<path d="{d}" fill="none" stroke="#a9b3d0" stroke-width="2" opacity="{.3 if dim else .55}" stroke-dasharray="3 6" stroke-linecap="round"/>')

    def item(s, x, y, diamond, state, col):
        if diamond:
            r = s.dia
            if state == 'lit':
                s.gl.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*2}" fill="{col}" opacity=".45" filter="url(#gl)"/>')
                s.n.append(f'<g transform="translate({x:.1f},{y:.1f}) rotate(45)"><rect x="{-r}" y="{-r}" width="{2*r}" height="{2*r}" rx="3" fill="{col}" stroke="#fff3dc" stroke-width="2"/></g><circle cx="{x:.1f}" cy="{y:.1f}" r="{r*.32:.1f}" fill="#fffbe8"/>')
            else:
                if state == 'avail':
                    s.gl.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*2.3}" fill="#ffd27a" opacity=".6" filter="url(#gl)"/>')
                    s.top.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*1.9}" fill="none" stroke="#ffd27a" stroke-width="2.5"/>')
                st = '#ffd27a' if state == 'avail' else ('#7f89a8' if state == 'dim' else '#b7c0da')
                fl = '#5b4a38' if state == 'avail' else ('#3a4262' if state == 'dim' else '#59648a')
                s.n.append(f'<g transform="translate({x:.1f},{y:.1f}) rotate(45)" opacity="{.9 if state=="dim" else 1}"><rect x="{-r}" y="{-r}" width="{2*r}" height="{2*r}" rx="3" fill="{fl}" stroke="{st}" stroke-width="2"/></g>')
                if state == 'avail': s.n.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*.3:.1f}" fill="#ffd27a"/>')
        else:
            r = s.dot
            if state == 'lit':
                s.gl.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*2.4}" fill="{col}" opacity=".55" filter="url(#gl)"/>')
                s.n.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#fff6e0" stroke="{col}" stroke-width="2"/>')
            else:
                s.n.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#6a7699" stroke="#b7c0da" stroke-width="1.4" opacity="{.5 if state=="dim" else .9}"/>')

    def medallion(s, key, state, name, sub, prog=None, hot=False, r=38, cond=None):
        x, y, kind, col = LM[key]
        g = []
        lit = state == 'lit'
        if lit: s.gl.append(f'<circle cx="{x}" cy="{y}" r="{r*1.75}" fill="{col}" opacity=".55" filter="url(#gl2)"/>')
        if state == 'avail': s.gl.append(f'<circle cx="{x}" cy="{y}" r="{r*1.8}" fill="#ffd27a" opacity=".6" filter="url(#gl2)"/>')
        ring = '#e6c27a' if state != 'locked' else '#9aa4c0'
        if lit or state == 'avail':
            s.n.append(f'<defs><radialGradient id="md-{key}" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="{col}" stop-opacity=".55"/><stop offset=".7" stop-color="#232c52"/><stop offset="1" stop-color="#171d3a"/></radialGradient></defs>')
        inner = f'url(#md-{key})' if state != 'locked' else 'url(#mdl)'
        fillc = col if lit else ('#fff0c8' if state == 'avail' else '#aab4d0')
        dash = ' stroke-dasharray="7 5"' if state == 'locked' else ''
        g.append(f'<circle cx="{x}" cy="{y}" r="{r+7}" fill="#10152c" opacity=".7"/>')
        g.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{inner}" stroke="{ring}" stroke-width="{4.5 if state!="locked" else 3.5}"{dash}/>')
        if state != 'locked':
            g.append(f'<circle cx="{x}" cy="{y}" r="{r-5}" fill="none" stroke="#fff3dc" stroke-opacity=".35" stroke-width="1.5"/>')
        g.append(f'<g transform="translate({x},{y}) scale({r/40:.3f})" opacity="{1 if state!="locked" else .8}">{icon(kind, fillc)}</g>')
        if state == 'locked':
            g.append(f'<g transform="translate({x+r*0.62:.1f},{y-r*0.72:.1f})"><circle r="11" fill="#252d4c" stroke="#b7c0da" stroke-width="2"/><rect x="-5" y="-1" width="10" height="8" rx="1.5" fill="#d3d9ec"/><path d="M-3.4,-1 v-3 a3.4,3.4 0 0 1 6.8,0 v3" fill="none" stroke="#d3d9ec" stroke-width="1.8"/></g>')
        if prog is not None and state != 'locked':
            R = r + 13; C = 2*math.pi*R
            g.append(f'<circle cx="{x}" cy="{y}" r="{R}" fill="none" stroke="#10152c" stroke-opacity=".55" stroke-width="5"/>')
            g.append(f'<circle cx="{x}" cy="{y}" r="{R}" fill="none" stroke="{col}" stroke-width="5" stroke-linecap="round" stroke-dasharray="{C*prog:.1f} {C:.1f}" transform="rotate(-90 {x} {y})"/>')
        if hot:
            g.append(f'<circle cx="{x}" cy="{y}" r="{r+14}" fill="none" stroke="#fff3dc" stroke-width="3"/><circle cx="{x}" cy="{y}" r="{r+20}" fill="none" stroke="#ffd27a" stroke-width="2" opacity=".7"/>')
        if state == 'avail':
            s.top.append(f'<circle cx="{x}" cy="{y}" r="{r+16}" fill="none" stroke="#ffd27a" stroke-width="3"/><circle cx="{x}" cy="{y}" r="{r+23}" fill="none" stroke="#ffd27a" stroke-width="1.5" opacity=".5"/>')
        s.n.append(''.join(g))
        ly = y + r + (30 if prog is None or state == 'locked' else 40)
        nmc = '#fff3dc' if state != 'locked' else '#d3d9ec'
        t = f'<text x="{x}" y="{ly}" text-anchor="middle" class="nm" font-size="{s.font(24)}" fill="{nmc}">{name}</text>'
        if sub:
            sc = col if lit else ('#ffd27a' if state == 'avail' else '#c4cce2')
            t += f'<text x="{x}" y="{ly+20*s.k:.1f}" text-anchor="middle" class="sb" font-size="{s.font(15)}" fill="{sc}">{sub}</text>'
        if cond and state == 'locked':
            w = max(150, len(cond)*7.4) * s.k; h = 26*s.k
            t += (f'<rect x="{x-w/2:.1f}" y="{ly+28*s.k:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{h/2:.1f}" fill="#12172c" fill-opacity=".9" stroke="#b7c0da" stroke-width="1.2"/>'
                  f'<text x="{x}" y="{ly+46*s.k:.1f}" text-anchor="middle" class="sb" font-size="{s.font(14)}" fill="#e6ebfa" style="stroke:none">{cond}</text>')
        s.top.append(t)

    def chip(s, x, y, txt, strong=''):
        w = (len(txt)+len(strong))*7.6*s.k + 30*s.k; h = 30*s.k
        s.top.append(f'<rect x="{x-w/2:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{h/2:.1f}" fill="#12172c" fill-opacity=".93" stroke="#ffd27a" stroke-width="2"/>'
                     f'<text x="{x}" y="{y+h*0.68:.1f}" text-anchor="middle" class="sb" font-size="{s.font(15)}" fill="#fff3dc" style="stroke:none">{txt}<tspan fill="#ffd27a"> {strong}</tspan></text>')

    def svg(s): return ''.join(s.gl) + ''.join(s.th) + ''.join(s.n) + ''.join(s.top)

def lantern(x, y, s=1.0):
    ticks = ''.join(f'<line x1="{58*math.cos(a*math.pi/6):.1f}" y1="{58*math.sin(a*math.pi/6):.1f}" x2="{66*math.cos(a*math.pi/6):.1f}" y2="{66*math.sin(a*math.pi/6):.1f}" stroke="#e6c27a" stroke-width="3"/>' for a in range(12))
    return f'''<g transform="translate({x},{y}) scale({s})"><circle r="120" fill="url(#hubg)"/>
<circle r="64" fill="#1a2144" fill-opacity=".85" stroke="#e6c27a" stroke-width="4"/><circle r="55" fill="none" stroke="#fff3dc" stroke-opacity=".35" stroke-width="1.5"/>{ticks}
<path d="M-4,-50 q4,-10 8,0" fill="none" stroke="#e6c27a" stroke-width="3.5"/>
<path d="M-14,-40 L14,-40 L18,-32 L-18,-32Z" fill="#c8923f" stroke="#7a5524" stroke-width="1.5"/>
<path d="M-18,-32 L18,-32 L22,22 L-22,22Z" fill="url(#lanbody)" stroke="#7a5524" stroke-width="2"/>
<path d="M-26,22 L26,22 L22,32 L-22,32Z" fill="#c8923f" stroke="#7a5524" stroke-width="1.5"/>
<path d="M0,-22 C10,-8 10,4 0,14 C-10,4 -10,-8 0,-22Z" fill="#fffbe8"/><path d="M0,-12 C5,-4 5,3 0,8 C-5,3 -5,-4 0,-12Z" fill="#ffd27a"/></g>'''

DEFS = '''<defs>
<filter id="gl" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="gl2" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="bl60" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="55"/></filter>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .85  0 0 0 .07 0"/></filter>
<radialGradient id="hubg"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset=".25" stop-color="#ffc766" stop-opacity=".55"/><stop offset=".6" stop-color="#ff9f45" stop-opacity=".16"/><stop offset="1" stop-color="#ff9f45" stop-opacity="0"/></radialGradient>
<linearGradient id="lanbody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe6a0"/><stop offset="1" stop-color="#ffb457"/></linearGradient>
<radialGradient id="mdl" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="#46507a"/><stop offset="1" stop-color="#2a3150"/></radialGradient>
<radialGradient id="vig" cx=".5" cy=".5" r=".8"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05070f" stop-opacity=".45"/></radialGradient>
<style>.nm{font-family:"Chancery",Georgia,serif;paint-order:stroke;stroke:#0b1020;stroke-width:5px;stroke-linejoin:round}
.sb{font-family:"Alegreya Sans","Trebuchet MS",sans-serif;font-weight:700;paint-order:stroke;stroke:#0b1020;stroke-width:4px;stroke-linejoin:round}</style>
</defs>'''

def sky(w, h, restored, fog=None, hub=HUB):
    g0, g1, g2 = ('#1f2c5a', '#37508a', '#6a6a88') if restored else ('#222c50', '#3c4a74', '#6b6f8a')
    o = f'<defs><linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{g0}"/><stop offset=".55" stop-color="{g1}"/><stop offset="1" stop-color="{g2}"/></linearGradient></defs>'
    o += f'<rect width="{w}" height="{h}" fill="url(#skyg)"/><g style="mix-blend-mode:screen">'
    o += f'<ellipse cx="{hub[0]}" cy="{hub[1]}" rx="440" ry="300" fill="#ff9f45" opacity="{.42 if restored else .38}" filter="url(#bl60)"/>'
    o += f'<ellipse cx="{hub[0]}" cy="{hub[1]}" rx="200" ry="150" fill="#ffd27a" opacity=".3" filter="url(#bl60)"/>'
    for (x, y, rx, ry, c, a) in (fog or []):
        o += f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" opacity="{a}" filter="url(#bl60)"/>'
    if not restored:
        o += '<ellipse cx="400" cy="400" rx="200" ry="150" fill="#9aa6c8" opacity=".16" filter="url(#bl60)"/><ellipse cx="1100" cy="300" rx="200" ry="170" fill="#9aa6c8" opacity=".14" filter="url(#bl60)"/>'
    o += '</g>'
    rnd = random.Random(5)
    for _ in range(110):
        o += f'<circle cx="{rnd.uniform(0,w):.0f}" cy="{rnd.uniform(0,h):.0f}" r="{rnd.uniform(.5,1.8):.1f}" fill="#fff6e0" opacity="{rnd.uniform(.2,.6):.2f}"/>'
    o += '<g fill="#111a33" opacity=".85">'
    x = -10
    while x < w + 20:
        th = rnd.uniform(40, 84); tw = rnd.uniform(18, 30)
        o += f'<path d="M{x:.0f},{h} L{x+tw/2:.0f},{h-th:.0f} L{x+tw:.0f},{h}Z"/>'
        x += rnd.uniform(14, 24)
    o += '</g>' + f'<rect width="{w}" height="{h}" filter="url(#grain)"/><rect width="{w}" height="{h}" fill="url(#vig)"/>'
    return o

def hub_thread(w, key, n_lit, col, diam=(3, 7), avail=None, cvx=0.0, N=9):
    x, y, kind, c = LM[key]
    hx, hy = HUB
    mx, my = (hx+x)/2, (hy+y)/2
    dx, dy = x-hx, y-hy
    cx, cy = (mx - dy*0.16, my + dx*0.16) if not cvx else (mx + dy*cvx, my - dx*cvx)
    w.thread([HUB, (cx, cy), (x, y)], col, n_lit > 0)
    samples = [pt_on(HUB, (cx, cy), (x, y), i/200) for i in range(201)]
    cum = [0]
    for i in range(1, 201):
        cum.append(cum[-1] + math.hypot(samples[i][0]-samples[i-1][0], samples[i][1]-samples[i-1][1]))
    a, b = 96, cum[-1] - 60
    for i in range(N):
        d = a + (b-a)*i/(N-1)
        j = min(range(201), key=lambda q: abs(cum[q]-d))
        st = 'lit' if i < n_lit else ('avail' if avail == i else 'off')
        w.item(samples[j][0], samples[j][1], i in diam, st, col)

def branches(w, key, counts, col, avail=None, spread=(0, .8, -.8), rotate=0.0, n=6):
    x, y, kind, c = LM[key]
    a0 = math.atan2(y-HUB[1], x-HUB[0]) + rotate
    out = None
    for bi, cnt in enumerate(counts):
        a = a0 + spread[bi]
        pts = [(x+(48 if i == 0 else 62+19*(i-1))*math.cos(a), y+(48 if i == 0 else 62+19*(i-1))*math.sin(a)) for i in range(n)]
        w.thread([pts[0], pts[-1]], col, cnt > 0)
        for i, p in enumerate(pts):
            st = 'lit' if i < cnt else ('avail' if avail == (bi, i) else 'off')
            w.item(p[0], p[1], i in (2, n-1), st, col)
            if avail == (bi, i): out = p
    return out

def evo(w, key, state, parent, col):
    x, y, kind, name = EVO[key]
    px, py = LM[parent][0], LM[parent][1]
    w.thread([(px, py), (x, y)], col, state == 'lit')
    for t in (.3, .45, .6):
        w.item(px+(x-px)*t, py+(y-py)*t, False, 'lit' if state == 'lit' else 'off', col)
    if state == 'lit': w.gl.append(f'<circle cx="{x}" cy="{y}" r="44" fill="{col}" opacity=".6" filter="url(#gl2)"/>')
    st = col if state == 'lit' else '#aab4d0'
    w.n.append(f'<g transform="translate({x},{y})"><g transform="rotate(45)"><rect x="-26" y="-26" width="52" height="52" rx="10" fill="{"#262f59" if state=="lit" else "#3a4366"}" stroke="{"#e6c27a" if state=="lit" else "#9aa4c0"}" stroke-width="4"{"" if state=="lit" else " stroke-dasharray=\"6 5\""}/></g><g transform="scale(.9)">{icon("gem", st)}</g></g>')
    w.top.append(f'<text x="{x}" y="{y+50}" text-anchor="middle" class="nm" font-size="{w.font(19)}" fill="{"#fff3dc" if state=="lit" else "#d3d9ec"}">{name}</text><text x="{x}" y="{y+50+18*w.k:.1f}" text-anchor="middle" class="sb" font-size="{w.font(13)}" fill="{"#ffd27a" if state=="lit" else "#c4cce2"}">{"Evolution" if state=="lit" else "Evolution - recipe hidden"}</text>')

def far_region(w, cx, cy):
    """dim outer ring with its own emblem: shows there is more to reach"""
    R = 82
    w.thread([(1150, 510), (cx-50, cy-62)], '#9aa4c0', False, dim=True)
    w.n.append(f'<circle cx="{cx}" cy="{cy}" r="{R}" fill="none" stroke="#a9b3d0" stroke-opacity=".6" stroke-width="2.5" stroke-dasharray="3 6"/>')
    for i in range(12):
        a = i*math.pi/6
        px, py = cx+R*math.cos(a), cy+R*math.sin(a)
        w.item(px, py, i % 3 == 0, 'dim' if i % 3 == 0 else 'off', '#9aa4c0')
        w.item(cx+(R-30)*math.cos(a+math.pi/12), cy+(R-30)*math.sin(a+math.pi/12), False, 'dim', '#9aa4c0')
    w.n.append(f'<g transform="translate({cx},{cy})" opacity=".95"><circle r="26" fill="#2a3150" stroke="#8791ad" stroke-width="3" stroke-dasharray="5 4"/><g transform="scale(.6)">{icon("night", "#aab4d0")}</g></g>')
    w.top.append(f'<text x="{cx-96}" y="{cy-76}" text-anchor="end" class="nm" font-size="{w.font(18)}" fill="#c4cce2">The Far Hollow</text><text x="{cx-96}" y="{cy-76+18*w.k:.1f}" text-anchor="end" class="sb" font-size="{w.font(13)}" fill="#c4cce2">Chapter 3 and beyond</text>')

def build_web(mode, hover=None, k=1.0, far=True):
    w = Web(k=k)
    first = mode == 'first'
    if far and not first: far_region(w, 1215, 660)
    hub_thread(w, 'wolf', 0 if first else 8, COL['wolf'], avail=0 if first else None)
    hub_thread(w, 'raven', 0 if first else 6, COL['raven'], cvx=.1)
    hub_thread(w, 'bolt', 0 if first else 5, COL['bolt'], cvx=.12)
    hub_thread(w, 'chain', 0 if first else 3, COL['chain'], cvx=-.05, avail=None if first else 3)
    hub_thread(w, 'orbit', 0 if first else 9, COL['orbit'], cvx=0, N=7, diam=(2, 4))
    hub_thread(w, 'hush', 0, COL['hush'], cvx=0, N=7, diam=(3,))
    hub_thread(w, 'elias', 0 if first else 4, COL['elias'], cvx=.2)
    hub_thread(w, 'lucinda', 0, COL['lucinda'], cvx=-.1)
    hub_thread(w, 'dusk', 0 if first else 9, COL['dusk'], cvx=.12)
    hub_thread(w, 'night', 0, COL['night'], cvx=.1, N=5, diam=(2,))
    ap = None
    if first:
        ap = branches(w, 'wolf', [0, 0], COL['wolf'], avail=(0, 0), spread=(.55, -.5), n=5)
        branches(w, 'orbit', [0, 0, 0], COL['orbit'], n=5); branches(w, 'raven', [0, 0], COL['raven'], spread=(-.5, -1.0), n=4)
        branches(w, 'bolt', [0, 0], COL['bolt'], spread=(.2, 1.0), n=4); branches(w, 'chain', [0, 0], COL['chain'], spread=(-.5, .3), n=4)
        branches(w, 'elias', [0, 0], COL['elias'], spread=(.5, -.7), n=4)
    else:
        branches(w, 'wolf', [5, 4], COL['wolf'], spread=(.55, -.5), n=5); branches(w, 'orbit', [5, 3, 1], COL['orbit'], n=5)
        branches(w, 'raven', [4, 2], COL['raven'], spread=(-.5, -1.0), n=4); branches(w, 'bolt', [4, 1], COL['bolt'], spread=(.2, 1.0), n=4)
        branches(w, 'chain', [0, 0], COL['chain'], spread=(-.5, .3), avail=(0, 0), n=4); branches(w, 'elias', [4, 2], COL['elias'], spread=(.5, -.7), n=4)
    evo(w, 'trails', 'off' if first else 'lit', 'wolf', COL['wolf'])
    evo(w, 'vesper', 'off', 'raven', COL['raven'])
    w.n.append(lantern(HUB[0], HUB[1]))
    if first:
        w.medallion('wolf', 'lit', 'Ghost Wolves', 'Awake - your first friends', prog=0.0)
        w.medallion('orbit', 'lit', 'Holy Orbit', 'Awake', prog=0.0)
        w.medallion('raven', 'avail', 'Raven Flock', 'Wake: 300 gold', prog=0.0)
        w.medallion('bolt', 'avail', 'Spirit Bolts', 'Wake: 500 gold', prog=0.0)
        w.medallion('chain', 'locked', 'Chain Lightning', 'Asleep', cond='Wake: 1,200 gold')
        w.medallion('elias', 'locked', 'Elias', 'New hero', cond='Reach hero level 3')
        w.medallion('lucinda', 'locked', 'Lucinda', 'Dragon-kin hero', cond='A secret waits...')
        w.medallion('hush', 'locked', 'Hushbell Hamlet', 'Chapter 2', cond='Clear Chapter 1 first')
        w.medallion('dusk', 'locked', 'Deep Dusk', 'Harder night', cond='Win a Twilight run', r=34)
        w.medallion('night', 'locked', 'Long Night', 'Hardest night', cond='Clear Deep Dusk', r=34)
        if ap: w.chip(ap[0]-5, ap[1]+16, 'Free lantern', '')
    else:
        w.medallion('wolf', 'lit', 'Ghost Wolves', '12 of 18 lit', prog=12/18)
        w.medallion('orbit', 'lit', 'Holy Orbit', '9 of 18 lit', prog=9/18)
        w.medallion('raven', 'lit', 'Raven Flock', '8 of 18 lit', prog=8/18)
        w.medallion('bolt', 'lit', 'Spirit Bolts', '6 of 18 lit', prog=6/18)
        w.medallion('chain', 'avail', 'Chain Lightning', 'Wake: 1,200 gold', prog=0.0)
        w.medallion('elias', 'lit', 'Elias', 'Hero - awake', prog=4/10)
        w.medallion('lucinda', 'locked', 'Lucinda', 'Dragon-kin hero', cond='To wake: Wren level 5 (3/5)')
        w.medallion('hush', 'locked', 'Hushbell Hamlet', 'Chapter 2', cond='To wake: Ch.1 on Deep Dusk 0/1', hot=hover == 'hush')
        w.medallion('dusk', 'lit', 'Deep Dusk', 'Night awake', prog=.5, r=34)
        w.medallion('night', 'locked', 'Long Night', 'Hardest night', cond='To wake: Deep Dusk 0/3', r=34)
    return w

CSS = '''
*{box-sizing:border-box;margin:0;padding:0}html,body{background:#0b101c;overflow:hidden}
.scr{position:relative;overflow:hidden;font-family:"Alegreya Sans","Trebuchet MS",sans-serif;color:#fff3dc}
.abs{position:absolute}.disp{font-family:"Chancery",Georgia,serif}
.pill{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 16px;border-radius:999px;background:linear-gradient(180deg,rgba(60,72,104,.88),rgba(26,32,54,.9));border:1px solid rgba(230,194,122,.6);box-shadow:0 2px 10px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.14);font-size:16px;font-weight:700;white-space:nowrap}
.dot{display:inline-block;width:16px;height:16px;border-radius:50%}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;height:46px;border-radius:14px;font-weight:700;font-size:18px;background:linear-gradient(180deg,rgba(66,78,112,.92),rgba(30,37,62,.94));border:1.5px solid rgba(230,194,122,.7);box-shadow:0 3px 10px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.16)}
.btn.play{height:58px;font-size:26px;font-family:"Chancery",Georgia,serif;font-weight:400;color:#3a2410;background:linear-gradient(180deg,#ffe9a8,#ffbf5c);border-color:#fff3dc;box-shadow:0 0 26px rgba(255,200,100,.55),0 4px 12px rgba(0,0,0,.4)}
.hero{position:absolute;left:0;top:0;bottom:0;width:262px;background:linear-gradient(180deg,rgba(18,24,46,.94),rgba(34,38,66,.9) 60%,rgba(70,52,60,.9));border-right:1.5px solid rgba(230,194,122,.55);box-shadow:8px 0 30px rgba(0,0,0,.4)}
.top{position:absolute;left:284px;right:16px;top:12px;display:flex;align-items:center;gap:12px}
.meter{display:flex;align-items:center;gap:10px;height:42px;padding:0 16px 0 10px;border-radius:999px;background:linear-gradient(180deg,rgba(60,72,104,.88),rgba(26,32,54,.9));border:1px solid rgba(230,194,122,.6);font-weight:700;font-size:15px}
.meter .bar{width:130px;height:10px;border-radius:6px;background:#1a2036;border:1px solid #6a7599;overflow:hidden}.meter .bar i{display:block;height:100%;background:linear-gradient(90deg,#ffb84a,#ffe9a8)}
.meter .ic{width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#fff8e6,#ffc766 55%,#c8843a);box-shadow:0 0 12px rgba(255,200,100,.7)}
.next{position:absolute;display:flex;gap:10px;padding:8px 12px;align-items:stretch;background:linear-gradient(180deg,rgba(40,50,80,.9),rgba(16,21,38,.93));border:1.5px solid rgba(230,194,122,.6);border-radius:16px;box-shadow:0 8px 28px rgba(0,0,0,.45)}
.next .hd{font-family:"Chancery",Georgia,serif;font-size:22px;color:#ffd27a;align-self:center;width:62px;line-height:1.05}
.card{flex:1;border-radius:12px;padding:6px 10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:0}
.card.hot{border-color:rgba(255,210,122,.85);background:rgba(255,210,122,.14)}
.card .t{font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.card .s{font-size:14px;color:#d6dcee;display:flex;justify-content:space-between;gap:6px;white-space:nowrap}.card .s b{color:#ffd27a}
.card .pb{height:6px;border-radius:4px;background:#1a2036;overflow:hidden}.card .pb i{display:block;height:100%;background:linear-gradient(90deg,#9fd8ff,#e3f5ff)}
.cur{position:absolute;left:20px;right:20px;bottom:12px;height:44px;justify-content:space-around;display:flex;align-items:center;gap:14px;padding:0 16px;border-radius:16px;background:linear-gradient(180deg,rgba(40,50,80,.9),rgba(16,21,38,.93));border:1.5px solid rgba(230,194,122,.6);box-shadow:0 8px 28px rgba(0,0,0,.45);font-weight:700;font-size:18px}
.zoom{position:absolute;right:16px;top:330px;display:flex;flex-direction:column;gap:8px}.zoom .pill{width:42px;height:42px;padding:0;justify-content:center;font-size:22px}
.banner{position:absolute;display:flex;flex-direction:column;align-items:stretch}
.banner .rib{padding:10px 28px 10px 20px;background:linear-gradient(180deg,#fff0cf,#f3d79a);color:#3a2410;font-weight:700;font-size:19px;border-radius:12px 12px 4px 4px;border:2px solid #fff8e6;box-shadow:0 0 28px rgba(255,210,122,.65),0 6px 18px rgba(0,0,0,.5);white-space:nowrap;width:430px}
.banner .rib small{font-weight:400;font-size:14px;display:block;color:#6a4a22;margin-top:1px}
.tile{margin:6px 0 0 14px;width:336px;padding:10px 14px;border-radius:14px;background:linear-gradient(180deg,rgba(46,58,92,.97),rgba(18,24,44,.98));border:1.5px solid rgba(230,194,122,.75);box-shadow:0 8px 24px rgba(0,0,0,.5);display:flex;gap:12px}
.tile .bd{flex:none;width:58px;height:58px;border-radius:50%;background:radial-gradient(circle,#3a4a52,#1b2238);border:2.5px solid #e6c27a}
.tile .c{font-size:16px;font-weight:700;display:flex;justify-content:space-between;gap:10px}.tile .c b{color:#ffd27a}.tile .p{font-size:14px;color:#c4cce2;margin-top:1px}
.tile .pb{height:7px;border-radius:4px;background:#1a2036;overflow:hidden;margin:6px 0 4px}.tile .pb i{display:block;height:100%;background:linear-gradient(90deg,#9fd8ff,#e3f5ff)}
.tile .g{font-size:15px;color:#fff3dc;margin-top:4px;padding-top:5px;border-top:1px solid rgba(255,255,255,.18);display:flex;justify-content:space-between}.tile .g b{color:#ffd27a}
'''

WREN = '''<svg width="236" height="300" viewBox="0 0 236 300"><defs><radialGradient id="wg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient><linearGradient id="lb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset="1" stop-color="#ffb457"/></linearGradient></defs>
<circle cx="168" cy="190" r="86" fill="url(#wg)"/>
<g opacity=".92" transform="translate(30,232)"><ellipse cx="22" cy="26" rx="26" ry="16" fill="#c4e9ff"/><path d="M0,6 L10,-12 L20,4 L36,4 L46,-12 L52,8 Q50,26 26,24 Q4,24 0,6Z" fill="#e6f6ff" stroke="#8cc3ee" stroke-width="2"/><circle cx="14" cy="10" r="2.4" fill="#2c5a92"/><circle cx="34" cy="10" r="2.4" fill="#2c5a92"/><ellipse cx="24" cy="16" rx="3" ry="2" fill="#2c5a92"/></g>
<path d="M48,300 C46,236 70,206 118,206 C166,206 190,236 188,300Z" fill="#3f8a96" stroke="#25606c" stroke-width="3"/>
<path d="M82,214 L118,246 L154,214 L148,206 L88,206Z" fill="#fff0d0" stroke="#d8b26a" stroke-width="2"/>
<path d="M72,206 C90,226 146,226 164,206 L168,224 C146,246 90,246 68,224Z" fill="#f08a52" stroke="#b9572e" stroke-width="2.5"/>
<path d="M146,230 C158,250 156,278 150,292 L136,286 C142,270 140,252 134,238Z" fill="#f08a52" stroke="#b9572e" stroke-width="2.5"/>
<!-- head -->
<circle cx="118" cy="132" r="64" fill="#f8d6ae" stroke="#c98d5c" stroke-width="3"/>
<path d="M52,128 C48,72 90,52 120,54 C156,52 190,76 184,128 C176,100 150,86 124,92 C100,96 70,92 52,128Z" fill="#6b4230" stroke="#3f2418" stroke-width="3"/>
<path d="M60,100 C48,120 54,150 64,160 C60,140 62,120 70,106Z M176,100 C188,120 182,150 172,160 C176,140 174,120 166,106Z" fill="#6b4230"/>
<path d="M92,56 C98,40 110,32 124,34 C136,34 146,44 148,58" fill="#8a5a40" stroke="#3f2418" stroke-width="2.5"/>
<ellipse cx="92" cy="138" rx="9" ry="12" fill="#2a1a22"/><ellipse cx="144" cy="138" rx="9" ry="12" fill="#2a1a22"/>
<circle cx="95" cy="133" r="3.6" fill="#fff"/><circle cx="147" cy="133" r="3.6" fill="#fff"/><circle cx="90" cy="143" r="1.8" fill="#fff"/><circle cx="142" cy="143" r="1.8" fill="#fff"/>
<ellipse cx="74" cy="160" rx="11" ry="7" fill="#f2907a" opacity=".6"/><ellipse cx="162" cy="160" rx="11" ry="7" fill="#f2907a" opacity=".6"/>
<path d="M104,164 Q118,176 132,164" fill="none" stroke="#8a4a3a" stroke-width="3.5" stroke-linecap="round"/>
<!-- lantern hand -->
<path d="M190,246 C204,232 208,214 204,196" fill="none" stroke="#3f8a96" stroke-width="20" stroke-linecap="round"/>
<circle cx="204" cy="192" r="11" fill="#f8d6ae" stroke="#c98d5c" stroke-width="2"/>
<circle cx="204" cy="222" r="46" fill="url(#wg)"/>
<path d="M196,206 q8,-14 16,0" fill="none" stroke="#c8923f" stroke-width="3"/>
<rect x="190" y="206" width="28" height="36" rx="5" fill="url(#lb)" stroke="#7a5524" stroke-width="2.5"/>
<path d="M204,214 C210,224 210,232 204,238 C198,232 198,224 204,214Z" fill="#fffbe8"/>
<rect x="186" y="240" width="36" height="7" rx="3" fill="#c8923f" stroke="#7a5524" stroke-width="1.5"/></svg>'''

def hero_panel(extra=''):
    return f'''<div class="hero"><div class="abs disp" style="left:0;right:0;top:14px;text-align:center;font-size:20px;color:#d8c9a0">Your hero</div>
<div class="abs" style="left:13px;top:42px">{WREN}</div>
<div class="abs disp" style="left:0;right:0;top:338px;text-align:center;font-size:38px;line-height:1;text-shadow:0 2px 10px #000">Wren</div>
<div class="abs" style="left:0;right:0;top:382px;text-align:center;font-size:15px;font-weight:700;color:#ffd27a">Lantern-bearer - Level 4</div>
<div class="abs" style="left:26px;right:26px;top:424px;display:flex;flex-direction:column;gap:10px"><div class="btn play">Play</div><div class="btn">Almanac</div>
<div class="btn">Goals <span style="margin-left:6px;background:#ffd27a;color:#3a2410;border-radius:99px;padding:0 9px;font-size:15px">3</span></div><div class="btn" style="height:44px;font-size:17px;color:#d6dcee">Back</div></div>{extra}</div>'''

def top_bar(pct, can):
    return f'''<div class="top"><div class="disp" style="font-size:34px;margin-right:8px;text-shadow:0 2px 10px #000">Restore the Hollow</div>
<div class="meter"><div class="ic"></div><span>The Hollow restored</span><div class="bar"><i style="width:{pct}%"></i></div><span style="color:#ffd27a">{pct}%</span></div>
<span class="pill" style="color:#ffd27a">{can}</span><span style="margin-left:auto;display:flex;gap:6px"><span class="pill" style="width:42px;padding:0;justify-content:center;font-size:22px">+</span><span class="pill" style="width:42px;padding:0;justify-content:center;font-size:22px">-</span></span></div>'''

def cur(g, s):
    return (f'<div class="cur"><span style="display:flex;gap:8px;align-items:center"><i class="dot" style="width:20px;height:20px;background:radial-gradient(circle at 40% 35%,#fff2b8,#ffb84a)"></i>{g}</span>'
            f'<span style="display:flex;gap:8px;align-items:center"><i class="dot" style="width:20px;height:20px;background:radial-gradient(circle at 40% 35%,#e6dcff,#8f78e8)"></i>{s}</span></div>')

def page(w_, h_, sky_svg, web_svg, html_over, extra_css=''):
    return f'''<!doctype html><html><head><meta charset="utf-8"><title>Wispwick tree mockup R2</title><style>{FONTS}{CSS}{extra_css}</style></head><body>
<div class="scr" style="width:{w_}px;height:{h_}px"><svg class="abs" style="left:0;top:0" width="{w_}" height="{h_}" viewBox="0 0 {w_} {h_}">{DEFS}{sky_svg}{web_svg}</svg>{html_over}</div></body></html>'''

NEXT_FIRST = ('<div class="next" style="left:430px;bottom:14px;width:700px;height:76px"><div class="hd">Next lights</div>'
 '<div class="card hot"><div class="t">Free first lantern</div><div class="s"><b>Free</b><span>Ghost Wolves</span></div></div>'
 '<div class="card"><div class="t">Wake Raven Flock</div><div class="s"><b>300 gold</b><span>need 120 more</span></div><div class="pb"><i style="width:60%"></i></div></div>'
 '<div class="card"><div class="t">Wake Spirit Bolts</div><div class="s"><b>500 gold</b><span>need 320 more</span></div><div class="pb"><i style="width:36%"></i></div></div></div>')
NEXT_MID = ('<div class="next" style="left:430px;bottom:14px;width:700px;height:76px"><div class="hd">Next lights</div>'
 '<div class="card hot"><div class="t">Wake Chain Lightning</div><div class="s"><b>1,200 gold</b><span>you can light it</span></div></div>'
 '<div class="card"><div class="t">Light Trails (evolve)</div><div class="s"><b>600 gold</b><span>31 / 40 husks</span></div><div class="pb"><i style="width:77%"></i></div></div>'
 '<div class="card"><div class="t">Hushbell Hamlet</div><div class="s"><b>Ch.1, Deep Dusk</b><span>0 / 1</span></div><div class="pb"><i style="width:4%"></i></div></div></div>')
ZOOM_OLD = '<div class="zoom"><span class="pill">+</span><span class="pill">-</span><span class="pill" style="font-size:15px">Hub</span></div>'
FOG = [(470, 440, 180, 130, COL['wolf'], .30), (560, 180, 170, 120, COL['raven'], .26), (960, 170, 170, 130, COL['bolt'], .22),
       (800, 520, 150, 110, COL['orbit'], .30), (1160, 500, 150, 110, COL['elias'], .2), (350, 520, 140, 100, COL['dusk'], .22)]

def first_open():
    w = build_web('first')
    return page(1280, 720, sky(1280, 720, False), w.svg(), hero_panel(cur('620','0')) + top_bar(0, '3 goals glowing') + NEXT_FIRST )

def midgame():
    w = build_web('mid')
    return page(1280, 720, sky(1280, 720, True, FOG), w.svg(), hero_panel(cur('1,860','14')) + top_bar(47, '9 can light') + NEXT_MID )

def banner_hover():
    w = build_web('mid', hover='hush')
    conn = '<path d="M905,300 C950,310 975,320 985,333" fill="none" stroke="#ffd27a" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>'
    curs = conn + '<path d="M1012,372 L1012,402 L1020,395 L1026,410 L1032,407 L1026,393 L1037,393Z" fill="#fff" stroke="#10152c" stroke-width="2"/>'
    ban = ('<div class="banner" style="left:560px;top:215px"><div class="rib">Map - Hushbell Hamlet: Chapter 2 unlocked<small>A snowbound village where a brass bell still rings.</small></div>'
           f'<div class="tile"><div class="bd"><svg width="54" height="54" viewBox="-30 -30 60 60">{enemy_glyph("treant")}</svg></div><div style="flex:1"><div class="c"><span>Defeat Elder Treant</span><b>0 / 1</b></div>'
           '<div class="p">Cursed Forest - Deep Dusk</div><div class="pb"><i style="width:4%"></i></div><div class="g"><span>Or wake with</span><b>450 gold</b></div></div></div></div>')
    return page(1280, 720, sky(1280, 720, True, FOG), w.svg() + curs, hero_panel(cur('1,860','14')) + top_bar(47, '9 can light') + NEXT_MID  + ban)

def phone():
    z = 0.74
    w = build_web('mid', k=1/z, far=False)
    cx, cy = 800, 360
    sv = sky(390, 844, True, [(100, 250, 160, 120, COL['raven'], .26), (310, 560, 160, 120, COL['orbit'], .3), (195, 420, 200, 200, '#ff9f45', .2)], hub=(195, 430))
    g = f'<g transform="translate({195-cx*z:.1f},{430-cy*z:.1f}) scale({z})">{w.svg()}</g>'
    css = '''.pt{position:absolute;left:0;right:0;top:0;height:112px;background:linear-gradient(180deg,rgba(14,18,36,.96),rgba(26,32,58,.88));border-bottom:1.5px solid rgba(230,194,122,.55);padding:10px 12px;display:flex;align-items:center;gap:12px}
.pt .face{width:76px;height:76px;border-radius:50%;overflow:hidden;border:3px solid #e6c27a;background:radial-gradient(circle,#ffd27a55,#1a2144);flex:none}
.pb2{position:absolute;left:0;right:0;bottom:0;padding:26px 12px 14px;background:linear-gradient(180deg,rgba(14,18,36,0),rgba(14,18,36,.96) 25%)}
.row{display:flex;gap:8px;margin-top:8px}.row .btn{flex:1;height:48px;font-size:16px;border-radius:12px}
.nl{background:linear-gradient(180deg,rgba(46,58,92,.95),rgba(18,24,44,.96));border:1.5px solid rgba(255,210,122,.85);border-radius:14px;padding:8px 12px;display:flex;align-items:center;gap:10px;min-height:56px}'''
    head = WREN.split('<!-- head -->')[1].split('<!-- lantern hand -->')[0]
    face = f'<svg width="76" height="76" viewBox="46 46 144 144">{head}</svg>'
    html = (f'<div class="pt"><div class="face">{face}</div><div style="flex:1"><div class="disp" style="font-size:30px;line-height:1">Wren</div><div style="font-size:14px;font-weight:700;color:#ffd27a">Level 4 - Lantern-bearer</div>'
            '<div style="font-size:14px;color:#d6dcee;margin-top:2px">Hollow restored 47%</div></div><div class="btn play" style="height:50px;width:98px;font-size:24px">Play</div></div>'
            '<div class="abs" style="left:12px;top:122px;display:flex;gap:8px"><span class="pill" style="height:36px;font-size:15px"><i class="dot" style="background:radial-gradient(circle at 40% 35%,#fff2b8,#ffb84a)"></i>1,860</span><span class="pill" style="height:36px;font-size:15px"><i class="dot" style="background:radial-gradient(circle at 40% 35%,#e6dcff,#8f78e8)"></i>14</span></div>'
            '<div class="abs disp" style="right:12px;top:122px;font-size:22px;color:#ffd27a;line-height:36px">Restore the Hollow</div>'
            '<div class="pb2"><div class="nl"><div class="disp" style="font-size:19px;color:#ffd27a;width:56px;line-height:1">Next light</div><div style="flex:1"><div style="font-weight:700;font-size:16px">Wake Chain Lightning</div><div style="font-size:14px;color:#d6dcee"><b style="color:#ffd27a">1,200 gold</b> - you can light it</div></div><div class="btn" style="height:44px;width:84px;font-size:16px;background:linear-gradient(180deg,#ffe9a8,#ffbf5c);color:#3a2410">Wake</div></div>'
            '<div class="row"><div class="btn">Almanac</div><div class="btn">Goals <span style="margin-left:6px;background:#ffd27a;color:#3a2410;border-radius:99px;padding:0 8px;font-size:14px">3</span></div><div class="btn">Back</div></div></div>')
    return page(390, 844, sv, g, html, css)

for name, fn in [('R2-web-zoomed-first-open', first_open), ('R2-web-zoomed-midgame', midgame), ('R2-banner-hover', banner_hover), ('R2-phone-390x844', phone)]:
    open(os.path.join(D, name + '.html'), 'w', encoding='utf8').write(fn())
    print(name)
