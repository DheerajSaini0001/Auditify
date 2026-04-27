// ═══════════════════════════════════════════════════════════════
//  Stealth Fingerprint Evasion — injected via evaluateOnNewDocument
//  Covers all 10 categories of fingerprint leaks
// ═══════════════════════════════════════════════════════════════

/**
 * Returns the JS string to inject into every new document context.
 * @param {object} opts
 * @param {string} opts.platform   — "Win32" | "MacIntel"
 * @param {string} opts.userAgent  — full UA string
 * @param {string} opts.vendor     — "Google Inc."
 * @param {number} opts.maxTouchPoints — 0 desktop, 5 mobile
 * @param {number} opts.deviceMemory   — 4 | 8
 * @param {number} opts.hardwareConcurrency — 4 | 8
 */
export function buildEvasionScript(opts = {}) {
  const {
    platform = "Win32",
    userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    vendor = "Google Inc.",
    maxTouchPoints = 0,
    deviceMemory = 8,
    hardwareConcurrency = 8,
  } = opts;

  // We return a string that will be evaluated in the page context
  return `
(function() {
  'use strict';

  // ─── 1. NAVIGATOR CORE PROPERTIES ────────────────────────────
  const navProps = {
    webdriver:           { get: () => undefined },
    platform:            { get: () => "${platform}" },
    vendor:              { get: () => "${vendor}" },
    maxTouchPoints:      { get: () => ${maxTouchPoints} },
    hardwareConcurrency: { get: () => ${hardwareConcurrency} },
    deviceMemory:        { get: () => ${deviceMemory} },
    appVersion:          { get: () => "${userAgent.replace("Mozilla/", "")}" },
    userAgent:           { get: () => "${userAgent}" },
    language:            { get: () => "en-US" },
    languages:           { get: () => Object.freeze(["en-US", "en"]) },
  };
  for (const [key, desc] of Object.entries(navProps)) {
    try { Object.defineProperty(Navigator.prototype, key, { ...desc, configurable: true }); } catch(e) {}
  }

  // Delete webdriver from the instance too
  try { delete Navigator.prototype.webdriver; } catch(e) {}
  try {
    Object.defineProperty(Navigator.prototype, 'webdriver', {
      get: () => undefined,
      configurable: true
    });
  } catch(e) {}

  // ─── 2. NAVIGATOR.CONNECTION ─────────────────────────────────
  try {
    if (!navigator.connection) {
      Object.defineProperty(Navigator.prototype, 'connection', {
        get: () => ({
          effectiveType: "4g",
          rtt: 50,
          downlink: 10,
          saveData: false,
          onchange: null,
          addEventListener: function(){},
          removeEventListener: function(){},
          dispatchEvent: function(){ return true; }
        }),
        configurable: true
      });
    }
  } catch(e) {}

  // ─── 3. PLUGINS & MIMETYPES ──────────────────────────────────
  try {
    const pluginData = [
      { name: "PDF Viewer",              filename: "internal-pdf-viewer", description: "Portable Document Format", mimeType: "application/pdf" },
      { name: "Chrome PDF Viewer",       filename: "internal-pdf-viewer", description: "Portable Document Format", mimeType: "application/pdf" },
      { name: "Chromium PDF Viewer",     filename: "internal-pdf-viewer", description: "Portable Document Format", mimeType: "application/pdf" },
      { name: "Microsoft Edge PDF Viewer",filename:"internal-pdf-viewer", description: "Portable Document Format", mimeType: "application/pdf" },
      { name: "WebKit built-in PDF",     filename: "internal-pdf-viewer", description: "Portable Document Format", mimeType: "application/pdf" },
    ];

    const mimeTypeArray = [];
    const pluginArray = [];

    for (const pd of pluginData) {
      const mt = Object.create(MimeType.prototype);
      Object.defineProperties(mt, {
        type:        { get: () => pd.mimeType },
        suffixes:    { get: () => "pdf" },
        description: { get: () => pd.description },
        enabledPlugin: { get: () => plugin },
      });

      const plugin = Object.create(Plugin.prototype);
      Object.defineProperties(plugin, {
        name:        { get: () => pd.name },
        filename:    { get: () => pd.filename },
        description: { get: () => pd.description },
        length:      { get: () => 1 },
        0:           { get: () => mt },
      });
      plugin[Symbol.iterator] = function*() { yield mt; };

      pluginArray.push(plugin);
      mimeTypeArray.push(mt);
    }

    Object.defineProperty(Navigator.prototype, 'plugins', {
      get: () => {
        const list = Object.create(PluginArray.prototype);
        for (let i = 0; i < pluginArray.length; i++) {
          Object.defineProperty(list, i, { get: () => pluginArray[i], enumerable: true });
        }
        Object.defineProperty(list, 'length', { get: () => pluginArray.length });
        list[Symbol.iterator] = function*() { for (const p of pluginArray) yield p; };
        list.item = (i) => pluginArray[i] || null;
        list.namedItem = (n) => pluginArray.find(p => p.name === n) || null;
        list.refresh = () => {};
        return list;
      },
      configurable: true
    });

    Object.defineProperty(Navigator.prototype, 'mimeTypes', {
      get: () => {
        const list = Object.create(MimeTypeArray.prototype);
        for (let i = 0; i < mimeTypeArray.length; i++) {
          Object.defineProperty(list, i, { get: () => mimeTypeArray[i], enumerable: true });
        }
        Object.defineProperty(list, 'length', { get: () => mimeTypeArray.length });
        list[Symbol.iterator] = function*() { for (const m of mimeTypeArray) yield m; };
        list.item = (i) => mimeTypeArray[i] || null;
        list.namedItem = (n) => mimeTypeArray.find(m => m.type === n) || null;
        return list;
      },
      configurable: true
    });
  } catch(e) {}

  // ─── 4. WEBGL FINGERPRINT ────────────────────────────────────
  try {
    const getParameterOrig = WebGLRenderingContext.prototype.getParameter;
    const getParameter2Orig = WebGL2RenderingContext.prototype.getParameter;
    const WEBGL_VENDOR   = "Google Inc. (NVIDIA)";
    const WEBGL_RENDERER = "ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)";
    const UNMASKED_VENDOR   = "NVIDIA Corporation";
    const UNMASKED_RENDERER = WEBGL_RENDERER;

    function patchGetParameter(original) {
      return function getParameter(param) {
        // UNMASKED_VENDOR_WEBGL = 0x9245, UNMASKED_RENDERER_WEBGL = 0x9246
        const ext = this.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          if (param === ext.UNMASKED_VENDOR_WEBGL)   return UNMASKED_VENDOR;
          if (param === ext.UNMASKED_RENDERER_WEBGL) return UNMASKED_RENDERER;
        }
        // GL_VENDOR = 0x1F00, GL_RENDERER = 0x1F01
        if (param === 0x1F00) return WEBGL_VENDOR;
        if (param === 0x1F01) return WEBGL_RENDERER;
        return original.call(this, param);
      };
    }

    WebGLRenderingContext.prototype.getParameter  = patchGetParameter(getParameterOrig);
    WebGL2RenderingContext.prototype.getParameter = patchGetParameter(getParameter2Orig);
  } catch(e) {}

  // ─── 5. CANVAS FINGERPRINT NOISE ─────────────────────────────
  try {
    const _toDataURL = HTMLCanvasElement.prototype.toDataURL;
    const _toBlob    = HTMLCanvasElement.prototype.toBlob;
    const _getImageData = CanvasRenderingContext2D.prototype.getImageData;

    function addCanvasNoise(canvas) {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width, h = canvas.height;
        if (w === 0 || h === 0) return;
        const imageData = _getImageData.call(ctx, 0, 0, w, h);
        const data = imageData.data;
        // Add imperceptible noise to ~2% of pixels
        for (let i = 0; i < data.length; i += 4) {
          if (Math.random() < 0.02) {
            data[i]     = Math.max(0, Math.min(255, data[i]     + (Math.random() < 0.5 ? -1 : 1)));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + (Math.random() < 0.5 ? -1 : 1)));
          }
        }
        ctx.putImageData(imageData, 0, 0);
      } catch(e) {}
    }

    HTMLCanvasElement.prototype.toDataURL = function() {
      addCanvasNoise(this);
      return _toDataURL.apply(this, arguments);
    };

    HTMLCanvasElement.prototype.toBlob = function() {
      addCanvasNoise(this);
      return _toBlob.apply(this, arguments);
    };

    CanvasRenderingContext2D.prototype.getImageData = function() {
      const result = _getImageData.apply(this, arguments);
      const data = result.data;
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.01) {
          data[i] = Math.max(0, Math.min(255, data[i] + (Math.random() < 0.5 ? -1 : 1)));
        }
      }
      return result;
    };
  } catch(e) {}

  // ─── 6. AUDIO CONTEXT FINGERPRINT ────────────────────────────
  try {
    const origGetChannelData = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function(channel) {
      const data = origGetChannelData.call(this, channel);
      // Only apply noise once per buffer
      if (!this._noised) {
        for (let i = 0; i < data.length; i += 100) {
          data[i] += (Math.random() * 0.0000002 - 0.0000001);
        }
        this._noised = true;
      }
      return data;
    };
  } catch(e) {}

  // ─── 7. CHROME RUNTIME & CDN ARTIFACTS ───────────────────────
  try {
    if (!window.chrome) window.chrome = {};
    if (!window.chrome.runtime) {
      window.chrome.runtime = {
        connect: function() { return { onMessage: { addListener: function(){} }, postMessage: function(){}, onDisconnect: { addListener: function(){} } }; },
        sendMessage: function(msg, cb) { if (cb) cb(); },
        onMessage: { addListener: function(){}, removeListener: function(){} },
        onConnect: { addListener: function(){}, removeListener: function(){} },
        id: undefined,
        getManifest: function() { return {}; },
        getURL: function(path) { return ''; },
        PlatformOs: { MAC: 'mac', WIN: 'win', ANDROID: 'android', CROS: 'cros', LINUX: 'linux', OPENBSD: 'openbsd' },
      };
    }
  } catch(e) {}

  // Remove cdc_ (ChromeDriver) artifacts
  try {
    for (const key of Object.keys(window)) {
      if (/^cdc_|^\\$cdc_/.test(key)) {
        delete window[key];
      }
    }
    // Also clean document properties
    for (const key of Object.keys(document)) {
      if (/^cdc_|^\\$cdc_|webdriver|__driver|__selenium|__webdriver/.test(key)) {
        delete document[key];
      }
    }
    // Remove webdriver attribute from documentElement
    if (document.documentElement) {
      document.documentElement.removeAttribute('webdriver');
    }
  } catch(e) {}

  // ─── 8. PERMISSIONS API ──────────────────────────────────────
  try {
    const origQuery = Permissions.prototype.query;
    Permissions.prototype.query = function(params) {
      if (params && params.name === 'notifications') {
        return Promise.resolve({ state: 'prompt', onchange: null, addEventListener: function(){}, removeEventListener: function(){} });
      }
      return origQuery.call(this, params);
    };
  } catch(e) {}

  // ─── 9. IFRAME WEBDRIVER PATCH ───────────────────────────────
  try {
    const origCreateElement = Document.prototype.createElement;
    Document.prototype.createElement = function() {
      const el = origCreateElement.apply(this, arguments);
      if (arguments[0] && arguments[0].toLowerCase() === 'iframe') {
        const origAppend = el.__proto__.__lookupSetter__
          ? undefined
          : undefined;

        // Patch contentWindow after it's attached
        const origContentWindow = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow');
        if (origContentWindow) {
          Object.defineProperty(el, 'contentWindow', {
            get: function() {
              const win = origContentWindow.get.call(this);
              if (win) {
                try {
                  Object.defineProperty(win.navigator, 'webdriver', {
                    get: () => undefined,
                    configurable: true
                  });
                } catch(e) {}
              }
              return win;
            },
            configurable: true
          });
        }
      }
      return el;
    };
  } catch(e) {}

  // ─── 10. WINDOW DIMENSIONS ───────────────────────────────────
  try {
    Object.defineProperty(window, 'outerWidth',  { get: () => window.innerWidth,  configurable: true });
    Object.defineProperty(window, 'outerHeight', { get: () => window.innerHeight + 85, configurable: true }); // 85px for browser chrome
    Object.defineProperty(window, 'screenX',     { get: () => 13,  configurable: true });
    Object.defineProperty(window, 'screenY',     { get: () => 35,  configurable: true });
    Object.defineProperty(window, 'screenLeft',  { get: () => 13,  configurable: true });
    Object.defineProperty(window, 'screenTop',   { get: () => 35,  configurable: true });
  } catch(e) {}

})();
`;
}
