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