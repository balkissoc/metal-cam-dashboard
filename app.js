const GOLD_SYMBOL = "XAU";
const SILVER_SYMBOL = "XAG";
const CURRENCY = "AUD";

const goldSpotEl = document.getElementById("goldSpot");
const silverSpotEl = document.getElementById("silverSpot");
const lastUpdateEl = document.getElementById("lastUpdate");

let goldSeries;
let silverSeries;

function formatAud(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2
  }).format(Number(value));
}

function formatDateTime(value) {
  const d = new Date(value);
  return d.toLocaleString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
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
      timeVisible: true
    },
    width: container.clientWidth,
    height: 420
  });

  const series = chart.addAreaSeries({
    lineColor: lineColour,
    topColor: lineColour + "55",
    bottomColor: lineColour + "08",
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

async function fetchCurrentPrice(symbol) {
  const url = `https://api.gold-api.com/price/${symbol}/AUD`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Current price fetch failed for ${symbol}`);
  return res.json();
}

async function fetchPriceHistory(symbol) {
  const url = `https://api.gold-api.com/price-history/${symbol}/AUD`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`History fetch failed for ${symbol}`);
  return res.json();
}

function normaliseHistory(historyResponse) {
  if (!historyResponse || !Array.isArray(historyResponse.data)) return [];

  return historyResponse.data
    .map(item => ({
      time: item.date,
      value: Number(item.close)
    }))
    .filter(item => !Number.isNaN(item.value));
}

function renderCameras(targetId, cameraList) {
  const target = document.getElementById(targetId);
  target.innerHTML = "";

  cameraList.forEach(cam => {
    const card = document.createElement("div");
    card.className = "camera-card";

    card.innerHTML = `
      <h3>${cam.title}</h3>
      <div class="camera-frame-wrap">
        <iframe
          src="https://www.youtube.com/embed/${cam.youtubeId}?autoplay=0&mute=1&controls=1&rel=0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
      </div>
    `;

    target.appendChild(card);
  });
}

async function loadSpotPrices() {
  const [gold, silver] = await Promise.all([
    fetchCurrentPrice(GOLD_SYMBOL),
    fetchCurrentPrice(SILVER_SYMBOL)
  ]);

  goldSpotEl.textContent = formatAud(gold.price);
  silverSpotEl.textContent = formatAud(silver.price);
  lastUpdateEl.textContent = formatDateTime(new Date());

  return { gold, silver };
}

async function loadHistory() {
  const [goldHistory, silverHistory] = await Promise.all([
    fetchPriceHistory(GOLD_SYMBOL),
    fetchPriceHistory(SILVER_SYMBOL)
  ]);

  goldSeries.setData(normaliseHistory(goldHistory));
  silverSeries.setData(normaliseHistory(silverHistory));
}

async function init() {
  const goldChart = buildChart("goldChart", "#d4af37");
  const silverChart = buildChart("silverChart", "#c0c0c0");

  goldSeries = goldChart.series;
  silverSeries = silverChart.series;

  renderCameras("camsAustralia", window.APP_CONFIG.cameras.australia);
  renderCameras("camsIran", window.APP_CONFIG.cameras.iran);
  renderCameras("camsUSA", window.APP_CONFIG.cameras.usa);

  await loadHistory();
  await loadSpotPrices();

  setInterval(async () => {
    try {
      await loadSpotPrices();
    } catch (err) {
      console.error(err);
    }
  }, window.APP_CONFIG.refreshMs);
}

init().catch(err => {
  console.error(err);
  goldSpotEl.textContent = "Error";
  silverSpotEl.textContent = "Error";
  lastUpdateEl.textContent = "Check console";
});
