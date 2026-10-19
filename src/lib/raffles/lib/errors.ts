// Domain error for raffle writes. It lives apart so client code can match on it without pulling
// `cloudflare:workers` into the browser bundle.
export class RaffleError extends Error {}
