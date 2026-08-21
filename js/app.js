// ==========================================================
// app.js — ຕົວລະບົບຫຼັກ
// ==========================================================

// ❗ ວາງ URL Apps Script Web App ຂອງເຈົ້າໃສ່ບ່ອນນີ້ ຫຼັງ deploy
const API_URL = "https://script.google.com/macros/s/AKfycbwcurg1ad1aWDJ3kdtsB0WkIxKoGHoIkhKdt9GVF1XNoS7B2WT5Grs8cmH3f803bvdbXg/exec";

const THEME_COLORS = { purple: "#D9C6F0", lightblue: "#BEE1F5", orange: "#FFD8A8" };

let STATE = {
  user: localStorage.getItem("appUser") || null,
  lang: localStorage.getItem("appLang") || "lo",
  theme: localStorage.getItem("appTheme") || "purple",
  bg: localStorage.getItem("appBg") || "",
  photos: [],
};

// ---------- helpers ----------
const $ = (id) => document.getElementById(id);

// ---------- ສຽງ (ສ້າງດ້ວຍ Web Audio API — ບໍ່ຕ້ອງໃຊ້ໄຟລ໌ mp3) ----------
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playClick() {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 700;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}
function playNotify() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.25);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.3);
  });
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

// ---------- ໄອຄອນຕາມໂທນສີ (3 ຊຸດ: purple / lightblue / orange) ----------
function iconBase() { return `assets/icons-${STATE.theme}`; }
function setIcons(container = document) {
  container.querySelectorAll("img[data-icon]").forEach((img) => {
    img.src = `${iconBase()}/${img.dataset.icon}`;
  });
}

function applyTheme() {
  document.body.dataset.theme = STATE.theme;
  if (STATE.bg) document.documentElement.style.setProperty("--bg-image", `url(${STATE.bg})`);
  setIcons();
}

// ---------- API ----------
async function apiGet(action) {
  const res = await fetch(`${API_URL}?action=${action}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
async function apiPost(body) {
  const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data && data.error) throw new Error(data.error);
  return data;
}

async function loadEverything() {
  try {
    const data = await apiGet("all"); // { photos: [...], settings: {song,color,lang} }
    STATE.photos = data.photos || [];
    if (data.settings) {
      STATE.theme = data.settings.color || STATE.theme;
      STATE.lang = data.settings.lang || STATE.lang;
      localStorage.setItem("appLang", STATE.lang);
      $("bg-audio").src = `assets/${data.settings.song || "song-1"}.mp3`;
      $("setting-song").value = data.settings.song || "song-1";
      $("setting-color").value = STATE.theme;
      $("setting-lang").value = STATE.lang;
    }
    applyTheme();
    applyI18n();
    renderFeed();
  } catch (e) {
    console.error("ໂຫລດຂໍ້ມູນບໍ່ສຳເລັດ", e);
  }
}

// ---------- render feed ----------
function photoCardHTML(p) {
  const likedByMe = STATE.user === "mond" ? p.Like_Mond : p.Like_Som;
  const savedByMe = STATE.user === "mond" ? p.Saved_Mond : p.Saved_Som;
  const caption = escapeHTML(p.Caption);
  const captionHTML = caption ? `<div class="photo-caption">${caption}</div>` : "";
  return `
    <div class="photo-card" data-id="${p.ID}">
      <div class="photo-card-media">
        <img src="${p.Drive_URL}" alt="${caption}" loading="lazy" />
        <div class="photo-actions">
          <button class="btn-like" data-id="${p.ID}">
            <img src="${iconBase()}/icon-heart-${likedByMe ? "filled" : "outline"}.png" />
          </button>
          <button class="btn-save" data-id="${p.ID}">
            <img src="${iconBase()}/icon-bookmark-${savedByMe ? "filled" : "outline"}.png" />
          </button>
        </div>
      </div>
      ${captionHTML}
    </div>`;
}

function renderFeed() {
  $("masonry").innerHTML = STATE.photos.map(photoCardHTML).join("");
}

function bindFeedEvents(container) {
  container.querySelectorAll(".photo-card img").forEach((img) => {
    img.addEventListener("click", () => openModal(img.closest(".photo-card").dataset.id));
  });
  container.querySelectorAll(".btn-like").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); toggleLike(b.dataset.id); }));
  container.querySelectorAll(".btn-save").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); toggleSave(b.dataset.id); }));
}

// ---------- like / save ----------
async function toggleLike(id) {
  playClick();
  const p = STATE.photos.find((x) => x.ID == id);
  const field = STATE.user === "mond" ? "Like_Mond" : "Like_Som";
  p[field] = !p[field];
  renderAll();
  await apiPost({ action: "like", id, user: STATE.user, value: p[field] });
}
async function toggleSave(id) {
  playClick();
  const p = STATE.photos.find((x) => x.ID == id);
  const field = STATE.user === "mond" ? "Saved_Mond" : "Saved_Som";
  p[field] = !p[field];
  renderAll();
  await apiPost({ action: "save", id, user: STATE.user, value: p[field] });
}

function renderAll() {
  renderFeed();
  bindFeedEvents($("masonry"));
  renderMemories();
  renderSaved();
}

// ---------- modal ----------
let modalId = null;
function openModal(id) {
  const p = STATE.photos.find((x) => x.ID == id);
  if (!p) return;
  modalId = id;
  $("modal-img").src = p.Drive_URL;
  $("modal-caption").textContent = p.Caption || "";
  $("modal-detail").textContent = p.Detail || "";
  $("photo-modal").classList.remove("hidden");
}
$("modal-close").addEventListener("click", () => {
  $("photo-modal").classList.add("hidden");
  $("modal-edit-form").classList.add("hidden");
  $("modal-caption").classList.remove("hidden");
  $("modal-detail").classList.remove("hidden");
  $("modal-edit-confirm").classList.add("hidden");
});
$("modal-save").addEventListener("click", () => { if (modalId) toggleSave(modalId); });
$("modal-edit").addEventListener("click", () => {
  const p = STATE.photos.find((x) => x.ID == modalId);
  if (!p) return;
  $("edit-caption").value = p.Caption || "";
  $("edit-detail").value = p.Detail || "";
  $("modal-caption").classList.add("hidden");
  $("modal-detail").classList.add("hidden");
  $("modal-edit-form").classList.remove("hidden");
  $("modal-edit").classList.add("hidden");
  $("modal-edit-confirm").classList.remove("hidden");
});
$("modal-edit-confirm").addEventListener("click", async () => {
  const p = STATE.photos.find((x) => x.ID == modalId);
  if (!p) return;
  p.Caption = $("edit-caption").value;
  p.Detail = $("edit-detail").value;
  $("modal-caption").textContent = p.Caption;
  $("modal-detail").textContent = p.Detail;
  $("modal-edit-form").classList.add("hidden");
  $("modal-caption").classList.remove("hidden");
  $("modal-detail").classList.remove("hidden");
  $("modal-edit").classList.remove("hidden");
  $("modal-edit-confirm").classList.add("hidden");
  renderAll();
  await apiPost({ action: "edit", id: modalId, caption: p.Caption, detail: p.Detail });
});

// ---------- memories (monthly anniversary) ----------
function renderMemories() {
  const today = new Date();
  const dom = today.getDate();
  const matches = STATE.photos.filter((p) => {
    const d = new Date(p.Upload_Date);
    const sameDay = d.getDate() === dom;
    const sameMonthAndYear = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    // ນັບເປັນ "ຄວາມຊົງຈຳ" ຖ້າວັນທີ່ກົງກັນ ແລະ ບໍ່ແມ່ນມື້ອັບໂຫລດເອງ (ບໍ່ແມ່ນເດືອນ+ປີດຽວກັນ)
    // ຮູບທີ່ຄົບຮອບປີພໍດີ (12, 24, 36 ເດືອນ...) ຈະຢູ່ເດືອນດຽວກັນແຕ່ຄົນລະປີ — ຕ້ອງນັບລວມນຳ
    return sameDay && !sameMonthAndYear;
  });
  if (!matches.length) {
    $("memories-list").innerHTML = `<p>${t("memories_empty")}</p>`;
    return;
  }
  $("memories-list").innerHTML = matches.map((p) => {
    const d = new Date(p.Upload_Date);
    const months = (today.getFullYear() - d.getFullYear()) * 12 + (today.getMonth() - d.getMonth());
    return `<div class="memory-badge">${t("memories_month", months)}</div>${photoCardHTML(p)}`;
  }).join("");
}

// ---------- saved / liked ----------
function renderSaved() {
  const field = STATE.user === "mond" ? "Saved_Mond" : "Saved_Som";
  const list = STATE.photos.filter((p) => p[field]);
  $("saved-list").innerHTML = `<div style="column-count:2;column-gap:10px">${list.map(photoCardHTML).join("")}</div>`;
  bindFeedEvents($("saved-list"));
}
function renderLiked(user) {
  const field = user === "mond" ? "Like_Mond" : "Like_Som";
  const list = STATE.photos.filter((p) => p[field]);
  $("liked-heading").textContent = `${t("nav_liked")} ${user}`;
  $("liked-list").innerHTML = `<div style="column-count:2;column-gap:10px">${list.map(photoCardHTML).join("")}</div>`;
  bindFeedEvents($("liked-list"));
}

// ---------- search ----------
// Levenshtein distance ລະຫວ່າງ 2 ຄຳ — ໃຊ້ວັດ "ຄວາມໃກ້ຄຽງ"
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ກົງກັນ (substring) ຫຼື ໃກ້ຄຽງ (edit-distance ນ້ອຍ) ຖືວ່າ match
function fuzzyMatch(text, query) {
  text = (text || "").toLowerCase().trim();
  query = query.toLowerCase().trim();
  if (!text || !query) return false;
  if (text.includes(query)) return true;
  const words = text.split(/\s+/);
  const threshold = query.length <= 4 ? 1 : 2;
  return words.some((w) => levenshtein(w, query) <= threshold);
}
$("search-input").addEventListener("input", (e) => {
  const q = e.target.value.trim();
  if (!q) { $("search-masonry").innerHTML = ""; return; }
  const results = STATE.photos.filter((p) => fuzzyMatch(p.Caption, q) || fuzzyMatch(p.Detail, q));
  $("search-masonry").innerHTML = results.map(photoCardHTML).join("");
  bindFeedEvents($("search-masonry"));
});

// ---------- navigation ----------
const VIEWS = ["home", "memories", "saved", "liked", "search", "upload", "settings"];
function showView(name) {
  VIEWS.forEach((v) => $(`view-${v}`).classList.toggle("hidden", v !== name));
  if (name === "memories") renderMemories();
  if (name === "saved") renderSaved();
}
$("btn-menu").addEventListener("click", () => { $("drawer").classList.remove("hidden"); $("drawer-backdrop").classList.remove("hidden"); });
$("drawer-backdrop").addEventListener("click", closeDrawer);
function closeDrawer() { $("drawer").classList.add("hidden"); $("drawer-backdrop").classList.add("hidden"); }

document.querySelectorAll(".drawer-item[data-nav]").forEach((item) => {
  item.addEventListener("click", () => {
    closeDrawer();
    const nav = item.dataset.nav;
    if (nav === "liked-mond") { showView("liked"); renderLiked("mond"); }
    else if (nav === "liked-som") { showView("liked"); renderLiked("som"); }
    else showView(nav);
  });
});
$("drawer-logout").addEventListener("click", () => { localStorage.removeItem("appUser"); location.reload(); });

$("btn-home").addEventListener("click", () => { closeDrawer(); showView("home"); });
$("btn-upload").addEventListener("click", () => showView("upload"));
$("btn-search").addEventListener("click", () => showView("search"));
$("btn-settings").addEventListener("click", () => showView("settings"));
document.getElementById("app").addEventListener("click", (e) => {
  // clicking topbar-title or empty feed area returns home
});
$("topbar-title").addEventListener("click", () => showView("home"));

// ---------- upload ----------
let uploadDataUrl = null;
$("btn-camera").addEventListener("click", () => { $("file-input").capture = "environment"; $("file-input").click(); });
$("btn-gallery").addEventListener("click", () => { $("file-input").removeAttribute("capture"); $("file-input").click(); });
$("file-input").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    uploadDataUrl = reader.result;
    $("upload-preview").src = uploadDataUrl;
    $("upload-preview").style.display = "block";
  };
  reader.readAsDataURL(file);
});
$("upload-submit-btn").addEventListener("click", async () => {
  if (!uploadDataUrl) { alert(t("select_image_first")); return; }
  playClick();
  const btn = $("upload-submit-btn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = t("uploading");
  try {
    await apiPost({
      action: "upload",
      imageData: uploadDataUrl,
      caption: $("upload-caption").value,
      detail: $("upload-detail").value,
      uploader: $("upload-uploader").value,
    });
    playNotify();
    uploadDataUrl = null;
    $("upload-preview").style.display = "none";
    $("upload-caption").value = "";
    $("upload-detail").value = "";
    await loadEverything();
    showView("home");
  } catch (err) {
    console.error("ອັບໂຫລດຜິດພາດ:", err);
    alert(t("upload_failed") + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
});

// ---------- settings ----------
$("setting-song").addEventListener("change", async (e) => {
  $("bg-audio").src = `assets/${e.target.value}.mp3`;
  $("bg-audio").play().catch(() => {});
  await apiPost({ action: "settings", key: "CurrentSong", value: e.target.value });
});
$("setting-color").addEventListener("change", async (e) => {
  STATE.theme = e.target.value;
  localStorage.setItem("appTheme", STATE.theme);
  applyTheme();
  renderAll();
  try {
    await apiPost({ action: "settings", key: "CurrentColor", value: e.target.value });
  } catch (err) {
    console.error(err);
  }
});
$("setting-lang").addEventListener("change", async (e) => {
  STATE.lang = e.target.value;
  localStorage.setItem("appLang", STATE.lang);
  applyI18n();
  await apiPost({ action: "settings", key: "CurrentLanguage", value: e.target.value });
});
document.querySelectorAll(".bg-choices img").forEach((img) => {
  img.addEventListener("click", () => {
    STATE.bg = img.dataset.bg;
    localStorage.setItem("appBg", STATE.bg);
    applyTheme();
    document.querySelectorAll(".bg-choices img").forEach((i) => i.classList.remove("selected"));
    img.classList.add("selected");
  });
});

// ---------- login ----------
$("login-lang-btn").addEventListener("click", () => {
  const order = ["lo", "th", "en"];
  const next = order[(order.indexOf(STATE.lang) + 1) % order.length];
  STATE.lang = next;
  localStorage.setItem("appLang", next);
  $("login-lang-btn").textContent = next.toUpperCase();
  applyI18n();
});
$("login-btn").addEventListener("click", () => {
  STATE.user = $("login-user-select").value;
  localStorage.setItem("appUser", STATE.user);
  try { $("bg-audio").play().catch(() => {}); } catch (e) { console.warn("ຂ້າມການປົດລັອກສຽງ:", e); }
  startApp();
});

// ---------- boot ----------
function startApp() {
  $("view-login").classList.add("hidden");
  $("app").classList.remove("hidden");
  applyI18n();
  applyTheme();
  loadEverything().then(() => bindFeedEvents($("masonry")));
}

if (STATE.user) {
  startApp();
} else {
  applyI18n();
}
