// SPDX-License-Identifier: AGPL-3.0-or-later
import {writeFile} from 'node:fs/promises'
import {chooseSelect,selectPopupChecks} from './select-checks.mjs'
export async function folderReviewChecks(context){
 const {send,evaluate,click,wait,check,pause,setSources,setImport,getRows}=context
 const source=name=>'.file-picker input[aria-label="Select source '+name+'"]'
 const mode=id=>'.import-folder-choice md-outlined-select[data-source-id="'+id+'"]'
 const call=async(path,method='GET',body)=>evaluate(`fetch('/index.php/apps/mediastorage/api/v1'+${JSON.stringify(path)},{method:${JSON.stringify(method)},headers:{requesttoken:document.head.dataset.requesttoken,'Content-Type':'application/json'},${body?'body:JSON.stringify('+JSON.stringify(body)+'),':''}}).then(async r=>{if(!r.ok)throw new Error('Review fixture request failed');return r.status===204?null:r.json()})`)
 const base=await evaluate('location.origin'),back=await evaluate('location.hash')
 async function open(){await wait("document.querySelector('#fab').getAttribute('aria-disabled')==='false'");await pause(120);await click('#fab');await wait("!document.querySelector('#fab-menu').hidden");await click('#fab-menu button[data-tip="Reference an existing Nextcloud file"]');await wait("!!document.querySelector('.file-picker input')&&!document.querySelector('#picker-select-all').disabled")}
 async function start(name,sourceMode='multi'){
  setSources(sourceMode);setImport('normal');const bucket=await call('/buckets','POST',{name})
  await send('Page.navigate',{url:base+'/#ms:bucket='+bucket.id});await wait(`document.querySelector('#main h1')?.textContent===${JSON.stringify(name)}&&document.querySelector('#fab').getAttribute('aria-disabled')==='false'`)
  await open();return bucket.id
 }
 async function review(){await click('#task md-filled-button');await wait("!!document.querySelector('.import-folder-choice')")}
 async function prepare(){await click('#task md-filled-button');await wait("!!document.querySelector('#import-plan-count')&&!document.querySelector('#task md-filled-button').disabled")}
 async function add(){await click('#task md-filled-button');await wait("!document.querySelector('#task').open&&document.querySelector('#fab').getAttribute('aria-disabled')==='false'")}
 async function cleanup(id){if(await evaluate("document.querySelector('#task').open")){await click('#task .dialog-actions md-text-button');await wait("!document.querySelector('#task').open")};await call('/buckets/'+id,'DELETE')}
 for(const [a,b,count] of [['contents','keep',4],['keep','contents',4],['contents','contents',3]]){
  const id=await start('Review '+a+' '+b);await click(source('A'));await click(source('B'));await review()
  check('Review starts with Keep folder defaults',await evaluate("[...document.querySelectorAll('.import-folder-choice md-outlined-select')].every(s=>s.value==='keep')"))
  if(a!=='keep')await chooseSelect(context,mode(101),a)
  if(b!=='keep')await chooseSelect(context,mode(102),b)
  if(a==='contents'&&b==='keep'){
   await selectPopupChecks(context,mode(101),{shot:'folder-choice-menu'})
   for(const width of [1440,390,320]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${width!==1440});document.querySelector('#media-design').dir=${JSON.stringify(width===320?'rtl':'ltr')}`);await pause(100)
    check('Folder choice review fits '+width,await evaluate("(()=>{const d=document.querySelector('#task'),r=d.getBoundingClientRect(),s=document.querySelector('.import-review-list');return d.scrollWidth<=d.clientWidth&&s.scrollWidth<=s.clientWidth&&r.left>=15&&r.right<=innerWidth-15&&document.querySelectorAll('dialog[open]').length===1})()"))
  check('Folder review heading retains theme color at '+width,await evaluate("getComputedStyle(document.querySelector('#import-review-heading')).color===getComputedStyle(document.querySelector('#media-design')).color"))
    await writeFile('/tmp/mediastorage-folder-review-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
   }
   await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('#media-design').classList.remove('dark');document.querySelector('#media-design').dir='ltr'")
  }
  await prepare()
  check('Prepared mixed modes show exact destinations before writes '+a+'/'+b,!getRows().some(n=>n.parent_id===id)&&await evaluate(`document.querySelector('#import-plan-count').textContent.startsWith(${JSON.stringify(count+' virtual')})&&document.querySelector('.import-preview').textContent.includes(${JSON.stringify(a==='contents'?'/Sub/deep.png':'/A/Sub/deep.png')})`))
  await click('#import-edit');await wait("!!document.querySelector('.import-folder-choice')")
  check('Edit choices preserves independent modes',await evaluate(`document.querySelector(${JSON.stringify(mode(101))}).value===${JSON.stringify(a)}&&document.querySelector(${JSON.stringify(mode(102))}).value===${JSON.stringify(b)}`))
  await prepare();await add()
  const roots=getRows().filter(n=>n.parent_id===id),sub=getRows().find(n=>n.name==='Sub'&&(roots.some(r=>r.id===n.id)||roots.some(r=>r.id===n.parent_id)))
  check('Mixed import keeps nested folder structure '+a+'/'+b,!!sub&&getRows().some(n=>n.name==='deep.png'&&n.parent_id===sub.id)&&roots.some(n=>n.name===(a==='contents'?'child.png':'A'))&&roots.some(n=>n.name==='B')===(b==='keep'))
  if(b==='contents')check('Empty flattened folder is reported',await evaluate("document.querySelector('#main .status').textContent.includes('no supported contents')"))
  await cleanup(id)
 }
 let id=await start('Review conflicts','conflict');await click('#picker-select-all');await review();await chooseSelect(context,mode(101),'contents');await chooseSelect(context,mode(102),'contents')
 await click('#task md-filled-button');await wait("document.querySelector('#task .error')?.textContent.includes('Destination name conflict')")
 check('Two flattened roots cannot overwrite duplicate names',!getRows().some(n=>n.parent_id===id)&&await evaluate("!document.querySelector('#import-plan-count')"))
 await chooseSelect(context,mode(102),'keep');await call('/folders','POST',{parent_id:id,name:'same.png'})
 await click('#task md-filled-button');await wait("document.querySelector('#task .error')?.textContent.includes('Destination name already exists')")
 check('Existing destination collision is rejected before writes',getRows().filter(n=>n.parent_id===id).length===1)
 await chooseSelect(context,mode(101),'keep');await prepare();await add();await cleanup(id)
 id=await start('Review preparation stop');await click(source('A'));await review();setImport('slowPrepare');await click('#task md-filled-button');await wait("document.querySelector('#import-progress md-linear-progress')?.indeterminate")
 await click('#task .dialog-actions md-text-button');await wait("document.querySelector('#task .error')?.textContent.includes('Stopped.')")
 check('Stopping enumeration creates no references and keeps choices editable',!getRows().some(n=>n.parent_id===id)&&await evaluate("!!document.querySelector('.import-folder-choice')&&!document.querySelector('#import-plan-count')"))
 setImport('normal');await prepare();setImport('denySecond');await click('#task md-filled-button');await wait("document.querySelector('#task .error')?.textContent.includes('permission was revoked')")
 check('Write-time permission loss reports partial completion and locks choices',getRows().filter(n=>n.parent_id===id).length===1&&await evaluate("!document.querySelector('#import-edit')&&!document.querySelector('#import-back')&&document.querySelector('#task .error').textContent.includes('1 reference(s) confirmed')"))
 setImport('normal');await add();check('Permission recovery retries remaining references without duplicates',getRows().filter(n=>n.name==='A'&&n.parent_id===id).length===1);await cleanup(id)
 id=await start('Review many folders','manyFolders');await click('#picker-select-all');await review()
 check('Many folder choices initially render only 25 rows',await evaluate("document.querySelectorAll('.import-folder-choice').length===25"))
 await evaluate("[...document.querySelectorAll('.import-review-list md-text-button')].find(b=>b.textContent.includes('Show 25')).click()")
 check('Remaining folder choices can be disclosed',await evaluate("document.querySelectorAll('.import-folder-choice').length===30"))
 await prepare();check('Prepared large review initially renders 25 destinations',await evaluate("document.querySelectorAll('.import-preview li').length===25"))
 await evaluate("document.querySelector('.import-preview').scrollTop=99999");await wait("document.querySelectorAll('.import-preview li').length===30")
 check('Scrolling discloses the remaining destination preview rows',true)
 await click('#import-back');await wait("!!document.querySelector('.file-picker')")
 check('Back before writing retains selected sources',await evaluate("document.querySelectorAll('.file-picker input:checked').length===30"))
 await cleanup(id)
 setSources('baseline');setImport('normal');await send('Page.navigate',{url:base+back});await wait("document.querySelector('#fab').getAttribute('aria-disabled')==='false'")
}
