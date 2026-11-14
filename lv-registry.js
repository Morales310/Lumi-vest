/* ============================================================
   LUMI-VEST — registry (licenses · agent applications · activity)

   One interface, two back-ends (picked by lv-api.js):
     remote  → the Vercel function in /api (shared across all devices)
     local   → this browser only (localStorage + IndexedDB), used for local
               previews. Photo + NIN live in IndexedDB "lumivest-temp" and are
               wiped as soon as a decision is made.
   ============================================================ */
(function () {
  "use strict";

  var CEO_EMAIL = "jesvelarrealestate@gmail.com";
  var K = { lic: "lumivest:licenses", apps: "lumivest:applications", act: "lumivest:activity", mine: "lumivest:my-application", flags: "lumivest:asset-flags", users: "lumivest:users" };
  var TEMP_TTL_MS = 14 * 24 * 60 * 60 * 1000;
  var LICENSE_RE = /^LV[A-Z]{1,4}\d{1,4}$/;
  var MAX_LICENSES = 1000;

  var API = function () { return window.LVApi; };
  var remote = function () { return !!API() && API().mode() === "remote"; };
  var ready = function () { return API() ? API().ready : Promise.resolve("local"); };

  /* ---------- tiny storage helpers ---------- */
  function rd(key, def) { try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? def : v; } catch (e) { return def; } }
  function wr(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } }
  var channel = null;
  try { channel = new BroadcastChannel("lumivest-registry"); } catch (e) {}
  function announce(type, data) { try { if (channel) channel.postMessage({ type: type, data: data || {} }); } catch (e) {} }

  function randomRef() {
    var a = new Uint8Array(6);
    crypto.getRandomValues(a);
    var alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var s = "";
    for (var i = 0; i < a.length; i++) s += alphabet[a[i] % alphabet.length];
    return "LV-" + s;
  }

  function normLicense(s) { return String(s || "").toUpperCase().replace(/[\s\-_.]/g, ""); }
  function initialsFrom(name) {
    var words = String(name || "").toUpperCase().replace(/[^A-Z\s]/g, " ").split(/\s+/).filter(Boolean);
    if (!words.length) return "XX";
    if (words.length === 1) return words[0].slice(0, 2).padEnd(2, "X");
    return words[0][0] + words[words.length - 1][0];
  }

  /* ============================================================
     LOCAL back-end
     ============================================================ */
  var L = {};

  L.activity = function () { return rd(K.act, []); };
  L.log = function (type, data) {
    var list = rd(K.act, []);
    list.push(Object.assign({ t: Date.now(), type: type }, data || {}));
    wr(K.act, list.slice(-3000));
  };

  /* every successful sign-up is counted (and logged), even if the account is later removed */
  L.countSignup = function (role) {
    if (role !== "customer" && role !== "agent" && role !== "company") return;
    var c = rd("lumivest:signups", { total: 0, customer: 0, agent: 0, company: 0 });
    c.total = (c.total || 0) + 1;
    c[role] = (c[role] || 0) + 1;
    wr("lumivest:signups", c);
    L.log("signup", { role: role });
  };

  L.licenses = function () { return rd(K.lic, []); };
  L.getLicense = function (id) {
    id = normLicense(id);
    return L.licenses().filter(function (l) { return l.id === id; })[0] || null;
  };
  function saveLicenses(list) { wr(K.lic, list); }

  function issueLicense(app) {
    var list = L.licenses();
    var serial = list.length + 1;
    if (serial > MAX_LICENSES) throw new Error("License capacity (" + MAX_LICENSES + ") reached");
    var who = app.kind === "company" && app.company ? app.company : app.fullName;
    var lic = {
      id: "LV" + initialsFrom(who) + String(serial).padStart(3, "0"), serial: serial, kind: app.kind, name: app.fullName,
      company: app.company || "", email: String(app.email).toLowerCase(), phone: app.phone, address: app.address,
      status: "active", issued: Date.now(), appRef: app.ref, boundUid: "",
    };
    list.push(lic);
    saveLicenses(list);
    L.log("license_issued", { license: lic.id, kind: lic.kind });
    return lic;
  }

  L.setLicenseStatus = function (id, status) {
    var list = L.licenses();
    var lic = list.filter(function (l) { return l.id === normLicense(id); })[0];
    if (!lic) return null;
    lic.status = status;
    lic.statusChanged = Date.now();
    saveLicenses(list);
    L.log("license_" + status, { license: lic.id });
    announce("license", { id: lic.id });
    return lic;
  };

  L.checkForSignup = function (id, role, email) {
    var lic = L.getLicense(id);
    var fail = function (title, reasons) { return { ok: false, title: title, reasons: reasons }; };
    if (!LICENSE_RE.test(normLicense(id))) return fail("That license ID isn’t valid", ["License IDs look like LVJD007 — “LV”, the holder’s initials, then a number"]);
    if (!lic) return fail("We don’t recognise that license ID", ["It may contain a typo — check it against your approval message", "The application may not have been approved yet", "It may have been issued on a different device than this one"]);
    if (lic.status !== "active") return fail("That license isn’t active", ["The license has been " + lic.status + " by the LUMI-VEST CEO", "Contact the LUMI-VEST team for help"]);
    if (lic.kind !== role) return fail("That license is for a different account type", ["This is " + (lic.kind === "company" ? "a company" : "an agent") + " license — choose “" + (lic.kind === "company" ? "Company" : "Agent") + "” above"]);
    if (lic.boundUid) return fail("That license is already in use", ["Each license can be linked to one account only", "If this is yours, sign in instead of creating a new account"]);
    if (String(email || "").toLowerCase() !== lic.email) return fail("The email doesn’t match this license", ["Sign up with the same email address you used on your application"]);
    return { ok: true, lic: lic };
  };

  L.bindLicense = function (id, uid) {
    var list = L.licenses();
    var lic = list.filter(function (l) { return l.id === normLicense(id); })[0];
    if (!lic) return;
    lic.boundUid = uid;
    saveLicenses(list);
    L.log("license_claimed", { license: lic.id });
  };

  /* temporary applicant store (IndexedDB) */
  function idb() {
    return new Promise(function (resolve, reject) {
      var r = indexedDB.open("lumivest-temp", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("applicants", { keyPath: "ref" }); };
      r.onsuccess = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
    });
  }
  function tx(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var t = db.transaction("applicants", mode);
        var req = fn(t.objectStore("applicants"));
        t.oncomplete = function () { db.close(); resolve(req ? req.result : undefined); };
        t.onerror = function () { db.close(); reject(t.error); };
        t.onabort = function () { db.close(); reject(t.error); };
      });
    });
  }
  var putTemp = function (rec) { return tx("readwrite", function (s) { return s.put(rec); }); };
  var getTemp = function (ref) { return tx("readonly", function (s) { return s.get(ref); }); };
  var dropTemp = function (ref) { return tx("readwrite", function (s) { return s.delete(ref); }); };

  L.applications = function () {
    var list = rd(K.apps, []);
    var changed = false;
    list.forEach(function (a) {
      if (a.status === "pending" && Date.now() > a.expires) {
        a.status = "expired"; a.decidedAt = Date.now(); changed = true;
        dropTemp(a.ref).catch(function () {});
      }
    });
    if (changed) wr(K.apps, list);
    return list;
  };

  L.submit = async function (fields, photo) {
    var list = L.applications();
    var email = String(fields.email).trim().toLowerCase();
    var dup = list.filter(function (a) { return a.email === email && (a.status === "pending" || a.status === "accepted"); })[0];
    if (dup) {
      var err = new Error("duplicate");
      err.reasons = dup.status === "accepted"
        ? ["This email already has an approved license — sign up with it instead"]
        : ["An application for this email is already waiting for review (reference " + dup.ref + ")"];
      throw err;
    }
    var ref = randomRef(), now = Date.now();
    await putTemp({ ref: ref, nin: fields.nin, photo: photo, exp: now + TEMP_TTL_MS });
    list.push({
      ref: ref, kind: fields.kind === "company" ? "company" : "agent", fullName: fields.fullName, company: fields.company || "",
      phone: fields.phone, email: email, address: fields.address, ninMasked: "•••••••" + String(fields.nin).slice(-4),
      status: "pending", created: now, expires: now + TEMP_TTL_MS,
    });
    wr(K.apps, list);
    L.log("application_submitted", { ref: ref, kind: fields.kind });
    announce("application", { ref: ref });
    return ref;
  };

  L.decide = async function (ref, decision) {
    var list = L.applications();
    var app = list.filter(function (a) { return a.ref === ref; })[0];
    if (!app || app.status !== "pending") return null;
    if (decision === "accepted") app.licenseId = issueLicense(app).id;
    app.status = decision;
    app.decidedAt = Date.now();
    wr(K.apps, list);
    try { await dropTemp(ref); } catch (e) {}
    L.log("application_" + decision, { ref: ref, kind: app.kind });
    announce("application", { ref: ref });
    return app;
  };

  L.track = function (ref, email) {
    ref = String(ref || "").trim().toUpperCase();
    var app = L.applications().filter(function (a) { return a.ref === ref; })[0];
    if (!app) return null;
    if (String(email || "").trim().toLowerCase() !== app.email) return null;
    return { ref: app.ref, kind: app.kind, status: app.status, licenseId: app.licenseId || "", note: app.note || "", name: app.fullName, created: app.created };
  };

  L.secrets = async function (ref) {
    try {
      var t = await getTemp(ref);
      return { nin: t && t.nin ? t.nin : "", url: t && t.photo ? URL.createObjectURL(t.photo) : "" };
    } catch (e) { return { nin: "", url: "" }; }
  };

  L.dashboard = async function () {
    var users = rd(K.users, []);
    return {
      applications: L.applications(), licenses: L.licenses(),
      users: (Array.isArray(users) ? users : []).map(function (u) { return { role: u.role || "customer", created: u.created || 0 }; }),
      activity: L.activity(), flags: rd(K.flags, []),
      signups: Object.assign({ total: 0, customer: 0, agent: 0, company: 0 }, rd("lumivest:signups", {})),
    };
  };

  L.verifyLicense = async function (input) {
    var s = window.LumiAuth && window.LumiAuth.getSession();
    if (!s) return { ok: false, title: "Please sign in again", reasons: [] };
    if (s.role === "ceo") return { ok: true };
    var lid = normLicense(input || s.license);
    if (lid !== s.license) return { ok: false, code: "license-mismatch", title: "That license ID doesn’t belong to this account", reasons: [] };
    var lic = L.getLicense(lid);
    if (!lic || lic.status !== "active") return { ok: false, code: "license-inactive", title: "This license isn’t " + (lic ? lic.status : "recognised"), reasons: ["The license has been " + (lic ? lic.status : "removed") + " by the LUMI-VEST CEO"] };
    return { ok: true, license: lic.id };
  };

  /* ============================================================
     REMOTE back-end (thin wrappers over /api)
     ============================================================ */
  var Rm = {};
  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(fr.error); };
      fr.readAsDataURL(blob);
    });
  }
  Rm.submit = async function (fields, photo) {
    var body = Object.assign({}, fields, { photo: await blobToDataUrl(photo) });
    try {
      var r = await API().call("POST", "apply", body);
      return r.ref;
    } catch (e) {
      if (e.name === "ApiError" && e.reasons && e.reasons.length) { var x = new Error(e.title); x.reasons = e.reasons; throw x; }
      throw e;
    }
  };
  Rm.track = async function (ref, email) {
    var r = await API().call("GET", "apply/status?ref=" + encodeURIComponent(ref) + "&email=" + encodeURIComponent(email || ""));
    return r.found ? { ref: r.ref, kind: r.kind, status: r.status, licenseId: r.licenseId, note: r.note, name: r.name, created: r.created } : null;
  };
  Rm.dashboard = function () { return API().call("GET", "ceo/dashboard"); };
  Rm.secrets = async function (ref) {
    var r = await API().call("GET", "ceo/application?ref=" + encodeURIComponent(ref));
    return { nin: r.nin || "", url: r.photo || "" };
  };
  Rm.decide = async function (ref, decision) { return (await API().call("POST", "ceo/decide", { ref: ref, decision: decision })).application; };
  Rm.setLicenseStatus = async function (id, status) { return (await API().call("POST", "ceo/license-status", { id: id, status: status })).license; };
  Rm.log = function (type, data) { return API().call("POST", "activity", Object.assign({ type: type }, data || {})).catch(function () {}); };
  Rm.flag = function (entry) { return API().call("POST", "flag", entry).catch(function () {}); };
  Rm.verifyLicense = async function (input) {
    try {
      var r = await API().call("POST", "gate/verify", { license: input });
      return Object.assign({ ok: true }, r);
    } catch (e) {
      return { ok: false, code: e.code, title: e.title, reasons: e.reasons || [] };
    }
  };

  /* ============================================================
     public facade
     ============================================================ */
  var pick = function (name) {
    return function () {
      var self = this, args = arguments;
      return ready().then(function () { return (remote() ? Rm[name] || L[name] : L[name]).apply(self, args); });
    };
  };

  var listeners = [], pollTimer = null;
  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(function () {
      if (document.visibilityState === "visible") listeners.forEach(function (fn) { fn("poll"); });
    }, 15000);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") listeners.forEach(function (fn) { fn("visible"); });
    });
  }

  window.LVRegistry = {
    CEO_EMAIL: CEO_EMAIL,
    LICENSE_RE: LICENSE_RE,
    ready: ready,
    mode: function () { return remote() ? "remote" : "local"; },
    normLicense: normLicense,
    initialsFrom: initialsFrom,
    local: { checkForSignup: L.checkForSignup, bindLicense: L.bindLicense, getLicense: L.getLicense, licenses: L.licenses, countSignup: L.countSignup },

    submitApplication: async function (fields, photo) {
      await ready();
      var ref = await (remote() ? Rm.submit : L.submit)(fields, photo);
      wr(K.mine, { ref: ref, email: String(fields.email).trim().toLowerCase() });
      return ref;
    },
    track: function (ref, email) { return ready().then(function () { return remote() ? Rm.track(ref, email) : L.track(ref, email); }); },
    myApplication: function () { return rd(K.mine, null); },
    rememberApplication: function (ref, email) { wr(K.mine, { ref: ref, email: String(email).trim().toLowerCase() }); },
    forgetApplication: function () { try { localStorage.removeItem(K.mine); } catch (e) {} },

    dashboard: pick("dashboard"),
    secrets: pick("secrets"),
    decide: pick("decide"),
    setLicenseStatus: pick("setLicenseStatus"),
    verifyLicense: pick("verifyLicense"),
    log: function (type, data) {
      return ready().then(function () { return remote() ? Rm.log(type, data) : L.log(type, data); });
    },
    flag: function (entry) {
      return ready().then(function () { return remote() ? Rm.flag(entry) : undefined; });
    },

    /** fn is called when something may have changed (other tab, or a poll of the server) */
    onChange: function (fn) {
      listeners.push(fn);
      window.addEventListener("storage", function (e) { if (e.key && e.key.indexOf("lumivest:") === 0 && !remote()) fn(e.key); });
      if (channel) channel.addEventListener("message", function () { if (!remote()) fn("broadcast"); });
      ready().then(function () { if (remote()) startPolling(); });
    },
  };
})();
