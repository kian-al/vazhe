chrome.runtime.onInstalled.addListener(()=>chrome.contextMenus.create({id:'vazhe-search',title:'جست‌وجو در واژه: %s',contexts:['selection']}));
chrome.contextMenus.onClicked.addListener(info=>{
 if(info.menuItemId!=='vazhe-search')return;
 const query=(info.selectionText||'').trim().slice(0,120);
 if(query)chrome.tabs.create({url:'https://vazhe.vercel.app/search?q='+encodeURIComponent(query)});
});
