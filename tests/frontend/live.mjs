// SPDX-License-Identifier: AGPL-3.0-or-later
// Real Nextcloud host/browser checks. Creates and deletes its own test user.
import {readFile,writeFile} from 'node:fs/promises'
import {randomBytes} from 'node:crypto'
import assert from 'node:assert/strict'
import {tokenFormChecks,tokenSecretChecks,tokenDashboardChecks} from './token-checks.mjs'
import {materialChecks,toolbarChecks,buttonSpacingChecks,pickerChecks} from './material-checks.mjs'
if(process.env.MEDIASTORAGE_TEST_DISPOSABLE!=='yes')throw new Error('Set MEDIASTORAGE_TEST_DISPOSABLE=yes for the authorized local test instance.')
const credentials=JSON.parse(await readFile(process.env.MEDIASTORAGE_TEST_CREDENTIALS??'/tmp/mediastorage-nextcloud-admin.json','utf8'))
const base=credentials.url.replace(/\/$/,''),username='ms-ui-'+randomBytes(5).toString('hex'),password=randomBytes(32).toString('base64url')
const basic=(user,pass)=>'Basic '+Buffer.from(user+':'+pass).toString('base64')
async function provision(method,fields){const r=await fetch(base+'/ocs/v1.php/cloud/users'+(method==='DELETE'?'/'+encodeURIComponent(username):'')+'?format=json',{method,headers:{Authorization:basic(credentials.username,credentials.password),'OCS-APIRequest':'true',Accept:'application/json',...(fields?{'Content-Type':'application/x-www-form-urlencoded'}:{})},...(fields?{body:new URLSearchParams(fields)}:{})});const data=await r.json();assert.equal(data.ocs.meta.status,'ok','Fixture account provisioning failed')}
const pages=await(await fetch(process.env.MEDIASTORAGE_DESIGN_CDP_URL??'http://127.0.0.1:9322/json/list')).json(),ws=new WebSocket(pages.find(p=>p.type==='page'&&!p.url.startsWith('chrome-extension:')).webSocketDebuggerUrl)
await new Promise(r=>ws.addEventListener('open',r,{once:true}));let sequence=0,created=false;const cacheEnabled=process.env.MEDIASTORAGE_TEST_CACHE_ENABLED==='yes';const candidate=process.env.MEDIASTORAGE_TEST_CANDIDATE_ASSETS==='yes',assets=candidate?{js:await readFile('js/mediastorage-main.js'),css:await readFile('css/mediastorage.css'),font:await readFile('img/material-symbols-outlined.ttf')}:null;const pending=new Map(),errors=[],checks=[]
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}else if(m.method==='Fetch.requestPaused'){const kind=m.params.request.url.includes('material-symbols-outlined.ttf')?'font':m.params.request.url.includes('mediastorage-main.js')?'js':'css';send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:kind==='font'?'font/ttf':kind==='js'?'application/javascript':'text/css'}],body:assets[kind].toString('base64')}).catch(()=>{});}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description??m.params.exceptionDetails.text)})
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))})
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(('Browser evaluation failed: '+(r.exceptionDetails.exception?.description??r.exceptionDetails.text)).replaceAll(password,'[redacted]'));return r.result.value}
const pause=ms=>new Promise(r=>setTimeout(r,ms));const check=(name,value)=>{assert.ok(value,name);checks.push(name)}
async function wait(expression){for(let i=0;i<200;i++){if(await evaluate(expression))return;await pause(50)}throw new Error('Timed out waiting for UI state: '+expression)}
async function click(selector){const point=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled||!e.getClientRects().length)throw new Error('Unavailable target');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});await pause(80)}
async function draft(value){await wait("document.querySelector('#task').open && !!document.querySelector('#task input:not([type=checkbox])')");await evaluate(`(()=>{const e=document.querySelector('#task input:not([type=checkbox])');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('input',{bubbles:true}))})()`);await dialogGeometry('editable task')}
async function save(){await dialogGeometry('confirmation task');await click('#task md-filled-button');await wait("!document.querySelector('#task').open");await wait("document.querySelector('#fab').getAttribute('aria-disabled')==='false'")}
async function dialogGeometry(label){check('Dialog centered and contained: '+label,await evaluate("(()=>{const r=document.querySelector('#task').getBoundingClientRect();return Math.abs(r.left+r.width/2-innerWidth/2)<1&&Math.abs(r.top+r.height/2-innerHeight/2)<1&&r.left>=15&&r.right<=innerWidth-15&&r.top>=15&&r.bottom<=innerHeight-15})()"))}
async function themeStates(theme){
 await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${theme==='dark'})`)
 check('Dialog heading follows theme '+theme,await evaluate("getComputedStyle(document.querySelector('#task h2')).color")=== (theme==='dark'?'rgb(222, 234, 223)':'rgb(32, 41, 35)'))
 const expected=theme==='dark'?'rgb(155, 212, 171)':'rgb(40, 103, 71)'
 await evaluate("document.querySelector('#task .dialog-actions md-text-button').scrollIntoView({block:'nearest'})")
 const point=await evaluate("(()=>{const r=document.querySelector('#task .dialog-actions md-text-button').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
 const color=()=>evaluate("getComputedStyle(document.querySelector('#task .dialog-actions md-text-button').shadowRoot.querySelector('button')).color")
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});check('Green hover label '+theme,await color()===expected)
 await evaluate("document.querySelector('#task .dialog-actions md-text-button').focus()");check('Green focused label '+theme,await color()===expected)
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});check('Green pressed label '+theme,await color()===expected)
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1438,y:998});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:1438,y:998})
 check('Green Material state-layer roles '+theme,await evaluate("getComputedStyle(document.querySelector('#task .dialog-actions md-text-button')).getPropertyValue('--md-sys-color-primary').trim()===getComputedStyle(document.querySelector('#media-design')).getPropertyValue('--primary').trim()"))
 const fillColor=theme==='dark'?'rgb(7, 57, 33)':'rgb(255, 255, 255)'
 const filled=await evaluate("(()=>{const e=document.querySelector('#task md-filled-button');e.scrollIntoView({block:'nearest'});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...filled});await evaluate("document.querySelector('#task md-filled-button').focus()")
 check('Filled hover/focus label follows theme '+theme,await evaluate("getComputedStyle(document.querySelector('#task md-filled-button').shadowRoot.querySelector('button')).color")===fillColor)
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...filled})
 check('Filled pressed label follows theme '+theme,await evaluate("getComputedStyle(document.querySelector('#task md-filled-button').shadowRoot.querySelector('button')).color")===fillColor)
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1438,y:998});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:1438,y:998})

}
try{
 if(candidate)await send('Fetch.enable',{patterns:[{urlPattern:'*mediastorage-main.js*'},{urlPattern:'*mediastorage.css*'},{urlPattern:'*material-symbols-outlined.ttf*'}]})
 await provision('POST',{userid:username,password});created=true
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1cAAAAASUVORK5CYII=','base64')
 const dav=base+'/remote.php/dav/files/'+encodeURIComponent(username)+'/UI-fixture.png',davHeaders={Authorization:basic(username,password),'Content-Type':'image/png'}
 assert.equal((await fetch(dav,{method:'PUT',headers:davHeaders,body:png})).status,201,'Create physical UI fixture')
 for(const folder of ['UI-picker','UI-picker/Deep folder with a very long name for narrow screens'])assert.equal((await fetch(base+'/remote.php/dav/files/'+encodeURIComponent(username)+'/'+folder,{method:'MKCOL',headers:{Authorization:basic(username,password)}})).status,201,'Create picker navigation fixture')
 assert.equal((await fetch(base+'/remote.php/dav/files/'+encodeURIComponent(username)+'/UI-picker/Deep folder with a very long name for narrow screens/Leaf.png',{method:'PUT',headers:davHeaders,body:png})).status,201,'Create nested picker fixture')
 await send('Runtime.enable');errors.length=0;await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:!cacheEnabled});await send('Network.clearBrowserCookies');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base+'/index.php/login'});await wait("document.querySelector('input[name=user]')!==null")
 // Enter credentials in browser memory only; never log them or take login screenshots.
 await evaluate(`(()=>{for(const [name,value] of Object.entries(${JSON.stringify({user:username,password})})){const input=document.querySelector('input[name='+name+']');input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}))}document.querySelector('form').requestSubmit()})()`)
 await wait("!location.pathname.includes('/login')");await send('Page.navigate',{url:base+'/index.php/apps/mediastorage/'});await wait("document.querySelector('#fab')!==null&&document.querySelector('#fab').getAttribute('aria-disabled')==='false'")
 // Mark only this disposable account's host welcome wizard seen via its public session route.
 await evaluate("fetch('/index.php/apps/firstrunwizard/wizard',{method:'DELETE',headers:{requesttoken:document.head.dataset.requesttoken}}).then(r=>{if(!r.ok)throw new Error('Could not prepare fixture welcome preference')})")
 await send('Page.navigate',{url:base+'/index.php/apps/mediastorage/'});await wait("document.querySelector('#fab')!==null&&document.querySelector('#fab').getAttribute('aria-disabled')==='false'")
 if(process.env.MEDIASTORAGE_TEST_RECORD_ASSETS==='yes'){
  const urls=await evaluate("[...document.querySelectorAll('script[src],link[rel=stylesheet]')].map(e=>e.src||e.href).filter(u=>u.includes('/mediastorage/'))")
  await writeFile(process.env.MEDIASTORAGE_TEST_PREVIOUS_ASSETS??'/tmp/mediastorage-assets-before-upgrade.json',JSON.stringify(urls.map(url=>({url}))))
 }
 if(cacheEnabled){
  const before=JSON.parse(await readFile(process.env.MEDIASTORAGE_TEST_PREVIOUS_ASSETS??'/tmp/mediastorage-assets-before-upgrade.json','utf8'))
  const urls=await evaluate("[...document.querySelectorAll('script[src],link[rel=stylesheet]')].map(e=>e.src||e.href).filter(u=>u.includes('/mediastorage/'))")
  check('Version upgrade changes JS and CSS cache URLs',urls.length===2&&urls.every(url=>!before.some(asset=>asset.url===url)))
  for(const url of urls){const response=await fetch(url);const bytes=Buffer.from(await response.arrayBuffer()),local=await readFile(url.includes('.js')?'js/mediastorage-main.js':'css/mediastorage.css');check('Installed asset matches build: '+(url.includes('.js')?'JS':'CSS'),response.ok&&bytes.equals(local))}
 }
 const expectedVersion=JSON.parse(await readFile('package.json','utf8')).version
 if(!candidate)check('Installed version is supplied by server and displayed without slogans',await evaluate("document.querySelector('#mediastorage-root').dataset.version=== "+JSON.stringify(expectedVersion)+"&&document.querySelector('.drawer-footer').textContent.trim()=== "+JSON.stringify('v'+expectedVersion)+"&&!document.querySelector('#media-design').textContent.includes('Your media, organized.')&&!document.querySelector('#media-design').textContent.includes('Files stay in Nextcloud.')"))
 check('Actual Nextcloud host preserved',await evaluate("!!document.querySelector('#header')&&!!document.querySelector('#media-design')&&!document.body.textContent.includes('DESIGN STUDY')"))
 check('Closed native task dialog is hidden',await evaluate("!document.querySelector('#task').getClientRects().length"))
 check('Workspace respects host bottom inset',await evaluate("document.querySelector('#main').getBoundingClientRect().bottom<=document.querySelector('#mediastorage-root').getBoundingClientRect().bottom+1"))
 check('Desktop drawer close is hidden',await evaluate("!document.querySelector('.close-drawer').getClientRects().length"))
 check('Compiled Material element registered in host',await evaluate("!!customElements.get('md-filled-button')"))
 await buttonSpacingChecks({evaluate,check})
 await click('#add-bucket');await draft('UI brand');for(const theme of ['light','dark']){
 for(const [width,height] of [[1914,914],[1440,1000],[390,844],[320,568],[1024,360]]){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(90);await dialogGeometry(theme+' '+width+'x'+height)}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await themeStates(theme)
}
await evaluate("document.querySelector('#media-design').classList.remove('dark')");check('Native dialog centered in actual host',await evaluate("(()=>{const r=document.querySelector('#task').getBoundingClientRect();return Math.abs(r.left+r.width/2-innerWidth/2)<1&&Math.abs(r.top+r.height/2-innerHeight/2)<1})()"));await save();check('Bucket creation persisted in real UI',await evaluate("document.querySelector('#media-design h1').textContent==='UI brand'"))
 await click('#fab');await click('#fab-menu button:last-child');await draft('Campaigns');await save();check('Folder creation persisted in real UI',await evaluate("document.querySelector('#objects').textContent.includes('Campaigns')"))
 await materialChecks({send,evaluate,check,pause})
 if(!candidate){const url=await evaluate("performance.getEntriesByType('resource').find(e=>e.name.includes('material-symbols-outlined.ttf')).name"),response=await fetch(url);check('Installed icon font matches official bundled subset',response.ok&&Buffer.from(await response.arrayBuffer()).equals(await readFile('img/material-symbols-outlined.ttf')))}
 await click('#fab');await click('#fab-menu button:first-child');await wait("[...document.querySelectorAll('.file-picker button')].some(b=>b.textContent.includes('UI-fixture.png'))")
 await pickerChecks({send,evaluate,check,pause,click,wait},'UI-fixture.png')
 for(const [width,height] of [[1914,914],[390,844],[1024,360]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(100);await dialogGeometry('file picker '+width+'x'+height)
  await evaluate("document.querySelector('#media-design').classList.add('dark');document.querySelector('#task .dialog-actions md-text-button').scrollIntoView({block:'nearest'})")
  check('Picker remains centered when actions scroll into view '+width,await evaluate("(()=>{const r=document.querySelector('#task').getBoundingClientRect(),b=document.querySelector('#task md-filled-button').getBoundingClientRect();return Math.abs(r.left+r.width/2-innerWidth/2)<1&&b.top>=r.top&&b.bottom<=r.bottom})()"))
  if(width===1914||width===390){const image=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-dialog-'+width+'.png',Buffer.from(image.data,'base64'))}
 }
 await evaluate("document.querySelector('#media-design').classList.remove('dark')");await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(100)
 await evaluate("[...document.querySelectorAll('.file-picker button')].find(b=>b.textContent.includes('UI-fixture.png')).click()");await save();await wait("document.querySelector('#objects').textContent.includes('Available')");check('Real DAV picker binds accessible Nextcloud file',await evaluate("document.querySelector('#objects').textContent.includes('UI-fixture.png')"))
 await click('#objects li:last-child > md-icon-button.icon');await wait("document.querySelector('#copy-virtual-path')!==null")
 await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Clipboard denied fixture')}}})")
 await click('#copy-virtual-path');await wait("document.querySelector('#manual-virtual-path')!==null")
 const copiedPath=await evaluate("document.querySelector('#manual-virtual-path').value")
 check('Denied clipboard exposes manual-copy field',await evaluate("document.querySelector('#manual-virtual-path').readOnly&&document.querySelector('#details').textContent.includes('Clipboard unavailable')"))
 check('Copy returns plugin virtual path only',copiedPath==='/UI-fixture.png'&&await evaluate("document.querySelector('#details dl').textContent.includes('UI brand')"))
 await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedVirtualPath=text}}})")
 await click('#copy-virtual-path');await wait("document.querySelector('#details .link-status').textContent.includes('path copied')")
 check('Successful virtual-path copy reports success and clears fallback',await evaluate("window.__copiedVirtualPath=== "+JSON.stringify(copiedPath)+"&&!document.querySelector('#manual-virtual-path')"))
 await click('#close-detail');await click('#objects li:first-child > md-icon-button.icon');await wait("document.querySelector('#details dl')!==null")
 check('Folders have no media-path copy action',await evaluate("!document.querySelector('#copy-virtual-path')"));await click('#close-detail')
 await evaluate("document.querySelector('input[aria-label=\"Select UI-fixture.png\"]').click()");await click('#action-rename');await draft('Independent alias.png');await save();check('Real virtual rename',await evaluate("document.querySelector('#objects').textContent.includes('Independent alias.png')"))
 await click('#objects li:last-child > md-icon-button.icon');await wait("document.querySelector('#copy-virtual-path')!==null");await click('#copy-virtual-path');await wait("document.querySelector('#details .link-status').textContent.includes('path copied')")
 check('Copied path follows virtual alias instead of original filename',await evaluate("window.__copiedVirtualPath==='/Independent alias.png'"));await click('#close-detail')
 await evaluate("document.querySelector('input[aria-label=\"Select Independent alias.png\"]').click()");await click('#action-copy');await click('#action-paste');await draft('Copied alias.png');await save();check('Real copy creates additional link',await evaluate("document.querySelectorAll('#objects li').length===3"))
 await click('#cancel-selection');
 for(const width of [1440,1024,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await pause(200)
  check('Real host has no horizontal overflow '+width,await evaluate('document.documentElement.scrollWidth<=innerWidth'))
  check('Real content insets balanced '+width,await evaluate("(()=>{const m=document.querySelector('#main').getBoundingClientRect(),o=document.querySelector('#objects').getBoundingClientRect();return Math.abs(o.left-m.left-(m.right-o.right))<=1})()"))
  if(width<840){
   await click('#open-drawer');check('Drawer remains inside plugin '+width,await evaluate("(()=>{const d=document.querySelector('#drawer').getBoundingClientRect(),r=document.querySelector('#media-design').getBoundingClientRect(),s=document.querySelector('#scrim').getBoundingClientRect();return d.left>=r.left&&d.right<=r.right&&d.bottom<=r.bottom+1&&s.left>=r.left&&s.right<=r.right})()"))
   check('Compact drawer isolates main content '+width,await evaluate("document.querySelector('#main').inert&&document.querySelector('#drawer').getAttribute('aria-modal')==='true'"))
   await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await pause(80)
   check('Drawer Escape restores trigger focus '+width,await evaluate("document.activeElement.id==='open-drawer'&&!document.querySelector('#main').inert"))
  }
  await click('#objects input');await pause(220)
  check('Real toolbar excludes FAB '+width,await evaluate("document.querySelector('#fab-area').hidden&&!document.querySelector('#selection').hidden"))
  check('Real toolbar fits '+width,await evaluate("document.querySelector('#reference-toolbar').scrollWidth<=document.querySelector('#reference-toolbar').clientWidth"))
  await toolbarChecks({send,evaluate,check,pause},width)
  if(width===390){await evaluate('document.activeElement.blur()');const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-live-mobile.png',Buffer.from(shot.data,'base64'))}
  await click('#cancel-selection');await click('#fab');await pause(80)
  check('Real FAB menu contained '+width,await evaluate("(()=>{const r=document.querySelector('#fab-menu').getBoundingClientRect();return r.left>=8&&r.right<=innerWidth-8&&Math.abs(r.right-document.querySelector('#fab').getBoundingClientRect().right)<1})()"));await click('#fab')
  check('Material FAB preserves pane inset '+width,await evaluate("(()=>{const p=document.querySelector('#main').getBoundingClientRect(),f=document.querySelector('#fab').getBoundingClientRect(),w=document.querySelector('#media-design').clientWidth;return Math.abs(p.right-f.right-(w>=840?29:24))<1})()"))
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(200)
 await evaluate("document.querySelector('input[aria-label=\"Select Copied alias.png\"]').click()");await click('#action-remove');await save();check('Real remove unlinks only selected alias',await evaluate("!document.querySelector('#objects').textContent.includes('Copied alias.png')&&document.querySelector('#objects').textContent.includes('Independent alias.png')"))
 await evaluate("document.querySelector('input[aria-label=\"Select Independent alias.png\"]').click()");await click('#action-move');await wait("[...document.querySelectorAll('#task select option')].some(o=>o.textContent==='UI brand / Campaigns')")
 await evaluate("(()=>{const select=document.querySelector('#task select');select.value=[...select.options].find(o=>o.textContent==='UI brand / Campaigns').value;select.dispatchEvent(new Event('change',{bubbles:true}))})()");await save()
 check('Real move changes virtual parent',await evaluate("!document.querySelector('#objects').textContent.includes('Independent alias.png')"))
 await click('#objects .object-name');await wait("document.querySelector('#objects').textContent.includes('Independent alias.png')")
 await click('#objects li:first-child > md-icon-button.icon');await wait("document.querySelector('#copy-virtual-path')!==null");await click('#copy-virtual-path');await wait("document.querySelector('#details .link-status').textContent.includes('path copied')")
 check('Copied plugin path follows virtual folder move',await evaluate("window.__copiedVirtualPath==='/Campaigns/Independent alias.png'"));await click('#close-detail')
 check('Real folder navigation and breadcrumb',await evaluate("document.querySelector('#path-row').textContent.includes('Campaigns')"));await click('#path-row md-text-button');await wait("document.querySelector('#objects').textContent.includes('Campaigns')")
 await click('#drawer nav button:last-child');await wait("document.querySelector('#tokens')!==null&&!document.querySelector('#tokens .loading')")
 await click('#tokens md-filled-button');await wait("!document.querySelector('#task md-filled-button').disabled");await draft('Browser integration');await tokenFormChecks({evaluate,check,click,wait});await click('#task md-filled-button');await wait("document.querySelector('#task .secret')!==null")
 await tokenSecretChecks({evaluate,check,click,wait});
 check('Real token creation displays one-time secret',await evaluate("document.querySelector('#task .secret').textContent.length>30&&document.querySelector('.token-list').textContent.includes('Browser integration')"))
 check('Token secret is not stored in browser persistence',await evaluate("(()=>{const secret=document.querySelector('#task .secret').textContent;return !Object.values(localStorage).some(v=>v.includes(secret))&&!Object.values(sessionStorage).some(v=>v.includes(secret))})()"))
 await click('#task .dialog-actions md-text-button');await wait("!document.querySelector('#task').open")
 check('Secret cleared on close',await evaluate("!document.querySelector('#task .secret')"))
 await click('.token-row md-text-button:first-of-type');await click('#task md-filled-button');await wait("document.querySelector('#task .secret')!==null")
 check('Token rotation returns replacement secret',await evaluate("document.querySelectorAll('.token-row').length===2"));await click('#task .dialog-actions md-text-button');await wait("!document.querySelector('#task').open")
 await click('.token-row md-text-button:last-child');await save();check('Token revoke updates real status',await evaluate("document.querySelector('.token-list').textContent.includes('revoked')"))
 await tokenDashboardChecks({send,evaluate,check,pause})
 await click('#drawer nav button:first-child');await wait("document.querySelector('#objects')!==null")
 const original=await fetch(dav,{headers:davHeaders});check('Physical file bytes preserved after rename/copy/remove',original.ok&&Buffer.from(await original.arrayBuffer()).equals(png))
 await evaluate('document.activeElement.blur()');const desktop=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-live-desktop.png',Buffer.from(desktop.data,'base64'))
 check('No runtime exceptions in actual host',errors.length===0)
 console.log(`${checks.length} live Nextcloud UI checks passed (${candidate?'candidate local frontend assets':'installed assets'}, cache ${cacheEnabled?'enabled':'disabled'}); dedicated fixture account will be removed.`)
 await writeFile('/tmp/mediastorage-live-ui-results.json',JSON.stringify({browser:(await send('Browser.getVersion')).product,candidate,cacheEnabled,checks},null,2))
}catch(e){console.error(e.message);if(await evaluate("!!document.querySelector('#media-design')&&!document.querySelector('#task .secret')").catch(()=>false)){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-live-failure.png',Buffer.from(shot.data,'base64'));console.error(await evaluate("[...document.querySelectorAll('[role=dialog]')].map(d=>({classes:d.className,buttons:[...d.querySelectorAll('button')].map(b=>({label:b.getAttribute('aria-label'),title:b.title,text:b.textContent.slice(0,80)}))}))"))}console.error(await evaluate("({path:location.pathname,dialogs:[...document.querySelectorAll('[role=dialog],dialog')].map(e=>({label:e.getAttribute('aria-label'),open:e.open,visible:!!e.getClientRects().length})),add:document.querySelector('#add-bucket')?.getBoundingClientRect().toJSON()})").catch(()=>({})));if(errors.length)console.error('Browser runtime errors occurred ('+errors.length+').');process.exitCode=1}finally{if(candidate)await send('Fetch.disable');ws.close();if(created)await provision('DELETE')}
