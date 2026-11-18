"use client";

import { authClient } from "@/lib/auth-client";

const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(
  /\/$/,
  "",
);
const authBase = (process.env.NEXT_PUBLIC_AUTH_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type CachedToken = { value: string; expiresAt: number };
let cachedToken: CachedToken | null = null;
let tokenRequest: Promise<string> | null = null;

const tokenExpiry = (token: string): number => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return Date.now() + 10 * 60_000;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { exp?: number };
    return payload.exp ? payload.exp * 1000 : Date.now() + 10 * 60_000;
  } catch {
    return Date.now() + 10 * 60_000;
  }
};

/** Fetches a short-lived Better Auth JWT and caches it until just before expiry. */
export const getApiToken = async (forceRefresh = false): Promise<string> => {
  if (
    !forceRefresh &&
    cachedToken &&
    cachedToken.expiresAt - 60_000 > Date.now()
  ) {
    return cachedToken.value;
  }

  if (!forceRefresh && tokenRequest) return tokenRequest;

  tokenRequest = (async () => {
    const response = await fetch(`${authBase}/api/auth/token`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new ApiError("Your session has expired. Please sign in again.", 401);
    }

    const data = (await response.json()) as { token?: string };
    if (!data.token) {
      throw new ApiError("Could not obtain an access token.", 401);
    }

    cachedToken = {
      value: data.token,
      expiresAt: tokenExpiry(data.token),
    };
    return data.token;
  })();

  try {
    return await tokenRequest;
  } finally {
    tokenRequest = null;
  }
};

export const clearApiToken = (): void => {
  cachedToken = null;
};

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const body = data as { message?: string; error?: { message?: string } } | null;
    const message =
      body?.message ??
      body?.error?.message ??
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
};

/** Bearer-authenticated fetch wrapper for the Express API. */
export const apiFetch = async <T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const { auth = true, body, headers, ...rest } = options;
  const url = `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;

  const buildInit = async (token?: string): Promise<RequestInit> => {
    const requestHeaders = new Headers(headers);
    if (body !== undefined) requestHeaders.set("Content-Type", "application/json");
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

    return {
      cache: "no-store",
      ...rest,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
    };
  };

  const token = auth ? await getApiToken() : undefined;
  let response = await fetch(url, await buildInit(token));

  if (response.status === 401 && auth) {
    clearApiToken();
    const refreshed = await getApiToken(true);
    response = await fetch(url, await buildInit(refreshed));

    // A second 401 means the session itself is gone. Clear it and leave the
    // dashboard instead of leaving the user on a page full of failed calls.
    if (response.status === 401) {
      clearApiToken();
      try {
        await authClient.signOut();
      } catch {
        // The cookie may already be expired; redirect regardless.
      }
      if (typeof window !== "undefined") {
        window.location.assign(new URL("/login", window.location.origin).toString());
      }
      throw new ApiError("Session expired. Please sign in again.", 401);
    }
  }

  return parseResponse<T>(response);
};

export const publicApi = <T>(path: string, options: ApiRequestOptions = {}) =>
  apiFetch<T>(path, { ...options, auth: false });

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** Uploads through the server, keeping the ImgBB key server-side. */
export const uploadImage = async (file: File): Promise<string> => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("Choose a JPG, PNG, WebP, or GIF image.");
  }
  if (file.size === 0) {
    throw new Error("The selected file is empty. Choose another image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const result = await publicApi<{ success: boolean; url: string }>(
    "/api/uploads/image",
    {
      method: "POST",
      body: { dataUrl, mime: file.type },
    },
  );
  return result.url;
};
