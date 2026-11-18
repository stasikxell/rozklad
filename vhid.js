// Вхід без пароля: одна кнопка «ВХІД».
// Запам'ятовує вхід на цьому пристрої (localStorage).
const Auth = (() => {
  const KEY = "rozklad-auth";

  function saved() {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  let user = saved();
  const sync = () => document.documentElement.classList.toggle("authed", !!user);
  sync();

  return {
    ok: () => !!user,
    name: () => (user ? "user" : null),
    login() {
      user = true;
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
      sync();
      document.dispatchEvent(new Event("login"));
      return true;
    },
    logout() {
      user = false;
      try { localStorage.removeItem(KEY); } catch (e) {}
      sync();
      document.dispatchEvent(new Event("logout"));
    },
  };
})();

(function () {
  const btn = document.getElementById("gate-enter");
  const gate = document.getElementById("gate");
  if (!btn) return;

  const titleEl = document.getElementById("gate-title");
  if (titleEl) {
    titleEl.textContent = (typeof NAZVA !== "undefined" && NAZVA) ? NAZVA : "Розклад";
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Натискаємо ВХІД: екран входу плавно зникає, потім відкривається розклад.
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    btn.disabled = true;
    if (gate) gate.classList.add("leaving");
    setTimeout(() => {
      Auth.login();
      if (gate) gate.classList.remove("leaving");
      btn.disabled = false;
    }, reduced ? 0 : 450);
  });
})();
