/**
 * devLog — logs only in development. Never exposes data in production builds.
 */
const isDev = import.meta.env.DEV;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function devLog(...args: any[]) {
  if (isDev) console.log(...args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function devWarn(...args: any[]) {
  if (isDev) console.warn(...args);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function devError(...args: any[]) {
  if (isDev) console.error(...args);
}
