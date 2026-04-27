// Environment helpers
// `isDev` is true when running on localhost (dev) — used to gate dev-only UI like import tools.
export const isDev =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);
