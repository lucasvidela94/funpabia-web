// Domain error for lost and found writes. It lives apart so client code can match on it without
// pulling `cloudflare:workers` into the browser bundle.
export class ReportError extends Error {}
