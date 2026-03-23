(function () {
  "use strict";

  var app     = window.APP_CONFIG || {};
  var symbols = app.symbols  || {};
  var cameras = app.cameras  || {};

  /* ── Banner text ─────────────────────────────────────── */
  var siteTitleEl    = document.getElementById("siteTitle");
  var siteSubtitleEl = document.getElementById("siteSubtitle");
  if (siteTitleEl    && app.siteTitle)    siteTitleEl.textContent    = app.siteTitle;
  if (siteSubtitleEl && app.siteSubtitle) siteSubtitleEl.textContent = app.siteSubtitle;

  /* ── TradingView widget injection ────────────────────── */
  /*
    CRITICAL: script.innerHTML not script.text
    TradingView widget scripts parse config from their own innerHTML.
  */
  function injectTVWidget(targetId, scriptSrc, config) {
    var target = document.getElementById(targetId);
    if (!target || target.dataset.tvLoaded === "1") return;
    target.dataset.tvLoaded = "1";
    target.innerHTML = "";

    var container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.width  = "100%";
    container.style.height = "100%";

    var widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.width  = "100%";
    widget.style.height = "100%";

    var script = document.createElement("script");
    script.type    = "text/javascript";
    script.src     = scriptSrc;
    script.async   = true;
    script.innerHTML = JSON.stringify(config);

    container.appendChild(widget);
    container.appendChild(script);
    target.appendChild(container);
  }

  /* ── Market widgets ──────────────────────────────────── */
  function renderMarketWidgets() {

    /* --- Tickers: use symbol-overview widget (more reliable than single-quote) --- */
    injectTVWidget(
      "goldTicker",
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js",
      {
        symbols:       [["Gold (AUD)", symbols.gold || "OANDA:XAUAUD|1D"]],
        chartOnly:     false,
        width:         "100%",
        height:        "100%",
        locale:        "en",
        colorTheme:    "dark",
        autosize:      true,
        showVolume:    false,
        showMA:        false,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
        scalePosition: "right",
        scaleMode:     "Normal",
        fontFamily:    "Arial, sans-serif",
        fontSize:      "10",
        noTimeScale:   false,
        valuesTracking: "1",
        changeMode:    "price-and-percent",
        chartType:     "area",
        lineWidth:     2,
        lineType:      0,
        dateRanges:    ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"]
      }
    );

    injectTVWidget(
      "silverTicker",
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js",
      {
        symbols:       [["Silver (AUD)", symbols.silver || "OANDA:XAGAUD|1D"]],
        chartOnly:     false,
        width:         "100%",
        height:        "100%",
        locale:        "en",
        colorTheme:    "dark",
        autosize:      true,
        showVolume:    false,
        showMA:        false,
        hideDateRanges: false,
        hideMarketStatus: false,
        hideSymbolLogo: false,
        scalePosition: "right",
        scaleMode:     "Normal",
        fontFamily:    "Arial, sans-serif",
        fontSize:      "10",
        noTimeScale:   false,
        valuesTracking: "1",
        changeMode:    "price-and-percent",
        chartType:     "area",
        lineWidth:     2,
        lineType:      0,
        dateRanges:    ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"]
      }
    );

    /* --- Charts: hardcoded 600px height — most reliable cross-browser approach --- */
    injectTVWidget(
      "goldChart",
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
      {
        autosize:            false,
        width:               "100%",
        height:              600,
        symbol:              symbols.gold || "OANDA:XAUAUD",
        interval:            "D",
        timezone:            "Australia/Perth",
        theme:               "dark",
        style:               "1",
        locale:              "en",
        backgroundColor:     "rgba(0,0,0,0)",
        withdateranges:      true,
        hide_side_toolbar:   false,
        allow_symbol_change: false,
        save_image:          false,
        calendar:            false,
        support_host:        "https://www.tradingview.com"
      }
    );

    injectTVWidget(
      "silverChart",
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
      {
        autosize:            false,
        width:               "100%",
        height:              600,
        symbol:              symbols.silver || "OANDA:XAGAUD",
        interval:            "D",
        timezone:            "Australia/Perth",
        theme:               "dark",
        style:               "1",
        locale:              "en",
        backgroundColor:     "rgba(0,0,0,0)",
        withdateranges:      true,
        hide_side_toolbar:   false,
        allow_symbol_change: false,
        save_image:          false,
        calendar:            false,
        support_host:        "https://www.tradingview.com"
      }
    );
  }

  /* ── Camera helpers ──────────────────────────────────── */
  function buildEmptyCard(message) {
    var card  = document.createElement("div"); card.className = "camera-card";
    var title = document.createElement("h3");  title.textContent = "No camera configured";
    var wrap  = document.createElement("div"); wrap.className = "camera-frame-wrap";
    var empty = document.createElement("div"); empty.className = "camera-empty"; empty.textContent = message;
    var meta  = document.createElement("div"); meta.className = "camera-meta";
    meta.textContent = "Add a YouTube live stream ID in config.js.";
    wrap.appendChild(empty);
    card.appendChild(title);
    card.appendChild(wrap);
    card.appendChild(meta);
    return card;
  }

  function buildCameraCard(cam) {
    var card  = document.createElement("div"); card.className = "camera-card";
    var title = document.createElement("h3");  title.textContent = cam.title || "Camera"; card.appendChild(title);
    var wrap  = document.createElement("div"); wrap.className = "camera-frame-wrap";
    var iframe = null;

    if (cam.type === "youtube" && typeof cam.id === "string" && cam.id.trim()) {
      iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + cam.id.trim() + "?autoplay=0&mute=1&controls=1&rel=0";
      iframe.title = cam.title || "Live camera";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-popups");
    } else if (cam.type === "iframe" && typeof cam.src === "string" && cam.src.trim()) {
      iframe = document.createElement("iframe");
      iframe.src = cam.src.trim();
      iframe.title = cam.title || "Live camera";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation allow-popups");
    }

    if (iframe) {
      wrap.appendChild(iframe);
    } else {
      var empty = document.createElement("div"); empty.className = "camera-empty";
      empty.textContent = "Incomplete entry — check config.js.";
      wrap.appendChild(empty);
    }

    card.appendChild(wrap);
    var meta = document.createElement("div"); meta.className = "camera-meta";
    meta.textContent = cam.note || "Public live stream.";
    card.appendChild(meta);
    return card;
  }

  function renderCameraGroup(targetId, list, fallback) {
    var target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = "";
    if (!Array.isArray(list) || list.length === 0) {
      target.appendChild(buildEmptyCard(fallback)); return;
    }
    list.forEach(function (cam) { target.appendChild(buildCameraCard(cam)); });
  }

  /* ── Entry point ─────────────────────────────────────── */
  function init() {
    renderMarketWidgets();
    renderCameraGroup("camsAustralia", cameras.australia, "No Australia cameras configured.");
    renderCameraGroup("camsIran",      cameras.iran,      "No Iran / Middle East cameras configured.");
    renderCameraGroup("camsUSA",       cameras.usa,       "No USA cameras configured.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
