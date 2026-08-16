// Punto de entrada del frontend de SegundaVida.
document.documentElement.classList.add("app-ready");

const telegramRuntime = window.SecondaVidaTelegram ?? {
  isTelegram: false,
  sdkAvailable: false,
};

const api = window.SecondaVidaApi;
const state = {
  items: [],
  category: "Todo",
  query: "",
};

const runtimeName = document.querySelector("#runtime-name");
const telegramSdkState = document.querySelector("#telegram-sdk-state");
const telegramStatus = document.querySelector("#telegram-status");
const telegramStatusLabel = document.querySelector("#telegram-status-label");
const n8nStatus = document.querySelector("#n8n-status");
const n8nStatusLabel = document.querySelector("#n8n-status-label");
const searchInput = document.querySelector("#search-input");
const categoryFilters = document.querySelector("#category-filters");
const itemsCount = document.querySelector("#items-count");
const itemsState = document.querySelector("#items-state");
const itemsGrid = document.querySelector("#items-grid");

const categorySymbols = {
  Hogar: "⌂",
  Infantil: "☺",
  Libros: "▤",
  Tecnología: "⌘",
  Ropa: "◌",
  Otros: "♻",
};

function setServiceState(element, label, stateName, text) {
  element.dataset.state = stateName;
  label.textContent = text;
}

function formatDate(value) {
  if (!value) return "";

  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(date).replace(" de ", " ");
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function createItemCard(item, index) {
  const card = document.createElement("article");
  card.className = "item-card";
  card.style.animationDelay = `${Math.min(index * 60, 240)}ms`;
  card.dataset.itemId = item.id;

  if (item.imageUrl) {
    const image = document.createElement("img");
    image.className = "item-card__media";
    image.src = item.imageUrl;
    image.alt = item.title;
    image.loading = "lazy";
    card.append(image);
  } else {
    const placeholder = createTextElement(
      "div",
      "item-card__placeholder",
      categorySymbols[item.category] ?? categorySymbols.Otros,
    );
    placeholder.setAttribute("aria-hidden", "true");
    card.append(placeholder);
  }

  const body = document.createElement("div");
  body.className = "item-card__body";
  body.append(createTextElement("h3", "item-card__title", item.title));

  if (item.description) {
    body.append(createTextElement("p", "item-card__description", item.description));
  }

  const meta = document.createElement("div");
  meta.className = "item-card__meta";
  const category = document.createElement("span");
  category.className = "item-card__category";
  category.textContent = `${categorySymbols[item.category] ?? "♻"} ${item.category}`;
  meta.append(category);

  if (item.zone) {
    meta.append(createTextElement("span", "", `⌖ ${item.zone}`));
  }
  body.append(meta);

  const footer = document.createElement("div");
  footer.className = "item-card__footer";
  const availability = item.expiresAt
    ? `Disponible hasta ${formatDate(item.expiresAt)}`
    : "Disponible";
  footer.append(createTextElement("span", "availability", availability));
  footer.append(createTextElement("span", "item-card__arrow", "→"));
  body.append(footer);

  card.append(body);
  return card;
}

function renderCategories() {
  categoryFilters.replaceChildren();
  const categories = ["Todo", ...new Set(state.items.map((item) => item.category))];

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.className = "filter-chip";
    button.type = "button";
    button.role = "tab";
    button.setAttribute("aria-selected", String(state.category === category));
    button.textContent = category;
    button.addEventListener("click", () => {
      state.category = category;
      renderCategories();
      renderItems();
    });
    categoryFilters.append(button);
  });
}

function renderItems() {
  const query = state.query.trim().toLocaleLowerCase("es");
  const visibleItems = state.items.filter((item) => {
    const matchesCategory = state.category === "Todo" || item.category === state.category;
    const searchableText = `${item.title} ${item.description} ${item.category} ${item.zone}`
      .toLocaleLowerCase("es");
    return matchesCategory && (!query || searchableText.includes(query));
  });

  itemsCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "cosa" : "cosas"}`;
  itemsGrid.replaceChildren(...visibleItems.map(createItemCard));

  if (visibleItems.length > 0) {
    itemsState.textContent = "";
    itemsState.dataset.state = "";
    return;
  }

  itemsState.textContent = state.items.length > 0
    ? "No encontramos objetos con esa búsqueda."
    : "Todavía no hay objetos disponibles. Cuando alguien publique algo, aparecerá aquí.";
}

function isNotExpired(item) {
  if (!item.expiresAt) return true;

  const normalized = item.expiresAt.includes(" ")
    ? item.expiresAt.replace(" ", "T")
    : item.expiresAt;
  const expiresAt = new Date(normalized);
  return Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() >= Date.now();
}

async function loadCatalog() {
  if (!api?.isDataConfigured) {
    itemsState.textContent = "El catálogo todavía no está configurado.";
    itemsState.dataset.state = "error";
    return;
  }

  try {
    const records = await api.listItems();
    state.items = records.filter((item) => item.status === "available" && isNotExpired(item));
    renderCategories();
    renderItems();
  } catch {
    itemsState.textContent = "No hemos podido cargar los objetos. Inténtalo de nuevo en unos instantes.";
    itemsState.dataset.state = "error";
    itemsCount.textContent = "Sin datos";
  }
}

if (telegramRuntime.isTelegram) {
  runtimeName.textContent = "Telegram";
  telegramSdkState.textContent = telegramRuntime.sdkAvailable
    ? " · SDK disponible ✓"
    : " · SDK no disponible";
  telegramSdkState.hidden = false;
  setServiceState(telegramStatus, telegramStatusLabel, "connected", "Conectado ✓");
}

if (api?.isConfigured) {
  n8nStatusLabel.textContent = "Comprobando...";

  api.ping().then((result) => {
    if (result.ok && result.service === "SegundaVida") {
      setServiceState(n8nStatus, n8nStatusLabel, "connected", "Conectado ✓");
      return;
    }

    setServiceState(n8nStatus, n8nStatusLabel, "error", "Respuesta no válida");
  }).catch(() => {
    setServiceState(n8nStatus, n8nStatusLabel, "error", "No disponible");
  });
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderItems();
});

window.SecondaVidaAnalytics?.trackPageView();
loadCatalog();
