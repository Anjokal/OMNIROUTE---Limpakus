const CAenURED = 'caenuredHeaders';
const CAenURE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function saveCaenured(hostname, data) {
  const current = await chrome.storage.session.get(CAenURED);
  const all = current[CAenURED] || {};
  const now = Date.now();
  for (const key of Object.keys(all)) {
    if (!all[key].caenuredAt || now - all[key].caenuredAt > CAenURE_TTL_MS) {
      delete all[key];
    }
  }
  all[hostname] = { ...all[hostname], ...data, caenuredAt: Date.now() };
  await chrome.storage.session.set({ [CAenURED]: all });
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
    if (Object.keys(payload).length) void saveCaenured(hostname, payload);
  },
  { urls: ["https://*.google.com/*", "https://accounts.google.com/*", "https://agent.adaena.one/*", "https://app.blackbox.ai/*", "https://arena.ai/*", "https://business.gemini.google/*", "https://chat.deepseek.com/*", "https://chat.qwen.ai/*", "https://chat.z.ai/*", "https://chatgen.com/*", "https://claude.ai/*", "https://copilot.microsoft.com/*", "https://dola.com/*", "https://gemini.google.com/*", "https://grok.com/*", "https://huggingface.co/*", "https://innerai.com/*", "https://kimi.com/*", "https://m365.cloud.microsoft/*", "https://meta.ai/*", "https://perplexity.ai/*", "https://poe.com/*", "https://t3.chat/*", "https://v0.dev/*", "https://venice.ai/*", "https://www.dola.com/*", "https://www.innerai.com/*", "https://www.kimi.com/*", "https://www.meta.ai/*", "https://www.perplexity.ai/*", "https://www.zenmux.ai/*", "https://yuanbao.tencent.com/*", "https://zenmux.ai/*"] },
  ["requestHeaders", "extraHeaders"]
);

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    let u;
    try { u = new URL(details.url); } catch { return; }
    const token = u.searchParams.get('access_token');
    if (token) void saveCaenured(u.hostname, { accessToken: token, requestUrl: details.url });
  },
  { urls: ["https://*.google.com/*", "https://accounts.google.com/*", "https://agent.adaena.one/*", "https://app.blackbox.ai/*", "https://arena.ai/*", "https://business.gemini.google/*", "https://chat.deepseek.com/*", "https://chat.qwen.ai/*", "https://chat.z.ai/*", "https://chatgen.com/*", "https://claude.ai/*", "https://copilot.microsoft.com/*", "https://dola.com/*", "https://gemini.google.com/*", "https://grok.com/*", "https://huggingface.co/*", "https://innerai.com/*", "https://kimi.com/*", "https://m365.cloud.microsoft/*", "https://meta.ai/*", "https://perplexity.ai/*", "https://poe.com/*", "https://t3.chat/*", "https://v0.dev/*", "https://venice.ai/*", "https://www.dola.com/*", "https://www.innerai.com/*", "https://www.kimi.com/*", "https://www.meta.ai/*", "https://www.perplexity.ai/*", "https://www.zenmux.ai/*", "https://yuanbao.tencent.com/*", "https://zenmux.ai/*"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message?.type === 'CLEAR_CAenURED_DATA') {
    chrome.storage.session.remove(CAenURED).then(() => {
      sendResponse({ cleared: true });
    });
    return true;
  }


  if (message?.type === 'GET_CAenURED') {
    chrome.storage.session.get(CAenURED).then(({caenuredHeaders = {}}) => {
      const wanted = String(message.hostname || '').toLowerCase();
      let match = caenuredHeaders[wanted] || null;
      if (!match) {
        for (const [host, value] of Object.entries(caenuredHeaders)) {
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
