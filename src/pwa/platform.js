// Platform detection for the install / full-screen prompt. Pure JS, no DOM: callers pass in what they read.
// The user agent is untrusted text; it is only matched against fixed patterns and never shown or stored.

const IOS_UA = /iPhone|iPad|iPod/;
const OTHER_IOS_BROWSER = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo/;

// env: { ua, platform, maxTouchPoints, standalone (navigator.standalone), displayModes: ['fullscreen'|'standalone'|...] that match }
export function detectPlatform(env = {}) {
  const ua = typeof env.ua === 'string' ? env.ua.slice(0, 400) : '';
  const touch = Number.isFinite(env.maxTouchPoints) ? env.maxTouchPoints : 0;
  // iPadOS 13+ reports a Mac user agent; touch points tell it apart from a real Mac.
  const ipadOS = /Macintosh/.test(ua) && touch > 1;
  const ios = IOS_UA.test(ua) || ipadOS;
  const android = !ios && /Android/.test(ua);
  const modes = Array.isArray(env.displayModes) ? env.displayModes : [];
  const installed = env.standalone === true || modes.includes('standalone') || modes.includes('fullscreen') || modes.includes('minimal-ui');
  const iosSafari = ios && !OTHER_IOS_BROWSER.test(ua) && /Safari/.test(ua);
  const chromium = !ios && /Chrome\/|Chromium\/|Edg\//.test(ua);
  return {
    os: ios ? 'ios' : android ? 'android' : 'other',
    ios,
    android,
    iosSafari,
    chromium,
    installed,
    // iOS has no install prompt: the player does Share > Add to Home Screen.
    needsIosSteps: ios && !installed,
  };
}
