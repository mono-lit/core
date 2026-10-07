// src/skills/redact.ts
//
// Second-pass secret redaction (spec §23). The model is asked to redact while
// staging, but we DO NOT trust that — every byte the CLI uploads passes through
// here first. Anything matched becomes the literal token `[REDACTED]`.
//
// This is intentionally conservative: better to over-redact a session record
// than to leak a credential into a permanent, shared repo.

const REDACTED = '[REDACTED]'

/**
 * Ordered list of (pattern -> replacement) rules. Each pattern is global so all
 * occurrences on every line are replaced.
 */
const RULES: Array<{ re: RegExp; replace: string }> = [
  // GitHub tokens: classic (ghp_), fine-grained (github_pat_), oauth/app/server.
  { re: /\bghp_[A-Za-z0-9]{20,}\b/g, replace: REDACTED },
  { re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, replace: REDACTED },
  { re: /\b(gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g, replace: REDACTED },
  // AWS access key id / generic long secret-looking AWS keys.
  { re: /\bAKIA[0-9A-Z]{16}\b/g, replace: REDACTED },
  // Authorization headers (Bearer / Basic / token).
  { re: /\b(Authorization|authorization)\s*:\s*(Bearer|Basic|token)\s+[A-Za-z0-9._\-+/=]+/g, replace: `$1: $2 ${REDACTED}` },
  // Cookie / Set-Cookie header values.
  { re: /\b(Set-Cookie|Cookie)\s*:\s*[^\r\n]+/gi, replace: `$1: ${REDACTED}` },
  // PEM private key blocks (RSA/EC/OPENSSH/PGP…).
  { re: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z ]+ )?PRIVATE KEY-----/g, replace: REDACTED },
  // DB connection strings with inline credentials (proto://user:pass@host).
  { re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s:@/]+@[^\s/]+/gi, replace: REDACTED },
  // Obvious secret-bearing env / key=value assignments. Matches a key that
  // *looks* secret (token/secret/password/apikey/...) and redacts its value.
  { re: /\b([A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|APIKEY|API_KEY|PRIVATE_KEY|ACCESS_KEY|CLIENT_SECRET|AUTH)[A-Za-z0-9_]*)\s*[:=]\s*("?)([^\s"'#]+)\2/gi, replace: `$1=${REDACTED}` },
]

/**
 * Redact a string. Returns the cleaned text. Safe to run on any text content
 * (summaries, conversation lines, decisions, metadata serialized to JSON).
 */
export function redact(input: string): string {
  let out = input
  for (const { re, replace } of RULES) out = out.replace(re, replace)
  return out
}

/**
 * Redact a Buffer (e.g. a conversation chunk before upload) by round-tripping
 * through UTF-8. Returns a new Buffer.
 */
export function redactBuffer(buf: Buffer): Buffer {
  return Buffer.from(redact(buf.toString('utf8')), 'utf8')
}
