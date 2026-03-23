/*
  app.js — Jimmy's Dashboard
  ──────────────────────────
  Reads APP_CONFIG (set by config.js) and renders:
    • TradingView price tickers  (gold + silver in AUD)
    • TradingView advanced charts (gold + silver)
    • Camera panels (Australia, Iran/Middle East, USA)

  KEY FIXES vs original:
  1. script.innerHTML instead of script.text — TradingView widgets read their
     JSON config from innerHTML. Using .text silently passes no config → blank.
  2. Chart height passed as explicit px read from the rendered container.
     autosize:true requires a pixel height on the parent; padding-top % boxes
     have a real pixel height only after layout, so we read it with
     getBoundingClientRect() after a rAF and pass it in the widget config.
  3. Injection guard (dataset.tvLoaded) prevents duplicate widget scripts.
  4. iframe sandbox attribute on all camera embeds.
  5. Input validation on camera id/src before building iframes.
  6. DOMContentLoaded guard makes the script safe wherever it is placed.
*/

(function () {
  "use strict";

  const app     = window.APP_CONFIG || {};
  const symbols = app.symbols  || {};
  const cameras = app.cameras  || {};

  /* ── Banner text ──────────────────────────────────────── */
  const siteTitleEl    = document.getElementById("siteTitle");
  const siteSubtitleEl = document.getElementById("siteSubtitle");
  if (siteTitleEl    && app.siteTitle)    siteTitleEl.textContent    = app.siteTitle;
  if (siteSubtitleEl && app.siteSubtitle) siteSubtitleEl.textContent = app.siteSubtitle;

  /* ── TradingView widget injection ─────────────────────── */
  /*
    HOW TRADINGVIEW WIDGETS WORK
    The widget JS is appended as a <script src="…"> tag.
    The script reads its config from the innerHTML of that same <script> tag
    (via document.currentScript at parse time).
    WRONG: script.text = JSON.stringify(config)   → widget gets no config
    RIGHT: script.innerHTML = JSON.stringify(config)
  */
  function injectTradingViewWidget(targetId, scriptSrc, config) {
    const target = document.getElementById(targetId);
    if (!target) return;
    if (target.dataset.tvLoaded === "1") return;   // guard: inject once only
    target.dataset.tvLoaded = "1";

    target.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";

    const script = document.createElement("script");
    script.type    = "text/javascript";
    script.src     = scriptSrc;
    script.async   = true;
    script.innerHTML = JSON.stringify(config);   // ← CRITICAL: innerHTML not .text

    container.appendChild(widget);
    container.appendChild(script);
    target.appendChild(container);
  }

  /* ── Market widgets ───────────────────────────────────── */
  /*
    Charts use padding-top % for an intrinsic aspect ratio.
    After layout the container has a real pixel height.
    We read it, then pass it to the widget config.
    If we can't read it yet (0 px) we fall back to 600 px.
  */
  function getHeightPx(el, fallback) {
    if (!el) return fallback;
    var h = el.getBoundingClientRect().height;
    return h > 10 ? Math.round(h) : fallback;
  }

  function renderMarketWidgets() {

    /* -- Tickers -- */
    injectTradingViewWidget(
      "goldTicker",
      "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js",
      {
        symbol:        symbols.gold || "OANDA:XAUAUD",
        width:         "100%",
        isTransparent: true,
        colorTheme:    "dark",
        locale:        "en"
      }
    );

    injectTradingViewWidget(
      "silverTicker",
      "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js",
      {
        symbol:        symbols.silver || "OANDA:XAGAUD",
        width:         "100%",
        isTransparent: true,
        colorTheme:    "dark",
        locale:        "en"
      }
    );

    /* -- Charts --
       We defer one rAF so the browser has finished the first layout pass
       and the padding-top % box has a real pixel height to read.
    */
    requestAnimationFrame(function () {

      var goldEl   = document.getElementById("goldChart");
      var silverEl = document.getElementById("silverChart");
      var goldH    = getHeightPx(goldEl,   600);
      var silverH  = getHeightPx(silverEl, 600);

      injectTradingViewWidget(
        "goldChart",
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
        {
          autosize:            false,   // false so we can supply an explicit height
          width:               "100%",
          height:              goldH,
          symbol:              symbols.gold || "OANDA:XAUAUD",
          interval:            "D",
          timezone:            "Australia/Perth",
          theme:               "dark",
          style:               "1",
          locale:              "en",
          backgroundColor:     "rgba(0, 0, 0, 0)",
          withdateranges:      true,
          hide_side_toolbar:   false,
          allow_symbol_change: false,
          save_image:          false,
          calendar:            false,
          support_host:        "https://www.tradingview.com"
        }
      );

      injectTradingViewWidget(
        "silverChart",
        "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
        {
          autosize:            false,
          width:               "100%",
          height:              silverH,
          symbol:              symbols.silver || "OANDA:XAGAUD",
          interval:            "D",
          timezone:            "Australia/Perth",
          theme:               "dark",
          style:               "1",
          locale:              "en",
          backgroundColor:     "rgba(0, 0, 0, 0)",
          withdateranges:      true,
          hide_side_toolbar:   false,
          allow_symbol_change: false,
          save_image:          false,
          calendar:            false,
          support_host:        "https://www.tradingview.com"
        }
      );

    }); // end rAF
  }

  /* ── Camera helpers ───────────────────────────────────── */

  function buildEmptyCameraCard(message) {
    var card = document.createElement("div");
    card.className = "camera-card";

    var title = document.createElement("h3");
    title.textContent = "No camera configured";

    var wrap = document.createElement("div");
    wrap.className = "camera-frame-wrap";

    var empty = document.createElement("div");
    empty.className = "camera-empty";
    empty.textContent = message;

    wrap.appendChild(empty);
    card.appendChild(title);
    card.appendChild(wrap);

    var meta = document.createElement("div");
    meta.className = "camera-meta";
    meta.textContent = "Add a tested embeddable YouTube live stream or iframe URL in config.js.";
    card.appendChild(meta);

    return card;
  }

  function buildCameraCard(camera) {
    var card = document.createElement("div");
    card.className = "camera-card";

    var title = document.createElement("h3");
    title.textContent = camera.title || "Camera";
    card.appendChild(title);

    var wrap = document.createElement("div");
    wrap.className = "camera-frame-wrap";

    var iframe = null;

    if (camera.type === "youtube" && typeof camera.id === "string" && camera.id.trim()) {
      iframe = document.createElement("iframe");
      iframe.src =
        "https://www.youtube.com/embed/" +
        camera.id.trim() +
        "?autoplay=0&mute=1&controls=1&rel=0";
      iframe.title          = camera.title || "Live camera";
      iframe.allow          = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.loading        = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-presentation allow-popups"
      );

    } else if (camera.type === "iframe" && typeof camera.src === "string" && camera.src.trim()) {
      iframe = document.createElement("iframe");
      iframe.src            = camera.src.trim();
      iframe.title          = camera.title || "Live camera";
      iframe.allowFullscreen = true;
      iframe.loading        = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-presentation allow-popups"
      );
    }

    if (iframe) {
      wrap.appendChild(iframe);
    } else {
      var empty = document.createElement("div");
      empty.className = "camera-empty";
      empty.textContent = "Camera entry is incomplete or has an unrecognised type. Check config.js.";
      wrap.appendChild(empty);
    }

    card.appendChild(wrap);

    var meta = document.createElement("div");
    meta.className = "camera-meta";
    meta.textContent = camera.note || "Public live stream.";
    card.appendChild(meta);

    return card;
  }

  function renderCameraGroup(targetId, list, fallbackMessage) {
    var target = document.getElementById(targetId);
    if (!target) return;
    target.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
      target.appendChild(buildEmptyCameraCard(fallbackMessage));
      return;
    }

    list.forEach(function (camera) {
      target.appendChild(buildCameraCard(camera));
    });
  }

  /* ── Entry point ──────────────────────────────────────── */
  function init() {
    renderMarketWidgets();

    renderCameraGroup(
      "camsAustralia",
      cameras.australia,
      "No Australia cameras have been configured yet."
    );

    renderCameraGroup(
      "camsIran",
      cameras.iran,
      "No Iran / Middle East cameras have been configured yet."
    );

    renderCameraGroup(
      "camsUSA",
      cameras.usa,
      "No USA cameras have been configured yet."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
