// Prefixes API paths so raw fetch() calls resolve correctly. The app is served
// from the domain root, so the default prefix is empty; set NEXT_PUBLIC_BASE_PATH
// (and next.config.ts basePath) together if it is ever mounted under a sub-path.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const apiUrl = (path: string) => `${BASE}${path}`;
