/* ============================================================
   LUMI-VEST — auth page behaviour
   ============================================================ */
(function () {
  "use strict";

  var Auth = window.LumiAuth;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var params = new URLSearchParams(location.search);
  var NEXT = Auth.safeNext(params.get("next"));

  /* ---------------- account type ---------------- */
  var ROLES = Auth.ROLES;
  var role = ROLES[params.get("role")] ? params.get("role") : "customer";
  var rolesBox = document.getElementById("roles");
  var SUBS = {
    customer: "Sign in to browse and save verified homes across Kaduna.",
    agent: "Sign in to list and manage your properties.",
    company: "Sign in to manage your company’s listings.",
  };
  var SU_SUBS = {
    customer: "It takes under a minute. No spam, ever.",
    agent: "Create an agent account to list properties on LUMI-VEST.",
    company: "Register your real estate company to list properties.",
  };

  /* Already signed in → straight through (also covers back/forward cache). */
  function bounceIfSignedIn() {
    if (Auth.getSession()) location.replace(NEXT);
  }
  bounceIfSignedIn();
  addEventListener("pageshow", function (e) { if (e.persisted) bounceIfSignedIn(); });

  /* ---------------- alerts ---------------- */
  var ICON_ERR = '<svg class="alert-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01" stroke-linecap="round"/></svg>';
  var ICON_OK = '<svg class="alert-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function showAlert(box, o) {
    box.textContent = "";
    box.classList.toggle("alert--ok", o.type === "ok");
    box.insertAdjacentHTML("afterbegin", o.type === "ok" ? ICON_OK : ICON_ERR);

    var title = document.createElement("div");
    title.className = "alert-title";
    title.textContent = o.title; // textContent only — never inject HTML
    box.appendChild(title);

    var x = document.createElement("button");
    x.type = "button";
    x.className = "alert-x";
    x.setAttribute("aria-label", "Dismiss message");
    x.textContent = "×";
    x.addEventListener("click", function () { hideAlert(box); });
    box.appendChild(x);

    if (o.reasons && o.reasons.length) {
      var intro = document.createElement("ul");
      intro.className = "alert-list";
      o.reasons.forEach(function (r) {
        var li = document.createElement("li");
        li.textContent = r;
        intro.appendChild(li);
      });
      box.appendChild(intro);
    }

    box.hidden = false;
    box.classList.remove("is-shown", "shake");
    void box.offsetWidth; // restart animation
    box.classList.add(o.type === "ok" || reduceMotion ? "is-shown" : "shake");
    if (o.type !== "ok") {
      box.focus({ preventScroll: true });
      box.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
    }
  }
  function hideAlert(box) {
    box.hidden = true;
    box.textContent = "";
    box.classList.remove("is-shown", "shake", "alert--ok");
  }

  /* ---------------- field errors ---------------- */
  function setFieldError(input, msg) {
    var p = document.getElementById(input.id + "Err");
    if (!p) return;
    if (msg) {
      input.setAttribute("aria-invalid", "true");
      p.textContent = msg;
      p.hidden = false;
    } else {
      input.removeAttribute("aria-invalid");
      p.textContent = "";
      p.hidden = true;
    }
  }
  function clearFieldErrors(form) {
    $$("input, select", form).forEach(function (i) { setFieldError(i, ""); });
  }

  /* ---------------- theme toggle (same key/behaviour as the site) ---------------- */
  var themeBtn = $("#themeToggle");
  themeBtn.addEventListener("click", function () {
    var light = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", light);
    try { localStorage.setItem(Auth.config.THEME_KEY, JSON.stringify(light ? "light" : "dark")); } catch (e) {}
    $('meta[name="theme-color"]').content = light ? "#faf7f0" : "#0a0907";
    renderGoogleButtons();
  });
  if (document.documentElement.classList.contains("light")) $('meta[name="theme-color"]').content = "#faf7f0";

  /* ---------------- tabs ---------------- */
  var tabs = $("#authTabs");
  var TAB = {
    signin: { tab: $("#tabSignin"), panel: $("#panelSignin"), title: "Sign in · LUMI-VEST", focus: "#siId" },
    signup: { tab: $("#tabSignup"), panel: $("#panelSignup"), title: "Create account · LUMI-VEST", focus: "#suFirst" },
  };
  var current = "signin";

  function switchTab(name, opts) {
    opts = opts || {};
    if (!TAB[name]) return;
    Object.keys(TAB).forEach(function (k) {
      var on = k === name;
      TAB[k].tab.setAttribute("aria-selected", String(on));
      TAB[k].tab.tabIndex = on ? 0 : -1;
      TAB[k].panel.hidden = !on;
      TAB[k].panel.classList.remove("fade-in");
    });
    tabs.dataset.active = name;
    var panel = TAB[name].panel;
    void panel.offsetWidth;
    if (!reduceMotion) panel.classList.add("fade-in");
    document.title = TAB[name].title;
    if (opts.focusTab) TAB[name].tab.focus();
    if (opts.focusField) $(TAB[name].focus).focus({ preventScroll: true });
    if (current !== name && opts.updateHash !== false) history.replaceState(null, "", location.pathname + location.search + "#" + name);
    current = name;
    renderGoogleButtons();
  }

  tabs.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tab]");
    if (b) switchTab(b.dataset.tab, { focusTab: true });
  });
  tabs.addEventListener("keydown", function (e) {
    var order = ["signin", "signup"], i = order.indexOf(current), n = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = order[(i + 1) % 2];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = order[(i + 1) % 2];
    else if (e.key === "Home") n = "signin";
    else if (e.key === "End") n = "signup";
    if (n) { e.preventDefault(); switchTab(n, { focusTab: true }); }
  });
  $$(".link-btn[data-tab]").forEach(function (b) {
    b.addEventListener("click", function () { switchTab(b.dataset.tab, { focusField: true }); });
  });
  addEventListener("hashchange", function () {
    var h = location.hash.slice(1);
    if (TAB[h] && h !== current) switchTab(h, { updateHash: false });
  });

  function setRole(r, opts) {
    if (!ROLES[r]) return;
    role = r;
    $$('input[name="role"]', rolesBox).forEach(function (i) { i.checked = i.value === r; });
    var label = ROLES[r].label.toLowerCase();
    $("#siSub").textContent = SUBS[r];
    $("#suSub").textContent = SU_SUBS[r];
    $("#siLabel").textContent = "Sign in as " + label.replace("real estate ", "");
    $("#suLabel").textContent = r === "company" ? "Register company" : "Create " + label + " account";
    $("#siSubmit").dataset.label = $("#siLabel").textContent;
    $("#suSubmit").dataset.label = $("#suLabel").textContent;
    $("#suAddressLabel").textContent = ADDR[r][0];
    $("#suAddress").placeholder = ADDR[r][1];
    $$(".role-fields").forEach(function (f) {
      f.hidden = f.dataset.for.split(" ").indexOf(r) === -1;
    });
    $$(".role-fields input, .role-fields select").forEach(function (i) { setFieldError(i, ""); });
    hideAlert(siAlert);
    hideAlert(suAlert);
    if (opts && opts.fromUser) {
      try { sessionStorage.setItem("lumivest:auth-role", r); } catch (e) {}
    }
  }
  /* ---------------- state → local government ---------------- */
  var LOC = window.NG_LOCATIONS || {};
  var stateEl = $("#suState"), lgaEl = $("#suLga");
  Object.keys(LOC).forEach(function (s) {
    var o = document.createElement("option");
    o.value = s;
    o.textContent = s;
    stateEl.appendChild(o);
  });
  stateEl.addEventListener("change", function () {
    lgaEl.textContent = "";
    var first = document.createElement("option");
    first.value = "";
    first.textContent = stateEl.value ? "Select LGA" : "Select state first";
    lgaEl.appendChild(first);
    (LOC[stateEl.value] || []).forEach(function (l) {
      var o = document.createElement("option");
      o.value = l;
      o.textContent = l;
      lgaEl.appendChild(o);
    });
    lgaEl.disabled = !stateEl.value;
    setFieldError(stateEl, "");
    setFieldError(lgaEl, "");
  });
  lgaEl.addEventListener("change", function () { setFieldError(lgaEl, ""); });

  var ADDR = {
    customer: ["Home address", "House number, street, area"],
    agent: ["Location address", "Street, area, city, state"],
    company: ["Operating address", "Office address — street, area, city"],
  };

  rolesBox.addEventListener("change", function (e) {
    if (e.target.name === "role") setRole(e.target.value, { fromUser: true });
  });

  /* ---------------- password helpers ---------------- */
  $$(".pw-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = document.getElementById(btn.dataset.toggle);
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", String(show));
      btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      input.focus({ preventScroll: true });
    });
  });

  var capsOn = false;
  var capsNote = $("#siCaps");
  function trackCaps(e) {
    if (typeof e.getModifierState !== "function") return;
    capsOn = e.getModifierState("CapsLock");
    capsNote.hidden = !(capsOn && document.activeElement && document.activeElement.type === "password");
  }
  ["keydown", "keyup"].forEach(function (ev) {
    $$('input[type="password"], input[type="text"]').forEach(function (i) { i.addEventListener(ev, trackCaps); });
  });
  $("#siPassword").addEventListener("blur", function () { capsNote.hidden = true; });

  /* strength meter */
  var suPassword = $("#suPassword"), meter = $("#suMeter"), meterLabel = $("#suMeterLabel");
  var LABELS = ["Use 8+ characters — a longer phrase is stronger.", "Too weak — make it longer.", "Fair — add length or a few more character types.", "Good — almost there.", "Strong password."];
  suPassword.addEventListener("input", function () {
    var score = Auth.passwordScore(suPassword.value);
    meter.dataset.score = String(score);
    meterLabel.textContent = suPassword.value ? LABELS[score] : LABELS[0];
    if (suPassword.getAttribute("aria-invalid")) setFieldError(suPassword, "");
  });

  /* clear a field's error as soon as the user edits it */
  $$("form input").forEach(function (i) {
    i.addEventListener("input", function () { if (i.getAttribute("aria-invalid")) setFieldError(i, ""); });
  });

  /* ---------------- submit state ---------------- */
  var lockTimer = null;
  function setLoading(btn, on) {
    btn.disabled = on;
    btn.classList.toggle("is-loading", on);
    btn.setAttribute("aria-busy", String(on));
  }
  function lockButton(btn, ms) {
    var label = btn.dataset.label || "Sign in";
    clearInterval(lockTimer);
    var end = Date.now() + ms, lab = $(".btn-label", btn);
    btn.disabled = true;
    (function tick() {
      var left = Math.ceil((end - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(lockTimer);
        btn.disabled = false;
        lab.textContent = label;
        return;
      }
      lab.textContent = "Try again in " + left + "s";
    })();
    lockTimer = setInterval(function () {
      var left = Math.ceil((end - Date.now()) / 1000);
      if (left <= 0) { clearInterval(lockTimer); btn.disabled = false; lab.textContent = label; }
      else lab.textContent = "Try again in " + left + "s";
    }, 500);
  }

  function reportError(err, box, form, submitBtn, label) {
    if (err && err.name === "AuthError") {
      showAlert(box, { title: err.title, reasons: err.reasons });
      if (err.field === "role") {
        rolesBox.classList.remove("shake");
        void rolesBox.offsetWidth;
        rolesBox.classList.add("shake");
      } else if (err.field && form) {
        var el = form.querySelector('[name="' + err.field + '"]');
        if (el) { setFieldError(el, ""); el.setAttribute("aria-invalid", "true"); }
      }
      if (err.retryMs && submitBtn) lockButton(submitBtn, err.retryMs);
    } else {
      showAlert(box, {
        title: "Something went wrong",
        reasons: [
          "An unexpected error occurred in your browser" + (err && err.message ? " (" + err.message + ")" : ""),
          "Refreshing the page and trying again usually fixes it",
          "If it keeps happening, check that your browser allows site storage",
        ],
      });
    }
  }

  function finish(box, user, remember) {
    Auth.startSession(user, remember);
    var first = (user.name || user.username || "").split(" ")[0];
    showAlert(box, { type: "ok", title: "Welcome" + (first ? ", " + first : "") + "! Taking you in…" });
    setTimeout(function () { location.replace(NEXT); }, reduceMotion ? 150 : 700);
  }

  /* ---------------- sign in ---------------- */
  var siForm = $("#signinForm"), siAlert = $("#siAlert"), siBtn = $("#siSubmit");
  siForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideAlert(siAlert);
    clearFieldErrors(siForm);
    var idEl = $("#siId"), pwEl = $("#siPassword");
    var id = idEl.value.trim(), pw = pwEl.value;
    var reasons = [];

    if (!id) { reasons.push("Enter your email address or username"); setFieldError(idEl, "Required"); }
    else if (id.indexOf("@") !== -1 ? !Auth.validators.email.test(id) : !Auth.validators.username.test(id)) {
      reasons.push(id.indexOf("@") !== -1
        ? "That email address isn’t formatted correctly (e.g. name@example.com)"
        : "Usernames are 3–20 characters, start with a letter, and use only letters, numbers, “.” or “_”");
      setFieldError(idEl, "Check this and try again");
    }
    if (!pw) { reasons.push("Enter your password"); setFieldError(pwEl, "Required"); }
    if (reasons.length) {
      showAlert(siAlert, { title: "Please check your details", reasons: reasons });
      (siForm.querySelector('[aria-invalid="true"]') || idEl).focus({ preventScroll: true });
      return;
    }
    if (!Auth.storageAvailable()) return reportError(Auth.AuthError("storage", "Browser storage is blocked", [
      "You may be in a private/incognito window with storage disabled", "Cookies and site data are blocked for this site"]), siAlert);

    setLoading(siBtn, true);
    try {
      var user = await Auth.provider.signIn({ identifier: id, password: pw, capsLock: capsOn, role: role });
      finish(siAlert, user, $("#siRemember").checked);
    } catch (err) {
      setLoading(siBtn, false);
      pwEl.value = "";
      reportError(err, siAlert, siForm, siBtn);
      if (!err.retryMs && err.code !== "role-mismatch") pwEl.focus({ preventScroll: true });
    }
  });

  /* ---------------- sign up ---------------- */
  var suForm = $("#signupForm"), suAlert = $("#suAlert"), suBtn = $("#suSubmit");
  suForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideAlert(suAlert);
    clearFieldErrors(suForm);
    var f = {
      first: $("#suFirst"), last: $("#suLast"), address: $("#suAddress"), username: $("#suUsername"), email: $("#suEmail"),
      password: suPassword, confirm: $("#suConfirm"),
    };
    var reasons = [];
    function bad(el, short, long) { setFieldError(el, short); reasons.push(long); }

    f.phone = $("#suPhone"); f.company = $("#suCompany"); f.reg = $("#suReg");
    f.agency = $("#suAgency"); f.licence = $("#suLicence");
    var first = f.first.value.trim().replace(/\s+/g, " ");
    var last = f.last.value.trim().replace(/\s+/g, " ");
    var username = f.username.value.trim();
    var email = f.email.value.trim();
    var pw = f.password.value, cf = f.confirm.value;
    var who = role === "company" ? "the contact person’s" : "your";

    if (first.length < 2) bad(f.first, "Required", "Enter " + who + " first name (at least 2 characters)");
    if (last.length < 2) bad(f.last, "Required", "Enter " + who + " last name (at least 2 characters)");
    var phone = f.phone.value.trim();
    if (!phone) bad(f.phone, "Required", "Enter a phone number we can reach you on");
    else if (!Auth.validators.phone.test(phone)) bad(f.phone, "Not valid", "That phone number doesn’t look right (digits, spaces, “+” and “-” only)");
    var address = f.address.value.trim().replace(/\s+/g, " ");
    var addrName = ADDR[role][0].toLowerCase();
    if (!address) bad(f.address, "Required", "Enter your " + addrName);
    else if (address.length < 8) bad(f.address, "Too short", "The " + addrName + " is too short — include street, area and city");
    if (role !== "agent") {
      if (!stateEl.value) bad(stateEl, "Required", "Select your state");
      else if (!LOC[stateEl.value]) bad(stateEl, "Not valid", "Choose a state from the list");
      if (!lgaEl.value) bad(lgaEl, "Required", "Select your local government area");
      else if (LOC[stateEl.value] && LOC[stateEl.value].indexOf(lgaEl.value) === -1) bad(lgaEl, "Not valid", "Choose a local government that belongs to " + stateEl.value);
    }
    if (role === "company") {
      if (f.company.value.trim().length < 2) bad(f.company, "Required", "Enter your company’s registered name");
      var reg = f.reg.value.trim();
      if (!reg) bad(f.reg, "Required", "Enter your CAC registration number");
      else if (!Auth.validators.reg.test(reg)) bad(f.reg, "Not valid", "CAC numbers look like RC 1234567 (RC, BN or IT followed by 4–9 digits)");
    }
    if (!username) bad(f.username, "Required", "Choose a username");
    else if (!Auth.validators.username.test(username)) bad(f.username, "Not valid", "Usernames are 3–20 characters, start with a letter, and use only letters, numbers, “.” or “_”");
    if (!email) bad(f.email, "Required", "Enter your email address");
    else if (!Auth.validators.email.test(email)) bad(f.email, "Not valid", "That email address isn’t formatted correctly (e.g. name@example.com)");
    if (!pw) bad(f.password, "Required", "Create a password");
    else {
      var issues = Auth.passwordIssues(pw, { username: Auth.normUser(username), email: Auth.normEmail(email) });
      if (issues.length) bad(f.password, issues[0], "Password: " + issues.join("; "));
    }
    if (pw && cf !== pw) bad(f.confirm, "Doesn’t match", "The two passwords don’t match");
    else if (!cf) bad(f.confirm, "Required", "Re-enter your password to confirm it");

    if (reasons.length) {
      showAlert(suAlert, { title: "We couldn’t create your account yet", reasons: reasons });
      (suForm.querySelector('[aria-invalid="true"]') || f.name).focus({ preventScroll: true });
      return;
    }
    if (!Auth.storageAvailable()) return reportError(Auth.AuthError("storage", "Browser storage is blocked", [
      "You may be in a private/incognito window with storage disabled", "Cookies and site data are blocked for this site"]), suAlert);

    setLoading(suBtn, true);
    try {
      var user = await Auth.provider.signUp({
        role: role, firstName: first, lastName: last, name: first + " " + last, address: address, state: stateEl.value, lga: lgaEl.value, username: username, email: email, password: pw,
        phone: phone, company: f.company.value, regNo: f.reg.value,
        agency: f.agency.value, licence: f.licence.value,
      });
      finish(suAlert, user, false);
    } catch (err) {
      setLoading(suBtn, false);
      reportError(err, suAlert, suForm, suBtn);
      var bad2 = suForm.querySelector('[aria-invalid="true"]');
      if (bad2) { setFieldError(bad2, err.code === "email-taken" ? "Already registered" : "Already taken"); bad2.setAttribute("aria-invalid", "true"); bad2.focus({ preventScroll: true }); }
    }
  });

  /* ---------------- Google ---------------- */
  var CLIENT_ID = Auth.config.GOOGLE_CLIENT_ID;
  var gisState = "idle"; // idle | loading | ready | failed
  var gisNonce = Auth.cryptoReady() ? Auth.randomId(16) : String(Math.random()).slice(2);

  function activeAlert() { return current === "signin" ? siAlert : suAlert; }

  function googleError(kind, detail) {
    var map = {
      "not-configured": {
        title: "Google sign-in isn’t set up yet",
        reasons: ["The site owner hasn’t added a Google client ID yet (GOOGLE_CLIENT_ID in auth-core.js)",
          "Until then, sign in with your email or username and password"],
      },
      "load-failed": {
        title: "We couldn’t reach Google",
        reasons: [navigator.onLine === false ? "You appear to be offline" : "Your connection may be slow or unstable",
          "An ad blocker or privacy extension may be blocking accounts.google.com",
          "A school, work or network firewall may block Google sign-in"],
      },
      "origin": {
        title: "Google rejected this website",
        reasons: ["This site’s address isn’t listed under “Authorised JavaScript origins” for the client ID",
          "Open the site from its registered address (https://… or http://localhost)"],
      },
    };
    var m = map[kind] || { title: "Google sign-in failed", reasons: [detail || "Please try again in a moment"] };
    showAlert(activeAlert(), m);
  }

  var gisPromise = null;
  function loadGis() {
    if (gisPromise) return gisPromise;
    gisState = "loading";
    gisPromise = new Promise(function (resolve) {
      var s = document.createElement("script");
      var timer = setTimeout(function () { fail(); }, 9000);
      function fail() { clearTimeout(timer); gisState = "failed"; gisPromise = null; if (s.parentNode) s.parentNode.removeChild(s); resolve(false); }
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = function () {
        clearTimeout(timer);
        try {
          google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: onGoogleCredential,
            nonce: gisNonce,
            ux_mode: "popup",
            auto_select: false,
            itp_support: true,
          });
          gisState = "ready";
          resolve(true);
        } catch (e) { fail(); }
      };
      s.onerror = fail;
      document.head.appendChild(s);
    });
    return gisPromise;
  }

  async function onGoogleCredential(resp) {
    var box = activeAlert();
    hideAlert(box);
    if (!resp || !resp.credential) {
      return googleError("generic", "Google didn’t return a sign-in token — please try again");
    }
    try {
      var user = await Auth.provider.signInWithGoogle(resp.credential, gisNonce, role);
      finish(box, user, true);
    } catch (err) {
      reportError(err, box);
    }
  }

  function fallbackGoogleButton(slot) {
    if (slot.firstElementChild && slot.firstElementChild.classList.contains("btn-google")) return;
    var btn = document.getElementById("googleBtnTpl").content.firstElementChild.cloneNode(true);
    btn.addEventListener("click", async function () {
      hideAlert(activeAlert());
      if (!CLIENT_ID) return googleError("not-configured");
      if (navigator.onLine === false) return googleError("load-failed");
      var ok = await loadGis();
      if (!ok) return googleError("load-failed");
      renderGoogleButtons();
    });
    slot.replaceChildren(btn);
  }

  function renderGoogleButtons() {
    $$(".google-slot").forEach(function (slot) {
      if (slot.closest(".panel").hidden) return;
      if (!CLIENT_ID || gisState === "failed") return fallbackGoogleButton(slot);
      if (gisState !== "ready") {
        fallbackGoogleButton(slot);
        if (gisState === "idle") loadGis().then(renderGoogleButtons);
        return;
      }
      var light = document.documentElement.classList.contains("light");
      var w = Math.min(400, Math.floor(slot.clientWidth || 320));
      slot.textContent = "";
      try {
        google.accounts.id.renderButton(slot, {
          type: "standard", theme: light ? "outline" : "filled_black", size: "large",
          text: "continue_with", shape: "rectangular", logo_alignment: "left", width: w,
        });
      } catch (e) { gisState = "failed"; fallbackGoogleButton(slot); }
    });
  }

  /* ---------------- neon ray tracing the logo ---------------- */
  function startRay() {
    var groups = $$("#artRay [data-trace]");
    var order = ["swoosh", "house", "towers", "text"];
    var windowsMs = { swoosh: 4200, house: 4600, towers: 3600, text: 5400 };
    var CYCLE = 19000;
    var all = $$("#artRay path");

    if (reduceMotion || !all[0].animate) {
      all.forEach(function (p) { p.style.opacity = "0.55"; });
      return;
    }

    var t = 400; // leading pause
    order.forEach(function (name) {
      var g = groups.filter(function (x) { return x.dataset.trace === name; })[0];
      if (!g) return;
      var paths = $$("path", g);
      var lens = paths.map(function (p) { return p.getTotalLength(); });
      var total = lens.reduce(function (a, b) { return a + b; }, 0);
      var cursor = t;
      paths.forEach(function (p, i) {
        var len = lens[i];
        var dur = Math.max(windowsMs[name] * (len / total), 700);
        var dash = Math.min(Math.max(len * 0.22, 36), 150);
        p.style.strokeDasharray = dash + " " + (len + dash);
        p.classList.add("is-live");
        var s = cursor / CYCLE, e = Math.min((cursor + dur) / CYCLE, 1);
        p.animate(
          [
            { strokeDashoffset: dash, offset: 0 },
            { strokeDashoffset: dash, offset: s },
            { strokeDashoffset: -len, offset: e },
            { strokeDashoffset: -len, offset: 1 },
          ],
          { duration: CYCLE, iterations: Infinity, easing: "linear" }
        );
        cursor += dur * 0.92;
      });
      t += windowsMs[name];
    });
  }

  /* ---------------- init ---------------- */
  try {
    var savedRole = sessionStorage.getItem("lumivest:auth-role");
    if (!params.get("role") && ROLES[savedRole]) role = savedRole;
  } catch (e) {}
  setRole(role);
  var startHash = location.hash.slice(1);
  switchTab(TAB[startHash] ? startHash : "signin", { updateHash: false });
  if (params.get("signedout") === "1") {
    showAlert(siAlert, { type: "ok", title: "You’ve been signed out" });
  } else if (params.get("next")) {
    showAlert(siAlert, { type: "ok", title: "Please sign in to continue" });
  }
  startRay();
})();
