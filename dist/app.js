(() => {
'use strict';
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
let topZ = 10, current = 'about', toastTimer;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('calm');
const animate = (el, frames, options = {}) => { if (reduced()) return; if (window.Motion?.animate) window.Motion.animate(el, frames, {duration:.3,...options}); };
function front(win) { $$('.window').forEach(w => w.classList.remove('active')); win.classList.add('active'); win.style.zIndex = ++topZ; current = win.id; }
function open(id) {const win = document.getElementById(id); if (!win?.classList.contains('window')) return; const wasHidden = win.hidden || (id === 'photo' && !win.classList.contains('mobile-open') && innerWidth <= 700); win.hidden = false; win.classList.add('mobile-open'); front(win); if(wasHidden) animate(win,{opacity:[0,1],scale:[.96,1],y:[12,0]}); updateDock(); closeMenu(); if(id === 'search') { $('input',win).focus(); renderSearch('');} }
function close(win) {win.hidden = true; win.classList.remove('mobile-open');updateDock(); const visible = $$('.window').filter(w=>!w.hidden && getComputedStyle(w).display !== 'none'); if(visible.length) front(visible.sort((a,b)=>Number(b.style.zIndex)-Number(a.style.zIndex))[0]);}
function updateDock() {$$('.dock [data-open]').forEach(btn=>{const w = document.getElementById(btn.dataset.open);btn.classList.toggle('running',!w.hidden && (innerWidth > 700 || w.classList.contains('mobile-open') || w.id==='about'));});}
function notify(message) { const toast = $('.toast');clearTimeout(toastTimer);toast.textContent = message;toast.hidden = false;animate(toast,{opacity:[0,1],y:[-6,0]});toastTimer=setTimeout(()=>toast.hidden=true,2600); }
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.open)));
$$('.window').forEach(win=>{
 win.addEventListener('pointerdown',()=>front(win));
 $('.close',win)?.addEventListener('click',()=>close(win));
 $('.minimize',win)?.addEventListener('click',()=>{close(win);notify('窗口已收进 Dock，点击图标即可恢复。');});
 const zoom = ()=>win.classList.toggle('zoomed');
 $('.maximize',win)?.addEventListener('click',zoom);
 const bar = $('.titlebar',win);bar.addEventListener('dblclick',e=>{if(!e.target.closest('button'))zoom();});
 let drag;
 bar.addEventListener('pointerdown',e=>{if(e.target.closest('button')||innerWidth<=700||win.classList.contains('zoomed'))return;const r=win.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top-31};bar.setPointerCapture(e.pointerId);});
 bar.addEventListener('pointermove',e=>{if(!drag)return;win.style.left=Math.max(0,Math.min(innerWidth-win.offsetWidth,drag.left+e.clientX-drag.x))+'px';win.style.top=Math.max(0,Math.min(innerHeight-125,drag.top+e.clientY-drag.y))+'px';});
 const stop=()=>drag=null;bar.addEventListener('pointerup',stop);bar.addEventListener('pointercancel',stop);
});
function closeMenu() {$('#menu').hidden=true;$$('[data-menu]').forEach(b=>b.setAttribute('aria-expanded','false'));}
function setMenu(type,btn) {
 const menu=$('#menu');const same=!menu.hidden && menu.dataset.type===type;closeMenu();if(same)return;menu.dataset.type=type;menu.hidden=false;btn.setAttribute('aria-expanded','true');
 const views=[['整理窗口','arrange'],['显示桌面','desktop'],[document.body.classList.contains('alternate-wallpaper')?'恢复地球原色':'切换壁纸色调','wallpaper'],[document.body.classList.contains('calm')?'开启动效':'减少动效','motion']];
 const entries=type==='view'?views:type==='file'?[['打开关于我','about'],['打开摄影','photo'],['打开联系我','contact']]:[['关于这个桌面','help'],['关于夏海博','about'],['联系我','contact'],['整理窗口','arrange']];
 menu.replaceChildren();entries.forEach(([label,action])=>{const b=document.createElement('button');b.textContent=label;b.addEventListener('click',()=>{closeMenu();if(action==='arrange'){arrange();notify('窗口已整理。');}else if(action==='desktop'){$$('.window').forEach(w=>close(w));}else if(action==='wallpaper'){document.body.classList.toggle('alternate-wallpaper');savePreferences();}else if(action==='motion'){document.body.classList.toggle('calm');savePreferences();}else open(action);});menu.append(b);});
 const rect=btn.getBoundingClientRect();menu.style.left=Math.min(innerWidth-menu.offsetWidth-10,Math.max(10,rect.left))+'px';menu.style.top=type==='view'&&btn.closest('.dock')?rect.top-menu.offsetHeight-18+'px':'31px';
}
$$('[data-menu]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();setMenu(b.dataset.menu,b);}));
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#menu,[data-menu]'))closeMenu();});
function arrange() {$$('.window').forEach(w=>{w.style.removeProperty('left');w.style.removeProperty('top');w.classList.remove('zoomed');});open('photo');open('about');}
function savePreferences() {try{localStorage.setItem('haibo-desktop-prefs',JSON.stringify({calm:document.body.classList.contains('calm'),alternate:document.body.classList.contains('alternate-wallpaper')}));}catch{}}
try{const p=JSON.parse(localStorage.getItem('haibo-desktop-prefs')||'{}');document.body.classList.toggle('calm',!!p.calm);document.body.classList.toggle('alternate-wallpaper',!!p.alternate);}catch{}
$('.copy-button').addEventListener('click',async()=>{try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText('z5781707@ad.unsw.edu.au');else{const t=document.createElement('textarea');t.value='z5781707@ad.unsw.edu.au';t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();const copied=document.execCommand('copy');t.remove();if(!copied)throw new Error('copy');}notify('邮箱地址已复制。');}catch{notify('请在上方邮箱地址上长按或右键复制。');}});
const photos=[{title:'海滩.jpg',alt:'晴空下的沙滩与沙滩排球'},{title:'海浪.jpg',alt:'黄色海滩关闭标志、海浪与岸边的两个人'},{title:'夜色.jpg',alt:'暮色中的悉尼海港大桥与海边人群'}];
const viewer=$('.photo-viewer');let photoIndex=0,photoTrigger;
function showPhoto(index){photoIndex=(index+photos.length)%photos.length;const item=photos[photoIndex];$('.viewer-title').textContent=item.title;$('.viewer-counter').textContent=(photoIndex+1)+' / '+photos.length;$('.viewer-image').src='assets/photos/photo-'+String(photoIndex+1).padStart(2,'0')+'.jpg';$('.viewer-image').alt=item.alt;$$('[data-slide]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.slide)===photoIndex)));}
$$('[data-photo]').forEach(b=>b.addEventListener('click',()=>{photoTrigger=b;showPhoto(Number(b.dataset.photo));viewer.showModal();$('.viewer-close').focus();}));
$('.viewer-close').addEventListener('click',()=>viewer.close());
$('.viewer-prev').addEventListener('click',()=>showPhoto(photoIndex-1));
$('.viewer-next').addEventListener('click',()=>showPhoto(photoIndex+1));
$$('[data-slide]').forEach(b=>b.addEventListener('click',()=>showPhoto(Number(b.dataset.slide))));
viewer.addEventListener('close',()=>photoTrigger?.focus());
viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});
viewer.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(photoIndex-1);}if(e.key==='ArrowRight'){e.preventDefault();showPhoto(photoIndex+1);}});
let touchStart;
$('.viewer-stage').addEventListener('touchstart',e=>{if(e.touches.length===1)touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
$('.viewer-stage').addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)showPhoto(photoIndex+(dx<0?1:-1));touchStart=null;},{passive:true});
const searchItems=[{name:'关于我',terms:'夏海博 unsw 大一 机械工程 学习 介绍',id:'about'},{name:'摄影',terms:'兴趣 相机 镜头 照片 相册 海滩 海浪 夜色',id:'photo'},{name:'联系我',terms:'邮箱 email github z5781707 hxia6114-droid',id:'contact'},{name:'桌面帮助',terms:'拖动 窗口 使用 操作',id:'help'}];
function renderSearch(value){const results=$('#search-results');results.replaceChildren();const filtered=searchItems.filter(item=>(item.name+item.terms).toLowerCase().includes(value.trim().toLowerCase()));filtered.forEach(item=>{const b=document.createElement('button');b.className='search-result';b.append(document.createTextNode(item.name));const arrow=document.createElement('span');arrow.textContent='↗';b.append(arrow);b.addEventListener('click',()=>{close($('#search'));open(item.id);});results.append(b);});if(!filtered.length){const p=document.createElement('p');p.className='search-empty';p.textContent='没有找到相关内容，试试“摄影”或“邮箱”。';results.append(p);}}
$('#search input').addEventListener('input',e=>renderSearch(e.target.value));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#menu').hidden)closeMenu();else{const w=document.getElementById(current);if(w&&!w.hidden)close(w);}}if(e.key==='/'&&!e.target.matches('input,textarea')){e.preventDefault();open('search');}});
function clock(){const now=new Date();$('#clock').textContent=new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);$('#clock').dateTime=now.toISOString();}clock();setInterval(clock,15000);
window.addEventListener('resize',()=>{$$('.window').forEach(w=>{if(innerWidth>700){const r=w.getBoundingClientRect();if(r.right>innerWidth)w.style.left=Math.max(0,innerWidth-w.offsetWidth-20)+'px';if(r.top>innerHeight-140)w.style.top='80px';}});updateDock();});
// Welcome lettering runs only while visible, and respects motion preferences.
function alignWelcomeCaptions(){
 const visible=$('.welcome-slide:not([hidden]) .welcome-word');if(!visible)return;
 const box=visible.getBoundingClientRect();if(!box.width||!box.height)return;
 $$('.welcome-slide').forEach(slide=>{const vb=$('.welcome-word',slide).viewBox.baseVal;const scale=Math.min(box.width/vb.width,box.height/vb.height);slide.style.setProperty('--caption-inset',(vb.height/12*scale).toFixed(2)+'px');});
}
new ResizeObserver(alignWelcomeCaptions).observe($('.welcome-animation'));alignWelcomeCaptions();
const welcomeSlides=$$('.welcome-slide');let welcomeIndex=0,welcomeTimer;
function scheduleWelcome(){clearTimeout(welcomeTimer);if(reduced()||document.hidden)return;welcomeTimer=setTimeout(cycleWelcome,4600);}
function cycleWelcome(){if(reduced()||document.hidden){scheduleWelcome();return;}const previous=welcomeSlides[welcomeIndex];previous.classList.add('is-leaving');setTimeout(()=>{previous.hidden=true;previous.classList.remove('is-current','is-leaving');welcomeIndex=(welcomeIndex+1)%welcomeSlides.length;const next=welcomeSlides[welcomeIndex];next.hidden=false;next.classList.add('is-current');$('.welcome-language').textContent=next.dataset.language;scheduleWelcome();},650);}
new MutationObserver(scheduleWelcome).observe(document.body,{attributes:true,attributeFilter:['class']});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',scheduleWelcome);
document.addEventListener('visibilitychange',scheduleWelcome);scheduleWelcome();
updateDock();animate($('#about'),{opacity:[0,1],y:[15,0]},{duration:.55});animate($('.dock'),{opacity:[0,1]},{duration:.65});
})();
