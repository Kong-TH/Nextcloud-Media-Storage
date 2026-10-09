// SPDX-License-Identifier: AGPL-3.0-or-later
import {generateUrl,generateRemoteUrl} from '@nextcloud/router'
import {getRequestToken,getCurrentUser} from '@nextcloud/auth'
export class ApiError extends Error { constructor(message,status){super(message);this.status=status} }
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
export async function allBuckets(){const rows=[];let offset=0;while(true){const page=await api('/buckets?offset='+offset);rows.push(...page.buckets);if(!page.has_more)return rows;offset+=100}}
export async function davFiles(path='',signal){
 const user=getCurrentUser()?.uid;if(!user)throw new ApiError('Sign in to browse Nextcloud files.',401)
 const root=generateRemoteUrl('dav')+'/files/'+encodeURIComponent(user)+'/'
 const response=await fetch(root+path.split('/').filter(Boolean).map(encodeURIComponent).join('/'),{method:'PROPFIND',credentials:'same-origin',signal,headers:{Depth:'1',requesttoken:getRequestToken()??'','Content-Type':'application/xml'},body:'<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns"><d:prop><d:displayname/><d:resourcetype/><d:getcontenttype/><oc:fileid/></d:prop></d:propfind>'})
 if(!response.ok)throw new ApiError('Could not browse Nextcloud files. Retry or choose another folder.',response.status)
 const xml=new DOMParser().parseFromString(await response.text(),'application/xml');if(xml.querySelector('parsererror'))throw new Error('Invalid file listing.')
 return [...xml.getElementsByTagNameNS('DAV:','response')].slice(1).flatMap(row=>{
  const props=[...row.getElementsByTagNameNS('DAV:','propstat')].find(p=>/ 200 /.test(p.getElementsByTagNameNS('DAV:','status')[0]?.textContent??''))
  if(!props)return []
  const href=row.getElementsByTagNameNS('DAV:','href')[0]?.textContent??''
  const decoded=decodeURIComponent(new URL(href,location.origin).pathname).replace(/\/$/,'')
  const name=props.getElementsByTagNameNS('DAV:','displayname')[0]?.textContent||decoded.split('/').pop()
  return [{name,path:[path,name].filter(Boolean).join('/'),folder:props.getElementsByTagNameNS('DAV:','collection').length>0,id:Number(props.getElementsByTagNameNS('http://owncloud.org/ns','fileid')[0]?.textContent),mime:props.getElementsByTagNameNS('DAV:','getcontenttype')[0]?.textContent??''}]
 })
}
