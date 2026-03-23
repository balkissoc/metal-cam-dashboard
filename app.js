(function () {
  "use strict";

  var app     = window.APP_CONFIG || {};
  var symbols = app.symbols  || {};
  var cameras = app.cameras  || {};

  /* ── Helpers ─────────────────────────────────────────── */
  function byId(id) { return document.getElementById(id); }

  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === "string") el.textContent = text;
    return el;
  }

  /* ── Banner text ─────────────────────────────────────── */
  function setBannerText() {
    var t = byId("siteTitle");
    var s = byId("siteSubtitle");
    if (t && app.siteTitle)    t.textContent = app.siteTitle;
    if (s && app.siteSubtitle) s.textContent = app.siteSubtitle;
  }

  /* ── Dark / Light toggle ─────────────────────────────── */
  function initThemeToggle() {
    var btn  = byId("themeToggle");
    var icon = btn ? btn.querySelector(".theme-icon") : null;
    var html = document.documentElement;

    /* Persist preference across page loads */
    var saved = localStorage.getItem("dashTheme");
    if (saved) {
      html.setAttribute("data-theme", saved);
      if (icon) icon.textContent = saved === "light" ? "🌙" : "☀️";
    }

    if (!btn) return;

    btn.addEventListener("click", function () {
      var current = html.getAttribute("data-theme") || "dark";
      var next    = current === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      localStorage.setItem("dashTheme", next);
      if (icon) icon.textContent = next === "light" ? "🌙" : "☀️";

      /* Re-render TradingView widgets with matching theme */
      reloadTVWidgets(next);
    });
  }

  /* ── TradingView widget injection ────────────────────── */
  /*
    TradingView widget scripts parse their config from the script tag's
    innerHTML. Using .text silently passes no config — widgets render blank.
  */
  function injectTVWidget(targetId, scriptSrc, config) {
    var target = byId(targetId);
    if (!target) return;

    target.innerHTML = "";
    delete target.dataset.tvLoaded;

    var container = createEl("div", "tradingview-widget-container");
    container.style.width  = "100%";
    container.style.height = "100%";

    var widget = createEl("div", "tradingview-widget-container__widget");
    widget.style.width  = "100%";
    widget.style.height = "100%";

    var script = document.createElement("script");
    script.type      = "text/javascript";
    script.src       = scriptSrc;
    script.async     = true;
    script.innerHTML = JSON.stringify(config);

    container.appendChild(widget);
    container.appendChild(script);
    target.appendChild(container);
    target.dataset.tvLoaded = "1";
  }

  /* ── Market + Oil widgets ────────────────────────────── */
  function renderMarketWidgets(theme) {
    theme = theme || (document.documentElement.getAttribute("data-theme") || "dark");

    var overviewBase = {
      chartOnly:        false,
      width:            "100%",
      height:           220,
      locale:           "en",
      colorTheme:       theme,
      autosize:         false,
      showVolume:       false,
      showMA:           false,
      hideDateRanges:   false,
      hideMarketStatus: false,
      hideSymbolLogo:   false,
      scalePosition:    "right",
      scaleMode:        "Normal",
      fontFamily:       "Arial, Helvetica, sans-serif",
      fontSize:         "12",
      noTimeScale:      false,
      valuesTracking:   "1",
      changeMode:       "price-and-percent",
      chartType:        "area",
      lineWidth:        2,
      lineType:         0,
      dateRanges:       ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
      dateFormat:       "dd MMM yyyy"
    };

    /* Gold ticker */
    var goldOverview = Object.assign({}, overviewBase, {
      symbols: [[ symbols.gold || "OANDA:XAUAUD|1D" ]]
    });
    injectTVWidget(
      "goldTicker",
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js",
      goldOverview
    );

    /* Silver ticker */
    var silverOverview = Object.assign({}, overviewBase, {
      symbols: [[ symbols.silver || "OANDA:XAGAUD|1D" ]]
    });
    injectTVWidget(
      "silverTicker",
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js",
      silverOverview
    );

    var chartBase = {
      autosize:            false,
      width:               "100%",
      height:              600,
      interval:            "D",
      timezone:            "Australia/Perth",
      theme:               theme,
      style:               "1",
      locale:              "en",
      backgroundColor:     "rgba(0,0,0,0)",
      withdateranges:      true,
      range:               "12M",
      hide_side_toolbar:   false,
      allow_symbol_change: false,
      save_image:          false,
      calendar:            false,
      support_host:        "https://www.tradingview.com"
    };

    /* Gold chart */
    injectTVWidget(
      "goldChart",
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
      Object.assign({}, chartBase, { symbol: symbols.gold || "OANDA:XAUAUD" })
    );

    /* Silver chart */
    injectTVWidget(
      "silverChart",
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
      Object.assign({}, chartBase, { symbol: symbols.silver || "OANDA:XAGAUD" })
    );

    /* S&P 500 chart */
    injectTVWidget(
      "spxChart",
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
      Object.assign({}, chartBase, {
        symbol:   "SP:SPX",
        timezone: "America/New_York"
      })
    );

    /* Crude Oil (WTI) chart — NYMEX:CL1! is the front-month futures contract */
    injectTVWidget(
      "oilChart",
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
      Object.assign({}, chartBase, {
        symbol:   "NYMEX:CL1!",
        timezone: "America/New_York"
      })
    );
  }

  /* ── Scrolling instrument ticker tape ────────────────── */
  function renderTickerTape(theme) {
    theme = theme || (document.documentElement.getAttribute("data-theme") || "dark");
    var target = byId("newsTicker");
    if (!target) return;
    target.innerHTML = "";

    var container = createEl("div", "tradingview-widget-container");
    var script = document.createElement("script");
    script.type      = "text/javascript";
    script.src       = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async     = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "OANDA:XAUAUD",       description: "Gold AUD" },
        { proName: "OANDA:XAGAUD",       description: "Silver AUD" },
        { proName: "OANDA:AUDUSD",       description: "AUD/USD" },
        { proName: "OANDA:XAUUSD",       description: "Gold USD" },
        { proName: "TVC:USOIL",          description: "Crude Oil" },
        { proName: "ASX:XJO",            description: "ASX 200" },
        { proName: "SP:SPX",             description: "S&P 500" },
        { proName: "NASDAQ:NDX",         description: "NASDAQ 100" },
        { proName: "TVC:DJI",            description: "Dow Jones" },
        { proName: "BITSTAMP:BTCUSD",    description: "Bitcoin" },
        { proName: "ECONOMICS:USIRYY",   description: "US CPI YoY" },
        { proName: "ECONOMICS:AUPGDPQQ", description: "AU GDP" }
      ],
      showSymbolLogo: true,
      isTransparent:  true,
      displayMode:    "adaptive",
      colorTheme:     theme,
      locale:         "en"
    });

    container.appendChild(script);
    target.appendChild(container);
  }

  /* ── News / headlines panel ──────────────────────────── */
  function renderNewsPanel(theme) {
    theme = theme || (document.documentElement.getAttribute("data-theme") || "dark");
    var target = byId("newsPanel");
    if (!target) return;
    target.innerHTML = "";

    var container = createEl("div", "tradingview-widget-container");
    container.style.width  = "100%";
    container.style.height = "100%";

    var widget = createEl("div", "tradingview-widget-container__widget");
    widget.style.width  = "100%";
    widget.style.height = "100%";

    var script = document.createElement("script");
    script.type      = "text/javascript";
    script.src       = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.async     = true;
    script.innerHTML = JSON.stringify({
      feedMode:      "all_symbols",
      isTransparent: true,
      displayMode:   "regular",
      width:         "100%",
      height:        "100%",
      colorTheme:    theme,
      locale:        "en"
    });

    container.appendChild(widget);
    container.appendChild(script);
    target.appendChild(container);
  }

  /* ── Re-render all TV widgets when theme changes ─────── */
  function reloadTVWidgets(theme) {
    renderMarketWidgets(theme);
    renderTickerTape(theme);
    renderNewsPanel(theme);
  }

  /* ── Camera helpers ──────────────────────────────────── */
  function buildSourceLink(cam) {
    if (cam.type === "youtube" && typeof cam.id === "string" && cam.id.trim()) {
      return "https://www.youtube.com/watch?v=" + cam.id.trim();
    }
    if (cam.type === "iframe" && typeof cam.src === "string" && cam.src.trim()) {
      return cam.src.trim();
    }
    return "";
  }

  function buildEmptyCard(message) {
    var card  = createEl("div",  "camera-card");
    var title = createEl("h3",   "",            "No camera configured");
    var wrap  = createEl("div",  "camera-frame-wrap");
    var empty = createEl("div",  "camera-empty", message);
    var meta  = createEl("div",  "camera-meta",  "Add a live YouTube ID or iframe URL in config.js.");
    wrap.appendChild(empty);
    card.appendChild(title);
    card.appendChild(wrap);
    card.appendChild(meta);
    return card;
  }

  /* ── Fullscreen toggle ───────────────────────────────── */
  function makeFullscreenBtn(card, wrap) {
    var btn = createEl("button", "cam-fullscreen-btn", "⛶ Fullscreen");
    btn.title = "Expand / collapse this camera";

    btn.addEventListener("click", function () {
      var isFs = card.classList.toggle("is-fullscreen");
      btn.textContent = isFs ? "✕ Exit" : "⛶ Fullscreen";
      document.body.style.overflow = isFs ? "hidden" : "";

      /* If expanding, scroll the card into view cleanly */
      if (isFs) card.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return btn;
  }

  function buildCameraCard(cam) {
    var card  = createEl("div", "camera-card");
    var wrap  = createEl("div", "camera-frame-wrap");
    var meta  = createEl("div", "camera-meta");

    /* Header row: title + fullscreen button */
    var header = createEl("h3");
    var titleSpan = createEl("span", "", cam.title || "Camera");
    var fsBtn = makeFullscreenBtn(card, wrap);
    header.appendChild(titleSpan);
    header.appendChild(fsBtn);
    card.appendChild(header);

    /* iframe */
    var iframe = null;
    if (cam.type === "youtube" && typeof cam.id === "string" && cam.id.trim()) {
      iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/" + cam.id.trim() + "?autoplay=0&mute=1&controls=1&rel=0";
      iframe.title = cam.title || "Live camera";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen";
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
      wrap.appendChild(createEl("div", "camera-empty", "Incomplete entry — check config.js."));
    }
    card.appendChild(wrap);

    /* Meta: note + YouTube link */
    meta.appendChild(document.createTextNode(cam.note || "Public live stream."));
    var src = buildSourceLink(cam);
    if (src) {
      meta.appendChild(document.createElement("br"));
      var link = document.createElement("a");
      link.href   = src;
      link.target = "_blank";
      link.rel    = "noopener noreferrer";
      link.textContent = cam.type === "youtube" ? "Open on YouTube ↗" : "Open source ↗";
      meta.appendChild(link);
    }
    card.appendChild(meta);

    return card;
  }

  function renderCameraGroup(targetId, list, fallback) {
    var target = byId(targetId);
    if (!target) return;
    target.innerHTML = "";
    if (!Array.isArray(list) || list.length === 0) {
      target.appendChild(buildEmptyCard(fallback));
      return;
    }
    list.forEach(function (cam) { target.appendChild(buildCameraCard(cam)); });
  }

  /* ── Entry point ─────────────────────────────────────── */
  function init() {
    setBannerText();
    initThemeToggle();
    renderTickerTape();
    renderMarketWidgets();
    renderNewsPanel();
    renderCameraGroup("camsAustralia", cameras.australia, "No Asia-Pacific cameras configured.");
    renderCameraGroup("camsIran",      cameras.iran,      "No Iran / Middle East cameras configured.");
    renderCameraGroup("camsUSA",       cameras.usa,       "No USA cameras configured.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
