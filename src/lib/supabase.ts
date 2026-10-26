/**
 * Tiny Supabase client (REST + Auth) built on fetch — no extra packages needed.
 *
 * - `pub`   → public calls made as a visitor (anon key).
 * - `admin` → calls made as the signed-in admin (their session token).
 *
 * The admin session lives in sessionStorage, so it ends when the tab is closed
 * and you log in again next time.
 */

const env = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ??
  {}) as Record<string, string | undefined>;

export const SUPABASE_URL = env["VITE_SUPABASE_URL"] || "https://cfzntwnyszgomwmwfqdt.supabase.co";

// Public (anon) key — safe to ship in the browser. Access is limited by Row Level Security.
const ANON_KEY =
  env["VITE_SUPABASE_ANON_KEY"] ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmem50d255c3pnb213bXdmcWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMDQyOTIsImV4cCI6MjEwODU4MDI5Mn0.cBNsgFzyTQg7-qQYsmUgGWu5H1yte2wLs4xjUs6VT7s";

export class ApiError extends Error {
  status: number;
  code: string | undefined;
  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

/* ───────────────────────── session ───────────────────────── */

type Session = {
  access_token: string;
  refresh_token: string;
  /** unix seconds */
  expires_at: number;
  email: string;
};

const SESSION_KEY = "pf-admin-session";
let memory: Session | null = null;

function readSession(): Session | null {
  if (memory) return memory;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) memory = JSON.parse(raw) as Session;
  } catch {
    /* storage unavailable */
  }
  return memory;
}

function writeSession(s: Session | null) {
  memory = s;
  if (typeof window === "undefined") return;
  try {
    if (s) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable — session just lives in memory */
  }
}

export function hasSession(): boolean {
  return readSession() !== null;
}

export function sessionEmail(): string {
  return readSession()?.email ?? "";
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  user?: { email?: string };
};

function toSession(t: TokenResponse, fallbackEmail: string): Session {
  return {
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: t.expires_at ?? Math.floor(Date.now() / 1000) + (t.expires_in ?? 3600),
    email: t.user?.email ?? fallbackEmail,
  };
}

async function freshToken(): Promise<string | null> {
  const s = readSession();
  if (!s) return null;
  if (s.expires_at - 60 > Date.now() / 1000) return s.access_token;
  try {
    const t = await raw<TokenResponse>("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: { refresh_token: s.refresh_token },
    });
    const next = toSession(t, s.email);
    writeSession(next);
    return next.access_token;
  } catch {
    writeSession(null);
    return null;
  }
}

/* ───────────────────────── transport ───────────────────────── */

type Opts = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null | undefined;
  prefer?: string | undefined;
};

async function raw<T>(path: string, opts: Opts = {}): Promise<T> {
  let res: Response;
  try {
    const headers: Record<string, string> = {
      apikey: ANON_KEY,
      Authorization: `Bearer ${opts.token ?? ANON_KEY}`,
      "Content-Type": "application/json",
    };
    if (opts.prefer) headers["Prefer"] = opts.prefer;
    const init: RequestInit = { method: opts.method ?? "GET", headers };
    if (opts.body !== undefined) init.body = JSON.stringify(opts.body);
    res = await fetch(`${SUPABASE_URL}${path}`, init);
  } catch {
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0, "network");
  }

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const d = (data ?? {}) as Record<string, unknown>;
    const message =
      (d["message"] as string) ||
      (d["msg"] as string) ||
      (d["error_description"] as string) ||
      (d["error"] as string) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, (d["code"] as string) || (d["error_code"] as string));
  }
  return data as T;
}

async function authed<T>(path: string, opts: Opts = {}): Promise<T> {
  const token = await freshToken();
  if (!token) throw new ApiError("Your session has ended. Log in again.", 401, "no_session");
  return raw<T>(path, { ...opts, token });
}

/** PostgREST helpers. `query` is a PostgREST query string, e.g. `select=*&order=sort_order.asc`. */
function api(call: <T>(path: string, opts?: Opts) => Promise<T>) {
  return {
    select: <T>(table: string, query = "select=*") => call<T[]>(`/rest/v1/${table}?${query}`),
    insert: async <T>(table: string, row: Record<string, unknown>) => {
      const out = await call<T[]>(`/rest/v1/${table}`, {
        method: "POST",
        body: row,
        prefer: "return=representation",
      });
      return out[0];
    },
    update: async <T>(table: string, match: string, patch: Record<string, unknown>) => {
      const out = await call<T[]>(`/rest/v1/${table}?${match}`, {
        method: "PATCH",
        body: patch,
        prefer: "return=representation",
      });
      return out[0];
    },
    upsert: async (table: string, row: Record<string, unknown>, onConflict: string) => {
      await call<unknown>(`/rest/v1/${table}?on_conflict=${onConflict}`, {
        method: "POST",
        body: row,
        prefer: "resolution=merge-duplicates,return=minimal",
      });
    },
    remove: (table: string, match: string) =>
      call<unknown>(`/rest/v1/${table}?${match}`, { method: "DELETE", prefer: "return=minimal" }),
    rpc: <T>(fn: string, args: Record<string, unknown> = {}) =>
      call<T>(`/rest/v1/rpc/${fn}`, { method: "POST", body: args }),
  };
}

/** Visitor access (public site). */
export const pub = api(raw);
/** Signed-in admin access (admin page). */
export const admin = api(authed);

/** `col=eq.value` filter, safely encoded. */
export const eq = (col: string, value: string | number) =>
  `${col}=eq.${encodeURIComponent(String(value))}`;

/* ───────────────────────── auth ───────────────────────── */

export async function signIn(email: string, password: string): Promise<string> {
  let t: TokenResponse;
  try {
    t = await raw<TokenResponse>("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: { email: email.trim(), password },
    });
  } catch (e) {
    if (e instanceof ApiError && (e.status === 400 || e.status === 401)) {
      throw new ApiError("Wrong email or password.", e.status, e.code);
    }
    if (e instanceof ApiError && e.status === 429) {
      throw new ApiError("Too many attempts. Wait a minute and try again.", 429, e.code);
    }
    throw e;
  }
  writeSession(toSession(t, email.trim()));

  let isAdmin = false;
  try {
    isAdmin = await admin.rpc<boolean>("am_i_admin");
  } catch {
    isAdmin = false;
  }
  if (!isAdmin) {
    await signOut(false);
    throw new ApiError("This account doesn't have admin access.", 403, "not_admin");
  }
  void admin.rpc("admin_log_event", { p_action: "login", p_summary: "Logged in to the admin page" }).catch(() => undefined);
  return sessionEmail();
}

export async function signOut(log = true): Promise<void> {
  const s = readSession();
  if (s && log) {
    await admin
      .rpc("admin_log_event", { p_action: "logout", p_summary: "Logged out of the admin page" })
      .catch(() => undefined);
  }
  if (s) {
    await raw("/auth/v1/logout", { method: "POST", token: s.access_token }).catch(() => undefined);
  }
  writeSession(null);
}

/** Confirms the stored session still belongs to an admin. */
export async function verifyAdmin(): Promise<boolean> {
  if (!readSession()) return false;
  try {
    return await admin.rpc<boolean>("am_i_admin");
  } catch {
    writeSession(null);
    return false;
  }
}
