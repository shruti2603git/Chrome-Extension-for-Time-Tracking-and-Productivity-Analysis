// background.js — Time Tracker for Manifest V3

const TICK_MS = 5000;            // update every 5 sec
const IDLE_THRESHOLD_SEC = 60;   // 1 min idle timeout
const STORAGE_PREFIX = "usage_";

let userIdle = false;
let lastTick = Date.now();

// classification map
const SITE_CLASSES = {
  "github.com": "productive",
  "leetcode.com": "productive",
  "stackoverflow.com": "productive",
  "youtube.com": "unproductive",
  "instagram.com": "unproductive",
  "facebook.com": "unproductive",
  "x.com": "unproductive",
  "linkedin.com": "neutral"
};

// --- Helpers ---
function todayKey() {
  const d = new Date();
  return `${STORAGE_PREFIX}${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function extractDomain(url) {
  try {
    const u = new URL(url);
    if (u.protocol.startsWith("chrome")) return null; // ignore chrome:// and extension://
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function addSeconds(domain, secs) {
  if (!domain || secs <= 0) return;
  const key = todayKey();
  const data = await chrome.storage.local.get(key);
  const day = data[key] || { totals: {}, classes: {} };

  day.totals[domain] = (day.totals[domain] || 0) + secs;
  if (!day.classes[domain]) {
    day.classes[domain] = SITE_CLASSES[domain] || "neutral";
  }

  await chrome.storage.local.set({ [key]: day });
}

// --- Core tracking ---
async function trackActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.url) return;

  const domain = extractDomain(tab.url);
  if (!domain) return;

  const now = Date.now();
  const dtSec = Math.round((now - lastTick) / 1000);
  lastTick = now;

  if (!userIdle) {
    await addSeconds(domain, dtSec);
  }
}

// --- Setup recurring timer ---
chrome.alarms.create("tick", { periodInMinutes: TICK_MS / 60000 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "tick") {
    trackActiveTab();
  }
});

// --- Idle detection ---
chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SEC);
chrome.idle.onStateChanged.addListener((state) => {
  userIdle = state !== "active"; // active → false, idle/locked → true
});
