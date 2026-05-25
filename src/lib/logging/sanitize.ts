const SENSITIVE_KEYS = ["token", "secret", "password", "stream_key", "key"];

export function sanitizeForLog(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input === "string") return input;
  if (Array.isArray(input)) return input.map(sanitizeForLog);
  if (typeof input === "object") {
    const safe: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
        safe[key] = "[REDACTED]";
      } else {
        safe[key] = sanitizeForLog(value);
      }
    }
    return safe;
  }
  return input;
}
