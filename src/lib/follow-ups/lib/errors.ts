// Domain error for follow-up writes. It lives apart so client code can match on it without pulling
// `cloudflare:workers` into the browser bundle.
export class FollowUpError extends Error {}
