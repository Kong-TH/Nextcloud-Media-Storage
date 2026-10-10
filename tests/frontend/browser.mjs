// SPDX-License-Identifier: AGPL-3.0-or-later
// Built-frontend checks with an HTTP fixture server, not a Nextcloud deployment.
import {createServer} from 'node:http'
import {readFile,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import {chooseSelect,selectPopupChecks,tokenSelectChecks,selectEllipsisChecks} from './select-checks.mjs'
import {multiPickerChecks} from './picker-multi-checks.mjs'
import {folderReviewChecks} from './folder-review-checks.mjs'
import {detailChecks} from './detail-checks.mjs'
import {uploadChecks} from './upload-checks.mjs'
import {bucketChecks} from './bucket-checks.mjs'
import {navigationChecks} from './navigation-checks.mjs'
import {tokenFormChecks,tokenSecretChecks,tokenDashboardChecks} from './token-checks.mjs'
import {materialChecks,toolbarChecks,buttonSpacingChecks,pickerChecks} from './material-checks.mjs'
let sourceMode='baseline',importMode='normal';
let fixtureRevision=1;let next=1,requestCount=0;const nodeOffsets=[];const rows=[{id:'image',parent_id:'root',name:'Photo.png',node_type:'media',binding_status:'available',binding:{mime_type:'image/png',file_size:12,last_known_path:'Photo.png'}},{id:'folder',parent_id:'root',name:'Campaigns',node_type:'folder'}]
const appVersion=JSON.parse(await readFile('package.json','utf8')).version
let fixturePolicy=true,fixtureLifetime=3600,uploadMode='normal'
const uploads=new Map()
const buckets=[{id:'root',name:'Library',is_default:true}],tokens=[]
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data))}
 if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html','Content-Security-Policy':"default-src 'self'; script-src 'self' 'nonce-fixture'; style-src 'self'; img-src 'self' data:; connect-src 'self'"});res.end(`<!doctype html><html><head data-user="fixture" data-requesttoken="csrf-fixture"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/style.css"><script nonce="fixture">window._oc_webroot='';window.OC={config:{modRewriteWorking:false}};</script></head><body style="margin:0"><div id="mediastorage-root" data-version="${appVersion}"></div><script src="/app.js"></script></body></html>`);return}
 if(url.pathname==='/img/material-symbols-outlined.ttf'){res.writeHead(200,{'Content-Type':'font/ttf'});res.end(await readFile('img/material-symbols-outlined.ttf'));return}
 if(url.pathname==='/app.js'||url.pathname==='/style.css'){res.writeHead(200,{'Content-Type':url.pathname.endsWith('.js')?'application/javascript':'text/css'});res.end(url.pathname.endsWith('.js')?await readFile('js/mediastorage-main.js'):Buffer.concat([Buffer.from('html,body {height:100%;margin:0;} #mediastorage-root {height:100dvh;}'),await readFile('css/mediastorage.css')]));return}
 if(req.method==='PROPFIND'){
  const path=decodeURIComponent(url.pathname).split('/files/fixture/')[1]??''
  let entries=path===''?[{name:'Chosen.png',id:42},{name:'UI-picker',folder:true}]:path==='UI-picker'?[{name:'Deep folder with a very long name for narrow screens',folder:true}]:path==='UI-picker/Deep folder with a very long name for narrow screens'?[{name:'Leaf.png',id:43}]:[]
  if(sourceMode==='multi')entries=path===''?[{name:'A',folder:true,id:101},{name:'B',folder:true,id:102},{name:'one.png',id:103},{name:'two.png',id:104},{name:'bad.pdf',id:105,mime:'application/pdf'}]:path==='A'?[{name:'child.png',id:106},{name:'Sub',folder:true,id:107},{name:'skip.pdf',id:108,mime:'application/pdf'}]:path==='A/Sub'?[{name:'deep.png',id:109}]:[]
  if(sourceMode==='large')entries=path===''?Array.from({length:30},(_,i)=>({name:'large-'+i+'.png',id:200+i})):[]
  if(sourceMode==='conflict')entries=path===''?[{name:'A',folder:true,id:101},{name:'B',folder:true,id:102}]:[{name:'same.png',id:path==='A'?301:302}]
  if(sourceMode==='manyFolders')entries=path===''?Array.from({length:30},(_,i)=>({name:'Folder '+i,folder:true,id:400+i})):[]
  if(importMode==='slowPrepare'&&path==='A')await new Promise(r=>setTimeout(r,1000))
  if(importMode==='lostOnce'&&path==='A')await new Promise(r=>setTimeout(r,350))
  const xml=entries.map(f=>`<d:response><d:href>/remote.php/dav/files/fixture/${path?path+'/':''}${f.name}${f.folder?'/':''}</d:href><d:propstat><d:prop><d:displayname>${f.name}</d:displayname><d:getcontenttype>${f.folder?'httpd/unix-directory':f.mime??'image/png'}</d:getcontenttype><oc:fileid>${f.id??0}</oc:fileid><d:resourcetype>${f.folder?'<d:collection/>':''}</d:resourcetype></d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat></d:response>`).join('')
  res.writeHead(207,{'Content-Type':'application/xml'});res.end('<d:multistatus xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:response><d:href>'+url.pathname+'</d:href></d:response>'+xml+'</d:multistatus>');return
 }
 if(!url.pathname.includes('/api/v1/')){res.writeHead(404);res.end();return}
 requestCount++
 if(url.pathname.endsWith('/preview')){if(url.pathname.includes('/upload-')&&uploadMode!=='previewFail'){res.writeHead(200,{'Content-Type':'image/png'});res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64'));return}res.writeHead(404);res.end();return}
 if(req.headers.requesttoken!=='csrf-fixture'){send({error:'Missing CSRF'},403);return}
 const chunks=[];for await(const chunk of req)chunks.push(chunk);const raw=Buffer.concat(chunks)
 const path=url.pathname.split('/api/v1')[1]
 if(req.method!=='GET')fixtureRevision++
 if(path==='/uploads/policy'){send({max_bytes:1048576,mime_types:['image/png'],storage_pattern:'Media Storage/YYYY-MM-DD/'});return}
 if(path.startsWith('/uploads/')){send(uploads.get(path.split('/')[2])??{state:'not_received'});return}
 if(path==='/uploads'){
  const form=await new Response(raw,{headers:{'Content-Type':req.headers['content-type']}}).formData(),id=form.get('request_id')
  if(uploadMode==='proxy'){res.writeHead(413,{'Content-Type':'text/plain'});res.end('Request too large');return}
  if(uploadMode==='fail'){send({error:'Fixture storage temporarily unavailable.'},503);return}
  let record=uploads.get(id)
  if(!record){const n={id:'upload-'+next++,name:form.get('name'),parent_id:form.get('parent_id'),node_type:'media',binding_status:'available',binding:{mime_type:'image/png',nextcloud_file_id:900+next,file_size:form.get('file').size,last_known_path:'Media Storage/2026-10-10/fixture.png'}};rows.push(n);record={state:'complete',node:n};uploads.set(id,record)}
  if(uploadMode==='delay')await new Promise(r=>setTimeout(r,1500))
  if(uploadMode==='lost'){send({error:'Fixture response lost after commit.'},500);return}
  send(record);return
 }
 const body=raw.length?JSON.parse(raw.toString()):{}
 if(path==='/buckets'){if(req.method==='POST'){if(buckets.some(b=>b.name===body.name)){send({error:'Bucket name already exists.'},409);return}const b={id:'b'+next++,name:body.name,is_default:false};buckets.push(b);send(b,201)}else send({buckets,has_more:false});return}
 if(path.startsWith('/buckets/')){
  const id=path.split('/')[2],index=buckets.findIndex(b=>b.id===id)
  if(index<0){send({error:'Bucket not found'},404);return}
  if(req.method==='PATCH'){if(buckets.some(b=>b.id!==id&&b.name===body.name)){send({error:'Bucket name already exists'},409);return}buckets[index].name=body.name;send(buckets[index]);return}
  if(req.method==='DELETE'&&buckets[index].is_default){send({error:'Default bucket cannot be removed'},403);return}
  const ids=new Set([id]);let previous=0;while(previous!==ids.size){previous=ids.size;for(const row of rows)if(ids.has(row.parent_id))ids.add(row.id)}
  for(let i=rows.length-1;i>=0;i--)if(ids.has(rows[i].id))rows.splice(i,1)
  if(req.method==='DELETE')buckets.splice(index,1);send(null,204);return
 }
 if(path==='/nodes'){
  const parent=url.searchParams.get('parent_id')??'root',query=url.searchParams.get('search')??'',paged=url.searchParams.get('paged')==='true'
  const offset=Number(url.searchParams.get('offset')??0),limit=Number(url.searchParams.get('limit')??100);nodeOffsets.push(offset)
  if(paged&&url.searchParams.has('revision')&&Number(url.searchParams.get('revision'))!==fixtureRevision){send({error:'This collection changed. Reload objects to continue.'},409);return}
  const matching=rows.filter(r=>r.parent_id===parent&&r.name.includes(query))
  if(paged)matching.sort((a,b)=>(url.searchParams.get('sort')==='type'?(a.node_type==='folder'?'Folder':'Image').localeCompare(b.node_type==='folder'?'Folder':'Image'):0)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id))
  const items=matching.slice(offset,offset+limit)
  send({root_id:'root',nodes:items,parent_id:parent,...(paged?{total:matching.length,revision:fixtureRevision,next_offset:offset+items.length,has_more:offset+items.length<matching.length}:{})});return
 }
 if(path==='/imports/entries'){const id='import-'+body.request_id+'-'+body.file_id,old=rows.find(n=>n.id===id);if(old){send(old);return}if(importMode==='denySecond'&&rows.some(n=>n.id.startsWith('import-'+body.request_id+'-'))){send({error:'Source permission was revoked'},403);return}if(rows.some(n=>n.parent_id===body.parent_id&&n.name===body.name)){send({error:'Destination name already exists'},409);return}const n={id,name:body.name,parent_id:body.parent_id,node_type:body.folder?'folder':'media',...(!body.folder?{binding_status:'available',binding:{mime_type:'image/png',nextcloud_file_id:body.file_id,last_known_path:'Chosen.png',file_size:12}}:{})};rows.push(n);if(importMode==='lostOnce'){importMode='normal';send({error:'Connection lost after commit'},500);return}if(importMode==='slow')await new Promise(r=>setTimeout(r,200));send(n);return}
 if(path==='/folders'||path==='/bindings'){const n={id:'n'+next++,name:body.name,parent_id:body.parent_id,node_type:path==='/folders'?'folder':'media',...(path==='/bindings'?{binding_status:'available',binding:{mime_type:'image/png',nextcloud_file_id:body.file_id,last_known_path:'Chosen.png',file_size:12}}:{})};rows.push(n);send(n,201);return}
 if(path==='/tokens'){if(req.method==='POST'){const token={id:'t'+next++,name:body.name,scopes:body.scopes,expires_at:body.expires_at,status:'active',created_at:Math.floor(Date.now()/1000),folder_id:body.folder_id,last_used_at:null};tokens.push(token);send({token,secret:'fixture-only-secret'},201)}else send({tokens:tokens.slice(Number(url.searchParams.get('offset')??0),Number(url.searchParams.get('offset')??0)+Number(url.searchParams.get('limit')??100)),...(fixturePolicy?{policy:{server_time:Math.floor(Date.now()/1000),max_lifetime_seconds:fixtureLifetime}}:{})});return}
 if(path.startsWith('/tokens/')){const t=tokens.find(t=>t.id===path.split('/')[2]);if(req.method==='DELETE'){t.status='revoked';send(null,204)}else send({token:t,secret:'fixture-rotation-secret'},201);return}
 const id=path.split('/')[2],node=rows.find(r=>r.id===id)
 if(!node){send({error:'Node not found'},404);return}
 if(path.endsWith('/copy')){const n={...structuredClone(node),id:'n'+next++,name:body.name??node.name,parent_id:body.parent_id};rows.push(n);send(n,201);return}
 if(req.method==='PATCH'){Object.assign(node,body);send(node);return}
 if(req.method==='DELETE'){rows.splice(rows.indexOf(node),1);send(null,204);return}
 if(uploadMode==='locationFail'&&id.startsWith('upload-')){send({error:'Fixture location unavailable.'},503);return}
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
async function click(selector,scroll=true){const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el||el.disabled||!el.getClientRects().length)throw new Error('Unavailable target: '+${JSON.stringify(selector)});${scroll?"el.scrollIntoView({block:'nearest'});":''}const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});await pause(60)}
async function input(value){await evaluate(`(()=>{const input=document.querySelector('#task input:not([type=checkbox])');input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}))})()`)}
try{
 await send('Runtime.enable');errors.length=0;await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await send('Page.navigate',{url:base});await wait('location.origin==='+JSON.stringify(base));await wait("document.querySelectorAll('#objects li').length===2")
 const beforePickerNext=next
 if(!process.argv.includes('--selection-only'))await multiPickerChecks({send,evaluate,click,wait,check,pause,setSources:mode=>{sourceMode=mode},setImport:mode=>{importMode=mode},getRows:()=>rows})
 if(!process.argv.includes('--selection-only'))await folderReviewChecks({send,evaluate,click,wait,check,pause,setSources:mode=>{sourceMode=mode},setImport:mode=>{importMode=mode},getRows:()=>rows})
 next=beforePickerNext
 if(!process.argv.includes('--picker-only')){
 if(!process.argv.includes('--selection-only')){
 check('Real Vue mount renders server rows',await evaluate("document.querySelector('#objects').textContent.includes('Photo.png')"))
 check('Drawer footer shows supplied version only',await evaluate("document.querySelector('.drawer-footer').textContent.trim()=== "+JSON.stringify('v'+appVersion)+"&&!document.querySelector('#media-design').textContent.includes('Your media, organized.')&&!document.querySelector('#media-design').textContent.includes('Files stay in Nextcloud.')"))
 await buttonSpacingChecks({evaluate,check})
 check('Material primitive registered',await evaluate("!!customElements.get('md-filled-button')"))
 await detailChecks({send,evaluate,click,wait,check,pause});await materialChecks({send,evaluate,check,pause})
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
 await click('#fab');await click('#fab-menu button[data-tip="Reference an existing Nextcloud file"]');await wait("document.querySelector('.file-picker button')!==null");await pickerChecks({send,evaluate,check,pause,click,wait},'Chosen.png');await click('#task md-filled-button');await wait("document.querySelector('#objects').textContent.includes('Chosen.png')")
 check('DAV picker binds selected file ID',rows.some(n=>n.binding?.nextcloud_file_id===42))
 await evaluate("[...document.querySelectorAll('#objects input')].find(x=>x.getAttribute('aria-label')==='Select Chosen.png').click()");await click('#action-rename');await input('Alias.png');await click('#task md-filled-button');await wait("document.querySelector('#objects').textContent.includes('Alias.png')")
 check('Rename updates virtual name',rows.some(n=>n.name==='Alias.png'&&n.binding.nextcloud_file_id===42))
 await evaluate("[...document.querySelectorAll('#objects input')].find(x=>x.getAttribute('aria-label')==='Select Alias.png').click()");await click('#action-copy');await click('#action-paste');await input('Copied.png');await click('#task md-filled-button');await wait("document.querySelector('#objects').textContent.includes('Copied.png')")
 check('Copy creates independent reference identity',rows.filter(n=>n.binding?.nextcloud_file_id===42).length===2)
 await click('#cancel-selection');await click('#open-drawer');await evaluate("[...document.querySelectorAll('#drawer .destination')].find(x=>x.textContent.includes('API tokens')).click()");await wait("document.querySelector('#tokens md-filled-button')!==null");await click('#tokens md-filled-button');await wait("!document.querySelector('#task md-filled-button').disabled");await input('Read integration');await selectPopupChecks({send,evaluate,click,wait,check,pause},'#token-boundary',{shot:'boundary-select'});await chooseSelect({evaluate,click,wait,check},'#token-boundary','root');check('Bucket-scoped token disables token management',await evaluate("[...document.querySelectorAll('.scope-options input')].find(e=>e.value==='token:manage').disabled"));await chooseSelect({evaluate,click,wait,check},'#token-boundary','');await tokenFormChecks({evaluate,check,click,wait});check('Non-default one-hour policy bounds the suggested expiry',await evaluate("new Date(document.querySelector('#token-expiry').max).getTime()-Date.now()<=3600000"));await click('#task md-filled-button');await wait("document.querySelector('.secret')!==null")
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
 await selectPopupChecks({send,evaluate,click,wait,check,pause},'#token-filter',{shot:'token-filter-select'});await chooseSelect({evaluate,click,wait,check},'#token-filter','expired');check('Material status filter changes visible tokens',await evaluate("document.querySelectorAll('.token-row').length===1&&document.querySelector('.token-row h3').textContent==='Old image reader'"));await chooseSelect({evaluate,click,wait,check},'#token-filter','all');await chooseSelect({evaluate,click,wait,check},'#token-sort','name')
 check('Name sorting and clear filters work',await evaluate("document.querySelector('.token-row h3').textContent==='Campaign integration'&&document.querySelector('#token-filter').value==='all'"))
 await tokenDashboardChecks({send,evaluate,check,pause});await tokenSelectChecks({send,evaluate,click,wait,check,pause});await selectEllipsisChecks({send,evaluate,click,wait,check,pause})
 await click('#create-token');await wait("!document.querySelector('#task md-filled-button').disabled")
 await evaluate("document.querySelector('#token-boundary').focus()")
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})
 await wait("!document.querySelector('#task').open")
 check('Closed Material field permits parent dialog Escape',await evaluate("!document.querySelector('#task').open"))
 fixturePolicy=false
 await click('#create-token');await wait("!!document.querySelector('#task .error')")
 check('Missing authoritative policy disables saving with recovery guidance',await evaluate("document.querySelector('#task md-filled-button').disabled&&document.querySelector('#task .error').textContent.includes('policy is unavailable')"))
 await click('#task .dialog-actions md-text-button');await wait("!document.querySelector('#task').open");fixturePolicy=true
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false})
 await click('#open-drawer');await evaluate("[...document.querySelectorAll('#drawer .destination')].find(x=>x.textContent.endsWith('Objects')).click()");await wait("document.querySelector('#objects input')!==null");
 await bucketChecks({send,evaluate,check,wait,click,pause,name:'Brand'})
 await uploadChecks({send,evaluate,check,wait,click,pause,setMode:mode=>{uploadMode=mode}})
 for(let i=0;i<205;i++)rows.push({id:'pagination-'+i,parent_id:'root',name:'Paged '+String(i).padStart(3,'0'),node_type:'folder'})
 await navigationChecks({send,evaluate,check,wait,click,pause})
 await wait("document.querySelectorAll('#objects li').length===25&&!document.querySelector('#objects').getAttribute('aria-busy').includes('true')")
 check('Initial collection fetch loads only 25 of 205 objects',await evaluate("document.querySelector('#count').textContent==='25 of 205 objects'"))
 await click('#objects input')
 await evaluate("window.__pagingFetch=window.fetch;window.__pagingFail=true;window.fetch=async(input,options)=>{if(window.__pagingFail&&String(input).includes('paged=true')&&String(input).includes('offset=25')){window.__pagingFail=false;return new Response(JSON.stringify({error:'Append unavailable.'}),{status:503,headers:{'Content-Type':'application/json'}})}return window.__pagingFetch(input,options)}")
 await evaluate("document.querySelector('#main-scroll').scrollTop=100000");await wait("document.querySelector('#object-page-end .error')?.textContent.includes('Append unavailable')")
 check('Append failure keeps the first 25 rows and selection',await evaluate("document.querySelectorAll('#objects li').length===25&&document.querySelectorAll('#objects input:checked').length===1"))
 await click('#object-page-end .error md-text-button');await wait("document.querySelectorAll('#objects li').length===50")
 check('Append retry adds the next 25 rows without losing selection',await evaluate("document.querySelector('#selected-count').textContent==='1 selected'&&new Set([...document.querySelectorAll('#objects .object-name')].map(n=>n.id)).size===50"))
 await evaluate('window.fetch=window.__pagingFetch;delete window.__pagingFetch')
 fixtureRevision++
 await evaluate("document.querySelector('#main-scroll').scrollTop=100000");await wait("document.querySelector('#object-page-end .error')?.textContent.includes('collection changed')")
 check('Changed server revision preserves rows and offers explicit reload',await evaluate("document.querySelectorAll('#objects li').length===50&&document.querySelector('#object-page-end .error md-text-button').textContent==='Reload objects'"))
 await click('#object-page-end .error md-text-button');await wait("document.querySelectorAll('#objects li').length===25&&document.querySelector('#objects').getAttribute('aria-busy')==='false'")
 check('Collection reload clears obsolete selection and starts at 25',await evaluate("!document.querySelector('#selected-count')&&!document.querySelector('#object-page-end .error')"))
 await click('#objects input');await evaluate("document.querySelector('#main-scroll').scrollTop=100000");await wait("document.querySelectorAll('#objects li').length===50")
 for(let expected=75;expected<=205;expected=Math.min(expected+25,205)){
  await evaluate("document.querySelector('#main-scroll').scrollTop=100000")
  await wait(`document.querySelectorAll('#objects li').length===${expected}`)
  if(expected===205)break
 }
 check('Scroll end appends all batches with accurate total',nodeOffsets.includes(25)&&nodeOffsets.includes(200)&&await evaluate("document.querySelector('#count').textContent==='205 of 205 objects'&&!document.querySelector('#object-page-end md-text-button')"))
 check('Append retains selected object after all pages',await evaluate("document.querySelectorAll('#objects input:checked').length===1"))

 await evaluate("document.querySelector('#main-scroll').scrollTop=3200");await pause(80)
 const scrollHash=await evaluate('location.hash')
 await evaluate("[...document.querySelectorAll('#drawer .destination')].find(e=>e.textContent.endsWith('API tokens')).click()");await wait("document.querySelector('#tokens')?.getAttribute('aria-busy')==='false'")
 await evaluate('history.back()');await wait(`location.hash===${JSON.stringify(scrollHash)}&&document.querySelectorAll('#objects li').length===50`);await pause(80)
 check('Back restores list scroll after paginated loading',await evaluate("Math.abs(document.querySelector('#main-scroll').scrollTop-3200)<2"))
 await send('Page.reload');await wait("document.querySelectorAll('#objects li').length===50&&document.querySelector('#fab').getAttribute('aria-disabled')==='false'");await pause(80)
 check('Reload restores saved list scroll',await evaluate("Math.abs(document.querySelector('#main-scroll').scrollTop-3200)<2"))

 }
 // UI-14: the descriptor selects 100 rows while rendering just 25.
 for(let i=0;i<100;i++)rows.push({id:'bulk-'+i,parent_id:'root',name:'Bulk '+String(i).padStart(3,'0'),node_type:'folder'})
 rows.push({id:'bulk-dest',parent_id:'root',name:'Destination',node_type:'folder'});fixtureRevision++
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
 async function bulkSearch(){await evaluate("(()=>{const input=document.querySelector('#search-form input');input.value='Bulk ';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#search-form').requestSubmit()})()");await wait("document.querySelector('#count').textContent==='25 of 100 objects'&&document.querySelector('#objects').getAttribute('aria-busy')==='false'")}
 async function scope(mode){await click('#selection-scope');await wait("document.querySelector('#selection-scope').getAttribute('aria-expanded')==='true'&&document.activeElement.tagName==='MD-MENU-ITEM'");await click('#selection-menu md-menu-item:nth-child('+ (mode==='all'?2:1)+')');await wait("document.querySelector('#selection-scope').getAttribute('aria-expanded')==='false'")}
 await bulkSearch();await click('#select-all')
 check('Loaded select all captures 25 of 100',await evaluate("document.querySelector('#selected-count').textContent==='25 selected'&&document.querySelector('#select-all').checked"))
 await evaluate("document.querySelector('#main-scroll').scrollTop=100000");await wait("document.querySelectorAll('#objects li').length===50")
 check('Loaded selection never auto-selects appended rows',await evaluate("document.querySelectorAll('#objects input:checked').length===25&&document.querySelector('#select-all').indeterminate"))
 await click('#cancel-selection');await bulkSearch();const beforeAll=requestCount
 await scope('all')

 check('All mode selects 100 without fetching unrendered rows',requestCount===beforeAll&&await evaluate("document.querySelector('#selected-count').textContent==='100 selected'&&document.querySelectorAll('#objects li').length===25"))
 await click('#objects input')
 check('One exclusion produces mixed state and count 99',await evaluate("document.querySelector('#selected-count').textContent==='99 selected'&&document.querySelector('#select-all').indeterminate"))
 await evaluate("document.querySelector('#main-scroll').scrollTop=100000");await wait("document.querySelectorAll('#objects li').length===50")
 check('All mode selects appended rows and retains exclusions',await evaluate("document.querySelectorAll('#objects input:checked').length===49"))
 await evaluate("window.__selectionFetch=window.fetch;window.fetch=async(input,options)=>{if(String(input).includes('paged=true')&&String(input).includes('offset=25'))await new Promise(r=>setTimeout(r,600));return window.__selectionFetch(input,options)}")
 await click('#action-copy');check('Preparation shows Material progress and blocks repeat input',await evaluate("!!document.querySelector('.selection-progress md-linear-progress')&&document.querySelector('#select-all').disabled&&document.querySelector('#object-sort').disabled"));await wait("document.querySelector('#clipboard-count')?.textContent==='99 copied'");await evaluate('window.fetch=window.__selectionFetch;delete window.__selectionFetch')
 check('Copy resolves unloaded names and IDs without rendering them',await evaluate("document.querySelectorAll('#objects li').length===50&&document.querySelector('#selected-count').textContent==='99 selected'"))
 // Navigate with the complete clipboard, then paste all 99 references.
 await evaluate("(()=>{const input=document.querySelector('#search-form input');input.value='Destination';input.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#search-form').requestSubmit()})()");await wait("document.querySelectorAll('#objects li').length===1");await click('#objects .object-name');await wait("document.querySelector('#count').textContent==='0 of 0 objects'")
 await click('#action-paste');await wait("document.querySelector('#task').open");await click('#task md-filled-button');await wait("!document.querySelector('#task').open")
 check('Paste includes all unloaded references',rows.filter(n=>n.parent_id==='bulk-dest').length===99)
 await evaluate("document.querySelector('#path-row md-text-button').click()");await wait("document.querySelector('#objects').getAttribute('aria-busy')==='false'")
 await click('#cancel-selection');await bulkSearch();await scope('all');fixtureRevision++
 await click('#action-copy');await wait("document.querySelector('.selection-error')?.textContent.includes('collection changed')")
 check('Stale descriptor preserves selection and does not change clipboard',await evaluate("document.querySelector('#selected-count').textContent==='100 selected'&&!document.querySelector('#clipboard-count')&&document.querySelector('.selection-error md-text-button').textContent==='Reload objects'"))
 await click('.selection-error md-text-button');await wait("document.querySelector('#objects').getAttribute('aria-busy')==='false'")
 // Re-select and exercise narrow/RTL official menu geometry and Escape.
 for(const width of [1440,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await pause(100)
  await scope('loaded');await click('#selection-scope');await wait("document.querySelector('#selection-scope').getAttribute('aria-expanded')==='true'&&document.activeElement.tagName==='MD-MENU-ITEM'")
  check('Select all and scope arrow share the column header '+width,await evaluate("(()=>{const c=document.querySelector('.column-head'),a=document.querySelector('#select-all'),b=document.querySelector('#selection-scope');return !document.querySelector('.selection-controls')&&c.contains(a)&&c.contains(b)&&Math.abs(a.getBoundingClientRect().top+a.getBoundingClientRect().height/2-b.getBoundingClientRect().top-b.getBoundingClientRect().height/2)<1&&c.getBoundingClientRect().height<=49})()"))
  check('Official selection menu fits viewport '+width,await evaluate("(()=>{const r=document.querySelector('#selection-menu').getBoundingClientRect();return r.width>0&&r.left>=document.querySelector('#objects').getBoundingClientRect().left-1&&r.right<=document.querySelector('#objects').getBoundingClientRect().right+1&&r.bottom<=innerHeight})()"))
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait("!document.querySelector('#selection-menu').open&&document.querySelector('#selection-scope').getAttribute('aria-expanded')==='false'")
  check('Escape closes selection menu without losing selection '+width,await evaluate("!document.querySelector('#selection-menu').open&&document.querySelector('#selected-count').textContent==='25 selected'"))
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await pause(120)
 await evaluate("document.querySelector('#media-design').dir='rtl';document.querySelector('#media-design').classList.add('dark')")
 await click('#selection-scope');await wait("document.querySelector('#selection-scope').getAttribute('aria-expanded')==='true'&&document.activeElement.tagName==='MD-MENU-ITEM'")
 check('RTL selection menu remains inside compact viewport',await evaluate("(()=>{const r=document.querySelector('#selection-menu').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&getComputedStyle(document.querySelector('#selection-menu')).direction==='rtl'})()"))
 await writeFile('/tmp/mediastorage-selection-menu-mobile.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await wait("document.querySelector('#selected-count')?.textContent==='100 selected'&&!document.querySelector('#selection-menu').open")
 check('Official check and select-all font ligatures are present',await evaluate("(()=>{const c=document.createElement('canvas').getContext('2d');c.font='24px \"Material Symbols Outlined\"';return ['check','select_all'].every(name=>Math.abs(c.measureText(name).width-24)<1)})()"))
 check('Keyboard selects all-matching mode',await evaluate("document.querySelector('.select-all').textContent.includes('All matching objects')"))
 await evaluate("document.querySelector('#media-design').dir='ltr';document.querySelector('#media-design').classList.remove('dark')")
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(150)
 await scope('all');await click('#objects input');await click('#action-remove');await wait("document.querySelector('#task').open");check('Remove confirms the full selection',await evaluate("document.querySelector('#task').textContent.includes('Remove 99 selected')"));await evaluate("window.__removeFetch=window.fetch;window.__removeCount=0;window.fetch=async(input,options)=>{if(options?.method==='DELETE'&&++window.__removeCount===2)return new Response(JSON.stringify({error:'Permission changed.'}),{status:403,headers:{'Content-Type':'application/json'}});return window.__removeFetch(input,options)}");await click('#task md-filled-button');await wait("document.querySelector('#task .error')?.textContent.includes('1 item(s) saved before this error')");check('Partial failure retains unloaded remaining IDs',await evaluate("document.querySelector('#selected-count').textContent==='98 selected'"));await evaluate('window.fetch=window.__removeFetch;delete window.__removeFetch');await click('#task md-filled-button');await wait("!document.querySelector('#task').open")
 check('Remove affects unloaded selected links and keeps exclusion',rows.filter(n=>n.name.startsWith('Bulk ')&&n.parent_id==='root').length===1)
 check('Copy destination links remain independent',rows.filter(n=>n.parent_id==='bulk-dest').length===99)
 // A second isolated collection exercises Move and a single unloaded Rename.
 buckets.push({id:'bulk-move',name:'Move source',is_default:false},{id:'bulk-target',name:'Move target',is_default:false})
 for(let i=0;i<30;i++)rows.push({id:'move-'+i,parent_id:'bulk-move',name:'Move '+String(i).padStart(2,'0'),node_type:'folder'})
 fixtureRevision++;await send('Page.reload');await wait("!!document.querySelector('#bucket-bulk-move')")
 check('Reload never restores a bulk selection',await evaluate("!document.querySelector('#selected-count')"))
 await click('#bucket-bulk-move');await wait("document.querySelector('#count').textContent==='25 of 30 objects'");await scope('all');await click('#action-move');await wait("document.querySelector('#task').open&&!document.querySelector('#task md-filled-button').disabled")
 await selectPopupChecks({send,evaluate,click,wait,check,pause},'#move-destination',{shot:'move-select'});await chooseSelect({evaluate,click,wait,check},'#move-destination','bulk-target');await click('#task md-filled-button');await wait("!document.querySelector('#task').open")
 check('Move affects all 30 selected objects, including five unloaded',rows.filter(n=>n.parent_id==='bulk-target').length===30&&rows.filter(n=>n.parent_id==='bulk-move').length===0)
 await click('#bucket-bulk-target');await wait("document.querySelector('#count').textContent==='25 of 30 objects'");await scope('all');await evaluate("document.querySelector('#main-scroll').scrollTop=100000");await wait("document.querySelectorAll('#objects li').length===30")
 await evaluate("[...document.querySelectorAll('#objects input')].slice(0,29).forEach(e=>e.click())");await wait("document.querySelector('#selected-count').textContent==='1 selected'")
 await chooseSelect({evaluate,click,wait,check},'#object-sort','type');await wait("document.querySelector('#count').textContent==='25 of 30 objects'")
 check('Sort retains one selected object outside the rendered page',await evaluate("document.querySelector('#selected-count').textContent==='1 selected'&&document.querySelectorAll('#objects input:checked').length===0"))
 await click('#action-rename');await wait("document.querySelector('#task').open");check('Rename resolves the unloaded object name',await evaluate("document.querySelector('#task input').value==='Move 29'"));await input('Renamed unloaded');await click('#task md-filled-button');await wait("!document.querySelector('#task').open")
 check('Rename changes exactly the unloaded object',rows.find(n=>n.id==='move-29').name==='Renamed unloaded')

 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});if(await evaluate("!!document.querySelector('#objects input')"))await click('#objects input');await pause(200)
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-production-fixture-mobile.png',Buffer.from(shot.data,'base64'))
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(150);await click('#objects md-icon-button');await wait("!!document.querySelector('#detail-name')")
 check('Details panel keeps selection inside the single header row',await evaluate("(()=>{const h=document.querySelector('.column-head'),row=document.querySelector('#objects li');return h.contains(document.querySelector('#select-all'))&&h.contains(document.querySelector('#selection-scope'))&&h.getBoundingClientRect().height<=49&&Math.abs(row.getBoundingClientRect().top-h.getBoundingClientRect().bottom)<1})()"))
 await writeFile('/tmp/mediastorage-selection-header-desktop.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
 // Sticky headers use their own scrollports and retain live controls.
 for(const width of [1440,390]){
  if(width===390)await evaluate("document.querySelector('#media-design').classList.add('dark');document.querySelector('#media-design').dir='rtl'")
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await pause(100)
  if(await evaluate("!!document.querySelector('#details')"))await click('#close-detail')
  await evaluate("document.querySelector('#main-scroll').scrollTop=600");await pause(100)
  check('Object summary and columns remain at scrollport top '+width,await evaluate("(()=>{const h=document.querySelector('.object-headers'),s=document.querySelector('#main-scroll'),a=h.querySelector('.collection-heading').getBoundingClientRect(),c=h.querySelector('.column-head').getBoundingClientRect();return s.scrollTop>=600&&Math.abs(h.getBoundingClientRect().top-s.getBoundingClientRect().top)<1&&a.top>=s.getBoundingClientRect().top&&Math.abs(a.bottom-c.top)<1&&!!h.querySelector('#count')&&!!h.querySelector('.sort')&&getComputedStyle(h).backgroundColor!=='rgba(0, 0, 0, 0)'})()"))
  await selectPopupChecks({send,evaluate,click,wait,check,pause},'#object-sort',{scroll:true,shot:'object-sort-'+width})
  const stickyScroll=await evaluate("document.querySelector('#main-scroll').scrollTop")
  await click('#selection-scope',false);await wait("document.querySelector('#selection-scope').getAttribute('aria-expanded')==='true'&&document.activeElement.tagName==='MD-MENU-ITEM'")
  check('Scope menu opens above the scrolled sticky header '+width,await evaluate("(()=>{const m=document.querySelector('#selection-menu').getBoundingClientRect();return document.querySelector('#selection-menu').open&&m.top>=0&&m.bottom<=innerHeight})()"))
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait("!document.querySelector('#selection-menu').open&&document.querySelector('#selection-scope').getAttribute('aria-expanded')==='false'")
  check('Using the sticky scope control preserves list scroll '+width,await evaluate("document.querySelector('#main-scroll').scrollTop")===stickyScroll)
  await writeFile('/tmp/mediastorage-sticky-objects-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
  await click('#objects md-icon-button');await wait("!!document.querySelector('#details')")
  check('Details metadata uses compact icon rows '+width,await evaluate("(()=>{const d=document.querySelector('#details'),rows=[...d.querySelectorAll('.detail-fact')];return rows.length>=4&&rows.every(r=>r.querySelector('dt md-icon')&&r.querySelector('dt').textContent.trim()&&r.querySelector('dd').textContent.trim())&&getComputedStyle(d.querySelector('.detail-facts')).gap==='16px'&&rows.filter(r=>r.classList.contains('compact')).every(r=>r.getBoundingClientRect().height<=48)})()"))
  await writeFile('/tmp/mediastorage-detail-facts-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
  // Fixture a long path in the existing content cell, without changing production markup.
  await evaluate("(()=>{const d=document.querySelector('#details');d.querySelector('dd:last-child').textContent=Array(200).fill('long-virtual-folder').join('/');d.scrollTop=d.scrollHeight})()");await pause(100)
  check('Details close header remains visible at scroll end '+width,await evaluate("(()=>{const d=document.querySelector('#details'),h=d.querySelector('.detail-top'),c=document.querySelector('#close-detail'),r=c.getBoundingClientRect();return d.scrollTop>0&&h.getBoundingClientRect().height>=72&&parseFloat(getComputedStyle(h).paddingTop)>=12&&Math.abs(h.getBoundingClientRect().top-d.getBoundingClientRect().top)<1&&r.top>=d.getBoundingClientRect().top&&r.bottom<=d.getBoundingClientRect().bottom&&document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)===c})()"))
  await writeFile('/tmp/mediastorage-sticky-details-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
  await click('#close-detail');await wait("!document.querySelector('#details')")
  check('Sticky Close remains clickable after scrolling '+width,await evaluate("!document.querySelector('#details')"))
 }
 }
 check('No runtime exceptions',errors.length===0)
 console.log(`${checks.length} built-frontend HTTP fixture checks passed (${requestCount} CSRF-backed requests). This is not live Nextcloud evidence.`)
}catch(e){console.error(e.stack);console.error(await evaluate("JSON.stringify({task:document.querySelector('#task')?.open,fabHidden:document.querySelector('#fab-area')?.hidden,menuHidden:document.querySelector('#fab-menu')?.hidden,page:location.hash,objects:document.querySelector('#objects')?.textContent,buttons:[...document.querySelectorAll('#objects md-icon-button')].map(e=>({label:e.getAttribute('aria-label'),disabled:e.disabled,rect:e.getBoundingClientRect().toJSON()})),dialog:document.querySelector('#task')?.textContent.slice(0,100)})"));console.error('Runtime errors:',JSON.stringify(errors));process.exitCode=1}finally{ws.close();server.closeAllConnections();server.close()}
