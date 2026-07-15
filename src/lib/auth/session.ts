import "server-only";

import { cookies } from "next/headers";

import {
  createSessionToken,
  sessionCookieName,
  sessionMaxAge,
  type SessionPayload,
  verifySessionToken,
} from "./token";

const sessionCookieOptions = {
  httpOnly: true,
  maxAge: sessionMaxAge,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function createSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  const token = await createSessionToken(payload);

  cookieStore.set(sessionCookieName, token, sessionCookieOptions);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", { ...sessionCookieOptions, maxAge: 0 });
}

export async function readSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(sessionCookieName)?.value);
}
