// SPDX-License-Identifier: AGPL-3.0-or-later
// Built-frontend checks with an HTTP fixture server, not a Nextcloud deployment.
import {createServer} from 'node:http'
import {readFile,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import {tokenFormChecks,tokenSecretChecks,tokenDashboardChecks} from './token-checks.mjs'
import {materialChecks,toolbarChecks,buttonSpacingChecks,pickerChecks} from './material-checks.mjs'
let next=1,requestCount=0;const rows=[{id:'image',parent_id:'root',name:'Photo.png',node_type:'media',binding_status:'available',binding:{mime_type:'image/png',file_size:12,last_known_path:'Photo.png'}},{id:'folder',parent_id:'root',name:'Campaigns',node_type:'folder'}]
const appVersion=JSON.parse(await readFile('package.json','utf8')).version
let fixturePolicy=true,fixtureLifetime=3600
const buckets=[{id:'root',name:'Library',is_default:true}],tokens=[]
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data))}
 if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html','Content-Security-Policy':"default-src 'self'; script-src 'self' 'nonce-fixture'; style-src 'self'; img-src 'self' data:; connect-src 'self'"});res.end(`<!doctype html><html><head data-user="fixture" data-requesttoken="csrf-fixture"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/style.css"><script nonce="fixture">window._oc_webroot='';window.OC={config:{modRewriteWorking:false}};</script></head><body style="margin:0"><div id="mediastorage-root" data-version="${appVersion}"></div><script src="/app.js"></script></body></html>`);return}
 if(url.pathname==='/img/material-symbols-outlined.ttf'){res.writeHead(200,{'Content-Type':'font/ttf'});res.end(await readFile('img/material-symbols-outlined.ttf'));return}
 if(url.pathname==='/app.js'||url.pathname==='/style.css'){res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'application/javascript':'text/css'});res.end(url.pathname.endsWith('.js')?await readFile('js/mediastorage-main.js'):Buffer.concat([Buffer.from('html,body {height:100%;margin:0;} #mediastorage-root {height:100dvh;}'),await readFile('css/mediastorage.css')]));return}
 if(req.method==='PROPFIND'){
  const path=decodeURIComponent(url.pathname).split('/files/fixture/')[1]??''
  const entries=path===''?[{name:'Chosen.png',id:42},{name:'UI-picker',folder:true}]:path==='UI-picker'?[{name:'Deep folder with a very long name for narrow screens',folder:true}]:path==='UI-picker/Deep folder with a very long name for narrow screens'?[{name:'Leaf.png',id:43}]:[]
  const xml=entries.map(f=>`<d:response><d:href>/remote.php/dav/files/fixture/${path?path+'/':''}${f.name}${f.folder?'/':''}</d:href><d:propstat><d:prop><d:displayname>${f.name}</d:displayname><d:getcontenttype>${f.folder?'httpd/unix-directory':'image/png'}</d:getcontenttype><oc:fileid>${f.id??0}</oc:fileid><d:resourcetype>${f.folder?'<d:collection/>':''}</d:resourcetype></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`).join('')
  res.writeHead(207,{'Content-Type':'application/xml'});res.end('<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:response><d:href>'+url.pathname+'</d:href></d:response>'+xml+'</d:multistatus>');return
 }
 if(!url.pathname.includes('/api/v1/')){res.writeHead(404);res.end();return}
 requestCount++
 if(req.headers.requesttoken!=='csrf-fixture'){send({error:'Missing CSRF'},403);return}
 let raw='';for await(const chunk of req)raw+=chunk;const body=raw?JSON.parse(raw):{}
 const path=url.pathname.split('/api/v1')[1]
 if(path==='/buckets'){if(req.method==='POST'){if(buckets.some(b=>b.name===body.name)){send({error:'Bucket name already exists.'},409);return}const b={id:'b'+next++,name:body.name,is_default:false};buckets.push(b);send(b,201)}else send({buckets,has_more:false});return}
 if(path==='/nodes'){const parent=url.searchParams.get('parent_id')??'root',query=url.searchParams.get('search')??'';send({root_id:'root',nodes:rows.filter(r=>r.parent_id===parent&&r.name.includes(query)),parent_id:parent});return}
 if(path==='/folders'||path==='/bindings'){const n={id:'n'+next++,name:body.name,parent_id:body.parent_id,node_type:path==='/folders'?'folder':'media',...(path==='/bindings'?{binding_status:'available',binding:{mime_type:'image/png',nextcloud_file_id:body.file_id,last_known_path:'Chosen.png',file_size:12}}:{})};rows.push(n);send(n,201);return}
 if(path==='/tokens'){if(req.method==='POST'){const token={id:'t'+next++,name:body.name,scopes:body.scopes,expires_at:body.expires_at,status:'active',created_at:Math.floor(Date.now()/1000),folder_id:body.folder_id,last_used_at:null};tokens.push(token);send({token,secret:'fixture-only-secret'},201)}else send({tokens:tokens.slice(Number(url.searchParams.get('offset')??0),Number(url.searchParams.get('offset')??0)+Number(url.searchParams.get('limit')??100)),...(fixturePolicy?{policy:{server_time:Math.floor(Date.now()/1000),max_lifetime_seconds:fixtureLifetime}}:{})});return}
 if(path.startsWith('/tokens/')){const t=tokens.find(t=>t.id===path.split('/')[2]);if(req.method==='DELETE'){t.status='revoked';send(null,204)}else send({token:t,secret:'fixture-rotation-secret'},201);return}
 const id=path.split('/')[2],node=rows.find(r=>r.id===id)
 if(!node){send({error:'Node not found'},404);return}
 if(path.endsWith('/copy')){const n={...structuredClone(node),id:'n'+next++,name:body.name??node.name,parent_id:body.parent_id};rows.push(n);send(n,201);return}
 if(req.method==='PATCH'){Object.assign(node,body);send(node);return}
 if(req.method==='DELETE'){rows.splice(rows.indexOf(node),1);send(null,204);return}
 send({...node,virtual_path:'/'+node.name})
})
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port
const pages=await(await fetch('http://127.0.0.1:9322/json/list')).json(),ws=new WebSocket(pages.find(p=>p.type==='page'&&!p.url.startsWith('chrome-extension:')).webSocketDebuggerUrl)
await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map(),errors=[]
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails)})
const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}))})
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description??result.exceptionDetails.text);return result.result.value}
const pause=ms=>new Promise(r=>setTimeout(r,ms));const checks=[]
const check=(name,value)=>{assert.ok(value,name);checks.push(name)}
async function wait(expression){for(let i=0;i<100;i++){if(await evaluate(expression))return;await pause(50)}throw new Error('Timed out: '+expression)}
async function click(selector){const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled||!el.getClientRects().length)throw new Error('Unavailable target: '+${JSON.stringify(selector)});el.scrollIntoView({block:'nearest'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});await pause(60)}
async function input(value){await evaluate(`(()=>{const input=document.querySelector('#task input:not([type=checkbox])');input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}))})()`)}
try{
 await send('Runtime.enable');errors.length=0;await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base});await wait("document.querySelectorAll('#objects li').length===2")
 check('Real Vue mount renders server rows',await evaluate("document.querySelector('#objects').textContent.includes('Photo.png')"))
 check('Drawer footer shows supplied version only',await evaluate("document.querySelector('.drawer-footer').textContent.trim()=== "+JSON.stringify('v'+appVersion)+"&&!document.querySelector('#media-design').textContent.includes('Your media, organized.')&&!document.querySelector('#media-design').textContent.includes('Files stay in Nextcloud.')"))
 await buttonSpacingChecks({evaluate,check})
 check('Material primitive registered',await evaluate("!!customElements.get('md-filled-button')"))
 await materialChecks({send,evaluate,check,pause})
 for(const width of [1440,1024,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await pause(120)
  check('No document overflow '+width,await evaluate('document.documentElement.scrollWidth<=innerWidth'))
  check('Balanced content insets '+width,await evaluate("(()=>{const m=document.querySelector('#main').getBoundingClientRect(),o=document.querySelector('#objects').getBoundingClientRect();return Math.abs(o.left-m.left-(m.right-o.right))<1})()"))
  await click('#objects input');await pause(180)
  check('Selection hides FAB '+width,await evaluate("document.querySelector('#fab-area').hidden&&!document.querySelector('#selection').hidden"))
  check('Toolbar fits '+width,await evaluate("document.querySelector('#reference-toolbar').scrollWidth<=document.querySelector('#reference-toolbar').clientWidth"))
  await toolbarChecks({send,evaluate,check,pause},width)
  await click('#cancel-selection');await click('#fab');await pause(50)
  check('FAB menu contained '+width,await evaluate("(()=>{const m=document.querySelector('#fab-menu').getBoundingClientRect();return m.left>=8&&m.right<=innerWidth-8&&Math.abs(m.right-document.querySelector('#fab').getBoundingClientRect().right)<1})()"));await click('#fab')
  check('Material FAB preserves pane inset '+width,await evaluate("(()=>{const p=document.querySelector('#main').getBoundingClientRect(),f=document.querySelector('#fab').getBoundingClientRect(),w=document.querySelector('#media-design').clientWidth;return Math.abs(p.right-f.right-(w>=840?29:24))<1})()"))
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await click('#open-drawer')
 check('Compact drawer has real modal semantics',await evaluate("document.querySelector('#drawer').getAttribute('aria-modal')==='true'&&document.querySelector('#main').inert"))
 await click('#add-bucket');await wait("document.querySelector('#task').open");await input('Brand');await click('#task md-filled-button');await wait("!document.querySelector('#task').open&&document.querySelector('h1').textContent==='Brand'")
 check('Bucket creation uses HTTP and selects empty namespace',rows.every(n=>n.parent_id!=='b1'))
 await click('#fab');await click('#fab-menu button:last-child');await wait("document.querySelector('#task').open");await input('New folder');await click('#task md-filled-button');await wait("document.querySelector('#objects').textContent.includes('New folder')")
 check('New folder persisted through API',rows.some(n=>n.name==='New folder'&&n.parent_id==='b1'))
 await click('#fab');await click('#fab-menu button:first-child');await wait("document.querySelector('.file-picker button')!==null");await pickerChecks({send,evaluate,check,pause,click,wait},'Chosen.png');await click('#task md-filled-button');await wait("document.querySelector('#objects').textContent.includes('Chosen.png')")
 check('DAV picker binds selected file ID',rows.some(n=>n.binding?.nextcloud_file_id===42))
 await evaluate("[...document.querySelectorAll('#objects input')].find(x=>x.getAttribute('aria-label')==='Select Chosen.png').click()");await click('#action-rename');await input('Alias.png');await click('#task md-filled-button');await wait("document.querySelector('#objects').textContent.includes('Alias.png')")
 check('Rename updates virtual name',rows.some(n=>n.name==='Alias.png'&&n.binding.nextcloud_file_id===42))
 await evaluate("[...document.querySelectorAll('#objects input')].find(x=>x.getAttribute('aria-label')==='Select Alias.png').click()");await click('#action-copy');await click('#action-paste');await input('Copied.png');await click('#task md-filled-button');await wait("document.querySelector('#objects').textContent.includes('Copied.png')")
 check('Copy creates independent reference identity',rows.filter(n=>n.binding?.nextcloud_file_id===42).length===2)
 await click('#cancel-selection');await click('#open-drawer');await evaluate("[...document.querySelectorAll('#drawer .destination')].find(x=>x.textContent.includes('API tokens')).click()");await wait("document.querySelector('#tokens md-filled-button')!==null");await click('#tokens md-filled-button');await wait("!document.querySelector('#task md-filled-button').disabled");await input('Read integration');await tokenFormChecks({evaluate,check,click,wait});check('Non-default one-hour policy bounds the suggested expiry',await evaluate("new Date(document.querySelector('#token-expiry').max).getTime()-Date.now()<=3600000"));await click('#task md-filled-button');await wait("document.querySelector('.secret')!==null")
 await tokenSecretChecks({evaluate,check,click,wait});
 check('Token secret shown once',await evaluate("document.querySelector('.secret').textContent==='fixture-only-secret'"));await click('#task md-text-button');await wait("!document.querySelector('#task').open")
 check('Secret removed on close',await evaluate("!document.querySelector('.secret')&&!document.body.textContent.includes('fixture-only-secret')"))
 check('Secrets not persisted in browser storage',await evaluate("!JSON.stringify(localStorage).includes('fixture-only-secret')&&!JSON.stringify(sessionStorage).includes('fixture-only-secret')"))

 const now=Math.floor(Date.now()/1000)
 tokens.push(...[
  {id:'soon',name:'Image reader',expires_at:now+14*86400,status:'active',scopes:['media:read'],folder_id:'root',last_used_at:now-3600},
  {id:'later',name:'Campaign integration',expires_at:now+30*86400,status:'active',scopes:['media:read','media:manage'],folder_id:null,last_used_at:null},
  {id:'revoked',name:'Retired automation',expires_at:now-100,status:'revoked',revoked_at:now-200,scopes:['media:read']},
  {id:'expired',name:'Old image reader',expires_at:now-100,status:'expired',scopes:['media:read']}
 ])
 await evaluate("document.querySelector('#drawer nav button:last-child').click()")
 await wait("document.querySelectorAll('.token-row').length===5")
 check('Dashboard status counts distinguish revoked, expired and expiring subset',await evaluate("[...document.querySelectorAll('.token-summary strong')].map(e=>e.textContent).join(',')==='3,2,1,1'"))
 await evaluate("document.querySelectorAll('.token-summary')[1].click()")
 await wait("document.querySelectorAll('.token-row').length===2")
 check('Summary filters the list without changing totals',await evaluate("document.querySelectorAll('.token-summary')[1].getAttribute('aria-pressed')==='true'&&document.querySelector('.token-list-heading p').textContent==='2 of 5 tokens'"))
 await evaluate("(()=>{const e=document.querySelector('#token-search');e.value='no matching name';e.dispatchEvent(new Event('input',{bubbles:true}))})()")
 await wait("document.querySelector('.token-empty h3')?.textContent==='No matching tokens'")
 await click('.token-empty md-text-button')
 await wait("document.querySelectorAll('.token-row').length===5")
 await evaluate("(()=>{const e=document.querySelector('#token-sort');e.value='name';e.dispatchEvent(new Event('change',{bubbles:true}))})()")
 check('Name sorting and clear filters work',await evaluate("document.querySelector('.token-row h3').textContent==='Campaign integration'&&document.querySelector('#token-filter').value==='all'"))
 await tokenDashboardChecks({send,evaluate,check,pause})
 await click('#create-token');await wait("!document.querySelector('#task md-filled-button').disabled")
 await evaluate("document.querySelector('#task .dialog-actions md-text-button').click()")
 await wait("!document.querySelector('#task').open")
 fixturePolicy=false
 await click('#create-token');await wait("!!document.querySelector('#task .error')")
 check('Missing authoritative policy disables saving with recovery guidance',await evaluate("document.querySelector('#task md-filled-button').disabled&&document.querySelector('#task .error').textContent.includes('policy is unavailable')"))
 await click('#task .dialog-actions md-text-button');await wait("!document.querySelector('#task').open");fixturePolicy=true
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false})
 await click('#open-drawer');await evaluate("[...document.querySelectorAll('#drawer .destination')].find(x=>x.textContent.endsWith('Objects')).click()");await wait("document.querySelector('#objects input')!==null");await click('#objects input');await pause(200)
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-production-fixture-mobile.png',Buffer.from(shot.data,'base64'))
 check('No runtime exceptions',errors.length===0)
 console.log(`${checks.length} built-frontend HTTP fixture checks passed (${requestCount} CSRF-backed requests). This is not live Nextcloud evidence.`)
}catch(e){console.error(e.message);console.error('Runtime errors:',JSON.stringify(errors));process.exitCode=1}finally{ws.close();server.closeAllConnections();server.close()}
