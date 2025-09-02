// popup.js — load today's stats from chrome.storage

function secondsToHMS(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

async function loadTodayUsage() {
  const d = new Date();
  const key = `usage_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const obj = await chrome.storage.local.get(key);
  const data = obj[key];
  if (!data) {
    document.querySelector("#usageTable tbody").innerHTML =
      "<tr><td colspan=3>No data yet...</td></tr>";
    return;
  }

  let productive = 0, unproductive = 0, neutral = 0;

  const tbody = document.querySelector("#usageTable tbody");
  tbody.innerHTML = "";

  for (const [domain, secs] of Object.entries(data.totals)) {
    const type = data.classes[domain] || "neutral";

    if (type === "productive") productive += secs;
    else if (type === "unproductive") unproductive += secs;
    else neutral += secs;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${domain}</td>
      <td>${secondsToHMS(secs)}</td>
      <td>${type}</td>
    `;
    tbody.appendChild(row);
  }

  document.getElementById("productiveTime").textContent = secondsToHMS(productive);
  document.getElementById("unproductiveTime").textContent = secondsToHMS(unproductive);
  document.getElementById("neutralTime").textContent = secondsToHMS(neutral);
}

// Load on popup open
document.addEventListener("DOMContentLoaded", loadTodayUsage);
