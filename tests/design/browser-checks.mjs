import {writeFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname} from 'node:path';
const prototypePath=resolve(dirname(fileURLToPath(import.meta.url)),'../../docs/design/prototype/index.html');
const pages=await(await fetch((process.env.MEDIASTORAGE_DESIGN_CDP_URL??'http://127.0.0.1:9322')+'/json/list')).json();
const ws=new WebSocket(pages[0].webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();const errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
const evaluate=async(expression)=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw r.exceptionDetails;return r.result.value;};
await send('Runtime.enable');await send('Page.enable');
await send('Page.navigate',{url:pathToFileURL(prototypePath).href});
await new Promise(r=>setTimeout(r,500));
const checks=[];
function check(name,value){checks.push({name,passed:!!value});if(!value)throw new Error(name);}
const pause=(ms)=>new Promise(r=>setTimeout(r,ms));
async function moveTo(selector){const r=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...r});return r;}
async function click(selector){const r=await moveTo(selector);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...r});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...r});}
async function key(key){const virtual=key==='Enter'?13:key===' '?32:undefined;const event={key,code:key===' '?'Space':key,...(virtual?{windowsVirtualKeyCode:virtual,nativeVirtualKeyCode:virtual}:{})};await send('Input.dispatchKeyEvent',{type:'keyDown',...event,...(key==='Enter'?{text:'\r'}:key===' '?{text:' '}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',...event});}
await click('#fab');
for(const width of [1440,1024,390,320,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(150);
 check('Open FAB menu follows resize '+width,await evaluate("(()=>{const m=document.getElementById('fab-menu').getBoundingClientRect(),f=document.getElementById('fab').getBoundingClientRect();return Math.abs(m.left-Math.max(8,f.right-m.width))<=1&&Math.abs(m.bottom+8-f.top)<=1;})()"));
}
await click('#fab');
for(const width of [1440,390]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await pause(120);
 check('Primary action covers row whitespace '+width,await evaluate("(()=>{const row=document.querySelector('#objects li'),r=row.getBoundingClientRect();return document.elementFromPoint(r.left+24,r.top+3).closest('button')===row.querySelector('.object-name');})()"));
 const rowPoint=await evaluate("(()=>{const r=document.querySelector('#objects li').getBoundingClientRect();return {x:r.left+24,y:r.top+3}})()");
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...rowPoint});
 check('Hover colors full row without name pill '+width,await evaluate("(()=>{const r=document.querySelector('#objects li');return getComputedStyle(r).backgroundColor!=='rgba(0, 0, 0, 0)'&&getComputedStyle(r.querySelector('.object-name')).backgroundColor==='rgba(0, 0, 0, 0)';})()"));
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...rowPoint});
 check('Pressed row has full state layer '+width,await evaluate("document.querySelector('#objects li').matches(':has(:active)')"));
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...rowPoint});
 check('Whitespace opens details without selecting '+width,await evaluate("!document.getElementById('details').hidden&&!document.querySelector('#objects input').checked"));
 await click('#close-detail');
 await click('#objects .check');
 check('Checkbox selects without opening '+width,await evaluate("document.getElementById('details').hidden&&document.querySelector('#objects input').checked"));
 await click('#cancel-selection');
 await click('#objects li:nth-child(2)>.icon');
 check('Folder info remains an independent action '+width,await evaluate("!document.getElementById('details').hidden&&document.getElementById('path-row').hidden"));
 await click('#close-detail');
 await evaluate("document.querySelector('#objects .object-name').focus()");await key('Tab');await key('Tab');await key('Tab');
 // Focus the primary action with keyboard modality for its row-wide outline.
 await evaluate("document.querySelector('#objects .object-name').focus()");
 check('Keyboard primary focus covers row '+width,await evaluate("(()=>{const b=document.querySelector('#objects .object-name'),p=getComputedStyle(b,'::before');return b.matches(':focus-visible')&&p.outlineStyle==='solid'&&p.inset==='0px'&&p.borderRadius==='16px'&&getComputedStyle(b.parentElement).borderRadius==='16px';})()"));

 await click('#theme');await click('#direction');
 const rtlPoint=await evaluate("(()=>{const r=document.querySelector('#objects li').getBoundingClientRect();return {x:r.right-24,y:r.top+3}})()");
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...rtlPoint});
 check('RTL dark row retains full primary hit area '+width,await evaluate("(()=>{const row=document.querySelector('#objects li'),r=row.getBoundingClientRect();return document.elementFromPoint(r.right-24,r.top+3).closest('button')===row.querySelector('.object-name')&&getComputedStyle(row).backgroundColor!=='rgba(0, 0, 0, 0)';})()"));
 check('RTL secondary hit targets remain independent '+width,await evaluate("(()=>{const row=document.querySelector('#objects li');return ['.check','.icon'].every(s=>{const e=row.querySelector(s),r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));});})()"));
 await click('#direction');await click('#theme');
 if(width===390){await moveTo('#objects li:nth-child(4) .object-name');await evaluate('document.activeElement.blur()');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-row-feedback.png',Buffer.from(shot.data,'base64'));}

}
for(const [width,height] of [[1920,1080],[1440,1000],[1317,918],[1024,900],[840,900],[839,900],[768,1024],[390,844],[320,740]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(120);
 check('No horizontal overflow '+width,await evaluate('document.documentElement.scrollWidth<=innerWidth'));
 check('Equal list insets '+width,await evaluate("(()=>{const m=document.getElementById('main').getBoundingClientRect(),o=document.getElementById('objects').getBoundingClientRect();return Math.abs((o.left-m.left)-(m.right-o.right))<=1;})()"));
 check('Header aligns with list '+width,await evaluate("(()=>{const o=document.getElementById('objects').getBoundingClientRect(),s=document.querySelector('.search').getBoundingClientRect(),h=document.querySelector('.library-navbar');return Math.abs(s.right-o.right)<=1&&Math.abs(h.getBoundingClientRect().left+parseFloat(getComputedStyle(h).paddingLeft)-o.left)<=1;})()"));
 check('Root has no duplicate breadcrumb '+width,await evaluate("document.getElementById('path-row').hidden&&document.querySelectorAll('h1').length===1"));
 check('Objects immediately below navbar '+width,await evaluate("document.querySelector('.collection-heading').getBoundingClientRect().top-document.querySelector('.library-navbar').getBoundingClientRect().bottom<=17"));
 check('Footer at pane bottom '+width,await evaluate("Math.abs(document.querySelector('.library-footer').getBoundingClientRect().bottom-document.getElementById('main').getBoundingClientRect().bottom)<=1"));
 check('Responsive FAB inset '+width,await evaluate(`Math.abs(document.getElementById('main').getBoundingClientRect().right-document.getElementById('fab').getBoundingClientRect().right-${width>=840?29:24})<=1`));


 // Measure final menu geometry, including reopening after a different viewport.
 await click('#fab');await pause(40);
 check('FAB menu trailing alignment '+width,await evaluate("(()=>{const m=document.getElementById('fab-menu').getBoundingClientRect(),f=document.getElementById('fab').getBoundingClientRect();return Math.abs(m.left-Math.max(8,f.right-m.width))<=1;})()"));
 check('FAB menu contained '+width,await evaluate("(()=>{const r=document.getElementById('fab-menu').getBoundingClientRect();return r.left>=8&&r.right<=innerWidth-8;})()"));
 await click('#fab');await click('#fab');await pause(40);
 check('FAB menu stable on reopen '+width,await evaluate("(()=>{const m=document.getElementById('fab-menu').getBoundingClientRect(),f=document.getElementById('fab').getBoundingClientRect();return Math.abs(m.left-Math.max(8,f.right-m.width))<=1;})()"));
 await click('#fab');
 check('FAB clears list viewport '+width,await evaluate("document.getElementById('fab').getBoundingClientRect().top>=document.getElementById('main-scroll').getBoundingClientRect().bottom+8"));
 check('FAB inside plugin '+width,await evaluate("(()=>{const f=document.getElementById('fab').getBoundingClientRect(),m=document.getElementById('main').getBoundingClientRect();return f.left>=m.left&&f.right<=m.right&&f.bottom<=innerHeight;})()"));
 if(width===1440||width===1317||width===390){await evaluate('document.activeElement.blur()');const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile('/tmp/mediastorage-design-'+width+'.png',Buffer.from(shot.data,'base64'));}
 const beforeSelection=await evaluate("({rowTop:document.querySelector('#objects li').getBoundingClientRect().top,height:document.getElementById('main-scroll').clientHeight})");
 await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click()");
 await evaluate("Promise.all(document.getElementById('selection').getAnimations().map(animation=>animation.finished))");
 check('Toolbar hides FAB at every width '+width,await evaluate("!document.getElementById('selection').hidden&&document.getElementById('fab-area').hidden"));
 check('Toolbar fits '+width,await evaluate("document.getElementById('reference-toolbar').scrollWidth<=document.getElementById('reference-toolbar').clientWidth"));
 check('Selection preserves list position and height '+width,await evaluate(`Math.abs(document.querySelector('#objects li').getBoundingClientRect().top-${beforeSelection.rowTop})<=1&&Math.abs(document.getElementById('main-scroll').clientHeight-${beforeSelection.height})<=1`));
 check('Toolbar occupies bottom band '+width,await evaluate("(()=>{const t=document.getElementById('selection').getBoundingClientRect(),s=document.getElementById('main-scroll').getBoundingClientRect(),m=document.getElementById('main').getBoundingClientRect();return (document.getElementById('fab-area').hidden?t.top>=s.bottom+8:t.bottom<=document.getElementById('fab').getBoundingClientRect().top-12)&&t.bottom<=m.bottom&&t.left>=m.left+16&&t.right<=m.right-16&&Math.abs(t.height-64)<=1;})()"));
 if(width<600)check('Mobile action group aligns with FAB inset '+width,await evaluate("(()=>{const t=document.getElementById('selection').getBoundingClientRect(),m=document.getElementById('main').getBoundingClientRect(),f=document.getElementById('fab').getBoundingClientRect();return Math.abs(t.left-m.left-24)<=1&&Math.abs(m.right-t.right-24)<=1;})()"));
 check('Selected count follows object count '+width,await evaluate("document.getElementById('selected-count').previousElementSibling.id==='count'&&document.getElementById('selected-count').textContent==='1 selected'&&!document.getElementById('selected-count').hidden"));
 await evaluate("document.getElementById('main-scroll').scrollTop=10000");
 check('Last selected row clears toolbar '+width,await evaluate("document.querySelector('#objects li:last-child .icon').getBoundingClientRect().bottom<=document.getElementById('selection').getBoundingClientRect().top"));
 if(width<1200){
  await evaluate("document.querySelector('#objects li:last-child .icon').focus()");
  check('Focused last row clears toolbar '+width,await evaluate("document.querySelector('#objects li:last-child .icon').getBoundingClientRect().bottom<=document.getElementById('selection').getBoundingClientRect().top"));
 }
 await evaluate("document.getElementById('main-scroll').scrollTop=0");
 if(width===390||width===320){await pause(200);await evaluate('document.activeElement.blur()');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-toolbar-'+width+'.png',Buffer.from(shot.data,'base64'));}

 await evaluate("document.getElementById('cancel-selection').click()");
 check('Clear synchronizes checkbox '+width,await evaluate("!document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').checked"));
}
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(100);
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click()");
check('Reduced motion disables toolbar entry',await evaluate("getComputedStyle(document.getElementById('selection')).animationName==='none'"));
await evaluate("document.getElementById('cancel-selection').click()");
await send('Emulation.setEmulatedMedia',{features:[]});
check('Desktop small text grows',await evaluate("getComputedStyle(document.querySelector('.footnote')).fontSize==='15px'&&getComputedStyle(document.querySelector('.column-head')).fontSize==='14px'"));
for(const [width,height] of [[1440,600],[1024,600],[390,600],[320,568]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(100);
 await evaluate("document.getElementById('main-scroll').scrollTop=10000");
 check('Last row reachable in short viewport '+width,await evaluate("(()=>{const s=document.getElementById('main-scroll').getBoundingClientRect(),o=document.querySelector('#objects li:last-child .icon').getBoundingClientRect();return o.top>=s.top&&o.bottom<=s.bottom;})()"));
 check('Fixed navbar stays above scrollport '+width,await evaluate("document.querySelector('.library-navbar').getBoundingClientRect().bottom<=document.getElementById('main-scroll').getBoundingClientRect().top+1"));
 await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click();document.getElementById('main-scroll').scrollTop=10000");await pause(200);
 check('Short-height selection toolbar stays at bottom '+width,await evaluate("(()=>{const t=document.getElementById('selection').getBoundingClientRect();return document.getElementById('fab-area').hidden?t.top>=document.getElementById('main-scroll').getBoundingClientRect().bottom+8:t.bottom<=document.getElementById('fab').getBoundingClientRect().top-12;})()"));
 check('Short-height selected last row reachable '+width,await evaluate("(()=>{const r=document.querySelector('#objects li:last-child .icon').getBoundingClientRect(),s=document.getElementById('main-scroll').getBoundingClientRect();return r.top>=s.top&&r.bottom<=s.bottom;})()"));
 await evaluate("document.getElementById('cancel-selection').click()");

 await evaluate("document.getElementById('search').value='no matches';document.getElementById('search-form').requestSubmit()");
 check('Empty search fits pane '+width,await evaluate("!document.getElementById('empty').hidden&&document.documentElement.scrollWidth<=innerWidth"));
 await evaluate("document.getElementById('search').value='';document.getElementById('search-form').requestSubmit();document.querySelector('#objects .icon').click()");
 check('Details fit pane '+width,await evaluate("!document.getElementById('details').hidden&&document.getElementById('fab-area').hidden&&document.documentElement.scrollWidth<=innerWidth"));
 await evaluate("document.getElementById('close-detail').click();document.getElementById('main-scroll').scrollTop=0");
}
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(100);
await evaluate("document.getElementById('direction').click()");
check('Desktop RTL FAB uses trailing edge',await evaluate("Math.abs(document.getElementById('fab').getBoundingClientRect().left-document.getElementById('main').getBoundingClientRect().left-29)<=1"));
await click('#fab');
check('RTL FAB menu aligns to trigger',await evaluate("Math.abs(document.getElementById('fab-menu').getBoundingClientRect().left-document.getElementById('fab').getBoundingClientRect().left)<=1"));
await click('#fab');
check('Desktop RTL list remains balanced',await evaluate("(()=>{const m=document.getElementById('main').getBoundingClientRect(),o=document.getElementById('objects').getBoundingClientRect();return Math.abs((o.left-m.left)-(m.right-o.right))<=1;})()"));
await evaluate("document.getElementById('direction').click()");
await click('#fab');await moveTo('#new-folder');await pause(500);
check('Tooltip mount preserves menu',await evaluate("!document.getElementById('fab-menu').hidden&&!document.getElementById('action-tooltip').hidden"));
await moveTo('#action-tooltip');await pause(550);
check('Tooltip travel preserves menu',await evaluate("!document.getElementById('fab-menu').hidden&&!document.getElementById('action-tooltip').hidden"));
await click('#action-tooltip');
check('Owned tooltip is not outside menu',await evaluate("!document.getElementById('fab-menu').hidden"));
await key('Escape');check('Escape tooltip keeps menu',await evaluate("document.getElementById('action-tooltip').hidden&&!document.getElementById('fab-menu').hidden"));
await key('Escape');check('Second Escape closes menu',await evaluate("document.getElementById('fab-menu').hidden&&document.activeElement.id==='fab'"));
await click('#fab');await moveTo('#new-folder');await pause(450);await click('#new-folder');
check('Tooltip action opens task once',await evaluate("document.getElementById('task').open&&document.getElementById('fab-menu').hidden"));
await evaluate("document.getElementById('folder-input').value='References';document.getElementById('task-submit').click()");
check('FAB creates sample folder',await evaluate("document.getElementById('objects').textContent.includes('References')&&!document.getElementById('task').open"));
await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click();document.getElementById('copy-links').click()");
check('Copy retains source and clipboard',await evaluate("document.getElementById('clipboard-count').textContent.includes('1 copied')&&document.getElementById('objects').textContent.includes('Brand guidelines.pdf')"));
await evaluate("[...document.querySelectorAll('#objects .object-name')].find(x=>x.textContent.includes('References')).click();document.getElementById('paste-links').click();document.getElementById('reference-fields').querySelector('input').value='Alternate title.pdf';document.getElementById('reference-confirm').click()");
check('Nested breadcrumbs preserve ancestor navigation',await evaluate("!document.getElementById('path-row').hidden&&document.querySelectorAll('#breadcrumbs button').length===2"));
check('Paste creates independent alias',await evaluate("document.getElementById('objects').textContent.includes('Alternate title.pdf')&&!document.getElementById('reference-task').open"));
await evaluate("document.querySelector('#objects .icon').click()");
check('Alias retains original target and name',await evaluate("document.getElementById('detail-fields').textContent.includes('sample-nextcloud-3')&&document.getElementById('detail-fields').textContent.includes('Brand guidelines.pdf')"));
await evaluate("document.getElementById('close-detail').click();document.querySelector('input[aria-label=\"Select Alternate title.pdf\"]').click();document.getElementById('rename-link').click();document.getElementById('reference-fields').querySelector('input').value='Renamed link.pdf';document.getElementById('reference-confirm').click()");
check('Rename changes alias only',await evaluate("document.getElementById('objects').textContent.includes('Renamed link.pdf')"));
await evaluate("document.querySelector('input[aria-label=\"Select Renamed link.pdf\"]').click();document.getElementById('move-links').click();document.getElementById('destination-folder').value='';document.getElementById('reference-confirm').click()");
check('Move removes alias from old virtual folder',await evaluate("!document.getElementById('objects').textContent.includes('Renamed link.pdf')"));
await evaluate("document.getElementById('up').click()");
check('Move places alias beside original reference',await evaluate("document.getElementById('objects').textContent.includes('Renamed link.pdf')&&document.getElementById('objects').textContent.includes('Brand guidelines.pdf')"));
await evaluate("document.querySelector('input[aria-label=\"Select Renamed link.pdf\"]').click();document.getElementById('remove-links').click()");
check('Remove confirmation explains virtual-only deletion',await evaluate("document.getElementById('reference-copy').textContent.includes('Original Nextcloud files and other links are kept')"));
await evaluate("document.getElementById('reference-confirm').click()");
check('Remove preserves other reference',await evaluate("!document.getElementById('objects').textContent.includes('Renamed link.pdf')&&document.getElementById('objects').textContent.includes('Brand guidelines.pdf')"));
await evaluate("document.getElementById('paste-links').click();document.getElementById('reference-confirm').click()");
check('Collision keeps dialog and error',await evaluate("document.getElementById('reference-task').open&&!document.getElementById('reference-error').hidden"));
await evaluate("document.querySelector('#reference-form button[value=cancel]').click();document.getElementById('cancel-selection').click()");
await send('Emulation.setDeviceMetricsOverride',{width:320,height:740,deviceScaleFactor:1,mobile:false});await pause(100);
await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click();document.getElementById('more-actions').click()");
await moveTo('#menu-remove');await pause(450);check('Overflow tooltip preserves menu',await evaluate("!document.getElementById('toolbar-menu').hidden&&!document.getElementById('action-tooltip').hidden"));
await key('Escape');await key('Escape');
check('Overflow restores invoking focus',await evaluate("document.getElementById('toolbar-menu').hidden&&document.activeElement.id==='more-actions'"));
await evaluate("document.getElementById('cancel-selection').click();document.getElementById('theme').click();document.getElementById('direction').click()");
check('Dark RTL no overflow',await evaluate('document.documentElement.scrollWidth<=innerWidth'));
await evaluate("document.getElementById('theme').click();document.getElementById('direction').click()");
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(100);
await evaluate("document.getElementById('fab').click()");await pause(420);
await key('ArrowDown');check('Menu keyboard Down',await evaluate("document.activeElement.id==='new-folder'"));
await key('Home');check('Menu keyboard Home',await evaluate("document.activeElement.id==='add'"));
await key('End');check('Menu keyboard End',await evaluate("document.activeElement.id==='new-folder'"));
await key('Tab');check('Menu Tab exits',await evaluate("document.getElementById('fab-menu').hidden&&!document.getElementById('fab-menu').contains(document.activeElement)"));
await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click();document.getElementById('copy-links').focus()");
await key('ArrowRight');check('Toolbar roving focus',await evaluate("document.activeElement.id==='rename-link'"));
await evaluate("document.getElementById('cancel-selection').click();document.getElementById('fab').click()");await moveTo('#new-folder');await pause(450);
let shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-fab-menu.png',Buffer.from(shot.data,'base64'));
await key('Escape');await key('Escape');await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click()");await pause(100);
shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-toolbar.png',Buffer.from(shot.data,'base64'));
await send('Emulation.setDeviceMetricsOverride',{width:320,height:740,deviceScaleFactor:1,mobile:false});await pause(100);
await evaluate("document.getElementById('more-actions').click()");await click('#menu-copy');
check('Compact menu Copy restores focus',await evaluate("document.getElementById('toolbar-menu').hidden&&document.activeElement.id==='more-actions'&&document.getElementById('clipboard-count').textContent.includes('1 copied')"));
await evaluate("document.getElementById('cancel-selection').click()");
await click('#fab');await moveTo('#new-folder');await moveTo('#add');await pause(450);

check('Rapid hover cancels stale tooltip',await evaluate("document.getElementById('action-tooltip').textContent==='Reference an existing Nextcloud file'&&!document.getElementById('fab-menu').hidden"));
await click('#search');check('Outside click closes menu without stealing focus',await evaluate("document.getElementById('fab-menu').hidden&&document.activeElement.id==='search'"));
// Add becomes available after explicitly ending reference actions on every width.
for(const [width,height] of [[1440,1000],[1024,900],[390,844],[320,568]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(120);
 for(const entry of ['add','new-folder']){
  await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click();document.getElementById('menu-copy').click()");
  check('Selected and copied context hides Add '+width+' '+entry,await evaluate("!document.getElementById('selection').hidden&&document.getElementById('fab-area').hidden&&document.getElementById('fab-menu').hidden"));
  await click('#cancel-selection');
  check('Cancel restores Add at every width '+width,await evaluate("document.getElementById('selection').hidden&&!document.getElementById('fab-area').hidden&&document.getElementById('clipboard-count').hidden&&document.activeElement.id==='fab'"));
  await click('#fab');await click('#'+entry);
  check('Add task opens after cancellation '+width+' '+entry,await evaluate("document.getElementById('task').open&&document.getElementById('selection').hidden&&document.getElementById('fab-area').hidden"));
  await evaluate("new Promise(resolve=>{document.getElementById('task').addEventListener('close',()=>requestAnimationFrame(resolve),{once:true});document.querySelector('#task-form button[value=cancel]').click();})");
  check('Task cancel restores Add without old context '+width+' '+entry,await evaluate("!document.getElementById('task').open&&document.getElementById('selection').hidden&&!document.getElementById('fab-area').hidden&&document.getElementById('paste-links').disabled&&document.activeElement.id==='fab'"));
 }
}
await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click();document.getElementById('direction').click()");await pause(200);
check('Compact RTL hides FAB during toolbar context',await evaluate("!document.getElementById('selection').hidden&&document.getElementById('fab-area').hidden&&document.documentElement.scrollWidth<=innerWidth"));
await evaluate("document.getElementById('direction').click()");
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(150);
check('Resize wide restores exclusive toolbar',await evaluate("!document.getElementById('selection').hidden&&document.getElementById('fab-area').hidden"));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await pause(200);
check('Resize narrow retains exclusive toolbar',await evaluate("!document.getElementById('selection').hidden&&document.getElementById('fab-area').hidden"));
await evaluate('document.activeElement.blur()');let compactShot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-toolbar-390.png',Buffer.from(compactShot.data,'base64'));
await click('#cancel-selection');await click('#fab');await moveTo('#new-folder');await pause(450);
compactShot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-compact-add-menu.png',Buffer.from(compactShot.data,'base64'));
await evaluate("document.getElementById('cancel-selection').click()");
for(const [width,height] of [[1440,1000],[390,844],[320,568]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(120);
 for(const mode of ['selection','clipboard','both']){
  await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click()");
  if(mode!=='selection')await evaluate("document.getElementById('menu-copy').click()");
  if(mode==='clipboard')await evaluate("[...document.querySelectorAll('#objects .object-name')].find(x=>x.textContent.includes('Campaigns')).click()");
  await evaluate("Promise.all(document.getElementById('selection').getAnimations().map(animation=>animation.finished))");
  const listing=await evaluate("document.getElementById('objects').textContent");
  check('Context including clipboard-only hides FAB '+width+' '+mode,await evaluate("!document.getElementById('selection').hidden&&document.getElementById('fab-area').hidden"));
  check('One separate cancel action '+width+' '+mode,await evaluate("!document.getElementById('reference-toolbar').contains(document.getElementById('cancel-selection'))&&!document.getElementById('clear-clipboard')&&!document.getElementById('menu-clear')&&!document.getElementById('cancel-selection').disabled"));
  check('Cancel surface separated by 8px '+width+' '+mode,await evaluate("(()=>{const t=document.getElementById('reference-toolbar').getBoundingClientRect(),c=document.getElementById('cancel-selection').getBoundingClientRect();return Math.abs(c.left-t.right-8)<=1&&c.width===56&&c.height===56;})()"));
  await click('#cancel-selection');
  check('Cancel clears all reference context '+width+' '+mode,await evaluate("document.getElementById('selection').hidden&&document.getElementById('selected-count').hidden&&document.getElementById('clipboard-count').hidden&&document.getElementById('paste-links').disabled&&document.getElementById('fab-menu').hidden&&document.getElementById('toolbar-menu').hidden&&![...document.querySelectorAll('#objects input')].some(x=>x.checked)&&document.activeElement.id==='fab'"));
  check('Cancel preserves references '+width+' '+mode,await evaluate(`document.getElementById('objects').textContent===${JSON.stringify(listing)}`));
  if(mode==='clipboard')await evaluate("document.getElementById('up').click()");
 }
}
await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click();document.getElementById('more-actions').focus()");await pause(200);
await key('Tab');check('Cancel has separate Tab stop',await evaluate("document.activeElement.id==='cancel-selection'"));
await key('Enter');check('Keyboard cancel restores Add',await evaluate("document.getElementById('selection').hidden&&document.activeElement.id==='fab'"));
await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click();document.getElementById('cancel-selection').focus()");await pause(200);
await key(' ');check('Space cancels reference actions',await evaluate("document.getElementById('selection').hidden&&document.activeElement.id==='fab'"));

await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await pause(120);
await evaluate("document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click();document.getElementById('direction').click()");await pause(200);
check('RTL cancel is separate trailing action',await evaluate("document.getElementById('cancel-selection').getBoundingClientRect().right+8<=document.getElementById('reference-toolbar').getBoundingClientRect().left+1"));
await evaluate("document.getElementById('direction').click()");
await evaluate("document.getElementById('cancel-selection').click()");
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(120);
check('Add bucket beside heading',await evaluate("document.querySelector('.bucket-title').contains(document.getElementById('add-bucket'))&&document.getElementById('add-bucket').getBoundingClientRect().height>=48"));
const initialBuckets=await evaluate("document.querySelectorAll('#buckets button').length");
await click('#add-bucket');
check('Bucket dialog is explicitly sample only',await evaluate("document.getElementById('bucket-task').open&&document.getElementById('bucket-task').textContent.includes('Nothing is saved to Nextcloud')"));
let bucketShot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-bucket-dialog.png',Buffer.from(bucketShot.data,'base64'));
await evaluate("document.getElementById('bucket-input').value='   ';document.getElementById('bucket-submit').click()");
check('Blank bucket stays open with error',await evaluate("document.getElementById('bucket-task').open&&!document.getElementById('bucket-error').hidden"));
await evaluate("document.getElementById('bucket-input').value=' brand LIBRARY ';document.getElementById('bucket-submit').click()");
check('Duplicate bucket retains input',await evaluate("document.getElementById('bucket-task').open&&document.getElementById('bucket-input').value===' brand LIBRARY '&&document.getElementById('bucket-error').textContent.includes('already exists')"));
await evaluate("new Promise(resolve=>{document.getElementById('bucket-task').addEventListener('close',()=>requestAnimationFrame(resolve),{once:true});document.querySelector('#bucket-form button[value=cancel]').click();})");
check('Bucket cancellation preserves destinations and focus',await evaluate(`document.querySelectorAll('#buckets button').length===${initialBuckets}&&document.activeElement.id==='add-bucket'`));
await click('#add-bucket');
await evaluate("document.getElementById('bucket-filter').value='no matches';document.getElementById('bucket-filter').dispatchEvent(new Event('input'));document.getElementById('bucket-input').value=' Studio assets ';document.getElementById('bucket-submit').click()");await pause(100);
check('Create selects empty sample bucket',await evaluate("document.getElementById('bucket-name').textContent==='Studio assets'&&document.getElementById('empty').hidden===false&&document.querySelectorAll('#objects li').length===0&&document.querySelector('#buckets [aria-current=page]').textContent==='Studio assets'"));
check('Creation clears bucket filter',await evaluate(`document.getElementById('bucket-filter').value===''&&document.querySelectorAll('#buckets button').length===${initialBuckets+1}`));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await pause(120);
await click('#open-drawer');await click('#add-bucket');
check('Compact drawer opens bucket task',await evaluate("document.getElementById('bucket-task').open&&document.getElementById('drawer').classList.contains('open')&&document.getElementById('main').inert"));
await evaluate("new Promise(resolve=>{document.getElementById('bucket-task').addEventListener('close',()=>requestAnimationFrame(resolve),{once:true});document.querySelector('#bucket-form button[value=cancel]').click();})");
check('Compact cancel restores drawer trigger',await evaluate("document.activeElement.id==='add-bucket'&&document.getElementById('drawer').classList.contains('open')"));
await click('#add-bucket');
await evaluate("document.getElementById('bucket-input').value='Mobile sample';document.getElementById('bucket-submit').click()");await pause(100);
check('Compact creation closes drawer and restores main',await evaluate("!document.getElementById('bucket-task').open&&!document.getElementById('drawer').classList.contains('open')&&!document.getElementById('main').inert&&document.getElementById('bucket-name').textContent==='Mobile sample'&&document.activeElement.id==='main'"));
// Pack actual action targets continuously, including widths between breakpoints.
await click('#open-drawer');await evaluate("[...document.querySelectorAll('#buckets button')].find(x=>x.textContent==='Brand library').click();document.querySelector('input[aria-label=\"Select Brand guidelines.pdf\"]').click()");
for(const [width,slots] of [[320,3],[360,4],[375,4],[390,5],[420,5],[480,5]]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await pause(150);
 check('Adaptive action count '+width,await evaluate(`document.querySelectorAll('#reference-toolbar button:not([hidden])').length===${slots}`));
 check('Only hidden commands enter overflow '+width,await evaluate("(()=>{const pairs=[['move-links','menu-move'],['copy-links','menu-copy'],['paste-links','menu-paste'],['rename-link','menu-rename'],['remove-links','menu-remove']];return pairs.every(([button,menu])=>document.getElementById(button).hidden!==document.getElementById(menu).hidden&&document.getElementById(menu).getAttribute('aria-disabled')===String(document.getElementById(button).disabled));})()"));
 check('Adaptive targets retain 48px '+width,await evaluate("[...document.querySelectorAll('#reference-toolbar button:not([hidden])')].every(x=>x.getBoundingClientRect().width>=48&&x.getBoundingClientRect().height>=48)&&document.getElementById('reference-toolbar').scrollWidth<=document.getElementById('reference-toolbar').clientWidth"));
 check('Arrow exists only when commands overflow '+width,await evaluate("document.getElementById('more-actions').hidden===![...document.querySelectorAll('#reference-toolbar button:not(#more-actions)')].some(x=>x.hidden)"));
}
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await pause(150);
await evaluate("document.getElementById('rename-link').focus()");
await send('Emulation.setDeviceMetricsOverride',{width:320,height:740,deviceScaleFactor:1,mobile:false});await pause(150);
check('Shrinking moves hidden action focus to overflow',await evaluate("document.activeElement.id==='more-actions'"));
await click('#more-actions');await moveTo('#menu-remove');
await send('Emulation.setDeviceMetricsOverride',{width:321,height:740,deviceScaleFactor:1,mobile:false});await pause(150);
check('Stable packing preserves open overflow',await evaluate("!document.getElementById('toolbar-menu').hidden"));
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await pause(150);
check('Growing closes obsolete overflow and repairs focus',await evaluate("document.getElementById('toolbar-menu').hidden&&document.getElementById('more-actions').hidden&&document.activeElement.id==='move-links'"));
await evaluate('document.activeElement.blur()');let adaptiveShot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-toolbar-390.png',Buffer.from(adaptiveShot.data,'base64'));
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(150);
const actionLabels=await evaluate("[...document.querySelectorAll('#reference-toolbar .action-label')].map(x=>x.textContent)");
await evaluate("document.querySelectorAll('#reference-toolbar .action-label').forEach(x=>x.textContent=x.textContent.repeat(8))");await pause(150);
check('Long labels automatically fall back to icon actions',await evaluate("document.getElementById('reference-toolbar').classList.contains('icon-actions')&&document.getElementById('reference-toolbar').scrollWidth<=document.getElementById('reference-toolbar').clientWidth"));
await evaluate(`[...document.querySelectorAll('#reference-toolbar .action-label')].forEach((x,i)=>x.textContent=${JSON.stringify(actionLabels)}[i])`);
await send('Emulation.setDeviceMetricsOverride',{width:1439,height:1000,deviceScaleFactor:1,mobile:false});await pause(150);
check('Wide toolbar restores readable labels',await evaluate("!document.getElementById('reference-toolbar').classList.contains('icon-actions')&&document.getElementById('more-actions').hidden"));
check('No runtime exceptions',errors.length===0);
const evidence={browser:(await send('Browser.getVersion')).product,checks};await writeFile('/tmp/mediastorage-reference-ui-results.json',JSON.stringify(evidence,null,2));console.log(evidence.browser+': '+checks.length+' browser checks passed.');ws.close();
