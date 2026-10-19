// Domain error for panel user writes. It lives apart so client code can match on it without pulling
// `cloudflare:workers` into the browser bundle.
export class UserError extends Error {}
