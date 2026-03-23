const goldSpotEl = document.getElementById("goldSpot");
const silverSpotEl = document.getElementById("silverSpot");
const lastUpdateEl = document.getElementById("lastUpdate");

let goldSeries;
let silverSeries;

// ===== FORMAT =====
function formatAud(value) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD"
  }).format(value);
}

// ===== CHART =====
function buildChart(containerId, color) {
  const chart = LightweightCharts.createChart(
    document.getElementById(containerId),
    {
      layout: { background: { color: "#121923" }, textColor: "#e8eef6" },
      grid: {
        vertLines: { color: "#1f2a38" },
        horzLines: { color: "#1f2a38" }
      },
      width: document.getElementById(containerId).clientWidth,
      height: 400
    }
  );

  return chart.addAreaSeries({
    lineColor: color,
    topColor: color + "55",
    bottomColor: color + "08"
  });
}

// ===== FETCH DATA (WORKING ENDPOINT) =====
async function fetchPrices() {
  const res = await fetch("https://data-asg.goldprice.org/dbXRates/AUD");
  const data = await res.json();

  const gold = data.items[0].xauPrice;
  const silver = data.items[0].xagPrice;

  return { gold, silver };
}

// ===== FAKE HISTORY (FOR NOW) =====
function generateHistory(price) {
  const now = Math.floor(Date.now() / 1000);
  const data = [];

  for (let i = 50; i > 0; i--) {
    data.push({
      time: now - i * 3600,
      value: price + Math.sin(i / 5) * 20
    });
  }

  return data;
}

// ===== CAMERAS =====
function renderCameras(id, cams) {
  const container = document.getElementById(id);
  container.innerHTML = "";

  cams.forEach(c => {
    container.innerHTML += `
      <div class="camera-card">
        <h3>${c.title}</h3>
        <div class="camera-frame-wrap">
          ${
            c.youtubeId
              ? `<iframe src="https://www.youtube.com/embed/${c.youtubeId}" allowfullscreen></iframe>`
              : `<div style="padding:20px;color:#aaa">Add YouTube ID</div>`
          }
        </div>
      </div>
    `;
  });
}

// ===== INIT =====
async function init() {
  goldSeries = buildChart("goldChart", "#d4af37");
  silverSeries = buildChart("silverChart", "#c0c0c0");

  renderCameras("camsAustralia", window.APP_CONFIG.cameras.australia);
  renderCameras("camsIran", window.APP_CONFIG.cameras.iran);
  renderCameras("camsUSA", window.APP_CONFIG.cameras.usa);

  try {
    const { gold, silver } = await fetchPrices();

    goldSpotEl.textContent = formatAud(gold);
    silverSpotEl.textContent = formatAud(silver);
    lastUpdateEl.textContent = new Date().toLocaleTimeString();

    goldSeries.setData(generateHistory(gold));
    silverSeries.setData(generateHistory(silver));

  } catch (e) {
    console.error(e);
    goldSpotEl.textContent = "Error";
    silverSpotEl.textContent = "Error";
    lastUpdateEl.textContent = "Check console";
  }
}

init();
