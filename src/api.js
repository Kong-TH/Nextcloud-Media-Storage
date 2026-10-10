// SPDX-License-Identifier: AGPL-3.0-or-later
import {generateUrl,generateRemoteUrl} from '@nextcloud/router'
import {getRequestToken,getCurrentUser} from '@nextcloud/auth'
export class ApiError extends Error { constructor(message,status){super(message);this.status=status} }
export function mediaUrl(id,kind='preview',large=false){return generateUrl('/apps/mediastorage/api/v1/nodes/'+encodeURIComponent(id)+'/'+kind)+(large?'?size=large':'')}
export function uploadFile(file,name,parent,id,onProgress,signal){
 return new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest(),body=new FormData()
  body.append('file',file);body.append('name',name);body.append('parent_id',parent);body.append('request_id',id)
  const abort=()=>xhr.abort(),cleanup=()=>signal?.removeEventListener('abort',abort)
  xhr.open('POST',generateUrl('/apps/mediastorage/api/v1/uploads'));xhr.withCredentials=true;xhr.setRequestHeader('requesttoken',getRequestToken()??'');xhr.setRequestHeader('Accept','application/json')
  xhr.upload.onprogress=e=>onProgress(e.lengthComputable?Math.min(1,e.loaded/e.total):null)
  xhr.upload.onload=()=>onProgress(1)
  xhr.onload=()=>{cleanup();let data;try{data=JSON.parse(xhr.responseText)}catch{};if(xhr.status>=200&&xhr.status<300&&data?.state==='complete'&&data.node?.id)resolve(data);else reject(new ApiError(data?.error??(xhr.status===413?'File exceeds a server or proxy request limit. Close this task and choose a smaller file.':xhr.status===401?'Your session expired. Reload and sign in.':'Upload failed. Check its status and retry.'),xhr.status))}
  xhr.onerror=()=>{cleanup();reject(new ApiError('Connection lost. Checking whether the upload completed…',0))}
  xhr.onabort=()=>{cleanup();reject(new DOMException('Transmission stopped.','AbortError'))}
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted){cleanup();reject(new DOMException('Transmission stopped.','AbortError'));return}
  xhr.send(body)
 })
}
export async function api(path,method='GET',body,signal){
 const response=await fetch(generateUrl('/apps/mediastorage/api/v1'+path),{method,credentials:'same-origin',signal,headers:{Accept:'application/json',requesttoken:getRequestToken()??'',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})
 const data=response.status===204?null:await response.json().catch(()=>null)
 if(!response.ok)throw new ApiError(data?.error??(response.status===401?'Your session expired. Reload and sign in.':'Request failed. Please try again.'),response.status)
 return data
}
export async function allNodes(parent,search='',signal){
 const nodes=[];let offset=0,root
 while(true){const page=await api('/nodes?'+new URLSearchParams({parent_id:parent??'',search,limit:'100',offset:String(offset)}).toString().replace('parent_id=&',''),'GET',undefined,signal);root=page.root_id;nodes.push(...page.nodes);if(page.nodes.length<100)break;offset+=100}
 return {nodes,root}
}
export async function allBuckets(signal){const rows=[];let offset=0;while(true){const page=await api('/buckets?offset='+offset,'GET',undefined,signal);rows.push(...page.buckets);if(!page.has_more)return rows;offset+=100}}
export async function davFiles(path='',signal){
 const user=getCurrentUser()?.uid;if(!user)throw new ApiError('Sign in to browse Nextcloud files.',401)
 const root=generateRemoteUrl('dav')+'/files/'+encodeURIComponent(user)+'/'
 const target=root+path.split('/').filter(Boolean).map(encodeURIComponent).join('/')
 const response=await fetch(target,{method:'PROPFIND',credentials:'same-origin',signal,headers:{Depth:'1',requesttoken:getRequestToken()??'','Content-Type':'application/xml'},body:'<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><d:displayname/><d:resourcetype/><d:getcontenttype/><oc:fileid/></d:prop></d:propfind>'})
 if(!response.ok)throw new ApiError('Could not browse Nextcloud files. Retry or choose another folder.',response.status)
 const reader=response.body.getReader(),parts=[];let size=0
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2*1024*1024)throw new Error('This folder listing is too large. Choose a smaller folder in Nextcloud.');parts.push(value)}}finally{await reader.cancel()}
 const bytes=new Uint8Array(size);let at=0;for(const part of parts){bytes.set(part,at);at+=part.length}
 const xml=new DOMParser().parseFromString(new TextDecoder().decode(bytes),'application/xml');if(xml.querySelector('parsererror'))throw new Error('Invalid file listing.')
 const self=decodeURIComponent(new URL(target).pathname).replace(/\/$/,'')
 const responses=[...xml.getElementsByTagNameNS('DAV:','response')].filter(row=>{const href=row.getElementsByTagNameNS('DAV:','href')[0]?.textContent??'';return decodeURIComponent(new URL(href,location.origin).pathname).replace(/\/$/,'')!==self})
 if(responses.length>1000)throw new Error('This folder has more than 1000 entries. Choose a smaller folder in Nextcloud.')
 return responses.flatMap(row=>{
  const props=[...row.getElementsByTagNameNS('DAV:','propstat')].find(p=>/ 200 /.test(p.getElementsByTagNameNS('DAV:','status')[0]?.textContent??''))
  if(!props)return []
  const href=row.getElementsByTagNameNS('DAV:','href')[0]?.textContent??''
  const decoded=decodeURIComponent(new URL(href,location.origin).pathname).replace(/\/$/,'')
  const name=props.getElementsByTagNameNS('DAV:','displayname')[0]?.textContent||decoded.split('/').pop()
  return [{name,path:[path,name].filter(Boolean).join('/'),folder:props.getElementsByTagNameNS('DAV:','collection').length>0,id:Number(props.getElementsByTagNameNS('http://owncloud.org/ns','fileid')[0]?.textContent),mime:props.getElementsByTagNameNS('DAV:','getcontenttype')[0]?.textContent??''}]
 })
}
