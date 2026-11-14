/* ============================================================
   LUMI-VEST — CEO dashboard
   Charts are plain inline SVG (no libraries, no network).
   ============================================================ */
(function () {
  "use strict";

  var Auth = window.LumiAuth;
  var Reg = window.LVRegistry;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DAY = 86400000;

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var fmt = new Intl.NumberFormat("en-NG");
  var naira = function (n) { return "₦" + fmt.format(Math.round(n)); };
  var short = function (s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
  var rd = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };

  var COLORS = ["#39C9F5", "#A589FF", "#C59AF5", "#A768F0", "#B9FFFF", "#25D366", "#F0A23A"];
  var GREEN = "#25D366", RED = "#E5484D";

  function toast(msg, kind) {
    var el = document.createElement("div");
    el.className = "toast" + (kind ? " toast--" + kind : "");
    el.textContent = msg;
    $("#toasts").appendChild(el);
    setTimeout(function () {
      el.classList.add("is-leaving");
      el.addEventListener("animationend", function () { el.remove(); }, { once: true });
    }, kind === "error" ? 6000 : 3200);
  }

  /* ---------- chrome ---------- */
  $("#themeToggle").addEventListener("click", function () {
    var light = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", light);
    try { localStorage.setItem(Auth.config.THEME_KEY, JSON.stringify(light ? "light" : "dark")); } catch (e) {}
    $('meta[name="theme-color"]').content = light ? "#faf7f0" : "#0a0907";
  });
  $("#ceoSignOut").addEventListener("click", function () { Auth.signOut(); });

  var me = Auth.getSession() || {};
  var hour = new Date().getHours();
  $("#ceoGreeting").textContent = (hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening") + ", " + String(me.name || "CEO").split(" ")[0];
  $("#ceoStamp").textContent = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  /* ---------- data ---------- */
  var listings = [];
  var rangeDays = 14;

  var data = { applications: [], licenses: [], users: [], activity: [], flags: [], signups: { total: 0, customer: 0, agent: 0, company: 0 } };

  async function fetchPublished() {
    try {
      var r = await fetch("listings.json?v=" + Date.now(), { cache: "no-store" });
      if (r.ok) { var j = await r.json(); if (Array.isArray(j)) return j; }
    } catch (e) { /* none published yet */ }
    return null;
  }
  async function loadListings() {
    await Reg.ready();
    if (Reg.mode() === "remote") {
      // everything goes live through the publishing worker, so listings.json is the source of truth
      var pub = await fetchPublished();
      if (pub) return pub;
    }
    var snap = rd("lumivest:listing-snapshot", null);
    if (snap && Array.isArray(snap.list)) return snap.list;
    var pend = rd("lumivest:pending", null);
    if (Array.isArray(pend)) return pend;
    return (await fetchPublished()) || [];
  }
  var users = function () { return data.users; };
  var flags = function () { return data.flags; };

  var ownerOf = function (p) { return p.ownerId || "house"; };
  var dayKey = function (t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function dayBuckets(days) {
    var start = dayKey(Date.now()) - (days - 1) * DAY, out = [];
    for (var i = 0; i < days; i++) out.push(start + i * DAY);
    return out;
  }

  /* ---------- KPIs ---------- */
  function renderKpis() {
    var act = data.activity, since = Date.now() - rangeDays * DAY;
    var inRange = act.filter(function (a) { return a.t >= since; });
    var added = inRange.filter(function (a) { return a.type === "listing_added"; }).length;
    var removed = inRange.filter(function (a) { return a.type === "listing_removed"; }).length;
    var lic = data.licenses;
    var apps = data.applications;
    var pending = apps.filter(function (a) { return a.status === "pending"; }).length;
    var drafts = listings.filter(function (p) { return p.draft; }).length;
    var u = users();
    var su = data.signups || { total: 0, customer: 0, agent: 0, company: 0 };
    var recentSignups = u.filter(function (x) { return x.created >= since && x.role !== "ceo"; }).length;
    var cards = [
      ["Successful sign-ups", fmt.format(su.total), fmt.format(su.customer) + " customers · " + fmt.format(su.agent) + " agents · " + fmt.format(su.company) + " companies", "accent"],
      ["Sign-ups · " + rangeDays + "d", fmt.format(recentSignups), "new accounts this period", ""],
      ["Total listings", fmt.format(listings.length), fmt.format(listings.length - drafts) + " published", "accent"],
      ["Added · " + rangeDays + "d", fmt.format(added), "new listings", ""],
      ["Removed · " + rangeDays + "d", fmt.format(removed), "deleted listings", removed ? "warn" : ""],
      ["Drafts", fmt.format(drafts), "not yet public", ""],
      ["Active partners", fmt.format(lic.filter(function (l) { return l.status === "active"; }).length), fmt.format(lic.length) + " licenses issued", "accent"],
      ["Pending applications", fmt.format(pending), "awaiting your review", pending ? "warn" : ""],
      ["Accounts", fmt.format(u.length), Reg.mode() === "remote" ? "registered across all devices" : "on this device", ""],
      ["Duplicate flags", fmt.format(flags().length), "rejected submissions", flags().length ? "warn" : ""],
    ];
    $("#kpis").innerHTML = cards.map(function (c) {
      return '<div class="kpi' + (c[3] ? " kpi--" + c[3] : "") + '"><small>' + esc(c[0]) + "</small><b>" + esc(c[1]) + "</b><span>" + esc(c[2]) + "</span></div>";
    }).join("");
    var badge = $("#pendingBadge");
    badge.hidden = !pending;
    badge.textContent = pending;
  }

  /* ---------- chart helpers ---------- */
  function empty(el, msg) { el.innerHTML = '<div class="chart-empty">' + esc(msg || "No data yet") + "</div>"; }
  var legend = function (items) {
    return '<div class="legend">' + items.map(function (i) { return '<span><i data-c="' + i.color + '"></i>' + esc(i.label) + "</span>"; }).join("") + "</div>";
  };

  function pairBars(el, buckets, a, b, labelA, labelB) {
    var max = Math.max(1, Math.max.apply(null, a.concat(b)));
    var step = max <= 5 ? 1 : Math.ceil(max / 4);
    var top = Math.ceil(max / step) * step;
    var W = 640, H = 230, L = 30, B = 30, T = 10, R = 6;
    var plotW = W - L - R, plotH = H - T - B, n = buckets.length, slot = plotW / n, bw = Math.max(3, Math.min(18, slot * 0.34));
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Listings added versus removed per day">';
    for (var g = 0; g <= top; g += step) {
      var y = T + plotH - (g / top) * plotH;
      svg += '<line class="gridline" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (L - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + g + "</text>";
    }
    buckets.forEach(function (t, i) {
      var cx = L + slot * i + slot / 2;
      var ha = (a[i] / top) * plotH, hb = (b[i] / top) * plotH;
      var delay = ' data-d="' + (i * 18) + '"';
      if (a[i]) svg += '<rect class="bar-in" ' + (reduceMotion ? "" : delay) + ' x="' + (cx - bw - 1) + '" y="' + (T + plotH - ha) + '" width="' + bw + '" height="' + ha + '" rx="3" fill="' + GREEN + '"><title>' + esc(new Date(t).toLocaleDateString("en-NG", { day: "numeric", month: "short" })) + ": " + a[i] + " " + labelA + "</title></rect>";
      if (b[i]) svg += '<rect class="bar-in" ' + (reduceMotion ? "" : delay) + ' x="' + (cx + 1) + '" y="' + (T + plotH - hb) + '" width="' + bw + '" height="' + hb + '" rx="3" fill="' + RED + '"><title>' + esc(new Date(t).toLocaleDateString("en-NG", { day: "numeric", month: "short" })) + ": " + b[i] + " " + labelB + "</title></rect>";
      var every = n > 40 ? 10 : n > 20 ? 5 : 2;
      if (i % every === 0 || i === n - 1) svg += '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle">' + new Date(t).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) + "</text>";
    });
    svg += '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (T + plotH) + '" y2="' + (T + plotH) + '"/></svg>';
    el.innerHTML = svg + legend([{ label: labelA, color: GREEN }, { label: labelB, color: RED }]);
  }

  function donut(el, items, centerLabel) {
    var total = items.reduce(function (s, i) { return s + i.value; }, 0);
    if (!total) return empty(el);
    var R = 52, C = 2 * Math.PI * R, off = 0;
    var svg = '<svg viewBox="0 0 140 140" role="img" aria-label="' + esc(centerLabel) + ' breakdown"><g transform="rotate(-90 70 70)"><circle cx="70" cy="70" r="' + R + '" fill="none" stroke="var(--line)" stroke-width="20"/>';
    items.forEach(function (it) {
      if (!it.value) return;
      var len = (it.value / total) * C;
      svg += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + it.color + '" stroke-width="20" stroke-dasharray="' + len + " " + (C - len) + '" stroke-dashoffset="' + -off + '"><title>' + esc(it.label) + ": " + it.value + "</title></circle>";
      off += len;
    });
    svg += '</g><text x="70" y="68" text-anchor="middle" class="val val-lg">' + total + '</text><text x="70" y="84" text-anchor="middle">' + esc(centerLabel) + "</text></svg>";
    el.innerHTML = '<div class="donut-wrap">' + svg + '<div class="legend">' + items.map(function (i) {
      return '<span><i data-c="' + i.color + '"></i>' + esc(i.label) + "<b>" + i.value + "</b></span>";
    }).join("") + "</div></div>";
  }

  function hbars(el, items, valueFmt) {
    items = items.filter(function (i) { return i.value > 0; });
    if (!items.length) return empty(el);
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }));
    var rowH = 30, W = 420, LBL = 120, H = items.length * rowH + 4;
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Bar chart">';
    items.forEach(function (it, i) {
      var y = i * rowH + 4, w = Math.max(4, (it.value / max) * (W - LBL - 52));
      svg += '<text x="0" y="' + (y + 16) + '">' + esc(short(it.label, 17)) + '</text>' +
        '<rect class="hbar-in" ' + (reduceMotion ? "" : 'data-d="' + i * 50 + '"') + ' x="' + LBL + '" y="' + y + '" width="' + w + '" height="20" rx="5" fill="' + (it.color || COLORS[i % COLORS.length]) + '"><title>' + esc(it.label) + "</title></rect>" +
        '<text class="val" x="' + (LBL + w + 8) + '" y="' + (y + 15) + '">' + esc(valueFmt ? valueFmt(it.value) : it.value) + "</text>";
    });
    el.innerHTML = svg + "</svg>";
  }

  function line(el, buckets, values, color) {
    var max = Math.max(1, Math.max.apply(null, values));
    var step = max <= 5 ? 1 : Math.ceil(max / 4), top = Math.ceil(max / step) * step;
    var W = 640, H = 200, L = 30, B = 28, T = 10, R = 10, plotW = W - L - R, plotH = H - T - B, n = buckets.length;
    var px = function (i) { return L + (n === 1 ? plotW / 2 : (plotW * i) / (n - 1)); };
    var py = function (v) { return T + plotH - (v / top) * plotH; };
    var svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="New accounts per day"><defs><linearGradient id="lg1" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".35"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>';
    for (var g = 0; g <= top; g += step) svg += '<line class="gridline" x1="' + L + '" x2="' + (W - R) + '" y1="' + py(g) + '" y2="' + py(g) + '"/><text x="' + (L - 6) + '" y="' + (py(g) + 4) + '" text-anchor="end">' + g + "</text>";
    var pts = values.map(function (v, i) { return px(i) + "," + py(v); });
    svg += '<polygon points="' + px(0) + "," + py(0) + " " + pts.join(" ") + " " + px(n - 1) + "," + py(0) + '" fill="url(#lg1)"/><polyline points="' + pts.join(" ") + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    values.forEach(function (v, i) { if (v) svg += '<circle cx="' + px(i) + '" cy="' + py(v) + '" r="3.5" fill="' + color + '"><title>' + v + " new</title></circle>"; });
    var every = n > 40 ? 10 : n > 20 ? 5 : 2;
    buckets.forEach(function (t, i) { if (i % every === 0 || i === n - 1) svg += '<text x="' + px(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + new Date(t).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) + "</text>"; });
    el.innerHTML = svg + "</svg>";
  }

  /* ---------- charts ---------- */
  function renderCharts() {
    var act = data.activity;
    var buckets = dayBuckets(rangeDays), idx = {};
    buckets.forEach(function (t, i) { idx[t] = i; });
    var added = buckets.map(function () { return 0; }), removed = added.slice();
    act.forEach(function (a) {
      var i = idx[dayKey(a.t)];
      if (i === undefined) return;
      if (a.type === "listing_added") added[i]++;
      if (a.type === "listing_removed") removed[i]++;
    });
    var sumA = added.reduce(function (s, v) { return s + v; }, 0), sumR = removed.reduce(function (s, v) { return s + v; }, 0);
    $("#addRemSub").textContent = sumA + " added · " + sumR + " removed in the last " + rangeDays + " days (counted from when activity logging began)";
    if (!sumA && !sumR) empty($("#chAddRem"), "No listings added or removed in this period yet"); else pairBars($("#chAddRem"), buckets, added, removed, "Added", "Removed");

    var typeName = { house: "House / bungalow", apartment: "Apartment", land: "Land / plot" };
    var byType = {}; listings.forEach(function (p) { byType[p.type || "other"] = (byType[p.type || "other"] || 0) + 1; });
    donut($("#chType"), Object.keys(byType).map(function (k, i) { return { label: typeName[k] || k, value: byType[k], color: COLORS[i % COLORS.length] }; }), "listings");

    var byStatus = {}; listings.forEach(function (p) { byStatus[p.status || "—"] = (byStatus[p.status || "—"] || 0) + 1; });
    hbars($("#chStatus"), Object.keys(byStatus).map(function (k, i) { return { label: k, value: byStatus[k], color: COLORS[i % COLORS.length] }; }));

    var u = users(), roles = { customer: 0, agent: 0, company: 0, ceo: 0 };
    u.forEach(function (x) { roles[x.role || "customer"] = (roles[x.role || "customer"] || 0) + 1; });
    donut($("#chRoles"), [
      { label: "Customers", value: roles.customer, color: COLORS[0] },
      { label: "Agents", value: roles.agent, color: COLORS[1] },
      { label: "Companies", value: roles.company, color: COLORS[2] },
    ], "accounts");

    var apps = data.applications;
    var st = function (s) { return apps.filter(function (a) { return a.status === s; }).length; };
    hbars($("#chApps"), [
      { label: "Pending", value: st("pending"), color: "#F0A23A" },
      { label: "Accepted", value: st("accepted"), color: GREEN },
      { label: "Declined", value: st("declined"), color: RED },
      { label: "Expired", value: st("expired"), color: "#857c68" },
    ]);

    var sb = buckets.map(function () { return 0; });
    u.forEach(function (x) { var i = idx[dayKey(x.created || 0)]; if (i !== undefined) sb[i]++; });
    var sumS = sb.reduce(function (s, v) { return s + v; }, 0);
    $("#signSub").textContent = sumS + " new account" + (sumS === 1 ? "" : "s") + " in the last " + rangeDays + " days";
    if (!sumS) empty($("#chSignups"), "No new accounts in this period"); else line($("#chSignups"), buckets, sb, COLORS[0]);

    var pr = [["Under ₦10M", 0, 1e7], ["₦10M – ₦20M", 1e7, 2e7], ["₦20M +", 2e7, Infinity]];
    hbars($("#chPrice"), pr.map(function (b, i) {
      return { label: b[0], value: listings.filter(function (p) { return (p.price || 0) >= b[1] && (p.price || 0) < b[2]; }).length, color: COLORS[i] };
    }));

    var lic = data.licenses, count = {};
    listings.forEach(function (p) { var o = ownerOf(p); count[o] = (count[o] || 0) + 1; });
    var items = Object.keys(count).map(function (k) {
      var l = lic.filter(function (x) { return x.id === k; })[0];
      return { label: k === "house" ? "LUMI-VEST (house)" : (l ? (l.company || l.name) : k), value: count[k] };
    }).sort(function (a, b) { return b.value - a.value; }).slice(0, 6);
    hbars($("#chPartners"), items);
  }

  /* ---------- licenses table ---------- */
  function renderLicenses() {
    var lic = data.licenses.slice().reverse();
    var counts = {};
    listings.forEach(function (p) { counts[ownerOf(p)] = (counts[ownerOf(p)] || 0) + 1; });
    var head = "<thead><tr><th>License</th><th>Holder</th><th>Contact</th><th>Type</th><th>Listings</th><th>Status</th><th>Actions</th></tr></thead>";
    if (!lic.length) { $("#licTable").innerHTML = head + '<tbody><tr><td colspan="7" class="tbl-empty">No licenses yet. Accept an application to issue the first one.</td></tr></tbody>'; return; }
    $("#licTable").innerHTML = head + "<tbody>" + lic.map(function (l) {
      var acts = [];
      if (l.status === "active") acts.push(btn(l, "suspended", "Suspend"), btn(l, "revoked", "Revoke", true));
      else if (l.status === "suspended") acts.push(btn(l, "active", "Reinstate"), btn(l, "revoked", "Revoke", true));
      else acts.push(btn(l, "active", "Reinstate"));
      return "<tr><td class=\"id\">" + esc(l.id) + "<small>" + new Date(l.issued).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) + "</small></td>" +
        "<td>" + esc(l.company || l.name) + (l.company ? "<small>" + esc(l.name) + "</small>" : "") + "<small>" + (l.boundUid ? "Account linked" : "Not claimed yet") + "</small></td>" +
        "<td>" + esc(l.phone) + "<small>" + esc(l.email) + "</small></td><td>" + (l.kind === "company" ? "Company" : "Agent") + "</td>" +
        "<td>" + (counts[l.id] || 0) + '</td><td><span class="pill pill--' + esc(l.status) + '">' + esc(l.status) + "</span></td>" +
        '<td><div class="row-actions">' + acts.join("") + "</div></td></tr>";
    }).join("") + "</tbody>";
  }
  function btn(l, to, label, danger) {
    return '<button type="button" class="mini' + (danger ? " mini--danger" : "") + '" data-lic="' + esc(l.id) + '" data-to="' + to + '">' + label + "</button>";
  }
  $("#licTable").addEventListener("click", function (e) {
    var b = e.target.closest("[data-lic]");
    if (!b) return;
    var id = b.dataset.lic, to = b.dataset.to;
    var verb = { suspended: "suspend", revoked: "revoke", active: "reinstate" }[to];
    if (!confirm("Are you sure you want to " + verb + " license " + id + "?" + (to !== "active" ? "\n\nThe holder will no longer be able to add or change listings." : ""))) return;
    Reg.setLicenseStatus(id, to).then(function () {
      toast("License " + id + " " + (to === "active" ? "reinstated" : to));
      refreshAll();
    }).catch(function (err) { toast((err && err.title) || "Couldn’t update the license", "error"); });
  });

  /* ---------- activity feeds ---------- */
  function renderFeeds() {
    var act = data.activity.slice(-14).reverse();
    var label = {
      listing_added: ["add", function (a) { return "Listing added: “" + short(a.title, 40) + "”"; }],
      listing_removed: ["rem", function (a) { return "Listing removed: “" + short(a.title, 40) + "”"; }],
      listing_updated: ["upd", function (a) { return "Listing updated: “" + short(a.title, 40) + "”"; }],
      application_submitted: ["app", function (a) { return "New " + (a.kind === "company" ? "company" : "agent") + " application"; }],
      application_accepted: ["add", function () { return "Application accepted"; }],
      application_declined: ["rem", function () { return "Application declined"; }],
      signup: ["add", function (a) { return "New " + (a.role === "company" ? "company" : a.role === "agent" ? "agent" : "customer") + " sign-up"; }],
      license_issued: ["add", function (a) { return "License " + a.license + " issued"; }],
      license_claimed: ["upd", function (a) { return "License " + a.license + " claimed by an account"; }],
      license_suspended: ["app", function (a) { return "License " + a.license + " suspended"; }],
      license_revoked: ["rem", function (a) { return "License " + a.license + " revoked"; }],
      license_active: ["add", function (a) { return "License " + a.license + " reinstated"; }],
    };
    $("#feed").innerHTML = act.length ? act.map(function (a) {
      var l = label[a.type] || ["upd", function () { return a.type; }];
      return '<li><span class="dot dot--' + l[0] + '"></span><span>' + esc(l[1](a)) + "</span><time>" + new Date(a.t).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + "</time></li>";
    }).join("") : '<li class="feed-empty">Nothing yet — activity appears here as listings and applications change.</li>';

    var fl = flags().slice(0, 8);
    $("#flagFeed").innerHTML = fl.length ? fl.map(function (f) {
      return '<li><span class="dot dot--rem"></span><span><strong>' + esc(short(f.title, 40)) + "</strong> — " + f.conflicts.length + " matching asset" + (f.conflicts.length === 1 ? "" : "s") +
        "<br><small>" + esc((f.by && (f.by.name || f.by.email)) || "unknown") + "</small></span><time>" + new Date(f.ts).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + "</time></li>";
    }).join("") : '<li class="feed-empty">No duplicate submissions have been caught.</li>';
  }

  /* CSP forbids inline style attributes, so colours/delays travel as data-* and are applied here */
  function paint() {
    $$("[data-c]").forEach(function (n) { n.style.background = n.dataset.c; });
    $$("[data-d]").forEach(function (n) { n.style.animationDelay = n.dataset.d + "ms"; });
  }

  async function refreshAll() {
    try {
      var res = await Promise.all([loadListings(), Reg.dashboard()]);
      listings = res[0];
      data = res[1];
    } catch (err) {
      if (err && (err.status === 401 || err.status === 403)) { Auth.signOut(); return; }
      toast((err && err.title) || "Couldn’t refresh the dashboard", "error");
    }
    renderKpis(); renderCharts(); renderLicenses(); renderFeeds(); paint();
  }

  $$(".range-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".range-btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      rangeDays = Number(b.dataset.days);
      renderKpis(); renderCharts(); paint();
    });
  });

  /* ============================================================
     Review modal — a stack of swipeable cards
     ============================================================ */
  var modal = $("#reviewModal"), stackEl = $("#stack"), queue = [], extras = {}, busy = false, lastFocus = null;

  function fullInfo(ref) {
    if (extras[ref]) return extras[ref];
    extras[ref] = Reg.secrets(ref).catch(function () { return { nin: "", url: "" }; });
    return extras[ref];
  }

  function cardEl(app, pos) {
    var el = document.createElement("article");
    el.className = "acard";
    el.dataset.ref = app.ref;
    el.dataset.pos = pos;
    el.style.setProperty("--pos", pos);
    var initials = Reg.initialsFrom(app.fullName);
    var applied = new Date(app.created).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
    var uid = "mo-" + app.ref;
    el.innerHTML =
      '<div class="acard-top"><div class="avatar-lg"><span class="ph">' + esc(initials) + '</span></div><div><h3>' + esc(app.fullName) + "</h3>" +
      '<div class="meta"><span class="tag">' + (app.kind === "company" ? "Company" : "Agent") + "</span><span>Applied " + applied + "</span></div></div></div>" +
      '<div class="acard-body"><div class="vital"><a href="tel:' + esc(app.phone) + '">' + esc(app.phone) + "</a></div>" +
      '<button type="button" class="toggle-more" aria-expanded="false" aria-controls="' + uid + '">Show details<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<dl class="more" id="' + uid + '">' +
      (app.company ? "<dt>Company</dt><dd>" + esc(app.company) + "</dd>" : "") +
      "<dt>Email</dt><dd>" + esc(app.email) + "</dd><dt>Address</dt><dd>" + esc(app.address) + '</dd><dt>NIN</dt><dd class="mono" data-nin>…</dd><dt>Reference</dt><dd>' + esc(app.ref) + "</dd></dl></div>" +
      '<div class="acard-foot"><button type="button" class="decide decide--no">Decline</button><button type="button" class="decide decide--yes">Accept</button></div>';

    fullInfo(app.ref).then(function (info) {
      var nin = el.querySelector("[data-nin]");
      if (nin) nin.textContent = info.nin || app.ninMasked + " (full number no longer held)";
      if (info.url) {
        var holder = el.querySelector(".avatar-lg");
        holder.textContent = "";
        var img = document.createElement("img");
        img.alt = "Photo of " + app.fullName;
        img.src = info.url;
        holder.appendChild(img);
      }
    });

    var toggle = el.querySelector(".toggle-more"), more = el.querySelector(".more");
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      toggle.firstChild.textContent = open ? "Hide details" : "Show details";
      more.classList.toggle("is-open", open);
    });
    el.querySelector(".decide--yes").addEventListener("click", function () { decide(app.ref, "accepted"); });
    el.querySelector(".decide--no").addEventListener("click", function () { decide(app.ref, "declined"); });
    if (pos === 0) attachDrag(el);
    return el;
  }

  function renderStack(animateTop) {
    stackEl.textContent = "";
    queue.slice(0, 3).forEach(function (app, i) {
      var c = cardEl(app, i);
      if (i === 0 && animateTop && !reduceMotion) c.classList.add("is-enter");
      stackEl.appendChild(c);
    });
    modal.dataset.count = String(queue.length);
    $("#rvEmpty").hidden = queue.length > 0;
    $("#rvCount").textContent = queue.length ? "1 of " + queue.length + " waiting" : "All caught up";
  }

  function rotate(dir) {
    if (queue.length < 2) return;
    if (dir > 0) queue.push(queue.shift()); else queue.unshift(queue.pop());
    renderStack(true);
  }

  function fling(dir) {
    var top = stackEl.querySelector('.acard[data-pos="0"]');
    if (!top || queue.length < 2) return;
    if (reduceMotion) return rotate(dir);
    top.classList.remove("is-dragging");
    top.classList.add("is-gone");
    top.style.transform = "translateX(" + dir * 460 + "px) rotate(" + dir * 14 + "deg)";
    top.style.opacity = "0";
    setTimeout(function () { rotate(dir); }, 260);
  }

  function attachDrag(card) {
    var sx = 0, dx = 0, active = false;
    card.addEventListener("pointerdown", function (e) {
      if (e.target.closest("button, a") || busy) return;
      active = true; sx = e.clientX; dx = 0;
      try { card.setPointerCapture(e.pointerId); } catch (err) {}
      card.classList.add("is-dragging");
    });
    card.addEventListener("pointermove", function (e) {
      if (!active) return;
      dx = e.clientX - sx;
      card.style.transform = "translateX(" + dx + "px) rotate(" + dx / 18 + "deg)";
      card.style.opacity = String(1 - Math.min(Math.abs(dx) / 360, 0.5));
    });
    function end() {
      if (!active) return;
      active = false;
      card.classList.remove("is-dragging");
      if (Math.abs(dx) > 90 && queue.length > 1) fling(dx > 0 ? 1 : -1);
      else { card.style.transform = ""; card.style.opacity = ""; }
    }
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
  }

  async function decide(ref, decision) {
    if (busy) return;
    var app = queue.filter(function (a) { return a.ref === ref; })[0];
    if (!app) return;
    if (decision === "declined" && !confirm("Decline " + app.fullName + "’s application?\n\nThey will be told their request was rejected, and their photo and NIN will be deleted.")) return;
    busy = true;
    $$(".decide", stackEl).forEach(function (b) { b.disabled = true; });
    try {
      var res = await Reg.decide(ref, decision);
      if (res) {
        toast(decision === "accepted" ? "Accepted — license " + res.licenseId + " issued to " + app.fullName : "Application declined — the applicant has been notified");
        var info = extras[ref]; if (info) info.then(function (i) { if (i.url && i.url.indexOf("blob:") === 0) URL.revokeObjectURL(i.url); });
        delete extras[ref];
      }
    } catch (err) {
      toast((err && (err.title || err.message)) || "Something went wrong", "error");
    }
    queue = queue.filter(function (a) { return a.ref !== ref; });
    busy = false;
    renderStack(true);
    refreshAll();
  }

  function pendingList() {
    return data.applications.filter(function (a) { return a.status === "pending" && Date.now() < a.expires; }).sort(function (a, b) { return a.created - b.created; });
  }

  async function openReview() {
    lastFocus = document.activeElement;
    await refreshAll(); // always review the latest queue
    queue = pendingList();
    renderStack(false);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $("#rvClose").focus();
  }
  function closeReview() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    Object.keys(extras).forEach(function (k) { extras[k].then(function (i) { if (i.url && i.url.indexOf("blob:") === 0) URL.revokeObjectURL(i.url); }); });
    extras = {};
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  $("#openReview").addEventListener("click", openReview);
  $("#rvClose").addEventListener("click", closeReview);
  $("#rvBackdrop").addEventListener("click", closeReview);
  $("#rvNext").addEventListener("click", function () { fling(1); });
  $("#rvPrev").addEventListener("click", function () { fling(-1); });
  document.addEventListener("keydown", function (e) {
    if (!modal.classList.contains("is-open")) return;
    if (e.key === "Escape") closeReview();
    else if (e.key === "ArrowRight") fling(1);
    else if (e.key === "ArrowLeft") fling(-1);
    else if (e.key === "Tab") {
      var f = $$("button, a[href]", modal).filter(function (n) { return n.offsetParent !== null && !n.disabled; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* live: a new application or change from another tab */
  Reg.onChange(async function () {
    await refreshAll();
    if (modal.classList.contains("is-open") && !busy) {
      var fresh = pendingList();
      var known = queue.map(function (a) { return a.ref; });
      var merged = queue.filter(function (a) { return fresh.some(function (f) { return f.ref === a.ref; }); });
      fresh.forEach(function (f) { if (known.indexOf(f.ref) === -1) merged.push(f); });
      if (merged.length !== queue.length || merged.some(function (a, i) { return queue[i] !== a && queue[i].ref !== a.ref; })) { queue = merged; renderStack(false); }
    }
  });

  refreshAll();
})();
