/* ============================================================
   LUMI-VEST — agent / company application form
   No network requests: the CSP on apply.html forbids them.
   ============================================================ */
(function () {
  "use strict";

  var Auth = window.LumiAuth;
  var Reg = window.LVRegistry;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- theme (same key as the rest of the site) ---------- */
  $("#themeToggle").addEventListener("click", function () {
    var light = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", light);
    try { localStorage.setItem(Auth.config.THEME_KEY, JSON.stringify(light ? "light" : "dark")); } catch (e) {}
    $('meta[name="theme-color"]').content = light ? "#faf7f0" : "#0a0907";
  });

  /* ---------- alerts (textContent only) ---------- */
  var ICON = {
    err: '<svg class="alert-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01" stroke-linecap="round"/></svg>',
    ok: '<svg class="alert-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg class="alert-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.8h.01" stroke-linecap="round"/></svg>',
  };
  function showAlert(box, o) {
    box.textContent = "";
    box.className = "alert" + (o.type === "ok" ? " alert--ok" : o.type === "info" ? " alert--info" : "");
    box.insertAdjacentHTML("afterbegin", ICON[o.type === "ok" ? "ok" : o.type === "info" ? "info" : "err"]);
    var t = document.createElement("div");
    t.className = "alert-title";
    t.textContent = o.title;
    box.appendChild(t);
    var x = document.createElement("button");
    x.type = "button"; x.className = "alert-x"; x.setAttribute("aria-label", "Dismiss message"); x.textContent = "×";
    x.addEventListener("click", function () { box.hidden = true; });
    box.appendChild(x);
    if (o.reasons && o.reasons.length) {
      var ul = document.createElement("ul");
      ul.className = "alert-list";
      o.reasons.forEach(function (r) { var li = document.createElement("li"); li.textContent = r; ul.appendChild(li); });
      box.appendChild(ul);
    }
    if (o.extra) {
      var ex = document.createElement("div");
      ex.className = "alert-extra";
      o.extra(ex);
      box.appendChild(ex);
    }
    box.hidden = false;
    box.classList.remove("is-shown", "shake");
    void box.offsetWidth;
    box.classList.add(o.type === "err" && !reduceMotion ? "shake" : "is-shown");
    box.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }

  function fieldErr(id, msg) {
    var input = document.getElementById(id);
    var p = document.getElementById(id + "Err");
    if (!input || !p) return;
    if (msg) { input.setAttribute("aria-invalid", "true"); p.textContent = msg; p.hidden = false; }
    else { input.removeAttribute("aria-invalid"); p.textContent = ""; p.hidden = true; }
  }

  /* ---------- applying as ---------- */
  var kind = "agent";
  document.querySelectorAll('input[name="kind"]').forEach(function (r) {
    r.addEventListener("change", function () {
      kind = r.value;
      $("#companyField").hidden = kind !== "company";
      $("#aNameLabel").textContent = kind === "company" ? "Contact person’s full name" : "Full name";
    });
  });

  /* ---------- photo: downscaled in memory, never uploaded ---------- */
  var photoBlob = null;
  function downscale(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var max = 720, r = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error("encode")); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("decode")); };
      img.src = url;
    });
  }
  $("#aPhoto").addEventListener("change", async function (e) {
    var f = e.target.files && e.target.files[0];
    $("#photoDrop").classList.remove("is-invalid");
    fieldErr("aPhoto", "");
    photoBlob = null;
    $("#photoPreview").hidden = true;
    $("#photoEmpty").hidden = false;
    if (!f) return;
    if (!/^image\//.test(f.type)) return photoProblem("That file isn’t an image — choose a JPG or PNG");
    if (f.size > 12 * 1024 * 1024) return photoProblem("That photo is larger than 12 MB — choose a smaller one");
    try {
      photoBlob = await downscale(f);
      var prev = $("#photoPreview");
      if (prev.dataset.url) URL.revokeObjectURL(prev.dataset.url);
      prev.dataset.url = URL.createObjectURL(photoBlob);
      prev.src = prev.dataset.url;
      prev.hidden = false;
      $("#photoEmpty").hidden = true;
    } catch (err) {
      photoProblem("We couldn’t read that image — try a different photo");
    }
  });
  function photoProblem(msg) {
    $("#photoDrop").classList.add("is-invalid");
    fieldErr("aPhoto", msg);
  }

  document.querySelectorAll("#applyForm input").forEach(function (i) {
    i.addEventListener("input", function () { if (i.getAttribute("aria-invalid")) fieldErr(i.id, ""); });
  });
  $("#aNin").addEventListener("input", function (e) { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 11); });

  /* ---------- submit ---------- */
  var form = $("#applyForm"), btn = $("#applySubmit"), alertBox = $("#applyAlert");
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    alertBox.hidden = true;
    ["aCompany", "aName", "aPhone", "aEmail", "aAddress", "aNin"].forEach(function (id) { fieldErr(id, ""); });
    $("#aConsentErr").hidden = true;

    var v = {
      kind: kind,
      company: $("#aCompany").value.trim().replace(/\s+/g, " "),
      fullName: $("#aName").value.trim().replace(/\s+/g, " "),
      phone: $("#aPhone").value.trim(),
      email: $("#aEmail").value.trim(),
      address: $("#aAddress").value.trim().replace(/\s+/g, " "),
      nin: $("#aNin").value.trim(),
    };
    var reasons = [];
    function bad(id, short, long) { fieldErr(id, short); reasons.push(long); }

    if (kind === "company" && v.company.length < 2) bad("aCompany", "Required", "Enter the company’s registered name");
    if (v.fullName.split(" ").filter(function (w) { return w.length > 1; }).length < 2) bad("aName", "First and last name", "Enter your full name — first and last name");
    if (!v.phone) bad("aPhone", "Required", "Enter a phone number we can reach you on");
    else if (!Auth.validators.phone.test(v.phone)) bad("aPhone", "Not valid", "That phone number doesn’t look right");
    if (!v.email) bad("aEmail", "Required", "Enter your email address");
    else if (!Auth.validators.email.test(v.email)) bad("aEmail", "Not valid", "That email address isn’t formatted correctly");
    if (v.address.length < 8) bad("aAddress", v.address ? "Too short" : "Required", "Enter your full address — street, area and city");
    if (!/^\d{11}$/.test(v.nin)) bad("aNin", "11 digits", "Your NIN is 11 digits long");
    if (!photoBlob) { photoProblem("Add a photo"); reasons.push("Add a clear photo of yourself"); }
    if (!$("#aConsent").checked) { var c = $("#aConsentErr"); c.textContent = "Please confirm to continue"; c.hidden = false; reasons.push("Confirm that the details are yours"); }

    if (reasons.length) {
      showAlert(alertBox, { type: "err", title: "Please check your application", reasons: reasons });
      var first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus({ preventScroll: true });
      return;
    }

    btn.disabled = true; btn.classList.add("is-loading");
    try {
      var ref = await Reg.submitApplication(v, photoBlob);
      form.reset();
      photoBlob = null;
      $("#photoPreview").hidden = true; $("#photoEmpty").hidden = false;
      renderStatus(Reg.track(ref), true);
    } catch (err) {
      btn.disabled = false; btn.classList.remove("is-loading");
      showAlert(alertBox, {
        type: "err",
        title: err && err.reasons ? "We can’t take this application" : "We couldn’t save your application",
        reasons: (err && err.reasons) || [
          "Your browser is blocking temporary storage (private mode or site data disabled)",
          "Storage may be full — free some space and try again",
        ],
      });
      return;
    }
    btn.disabled = false; btn.classList.remove("is-loading");
  });

  /* ---------- status (the alert the applicant receives) ---------- */
  var statusBox = $("#applyStatus");
  var lastSeen = "";
  function renderStatus(t, fresh) {
    if (!t) { statusBox.hidden = true; $("#applyFormWrap").hidden = false; return; }
    var key = t.ref + t.status;
    if (t.status === "pending") {
      $("#applyFormWrap").hidden = true;
      showAlert(statusBox, {
        type: "info",
        title: fresh ? "Application received" : "Your application is under review",
        reasons: ["The LUMI-VEST CEO reviews applications personally", "Keep this page or your reference — your result appears here"],
        extra: function (el) { el.append("Reference: "); var s = document.createElement("strong"); s.textContent = t.ref; el.appendChild(s); },
      });
    } else if (t.status === "accepted") {
      $("#applyFormWrap").hidden = true;
      showAlert(statusBox, {
        type: "ok",
        title: "Congratulations, " + t.name.split(" ")[0] + " — you’re approved!",
        reasons: ["Sign up as an agent or company using this license ID and the same email you applied with"],
        extra: function (el) {
          el.append("Your license ID: ");
          var s = document.createElement("strong"); s.textContent = t.licenseId; el.appendChild(s);
          el.appendChild(document.createElement("br"));
          var a = document.createElement("a");
          a.href = "auth.html?role=" + (t.licenseId && Reg.getLicense(t.licenseId) && Reg.getLicense(t.licenseId).kind === "company" ? "company" : "agent") + "#signup";
          a.textContent = "Create your account →";
          el.appendChild(a);
        },
      });
    } else {
      $("#applyFormWrap").hidden = false;
      showAlert(statusBox, {
        type: "err",
        title: t.status === "expired" ? "Your application expired" : "Your request was rejected",
        reasons: t.status === "expired"
          ? ["Applications are held for 14 days, then removed", "You’re welcome to apply again"]
          : ["The LUMI-VEST CEO reviewed your application and didn’t approve it", "You may submit a new application with accurate details"],
      });
    }
    if (!fresh && lastSeen && lastSeen !== key && t.status !== "pending") {
      try { document.title = (t.status === "accepted" ? "✓ Approved" : "Update") + " · LUMI-VEST"; } catch (e) {}
    }
    lastSeen = key;
  }

  function refresh() {
    var mine = Reg.myApplication();
    renderStatus(mine ? Reg.track(mine.ref, mine.email) : null, false);
  }

  /* look up by reference (works for anyone holding their reference + email) */
  $("#trackForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var ref = $("#tRef").value.trim(), email = $("#tEmail").value.trim();
    var t = ref && email ? Reg.track(ref, email) : null;
    if (!t) {
      showAlert(statusBox, {
        type: "err", title: "We couldn’t find that application",
        reasons: ["Check the reference and the email address for typos", "Applications are stored in the browser where they were submitted"],
      });
      return;
    }
    try { localStorage.setItem("lumivest:my-application", JSON.stringify({ ref: t.ref, email: email.toLowerCase() })); } catch (err) {}
    renderStatus(t, false);
  });
  $("#tRef").addEventListener("input", function (e) { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""); });

  Reg.onChange(refresh); // live: the CEO's decision appears without reloading
  refresh();
})();
