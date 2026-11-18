// Логіка показу. Розклад — з rozklad.js, профіль — з profil.js, параметри — з settings.js.
const DNI = ["ПН", "ВТ", "СР", "ЧТ", "ПТ"];
const МІС_НАЗ = ["січень","лютий","березень","квітень","травень","червень",
                 "липень","серпень","вересень","жовтень","листопад","грудень"];
const МІС_РОД = ["січня","лютого","березня","квітня","травня","червня",
                 "липня","серпня","вересня","жовтня","листопада","грудня"];
const МІС_КОР = ["січ","лют","бер","кві","тра","чер","лип","сер","вер","жов","лис","гру"];

function mondayOf(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function sameDay(a, b) { return a.toDateString() === b.toDateString(); }
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---------- місяці і тижні ----------
const now0 = new Date();
const M = (typeof MISYATS !== "undefined") ? MISYATS : { rik: now0.getFullYear(), misyac: now0.getMonth() + 1 };
document.getElementById("brand").textContent = "Розклад";
const brandSub = document.getElementById("brand-sub");
const monthLabel = (rik, mis) => МІС_НАЗ[mis - 1] + " " + rik;
brandSub.textContent = monthLabel(M.rik, M.misyac);

// Усі місяці: основний (MISYATS + ROZKLAD) і додаткові (INSHI_MISYACI)
const months = [];
if (typeof ROZKLAD !== "undefined") months.push({ rik: M.rik, misyac: M.misyac, dni: ROZKLAD });
if (typeof INSHI_MISYACI !== "undefined" && Array.isArray(INSHI_MISYACI)) {
  INSHI_MISYACI.forEach(x => months.push({ rik: x.rik, misyac: x.misyac, dni: x.dni, tekst: x.utochnennya }));
}
months.sort((a, b) => (a.rik * 12 + a.misyac) - (b.rik * 12 + b.misyac));

// Значення дня з rozklad.js -> { pary, nota, rest }
function dayInfo(v) {
  if (typeof v === "string") return { pary: [], nota: "", rest: v || " " };
  if (Array.isArray(v)) return { pary: v, nota: "", rest: "" };
  if (v && typeof v === "object") return { pary: v.pary || [], nota: v.nota || "", rest: v.vidpochynok === undefined ? "" : (v.vidpochynok || " ") };
  return { pary: [], nota: "", rest: "" };
}

const weeks = [];
months.forEach(mo => {
  if (!mo.dni) {   // місяць без розкладу: одна картка «Уточнення»
    weeks.push({ monday: new Date(mo.rik, mo.misyac - 1, 1), days: [], placeholder: true, rik: mo.rik, misyac: mo.misyac, tekst: mo.tekst || "Розклад уточнюється" });
    return;
  }
  for (let d = new Date(mo.rik, mo.misyac - 1, 1); d.getMonth() === mo.misyac - 1; d.setDate(d.getDate() + 1)) {
    const w = d.getDay();
    if (w === 0 || w === 6) continue;
    if (!(d.getDate() in mo.dni)) continue;   // немає рядка — немає дня
    const mon = mondayOf(d);
    const item = { date: new Date(d), info: dayInfo(mo.dni[d.getDate()]) };
    const last = weeks[weeks.length - 1];
    if (last && !last.placeholder && sameDay(last.monday, mon)) last.days.push(item);
    else weeks.push({ monday: mon, days: [item] });
  }
});
weeks.sort((a, b) => a.monday - b.monday);

// примітки до тижнів
if (typeof TYZHNI !== "undefined" && Array.isArray(TYZHNI)) {
  TYZHNI.forEach(t => {
    const p = String(t.data || "").split("-").map(Number);
    if (p.length !== 3 || p.some(isNaN)) return;
    const mon = mondayOf(new Date(p[0], p[1] - 1, p[2]));
    const w = weeks.find(x => !x.placeholder && sameDay(x.monday, mon));
    if (w) w.note = t.tekst;
  });
}

function startIndex() {
  if (weeks.length === 0) return 0;
  const now = new Date();
  const m = mondayOf(now);
  const dow = now.getDay();
  if (SET.weekendNext && (dow === 0 || dow === 6)) m.setDate(m.getDate() + 7);
  const i = weeks.findIndex(w => w.monday >= m);   // цей або найближчий наступний тиждень
  return i === -1 ? weeks.length - 1 : i;
}

let idx = startIndex();
function go(step) {
  const n = Math.min(Math.max(idx + step, 0), Math.max(weeks.length - 1, 0));
  if (n !== idx) { idx = n; render(step > 0 ? "next" : "prev"); }
}

// ---------- показ ----------
// anim: "next" | "prev" | "up" — як плавно з'являються дні (без параметра — без анімації)
function render(anim) {
  const week = document.getElementById("week");
  week.replaceChildren();
  if (typeof Auth !== "undefined" && !Auth.ok()) return;   // без входу розклад не показуємо

  if (weeks.length === 0) {
    document.getElementById("range").textContent = "";
    week.append(el("div", "empty", "Розкладу ще немає"));
    return;
  }
  const w = weeks[idx];
  const animate = (node, i) => { if (anim) { node.classList.add("in-" + anim); node.style.setProperty("--i", i); } };

  document.getElementById("prev").disabled = idx === 0;
  document.getElementById("next").disabled = idx === weeks.length - 1;
  document.getElementById("today").hidden = idx === startIndex();

  // місяць без розкладу
  if (w.placeholder) {
    const t = МІС_НАЗ[w.misyac - 1];
    document.getElementById("range").textContent = t.charAt(0).toUpperCase() + t.slice(1) + " " + w.rik;
    brandSub.textContent = monthLabel(w.rik, w.misyac);
    const box = el("section", "unknown");
    box.append(el("div", "u-ico", "⏳"), el("div", "u-title", "Уточнення"), el("div", "u-text", w.tekst));
    animate(box, 0);
    week.append(box);
    return;
  }

  const first = w.days[0].date, last = w.days[w.days.length - 1].date;
  document.getElementById("range").textContent =
    first.getDate() === last.getDate() && first.getMonth() === last.getMonth()
      ? `${first.getDate()} ${МІС_РОД[first.getMonth()]}`
      : first.getMonth() === last.getMonth()
        ? `${first.getDate()}–${last.getDate()} ${МІС_РОД[first.getMonth()]}`
        : `${first.getDate()} ${МІС_КОР[first.getMonth()]} – ${last.getDate()} ${МІС_КОР[last.getMonth()]}`;
  brandSub.textContent = monthLabel(first.getFullYear(), first.getMonth() + 1);

  let n = 0;
  if (w.note) {
    const banner = el("section", "week-note");
    banner.append(el("span", "wn-ico", "📌"), el("span", "wn-text", w.note));
    animate(banner, n++);
    week.append(banner);
  }

  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  w.days.forEach(({ date, info }) => {
    const name = DNI[(date.getDay() + 6) % 7];
    const cls = "day" + (info.rest ? " is-rest" : "") + (sameDay(date, today) ? " is-today" : date < startToday ? " is-past" : "");
    const day = el("section", cls);
    animate(day, n++);

    const when = el("div", "when");
    when.append(el("div", "name", name), el("div", "num", String(date.getDate())), el("div", "mon", МІС_КОР[date.getMonth()]));

    const pairs = el("div", "pairs");
    if (info.nota) pairs.append(el("div", "day-note", info.nota));

    if (info.rest) {
      const label = info.rest.trim();
      const rest = el("div", "rest");
      rest.append(el("div", "rest-main", "🌴 ВІДПОЧИНОК"));
      if (label) rest.append(el("div", "rest-sub", "(" + label + ")"));
      pairs.append(rest);
    } else if (info.pary.length === 0) {
      if (!info.nota) pairs.append(el("div", "empty", "Пар немає"));
    } else {
      info.pary.forEach(x => {
        const [para, chas, aud, vykl, notatka] = Array.isArray(x) ? x : [x.para, x.chas, x.aud, x.vykl, x.note];
        const p = el("div", "pair");
        const m = /^(\d+)\s*пара$/i.exec(String(chas).trim());
        const chasTxt = m && typeof DZVINKY !== "undefined" ? (DZVINKY[m[1]] || "") : "";
        p.append(m ? el("div", "no", m[1]) : el("div", "time", chas));
        const main = el("div", "main");
        main.append(el("div", "p", para));
        const meta = el("div", "meta");
        if (chasTxt) meta.append(el("span", "tm", chasTxt));
        if (SET.aud && aud) meta.append(el("span", "aud", "ауд. " + aud));
        if (meta.childNodes.length) main.append(meta);
        if (vykl) main.append(el("div", "w", vykl));
        if (notatka) main.append(el("div", "n", notatka));
        p.append(main);
        pairs.append(p);
      });
    }
    day.append(when, pairs);
    week.append(day);
  });
}

document.getElementById("prev").onclick  = () => go(-1);
document.getElementById("next").onclick  = () => go(1);
document.getElementById("today").onclick = () => {
  const old = idx; idx = startIndex(); render(idx >= old ? "next" : "prev");
};
document.addEventListener("settings", render);
document.addEventListener("login",  () => { idx = startIndex(); render("up"); syncInfo(); });
document.addEventListener("logout", () => { clearInfoHash(); render(); syncInfo(); });

// ---------- вікна: профіль і налаштування (плавно відкриваються й закриваються) ----------
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let opener = null;
const anyOpen = () => !!document.querySelector(".overlay:not([hidden]):not(.closing)");

function openSheet(id) {
  opener = document.activeElement;
  const o = document.getElementById(id);
  o.classList.remove("closing");
  o.hidden = false;
  o.querySelector(".close").focus({ preventScroll: true });
}
function closeSheets() {
  document.querySelectorAll(".overlay:not([hidden]):not(.closing)").forEach(o => {
    const done = () => { o.hidden = true; o.classList.remove("closing"); };
    if (reduced) return done();
    o.classList.add("closing");
    setTimeout(done, 260);
  });
  if (opener) opener.focus({ preventScroll: true });
}

document.getElementById("avatar").onclick = () => {
  const p = typeof PROFIL !== "undefined" ? PROFIL : {};
  document.getElementById("p-pib").textContent = p.pib || "";
  document.getElementById("p-rol").textContent = [p.rol, p.grupa, p.kurs ? p.kurs + " курсу" : ""].filter(Boolean).join(" ");
  const mail = document.getElementById("p-mail");
  mail.textContent = p.email || "";
  mail.href = p.email ? "mailto:" + p.email : "#";
  openSheet("profile");
};
document.getElementById("gear").onclick = () => openSheet("settings");
document.getElementById("logout").onclick = () => { closeSheets(); Auth.logout(); };

document.querySelectorAll(".close").forEach(b => b.addEventListener("click", closeSheets));
document.querySelectorAll(".overlay").forEach(o =>
  o.addEventListener("click", e => { if (e.target === o) closeSheets(); }));

// ---------- «Інформація»: панель, що плавно виїжджає збоку ----------
const phone = document.querySelector(".phone");
const infoPanel = document.getElementById("info");
const infoBtn = document.getElementById("info-btn");
const infoOpen = () => phone.classList.contains("info-open");

const SVG_INFO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>';
const SVG_WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l10 17.5H2z"/><path d="M12 10v4.5M12 17.5h.01"/></svg>';

function buildInfo() {
  const list = document.getElementById("info-list");
  list.replaceChildren();
  const items = (typeof INFO !== "undefined" && Array.isArray(INFO)) ? INFO : [];
  if (items.length === 0) {
    list.append(el("div", "empty-note", "Оголошень поки немає"));
    return;
  }
  items.forEach((x, i) => {
    const post = el("article", "post" + (x.vazhlyve ? " warn" : ""));
    post.style.setProperty("--i", i);
    const ic = el("div", "ic");
    ic.setAttribute("aria-hidden", "true");
    ic.innerHTML = x.vazhlyve ? SVG_WARN : SVG_INFO;   // власні іконки, не дані користувача
    const body = el("div", "body");
    if (x.koly) body.append(el("div", "date", x.koly));
    if (x.zagolovok) body.append(el("h3", "", x.zagolovok));
    if (x.aud) body.append(el("div", "where", "Ауд. " + x.aud));
    if (x.tekst) body.append(el("p", "", x.tekst));
    post.append(ic, body);
    list.append(post);
  });
}

function updateClock() {
  const now = new Date();
  const days = ["неділя","понеділок","вівторок","середа","четвер","пʼятниця","субота"];
  document.getElementById("info-day").textContent = days[now.getDay()];
  document.getElementById("info-date").textContent = `${now.getDate()} ${МІС_РОД[now.getMonth()]} ${now.getFullYear()}`;
  document.getElementById("info-time").textContent = now.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

function syncInfo() {
  const want = location.hash === "#info" && Auth.ok();
  if (want === infoOpen()) return;
  phone.classList.toggle("info-open", want);
  infoPanel.setAttribute("aria-hidden", String(!want));
  infoPanel.inert = !want;
  if (want) { updateClock(); infoPanel.scrollTop = 0; document.getElementById("info-back").focus({ preventScroll: true }); }
  else if (document.activeElement && infoPanel.contains(document.activeElement)) infoBtn.focus({ preventScroll: true });
}
function clearInfoHash() {
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; }
}
function openInfo() {
  try { history.pushState({ info: 1 }, "", "#info"); } catch (e) { location.hash = "#info"; }
  syncInfo();
}
function closeInfo() {
  if (history.state && history.state.info) history.back();   // кнопка «назад» на телефоні теж закриває
  else { clearInfoHash(); syncInfo(); }
}

buildInfo();
infoBtn.onclick = openInfo;
document.getElementById("info-back").onclick = closeInfo;
window.addEventListener("popstate", syncInfo);
window.addEventListener("hashchange", syncInfo);
setInterval(() => { if (infoOpen()) updateClock(); }, 15000);

document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (anyOpen()) closeSheets(); else if (infoOpen()) closeInfo();
});

// ---------- свайп: вліво/вправо — тижні; вправо на «Інформації» — закрити ----------
let x0 = null, y0 = null;
document.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
document.addEventListener("touchend", e => {
  if (x0 === null || anyOpen() || !Auth.ok()) { x0 = null; return; }
  const dx = e.changedTouches[0].clientX - x0;
  const dy = e.changedTouches[0].clientY - y0;
  x0 = null;
  if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;   // це прокрутка, а не свайп
  if (infoOpen()) { if (dx > 0) closeInfo(); return; }
  go(dx < 0 ? 1 : -1);
});

document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });

render("up");
syncInfo();

// офлайн-режим
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
