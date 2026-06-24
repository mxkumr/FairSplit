import { randomBytes } from "crypto";

export function generateInviteToken() {
  return randomBytes(18).toString("base64url");
}

export function getAppOrigin(request?: Request) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (request) {
    const { protocol, host } = new URL(request.url);
    return `${protocol}//${host}`;
  }
  return "http://localhost:3000";
}

export function buildGroupInviteUrl(token: string, request?: Request) {
  return `${getAppOrigin(request)}/join/${token}`;
}

export function buildFriendInviteUrl(token: string, request?: Request) {
  return `${getAppOrigin(request)}/add-friend/${token}`;
}
