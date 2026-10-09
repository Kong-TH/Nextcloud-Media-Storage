// SPDX-License-Identifier: AGPL-3.0-or-later
import {writeFile} from 'node:fs/promises'
export async function tokenFormChecks({evaluate,check,click,wait}){
 await wait("!document.querySelector('#task md-filled-button').disabled")
 check('Expiry calendar has future minimum, maximum and visible range',await evaluate("(()=>{const e=document.querySelector('#token-expiry');return e.min&&e.max&&e.step==='60'&&e.validity.valid&&document.querySelector('#token-expiry-help').textContent.includes('no later than')})()"))
 await evaluate("(()=>{window.__tokenValidExpiry=document.querySelector('#token-expiry').value;const e=document.querySelector('#token-expiry');e.value='2099-01-01T12:00';e.dispatchEvent(new Event('input',{bubbles:true}))})()")
 await click('#task .dialog-actions md-filled-button')
 check('Typed over-limit expiry stays open with field error and draft intact',await evaluate("document.querySelector('#task').open&&document.querySelector('#token-expiry').getAttribute('aria-invalid')==='true'&&document.querySelector('#token-expiry-help').textContent.includes('no later than')&&document.activeElement.id==='token-expiry'&&!!document.querySelector('#task input').value&&!document.querySelector('.secret')"))
 await evaluate("(()=>{const e=document.querySelector('#token-expiry');e.value=window.__tokenValidExpiry;e.dispatchEvent(new Event('input',{bubbles:true}));delete window.__tokenValidExpiry})()")
}
export async function tokenSecretChecks({evaluate,check,click,wait}){
 check('Secret actions have at least 24px separation',await evaluate("(()=>{const s=document.querySelector('#task .secret').getBoundingClientRect(),a=document.querySelector('#task .dialog-actions').getBoundingClientRect();return a.top-s.bottom>=24})()"))
 // Assert clipboard equality inside the browser; never return/store the secret in test output.
 await evaluate("window.__previousClipboardDescriptor=Object.getOwnPropertyDescriptor(navigator,'clipboard');Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__secretCopyMatches=value===document.querySelector('#task .secret').textContent}}})")
 await click('#copy-token-secret');await wait("document.querySelector('#token-copy-feedback')?.textContent==='Token copied.'")
 check('Copy token preserves the dialog and copies the exact secret',await evaluate("window.__secretCopyMatches&&document.querySelector('#task').open"))
 await evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Fixture clipboard denied')}}})")
 await click('#copy-token-secret');await wait("document.querySelector('#token-copy-feedback')?.textContent.includes('Clipboard unavailable')")
 check('Denied token clipboard offers selected manual-copy fallback',await evaluate("document.querySelector('#task').open&&getSelection().toString()===document.querySelector('#task .secret').textContent"))
 await evaluate("if(window.__previousClipboardDescriptor)Object.defineProperty(navigator,'clipboard',window.__previousClipboardDescriptor);else delete navigator.clipboard;delete window.__previousClipboardDescriptor;delete window.__secretCopyMatches;getSelection().removeAllRanges()")
}
export async function tokenDashboardChecks({send,evaluate,check,pause}){
 for(const width of [1914,1440,840,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:914,deviceScaleFactor:1,mobile:false});await pause(160)
  await evaluate("document.querySelector('#main-scroll').scrollTop=0")
  check('App uses the available viewport height at '+width,await evaluate("(()=>{const r=document.querySelector('#media-design').getBoundingClientRect(),a=document.querySelector('.app').getBoundingClientRect();return Math.abs(a.bottom-Math.min(r.bottom,innerHeight))<3&&Math.abs(a.height-Math.min(r.height,innerHeight-r.top))<3})()"))
  check('Dashboard fits without horizontal overflow at '+width,await evaluate("(()=>{const m=document.querySelector('#main-scroll'),r=m.getBoundingClientRect();return m.scrollWidth<=m.clientWidth+1&&[...document.querySelectorAll('.token-summary,#create-token,.token-filters')].every(e=>{const b=e.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right})})()"))
  check('Four status summaries remain readable at '+width,await evaluate("document.querySelectorAll('.token-summary').length===4&&[...document.querySelectorAll('.token-summary')].every(e=>e.scrollWidth<=e.clientWidth+1&&e.offsetHeight>=100)"))
 }
 for(const [width,theme] of [[1440,'light'],[390,'dark']]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${theme==='dark'});document.querySelector('#main-scroll').scrollTop=0;document.activeElement.blur()`);await pause(180)
  const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(`/tmp/mediastorage-tokens-${width}-${theme}.png`,Buffer.from(shot.data,'base64'))
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('#media-design').classList.remove('dark')")
}
