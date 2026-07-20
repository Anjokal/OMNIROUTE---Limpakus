
chrome.alarms.create('cleanupCapturedData', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'cleanupCapturedData') return;
  const current = await chrome.storage.session.get(CAPTURED);
  const all = current[CAPTURED] || {};
  const now = Date.now();
  for (const key of Object.keys(all)) {
    if (!all[key].capturedAt || now - all[key].capturedAt > CAPTURE_TTL_MS) {
      delete all[key];
    }
  }
  await chrome.storage.session.set({ [CAPTURED]: all });
});

const CAPTURED = 'capturedHeaders';
const CAPTURE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function saveCaptured(hostname, data) {
  const current = await chrome.storage.session.get(CAPTURED);
  const all = current[CAPTURED] || {};
  const now = Date.now();
  for (const key of Object.keys(all)) {
    if (!all[key].capturedAt || now - all[key].capturedAt > CAPTURE_TTL_MS) {
      delete all[key];
    }
  }
  all[hostname] = { ...all[hostname], ...data, capturedAt: Date.now() };
  await chrome.storage.session.set({ [CAPTURED]: all });
}

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    let hostname;
    try { hostname = new URL(details.url).hostname; } catch { return; }
    const headers = details.requestHeaders || [];
    const payload = {};
    for (const h of headers) {
      const n = (h.name || '').toLowerCase();
      if (n === 'cookie' && h.value) payload.cookie = h.value.replace(/^Cookie:\s*/i, '');
      if (n === 'authorization' && h.value) payload.authorization = h.value.replace(/^Bearer\s+/i, '');
    }
    if (Object.keys(payload).length) void saveCaptured(hostname, payload);
  },
  { urls: ["https://*.google.com/*", "https://accounts.google.com/*", "https://agent.adapta.one/*", "https://app.blackbox.ai/*", "https://arena.ai/*", "https://business.gemini.google/*", "https://chat.deepseek.com/*", "https://chat.qwen.ai/*", "https://chat.z.ai/*", "https://chatgpt.com/*", "https://claude.ai/*", "https://copilot.microsoft.com/*", "https://dola.com/*", "https://gemini.google.com/*", "https://grok.com/*", "https://huggingface.co/*", "https://innerai.com/*", "https://kimi.com/*", "https://m365.cloud.microsoft/*", "https://meta.ai/*", "https://perplexity.ai/*", "https://poe.com/*", "https://t3.chat/*", "https://v0.dev/*", "https://venice.ai/*", "https://www.dola.com/*", "https://www.innerai.com/*", "https://www.kimi.com/*", "https://www.meta.ai/*", "https://www.perplexity.ai/*", "https://www.zenmux.ai/*", "https://yuanbao.tencent.com/*", "https://zenmux.ai/*"] },
  ["requestHeaders", "extraHeaders"]
);

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    let u;
    try { u = new URL(details.url); } catch { return; }
    const token = u.searchParams.get('access_token');
    if (token) void saveCaptured(u.hostname, { accessToken: token, requestUrl: details.url });
  },
  { urls: ["https://*.google.com/*", "https://accounts.google.com/*", "https://agent.adapta.one/*", "https://app.blackbox.ai/*", "https://arena.ai/*", "https://business.gemini.google/*", "https://chat.deepseek.com/*", "https://chat.qwen.ai/*", "https://chat.z.ai/*", "https://chatgpt.com/*", "https://claude.ai/*", "https://copilot.microsoft.com/*", "https://dola.com/*", "https://gemini.google.com/*", "https://grok.com/*", "https://huggingface.co/*", "https://innerai.com/*", "https://kimi.com/*", "https://m365.cloud.microsoft/*", "https://meta.ai/*", "https://perplexity.ai/*", "https://poe.com/*", "https://t3.chat/*", "https://v0.dev/*", "https://venice.ai/*", "https://www.dola.com/*", "https://www.innerai.com/*", "https://www.kimi.com/*", "https://www.meta.ai/*", "https://www.perplexity.ai/*", "https://www.zenmux.ai/*", "https://yuanbao.tencent.com/*", "https://zenmux.ai/*"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message?.type === 'CLEAR_CAPTURED_DATA') {
    chrome.storage.session.remove(CAPTURED).then(() => {
      sendResponse({ cleared: true });
    });
    return true;
  }


  if (message?.type === 'GET_CAPTURED') {
    chrome.storage.session.get(CAPTURED).then(({capturedHeaders = {}}) => {
      const wanted = String(message.hostname || '').toLowerCase();
      let match = capturedHeaders[wanted] || null;
      if (!match) {
        for (const [host, value] of Object.entries(capturedHeaders)) {
          if (wanted === host || wanted.endsWith('.' + host) || host.endsWith('.' + wanted)) {
            match = value; break;
          }
        }
      }
      sendResponse(match);
    });
    return true;
  }
  return false;
});
