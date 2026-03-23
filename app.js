(function () {
  const app = window.APP_CONFIG || {};
  const symbols = app.symbols || {};
  const cameras = app.cameras || {};

  const siteTitleEl = document.getElementById("siteTitle");
  const siteSubtitleEl = document.getElementById("siteSubtitle");

  if (siteTitleEl && app.siteTitle) {
    siteTitleEl.textContent = app.siteTitle;
  }

  if (siteSubtitleEl && app.siteSubtitle) {
    siteSubtitleEl.textContent = app.siteSubtitle;
  }

  function injectTradingViewWidget(targetId, scriptSrc, config) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.innerHTML = "";

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptSrc;
    script.async = true;
    script.text = JSON.stringify(config);

    container.appendChild(widget);
    container.appendChild(script);
    target.appendChild(container);
  }

  function renderMarketWidgets() {
    injectTradingViewWidget(
      "goldTicker",
      "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js",
      {
        symbol: symbols.gold || "OANDA:XAUAUD",
        width: "100%",
        isTransparent: true,
        colorTheme: "dark",
        locale: "en"
      }
    );

    injectTradingViewWidget(
      "silverTicker",
      "https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js",
      {
        symbol: symbols.silver || "OANDA:XAGAUD",
        width: "100%",
        isTransparent: true,
        colorTheme: "dark",
        locale: "en"
      }
    );

    injectTradingViewWidget(
      "goldChart",
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
      {
        autosize: true,
        symbol: symbols.gold || "OANDA:XAUAUD",
        interval: "D",
        timezone: "Australia/Perth",
        theme: "dark",
        style: "1",
        locale: "en",
        backgroundColor: "rgba(0, 0, 0, 0)",
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        save_image: false,
        calendar: false,
        support_host: "https://www.tradingview.com"
      }
    );

    injectTradingViewWidget(
      "silverChart",
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js",
      {
        autosize: true,
        symbol: symbols.silver || "OANDA:XAGAUD",
        interval: "D",
        timezone: "Australia/Perth",
        theme: "dark",
        style: "1",
        locale: "en",
        backgroundColor: "rgba(0, 0, 0, 0)",
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        save_image: false,
        calendar: false,
        support_host: "https://www.tradingview.com"
      }
    );
  }

  function buildEmptyCameraCard(message) {
    const card = document.createElement("div");
    card.className = "camera-card";

    const title = document.createElement("h3");
    title.textContent = "No camera configured";

    const wrap = document.createElement("div");
    wrap.className = "camera-frame-wrap";

    const empty = document.createElement("div");
    empty.className = "camera-empty";
    empty.textContent = message;

    wrap.appendChild(empty);
    card.appendChild(title);
    card.appendChild(wrap);

    const meta = document.createElement("div");
    meta.className = "camera-meta";
    meta.textContent = "Add a tested embeddable YouTube live stream or iframe URL in config.js.";
    card.appendChild(meta);

    return card;
  }

  function buildCameraCard(camera) {
    const card = document.createElement("div");
    card.className = "camera-card";

    const title = document.createElement("h3");
    title.textContent = camera.title || "Camera";
    card.appendChild(title);

    const wrap = document.createElement("div");
    wrap.className = "camera-frame-wrap";

    let iframe = null;

    if (camera.type === "youtube" && camera.id) {
      iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${camera.id}?autoplay=0&mute=1&controls=1&rel=0`;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
    } else if (camera.type === "iframe" && camera.src) {
      iframe = document.createElement("iframe");
      iframe.src = camera.src;
      iframe.allowFullscreen = true;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
    }

    if (iframe) {
      wrap.appendChild(iframe);
    } else {
      const empty = document.createElement("div");
      empty.className = "camera-empty";
      empty.textContent = "This camera entry is incomplete. Add a valid source in config.js.";
      wrap.appendChild(empty);
    }

    card.appendChild(wrap);

    const meta = document.createElement("div");
    meta.className = "camera-meta";
    meta.textContent =
      camera.note ||
      "Use only sources that you have manually tested and confirmed can be embedded.";
    card.appendChild(meta);

    return card;
  }

  function renderCameraGroup(targetId, list, fallbackMessage) {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
      target.appendChild(buildEmptyCameraCard(fallbackMessage));
      return;
    }

    list.forEach((camera) => {
      target.appendChild(buildCameraCard(camera));
    });
  }

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
      "No Iran cameras have been configured yet."
    );

    renderCameraGroup(
      "camsUSA",
      cameras.usa,
      "No USA cameras have been configured yet."
    );
  }

  init();
})();
