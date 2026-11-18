  const DEFAULTS = {
  theme: "auto",        // "auto" | "light" | "dark"
  size: "m",            // "s" | "m" | "l"  (розмір тексту пар)
  aud: true,            // показувати аудиторії
  weekendNext: true,    // у сб/нд показувати наступний тиждень
  frame: true,          // рамка телефона на великому екрані (комп'ютер)
};
const SET = Object.assign({}, DEFAULTS);
const STORE_KEY = "rozklad-settings";
const OPTIONS = { theme: ["auto", "light", "dark"], size: ["s", "m", "l"] };

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    for (const k in DEFAULTS) {
      if (!(k in saved)) continue;
      if (typeof saved[k] !== typeof DEFAULTS[k]) continue;
      if (OPTIONS[k] && !OPTIONS[k].includes(saved[k])) continue;
      SET[k] = saved[k];
    }
  } catch (e) { /* нема localStorage — працюємо зі значеннями за замовчуванням */ }
}
function saveSettings() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(SET)); } catch (e) {}
}

function applySettings() {
  const root = document.documentElement;
  root.dataset.theme = SET.theme;
  root.dataset.size = SET.size;
  document.body.classList.toggle("frame", SET.frame);

  const dark = SET.theme === "dark" ||
    (SET.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = dark ? "#0e1118" : "#f3f5fb";
}

function syncUI() {
  document.querySelectorAll(".seg[data-key]").forEach(g => {
    g.querySelectorAll("button").forEach(b => {
      b.setAttribute("aria-pressed", String(b.dataset.v === String(SET[g.dataset.key])));
    });
  });
  document.querySelectorAll("input[data-key]").forEach(i => { i.checked = !!SET[i.dataset.key]; });
}

function change(key, value) {
  SET[key] = value;
  saveSettings(); applySettings(); syncUI();
  document.dispatchEvent(new Event("settings"));
}

function initSettingsUI() {
  document.querySelectorAll(".seg[data-key] button").forEach(b => {
    b.addEventListener("click", () => change(b.parentElement.dataset.key, b.dataset.v));
  });
  document.querySelectorAll("input[data-key]").forEach(i => {
    i.addEventListener("change", () => change(i.dataset.key, i.checked));
  });
  document.getElementById("s-reset").addEventListener("click", () => {
    Object.assign(SET, DEFAULTS);
    saveSettings(); applySettings(); syncUI();
    document.dispatchEvent(new Event("settings"));
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applySettings);
  syncUI();
}

loadSettings();
applySettings();
initSettingsUI();
