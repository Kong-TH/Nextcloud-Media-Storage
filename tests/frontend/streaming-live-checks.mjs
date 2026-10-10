// SPDX-License-Identifier: AGPL-3.0-or-later
// Native browser playback through anonymous temporary delivery, not the session DAV bridge.
import {randomBytes} from 'node:crypto'
export async function streamingPlayerChecks({send,evaluate,check,wait,videos}){
 await evaluate("window.msStreamingFixtures=[]")
 for(const fixture of videos){
  const id=randomBytes(16).toString('hex')
  const prepared=await evaluate(`(async()=>{const api='/index.php/apps/mediastorage/api/v1',headers={requesttoken:document.head.dataset.requesttoken},list=await fetch(api+'/nodes',{headers});if(!list.ok)throw new Error('Player source root unavailable');const root=(await list.json()).root_id,body=new FormData();body.append('parent_id',root);body.append('name',${JSON.stringify('Stream player.'+fixture.extension)});body.append('request_id',${JSON.stringify(id)});body.append('file',new Blob([new Uint8Array(${JSON.stringify([...fixture.bytes])})],{type:${JSON.stringify(fixture.mime)}}),${JSON.stringify('fixture.'+fixture.extension)});const response=await fetch(api+'/uploads',{method:'POST',headers,body});if(!response.ok)throw new Error('Player fixture upload failed');const node=(await response.json()).node,grantResponse=await fetch(api+'/nodes/'+node.id+'/signed-urls',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({ttl_seconds:900})});if(grantResponse.status!==201)throw new Error('Player grant issuance failed');const grant=await grantResponse.json();window.msStreamingFixtures.push({url:grant.url,id:grant.access.id});const detailResponse=await fetch(api+'/nodes/'+node.id,{headers});if(!detailResponse.ok)throw new Error('Player source metadata unavailable');return (await detailResponse.json()).binding_status==='available'})()`)
  check('Installed '+fixture.extension+' source uploaded and signed',prepared)
 }
 // The public player must work without the account's Nextcloud session cookies.
 const grants=await evaluate('window.msStreamingFixtures')
 const origin=await evaluate('location.origin')
 await send('Network.clearBrowserCookies')
 // Dispose of the app's session-expiry navigation before exercising public delivery.
 await send('Page.navigate',{url:origin+'/status.php'})
 await wait("location.pathname==='/status.php'&&document.readyState==='complete'")
 await evaluate(`(()=>{document.body.replaceChildren();window.msStreamingFixtures=${JSON.stringify(grants)}})()`)
 check('Session cookies removed before public player checks',await evaluate("(async()=>{const r=await fetch('/index.php/apps/mediastorage/api/v1/nodes',{redirect:'manual'});return [401,403,412,0].includes(r.status)})()"))
 for(let index=0;index<videos.length;index++){
  const fixture=videos[index]
  await evaluate(`(()=>{document.querySelector('#stream-acceptance-player')?.remove();const v=document.createElement('video');v.id='stream-acceptance-player';v.controls=true;v.muted=true;v.preload='metadata';v.src=window.msStreamingFixtures[${index}].url;document.body.append(v)})()`)
  await wait("document.querySelector('#stream-acceptance-player')?.readyState>=1")
  check('Anonymous '+fixture.extension+' native metadata and controls',await evaluate("(()=>{const v=document.querySelector('#stream-acceptance-player');return v.controls&&v.videoWidth===160&&v.videoHeight===90&&v.duration>1.5&&v.duration<3&&!v.error})()"))
  for(const start of [0,Math.floor(fixture.bytes.length/2),fixture.bytes.length-32]){
   check('Anonymous '+fixture.extension+' exact range at '+start,await evaluate(`(async()=>{const r=await fetch(window.msStreamingFixtures[${index}].url,{headers:{Range:'bytes=${start}-${start+31}'},credentials:'omit'}),b=new Uint8Array(await r.arrayBuffer());return r.status===206&&r.headers.get('Content-Range')===${JSON.stringify('bytes '+start+'-'+(start+31)+'/'+fixture.bytes.length)}&&r.headers.get('Cache-Control')?.includes('no-store')&&JSON.stringify([...b])===${JSON.stringify(JSON.stringify([...fixture.bytes.subarray(start,start+32)]))}})()`))
  }
  check('Anonymous '+fixture.extension+' HEAD and 304 carry no body',await evaluate(`(async()=>{const url=window.msStreamingFixtures[${index}].url,h=await fetch(url,{method:'HEAD',credentials:'omit'}),tag=h.headers.get('ETag'),c=await fetch(url,{headers:{'If-None-Match':tag},credentials:'omit'});return h.status===200&&h.headers.get('Content-Length')===${JSON.stringify(String(fixture.bytes.length))}&&(await h.arrayBuffer()).byteLength===0&&c.status===304&&(await c.arrayBuffer()).byteLength===0&&c.headers.get('Cache-Control')?.includes('no-store')})()`))
  await evaluate("(async()=>{const v=document.querySelector('#stream-acceptance-player');await v.play()})()")
  await wait("document.querySelector('#stream-acceptance-player')?.currentTime>0.1")
  check('Anonymous '+fixture.extension+' plays through temporary URL',await evaluate("!document.querySelector('#stream-acceptance-player').error"))
  await evaluate("(()=>{const v=document.querySelector('#stream-acceptance-player');v.pause();v.currentTime=1.3})()")
  await wait("!document.querySelector('#stream-acceptance-player')?.seeking&&document.querySelector('#stream-acceptance-player')?.currentTime>=1.2")
  check('Anonymous '+fixture.extension+' native seek completes',await evaluate("!document.querySelector('#stream-acceptance-player').error"))
  await evaluate("(()=>{const v=document.querySelector('#stream-acceptance-player');v.pause();v.removeAttribute('src');v.load();v.remove()})()")
 }
 await evaluate("delete window.msStreamingFixtures")
}
