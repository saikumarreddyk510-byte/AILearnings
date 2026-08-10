// `server-only` relies on a webpack alias that Next.js's build sets up to
// make it a no-op on the server and a hard error on the client. Under
// Vitest there's no such bundler-level distinction — everything runs in
// plain Node — so the real package always throws. This stub replaces it
// for tests only (see vitest.config.mts) so server-only modules (env.ts,
// db.ts, the auth config, etc.) can be imported and tested directly.
export {};
