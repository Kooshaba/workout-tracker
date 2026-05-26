type D1Result<T = unknown> = {
  results?: T[];
  success: boolean;
};

type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
};

type D1Database = {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
};

type Env = {
  DB: D1Database;
  LINE_CHANNEL_ID: string;
  LINE_CHANNEL_SECRET: string;
  SESSION_SECRET: string;
  APP_ORIGIN: string;
};

type Workout = {
  id: string;
  date: string;
  name: string;
  exercises: unknown[];
  notes?: string;
};

type SessionPayload = {
  userId: string;
  exp: number;
};

const sessionCookieName = "workouts_session";
const sessionTtlSeconds = 60 * 60 * 24 * 30;
const lineAuthorizeUrl = "https://access.line.me/oauth2/v2.1/authorize";
const lineTokenUrl = "https://api.line.me/oauth2/v2.1/token";
const lineProfileUrl = "https://api.line.me/v2/profile";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), request, env);
    }

    try {
      if (url.pathname === "/auth/line/start") {
        return startLineLogin(request, env);
      }

      if (url.pathname === "/auth/line/callback") {
        return finishLineLogin(request, env);
      }

      if (url.pathname === "/api/me") {
        const user = await getRequestUser(request, env);
        return json({ user }, request, env);
      }

      if (url.pathname === "/api/logout" && request.method === "POST") {
        return json(
          { ok: true },
          request,
          env,
          {
            "Set-Cookie": cookieHeader("", {
              maxAge: 0,
              httpOnly: true,
              secure: true,
              sameSite: "None",
              path: "/",
            }),
          }
        );
      }

      if (url.pathname === "/api/workouts" && request.method === "GET") {
        const user = await requireUser(request, env);
        const rows = await env.DB.prepare(
          "SELECT data FROM workouts WHERE user_id = ? ORDER BY workout_date DESC"
        )
          .bind(user.id)
          .all<{ data: string }>();

        return json(
          { workouts: (rows.results ?? []).map((row) => JSON.parse(row.data)) },
          request,
          env
        );
      }

      if (url.pathname === "/api/workouts" && request.method === "PUT") {
        const user = await requireUser(request, env);
        const body = (await request.json()) as { workouts?: unknown };

        if (!Array.isArray(body.workouts) || !body.workouts.every(isWorkout)) {
          return json({ error: "Invalid workouts payload." }, request, env, {}, 400);
        }

        const statements = [
          env.DB.prepare("DELETE FROM workouts WHERE user_id = ?").bind(user.id),
          ...body.workouts.map((workout) =>
            env.DB.prepare(
              `INSERT INTO workouts (id, user_id, workout_date, name, data, updated_at)
               VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
            ).bind(
              workout.id,
              user.id,
              workout.date,
              workout.name,
              JSON.stringify(workout)
            )
          ),
        ];

        await env.DB.batch(statements);
        return json({ ok: true }, request, env);
      }

      return json({ error: "Not found." }, request, env, {}, 404);
    } catch (error) {
      if (error instanceof Response) {
        return withCors(error, request, env);
      }

      console.error(error);
      return json({ error: "Internal server error." }, request, env, {}, 500);
    }
  },
};

async function startLineLogin(request: Request, env: Env) {
  const url = new URL(request.url);
  const returnTo = normalizeReturnTo(url.searchParams.get("return_to"), env);
  const state = await signState({ returnTo, nonce: crypto.randomUUID() }, env);
  const redirectUri = new URL("/auth/line/callback", url.origin).toString();
  const authUrl = new URL(lineAuthorizeUrl);

  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", env.LINE_CHANNEL_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", "profile openid");
  authUrl.searchParams.set("nonce", crypto.randomUUID());

  return Response.redirect(authUrl.toString(), 302);
}

async function finishLineLogin(request: Request, env: Env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return Response.redirect(env.APP_ORIGIN, 302);
  }

  const statePayload = await verifyState(state, env);
  if (!statePayload) {
    return Response.redirect(env.APP_ORIGIN, 302);
  }

  const tokenResponse = await fetch(lineTokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: new URL("/auth/line/callback", url.origin).toString(),
      client_id: env.LINE_CHANNEL_ID,
      client_secret: env.LINE_CHANNEL_SECRET,
    }),
  });

  if (!tokenResponse.ok) {
    console.error("LINE token exchange failed.", await tokenResponse.text());
    return Response.redirect(env.APP_ORIGIN, 302);
  }

  const tokenJson = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    return Response.redirect(env.APP_ORIGIN, 302);
  }

  const profileResponse = await fetch(lineProfileUrl, {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });

  if (!profileResponse.ok) {
    console.error("LINE profile request failed.", await profileResponse.text());
    return Response.redirect(env.APP_ORIGIN, 302);
  }

  const profile = (await profileResponse.json()) as {
    userId: string;
    displayName: string;
    pictureUrl?: string;
  };
  const userId = crypto.randomUUID();
  const existing = await env.DB.prepare(
    "SELECT id FROM users WHERE line_user_id = ?"
  )
    .bind(profile.userId)
    .first<{ id: string }>();
  const appUserId = existing?.id ?? userId;

  if (existing) {
    await env.DB.prepare(
      `UPDATE users
       SET display_name = ?, picture_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(profile.displayName, profile.pictureUrl ?? null, appUserId)
      .run();
  } else {
    await env.DB.prepare(
      `INSERT INTO users (id, line_user_id, display_name, picture_url)
       VALUES (?, ?, ?, ?)`
    )
      .bind(
        appUserId,
        profile.userId,
        profile.displayName,
        profile.pictureUrl ?? null
      )
      .run();
  }

  const session = await signSession(
    {
      userId: appUserId,
      exp: Math.floor(Date.now() / 1000) + sessionTtlSeconds,
    },
    env
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: statePayload.returnTo,
      "Set-Cookie": cookieHeader(session, {
        maxAge: sessionTtlSeconds,
        httpOnly: true,
        secure: true,
        sameSite: "None",
        path: "/",
      }),
    },
  });
}

async function getRequestUser(request: Request, env: Env) {
  const payload = await readSession(request, env);
  if (!payload) return null;

  const user = await env.DB.prepare(
    "SELECT id, display_name as displayName, picture_url as pictureUrl FROM users WHERE id = ?"
  )
    .bind(payload.userId)
    .first<{ id: string; displayName: string; pictureUrl?: string }>();

  return user;
}

async function requireUser(request: Request, env: Env) {
  const user = await getRequestUser(request, env);
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return user;
}

async function readSession(request: Request, env: Env) {
  const cookies = parseCookies(request.headers.get("Cookie") ?? "");
  const value = cookies[sessionCookieName];
  if (!value) return null;

  const payload = await verifySignedJson<SessionPayload>(value, env);
  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function isWorkout(value: unknown): value is Workout {
  if (!value || typeof value !== "object") return false;
  const workout = value as Workout;

  return (
    typeof workout.id === "string" &&
    typeof workout.date === "string" &&
    typeof workout.name === "string" &&
    Array.isArray(workout.exercises)
  );
}

function normalizeReturnTo(value: string | null, env: Env) {
  if (!value) return env.APP_ORIGIN;

  try {
    const returnTo = new URL(value);
    if (returnTo.origin === env.APP_ORIGIN) return returnTo.toString();
  } catch {
    return env.APP_ORIGIN;
  }

  return env.APP_ORIGIN;
}

function parseCookies(header: string) {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)])
  );
}

function cookieHeader(
  value: string,
  options: {
    maxAge: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "None" | "Lax" | "Strict";
    path: string;
  }
) {
  const parts = [
    `${sessionCookieName}=${encodeURIComponent(value)}`,
    `Max-Age=${options.maxAge}`,
    `Path=${options.path}`,
    `SameSite=${options.sameSite}`,
  ];

  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

function json(
  body: unknown,
  request: Request,
  env: Env,
  headers: Record<string, string> = {},
  status = 200
) {
  return withCors(
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    }),
    request,
    env
  );
}

function withCors(response: Response, request: Request, env: Env) {
  const origin = request.headers.get("Origin");
  const headers = new Headers(response.headers);

  if (origin === env.APP_ORIGIN) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function signState(
  payload: { returnTo: string; nonce: string },
  env: Env
) {
  return signJson(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 600,
    },
    env
  );
}

async function verifyState(value: string, env: Env) {
  const payload = await verifySignedJson<{
    returnTo: string;
    nonce: string;
    exp: number;
  }>(value, env);

  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

async function signSession(payload: SessionPayload, env: Env) {
  return signJson(payload, env);
}

async function signJson(payload: unknown, env: Env) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmac(encodedPayload, env);
  return `${encodedPayload}.${signature}`;
}

async function verifySignedJson<T>(value: string, env: Env): Promise<T | null> {
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = await hmac(encodedPayload, env);
  if (signature !== expected) return null;

  try {
    return JSON.parse(base64UrlDecode(encodedPayload)) as T;
  } catch {
    return null;
  }
}

async function hmac(value: string, env: Env) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );
  return base64UrlEncode(signature);
}

function base64UrlEncode(value: string | ArrayBuffer) {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "="
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
