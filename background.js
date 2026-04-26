// Background Service Worker - TikTok Creator Suite
const BOT_LOG_MAX = 500;
const botLogs = [];

function pushBotLog(entry) {
  botLogs.push(entry);
  if (botLogs.length > BOT_LOG_MAX) {
    botLogs.splice(0, botLogs.length - BOT_LOG_MAX);
  }
}

// Open Side Panel when extension icon clicked
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (chrome.sidePanel?.open && tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id });
      return;
    }
  } catch {
    // Fallback
  }
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL("sidepanel.html") });
  } catch {
    // ignore
  }
});

// Message handler
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (!msg || typeof msg !== "object") return;

    if (msg.type === "botLog") {
      const entry = {
        ts: Date.now(),
        level: msg.level || "info",
        runId: msg.runId || null,
        step: msg.step || null,
        message: msg.message || "",
        tabId: _sender?.tab?.id ?? null
      };
      pushBotLog(entry);
      try { chrome.runtime.sendMessage({ type: "botLogBroadcast", log: entry }); } catch {}
      sendResponse({ ok: true });
      return;
    }

    if (msg.type === "getBotLogs") { sendResponse({ ok: true, logs: botLogs }); return; }
    if (msg.type === "clearBotLogs") { botLogs.length = 0; sendResponse({ ok: true }); return; }
    if (msg.type === "botLogBroadcast") { sendResponse({ ok: true }); return; }

    if (msg.type === "downloadVideo") {
      try {
        const response = await fetch(msg.url);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        sendResponse({ ok: true, data: Array.from(new Uint8Array(arrayBuffer)) });
      } catch (error) {
        sendResponse({ ok: false, error: String(error) });
      }
      return;
    }

    sendResponse({ ok: false, error: "Unknown message type" });
  })().catch((e) => sendResponse({ ok: false, error: String(e) }));
  return true;
});
