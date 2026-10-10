// SPDX-License-Identifier: AGPL-3.0-or-later
import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
// Shared rendered checks: exercise actual library state layers through CDP input.
export async function materialChecks({send,evaluate,check,pause}){
 check('Official Material controls replace supported native commands',await evaluate("document.querySelector('#fab').localName==='md-fab'&&document.querySelector('#add-bucket').localName==='md-text-button'&&document.querySelector('#cancel-selection').localName==='md-filled-tonal-icon-button'&&[...document.querySelectorAll('.object > .icon')].every(e=>e.localName==='md-icon-button')"))
 await evaluate("document.fonts.load('24px \"Material Symbols Outlined\"','search')")
 check('Official icon font loads under app CSP',await evaluate("document.fonts.check('24px \"Material Symbols Outlined\"','search')&&[...document.fonts].some(f=>f.family==='Material Symbols Outlined'&&f.status==='loaded')&&document.querySelector('md-icon.symbol')?.shadowRoot!==null&&!document.querySelector('#media-design svg')"))
 const hash=createHash('sha256').update(await readFile('img/material-symbols-outlined.ttf')).digest('hex').slice(0,12)
 check('Icon font URL changes with subset content',await evaluate(`performance.getEntriesByType('resource').some(e=>e.name.includes('material-symbols-outlined.ttf')&&new URL(e.name).searchParams.get('v')===${JSON.stringify(hash)})`))
 check('Icons use local font without external Google font requests',await evaluate("performance.getEntriesByType('resource').some(e=>e.name.includes('material-symbols-outlined.ttf'))&&!performance.getEntriesByType('resource').some(e=>/fonts\\.(googleapis|gstatic)\\.com/.test(e.name))"))
 for(const selector of ['#open-drawer','#cancel-selection']){
  check('Icon button retains complete square hit surface '+selector,await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e.getClientRects().length)return true;const a=e.getBoundingClientRect(),b=e.shadowRoot.querySelector('button').getBoundingClientRect();return a.width>=48&&a.height>=48&&Math.abs(a.width-b.width)<1&&Math.abs(a.height-b.height)<1})()`))
 }
 const press=async(selector,rippleExpression)=>{
  const point=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await pause(40)
  check('Library ripple animates on actual pointer press '+selector,await evaluate(`(()=>{const r=${rippleExpression};return !!r?.shadowRoot.querySelector('.surface.pressed')&&r.shadowRoot.getAnimations().some(a=>a.playState==='running')})()`))
  // Release away from the control so this visual check does not invoke a command.
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:1,y:1});await pause(250)
 }
 await press('#fab',"document.querySelector('#fab').shadowRoot.querySelector('md-ripple')")
 await press('#drawer .destination',"document.querySelector('#drawer .destination md-ripple')")
 await press('#objects .object-name',"document.querySelector('#objects .row-ripple')")
 check('Custom row ripple covers the full rounded row',await evaluate("(()=>{const e=document.querySelector('#objects .object'),r=e.querySelector('.row-ripple'),a=e.getBoundingClientRect(),b=r.getBoundingClientRect();return Math.abs(a.width-b.width)<1&&Math.abs(a.height-b.height)<=1&&getComputedStyle(r).borderRadius==='16px'&&r.control===e.querySelector('.object-name')})()"))
 await evaluate("(()=>{window.__disabledClicks=0;window.__disabledHandler=()=>window.__disabledClicks++;const e=document.querySelector('#search-form md-icon-button');e.disabled=true;e.addEventListener('click',window.__disabledHandler)})()")
 await pause(30)
 const point=await evaluate("(()=>{const r=document.querySelector('#search-form md-icon-button').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await pause(40)
 check('Disabled Material button suppresses ripple',await evaluate("!document.querySelector('#search-form md-icon-button').shadowRoot.querySelector('md-ripple').shadowRoot.querySelector('.pressed')"))
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point})
 check('Disabled Material button suppresses action',await evaluate("window.__disabledClicks===0"))
 await evaluate("(()=>{const e=document.querySelector('#search-form md-icon-button');e.disabled=false;e.removeEventListener('click',window.__disabledHandler);delete window.__disabledHandler;delete window.__disabledClicks})()")
 // Exercise the actual FAB button's keyboard activation and tooltip/menu ownership.
 await evaluate("document.querySelector('#fab').focus()")
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});await pause(100)
 check('Material FAB supports Space activation',await evaluate("!document.querySelector('#fab-menu').hidden"))
 await pause(400)
 check('Tooltip focus does not close the FAB menu',await evaluate("!document.querySelector('#fab-menu').hidden&&!document.querySelector('#action-tooltip').hidden"))
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await pause(30)
 check('First Escape dismisses tooltip without closing menu',await evaluate("document.querySelector('#action-tooltip').hidden&&!document.querySelector('#fab-menu').hidden"))
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await pause(30)
 check('Second Escape closes menu and restores Material FAB focus',await evaluate("document.querySelector('#fab-menu').hidden&&document.activeElement.id==='fab'"))
}

export async function toolbarChecks({send,evaluate,check,pause},width){
 check('Toolbar uses correct Material variants '+width,await evaluate("(()=>{const bar=document.querySelector('#reference-toolbar'),iconMode=bar.classList.contains('icon-actions');return [...bar.querySelectorAll('[id^=action-]')].every(e=>e.localName===(iconMode?'md-icon-button':'md-text-button'))})()"))
 check('Labeled toolbar keeps 8px icon gap '+width,await evaluate("(()=>{const bar=document.querySelector('#reference-toolbar');return bar.classList.contains('icon-actions')||[...bar.querySelectorAll('md-text-button')].filter(e=>!e.hidden).every(e=>{const icon=e.querySelector('md-icon').getBoundingClientRect(),label=e.shadowRoot.querySelector('.label').getBoundingClientRect();return label.left-icon.right>=7.5})})()"))
 check('Toolbar keeps non-overlapping 48px targets '+width,await evaluate("(()=>{const es=[...document.querySelectorAll('#reference-toolbar > *')].filter(e=>!e.hidden);return es.every(e=>{const r=e.getBoundingClientRect();return r.width>=48&&r.height>=48})&&es.every((e,i)=>!i||e.getBoundingClientRect().left>=es[i-1].getBoundingClientRect().right-.5)})()"))
 if(width===390)check('390px toolbar retains all five Material actions',await evaluate("[...document.querySelectorAll('#reference-toolbar [id^=action-]')].filter(e=>!e.hidden).length===5&&document.querySelector('#more-actions').hidden"))
 await evaluate("document.querySelector('#action-move').focus()")
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39})
 check('Toolbar roving focus skips disabled Material controls '+width,await evaluate("document.activeElement.id==='action-copy'"))
 const point=await evaluate("(()=>{const r=document.querySelector('#action-move').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await pause(40)
 check('Toolbar Material action displays actual ripple '+width,await evaluate("document.querySelector('#action-move').shadowRoot.querySelector('md-ripple').shadowRoot.querySelector('.surface.pressed')!==null"))
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:1,y:1});await pause(250)
 if(width===320){
  const more=await evaluate("(()=>{const r=document.querySelector('#more-actions').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',...more});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...more});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...more});await pause(80)
  check('Overflow shows exactly hidden commands '+width,await evaluate("(()=>{const hidden=[...document.querySelectorAll('#reference-toolbar [id^=action-]')].filter(e=>e.hidden).map(e=>e.getAttribute('aria-label'));const menu=[...document.querySelectorAll('#toolbar-menu [role=menuitem]')];return !document.querySelector('#toolbar-menu').hidden&&menu.length===hidden.length&&menu.every(e=>hidden.some(label=>e.textContent.endsWith(label)))})()"))
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await pause(30)
  check('Overflow Tab closes menu and reaches separate Material cancel action',await evaluate("document.querySelector('#toolbar-menu').hidden&&document.activeElement.id==='cancel-selection'"))
 }
}

export async function buttonSpacingChecks({evaluate,check}){
 check('Add bucket preserves Material labeled-button insets and icon gap',await evaluate("(()=>{const e=document.querySelector('#add-bucket'),s=getComputedStyle(e),icon=e.querySelector('md-icon').getBoundingClientRect(),label=e.shadowRoot.querySelector('.label').getBoundingClientRect(),r=e.getBoundingClientRect();return parseFloat(s.paddingInlineStart)>=12&&parseFloat(s.paddingInlineEnd)>=16&&parseFloat(s.gap)>=8&&label.left-icon.right>=7.5&&r.width>=96&&r.height>=48})()"))
}

export async function pickerChecks({send,evaluate,check,pause,click,wait},rootFile){
 const viewport=await evaluate('({width:innerWidth,height:innerHeight})')
 const folder=async(name)=>{
  check('Picker navigation disabled during directory request',await evaluate(`(async()=>{const e=[...document.querySelectorAll('.file-picker button')].find(e=>e.textContent.endsWith(${JSON.stringify(name)}));if(!e)throw new Error('Missing picker fixture folder');e.click();await Promise.resolve();return document.querySelector('#picker-back').disabled&&document.querySelector('#picker-home').disabled})()`))
  await wait(`document.querySelector('#picker-location').textContent===${JSON.stringify(name)}&&!document.querySelector('#picker-back').disabled`)
  await wait("[...document.querySelectorAll('.file-picker button')].length>0")
 }
 for(const width of [1440,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:false});await pause(100)
  await evaluate("document.querySelector('.picker-navigation').scrollIntoView({block:'nearest'})")
  check('Picker navigation occupies one row '+width,await evaluate("(()=>{const es=[...document.querySelector('.picker-navigation').children],rs=es.map(e=>e.getBoundingClientRect());return rs.every(r=>Math.abs(r.top+r.height/2-(rs[0].top+rs[0].height/2))<1)&&rs.every((r,i)=>!i||r.left>=rs[i-1].right)&&rs[0].width===48&&rs[1].width===48&&rs[2].width===48&&rs[3].width>0})()"))
  check('Root label and disabled navigation '+width,await evaluate("document.querySelector('#picker-location').textContent==='Nextcloud files'&&document.querySelector('#picker-back').disabled&&document.querySelector('#picker-home').disabled"))
  await evaluate(`(()=>{const e=[...document.querySelectorAll('.file-picker button')].find(e=>e.textContent.endsWith(${JSON.stringify(rootFile)}));if(e.getAttribute('aria-pressed')!=='true')e.click()})()`)
  await folder('UI-picker');await folder('Deep folder with a very long name for narrow screens')
  check('Nested picker shows folder name and complete accessible path '+width,await evaluate("document.querySelector('#picker-location').textContent==='Deep folder with a very long name for narrow screens'&&document.querySelector('#picker-location').getAttribute('aria-label').includes('/UI-picker/Deep folder with a very long name for narrow screens')&&document.activeElement.id==='picker-location'"))
  check('Long folder name stays inside dialog '+width,await evaluate("(()=>{const e=document.querySelector('#picker-location'),r=e.getBoundingClientRect(),d=document.querySelector('#task').getBoundingClientRect();return r.right<=d.right&&getComputedStyle(e).textOverflow==='ellipsis'&&(innerWidth>=600||e.scrollWidth>e.clientWidth)})()"))
  if(width===390){const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-picker-nested-mobile.png',Buffer.from(shot.data,'base64'))}
  await click('#picker-back');await wait("document.querySelector('#picker-location').textContent==='UI-picker'&&!document.querySelector('#picker-back').disabled")
  check('Back returns exactly one folder level '+width,await evaluate("document.querySelector('#picker-location').title==='/UI-picker'&&document.querySelector('#task').open"))
  await wait("[...document.querySelectorAll('.file-picker button')].some(e=>e.textContent.endsWith('Deep folder with a very long name for narrow screens'))")
  await folder('Deep folder with a very long name for narrow screens')
  await evaluate("document.querySelector('#picker-home').focus()")
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13})
  await wait("document.querySelector('#picker-location').textContent==='Nextcloud files'&&document.querySelector('#picker-home').disabled&&document.activeElement.id==='picker-location'")
  check('Home keyboard action returns directly to root without submitting '+width,await evaluate("document.querySelector('#task').open&&document.querySelector('#picker-back').disabled"))
  check('Navigation preserves chosen reference and alias '+width,await evaluate(`document.querySelector('#task input:not([type=checkbox])').value===${JSON.stringify(rootFile)}&&document.querySelector('#task').textContent.includes('Selected: '+${JSON.stringify(rootFile)})`))
  await wait(`[...document.querySelectorAll('.file-picker button')].some(e=>e.textContent.endsWith(${JSON.stringify(rootFile)}))`)
 }
 await send('Emulation.setDeviceMetricsOverride',{...viewport,deviceScaleFactor:1,mobile:false});await pause(100)
}
