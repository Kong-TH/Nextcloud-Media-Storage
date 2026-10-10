// SPDX-License-Identifier: AGPL-3.0-or-later
// Installed PHP upload and preview endpoints are required; frontend interception is insufficient.
export async function uploadLiveChecks({send,evaluate,check,wait,click,pause,png}){
 const bytes=[...png]
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await pause(150)
 await click('#fab');await click('#fab-menu button:first-child');await wait("document.querySelector('#upload-file')&&!document.querySelector('#upload-file').disabled")
 await evaluate(`(()=>{const e=document.querySelector('#upload-file'),data=new DataTransfer();data.items.add(new File([new Uint8Array(${JSON.stringify(bytes)})],'Browser upload.png',{type:'image/png'}));e.files=data.files;e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
 for(const dark of [false,true]){
  await evaluate(`document.querySelector('#media-design').classList.toggle('dark',${dark})`)
  check('Upload fields and actions fit theme '+dark,await evaluate("(()=>{const r=document.querySelector('#task').getBoundingClientRect(),b=document.querySelector('#upload-send').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&b.width>=48})()"))
 }
 await click('#upload-send');await wait("!document.querySelector('#task').open&&[...document.querySelectorAll('#objects li')].some(e=>e.textContent.includes('Browser upload.png'))")
 check('Real upload shown in explorer',await evaluate("document.querySelector('#objects').textContent.includes('Browser upload.png')"))
 await wait("!!document.querySelector('#open-upload-folder')")
 check('Upload notification links to containing Nextcloud folder',await evaluate("(()=>{const n=document.querySelector('#upload-notice'),a=document.querySelector('#open-upload-folder'),u=new URL(a.href,location.origin);return n.textContent.includes('Saved in Nextcloud:')&&u.pathname.endsWith('/apps/files/')&&/^\\/Media Storage\\/\\d{4}-\\d{2}-\\d{2}$/.test(u.searchParams.get('dir'))&&u.searchParams.get('view')==='files'&&!u.searchParams.has('openfile')&&!u.searchParams.has('fileid')&&a.target==='_blank'})()"))
 check('Nextcloud Files folder URL is accessible',await evaluate("(async()=>{const r=await fetch(document.querySelector('#open-upload-folder').href,{credentials:'same-origin'});return r.ok&&(r.headers.get('content-type')??'').includes('text/html')})()"))
 await click('#dismiss-upload-notice')
 await wait("[...document.querySelectorAll('#objects li')].find(e=>e.textContent.includes('Browser upload.png'))?.querySelector('img')?.naturalWidth>0")
 check('Installed Nextcloud thumbnail loads',await evaluate("[...document.querySelectorAll('#objects li')].find(e=>e.textContent.includes('Browser upload.png')).querySelector('img').naturalWidth>0"))
 await evaluate("[...document.querySelectorAll('#objects li')].find(e=>e.textContent.includes('Browser upload.png')).querySelector('md-icon-button').id='browser-upload-detail'")
 await click('#browser-upload-detail');await wait("document.querySelector('#details .large-preview img')?.naturalWidth>0")
 check('Real detail preview and dated original path',await evaluate("document.querySelector('#details').textContent.includes('Media Storage/')&&document.querySelector('#details .large-preview img').naturalWidth>0"))
 await click('#close-detail')
 await evaluate("[...document.querySelectorAll('#objects li')].find(e=>e.textContent.includes('Browser upload.png')).querySelector('input').click()")
 await click('#action-remove');await click('#task .dialog-actions md-filled-button');await wait("!document.querySelector('#task').open&&!document.querySelector('#objects').textContent.includes('Browser upload.png')")
 await evaluate("document.querySelector('#media-design').classList.remove('dark')")
}
