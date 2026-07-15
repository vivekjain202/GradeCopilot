import { jwtVerify, SignJWT } from "jose";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export const sessionCookieName = "gradecopilot_session";

export type SessionPayload = {
  sub: string;
  email: string;
};

function getSessionKey() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSessionKey());
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionKey(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }

    return { sub: payload.sub, email: payload.email } satisfies SessionPayload;
  } catch {
    return null;
  }
}

export const sessionMaxAge = SESSION_DURATION_SECONDS;
