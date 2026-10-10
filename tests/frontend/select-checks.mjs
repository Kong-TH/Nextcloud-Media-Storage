// SPDX-License-Identifier: AGPL-3.0-or-later
import {writeFile} from 'node:fs/promises'
export async function chooseSelect({evaluate,click,wait,check},selector,value){
 await evaluate(`document.querySelector(${JSON.stringify(selector)}).addEventListener('opened',e=>e.currentTarget.dataset.testOpened='true',{once:true});delete document.querySelector(${JSON.stringify(selector)}).dataset.testOpened`)
 await click(selector)
 await wait(`document.querySelector(${JSON.stringify(selector)}).dataset.testOpened==='true'`)
 const index=await evaluate(`document.querySelector(${JSON.stringify(selector)}).options.findIndex(o=>o.value===${JSON.stringify(value)})`)
 if(index<0)throw new Error('Missing selection option in '+selector)
 await evaluate(`document.querySelector(${JSON.stringify(selector)}).addEventListener('closed',e=>e.currentTarget.dataset.testClosed='true',{once:true});delete document.querySelector(${JSON.stringify(selector)}).dataset.testClosed`)
 await click(selector+' md-select-option:nth-child('+(index+1)+')')
 await wait(`document.querySelector(${JSON.stringify(selector)}).value===${JSON.stringify(value)}&&document.querySelector(${JSON.stringify(selector)}).dataset.testClosed==='true'`)
 check('Material pointer selection updates '+selector,await evaluate(`document.querySelector(${JSON.stringify(selector)}).selectedOptions[0]?.value===${JSON.stringify(value)}`))
}
export async function selectPopupChecks({send,evaluate,click,wait,check,pause},selector,{scroll=false,shot='select'}={}){
 const q=JSON.stringify(selector)
 check('Material field displays its selected label '+selector,await evaluate(`(()=>{const s=document.querySelector(${q});return !!s.displayText.trim()&&s.displayText===s.selectedOptions[0]?.displayText})()`))
 const before=await evaluate(`({value:document.querySelector(${q}).value,scroll:document.querySelector('#main-scroll').scrollTop})`)
 await evaluate(`document.querySelector(${q}).addEventListener('opened',e=>e.currentTarget.dataset.testOpened='true',{once:true});delete document.querySelector(${q}).dataset.testOpened`)
 await click(selector,!scroll)
 await wait(`document.querySelector(${q}).dataset.testOpened==='true'`)
 check('Material listbox stays inside viewport '+selector,await evaluate(`(()=>{const s=document.querySelector(${q}),m=s.shadowRoot.querySelector('md-menu'),r=m.getBoundingClientRect();return s.localName==='md-outlined-select'&&m.role==='listbox'&&r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1})()`))
 check('Material options use the plugin theme '+selector,await evaluate(`(()=>{const s=document.querySelector(${q}),o=s.options[0],item=o.shadowRoot.querySelector('md-item');return getComputedStyle(item).color===getComputedStyle(document.querySelector('#media-design')).color})()`))
 await pause(400)
 check('Open Material listbox suppresses selected-value tooltip '+selector,await evaluate("document.querySelector('#action-tooltip').hidden"))
 await writeFile('/tmp/mediastorage-'+shot+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
 await evaluate(`document.querySelector(${q}).addEventListener('closed',e=>e.currentTarget.dataset.testClosed='true',{once:true});delete document.querySelector(${q}).dataset.testClosed`)
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})
 await wait(`document.querySelector(${q}).dataset.testClosed==='true'`)
 check('Escape preserves selection '+selector,await evaluate(`document.querySelector(${q}).value`)===before.value)
 if(selector==='#token-boundary'||selector==='#move-destination')check('Escape keeps the parent task dialog open '+selector,await evaluate("document.querySelector('#task').open"))
 if(selector==='#object-sort')check('Object labels retain plugin theme color',await evaluate("getComputedStyle(document.querySelector('#objects .object-name')).color===getComputedStyle(document.querySelector('#media-design')).color"))
 if(scroll)check('Sticky Material select preserves list scroll',await evaluate("document.querySelector('#main-scroll').scrollTop")===before.scroll)
}
export async function tokenSelectChecks(context){
 const {send,evaluate,click,wait,check,pause}=context
 for(const width of [1440,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:914,deviceScaleFactor:1,mobile:false})
  await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${width!==1440});document.querySelector('#media-design').dir=${JSON.stringify(width===320?'rtl':'ltr')}`);await pause(100)
  for(const selector of ['#token-filter','#token-sort'])await selectPopupChecks(context,selector,{shot:selector.slice(1)+'-'+width})
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('#media-design').classList.remove('dark');document.querySelector('#media-design').dir='ltr'")
 await click('#token-sort');await wait("document.querySelector('#token-sort').shadowRoot.querySelector('md-menu').open");await pause(220)
 for(const [key,code] of [['Home',36],['Enter',13]]){
  await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code})
 }
 await wait("document.querySelector('#token-sort').value==='expiry'&&!document.querySelector('#token-sort').shadowRoot.querySelector('md-menu').open")
 check('Material select accepts Home and Enter keyboard selection',await evaluate("document.querySelector('#token-sort').selectedOptions[0].value==='expiry'"))
 check('Production contains no native select dropdowns',await evaluate("document.querySelectorAll('#media-design select').length===0"))
}
export async function selectEllipsisChecks(context){
 const {send,evaluate,click,wait,check,pause}=context
 await chooseSelect(context,'#token-filter','expiring')
 for(const width of [1440,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:914,deviceScaleFactor:1,mobile:false})
  await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${width!==1440});document.querySelector('#media-design').dir=${JSON.stringify(width===320?'rtl':'ltr')}`);await pause(100)
  await evaluate("document.querySelector('#token-filter').scrollIntoView({block:'nearest'})")
  await wait("getComputedStyle(document.querySelector('#token-filter').shadowRoot.querySelector('#label')).whiteSpace==='nowrap'")
  const overflow=await evaluate("(()=>{const l=document.querySelector('#token-filter').shadowRoot.querySelector('#label');return l.scrollWidth>l.clientWidth+1})()")
  if(!overflow&&width===1440){check('Fitting desktop selected value needs no tooltip',await evaluate("!document.querySelector('#token-filter').hasAttribute('data-tip')"));continue}
  await wait("document.querySelector('#token-filter').dataset.tip==='Tokens expiring in 2 weeks'")
  check('Long selected value ellipsizes in a 56px field '+width,await evaluate("(()=>{const s=document.querySelector('#token-filter'),l=s.shadowRoot.querySelector('#label'),c=getComputedStyle(l);return s.getBoundingClientRect().height===56&&c.whiteSpace==='nowrap'&&c.textOverflow==='ellipsis'&&l.scrollWidth>l.clientWidth})()"))
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await evaluate("document.activeElement.blur()")
  const point=await evaluate("(()=>{const r=document.querySelector('#token-filter').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point})
  await wait("!document.querySelector('#action-tooltip').hidden&&document.querySelector('#action-tooltip').textContent==='Tokens expiring in 2 weeks'")
  check('Hover tooltip exposes full selected value '+width,await evaluate("(()=>{const t=document.querySelector('#action-tooltip'),r=t.getBoundingClientRect();return t.getAttribute('role')==='tooltip'&&r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()"))
  await writeFile('/tmp/mediastorage-select-ellipsis-'+width+'.png',Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'))
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})
  check('Escape dismisses value tooltip without changing selection '+width,await evaluate("document.querySelector('#action-tooltip').hidden&&document.querySelector('#token-filter').value==='expiring'"))
 }
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await evaluate("document.activeElement.blur();document.querySelector('#token-filter').focus()")
 await wait("!document.querySelector('#action-tooltip').hidden")
 check('Keyboard focus exposes full selected label',await evaluate("document.querySelector('#action-tooltip').textContent==='Tokens expiring in 2 weeks'&&document.activeElement.id==='token-filter'"))
 await chooseSelect(context,'#token-filter','all')
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
 await wait("!document.querySelector('#token-filter').hasAttribute('data-tip')")
 check('Short selected value has no redundant tooltip',await evaluate("!document.querySelector('#token-filter').hasAttribute('data-tip')"))
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('#media-design').classList.remove('dark');document.querySelector('#media-design').dir='ltr'")
}
