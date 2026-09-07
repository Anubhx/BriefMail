/**
 * Gmail token helpers - encrypt/decrypt tokens and refresh access tokens.
 * Never logs or stores plaintext tokens.
 */

import { decryptString, encryptString } from "../security/crypto";

export function encryptToken(token: string): string {
  return encryptString(token);
}

export function decryptToken(encrypted: string): string {
  return decryptString(encrypted);
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  error?: string;
}

export async function refreshAccessToken(encryptedRefreshToken: string): Promise<{
  access_token: string;
  encrypted_access_token: string;
  expiry: Date;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "refreshAccessToken: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing"
    );
  }

  const refreshToken = decryptToken(encryptedRefreshToken);

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await res.json()) as GoogleTokenResponse;

  if (data.error) {
    throw new Error("token_refresh_failed: " + data.error);
  }

  if (!data.access_token) {
    throw new Error("token_refresh_failed: no access_token in response");
  }

  const expiry = new Date(Date.now() + data.expires_in * 1000);
  const encrypted_access_token = encryptToken(data.access_token);

  return {
    access_token: data.access_token,
    encrypted_access_token,
    expiry,
  };
}
