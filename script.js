const html = document.documentElement;
const toggle = document.getElementById("themeToggle");
const icon = document.getElementById("themeIcon");

function setTheme(theme) {
  html.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  icon.textContent = theme === "dark" ? "☀️" : "🌙";
}

const savedTheme = localStorage.getItem("theme");
const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme) {
  setTheme(savedTheme);
} else if (systemPrefersDark) {
  setTheme("dark");
} else {
  setTheme("light");
}

toggle.addEventListener("click", () => {
  const currentTheme = html.getAttribute("data-theme");
  setTheme(currentTheme === "dark" ? "light" : "dark");
});

const form = document.getElementById("filtersForm");
const clearBtn = document.getElementById("clearFilters");
const cards = document.querySelectorAll(".property-card");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const location = document.getElementById("location").value.toLowerCase().trim();
  const price = document.getElementById("price").value;
  const type = document.getElementById("type").value.toLowerCase().trim();

  cards.forEach((card) => {
    const cardText = card.innerText.toLowerCase();
    const cardPriceText = card.querySelector(".price").textContent.replace(/[^\d]/g, "");
    const cardPrice = parseInt(cardPriceText, 10);

    const matchesLocation = !location || cardText.includes(location);
    const matchesType = !type || cardText.includes(type);

    let matchesPrice = true;
    if (price) {
      const [min, max] = price.split("-").map(Number);
      matchesPrice = cardPrice >= min && cardPrice <= max;
    }

    card.style.display = matchesLocation && matchesType && matchesPrice ? "block" : "none";
  });
});

clearBtn.addEventListener("click", () => {
  form.reset();
  cards.forEach((card) => (card.style.display = "block"));
});

const modal = document.getElementById("propertyModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalTitle = document.getElementById("modalTitle");
const modalLocation = document.getElementById("modalLocation");
const modalPrice = document.getElementById("modalPrice");
const modalType = document.getElementById("modalType");
const modalStatus = document.getElementById("modalStatus");
const modalDescription = document.getElementById("modalDescription");
const modalFacts = document.getElementById("modalFacts");
const modalMainImage = document.getElementById("modalMainImage");
const modalThumbs = document.getElementById("modalThumbs");
const inquiryForm = document.getElementById("inquiryForm");

let lastFocusedElement = null;

function formatPrice(value) {
  return `₦${Number(value).toLocaleString()}`;
}

function getPropertyData(card) {
  return {
    title: card.dataset.title,
    location: card.dataset.location,
    price: formatPrice(card.dataset.price),
    type: card.dataset.type,
    status: card.dataset.status || "Available",
    description: card.dataset.description,
    facts: [
      ["Bedrooms", card.dataset.bedrooms],
      ["Bathrooms", card.dataset.bathrooms],
      ["Parking", card.dataset.parking],
      ["Size", card.dataset.size]
    ],
    images: [card.dataset.image1, card.dataset.image2, card.dataset.image3].filter(Boolean),
    phone: card.dataset.phone,
    email: card.dataset.email
  };
}

function openModal(data) {
  lastFocusedElement = document.activeElement;

  modalTitle.textContent = data.title;
  modalLocation.textContent = data.location;
  modalPrice.textContent = data.price;
  modalType.textContent = data.type;
  modalStatus.textContent = data.status;
  modalDescription.textContent = data.description;

  modalMainImage.src = data.images[0] || "";
  modalMainImage.alt = data.title;

  modalFacts.innerHTML = data.facts
    .map(([label, value]) => `<div class="fact"><strong>${label}</strong><span>${value}</span></div>`)
    .join("");

  modalThumbs.innerHTML = data.images
    .map((src, index) => `<img src="${src}" alt="${data.title} view ${index + 1}" data-src="${src}">`)
    .join("");

  modalThumbs.querySelectorAll("img").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      modalMainImage.src = thumb.dataset.src;
      modalMainImage.alt = data.title;
    });
  });

  inquiryForm.dataset.propertyTitle = data.title;
  inquiryForm.dataset.propertyPhone = data.phone || "";
  inquiryForm.dataset.propertyEmail = data.email || "";

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  modalClose.focus();
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

document.querySelectorAll(".property-card").forEach((card) => {
  const trigger = card.querySelector(".property-open");
  trigger.addEventListener("click", () => {
    openModal(getPropertyData(card));
  });
});

modalBackdrop.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});

inquiryForm.addEventListener("submit", (e) => {
  e.preventDefault();
  alert(`Inquiry sent for "${e.currentTarget.dataset.propertyTitle}".`);
  e.currentTarget.reset();
  closeModal();
});

const modalLoading = document.getElementById("modalLoading");

function showLoading() {
  modal.classList.add("is-open", "is-loading");
  modal.setAttribute("aria-hidden", "false");
  modalLoading.setAttribute("aria-busy", "true");
  document.body.style.overflow = "hidden";
  modalClose.focus();
}

function finishLoading(data) {
  modalTitle.textContent = data.title;
  modalLocation.textContent = data.location;
  modalPrice.textContent = data.price;
  modalType.textContent = data.type;
  modalStatus.textContent = data.status;
  modalDescription.textContent = data.description;

  modalMainImage.src = data.images[0] || "";
  modalMainImage.alt = data.title;

  modalFacts.innerHTML = data.facts
    .map(([label, value]) => `<div class="fact"><strong>${label}</strong><span>${value}</span></div>`)
    .join("");

  modalThumbs.innerHTML = data.images
    .map((src, index) => `<img src="${src}" alt="${data.title} view ${index + 1}" data-src="${src}">`)
    .join("");

  modalThumbs.querySelectorAll("img").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      modalMainImage.src = thumb.dataset.src;
      modalMainImage.alt = data.title;
    });
  });

  inquiryForm.dataset.propertyTitle = data.title;
  inquiryForm.dataset.propertyPhone = data.phone || "";
  inquiryForm.dataset.propertyEmail = data.email || "";

  modalLoading.setAttribute("aria-busy", "false");
  modal.classList.remove("is-loading");
}

document.querySelectorAll(".property-card").forEach((card) => {
  const trigger = card.querySelector(".property-open");
  trigger.addEventListener("click", () => {
    const data = getPropertyData(card);
    showLoading();

    setTimeout(() => {
      finishLoading(data);
    }, 250);
  });
});

function showLoading() {
  modal.classList.add("is-open", "is-loading");
  modal.setAttribute("aria-hidden", "false");
  modalLoading.setAttribute("aria-busy", "true");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("is-open", "is-loading");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}