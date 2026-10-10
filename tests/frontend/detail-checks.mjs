// SPDX-License-Identifier: AGPL-3.0-or-later
import {writeFile} from 'node:fs/promises'
export async function detailChecks({send,evaluate,click,wait,check,pause}){
 // Reproduce the installed Nextcloud definition-list defaults in the fixture.
 await evaluate("(()=>{const s=new CSSStyleSheet();s.replaceSync('dl{padding:12px 0}dt,dd{display:inline-block;padding:12px;padding-inline-start:0}dt{width:130px;white-space:nowrap;text-align:end}');document.adoptedStyleSheets=[...document.adoptedStyleSheets,s];window.detailHostDefaults=s})()")
 check('Nextcloud host defaults are active in the fixture',await evaluate("(()=>{const d=document.createElement('dl');d.innerHTML='<dt>Host control</dt>';document.body.append(d);const ok=getComputedStyle(d).paddingTop==='12px'&&getComputedStyle(d.firstElementChild).paddingTop==='12px';d.remove();return ok})()"))
 for(const width of [1440,390]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:914,deviceScaleFactor:1,mobile:false})
  await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${width===390});document.querySelector('#media-design').dir=${JSON.stringify(width===390?'rtl':'ltr')}`)
  await wait("(()=>{const e=document.querySelector('#objects md-icon-button[data-aria-label=\"Details for Photo.png\"]');return e&&!e.disabled&&e.getClientRects().length})()");await pause(120)
  await click('#objects md-icon-button[data-aria-label="Details for Photo.png"]');await wait("document.querySelectorAll('.detail-fact').length===6")
  check('Media details expose all six labeled icon facts '+width,await evaluate("[...document.querySelectorAll('.detail-fact dt span')].map(e=>e.textContent).join(',')==='Type,Binding,Bucket,Virtual path,Original file,Size'&&document.querySelectorAll('.detail-fact dt md-icon').length===6"))
  check('Short metadata values remain close to their labels '+width,await evaluate("[...document.querySelectorAll('.detail-fact.compact')].every(r=>{const a=r.querySelector('dt').getBoundingClientRect(),b=r.querySelector('dd').getBoundingClientRect();return Math.abs((a.top+a.height/2)-(b.top+b.height/2))<1&&r.getBoundingClientRect().height<=48})"))
  check('Detail metadata resets host definition-list padding '+width,await evaluate("[document.querySelector('.detail-facts'),...document.querySelectorAll('.detail-fact dt,.detail-fact dd')].every(e=>['paddingTop','paddingRight','paddingBottom','paddingLeft'].every(p=>parseFloat(getComputedStyle(e)[p])===0))"))
  await evaluate("(()=>{const r=[...document.querySelectorAll('.detail-fact')].find(r=>r.querySelector('dt').textContent.includes('Original file'));r.querySelector('dd').textContent='/Media Storage/2026-10-10/4e726b1d87908d39149d43b301cf95e0.png'})()")
  await pause(100)
  check('Full paths wrap within the detail pane '+width,await evaluate("(()=>{const d=document.querySelector('#details');return d.scrollWidth<=d.clientWidth&&[...d.querySelectorAll('.detail-fact:not(.compact) dd')].every(v=>v.textContent.startsWith('/')&&v.scrollWidth<=v.clientWidth+1&&getComputedStyle(v).textAlign==='start')})()"))
  check('Detail actions retain independent icon buttons '+width,await evaluate("document.querySelectorAll('.detail-actions md-text-button md-icon[slot=icon]').length===2&&document.querySelector('#copy-virtual-path').textContent.includes('Copy virtual path')"))
  await writeFile('/tmp/mediastorage-media-details-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
  await click('#close-detail');await wait("!document.querySelector('#details')")
 }
 await evaluate("document.adoptedStyleSheets=document.adoptedStyleSheets.filter(s=>s!==window.detailHostDefaults);delete window.detailHostDefaults")
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('#media-design').classList.remove('dark');document.querySelector('#media-design').dir='ltr'")
}
