import crypto from "crypto";
import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "gfs_auth";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

function getSecret() {
  const secret = process.env.AUTH_COOKIE_SECRET ?? process.env.auth_cookie_secret;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_COOKIE_SECRET must be set and at least 32 chars");
  }
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function createToken() {
  const payload = `${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string): boolean {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function isPinValid(pin: string): boolean {
  const appPin = process.env.APP_PIN ?? process.env.app_pin;
  if (!appPin) throw new Error("APP_PIN is not set");
  return pin === appPin;
}

export async function setAuthCookie() {
  cookies().set(AUTH_COOKIE_NAME, createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/"
  });
}

export async function clearAuthCookie() {
  cookies().set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/"
  });
}

export function isAuthenticated(): boolean {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyToken(token);
}
