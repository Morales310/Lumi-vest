/* ============================================================
   LUMI-VEST — API (one Vercel Function; /api/* is rewritten here)

   Env vars (Vercel → Project → Settings → Environment Variables):
     KV_REST_API_URL, KV_REST_API_TOKEN   Upstash Redis (Vercel Marketplace → Storage)
     AUTH_SECRET                          long random string (signs sessions, encrypts NIN/photo)
     CEO_PASSWORD                         password for the CEO account (agent tab + admin email)
     GOOGLE_CLIENT_ID                     optional — enables “Continue with Google”
     ADMIN_EMAIL                          optional — defaults to jesvelarrealestate@gmail.com
     CEO_NAME, CEO_PHONE                  optional — shown on the CEO account
   ============================================================ */
"use strict";

const rds = require("./_lib/redis");
const sec = require("./_lib/sec");
const R = require("./_lib/rules");

const DAY = 24 * 60 * 60 * 1000;
const APP_TTL_S = 14 * 24 * 60 * 60;
const PUBLIC_ROLES = new Set(["customer", "agent", "company"]);
const MAX_LICENSES = 1000;

class HttpError extends Error {
  constructor(status, code, title, reasons, field, extra) {
    super(title);
    this.status = status;
    this.code = code;
    this.title = title;
    this.reasons = reasons || [];
    this.field = field || null;
    this.extra = extra || {};
  }
}
const E = (status, code, title, reasons, field, extra) => new HttpError(status, code, title, reasons, field, extra);

/* ---------- plumbing ---------- */
function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
    try { return JSON.parse(Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body)); } catch { throw E(400, "bad-json", "Invalid request"); }
  }
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 1_000_000) throw E(413, "too-large", "That request is too large");
    chunks.push(c);
  }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw E(400, "bad-json", "Invalid request"); }
}

const clientIp = (req) => String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "ip").split(",")[0].trim();

function claimsOf(req) {
  const h = String(req.headers.authorization || "");
  return h.startsWith("Bearer ") ? sec.verifyToken(h.slice(7)) : null;
}
function requireAuth(req) {
  const c = claimsOf(req);
  if (!c) throw E(401, "unauthorized", "Please sign in again", ["Your session has expired or is invalid"]);
  return c;
}
function requireCeo(req) {
  const c = requireAuth(req);
  if (c.role !== "ceo" || c.email !== R.ADMIN_EMAIL()) throw E(403, "forbidden", "Not allowed");
  return c;
}

async function rateLimit(key, limit, windowS, what) {
  const k = "lv:rl:" + key;
  const n = await rds.cmd("INCR", k);
  if (n === 1) await rds.cmd("EXPIRE", k, windowS);
  if (n > limit) {
    const ttl = await rds.cmd("TTL", k);
    throw E(429, "rate-limited", "Too many requests", ["Please wait a moment before trying " + (what || "again")], null, { retryMs: Math.max(1, ttl) * 1000 });
  }
}

const ceoUser = () => ({
  id: "ceo", name: process.env.CEO_NAME || "Jesvelar", username: "ceo", email: R.ADMIN_EMAIL(),
  role: "ceo", phone: process.env.CEO_PHONE || "", license: "", provider: "password", picture: "",
});

const publicUser = (u) => ({
  uid: u.id, name: u.name, username: u.username, email: u.email, picture: u.picture || "", provider: u.provider,
  role: u.role, company: u.company || "", agency: u.agency || "", license: u.license || "", phone: u.phone || "",
});

function session(u, remember) {
  const ttl = remember ? 30 * DAY : 12 * 60 * 60 * 1000;
  const claims = { uid: u.id, role: u.role, email: u.email, license: u.license || "" };
  const token = sec.signToken(claims, ttl);
  return { user: publicUser(u), token, exp: Date.now() + ttl };
}

async function findUser(idRaw) {
  const id = R.normEmail(idRaw);
  const key = id.includes("@") ? "lv:email:" + id : "lv:uname:" + id;
  const uid = await rds.cmd("GET", key);
  return uid ? rds.getJSON("lv:user:" + uid) : null;
}

async function logAct(type, data) {
  await rds.pipeline([
    ["LPUSH", "lv:act", JSON.stringify({ t: Date.now(), type, ...data })],
    ["LTRIM", "lv:act", 0, 2999],
  ]);
}

/* Every successful sign-up is counted (survives account deletion) and logged for the CEO dashboard. */
const COUNTED_ROLES = new Set(["customer", "agent", "company"]);
async function countSignup(role) {
  if (!COUNTED_ROLES.has(role)) return;
  await rds.pipeline([["INCR", "lv:signups:total"], ["INCR", "lv:signups:" + role]]);
  await logAct("signup", { role });
}

const trim = (v, n = 120) => String(v == null ? "" : v).slice(0, n);

/* ============================================================
   AUTH
   ============================================================ */
async function signup(body, ip) {
  await rateLimit("signup:" + ip, 12, 3600, "signing up");
  const role = PUBLIC_ROLES.has(body.role) ? body.role : "customer";
  const email = R.normEmail(body.email);
  const taken = () => E(409, "email-taken", "An account with that email already exists", [
    "You may already have signed up — switch to Sign in",
    "If you registered with Google, use the “Continue with Google” button",
  ], "email");
  if (email === R.ADMIN_EMAIL()) throw taken(); // the reserved address can't be registered

  const first = R.clean(body.firstName), last = R.clean(body.lastName);
  const username = R.clean(body.username);
  const phone = R.clean(body.phone), address = R.clean(body.address);
  const pw = String(body.password || "");
  const problems = [];
  if (first.length < 2) problems.push("First name is required");
  if (last.length < 2) problems.push("Last name is required");
  if (!R.USERNAME_RE.test(username)) problems.push("Usernames are 3–20 characters, start with a letter, and use only letters, numbers, “.” or “_”");
  if (!R.EMAIL_RE.test(email)) problems.push("That email address isn’t formatted correctly");
  if (!R.PHONE_RE.test(phone)) problems.push("That phone number doesn’t look right");
  if (address.length < 8) problems.push("The address is too short — include street, area and city");
  const state = R.clean(body.state), lga = R.clean(body.lga);
  if (!R.LOCATIONS[state]) problems.push("Choose a state from the list");
  else if (!R.LOCATIONS[state].includes(lga)) problems.push("Choose a local government that belongs to " + state);
  const pwIssues = R.passwordIssues(pw, { username: username.toLowerCase(), email });
  if (pwIssues.length) problems.push("Password: " + pwIssues.join("; "));
  let company = "", regNo = "", agency = "", lic = null, lid = "";
  if (role === "company") {
    company = R.clean(body.company);
    regNo = R.clean(body.regNo).toUpperCase();
    if (company.length < 2) problems.push("Company name is required");
    if (!R.REG_RE.test(regNo)) problems.push("CAC numbers look like RC 1234567");
  }
  if (role === "agent") agency = R.clean(body.agency);
  if (role === "agent" || role === "company") {
    lid = R.normLicense(body.license);
    if (!R.LICENSE_RE.test(lid)) problems.push("Enter the license ID issued when your application was approved (like LVJD007)");
  }
  if (problems.length) throw E(422, "invalid", "Required details are missing or invalid", problems);

  if (lic === null && (role === "agent" || role === "company")) {
    lic = await rds.getJSON("lv:lic:" + lid);
    const bad = (title, reasons) => E(422, "license-invalid", title, reasons, "license");
    if (!lic) throw bad("We don’t recognise that license ID", ["It may contain a typo — check it against your approval message", "The application may not have been approved yet"]);
    if (lic.status !== "active") throw bad("That license isn’t active", ["The license has been " + lic.status + " by the LUMI-VEST CEO", "Contact the LUMI-VEST team for help"]);
    if (lic.kind !== role) throw bad("That license is for a different account type", ["This is " + (lic.kind === "company" ? "a company" : "an agent") + " license — choose “" + (lic.kind === "company" ? "Company" : "Agent") + "” above"]);
    if (lic.boundUid) throw bad("That license is already in use", ["Each license can be linked to one account only", "If this is yours, sign in instead of creating a new account"]);
    if (email !== lic.email) throw bad("The email doesn’t match this license", ["Sign up with the same email address you used on your application"]);
  }

  const uid = sec.randomId(12);
  const uKey = username.toLowerCase();
  const gotEmail = await rds.cmd("SET", "lv:email:" + email, uid, "NX");
  if (!gotEmail) throw taken();
  const gotName = await rds.cmd("SET", "lv:uname:" + uKey, uid, "NX");
  if (!gotName) {
    await rds.cmd("DEL", "lv:email:" + email);
    throw E(409, "username-taken", "That username is already taken", ["Someone else registered it first — try adding numbers or an underscore"], "username");
  }
  if (lic) {
    const claimed = await rds.cmd("SET", "lv:licclaim:" + lid, uid, "NX");
    if (!claimed) {
      await rds.pipeline([["DEL", "lv:email:" + email], ["DEL", "lv:uname:" + uKey]]);
      throw E(409, "license-invalid", "That license is already in use", ["Each license can be linked to one account only"], "license");
    }
  }
  const user = {
    id: uid, role, name: first + " " + last, firstName: first, lastName: last, username, email, phone, address, state, lga,
    company, regNo, agency, license: lic ? lid : "", provider: "password", passHash: await sec.hashPassword(pw), created: Date.now(),
  };
  await rds.pipeline([["SET", "lv:user:" + uid, JSON.stringify(user)], ["SADD", "lv:users", uid]]);
  await countSignup(role);
  if (lic) {
    lic.boundUid = uid;
    await rds.setJSON("lv:lic:" + lid, lic);
    await logAct("license_claimed", { license: lid });
  }
  return session(user, false);
}

async function signin(body, ip) {
  const idRaw = R.normEmail(body.identifier);
  const want = PUBLIC_ROLES.has(body.role) ? body.role : "customer";
  if (!idRaw || !body.password) throw E(422, "invalid", "Please check your details", ["Enter your email or username and password"]);
  await rateLimit("signin-ip:" + ip, 40, 600, "signing in");

  const lockKey = "lv:lock:" + idRaw;
  const lockTtl = await rds.cmd("TTL", lockKey);
  if (lockTtl > 0) {
    throw E(429, "locked", "Too many failed attempts", [
      "Several wrong passwords were entered for this account",
      "Try again in " + lockTtl + " seconds, or sign in with Google",
    ], null, { retryMs: lockTtl * 1000 });
  }

  let user = null, ok = false;
  if (idRaw === R.ADMIN_EMAIL()) {
    const pw = process.env.CEO_PASSWORD;
    if (want === "agent" && pw && sec.safeEqual(String(body.password), pw)) { ok = true; user = ceoUser(); }
    else await sec.dummyVerify();
  } else {
    user = await findUser(idRaw);
    if (user && user.passHash) ok = await sec.verifyPassword(String(body.password), user.passHash);
    else await sec.dummyVerify();
  }

  const failure = async (extraReason) => {
    const failKey = "lv:fails:" + idRaw;
    const n = await rds.cmd("INCR", failKey);
    if (n === 1) await rds.cmd("EXPIRE", failKey, 900);
    const reasons = [
      "No account matches that email or username — check for typos or create an account",
      "The password is incorrect (passwords are case-sensitive)",
      "The account may have been created with Google — use “Continue with Google”",
    ];
    let retryMs = 0;
    if (n >= 5) {
      const secs = Math.min(30 * Math.pow(2, n - 5), 900);
      await rds.cmd("SET", lockKey, "1", "EX", secs);
      reasons.push("Too many attempts — sign-in is paused for " + secs + " seconds");
      retryMs = secs * 1000;
    } else if (5 - n <= 2) reasons.push((5 - n) + " attempt" + (5 - n === 1 ? "" : "s") + " left before a temporary pause");
    if (extraReason) reasons.unshift(extraReason);
    return E(401, "bad-credentials", "We couldn’t sign you in", reasons, "password", { retryMs });
  };

  if (ok && user.role === "ceo" && want !== "agent") ok = false;
  if (!ok) throw await failure(body.capsLock ? "Caps Lock is on" : "");

  if (user.role === "agent" || user.role === "company") {
    if (user.role === want) {
      const lid = R.normLicense(body.license);
      const lic = await rds.getJSON("lv:lic:" + user.license);
      let lf = null;
      if (!lid) lf = E(422, "license-missing", "License ID required", ["Enter the license ID issued to your account"], "license");
      else if (lid !== user.license) lf = E(401, "license-mismatch", "That license ID doesn’t match this account", ["Check it for typos", "Use the license ID linked to this account"], "license");
      else if (!lic || lic.status !== "active") lf = E(403, "license-inactive", "This license isn’t active", ["The license has been " + (lic ? lic.status : "removed") + " by the LUMI-VEST CEO", "Contact the LUMI-VEST team for help"], "license");
      if (lf) {
        if (lf.code !== "license-missing") await failure();
        throw lf;
      }
    }
  }
  await rds.cmd("DEL", "lv:fails:" + idRaw);
  if (user.role !== want && !(user.role === "ceo" && want === "agent")) {
    const art = (r) => (r === "agent" ? "an agent" : r === "company" ? "a company" : "a customer");
    throw E(403, "role-mismatch", "Wrong account type selected", [
      "These details belong to " + art(user.role) + " account, not " + art(want) + " account",
      "Choose “" + (user.role === "agent" ? "Agent" : user.role === "company" ? "Company" : "Customer") + "” above, then sign in again",
    ], "role");
  }
  return session(user, !!body.remember);
}

async function google(body, ip) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw E(503, "google-not-configured", "Google sign-in isn’t set up yet", ["The site owner hasn’t added a Google client ID yet"]);
  await rateLimit("google:" + ip, 30, 600, "signing in");
  let info;
  try {
    const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(String(body.credential || "")));
    info = await r.json();
    if (!r.ok) throw new Error("rejected");
  } catch {
    throw E(401, "google-bad-token", "Google sign-in failed", ["Google didn’t accept that sign-in — please try again"]);
  }
  const problems = [];
  if (info.aud !== clientId) problems.push("The token was issued for a different app (client ID mismatch)");
  if (info.iss !== "https://accounts.google.com" && info.iss !== "accounts.google.com") problems.push("The token didn’t come from Google");
  if (Number(info.exp) * 1000 < Date.now() - 60000) problems.push("The Google sign-in expired — please try again");
  if (body.nonce && info.nonce !== body.nonce) problems.push("The sign-in request couldn’t be verified (nonce mismatch)");
  if (problems.length) throw E(401, "google-invalid", "Google sign-in was rejected", problems);
  if (info.email_verified !== "true" && info.email_verified !== true) {
    throw E(403, "google-unverified", "Your Google email isn’t verified", ["Verify the address in your Google account, then try again"]);
  }
  const email = R.normEmail(info.email);
  let role = PUBLIC_ROLES.has(body.role) ? body.role : "customer";
  if (email === R.ADMIN_EMAIL() && role === "agent") return session(ceoUser(), true);
  if (email === R.ADMIN_EMAIL() || role === "agent" || role === "company") {
    throw E(403, "google-role", role === "customer" ? "Wrong account type selected" : "Use email sign-up for this account type",
      role === "customer" ? ["Choose the account type you registered with, then continue with Google again"]
        : ["Agents and companies sign up with the license ID issued to them", "Use the email and password form instead"], "role");
  }
  let user = await findUser(email);
  if (user && user.role !== "customer") {
    throw E(403, "role-mismatch", "Wrong account type selected", ["That Google account is registered as a different account type", "Choose the right type above, then continue with Google again"], "role");
  }
  if (user && user.googleSub && user.googleSub !== info.sub) {
    throw E(403, "google-mismatch", "This email is linked to a different Google account", ["Sign in with the Google account you originally used for this email"]);
  }
  if (!user) {
    const base = email.split("@")[0].replace(/[^a-z0-9._]/g, "").replace(/^[^a-z]+/, "") || "user";
    let uname = base.slice(0, 16), n = 0;
    while (await rds.cmd("EXISTS", "lv:uname:" + uname)) uname = base.slice(0, 14) + ++n;
    const uid = sec.randomId(12);
    user = {
      id: uid, role: "customer", name: info.name || base, firstName: info.given_name || "", lastName: info.family_name || "",
      username: uname, email, phone: "", address: "", provider: "google", googleSub: info.sub, picture: info.picture || "", created: Date.now(),
    };
    await rds.pipeline([
      ["SET", "lv:email:" + email, uid], ["SET", "lv:uname:" + uname, uid],
      ["SET", "lv:user:" + uid, JSON.stringify(user)], ["SADD", "lv:users", uid],
    ]);
    await countSignup("customer");
  } else if (!user.googleSub) {
    user.googleSub = info.sub;
    await rds.setJSON("lv:user:" + user.id, user);
  }
  return session(user, true);
}

/* ============================================================
   LICENSE GATE + ACTIVITY (agents, companies, CEO)
   ============================================================ */
async function checkLicense(claims, entered) {
  if (claims.role === "ceo") return { ok: true };
  if (claims.role !== "agent" && claims.role !== "company") throw E(403, "forbidden", "Not allowed", ["Only licensed agents and companies can manage listings"]);
  const user = await rds.getJSON("lv:user:" + claims.uid);
  const lid = R.normLicense(entered || user?.license);
  if (!user || !user.license) throw E(403, "license-missing", "No license on this account");
  if (lid !== user.license) throw E(403, "license-mismatch", "That license ID doesn’t belong to this account", [], "license");
  const lic = await rds.getJSON("lv:lic:" + user.license);
  if (!lic || lic.status !== "active") throw E(403, "license-inactive", "This license isn’t active", ["The license has been " + (lic ? lic.status : "removed") + " by the LUMI-VEST CEO"], "license");
  return { ok: true, license: lic.id };
}

const ACT_TYPES = new Set(["listing_added", "listing_removed", "listing_updated"]);
async function activity(claims, body) {
  await checkLicense(claims);
  if (!ACT_TYPES.has(body.type)) throw E(422, "invalid", "Unknown activity");
  await logAct(body.type, {
    id: trim(body.id, 60), title: trim(body.title), owner: trim(body.owner, 40), state: trim(body.state, 40), loc: trim(body.loc),
    ptype: trim(body.ptype, 20), mode: trim(body.mode, 20), price: Number(body.price) || 0, via: trim(body.via, 20), actor: claims.uid,
  });
  return { ok: true };
}

async function flag(claims, body) {
  await checkLicense(claims);
  const entry = {
    ts: Date.now(), title: trim(body.title), by: { key: trim(body.by && body.by.key, 40), name: trim(body.by && body.by.name), email: trim(body.by && body.by.email), role: trim(body.by && body.by.role, 20) },
    conflicts: (Array.isArray(body.conflicts) ? body.conflicts : []).slice(0, 20).map((c) => ({
      index: Number(c.index) || 0, kind: trim(c.kind, 10), why: trim(c.why, 40), otherTitle: trim(c.otherTitle), otherName: trim(c.otherName),
    })),
  };
  await rds.pipeline([["LPUSH", "lv:flags", JSON.stringify(entry)], ["LTRIM", "lv:flags", 0, 199]]);
  return { ok: true };
}

/* ============================================================
   APPLICATIONS (public) + CEO review
   ============================================================ */
const PHOTO_RE = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;

async function apply(body, ip) {
  await rateLimit("apply:" + ip, 6, 3600, "applying");
  const kind = body.kind === "company" ? "company" : "agent";
  const fullName = R.clean(body.fullName), company = R.clean(body.company), phone = R.clean(body.phone);
  const email = R.normEmail(body.email), address = R.clean(body.address), nin = String(body.nin || "").trim();
  const problems = [];
  if (fullName.split(" ").filter((w) => w.length > 1).length < 2) problems.push("Enter your full name — first and last name");
  if (kind === "company" && company.length < 2) problems.push("Enter the company’s registered name");
  if (!R.PHONE_RE.test(phone)) problems.push("That phone number doesn’t look right");
  if (!R.EMAIL_RE.test(email)) problems.push("That email address isn’t formatted correctly");
  if (address.length < 8) problems.push("Enter your full address — street, area and city");
  if (!/^\d{11}$/.test(nin)) problems.push("Your NIN is 11 digits long");
  const photo = String(body.photo || "");
  if (!PHOTO_RE.test(photo) || photo.length > 450_000) problems.push("Add a clear photo (JPG, under about 300 KB after resizing)");
  if (problems.length) throw E(422, "invalid", "Please check your application", problems);

  const existing = await rds.cmd("GET", "lv:appemail:" + email);
  if (existing) {
    const ex = await rds.getJSON("lv:app:" + existing);
    if (ex && (ex.status === "accepted" || (ex.status === "pending" && Date.now() < ex.expires))) {
      throw E(409, "duplicate", "We can’t take this application", [ex.status === "accepted"
        ? "This email already has an approved license — sign up with it instead"
        : "An application for this email is already waiting for review (reference " + ex.ref + ")"]);
    }
  }
  const ref = sec.randomRef();
  const now = Date.now();
  const rec = {
    ref, kind, fullName, company: kind === "company" ? company : "", phone, email, address, ninMasked: "•••••••" + nin.slice(-4),
    status: "pending", created: now, expires: now + APP_TTL_S * 1000,
  };
  await rds.pipeline([
    ["SET", "lv:app:" + ref, JSON.stringify(rec), "EX", APP_TTL_S * 2],
    ["SET", "lv:appx:" + ref, sec.seal(JSON.stringify({ nin, photo })), "EX", APP_TTL_S],
    ["SET", "lv:appemail:" + email, ref, "EX", APP_TTL_S],
    ["SADD", "lv:apps", ref],
  ]);
  await logAct("application_submitted", { ref, kind });
  return { ref };
}

async function applyStatus(query) {
  const ref = String(query.get("ref") || "").trim().toUpperCase();
  const email = R.normEmail(query.get("email"));
  const app = ref ? await rds.getJSON("lv:app:" + ref) : null;
  if (!app || !sec.safeEqual(app.email, email)) return { found: false };
  let status = app.status;
  if (status === "pending" && Date.now() > app.expires) status = "expired";
  return { found: true, ref: app.ref, kind: app.kind, status, licenseId: app.licenseId || "", note: app.note || "", name: app.fullName, created: app.created };
}

async function expireStale(apps) {
  for (const a of apps) {
    if (a.status === "pending" && Date.now() > a.expires) {
      a.status = "expired";
      a.decidedAt = Date.now();
      await rds.pipeline([["SET", "lv:app:" + a.ref, JSON.stringify(a)], ["DEL", "lv:appx:" + a.ref], ["DEL", "lv:appemail:" + a.email]]);
    }
  }
}

async function dashboard() {
  const [appRefs, licIds, userIds, act, fl, sc] = await rds.pipeline([
    ["SMEMBERS", "lv:apps"], ["SMEMBERS", "lv:lics"], ["SMEMBERS", "lv:users"], ["LRANGE", "lv:act", 0, 1499], ["LRANGE", "lv:flags", 0, 199],
    ["MGET", "lv:signups:total", "lv:signups:customer", "lv:signups:agent", "lv:signups:company"],
  ]);
  const n = (v) => Number(v) || 0;
  const [apps, lics, users] = await Promise.all([
    rds.mgetJSON((appRefs || []).map((r) => "lv:app:" + r)),
    rds.mgetJSON((licIds || []).map((i) => "lv:lic:" + i)),
    rds.mgetJSON((userIds || []).map((i) => "lv:user:" + i)),
  ]);
  const applications = apps.filter(Boolean);
  await expireStale(applications);
  const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  return {
    applications,
    licenses: lics.filter(Boolean).sort((a, b) => a.issued - b.issued),
    users: users.filter(Boolean).map((u) => ({ role: u.role, created: u.created })),
    activity: (act || []).map(parse).filter(Boolean).reverse(),
    flags: (fl || []).map(parse).filter(Boolean),
    signups: { total: n(sc && sc[0]), customer: n(sc && sc[1]), agent: n(sc && sc[2]), company: n(sc && sc[3]) },
    serverTime: Date.now(),
  };
}

async function secrets(query) {
  const ref = String(query.get("ref") || "").trim().toUpperCase();
  const blob = await rds.cmd("GET", "lv:appx:" + ref);
  if (!blob) return { nin: "", photo: "" };
  const txt = sec.open(blob);
  try { const j = JSON.parse(txt); return { nin: j.nin || "", photo: j.photo || "" }; } catch { return { nin: "", photo: "" }; }
}

async function decide(body) {
  const ref = String(body.ref || "").trim().toUpperCase();
  const decision = body.decision === "accepted" ? "accepted" : body.decision === "declined" ? "declined" : null;
  if (!decision) throw E(422, "invalid", "Unknown decision");
  const app = await rds.getJSON("lv:app:" + ref);
  if (!app || app.status !== "pending" || Date.now() > app.expires) throw E(409, "not-pending", "That application is no longer pending");

  if (decision === "accepted") {
    const serial = await rds.cmd("INCR", "lv:serial");
    if (serial > MAX_LICENSES) {
      await rds.cmd("DECR", "lv:serial");
      throw E(409, "capacity", "License capacity reached", ["All " + MAX_LICENSES + " license numbers have been issued"]);
    }
    const who = app.kind === "company" && app.company ? app.company : app.fullName;
    const lic = {
      id: "LV" + R.initialsFrom(who) + String(serial).padStart(3, "0"), serial, kind: app.kind, name: app.fullName, company: app.company || "",
      email: app.email, phone: app.phone, address: app.address, status: "active", issued: Date.now(), appRef: app.ref, boundUid: "",
    };
    app.licenseId = lic.id;
    await rds.pipeline([["SET", "lv:lic:" + lic.id, JSON.stringify(lic)], ["SADD", "lv:lics", lic.id]]);
    await logAct("license_issued", { license: lic.id, kind: lic.kind });
  } else {
    await rds.cmd("DEL", "lv:appemail:" + app.email); // a declined applicant may re-apply
  }
  app.status = decision;
  app.note = String(body.note || "").slice(0, 200);
  app.decidedAt = Date.now();
  await rds.pipeline([["SET", "lv:app:" + ref, JSON.stringify(app)], ["DEL", "lv:appx:" + ref]]); // sensitive data wiped now
  await logAct("application_" + decision, { ref, kind: app.kind });
  return { application: app };
}

async function licenseStatus(body) {
  const id = R.normLicense(body.id);
  const status = ["active", "suspended", "revoked"].includes(body.status) ? body.status : null;
  if (!status) throw E(422, "invalid", "Unknown status");
  const lic = await rds.getJSON("lv:lic:" + id);
  if (!lic) throw E(404, "not-found", "License not found");
  lic.status = status;
  lic.statusChanged = Date.now();
  await rds.setJSON("lv:lic:" + id, lic);
  await logAct("license_" + status, { license: id });
  return { license: lic };
}

/* ============================================================
   router
   ============================================================ */
module.exports = async (req, res) => {
  try {
    const url = new URL(req.url, "http://local");
    const route = String(url.searchParams.get("route") || "").replace(/^\/+|\/+$/g, "");
    const method = req.method;

    if (method === "GET" && route === "health") {
      return send(res, 200, { ok: true, configured: rds.configured(), google: !!process.env.GOOGLE_CLIENT_ID, googleClientId: process.env.GOOGLE_CLIENT_ID || "" });
    }
    if (!rds.configured()) throw E(503, "not-configured", "The server isn’t configured yet");

    const ip = clientIp(req);
    const body = method === "POST" ? await readBody(req) : {};
    const key = method + " " + route;

    switch (key) {
      case "POST auth/signup": return send(res, 200, await signup(body, ip));
      case "POST auth/signin": return send(res, 200, await signin(body, ip));
      case "POST auth/google": return send(res, 200, await google(body, ip));
      case "GET auth/me": {
        const c = requireAuth(req);
        if (c.role === "ceo") return send(res, 200, { user: publicUser(ceoUser()) });
        const u = await rds.getJSON("lv:user:" + c.uid);
        if (!u) throw E(401, "unauthorized", "Please sign in again");
        return send(res, 200, { user: publicUser(u) });
      }
      case "POST apply": return send(res, 200, await apply(body, ip));
      case "GET apply/status": return send(res, 200, await applyStatus(url.searchParams));
      case "POST gate/verify": {
        const c = requireAuth(req);
        await rateLimit("gate:" + c.uid, 30, 600, "unlocking");
        return send(res, 200, await checkLicense(c, body.license));
      }
      case "POST activity": return send(res, 200, await activity(requireAuth(req), body));
      case "POST flag": return send(res, 200, await flag(requireAuth(req), body));
      case "GET ceo/dashboard": requireCeo(req); return send(res, 200, await dashboard());
      case "GET ceo/application": requireCeo(req); return send(res, 200, await secrets(url.searchParams));
      case "POST ceo/decide": requireCeo(req); return send(res, 200, await decide(body));
      case "POST ceo/license-status": requireCeo(req); return send(res, 200, await licenseStatus(body));
      default: throw E(404, "not-found", "Unknown endpoint");
    }
  } catch (err) {
    if (err instanceof HttpError) {
      return send(res, err.status, { error: { code: err.code, title: err.title, reasons: err.reasons, field: err.field, ...err.extra } });
    }
    console.error("api error", err && err.stack ? err.stack : err);
    return send(res, 500, { error: { code: "server-error", title: "Something went wrong on our side", reasons: ["Please try again in a moment"] } });
  }
};
