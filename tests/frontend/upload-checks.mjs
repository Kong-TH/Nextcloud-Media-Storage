// SPDX-License-Identifier: AGPL-3.0-or-later
import {writeFile} from 'node:fs/promises'
export async function uploadChecks({send,evaluate,check,wait,click,pause,setMode}){
 const open=async()=>{await click('#fab');await wait("!document.querySelector('#fab-menu').hidden");await click('#fab-menu button:first-child');await wait("document.querySelector('#upload-file') && !document.querySelector('#upload-file').disabled")}
 const choose=async(name='Upload fixture.png',type='image/png',size=32)=>evaluate(`(()=>{const input=document.querySelector('#upload-file'),dt=new DataTransfer();dt.items.add(new File([new Uint8Array(${size})],${JSON.stringify(name)},{type:${JSON.stringify(type)}}));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}))})()`)
 const ready=()=>wait("!document.querySelector('#task')?.open && document.querySelector('#fab')?.getAttribute('aria-disabled')==='false'")
 const notice=async()=>{
  await wait("!!document.querySelector('#open-upload-folder')")
  check('Upload success announces exact original path',await evaluate("document.querySelector('#upload-notice [role=status]').textContent.includes('/Media Storage/2026-10-10/fixture.png')"))
  check('Upload folder action opens Files directory, not preview',await evaluate("(()=>{const e=document.querySelector('#open-upload-folder'),u=new URL(e.href,location.origin);return u.pathname==='/index.php/apps/files/'&&u.searchParams.get('dir')==='/Media Storage/2026-10-10'&&u.searchParams.get('view')==='files'&&e.target==='_blank'})()"))
  for(const [width,dark] of [[1440,false],[390,false],[320,true]]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:568,deviceScaleFactor:1,mobile:false});await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${dark});document.querySelector('#media-design').dir=${JSON.stringify(dark?'rtl':'ltr')}`);await pause(120)
   check('Success notice contained '+width,await evaluate("(()=>{const n=document.querySelector('#upload-notice'),r=n.getBoundingClientRect(),a=document.querySelector('#open-upload-folder').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&n.scrollWidth<=n.clientWidth&&a.left>=r.left&&a.right<=r.right})()"))
   const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-upload-notice-'+width+'.png',Buffer.from(shot.data,'base64'))
  }
  await click('#dismiss-upload-notice');await wait("!document.querySelector('#upload-notice')")
  check('Success notice dismisses and returns focus to workspace',await evaluate("document.activeElement.id==='main'"))
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await evaluate("document.querySelector('#media-design').classList.remove('dark');document.querySelector('#media-design').dir='ltr'");await pause(150)
 }
 const removeUploads=async()=>{
  await evaluate(`(async()=>{for(const row of [...document.querySelectorAll('#objects li')].filter(x=>x.textContent.includes('Upload fixture'))){const id=row.querySelector('button[id^=open-node]').id.replace('open-node-','');await fetch('/index.php/apps/mediastorage/api/v1/nodes/'+id,{method:'DELETE',headers:{requesttoken:'csrf-fixture'}})}})()`)
  await send('Page.reload');await ready()
 }
 for(const [width,height,dark] of [[1440,844,false],[390,844,false],[320,568,true]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await pause(100);await open();await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${dark});document.querySelector('#media-design').dir=${JSON.stringify(dark?'rtl':'ltr')}`)
  check('Upload dialog contained '+width,await evaluate("(()=>{const r=document.querySelector('#task').getBoundingClientRect();return r.left>=8&&r.right<=innerWidth-8&&r.top>=0&&r.bottom<=innerHeight&&document.querySelector('#task').scrollWidth<=document.querySelector('#task').clientWidth})()"))
  check('Upload title and actions remain visible '+width,await evaluate("(()=>{const d=document.querySelector('#task').getBoundingClientRect(),h=document.querySelector('#task h2').getBoundingClientRect(),b=document.querySelector('.upload-actions').getBoundingClientRect();return h.top>=d.top&&h.bottom<=d.bottom&&b.top>=d.top&&b.bottom<=d.bottom})()"))
  check('Upload policy and stop semantics visible '+width,await evaluate("document.querySelector('.upload-panel').textContent.includes('Media Storage/YYYY-MM-DD/')&&document.querySelector('.upload-panel').textContent.includes('cannot undo')"))
  const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/mediastorage-upload-'+width+'.png',Buffer.from(shot.data,'base64'))
  await choose('invalid.html','text/html');await click('#upload-send');await wait("!!document.querySelector('.upload-panel .error')")
  check('Unsupported client MIME keeps task open '+width,await evaluate("document.querySelector('.upload-panel .error').textContent.includes('supported')"))
  await choose('huge.png','image/png',1048577);await click('#upload-send');await wait("document.querySelector('.upload-panel .error')?.textContent.includes('no larger')")
  check('Oversize reports actual maximum '+width,await evaluate("document.querySelector('.upload-panel .error').textContent.includes('1 MiB')"))
  await click('.upload-actions md-text-button');await ready()
 }
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false})
 await evaluate("document.querySelector('#media-design').classList.remove('dark');document.querySelector('#media-design').dir='ltr'");await pause(150);setMode('proxy');await open();await choose();await click('#upload-send');await wait("document.querySelector('.upload-panel .error')?.textContent.includes('proxy request limit')");check('Proxy size errors explain smaller-file recovery',await evaluate("document.querySelector('.upload-panel .error').textContent.includes('choose a smaller file')"));await click('.upload-actions md-text-button');await ready();setMode('fail');await open();await choose();await click('#upload-send');await wait("document.querySelector('.upload-panel .error')?.textContent.includes('temporarily')")
 check('Failed upload preserves file and offers retry',await evaluate("document.querySelector('#upload-file').disabled&&document.querySelector('#upload-name').disabled&&document.querySelector('#upload-send').textContent==='Retry upload'"))
 setMode('normal');await click('#upload-send');await ready();await wait("document.querySelector('#objects').textContent.includes('Upload fixture.png')")
 check('Retry produces one reference',await evaluate("[...document.querySelectorAll('#objects li')].filter(x=>x.textContent.includes('Upload fixture.png')).length===1"))
 await notice()
 setMode('lost');await open();await choose('Upload fixture lost.png');await click('#upload-send');await ready()
 check('Lost response reconciles committed upload',await evaluate("document.querySelector('#objects').textContent.includes('Upload fixture lost.png')"))
 await notice()
 setMode('delay');await open();await choose('Upload fixture stopped.png');await click('#upload-send');await wait("!!document.querySelector('#upload-stop')")
 check('Actual Material progress shown during transfer or processing',await evaluate("!!customElements.get('md-linear-progress')&&!!document.querySelector('.upload-progress md-linear-progress')"))
 await click('#upload-stop');await ready()
 check('Stop after commit reports saved result',await evaluate("document.querySelector('#objects').textContent.includes('Upload fixture stopped.png')"))
 await notice()
 await wait("[...document.querySelectorAll('.file-icon img')].some(x=>x.complete&&x.naturalWidth>0)")
 check('Actual thumbnail image loads inside leading slot',await evaluate("[...document.querySelectorAll('.file-icon img')].some(x=>x.naturalWidth>0&&x.getBoundingClientRect().width<=40)"))
 setMode('previewFail')
 await evaluate("[...document.querySelectorAll('#objects md-icon-button')].find(e=>e.getAttribute('aria-label')==='Details for Upload fixture.png').id='upload-detail-test'")
 await click('#upload-detail-test');await wait("document.querySelector('#details .preview-fallback')!==null")
 check('Unavailable preview has explicit retry',await evaluate("document.querySelector('#details').textContent.includes('Preview unavailable.')&&[...document.querySelectorAll('#details md-text-button')].some(x=>x.textContent==='Retry preview')"))
 await click('#close-detail')
 setMode('locationFail');await open();await choose('Upload fixture location unavailable.png');await click('#upload-send');await ready()
 await wait("document.querySelector('#upload-notice')?.textContent.includes('could not be retrieved')")
 check('Location failure preserves upload success without fabricating a folder link',await evaluate("document.querySelector('#upload-notice').textContent.includes('Uploaded Upload fixture location unavailable.png')&&!document.querySelector('#open-upload-folder')"))
 await click('#dismiss-upload-notice');setMode('normal');await removeUploads()
}
