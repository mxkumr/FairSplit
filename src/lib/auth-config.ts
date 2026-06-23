const SESSION_COOKIE = "fairsplit_session";

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}
