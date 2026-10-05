/* ============================================================
   LUMI-VEST — Airbnb-style UI behaviour
   ============================================================ */

"use strict";

/* ---------------- Data ---------------- */

const CONTACT = {
  phone: "+2349168659842",
  wa: "2349168659842",
  email: "jesevelarrealestate@gmail.com",
  hostName: "Jese Velar",
  hostPhoto: "img/jesevelar.jpeg",
};

const U = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const PROPERTIES = [
  {
    id: "bungalow-narayi",
    title: "3 Bedroom Standalone Bungalow",
    location: "Baya Dutse, Narayi, Kaduna South",
    type: "house",
    mode: "rent",
    price: 1300000,
    status: "For Rent",
    badge: "Top pick",
    alert: false,
    rating: 4.9,
    reviews: 14,
    beds: 3,
    baths: 3,
    parking: "1 car",
    size: "30 sqm",
    desc: "A neat standalone bungalow with POP sitting room, full tiling throughout, borehole water supply and an attached shop — ideal for a family, or an owner-occupier who wants a small business front.",
    highlights: [
      "POP sitting room",
      "Fully tiled",
      "Borehole water",
      "Attached shop",
      "Standalone building",
      "Quiet neighbourhood",
    ],
    media: [
      { type: "video", src: "VID-20260624-WA0010.mp4" },
      { type: "image", src: U("1523217582562-09d0def993a6") },
      { type: "image", src: U("1502672260266-1c1ef2d93688") },
      { type: "image", src: U("1494526585095-c41746248156") },
    ],
  },
  {
    id: "karatudu-double",
    title: "Double 2 Bedroom Apartment",
    location: "Karatudu, Kaduna",
    type: "apartment",
    mode: "sale",
    price: 12000000,
    status: "For Sale",
    badge: "Verified",
    alert: false,
    rating: 4.8,
    reviews: 9,
    beds: 2,
    baths: 1,
    parking: "2 cars",
    size: "39 sqm",
    desc: "Two apartment units on one plot — fenced, gated and fully finished with tiles, borehole water and a prepaid meter. Strong rental yield or a comfortable shared family home.",
    highlights: [
      "Fenced & gated",
      "Prepaid meter",
      "Borehole water",
      "Fully tiled",
      "Two units on one plot",
      "Secure compound",
    ],
    media: [
      { type: "image", src: "img/IMG-20260624-WA0014.jpg" },
      { type: "image", src: "img/IMG-20260624-WA0015.jpg" },
      { type: "image", src: "img/IMG-20260624-WA0013.jpg" },
      { type: "image", src: "img/IMG-20260624-WA0011.jpg" },
    ],
  },
  {
    id: "kamazo-3bed",
    title: "3 Bedroom Apartment",
    location: "Kamazo, off Yakowa Way, Kaduna",
    type: "apartment",
    mode: "sale",
    price: 15000000,
    status: "Under Construction",
    badge: "New build",
    alert: false,
    rating: null,
    reviews: 0,
    beds: 3,
    baths: 2,
    parking: "2 cars",
    size: "35 sqm",
    desc: "Three-bedroom flat currently under construction, plus completed one unit each of a one-bedroom flat and a room self-con. Inspect now and lock the price before completion — close to ECWA Goodnews Church.",
    highlights: [
      "New construction",
      "Plus 1-bed & self-con units",
      "Off Yakowa Way",
      "Near ECWA Goodnews Church",
      "Gated street",
      "Price negotiable on inspection",
    ],
    media: [
      { type: "video", src: "VID-20260624-WA0017.mp4" },
      { type: "image", src: U("1512917774080-9991f1c4c750") },
      { type: "image", src: U("1570129477492-45c003edd2be") },
      { type: "image", src: U("1564013799919-ab600027ffc6") },
    ],
  },
  {
    id: "mahuta-5units",
    title: "5 Units, 1 Bedroom Apartment",
    location: "Mahuta Ext, by Dinam Hotel, Kaduna",
    type: "apartment",
    mode: "sale",
    price: 19000000,
    status: "Distress Sale",
    badge: "Distress sale",
    alert: true,
    rating: 4.7,
    reviews: 6,
    beds: 1,
    baths: 1,
    parking: "1 car",
    size: "30 sqm",
    desc: "Five one-bedroom units with aluminum roof, PVC ceilings, spacious sitting room and bedroom each, in a concrete-compound, borehole-served, fenced and gated property with good proximity to the tarred road.",
    highlights: [
      "Five income units",
      "Aluminium roof & PVC",
      "Concrete compound",
      "Borehole + fenced + gated",
      "Close to tarred road",
      "By Dinam Hotel",
    ],
    media: [
      { type: "video", src: "VID-20260624-WA0000.mp4" },
      { type: "image", src: U("1493809842364-78817add7ffb") },
      { type: "image", src: U("1522708323590-d24dbb6b0267") },
      { type: "image", src: U("1560448204-e02f11c3d0e2") },
    ],
  },
  {
    id: "buwaya-7units",
    title: "7 Units, 1 Bedroom Apartment",
    location: "Buwaya, Goningora, Kaduna",
    type: "apartment",
    mode: "sale",
    price: 30000000,
    priceNote: "₦2,600,000 annual rent option",
    status: "Distress Sale",
    badge: "Top pick",
    alert: true,
    rating: 5.0,
    reviews: 11,
    beds: 1,
    baths: 1,
    parking: "3 cars",
    size: "120/60 sqm",
    desc: "Six one-bedroom-and-bathroom flats plus one room flat, with POP, tiles, interlocking, prepaid meter, industrial borehole and tank stand — fenced and gated. Price is slightly negotiable on inspection.",
    highlights: [
      "Seven units in total",
      "Prepaid meter",
      "Industrial borehole",
      "Interlocking compound",
      "Fenced & gated",
      "Slightly negotiable",
    ],
    media: [
      { type: "video", src: "VID-20260716-WA0002.mp4" },
      { type: "image", src: U("1484154218962-a197022b5858") },
      { type: "image", src: U("1502005229762-cf1b2da7c5d6") },
      { type: "image", src: U("1416331108676-a22ccb276e35") },
    ],
  },
];

const CATEGORIES = [
  { id: "all", label: "All homes", icon: "grid" },
  { id: "saved", label: "Saved", icon: "heart" },
  { id: "house", label: "Houses", icon: "house" },
  { id: "apartment", label: "Apartments", icon: "building" },
  { id: "rent", label: "For rent", icon: "key" },
  { id: "sale", label: "For sale", icon: "tag" },
  { id: "construction", label: "New builds", icon: "hat" },
  { id: "distress", label: "Distress deals", icon: "percent" },
];

/* ---------------- Icons ---------------- */

const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  heart:
    '<path d="M12 20.5S4.5 15.6 2.8 11.2A5.3 5.3 0 0 1 12 6.3a5.3 5.3 0 0 1 9.2 4.9c-1.7 4.4-9.2 9.3-9.2 9.3z"/>',
  house:
    '<path d="M3 11 12 4l9 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5z"/>',
  building:
    '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7.5h2M13 7.5h2M9 11.5h2M13 11.5h2M9 15.5h2M13 15.5h2"/>',
  key: '<circle cx="7.5" cy="12" r="4"/><path d="M11.5 12H21m-3 0v3m-2.5-3v2.2"/>',
  tag: '<path d="M3.5 12.4V4.5a1 1 0 0 1 1-1h7.9L21 11.1 12.1 20z"/><circle cx="8.2" cy="8.2" r="1.5"/>',
  hat: '<path d="M4 16.5a8 8 0 0 1 16 0z"/><path d="M9.8 8.4V6a1.4 1.4 0 0 1 1.4-1.4h1.6A1.4 1.4 0 0 1 14.2 6v2.4"/>',
  percent:
    '<circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/><path d="M6 18 18 6"/>',
  star: '<path d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/>',
  left: '<path d="m14 6-6 6 6 6"/>',
  right: '<path d="m10 6 6 6-6 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
};

const svg = (name, cls) =>
  `<svg viewBox="0 0 24 24" ${cls ? `class="${cls}"` : ""} aria-hidden="true">${ICONS[name]}</svg>`;

/* ---------------- Helpers ---------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const naira = (n) => "₦" + Number(n).toLocaleString("en-NG");

const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
};

let saved = new Set(storage.get("lumivest:saved", []));

const persistSaved = () => storage.set("lumivest:saved", [...saved]);

/* ---------------- Listings store ---------------- */

const LISTINGS_KEY = "lumivest:listings";
let publishedListings = null;
let listingsCache = null;

const defaultListings = () => JSON.parse(JSON.stringify(PROPERTIES));

function getListings() {
  if (!listingsCache) {
    const local = storage.get(LISTINGS_KEY, null);
    if (Array.isArray(local) && local.length) listingsCache = local;
    else if (Array.isArray(publishedListings) && publishedListings.length)
      listingsCache = publishedListings;
    else listingsCache = defaultListings();
  }
  return listingsCache;
}

function saveListings(list) {
  listingsCache = list;
  storage.set(LISTINGS_KEY, list);
}

async function loadPublished() {
  try {
    const res = await fetch("listings.json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length) publishedListings = data;
    }
  } catch {
    /* no published listings.json — fall back to defaults */
  }
}

/* ---------------- Toasts ---------------- */

const toastsEl = $("#toasts");

function toast(message) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;
  toastsEl.appendChild(el);
  setTimeout(() => {
    el.classList.add("is-leaving");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, 3000);
}

/* ---------------- Categories ---------------- */

const catsEl = $("#categories");
let activeCat = "all";

function renderCategories() {
  catsEl.innerHTML = CATEGORIES.map((c) => {
    const active = c.id === activeCat ? " is-active" : "";
    const count =
      c.id === "saved" && saved.size
        ? ` <span class="cat-count">${saved.size}</span>`
        : "";
    return `<button type="button" class="cat${active}" data-cat="${c.id}">
      ${svg(c.icon)}<span>${c.label}${count}</span>
    </button>`;
  }).join("");
}

catsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".cat");
  if (!btn) return;
  activeCat = btn.dataset.cat;
  renderCategories();
  render();
  document.getElementById("listings").scrollIntoView({ behavior: "smooth" });
});

/* ---------------- Filters & rendering ---------------- */

const grid = $("#grid");
const emptyState = $("#emptyState");
const resultsCount = $("#resultsCount");
const sortSelect = $("#sortSelect");
const searchForm = $("#searchForm");

const state = { q: "", type: "", price: "" };

function matches(p) {
  if (p.draft) return false;

  if (activeCat === "saved") {
    if (!saved.has(p.id)) return false;
  } else if (activeCat === "house" || activeCat === "apartment") {
    if (p.type !== activeCat) return false;
  } else if (activeCat === "rent" && p.mode !== "rent") return false;
  else if (activeCat === "sale" && p.mode !== "sale") return false;
  else if (activeCat === "construction" && p.status !== "Under Construction")
    return false;
  else if (activeCat === "distress" && p.status !== "Distress Sale")
    return false;

  if (state.q) {
    const hay = (p.title + " " + p.location + " " + p.desc).toLowerCase();
    if (!hay.includes(state.q)) return false;
  }
  if (state.type && p.type !== state.type) return false;
  if (state.price) {
    const [min, max] = state.price.split("-").map(Number);
    if (p.price < min || p.price > max) return false;
  }
  return true;
}

function sortList(list) {
  const by = sortSelect.value;
  const out = [...list];
  if (by === "price-asc") out.sort((a, b) => a.price - b.price);
  else if (by === "price-desc") out.sort((a, b) => b.price - a.price);
  else if (by === "beds-desc") out.sort((a, b) => b.beds - a.beds);
  return out;
}

function priceHTML(p) {
  if (p.mode === "rent")
    return `<strong>${naira(p.price)}</strong> <span>/ year</span>`;
  return `<strong>${naira(p.price)}</strong> ${
    p.priceNote ? `<span>· ${p.priceNote}</span>` : ""
  }`;
}

function slideHTML(m, p) {
  if (m.type === "video")
    return `<div class="card-slide"><video muted loop playsinline preload="metadata"><source src="${m.src}" type="video/mp4"></video></div>`;
  return `<div class="card-slide"><img src="${m.src}" alt="${p.title}" loading="lazy"></div>`;
}

function cardHTML(p, i) {
  const liked = saved.has(p.id) ? " is-liked" : "";
  const badgeCls = p.alert ? "card-badge card-badge--alert" : "card-badge";
  const rating = p.rating
    ? `${svg("star")} ${p.rating.toFixed(1)}`
    : `<span class="card-new">New</span>`;
  const dots =
    p.media.length > 1
      ? `<div class="card-dots">${p.media
          .map(
            (_, d) =>
              `<span class="card-dot${d === 0 ? " is-active" : ""}" data-dot="${d}"></span>`
          )
          .join("")}</div>`
      : "";
  const arrows =
    p.media.length > 1
      ? `<button type="button" class="card-arrow card-arrow--prev" data-dir="-1" aria-label="Previous photo">${svg("left")}</button>
         <button type="button" class="card-arrow card-arrow--next" data-dir="1" aria-label="Next photo">${svg("right")}</button>`
      : "";

  return `<article class="card reveal" data-id="${p.id}" style="--d:${(i % 4) * 0.08}s">
    <div class="card-media" role="button" tabindex="0" aria-label="View ${p.title}">
      <span class="${badgeCls}">${p.badge}</span>
      <button type="button" class="card-heart${liked}" aria-label="Save to wishlist">${svg("heart")}</button>
      <div class="card-track">${p.media.map((m) => slideHTML(m, p)).join("")}</div>
      ${arrows}
      ${dots}
    </div>
    <div class="card-title-row">
      <h3 class="card-title">${p.title}</h3>
      <span class="card-rating">${rating}</span>
    </div>
    <p class="card-location">${p.location}</p>
    <p class="card-details">${p.beds} bed${p.beds > 1 ? "s" : ""} · ${
      p.baths
    } bath${p.baths > 1 ? "s" : ""} · ${p.size}</p>
    <p class="card-price">${priceHTML(p)}</p>
  </article>`;
}

function render() {
  const list = sortList(getListings().filter(matches));
  grid.innerHTML = list.map(cardHTML).join("");
  emptyState.hidden = list.length > 0;
  resultsCount.textContent = list.length
    ? `${list.length} home${list.length > 1 ? "s" : ""} available in Kaduna`
    : "No results";
  observeReveals();
  observeVideos();
}

/* ---------------- Card interactions ---------------- */

function shiftCarousel(card, dir) {
  const track = $(".card-track", card);
  if (!track) return;
  const slides = $$(".card-slide", track);
  let idx = Number(card.dataset.idx || 0);
  idx = (idx + dir + slides.length) % slides.length;
  card.dataset.idx = idx;
  track.style.transform = `translateX(-${idx * 100}%)`;
  slides.forEach((s, i) => s.classList.toggle("is-active", i === idx));
  $$(".card-dot", card).forEach((d, i) =>
    d.classList.toggle("is-active", i === idx)
  );
  const activeVideo = $("video", slides[idx]);
  if (activeVideo && isInView(card)) playVideos(card);
}

function playVideos(card) {
  $$("video", card).forEach((v) => {
    if (card.dataset.videoPaused === "1") return;
    const slide = v.closest(".card-slide");
    if (slide.classList.contains("is-active")) v.play().catch(() => {});
    else v.pause();
  });
}

grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const p = getListings().find((x) => x.id === card.dataset.id);
  if (!p) return;

  const heart = e.target.closest(".card-heart");
  if (heart) {
    e.stopPropagation();
    toggleSaved(p);
    heart.classList.toggle("is-liked", saved.has(p.id));
    renderCategories();
    return;
  }

  const arrow = e.target.closest(".card-arrow");
  if (arrow) {
    e.stopPropagation();
    shiftCarousel(card, Number(arrow.dataset.dir));
    return;
  }

  const dot = e.target.closest(".card-dot");
  if (dot) {
    e.stopPropagation();
    const card2 = card;
    const idx = Number(dot.dataset.dot);
    const cur = Number(card2.dataset.idx || 0);
    shiftCarousel(card2, idx - cur);
    return;
  }

  if (e.target.closest(".card-media") || e.target.closest(".card-title")) {
    openModal(p, card);
  }
});

grid.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const media = e.target.closest(".card-media");
  if (!media) return;
  e.preventDefault();
  const card = media.closest(".card");
  const p = getListings().find((x) => x.id === card.dataset.id);
  if (p) openModal(p, card);
});

function toggleSaved(p) {
  if (saved.has(p.id)) {
    saved.delete(p.id);
    toast("Removed from saved homes");
  } else {
    saved.add(p.id);
    toast("Saved to your wishlist");
  }
  persistSaved();
  updateSavedCount();
  if (activeCat === "saved") render();
}

function updateSavedCount() {
  const el = $("#savedCountMenu");
  if (el) el.textContent = saved.size;
}

/* ---------------- Search / sort ---------------- */

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.q = ($("#fLocation").value || "").toLowerCase().trim();
  state.type = $("#fType").value;
  state.price = $("#fPrice").value;
  activeCat = "all";
  renderCategories();
  render();
  closeCompactSearch();
  document.getElementById("listings").scrollIntoView({ behavior: "smooth" });
  toast("Search updated");
});

sortSelect.addEventListener("change", render);

$("#clearFilters").addEventListener("click", () => {
  state.q = state.type = state.price = "";
  activeCat = "all";
  $("#fLocation").value = "";
  $("#fType").value = "";
  $("#fPrice").value = "";
  sortSelect.value = "recommended";
  renderCategories();
  render();
  toast("Filters cleared");
});

/* ---------------- Compact search (mobile) ---------------- */

const searchCompact = $("#searchCompact");

function closeCompactSearch() {
  searchForm.classList.remove("is-open");
  searchCompact.setAttribute("aria-expanded", "false");
}

searchCompact.addEventListener("click", () => {
  const open = searchForm.classList.toggle("is-open");
  searchCompact.setAttribute("aria-expanded", String(open));
  if (open) $("#fLocation").focus();
});

document.addEventListener("click", (e) => {
  if (!searchForm.contains(e.target)) closeCompactSearch();
});

/* ---------------- Header menu ---------------- */

const menuBtn = $("#menuBtn");
const menuDrop = $("#menuDrop");

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = menuDrop.hidden;
  menuDrop.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
});

document.addEventListener("click", (e) => {
  if (!menuDrop.hidden && !menuDrop.contains(e.target)) {
    menuDrop.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
  }
});

menuDrop.addEventListener("click", (e) => {
  const link = e.target.closest("a");
  if (!link) return;
  if (link.dataset.menu === "admin") {
    e.preventDefault();
    openAdmin();
  } else if (link.dataset.menu === "saved") {
    e.preventDefault();
    activeCat = "saved";
    renderCategories();
    render();
    document.getElementById("listings").scrollIntoView({ behavior: "smooth" });
  }
  menuDrop.hidden = true;
  menuBtn.setAttribute("aria-expanded", "false");
});

/* ---------------- Listing modal ---------------- */

const modal = $("#listingModal");
const modalContent = $("#modalContent");
let lastFocused = null;
let currentProperty = null;
let currentSlide = 0;

function mediaEl(m, p, cls) {
  if (m.type === "video")
    return `<video ${cls} muted loop playsinline preload="metadata" data-kind="video"><source src="${m.src}" type="video/mp4"></video>`;
  return `<img ${cls} src="${m.src}" alt="${p.title}">`;
}

function modalHTML(p) {
  const statusCls = p.alert ? "mb-status mb-status--alert" : "mb-status";
  const rating = p.rating
    ? `<strong>★ ${p.rating.toFixed(1)}</strong><span class="dot"></span><span>${p.reviews} reviews</span>`
    : `<span class="mb-status">New listing</span>`;

  const thumbs =
    p.media.length > 1
      ? `<div class="mg-side">${p.media
          .slice(1, 4)
          .map(
            (m, i) =>
              `<button type="button" class="mg-thumb" data-slide="${
                i + 1
              }" aria-label="Show photo ${i + 2}">${mediaEl(m, p, "")}</button>`
          )
          .join("")}</div>`
      : "";

  return `
  <div class="mg${p.media.length > 1 ? "" : " mg--single"}">
    <div class="mg-main" id="mgMain">${mediaEl(p.media[0], p, "")}</div>
    ${thumbs}
    <button type="button" class="mg-nav mg-prev" id="mgPrev" aria-label="Previous photo">${svg("left")}</button>
    <button type="button" class="mg-nav mg-next" id="mgNext" aria-label="Next photo">${svg("right")}</button>
    <span class="mg-count" id="mgCount">1 / ${p.media.length}</span>
  </div>

  <div class="mb">
    <div class="mb-main">
      <div class="mb-head">
        <h2 id="modalTitleStatic">${p.title}</h2>
        <div class="mb-meta">
          ${rating}<span class="dot"></span><span>${p.location}</span>
          <span class="${statusCls}">${p.status}</span>
        </div>
      </div>

      <div class="mb-facts">
        <div class="fact"><strong>${p.beds}</strong><span>Bedroom${p.beds > 1 ? "s" : ""}</span></div>
        <div class="fact"><strong>${p.baths}</strong><span>Bathroom${p.baths > 1 ? "s" : ""}</span></div>
        <div class="fact"><strong>${p.parking.replace(" cars", "").replace(" car", "")}</strong><span>Parking</span></div>
        <div class="fact"><strong>${p.size}</strong><span>Land size</span></div>
      </div>

      <p class="mb-desc">${p.desc}</p>

      <ul class="mb-highlights">${p.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>

      <div class="mb-host">
        <img src="${CONTACT.hostPhoto}" alt="${CONTACT.hostName}">
        <div>
          <strong>Hosted by ${CONTACT.hostName}</strong>
          <span>Top-rated agent · typically replies within hours</span>
        </div>
      </div>
    </div>

    <aside class="mb-side">
      <div class="booking">
        <div class="booking-price">${
          p.mode === "rent"
            ? `${naira(p.price)} <span>/ year</span>`
            : `${naira(p.price)}`
        }</div>
        <p class="booking-note">${
          p.mode === "rent"
            ? "Annual rent · inspection free"
            : p.priceNote || "Sale price · slight negotiation on inspection"
        }</p>

        <div class="booking-rows">
          <div class="booking-row"><span>Status</span><strong>${p.status}</strong></div>
          <div class="booking-row"><span>Property type</span><strong>${
            p.type === "house" ? "House / bungalow" : "Apartment"
          }</strong></div>
          <div class="booking-row"><span>Location</span><strong>${p.location}</strong></div>
        </div>

        <button type="button" class="btn btn-gradient" id="requestViewing">Request a viewing</button>

        <div class="booking-contact">
          <a href="tel:${CONTACT.phone}">Call</a>
          <a href="https://wa.me/${CONTACT.wa}?text=${encodeURIComponent(
    `Hello ${CONTACT.hostName}, I'm interested in: ${p.title} (${p.location}).`
  )}" target="_blank" rel="noopener">WhatsApp</a>
          <a href="mailto:${CONTACT.email}?subject=${encodeURIComponent(
    "Enquiry: " + p.title
  )}">Email</a>
        </div>

        <p class="booking-safe">🔒 Never send payment before an inspection. LUMI-VEST only lists verified properties.</p>

        <form class="inquiry" id="inquiryForm" hidden>
          <h3>Request a viewing</h3>
          <input type="text" name="name" placeholder="Your full name" required>
          <input type="tel" name="phone" placeholder="Your phone number" required>
          <textarea name="message" rows="3" placeholder="I'm interested in this property…"></textarea>
          <button type="submit" class="btn btn-dark">Send request</button>
        </form>
      </div>
    </aside>
  </div>`;
}

function openModal(p, sourceCard) {
  currentProperty = p;
  currentSlide = 0;
  lastFocused = sourceCard || document.activeElement;
  modalContent.innerHTML = modalHTML(p);
  modalContent.scrollTop = 0;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  $("#modalClose").focus();
  wireModal(p);
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  const mainVideo = $("#mgMain video");
  if (mainVideo) mainVideo.pause();
  currentProperty = null;
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function setModalSlide(idx) {
  const p = currentProperty;
  if (!p) return;
  currentSlide = (idx + p.media.length) % p.media.length;
  const main = $("#mgMain");
  if (!main) return;
  const m = p.media[currentSlide];
  main.innerHTML = mediaEl(m, p, "");
  const v = $("video", main);
  if (v) v.play().catch(() => {});
  $$(".mg-thumb").forEach((t) =>
    t.classList.toggle("is-active", Number(t.dataset.slide) === currentSlide)
  );
  const count = $("#mgCount");
  if (count) count.textContent = `${currentSlide + 1} / ${p.media.length}`;
}

function wireModal(p) {
  $("#mgPrev").addEventListener("click", () => setModalSlide(currentSlide - 1));
  $("#mgNext").addEventListener("click", () => setModalSlide(currentSlide + 1));
  $$(".mg-thumb").forEach((t) =>
    t.addEventListener("click", () => setModalSlide(Number(t.dataset.slide)))
  );

  const requestBtn = $("#requestViewing");
  const form = $("#inquiryForm");
  requestBtn.addEventListener("click", () => {
    form.hidden = false;
    form.querySelector("input").focus();
    requestBtn.textContent = "Fill in your details →";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const msg = form.message.value.trim();
    const text = `Hello ${CONTACT.hostName}, I'd like to request a viewing.\n\nProperty: ${
      p.title
    }\nLocation: ${p.location}\nPrice: ${naira(p.price)}\n\nName: ${name}\nPhone: ${phone}${
      msg ? "\nMessage: " + msg : ""
    }`;
    window.open(
      `https://wa.me/${CONTACT.wa}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener"
    );
    toast("Opening WhatsApp — your request is ready to send");
    form.reset();
    form.hidden = true;
    requestBtn.textContent = "Request a viewing";
  });
}

$("#modalClose").addEventListener("click", closeModal);
$("#modalBackdrop").addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (!modal.classList.contains("is-open")) return;
  if (e.key === "Escape") closeModal();
  if (e.key === "ArrowLeft") setModalSlide(currentSlide - 1);
  if (e.key === "ArrowRight") setModalSlide(currentSlide + 1);
});

/* ---------------- Header scroll behaviour ---------------- */

const siteHeader = $("#siteHeader");
const backToTop = $("#backToTop");

function onScroll() {
  const y = window.scrollY;
  siteHeader.classList.toggle("is-scrolled", y > 6);
  siteHeader.classList.toggle("is-condensed", y > 160);
  backToTop.classList.toggle("is-visible", y > 700);
}

window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

backToTop.addEventListener("click", () =>
  window.scrollTo({ top: 0, behavior: "smooth" })
);

/* ---------------- Scroll reveals ---------------- */

let revealObserver;

function observeReveals() {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in-view");
            revealObserver.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
  }
  $$(".reveal:not(.in-view)").forEach((el) => revealObserver.observe(el));
}

/* ---------------- Video autoplay on view ---------------- */

function isInView(el) {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
}

let videoObserver;

function observeVideos() {
  if (!videoObserver) {
    videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          const card = en.target;
          if (en.isIntersecting) {
            card.dataset.videoPaused = "0";
            playVideos(card);
          } else {
            card.dataset.videoPaused = "1";
            $$("video", card).forEach((v) => v.pause());
          }
        });
      },
      { threshold: 0.35 }
    );
  }
  $$(".card").forEach((c) => videoObserver.observe(c));

  const heroVideo = $(".collage-video video");
  if (heroVideo) {
    const heroObs = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) =>
          en.isIntersecting ? en.target.play().catch(() => {}) : en.target.pause()
        ),
      { threshold: 0.3 }
    );
    heroObs.observe(heroVideo);
  }
}

/* ---------------- Animated counters ---------------- */

function animateCounters() {
  const els = $$(".stat-num");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target;
        const target = parseFloat(el.dataset.count);
        const decimals = Number(el.dataset.decimals || 0);
        const suffix = el.dataset.suffix || "";
        const dur = 1500;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = (target * eased).toFixed(decimals) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------------- Admin panel ---------------- */

const ADMIN_EMAIL = CONTACT.email.trim().toLowerCase();
const adminPanel = $("#adminPanel");
const adminBody = $("#adminBody");
let adminLastFocus = null;

const esc = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );

function adminSignedIn() {
  try {
    return sessionStorage.getItem("lumivest:admin") === "1";
  } catch {
    return false;
  }
}

function setAdminSignedIn(v) {
  try {
    v
      ? sessionStorage.setItem("lumivest:admin", "1")
      : sessionStorage.removeItem("lumivest:admin");
  } catch {
    /* ignore */
  }
}

function openAdmin() {
  adminLastFocus = document.activeElement;
  adminPanel.classList.add("is-open");
  adminPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  adminSignedIn() ? renderAdminList() : renderGate();
}

function closeAdmin() {
  adminPanel.classList.remove("is-open");
  adminPanel.setAttribute("aria-hidden", "true");
  if (!modal.classList.contains("is-open"))
    document.body.classList.remove("modal-open");
  if (adminLastFocus && adminLastFocus.focus) adminLastFocus.focus();
}

$("#adminClose").addEventListener("click", closeAdmin);
$("#adminBackdrop").addEventListener("click", closeAdmin);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && adminPanel.classList.contains("is-open"))
    closeAdmin();
});

/* --- email gate --- */
function renderGate() {
  adminBody.innerHTML = `
    <div class="gate">
      <div class="gate-lock">🔒</div>
      <h3>Admin access</h3>
      <p>Sign in with the owner account to add, edit and remove listings.</p>
      <input type="email" id="gateEmail" placeholder="${ADMIN_EMAIL}" autocomplete="off">
      <button class="btn btn-gradient" id="gateSubmit">Sign in</button>
      <p class="gate-hint">Restricted to ${ADMIN_EMAIL}</p>
    </div>`;

  const input = $("#gateEmail");
  const attempt = () => {
    const val = input.value.trim().toLowerCase();
    if (val === ADMIN_EMAIL) {
      setAdminSignedIn(true);
      toast("Welcome back — admin unlocked");
      renderAdminList();
    } else {
      input.classList.remove("shake");
      void input.offsetWidth;
      input.classList.add("shake");
      toast("Access denied — that email isn’t authorised");
      input.select();
    }
  };

  $("#gateSubmit").addEventListener("click", attempt);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      attempt();
    }
  });
  input.focus();
}

/* --- dashboard --- */
function renderAdminList() {
  adminBody.onclick = null;
  const list = getListings();

  adminBody.innerHTML = `
    <div class="admin-toolbar">
      <button class="btn btn-gradient btn-sm" id="adminAdd">+ Add listing</button>
      <div class="admin-tools">
        <button class="btn btn-ghost btn-sm" id="adminExport">Export</button>
        <button class="btn btn-ghost btn-sm" id="adminPublish">listings.json</button>
        <button class="btn btn-ghost btn-sm" id="adminImport">Import</button>
        <button class="btn btn-ghost btn-sm" id="adminReset">Reset</button>
        <button class="btn btn-ghost btn-sm" id="adminLogout">Sign out</button>
      </div>
    </div>
    <p class="admin-note">Changes apply instantly in this browser. To publish them for every visitor, click <b>listings.json</b>, then upload that file to the site root (drag &amp; drop it on Netlify, or commit it to the repo).</p>
    <div class="admin-import" id="adminImportBox" hidden>
      <textarea id="adminImportText" rows="5" placeholder='Paste exported listings JSON here…'></textarea>
      <button class="btn btn-dark btn-sm" id="adminImportApply">Replace listings</button>
    </div>
    <div class="admin-list">
      ${
        list
          .map(
            (p, i) => `
        <div class="admin-row" data-id="${esc(p.id)}">
          <div class="admin-row-main">
            <strong>${esc(p.title)}</strong>
            ${p.draft ? '<span class="pill pill-draft">Draft</span>' : ""}
            <span class="pill">${esc(p.status)}</span>
            <small>${esc(p.location)} · ${naira(p.price)}</small>
          </div>
          <div class="admin-row-actions">
            <button data-act="up" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
            <button data-act="down" ${i === list.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
            <button data-act="edit">Edit</button>
            <button data-act="dup">Duplicate</button>
            <button data-act="draft">${p.draft ? "Publish" : "Draft"}</button>
            <button data-act="del" class="danger">Delete</button>
          </div>
        </div>`
          )
          .join("") || '<p class="admin-empty">No listings yet — add your first one.</p>'
      }
    </div>`;

  $("#adminAdd").addEventListener("click", () => renderForm(null));
  $("#adminExport").addEventListener("click", () =>
    downloadJSON("lumivest-listings.json", getListings())
  );
  $("#adminPublish").addEventListener("click", () =>
    downloadJSON("listings.json", getListings())
  );
  $("#adminImport").addEventListener("click", () => {
    const box = $("#adminImportBox");
    box.hidden = !box.hidden;
    if (!box.hidden) $("#adminImportText").focus();
  });
  $("#adminImportApply").addEventListener("click", importListings);
  $("#adminReset").addEventListener("click", resetListings);
  $("#adminLogout").addEventListener("click", () => {
    setAdminSignedIn(false);
    renderGate();
    toast("Signed out");
  });

  adminBody.onclick = (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    const row = btn.closest(".admin-row");
    const current = getListings();
    const idx = current.findIndex((x) => x.id === row.dataset.id);
    if (idx < 0) return;
    const act = btn.dataset.act;

    if (act === "edit") return renderForm(current[idx]);
    if (act === "up" && idx > 0)
      [current[idx - 1], current[idx]] = [current[idx], current[idx - 1]];
    if (act === "down" && idx < current.length - 1)
      [current[idx + 1], current[idx]] = [current[idx], current[idx + 1]];
    if (act === "dup") {
      const clone = JSON.parse(JSON.stringify(current[idx]));
      clone.id = current[idx].id + "-copy-" + Date.now().toString(36);
      clone.title += " (copy)";
      clone.draft = true;
      current.splice(idx + 1, 0, clone);
      toast("Duplicated as draft");
    }
    if (act === "draft") {
      current[idx].draft = !current[idx].draft;
      toast(current[idx].draft ? "Moved to drafts" : "Published");
    }
    if (act === "del") {
      if (!confirm(`Delete “${current[idx].title}”? This cannot be undone.`))
        return;
      current.splice(idx, 1);
      toast("Listing deleted");
    }

    saveListings(current);
    render();
    renderAdminList();
  };
}

/* --- add / edit form --- */
function renderForm(p) {
  adminBody.onclick = null;
  const isNew = !p;
  const media = p ? JSON.parse(JSON.stringify(p.media)) : [];
  const highlights = p && Array.isArray(p.highlights) ? p.highlights.join("\n") : "";
  const statusOptions = [
    "For Sale",
    "For Rent",
    "Under Construction",
    "Distress Sale",
  ];

  adminBody.innerHTML = `
    <button class="admin-back-link" id="formBack">← All listings</button>
    <h3 class="admin-form-title">${isNew ? "Add listing" : "Edit listing"}</h3>

    <div class="form-grid">
      <label>Title *<input id="aTitle" value="${esc(p?.title || "")}" placeholder="3 Bedroom Apartment"></label>
      <label>Location *<input id="aLocation" value="${esc(p?.location || "")}" placeholder="Kaduna"></label>
      <label>Property type
        <select id="aType">
          <option value="house" ${p?.type === "house" ? "selected" : ""}>House / bungalow</option>
          <option value="apartment" ${!p || p.type === "apartment" ? "selected" : ""}>Apartment</option>
        </select>
      </label>
      <label>Deal
        <select id="aMode">
          <option value="sale" ${!p || p.mode === "sale" ? "selected" : ""}>For sale</option>
          <option value="rent" ${p?.mode === "rent" ? "selected" : ""}>For rent</option>
        </select>
      </label>
      <label>Price (₦) *<input id="aPrice" type="number" min="0" value="${p?.price ?? ""}"></label>
      <label>Price note<input id="aPriceNote" value="${esc(p?.priceNote || "")}" placeholder="e.g. ₦2,600,000 annual rent option"></label>
      <label>Status
        <select id="aStatus">
          ${statusOptions
            .map(
              (s) =>
                `<option ${p?.status === s ? "selected" : ""}>${s}</option>`
            )
            .join("")}
        </select>
      </label>
      <label>Badge<input id="aBadge" value="${esc(p?.badge || "New")}" placeholder="Top pick"></label>
      <label>Rating (0–5)<input id="aRating" type="number" step="0.1" min="0" max="5" value="${p?.rating ?? ""}"></label>
      <label>Reviews<input id="aReviews" type="number" min="0" value="${p?.reviews ?? 0}"></label>
      <label>Bedrooms<input id="aBeds" type="number" min="0" value="${p?.beds ?? 1}"></label>
      <label>Bathrooms<input id="aBaths" type="number" min="0" value="${p?.baths ?? 1}"></label>
      <label>Parking<input id="aParking" value="${esc(p?.parking || "1 car")}"></label>
      <label>Land size<input id="aSize" value="${esc(p?.size || "")}" placeholder="30 sqm"></label>
    </div>

    <label class="form-block">Description
      <textarea id="aDesc" rows="3" placeholder="Describe the property…">${esc(p?.desc || "")}</textarea>
    </label>
    <label class="form-block">Highlights (one per line)
      <textarea id="aHighlights" rows="4" placeholder="Borehole water\nFenced & gated">${esc(highlights)}</textarea>
    </label>

    <label class="form-check"><input type="checkbox" id="aAlert" ${p?.alert ? "checked" : ""}> Red “distress sale” badge</label>
    <label class="form-check"><input type="checkbox" id="aDraft" ${p?.draft ? "checked" : ""}> Save as draft (hidden from visitors)</label>

    <div class="admin-media">
      <h4>Photos &amp; videos</h4>
      <div id="adminMediaRows"></div>
      <div class="media-add">
        <button type="button" class="btn btn-ghost btn-sm" id="mAddImg">+ Image URL</button>
        <button type="button" class="btn btn-ghost btn-sm" id="mAddVid">+ Video URL</button>
        <label class="btn btn-ghost btn-sm file-label">Upload image<input type="file" id="mUpload" accept="image/*" hidden></label>
      </div>
    </div>

    <div class="form-actions">
      <button class="btn btn-gradient" id="aSave">${isNew ? "Add listing" : "Save changes"}</button>
      <button class="btn btn-ghost" id="aCancel">Cancel</button>
    </div>`;

  const rows = $("#adminMediaRows");

  function paintMedia() {
    rows.innerHTML = media
      .map(
        (m, i) => `
      <div class="media-row" data-i="${i}">
        <span class="media-kind ${m.type === "video" ? "video" : ""}">${
          m.type === "video" ? "VIDEO" : "IMG"
        }</span>
        <input data-src value="${esc(m.src)}">
        <button type="button" data-mact="up" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
        <button type="button" data-mact="down" ${i === media.length - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
        <button type="button" data-mact="rm" class="danger" aria-label="Remove">✕</button>
      </div>`
      )
      .join("") || '<p class="admin-empty">No media yet — add an image or video.</p>';
  }
  paintMedia();

  rows.addEventListener("input", (e) => {
    const inp = e.target.closest("[data-src]");
    if (!inp) return;
    media[Number(inp.closest(".media-row").dataset.i)].src = inp.value.trim();
  });

  rows.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-mact]");
    if (!btn || btn.disabled) return;
    const i = Number(btn.closest(".media-row").dataset.i);
    if (btn.dataset.mact === "up" && i > 0)
      [media[i - 1], media[i]] = [media[i], media[i - 1]];
    if (btn.dataset.mact === "down" && i < media.length - 1)
      [media[i + 1], media[i]] = [media[i], media[i + 1]];
    if (btn.dataset.mact === "rm") media.splice(i, 1);
    paintMedia();
  });

  $("#mAddImg").addEventListener("click", () => {
    const url = prompt("Image URL:");
    if (url && url.trim()) {
      media.push({ type: "image", src: url.trim() });
      paintMedia();
    }
  });

  $("#mAddVid").addEventListener("click", () => {
    const url = prompt("Video URL (.mp4):");
    if (url && url.trim()) {
      media.push({ type: "video", src: url.trim() });
      paintMedia();
    }
  });

  $("#mUpload").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 900 * 1024) {
      toast("Image over 900KB — use a URL instead, or upload a smaller file");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      media.push({ type: "image", src: reader.result });
      paintMedia();
      toast("Image attached");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  $("#aSave").addEventListener("click", () => {
    const title = $("#aTitle").value.trim();
    const location = $("#aLocation").value.trim();
    const price = Number($("#aPrice").value);
    if (!title || !location || !price) {
      toast("Title, location and price are required");
      return;
    }

    const ratingRaw = $("#aRating").value;
    const listing = {
      id: p ? p.id : "custom-" + Date.now().toString(36),
      title,
      location,
      type: $("#aType").value,
      mode: $("#aMode").value,
      price,
      status: $("#aStatus").value,
      badge: $("#aBadge").value.trim() || "New",
      alert: $("#aAlert").checked,
      rating: ratingRaw === "" ? null : Number(ratingRaw),
      reviews: Number($("#aReviews").value) || 0,
      beds: Number($("#aBeds").value) || 0,
      baths: Number($("#aBaths").value) || 0,
      parking: $("#aParking").value.trim() || "—",
      size: $("#aSize").value.trim() || "—",
      desc: $("#aDesc").value.trim(),
      highlights: $("#aHighlights").value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      draft: $("#aDraft").checked,
      media: media.filter((m) => m.src),
    };

    const note = $("#aPriceNote").value.trim();
    if (note) listing.priceNote = note;
    if (!listing.media.length)
      listing.media = [{ type: "image", src: U("1523217582562-09d0def993a6") }];
    listing.media.forEach((m) => {
      m.type = /\.mp4(\?|$)/i.test(m.src) ? "video" : "image";
    });

    const current = getListings();
    const idx = p ? current.findIndex((x) => x.id === p.id) : -1;
    if (idx >= 0) current[idx] = listing;
    else current.unshift(listing);

    saveListings(current);
    render();
    renderAdminList();
    toast(p ? "Listing updated" : "Listing added");
  });

  $("#aCancel").addEventListener("click", renderAdminList);
  $("#formBack").addEventListener("click", renderAdminList);
}

/* --- import / export / reset --- */
function downloadJSON(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(`Downloaded ${name}`);
}

function importListings() {
  try {
    const data = JSON.parse($("#adminImportText").value);
    const arr = Array.isArray(data) ? data : data.listings;
    if (!Array.isArray(arr) || !arr.length)
      throw new Error("expected a non-empty array");
    const cleaned = arr
      .filter((x) => x && x.id && x.title)
      .map((x) => ({
        ...x,
        media: Array.isArray(x.media)
          ? x.media.filter((m) => m && m.src)
          : [],
        highlights: Array.isArray(x.highlights) ? x.highlights : [],
      }))
      .filter((x) => x.media.length);
    if (!cleaned.length) throw new Error("no valid listings found");
    saveListings(cleaned);
    render();
    renderAdminList();
    toast(`Imported ${cleaned.length} listings`);
  } catch (err) {
    toast(`Import failed: ${err.message}`);
  }
}

function resetListings() {
  if (!confirm("Reset to the original listings? Your edits will be lost."))
    return;
  try {
    localStorage.removeItem(LISTINGS_KEY);
  } catch {
    /* ignore */
  }
  listingsCache = null;
  publishedListings = null;
  render();
  renderAdminList();
  toast("Listings reset to defaults");
}

/* ---------------- Init ---------------- */

async function init() {
  await loadPublished();
  renderCategories();
  updateSavedCount();
  render();
  observeReveals();
  animateCounters();
}

init();
