// SPDX-License-Identifier: AGPL-3.0-or-later
import {writeFile} from 'node:fs/promises'
import {chooseSelect} from './select-checks.mjs'
export async function multiPickerLiveChecks(context){
 const {send,evaluate,check,wait,click,pause,png,dav,davHeaders}=context
 const checkbox=name=>'.file-picker input[aria-label="Select source '+name+'"]'
 const browse=async name=>{await evaluate(`(()=>{const b=[...document.querySelectorAll('.file-picker button')].find(b=>b.textContent.trim().endsWith(${JSON.stringify(name)}));if(!b)throw new Error('Source folder not found');b.click()})()`);await wait(`document.querySelector('#picker-location').textContent===${JSON.stringify(name)}&&!document.querySelector('#picker-select-all').disabled`)}
 await click('#fab');await click('#fab-menu button[data-tip="Reference an existing Nextcloud file"]');await wait("!!document.querySelector('.file-picker input[aria-label=\"Select source UI-fixture.png\"]')")
 check('Installed picker select-all follows Home',await evaluate("document.querySelector('#picker-home').nextElementSibling.id==='picker-select-all'"))
 await click(checkbox('UI-fixture.png'));await click(checkbox('UI-picker'));await click(checkbox('UI-empty'))
 check('Installed multi-source selection hides single-name field',await evaluate("document.querySelector('#picker-count').textContent.startsWith('3 selected')&&!document.querySelector('#task .task-field')"))
 await browse('UI-picker');await click('#picker-select-all')
 check('Installed select-all retains other source selections',await evaluate("document.querySelector('#picker-count').textContent.startsWith('4 selected')&&document.querySelectorAll('.file-picker input:checked').length===1"))
 await browse('Deep folder with a very long name for narrow screens');await click(checkbox('Leaf.png'))
 await click('#picker-home');await wait("document.querySelector('#picker-location').textContent==='Nextcloud files'&&!document.querySelector('#picker-select-all').disabled")
 check('Installed Home retains five sources including overlaps',await evaluate("document.querySelector('#picker-count').textContent.startsWith('5 selected')"))
 for(const width of [1440,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${width!==1440});document.querySelector('#media-design').dir=${JSON.stringify(width===320?'rtl':'ltr')}`);await pause(120)
  check('Installed picker fits host at '+width,await evaluate("(()=>{const d=document.querySelector('#task'),r=d.getBoundingClientRect(),n=document.querySelector('.picker-navigation');return d.scrollWidth<=d.clientWidth&&r.left>=15&&r.right<=innerWidth-15&&n.scrollWidth<=n.clientWidth})()"))
  check('Picker checkboxes align with file rows at '+width,await evaluate("(()=>[...document.querySelectorAll('.picker-multi-row')].every(row=>{const input=row.querySelector('input'),label=row.querySelector('.check'),button=row.querySelector('button'),a=input.getBoundingClientRect(),b=button.getBoundingClientRect(),l=label.getBoundingClientRect(),s=getComputedStyle(input);return Math.abs(a.top+a.height/2-b.top-b.height/2)<1&&l.width>=48&&l.height>=48&&s.marginTop==='0px'&&s.marginBottom==='0px'}))()"))
  await writeFile('/tmp/mediastorage-multi-picker-live-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
 }
 await click('#task md-filled-button');await wait("!!document.querySelector('.import-folder-choice')")
 check('Live folder review creates no metadata before preparation',await evaluate("!document.querySelector('.file-picker')&&document.querySelectorAll('.import-folder-choice').length===2"))
 const sourceId=await evaluate("[...document.querySelectorAll('.import-folder-choice')].find(e=>e.textContent.includes('/UI-picker')).querySelector('md-outlined-select').dataset.sourceId")
 await chooseSelect(context,'.import-folder-choice md-outlined-select[data-source-id="'+sourceId+'"]','contents')
 for(const width of [1440,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${width!==1440});document.querySelector('#media-design').dir=${JSON.stringify(width===320?'rtl':'ltr')}`);await pause(100)
  check('Live folder review fits '+width,await evaluate("(()=>{const d=document.querySelector('#task'),r=d.getBoundingClientRect();return d.scrollWidth<=d.clientWidth&&r.left>=15&&r.right<=innerWidth-15&&document.querySelectorAll('dialog[open]').length===1})()"))
  check('Folder review heading retains theme color at '+width,await evaluate("getComputedStyle(document.querySelector('#import-review-heading')).color===getComputedStyle(document.querySelector('#media-design')).color"))
  await writeFile('/tmp/mediastorage-folder-review-live-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
 }
 await click('#task md-filled-button');await wait("!!document.querySelector('#import-plan-count')&&!document.querySelector('#task md-filled-button').disabled")
 check('Live prepared destinations preserve nested structure',await evaluate("document.querySelector('.import-preview').textContent.includes('/Deep folder with a very long name for narrow screens/Leaf.png')"))
 await click('#task md-filled-button');await wait("!document.querySelector('#task').open&&document.querySelector('#fab').getAttribute('aria-disabled')==='false'")
 check('Installed import reports exact entries and overlap',await evaluate("document.querySelector('#main .status').textContent.includes('Added 4')&&document.querySelector('#main .status').textContent.includes('2 selected descendant')"))
 const result=await evaluate("(async()=>{const root='/index.php/apps/mediastorage/api/v1',headers={requesttoken:document.head.dataset.requesttoken},request=async path=>{const r=await fetch(root+path,{headers});if(!r.ok)throw new Error('Resolve failed');return r.json()};const deep=await request('/resolve?path='+encodeURIComponent('/Deep folder with a very long name for narrow screens/Leaf.png'));const detail=await request('/nodes/'+deep.id);const empty=await request('/resolve?path='+encodeURIComponent('/UI-empty'));const top=await request('/nodes');return {deep:detail,empty,count:top.nodes.length}})()")
 check('Live mixed choices omit the outer wrapper and preserve nested folders',result.deep.binding_status==='available'&&result.empty.node_type==='folder'&&result.count===3)
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('#media-design').classList.remove('dark');document.querySelector('#media-design').dir='ltr'");await pause(120)
 await click('#fab');await click('#fab-menu button[data-tip="Reference an existing Nextcloud file"]');await wait("!!document.querySelector('.file-picker input[aria-label=\"Select source UI-picker\"]')")
 await click(checkbox('UI-picker'));await click(checkbox('UI-empty'));await click('#task md-filled-button');await wait("!!document.querySelector('.import-folder-choice')")
 const emptyId=await evaluate("[...document.querySelectorAll('.import-folder-choice')].find(e=>e.textContent.includes('/UI-empty')).querySelector('md-outlined-select').dataset.sourceId")
 await chooseSelect(context,'.import-folder-choice md-outlined-select[data-source-id="'+emptyId+'"]','contents')
 await click('#task md-filled-button');await wait("!!document.querySelector('#import-plan-count')&&!document.querySelector('#task md-filled-button').disabled")
 check('Live reverse mixed modes keep wrapper and report empty flattened root',await evaluate("document.querySelector('.import-preview').textContent.includes('/UI-picker/Deep folder with a very long name for narrow screens/Leaf.png')&&document.querySelector('#import-plan-count').textContent.startsWith('3 virtual')&&document.querySelector('.import-review').textContent.includes('no supported contents')"))
 await click('#task md-filled-button');await wait("!document.querySelector('#task').open&&document.querySelector('#fab').getAttribute('aria-disabled')==='false'")
 const reverse=await evaluate("(async()=>{const r=await fetch('/index.php/apps/mediastorage/api/v1/resolve?path='+encodeURIComponent('/UI-picker/Deep folder with a very long name for narrow screens/Leaf.png'),{headers:{requesttoken:document.head.dataset.requesttoken}});return r.ok})()")
 check('Live reverse mixed modes resolve the full kept structure',reverse)
 const original=await fetch(dav,{headers:davHeaders});check('Installed picker preserves physical original path and bytes',original.ok&&Buffer.from(await original.arrayBuffer()).equals(png))
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('#media-design').classList.remove('dark');document.querySelector('#media-design').dir='ltr'");await pause(120)
}
