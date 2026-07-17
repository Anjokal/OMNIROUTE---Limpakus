



async function clearCapturedData(){
  try{
    await chrome.runtime.sendMessage({type:'CLEAR_CAPTURED_DATA'});
    setStatus('Temporary captured data cleared.', 'success');
  }catch(e){
    setStatus('Could not clear temporary data.', 'error');
  }
}


function applyLocalization(){
  const setText = (selector, key, fallback) => {
    const element = document.querySelector(selector);
    if (!element) return;
    element.textContent = chrome.i18n.getMessage(key) || fallback;
  };

  setText('#detectedLabel', 'detectedNode', 'DETECTED NODE');
  setText('#detectedName', 'analyzingTab', 'Analyzing current tab…');
  setText('#detectedHint', 'openSupported', 'Open a supported platform and sign in.');
  setText('#copyLabel', 'authorizeCopy', 'AUTHORIZE AND COPY');
  setText('#openBtn', 'openPlatform', 'Open platform');
  setText('#localOnlyLabel', 'localOnly', 'LOCAL ONLY // ZERO EXFIL');

  const searchInput = document.querySelector('#searchInput');
  if (searchInput) {
    searchInput.placeholder = chrome.i18n.getMessage('searchPlatform') || 'Search platform…';
  }
}

let providers = [];
let selected = null;
let activeTab = null;
let defaultDetectedName = 'Analyzing current tab…';
let defaultDetectedHint = 'Open a supported platform and sign in.';

const $ = (s) => document.querySelector(s);
const list = $('#providerList');
const statusBox = $('#status');
const detectedName = $('#detectedName');
const detectedHint = $('#detectedHint');
const copyBtn = $('#copyBtn');
const openBtn = $('#openBtn');

function setStatus(text, type='neutral'){
  statusBox.textContent = text;
  statusBox.className = `status ${type}`;
}
function hostMatches(host, domains){ return domains.some(d => host === d || host.endsWith('.'+d)); }
function render(filter=''){
  const q = filter.trim().toLowerCase();
  const filtered = providers.filter(p => (p.name+' '+p.hint).toLowerCase().includes(q));
  $('#countBadge').textContent = filtered.length;
  list.replaceChildren();
  for (const p of filtered){
    const b = document.createElement('button');
    b.className = 'card'+(selected?.id===p.id?' active':'');
    b.type='button';
    b.innerHTML = `<img class="provider-icon" src="assets/providers/${p.id}.svg" alt="">
      <div><strong>${p.name}</strong><span>${p.hint}</span></div>`;
    b.addEventListener('click',()=>selectProvider(p));
    list.appendChild(b);
  }
}
function selectProvider(p){
  selected=p;
  detectedName.textContent=p.name;
  detectedHint.textContent=p.hint;
  openBtn.disabled=false;
  copyBtn.disabled=false;
  render($('#searchInput').value);
}
async function getTab(){
  const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id || !tab.url) throw new Error('Could not identify the active tab.');
  return tab;
}
async function ensurePermission(p){
  const origins = p.domains.map(d=>`https://${d}/*`);
  if(p.id==='gemini'||p.id==='gemini-business') origins.push('https://*.google.com/*','https://accounts.google.com/*');
  const has = await chrome.permissions.contains({origins});
  if(has) return true;
  return await chrome.permissions.request({origins});
}
async function cookiesFor(p){
  const out=[];
  for(const d of p.domains){
    try{
      const arr=await chrome.cookies.getAll({domain:d});
      for(const c of arr) if(!out.some(x=>x.name===c.name&&x.domain===c.domain&&x.path===c.path)) out.push(c);
    }catch{}
  }
  return out;
}
const clean=v=>String(v||'').trim().replace(/^Bearer\s+/i,'');
function cookieHeader(cookies){return cookies.filter(c=>c.name).sort((a,b)=>a.name.localeCompare(b.name)).map(c=>`${c.name}=${c.value}`).join('; ')}
function cookieChunks(cookies,prefix){return cookies.filter(c=>c.name===prefix||c.name.startsWith(prefix+'.')).sort((a,b)=>a.name.localeCompare(b.name));}
async function storageValues(keys){
  const results=await chrome.scripting.executeScript({
    target:{tabId:activeTab.id},world:'MAIN',
    args:[keys],
    func:(wanted)=>{
      const result={};
      for(const storage of [localStorage,sessionStorage]){
        for(let i=0;i<storage.length;i++){
          const key=storage.key(i); if(!key) continue;
          if(wanted.some(w=>key===w||key.toLowerCase().includes(w.toLowerCase()))){
            let value=storage.getItem(key)||'';
            try{const j=JSON.parse(value); if(typeof j==='string')value=j; else if(j&&typeof j==='object')value=j.token||j.access_token||j.accessToken||j.value||value}catch{}
            if(value&&!result[key])result[key]=clean(value);
          }
        }
      }
      return result;
    }
  });
  return results?.[0]?.result||{};
}
async function captured(host){
  return await chrome.runtime.sendMessage({type:'GET_CAPTURED',hostname:host});
}
async function askExtra(title,text,label,placeholder=''){
  $('#dialogTitle').textContent=title; $('#dialogText').textContent=text;
  $('#extraLabel').childNodes[0].nodeValue=label+' ';
  $('#extraInput').value=''; $('#extraInput').placeholder=placeholder;
  const d=$('#extraDialog'); d.showModal();
  return await new Promise(resolve=>{
    d.addEventListener('close',()=>resolve(d.returnValue==='default'?$('#extraInput').value.trim():''),
      {once:true});
  });
}
async function extract(p){
  const cookies=await cookiesFor(p);
  if(p.mode==='cookie_value'){
    const c=cookies.find(x=>x.name===p.cookie); if(!c)throw new Error(`Não encontrei ${p.cookie}.`);
    return c.value;
  }
  if(p.mode==='cookie_value_prefix'){
    const c=cookieChunks(cookies,p.cookie); if(!c.length)throw new Error(`Não encontrei ${p.cookie}.`);
    return c.map(x=>x.value).join('');
  }
  if(p.mode==='cookie_first'){
    for(const n of p.cookies){const c=cookies.find(x=>x.name===n);if(c)return c.value}
    const cap=await captured(p.domains[0]); if(cap?.cookie)return cap.cookie;
    throw new Error('Não encontrei o cookie de sessão.');
  }
  if(p.mode==='cookie_header'){
    const cap=await captured(p.domains[0]);
    const header=cap?.cookie||cookieHeader(cookies);
    if(!header)throw new Error('Não encontrei cookies. Atualiza a página ou envia uma mensagem.');
    const missing=(p.required||[]).filter(n=>!header.includes(n+'=')&&!cookies.some(c=>c.name===n||c.name.startsWith(n+'.')));
    if(missing.length)throw new Error('Faltam: '+missing.join(', ')+'.');
    return header;
  }
  if(p.mode==='storage'){
    const vals=await storageValues(p.keys);
    const value=Object.values(vals)[0]; if(!value)throw new Error(`Não encontrei ${p.keys.join(' / ')} no armazenamento local.`);
    return value;
  }
  if(p.mode==='google_cookie'){
    const one=cookies.find(c=>c.name==='__Secure-1PSID');
    const ts=cookies.find(c=>c.name==='__Secure-1PSIDTS');
    if(!one)throw new Error('Não encontrei __Secure-1PSID.');
    return `__Secure-1PSID=${one.value}`+(ts?`; __Secure-1PSIDTS=${ts.value}`:'');
  }
  if(p.mode==='inner'){
    const token=cookies.find(c=>c.name==='token')?.value;
    if(!token)throw new Error('Não encontrei o cookie token.');
    const email=await askExtra('Email da conta Inner.ai','O OmniRoute exige o token seguido do email usado no Inner.ai.','Email','nome@dominio.pt');
    if(!email)throw new Error('Operação cancelada.');
    return `${token} ${email}`;
  }
  if(p.mode==='captured_token'){
    const cap=await captured(p.domains[0]);
    const token=cap?.accessToken||cap?.authorization;
    if(!token)throw new Error('Ainda não capturei o access_token. Atualiza a página ou envia uma mensagem.');
    return clean(token);
  }
  if(p.mode==='qwen'){
    const vals=await storageValues(['token']);
    const token=Object.values(vals)[0]||cookies.find(c=>c.name==='tongyi_sso_ticket')?.value;
    if(!token)throw new Error('Não encontrei token nem tongyi_sso_ticket.');
    return token;
  }
  if(p.mode==='t3'){
    const vals=await storageValues(['convex-session-id']);
    const session=Object.values(vals)[0];
    const header=(await captured(p.domains[0]))?.cookie||cookieHeader(cookies);
    if(!session||!header)throw new Error('É necessário convex-session-id e o Cookie completo.');
    return `${session}\n${header}`;
  }
  if(p.mode==='manual_m365'){
    const cap=await captured(p.domains[0]);
    const token=cap?.accessToken||'';
    const path=await askExtra('Microsoft 365 Copilot','Copia o segmento específico do caminho Chathub presente no URL do WebSocket.','Segmento Chathub','ex.: cid/… ou caminho indicado pelo OmniRoute');
    if(!token)throw new Error('Ainda não capturei o access_token do WebSocket Chathub.');
    if(!path)throw new Error('Falta o segmento Chathub.');
    return `${token} ${path}`;
  }
  throw new Error('Método ainda não suportado.');
}
async function copySelected(){
  try{
    copyBtn.disabled=true; setStatus('A pedir acesso apenas ao domínio selecionado…');
    activeTab=await getTab();
    if(!selected)throw new Error('Seleciona uma plataforma.');
    const ok=await ensurePermission(selected);
    if(!ok)throw new Error('A permissão do domínio não foi concedida.');
    const currentHost=new URL(activeTab.url).hostname;
    if(!hostMatches(currentHost,selected.domains)){
      await chrome.tabs.update(activeTab.id,{url:selected.url});
      setStatus('Plataforma aberta. Inicia sessão e volta a clicar em “AUTHORIZE AND COPY”.');
      return;
    }
    const credential=await extract(selected);
    await navigator.clipboard.writeText(credential);
    setStatus('Credential copied. Paste it directly into OmniRoute.','success');
  }catch(e){setStatus(e.message||'Não foi possível copiar.','error')}
  finally{copyBtn.disabled=false}
}
async function init(){
  providers=await (await fetch('providers.json')).json();
  activeTab=await getTab();
  let host='';try{host=new URL(activeTab.url).hostname}catch{}
  selected=providers.find(p=>hostMatches(host,p.domains))||providers[0];
  selectProvider(selected);
  render();
}
$('#copyBtn').addEventListener('click',copySelected);
$('#openBtn').addEventListener('click',()=>selected&&chrome.tabs.create({url:selected.url}));
$('#searchInput').addEventListener('input',e=>render(e.target.value));
$('#settingsBtn').addEventListener('click',()=>chrome.runtime.openOptionsPage());
$('#privacyBtn').addEventListener('click',()=>chrome.tabs.create({url:chrome.runtime.getURL('privacy.html')}));
$('#clearDataBtn')?.addEventListener('click', clearCapturedData);
applyLocalization();
defaultDetectedName = document.querySelector('#detectedName')?.textContent || defaultDetectedName;
defaultDetectedHint = document.querySelector('#detectedHint')?.textContent || defaultDetectedHint;
init().catch(e=>setStatus(e.message,'error'));
