// SPDX-License-Identifier: AGPL-3.0-or-later
// Installed-host acceptance. AX-tree assertions do not replace a real screen reader.
export async function integratedChecks({send,evaluate,check,wait,click,pause,videos}){
 const key=async(key,code,shift=false)=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code:key,windowsVirtualKeyCode:code,modifiers:shift?8:0});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code:key,windowsVirtualKeyCode:code,modifiers:shift?8:0})}
 await send('Accessibility.enable')
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await pause(150)
 await evaluate("document.querySelector('#drawer nav button:first-child').click()")
 await wait("document.querySelector('#fab')?.getAttribute('aria-disabled')==='false'")
 const tree=await send('Accessibility.getFullAXTree')
 const names=tree.nodes.filter(n=>!n.ignored).map(n=>[n.role?.value,n.name?.value])
 for(const name of ['Add','Add bucket','Filter buckets','Search this folder by name'])check('Accessible control name: '+name,names.some(n=>n[1]===name))
 await click('#add-bucket');await wait("document.querySelector('#task').open")
 const modal=await send('Accessibility.getFullAXTree')
 check('Modal removes background Add action from accessibility tree',!modal.nodes.some(n=>!n.ignored&&n.role?.value==='button'&&n.name?.value==='Add bucket'))
 check('Native task has named dialog in accessibility tree',modal.nodes.some(n=>!n.ignored&&n.role?.value==='dialog'&&n.name?.value==='New bucket'))
 for(let i=0;i<10;i++){
  await key('Tab',9,i>=5)
  check('Modal excludes background controls on '+(i>=5?'reverse ':'')+'Tab '+i,await evaluate("document.querySelector('#task').matches(':modal')&&(document.querySelector('#task').contains(document.activeElement)||document.activeElement===document.body)"))
 }
 // Chromium can return BODY while cycling through the browser focus sentinel.
 // Re-enter the modal before testing its Escape command.
 await evaluate("document.querySelector('#task md-outlined-text-field, #task input').focus()")
 await key('Escape',27);await wait("!document.querySelector('#task').open")
 await wait("document.activeElement.id==='add-bucket'")
 check('Modal cancellation restores invoking control',await evaluate("document.activeElement.id==='add-bucket'"))
 // Measure known opaque theme pairs, not an incomplete scan of all composited states.
 for(const dark of [false,true]){
  await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${dark})`)
  const ratios=await evaluate(`(()=>{const s=getComputedStyle(document.querySelector('#media-design'));const lum=h=>{let a=h.trim().replace('#','');if(a.length===3)a=[...a].map(x=>x+x).join('');return [0,2,4].map(i=>parseInt(a.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0)};const ratio=(a,b)=>{const x=lum(s.getPropertyValue(a)),y=lum(s.getPropertyValue(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};return {body:ratio('--on','--surface'),muted:ratio('--muted','--surface'),button:ratio('--on-primary','--primary'),action:ratio('--primary','--container'),error:ratio('--error','--surface')}})()`)
  for(const [name,value] of Object.entries(ratios))check('Text contrast >=4.5 '+name+' '+(dark?'dark':'light'),value>=4.5)
 }
 for(const [width,height,rtl] of [[640,450,false],[320,600,false],[320,600,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await evaluate(`document.querySelector('#media-design').dir=${JSON.stringify(rtl?'rtl':'ltr')}`);await pause(150)
  check('Equivalent zoom reflow contained '+width+' RTL '+rtl,await evaluate("document.documentElement.scrollWidth<=innerWidth&&document.querySelector('#main').scrollWidth<=document.querySelector('#main').clientWidth"))
  await click('#fab');await wait("!document.querySelector('#fab-menu').hidden");await click('#fab-menu button:first-child');await wait("!!document.querySelector('#upload-file')")
  check('Upload task actions contained in reflow '+width+' RTL '+rtl,await evaluate("(()=>{const d=document.querySelector('#task'),r=d.getBoundingClientRect(),b=document.querySelector('#upload-send').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&b.top>=r.top&&b.bottom<=r.bottom&&d.scrollWidth<=d.clientWidth})()"))
  await click('.upload-actions md-text-button');await wait("!document.querySelector('#task').open")
 }
 // Targeted 200% text enlargement is distinct from browser zoom.
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:600,deviceScaleFactor:1,mobile:false});await pause(150)
 await click('#fab');await wait("!document.querySelector('#fab-menu').hidden");await click('#fab-menu button:first-child');await wait("!!document.querySelector('#upload-send')")
 await evaluate("(()=>{const s=document.createElement('style');s.id='acceptance-enlarged-text';s.textContent='#media-design .upload-content p{font-size:28px;line-height:1.5}#media-design dialog h2{font-size:44px}#media-design md-text-button{--md-text-button-label-text-size:28px;--md-text-button-label-text-line-height:42px}#media-design md-filled-button{--md-filled-button-label-text-size:28px;--md-filled-button-label-text-line-height:42px}#media-design md-outlined-text-field{--md-outlined-text-field-input-text-size:32px;--md-outlined-text-field-label-text-size:32px;--md-outlined-text-field-supporting-text-size:24px}';document.head.append(s)})()")
 await pause(150)
 check('Enlarged upload text reflows without horizontal clipping',await evaluate("(()=>{const d=document.querySelector('#task'),b=document.querySelector('#upload-send'),r=d.getBoundingClientRect(),a=b.getBoundingClientRect();return d.scrollWidth<=d.clientWidth&&a.left>=r.left&&a.right<=r.right&&a.bottom<=r.bottom&&getComputedStyle(document.querySelector('.upload-content p')).fontSize==='28px'})()"))
 await evaluate("document.querySelector('#acceptance-enlarged-text').remove()");await click('.upload-actions md-text-button');await wait("!document.querySelector('#task').open")
 await evaluate("document.querySelector('#media-design').dir='ltr';document.querySelector('#media-design').classList.remove('dark')")
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]})
 check('Reduced motion preference reaches app',await evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches"))
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});await pause(150)
 const tap=async(selector)=>{const p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(100)}
 for(const fixture of videos){
 const video=fixture.bytes
 await tap('#fab');await wait("!document.querySelector('#fab-menu').hidden")
 check('Emulated touch opens Add menu',await evaluate("document.querySelector('#fab-menu').getBoundingClientRect().right<=innerWidth"))
 await tap('#fab-menu button:first-child');await wait("document.querySelector('#upload-file')&&!document.querySelector('#upload-file').disabled")
 await evaluate(`(()=>{const e=document.querySelector('#upload-file'),d=new DataTransfer();d.items.add(new File([new Uint8Array(${JSON.stringify([...video])})],${JSON.stringify('Acceptance video.'+fixture.extension)},{type:${JSON.stringify(fixture.mime)}}));e.files=d.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
 await tap('#upload-send');await wait(`!document.querySelector('#task').open&&document.querySelector('#objects').textContent.includes(${JSON.stringify('Acceptance video.'+fixture.extension)})`)
 await wait("!!document.querySelector('#open-upload-folder')");await click('#dismiss-upload-notice')
 await evaluate(`[...document.querySelectorAll('#objects li')].find(e=>e.textContent.includes(${JSON.stringify('Acceptance video.'+fixture.extension)})).querySelector('md-icon-button').id='acceptance-video-details'`)
 await click('#acceptance-video-details');await wait("document.querySelector('#details video')?.readyState>=1")
 check('Real '+fixture.extension+' metadata and native controls',await evaluate("(()=>{const v=document.querySelector('#details video');return v.controls&&v.videoWidth===160&&v.videoHeight===90&&v.duration>1.5&&v.duration<3})()"))
 check('Authenticated '+fixture.extension+' Range returns exact original prefix',await evaluate(`(async()=>{const r=await fetch(document.querySelector('#details video').src,{headers:{Range:'bytes=0-31'},credentials:'same-origin'}),b=new Uint8Array(await r.arrayBuffer());return r.status===206&&r.headers.get('content-range')?.startsWith('bytes 0-31/')&&JSON.stringify([...b])===${JSON.stringify(JSON.stringify([...video.subarray(0,32)]))}})()`))
 check('Unsatisfiable '+fixture.extension+' session Range rejected',await evaluate("(async()=>{const r=await fetch(document.querySelector('#details video').src,{headers:{Range:'bytes=99999999-'},credentials:'same-origin'});return r.status===416})()"))
 await evaluate("(async()=>{const v=document.querySelector('#details video');v.muted=true;await v.play()})()")
 await wait("document.querySelector('#details video')?.currentTime>0.1")
 check('Real '+fixture.extension+' plays without media error',await evaluate("!document.querySelector('#details video').error"))
 await evaluate("(()=>{const v=document.querySelector('#details video');v.pause();v.currentTime=1.3})()")
 await wait("!document.querySelector('#details video')?.seeking&&document.querySelector('#details video')?.currentTime>=1.2")
 check('Real '+fixture.extension+' seek completes',await evaluate("!document.querySelector('#details video').error"))
 await click('#close-detail')
 }
 await evaluate("[...document.querySelectorAll('#objects li')].find(e=>e.textContent.includes('Acceptance video.')).querySelector('input').click()");await pause(100)
 check('Reduced motion suppresses toolbar entry animation',await evaluate("getComputedStyle(document.querySelector('#selection')).animationName==='none'"))
 await click('#cancel-selection')
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});await send('Emulation.setEmulatedMedia',{features:[]});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await pause(150)
}
