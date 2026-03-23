const REFRESH_MS = window.APP_CONFIG?.refreshMs ?? 60000;
const SITE_TITLE = window.APP_CONFIG?.siteTitle ?? "Jimmy's Dashboard";
const SITE_SUBTITLE =
  window.APP_CONFIG?.siteSubtitle ??
  "Gold and silver in AUD, with live cameras in Australia, Iran and the USA";

const goldSpotEl = document.getElementById("goldSpot");
const silverSpotEl = document.getElementById("silverSpot");
const lastUpdateEl = document.getElementById("lastUpdate");

const siteTitleEl = document.getElementById("siteTitle");
const siteSubtitleEl = document.getElementById("siteSubtitle");

let goldSeries = null;
let silverSeries = null;

function setBanner() {
  if (siteTitleEl) siteTitleEl.textContent = SITE_TITLE;
  if (siteSubtitleEl) siteSubtitleEl.textContent = SITE_SUBTITLE;
}

function formatAud(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2
  }).format(Number(value));
}

function formatDateTime(dateValue) {
  const d = new Date(dateValue);
  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function setTopStatusError(message = "Error") {
  if (goldSpotEl) goldSpotEl.textContent = message;
  if (silverSpotEl) silverSpotEl.textContent = message;
  if (lastUpdateEl) lastUpdateEl.textContent = "Check console";
}

function buildChart(containerId, lineColour) {
  const container = document.getElementById(containerId);

  const chart = LightweightCharts.createChart(container, {
    layout: {
      background: { color: "#121923" },
      textColor: "#e8eef6"
    },
    grid: {
      vertLines: { color: "#1f2a38" },
      horzLines: { color: "#1f2a38" }
    },
    rightPriceScale: {
      borderColor: "#253142"
    },
    timeScale: {
      borderColor: "#253142",
      timeVisible: true,
      secondsVisible: false
    },
    width: container.clientWidth,
    height: 420
  });

  const series = chart.addAreaSeries({
    lineColor: lineColour,
    topColor: `${lineColour}55`,
    bottomColor: `${lineColour}08`,
    lineWidth: 2,
    priceFormat: {
      type: "price",
      precision: 2,
      minMove: 0.01
    }
  });

  window.addEventListener("resize", () => {
    chart.applyOptions({ width: container.clientWidth });
  });

  return { chart, series };
}

async function fetchMetalsSnapshot() {
  const url = "https://data-asg.goldprice.org/dbXRates/AUD";
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Snapshot fetch failed with status ${res.status}`);
  }

  const data = await res.json();

  if (!data?.items?.length) {
    throw new Error("Unexpected snapshot format");
  }

  const audItem = data.items.find(
    item =>
      String(item?.curr || "").toUpperCase() === "AUD" ||
      String(item?.currency || "").toUpperCase() === "AUD"
  ) || data.items[0];

  const gold = Number(audItem.xauPrice);
  const silver = Number(audItem.xagPrice);

  if (Number.isNaN(gold) || Number.isNaN(silver)) {
    throw new Error("Gold or silver price missing in snapshot");
  }

  return {
    gold,
    silver,
    raw: audItem
  };
}

function makeSyntheticSeries(currentPrice, points = 72, minutesStep = 20) {
  const now = Date.now();
  const data = [];

  for (let i = points - 1; i >= 0; i -= 1) {
    const timestamp = Math.floor((now - i * minutesStep * 60 * 1000) / 1000);

    const waveOne = Math.sin(i / 5) * 0.0065;
    const waveTwo = Math.cos(i / 9) * 0.0045;
    const drift = ((points - i) / points) * 0.0025;
    const value = currentPrice * (1 - waveOne - waveTwo + drift);

    data.push({
      time: timestamp,
      value: Number(value.toFixed(2))
    });
  }

  if (data.length > 0) {
    data[data.length - 1].value = Number(currentPrice.toFixed(2));
  }

  return data;
}

function updateTopStatus(gold, silver) {
  if (goldSpotEl) goldSpotEl.textContent = formatAud(gold);
  if (silverSpotEl) silverSpotEl.textContent = formatAud(silver);
  if (lastUpdateEl) lastUpdateEl.textContent = formatDateTime(new Date());
}

function createCameraCard(cam) {
  const card = document.createElement("div");
  card.className = "camera-card";

  const title = document.createElement("h3");
  title.textContent = cam.title || "Camera";
  card.appendChild(title);

  const wrap = document.createElement("div");
  wrap.className = "camera-frame-wrap";

  if (cam.youtubeId && String(cam.youtubeId).trim() !== "") {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${cam.youtubeId}?autoplay=0&mute=1&controls=1&rel=0`;
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    wrap.appendChild(iframe);
  } else {
    const placeholder = document.createElement("div");
    placeholder.style.position = "absolute";
    placeholder.style.inset = "0";
    placeholder.style.display = "flex";
    placeholder.style.alignItems = "center";
    placeholder.style.justifyContent = "center";
    placeholder.style.padding = "16px";
    placeholder.style.textAlign = "center";
    placeholder.style.color = "#9fb0c4";
    placeholder.textContent = "Add a YouTube live stream ID in config.js";
    wrap.appendChild(placeholder);
  }

  card.appendChild(wrap);
  return card;
}

function renderCameras(targetId, cameraList) {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = "";

  if (!Array.isArray(cameraList) || cameraList.length === 0) {
    const empty = document.createElement("div");
    empty.style.padding = "16px";
    empty.style.color = "#9fb0c4";
    empty.textContent = "No cameras configured.";
    target.appendChild(empty);
    return;
  }

  cameraList.forEach(cam => {
    target.appendChild(createCameraCard(cam));
  });
}

async function loadAndRenderData() {
  const snapshot = await fetchMetalsSnapshot();

  updateTopStatus(snapshot.gold, snapshot.silver);

  if (goldSeries) {
    goldSeries.setData(makeSyntheticSeries(snapshot.gold));
  }

  if (silverSeries) {
    silverSeries.setData(makeSyntheticSeries(snapshot.silver));
  }
}

async function init() {
  setBanner();

  const goldChart = buildChart("goldChart", "#d4af37");
  const silverChart = buildChart("silverChart", "#c0c0c0");

  goldSeries = goldChart.series;
  silverSeries = silverChart.series;

  renderCameras("camsAustralia", window.APP_CONFIG?.cameras?.australia ?? []);
  renderCameras("camsIran", window.APP_CONFIG?.cameras?.iran ?? []);
  renderCameras("camsUSA", window.APP_CONFIG?.cameras?.usa ?? []);

  await loadAndRenderData();

  setInterval(async () => {
    try {
      await loadAndRenderData();
    } catch (error) {
      console.error(error);
    }
  }, REFRESH_MS);
}

init().catch(error => {
  console.error(error);
  setTopStatusError();
});
