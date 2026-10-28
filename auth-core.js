/* ============================================================
   LUMI-VEST — auth core (shared by auth.html and index.html)

   • Theme bootstrap (runs immediately, before first paint)
   • Session storage + validation
   • Account store with salted PBKDF2-SHA256 password hashing
   • Google Identity Services ID-token handling
   • Page guard: <script src="auth-core.js" data-guard></script>

   NOTE: this is a static site, so accounts live in the visitor's browser.
   That is a UX gate, not server-side security. To make it real, replace the
   methods on `LumiAuth.provider` with calls to a backend (Cloudflare Worker,
   Supabase, Firebase…) — the UI in auth.js does not need to change.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- config ---------- */
  var CONFIG = {
    // Google Cloud Console → APIs & Services → Credentials → OAuth client ID
    // (type "Web application"). Add your site origin under "Authorised JavaScript origins".
    GOOGLE_CLIENT_ID: "",
    LOGIN_PAGE: "auth.html",
    HOME_PAGE: "index.html",
    SESSION_KEY: "lumivest:session",
    USERS_KEY: "lumivest:users",
    ATTEMPTS_KEY: "lumivest:auth-attempts",
    THEME_KEY: "lumivest:theme",
    SESSION_SHORT_MS: 12 * 60 * 60 * 1000, // not "remember me"
    SESSION_LONG_MS: 30 * 24 * 60 * 60 * 1000, // "remember me"
    PBKDF2_ITERATIONS: 600000, // OWASP 2023 guidance for PBKDF2-HMAC-SHA256
    MAX_FAILS: 5,
    LOCK_BASE_MS: 30 * 1000,
    LOCK_MAX_MS: 15 * 60 * 1000,
  };

  /* ---------- theme bootstrap (same key + behaviour as the main site) ---------- */
  try {
    var t = JSON.parse(localStorage.getItem(CONFIG.THEME_KEY));
    if (!t) t = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    if (t === "light") document.documentElement.classList.add("light");
  } catch (e) {}

  /* ---------- errors ---------- */
  function AuthError(code, title, reasons, field) {
    var e = new Error(title);
    e.name = "AuthError";
    e.code = code;
    e.title = title;
    e.reasons = reasons || [];
    e.field = field || null;
    e.retryMs = 0;
    e.withRetry = function (ms) { e.retryMs = ms; return e; };
    return e;
  }

  /* ---------- safe storage wrappers ---------- */
  function read(store, key) {
    try {
      var raw = store.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function write(store, key, value) {
    try {
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }
  function drop(store, key) {
    try {
      store.removeItem(key);
    } catch (e) {}
  }
  function storageAvailable() {
    try {
      var k = "__lv_test__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- encoding / crypto helpers ---------- */
  function b64(buf) {
    var bytes = new Uint8Array(buf), s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }
  function unb64(str) {
    var s = atob(str), out = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function randomId(bytes) {
    var a = new Uint8Array(bytes || 16);
    crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  function cryptoReady() {
    return !!(window.crypto && crypto.subtle && crypto.getRandomValues);
  }
  function requireCrypto() {
    if (!cryptoReady()) {
      throw AuthError("no-crypto", "Secure sign-in isn’t available here", [
        "This page is not served over HTTPS (browsers disable secure hashing on plain http, except on localhost)",
        "Your browser is too old to support the Web Crypto API",
      ]);
    }
  }
  async function hashPassword(password, salt, iterations) {
    var key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveBits"]
    );
    return crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: salt, iterations: iterations }, key, 256
    );
  }
  function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    var r = 0;
    for (var i = 0; i < a.length; i++) r |= a[i] ^ b[i];
    return r === 0;
  }

  /* ---------- normalisation + validation ---------- */
  var ROLES = {
    customer: { label: "Customer", noun: "customer" },
    agent: { label: "Agent", noun: "agent" },
    company: { label: "Real estate company", noun: "company" },
  };
  var withArticle = function (r) { return (r === "agent" ? "an " : "a ") + ROLES[r].label.toLowerCase(); };
  var roleOf = function (u) { return ROLES[u && u.role] ? u.role : "customer"; };
  var PHONE_RE = /^\+?[0-9][0-9\s\-()]{6,17}$/;
  var REG_RE = /^(RC|BN|IT)?[\s\-]?\d{4,9}$/i; // CAC registration number, e.g. RC 1234567

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var USERNAME_RE = /^[A-Za-z][A-Za-z0-9._]{2,19}$/;
  var COMMON = ["password", "password1", "password123", "12345678", "123456789", "1234567890", "qwerty123",
    "qwertyuiop", "iloveyou", "admin123", "welcome1", "letmein123", "abc12345", "11111111", "00000000",
    "lumivest", "lumi-vest", "lumivest123", "kaduna123", "passw0rd"];

  var normEmail = function (v) { return String(v || "").normalize("NFKC").trim().toLowerCase(); };
  var normUser = function (v) { return String(v || "").normalize("NFKC").trim().toLowerCase(); };

  function passwordIssues(pw, ctx) {
    var out = [];
    if (pw.length < 8) out.push("Use at least 8 characters");
    if (pw.length > 128) out.push("Use at most 128 characters");
    if (COMMON.indexOf(pw.toLowerCase()) !== -1) out.push("That password is on the list of most commonly used passwords");
    if (ctx) {
      var low = pw.toLowerCase();
      var local = ctx.email ? ctx.email.split("@")[0] : "";
      if (ctx.username && ctx.username.length >= 3 && low.indexOf(ctx.username) !== -1) out.push("Don’t include your username in the password");
      if (local.length >= 4 && low.indexOf(local) !== -1) out.push("Don’t include your email name in the password");
    }
    if (/^(.)\1+$/.test(pw)) out.push("Don’t repeat a single character");
    return out;
  }
  function passwordScore(pw) {
    // 0–4, length-weighted (long passphrases beat forced complexity)
    if (!pw) return 0;
    var classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(function (r) { return r.test(pw); }).length;
    var s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (pw.length >= 16 || (pw.length >= 12 && classes >= 3)) s++;
    if (classes >= 3 && pw.length >= 10) s++;
    if (COMMON.indexOf(pw.toLowerCase()) !== -1 || /^(.)\1+$/.test(pw)) s = Math.min(s, 1);
    return Math.min(s, 4);
  }

  /* ---------- users ---------- */
  function getUsers() {
    var u = read(localStorage, CONFIG.USERS_KEY);
    return Array.isArray(u) ? u : [];
  }
  function saveUsers(list) {
    if (!write(localStorage, CONFIG.USERS_KEY, list)) {
      throw AuthError("storage", "We couldn’t save your account", [
        "Your browser is blocking site storage (private mode or cookies disabled)",
        "Storage is full — free some space and try again",
      ]);
    }
  }
  function publicUser(u) {
    return {
      uid: u.id, name: u.name, username: u.username, email: u.email, picture: u.picture || "", provider: u.provider,
      role: roleOf(u), company: u.company || "", agency: u.agency || "",
    };
  }

  /* ---------- sessions ---------- */
  function getSession() {
    var s = read(sessionStorage, CONFIG.SESSION_KEY) || read(localStorage, CONFIG.SESSION_KEY);
    if (!s || typeof s !== "object" || !s.uid || !s.exp) return null;
    if (Date.now() >= s.exp || s.iat > Date.now() + 60000) {
      clearSession();
      return null;
    }
    s.role = roleOf(s);
    return s;
  }
  function startSession(user, remember) {
    clearSession();
    var now = Date.now();
    var s = {
      uid: user.uid, name: user.name, username: user.username, email: user.email,
      picture: user.picture || "", provider: user.provider,
      role: roleOf(user), company: user.company || "", agency: user.agency || "",
      iat: now, exp: now + (remember ? CONFIG.SESSION_LONG_MS : CONFIG.SESSION_SHORT_MS),
    };
    var ok = write(remember ? localStorage : sessionStorage, CONFIG.SESSION_KEY, s);
    if (!ok) {
      throw AuthError("storage", "We couldn’t start your session", [
        "Your browser is blocking site storage (private mode or cookies disabled)",
      ]);
    }
    return s;
  }
  function clearSession() {
    drop(sessionStorage, CONFIG.SESSION_KEY);
    drop(localStorage, CONFIG.SESSION_KEY);
  }

  /* ---------- brute-force throttle (per identifier, persisted) ---------- */
  function attemptsMap() { return read(localStorage, CONFIG.ATTEMPTS_KEY) || {}; }
  function lockRemaining(id) {
    var rec = attemptsMap()[id];
    return rec && rec.until > Date.now() ? rec.until - Date.now() : 0;
  }
  function registerFail(id) {
    var all = attemptsMap(), rec = all[id] || { n: 0, until: 0, lockouts: 0 };
    if (rec.until && rec.until <= Date.now() && rec.n >= CONFIG.MAX_FAILS) rec.n = 0;
    rec.n += 1;
    if (rec.n >= CONFIG.MAX_FAILS) {
      rec.lockouts += 1;
      rec.until = Date.now() + Math.min(CONFIG.LOCK_BASE_MS * Math.pow(2, rec.lockouts - 1), CONFIG.LOCK_MAX_MS);
    }
    all[id] = rec;
    write(localStorage, CONFIG.ATTEMPTS_KEY, all);
    return rec;
  }
  function clearFails(id) {
    var all = attemptsMap();
    delete all[id];
    write(localStorage, CONFIG.ATTEMPTS_KEY, all);
  }

  /* ---------- provider (swap these for a real backend) ---------- */
  var provider = {
    async signUp(f) {
      requireCrypto();
      var role = ROLES[f.role] ? f.role : "customer";
      var clean = function (v) { return String(v || "").normalize("NFKC").trim().replace(/\s+/g, " "); };
      var name = clean(f.name);
      var missing = [];
      if (clean(f.firstName).length < 2) missing.push("First name");
      if (clean(f.lastName).length < 2) missing.push("Last name");
      if (!PHONE_RE.test(clean(f.phone))) missing.push("Phone number");
      if (clean(f.address).length < 8) missing.push("Address");
      if (role !== "agent") {
        var locs = window.NG_LOCATIONS;
        if (!clean(f.state) || (locs && !locs[clean(f.state)])) missing.push("State");
        if (!clean(f.lga) || (locs && locs[clean(f.state)] && locs[clean(f.state)].indexOf(clean(f.lga)) === -1)) missing.push("Local government");
      }
      if (missing.length) throw AuthError("missing", "Required details are missing", missing.map(function (m) { return m + " is required"; }));
      var email = normEmail(f.email), username = normUser(f.username);
      var users = getUsers();

      if (users.some(function (u) { return u.email === email; })) {
        throw AuthError("email-taken", "An account with that email already exists", [
          "You may already have signed up — switch to Sign in",
          "If you registered with Google, use the “Continue with Google” button",
        ], "email");
      }
      if (users.some(function (u) { return u.usernameKey === username; })) {
        throw AuthError("username-taken", "That username is already taken", [
          "Someone else registered it first — try adding numbers or an underscore",
        ], "username");
      }
      var salt = crypto.getRandomValues(new Uint8Array(16));
      var hash = await hashPassword(f.password, salt, CONFIG.PBKDF2_ITERATIONS);
      var user = {
        id: randomId(12), name: name, username: f.username.trim(), usernameKey: username, email: email,
        role: role, provider: "password", salt: b64(salt), hash: b64(hash), iter: CONFIG.PBKDF2_ITERATIONS, created: Date.now(),
      };
      user.firstName = clean(f.firstName);
      user.lastName = clean(f.lastName);
      user.phone = clean(f.phone);
      user.address = clean(f.address);
      if (role !== "agent") { user.state = clean(f.state); user.lga = clean(f.lga); }
      if (role !== "customer") {
        user.verified = false; // licence / CAC details are recorded, not checked (no server)
        if (role === "agent") { user.agency = clean(f.agency); user.licence = clean(f.licence); }
        if (role === "company") { user.company = clean(f.company); user.regNo = clean(f.regNo).toUpperCase(); }
      }
      users.push(user);
      saveUsers(users);
      return publicUser(user);
    },

    async signIn(f) {
      requireCrypto();
      var id = normEmail(f.identifier);
      var lock = lockRemaining(id);
      if (lock) {
        throw AuthError("locked", "Too many failed attempts", [
          "Several wrong passwords were entered for this account on this device",
          "Try again in " + Math.ceil(lock / 1000) + " seconds, or sign in with Google",
        ], null).withRetry(lock);
      }
      var users = getUsers();
      var user = users.find(function (u) { return u.email === id || u.usernameKey === id; });

      // Always do one hash so "unknown account" and "wrong password" take similar time.
      var salt = user && user.salt ? unb64(user.salt) : crypto.getRandomValues(new Uint8Array(16));
      var iter = user && user.iter ? user.iter : CONFIG.PBKDF2_ITERATIONS;
      var derived = new Uint8Array(await hashPassword(f.password, salt, iter));
      var ok = !!(user && user.hash && safeEqual(derived, unb64(user.hash)));

      if (!ok) {
        var rec = registerFail(id);
        var reasons = [
          "No account matches that email or username — check for typos or create an account",
          "The password is incorrect (passwords are case-sensitive)",
          "The account may have been created with Google — use “Continue with Google”",
        ];
        if (f.capsLock) reasons.unshift("Caps Lock is on");
        var left = CONFIG.MAX_FAILS - rec.n;
        if (rec.until > Date.now()) {
          reasons.push("Too many attempts — sign-in is paused for " + Math.ceil((rec.until - Date.now()) / 1000) + " seconds");
        } else if (left <= 2 && left > 0) {
          reasons.push(left + " attempt" + (left === 1 ? "" : "s") + " left before a temporary pause");
        }
        var err = AuthError("bad-credentials", "We couldn’t sign you in", reasons, "password");
        if (rec.until > Date.now()) err.retryMs = rec.until - Date.now();
        throw err;
      }
      clearFails(id);
      var want = ROLES[f.role] ? f.role : "customer";
      if (roleOf(user) !== want) {
        // credentials are correct here, so it is safe to say which account type this is
        throw AuthError("role-mismatch", "Wrong account type selected", [
          "These details belong to " + withArticle(roleOf(user)) + " account, not " + withArticle(want) + " account",
          "Choose “" + ROLES[roleOf(user)].label + "” above, then sign in again",
        ], "role");
      }
      return publicUser(user);
    },

    /** Handles a Google ID token. Claims are checked client-side only. */
    async signInWithGoogle(credential, expectedNonce, role) {
      role = ROLES[role] ? role : "customer";
      var claims = decodeJwt(credential);
      if (!claims) {
        throw AuthError("google-bad-token", "Google sign-in failed", ["Google returned a response we couldn’t read — please try again"]);
      }
      var problems = [];
      if (claims.aud !== CONFIG.GOOGLE_CLIENT_ID) problems.push("The token was issued for a different app (client ID mismatch)");
      if (claims.iss !== "https://accounts.google.com" && claims.iss !== "accounts.google.com") problems.push("The token didn’t come from Google");
      if (!claims.exp || claims.exp * 1000 < Date.now() - 60000) problems.push("The Google sign-in expired — please try again");
      if (expectedNonce && claims.nonce !== expectedNonce) problems.push("The sign-in request couldn’t be verified (nonce mismatch) — refresh and try again");
      if (problems.length) throw AuthError("google-invalid", "Google sign-in was rejected", problems);
      if (claims.email_verified === false || !claims.email) {
        throw AuthError("google-unverified", "Your Google email isn’t verified", [
          "Google hasn’t confirmed ownership of " + (claims.email || "that email"),
          "Verify the address in your Google account, then try again",
        ]);
      }
      var email = normEmail(claims.email);
      var users = getUsers();
      var user = users.find(function (u) { return u.email === email; });
      if (user && roleOf(user) !== role) {
        throw AuthError("role-mismatch", "Wrong account type selected", [
          "That Google account is registered as " + withArticle(roleOf(user)) + " account",
          "Choose “" + ROLES[roleOf(user)].label + "” above, then continue with Google again",
        ], "role");
      }
      if (!user) {
        var base = email.split("@")[0].replace(/[^a-z0-9._]/g, "").replace(/^[^a-z]+/, "") || "user";
        var uname = base.slice(0, 16), n = 0;
        while (users.some(function (u) { return u.usernameKey === uname; })) uname = base.slice(0, 14) + (++n);
        user = {
          id: randomId(12), name: claims.name || base, username: uname, usernameKey: uname, email: email,
          role: role, provider: "google", googleSub: claims.sub, picture: claims.picture || "", created: Date.now(),
          verified: false,
        };
        users.push(user);
        saveUsers(users);
      } else if (!user.googleSub) {
        user.googleSub = claims.sub;
        if (!user.picture && claims.picture) user.picture = claims.picture;
        saveUsers(users);
      } else if (user.googleSub !== claims.sub) {
        throw AuthError("google-mismatch", "This email is linked to a different Google account", [
          "Sign in with the Google account you originally used for this email",
        ]);
      }
      return publicUser(user);
    },
  };

  function decodeJwt(token) {
    try {
      var part = String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      while (part.length % 4) part += "=";
      var json = decodeURIComponent(
        Array.prototype.map.call(atob(part), function (c) { return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2); }).join("")
      );
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  /* ---------- redirects ---------- */
  function safeNext(raw) {
    // same-site relative paths only → no open redirects
    if (typeof raw !== "string" || !/^[A-Za-z0-9_\-./]+(\?[A-Za-z0-9_\-=&.%]*)?(#[A-Za-z0-9_\-]*)?$/.test(raw)) return CONFIG.HOME_PAGE;
    if (raw.charAt(0) === "/" || raw.indexOf("..") !== -1 || raw.indexOf("auth.html") === 0) return CONFIG.HOME_PAGE;
    return raw;
  }
  function currentTarget() {
    var file = location.pathname.split("/").pop() || CONFIG.HOME_PAGE;
    return file + location.search + location.hash;
  }
  function guard() {
    if (getSession()) return true;
    document.documentElement.classList.add("auth-pending");
    location.replace(CONFIG.LOGIN_PAGE + "?next=" + encodeURIComponent(currentTarget()));
    return false;
  }
  function signOut() {
    clearSession();
    location.replace(CONFIG.LOGIN_PAGE + "?signedout=1");
  }

  // Keep tabs in sync: signing out (or in) in one tab updates the others.
  window.addEventListener("storage", function (e) {
    if (e.key !== CONFIG.SESSION_KEY) return;
    var onLogin = /auth\.html$/.test(location.pathname);
    if (!onLogin && !getSession()) guard();
  });

  window.LumiAuth = {
    config: CONFIG,
    AuthError: AuthError,
    provider: provider,
    getSession: getSession,
    startSession: startSession,
    clearSession: clearSession,
    signOut: signOut,
    initialsOf: initialsOf,
    guard: guard,
    safeNext: safeNext,
    passwordIssues: passwordIssues,
    passwordScore: passwordScore,
    ROLES: ROLES,
    roleOf: roleOf,
    validators: { email: EMAIL_RE, username: USERNAME_RE, phone: PHONE_RE, reg: REG_RE },
    normEmail: normEmail,
    normUser: normUser,
    storageAvailable: storageAvailable,
    cryptoReady: cryptoReady,
    randomId: randomId,
  };

  /* ---------- signed-in UI that must work even if script.js is cached/stale ---------- */
  function initialsOf(s) {
    var parts = String((s && (s.name || s.username || s.email)) || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    var a = parts[0].charAt(0), b = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (a + b).toUpperCase();
  }
  function paintUser() {
    var s = getSession();
    var dot = document.querySelector(".avatar-dot");
    if (s && dot) dot.textContent = initialsOf(s);
  }
  document.addEventListener("DOMContentLoaded", paintUser);
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('[data-menu="signout"]');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    signOut();
  }, true);

  var me = document.currentScript;
  if (me && me.hasAttribute("data-guard")) guard();
})();
