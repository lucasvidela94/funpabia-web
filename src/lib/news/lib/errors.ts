// Domain error for news writes. It lives apart from panel.ts so client code can match on
// it without pulling `cloudflare:workers` into the browser bundle.
export class NewsError extends Error {}
