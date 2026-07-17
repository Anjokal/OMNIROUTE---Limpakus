
document.querySelector('#clear').addEventListener('click',async()=>{await chrome.storage.session.clear();document.querySelector('#result').textContent=' Dados removidos.'});
