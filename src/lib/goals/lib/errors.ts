// Domain error for goal and donation writes. It lives apart so client code can match on it without pulling
// `cloudflare:workers` into the browser bundle.
export class GoalError extends Error {}
