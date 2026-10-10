// SPDX-License-Identifier: AGPL-3.0-or-later
import {mediaType,validName} from './rules.js'
import {ObjectPager} from './object-pager.js'
export const MAX_SOURCES=1000
export function importIdentity(){
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128
 const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('')
 return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-')
}
export function eligibleSource(source){return Number.isSafeInteger(source.id)&&source.id>0&&(source.folder||mediaType(source.mime))}
function validate(source){
 if(!eligibleSource(source)||!validName(source.name)||!source.path||source.path.split('/').some(p=>!validName(p)))throw new Error('Source is unavailable or has an invalid name. Browse again.')
}
export function sourceRoots(sources){
 const unique=[...new Map(sources.map(s=>[s.id,s])).values()];unique.forEach(validate)
 return unique.filter(s=>!unique.some(p=>p.folder&&p.id!==s.id&&s.path.startsWith(p.path+'/')))
}
function stopped(signal){if(signal?.aborted)throw new DOMException('Import stopped.','AbortError')}
export async function prepareImport(sources,enumerate,signal,onProgress=()=>{},modes={}){
 stopped(signal)
 if(!sources.length||sources.length>MAX_SOURCES)throw new Error('Choose between 1 and 1000 sources.')
 const roots=sourceRoots(sources),names=new Set(),entries=[],seen=new Set(),skipped=[];let scanned=roots.length,emptyFlattened=0
 for(const source of roots){if(source.folder&&modes[source.id]&&!['keep','contents'].includes(modes[source.id]))throw new Error('Choose a valid folder mode.');if(source.folder&&modes[source.id]==='contents')continue;if(names.has(source.name))throw new Error('Selected sources share the destination name “'+source.name+'”. Choose them separately or rename a single file.');names.add(source.name)}
 const queue=roots.map(source=>({source,parentSource:null,depth:1}))
 while(queue.length){
  stopped(signal)
  const item=queue.shift(),s=item.source;validate(s)
  if(seen.has(s.id))throw new Error('A source occurs more than once or its folder structure changed. Browse again.')
  if(entries.length>=MAX_SOURCES||item.depth>128)throw new Error('Import supports at most 1000 entries and 128 folder levels per task. Choose smaller folders.')
  seen.add(s.id);const flattened=item.depth===1&&s.folder&&modes[s.id]==='contents'
  if(!flattened)entries.push(item);onProgress(seen.size)
  if(seen.size%25===0)await new Promise(resolve=>setTimeout(resolve,0))
  if(s.folder){
   const children=await enumerate(s.path,signal);stopped(signal)
   if(flattened&&!children.some(eligibleSource))emptyFlattened++
   if(children.length>MAX_SOURCES)throw new Error('This folder has too many entries. Choose a smaller folder.')
   for(const child of children){
    if(++scanned>MAX_SOURCES)throw new Error('Import supports at most 1000 source entries, including unsupported files. Choose smaller folders.')
    if(!eligibleSource(child)){skipped.push(child.path);continue}
    if(!child.path.startsWith(s.path+'/')||child.path.slice(s.path.length+1).includes('/'))throw new Error('Source folder changed. Browse again.')
    queue.push({source:child,parentSource:flattened?null:s.id,depth:item.depth+1})
    if(queue.length+entries.length>MAX_SOURCES)throw new Error('Import supports at most 1000 entries per task. Choose smaller folders.')
   }
  }
 }
 if(sources.some(s=>!seen.has(s.id)))throw new Error('A selected source moved or became unsupported during enumeration. Browse again.')
 const siblings=new Map(),paths=new Map()
 for(const item of entries){
  const parent=item.parentSource,names=siblings.get(parent)??new Set()
  if(names.has(item.source.name))throw new Error('Destination name conflict: '+item.source.name+'. Change folder choices or selection.')
  names.add(item.source.name);siblings.set(parent,names)
  item.virtualPath=(parent===null?'':paths.get(parent))+'/'+item.source.name;paths.set(item.source.id,item.virtualPath)
 }
 return {entries,skipped,emptyFlattened,covered:sources.length-roots.length,created:new Map()}
}
export async function checkImportDestination(plan,destination,fetchPage,signal){
 const names=new Set(plan.entries.filter(e=>e.parentSource===null).map(e=>e.source.name))
 if(!names.size)return
 stopped(signal);const pager=new ObjectPager(fetchPage)
 const abort=()=>pager.cancel();signal?.addEventListener('abort',abort,{once:true})
 try{
  await pager.reset({parent_id:destination,sort:'name',paged:'true'});stopped(signal)
  let checked=0
  while(true){
   stopped(signal);if(pager.error)throw pager.error
   if(pager.total>10000)throw new Error('Destination exceeds 10000 entries. Choose a smaller destination folder.')
   for(const row of pager.rows.slice(checked)){if(names.has(row.name))throw new Error('Destination name already exists: '+row.name+'. Change choices or selection.')}
   checked=pager.rows.length
   if(!pager.more)break
   await pager.next()
  }
  const final=await fetchPage({...pager.scope,limit:1,offset:0,revision:pager.revision},signal);stopped(signal)
  if(final.revision!==pager.revision||final.total!==pager.total)throw new Error('Destination changed. Prepare the import again.')
 }finally{signal?.removeEventListener('abort',abort);pager.cancel()}

}
export async function executeImport(plan,requestId,destination,write,signal,onProgress=()=>{}){
 let done=plan.created.size;onProgress(done,plan.entries.length)
 for(const entry of plan.entries){
  stopped(signal)
  if(plan.created.has(entry.source.id))continue
  const parent=entry.parentSource===null?destination:plan.created.get(entry.parentSource)
  if(!parent)throw new Error('Import parent is unavailable.')
  // Do not abort an in-flight write: remember its result before stopping future work.
  const result=await write({request_id:requestId,file_id:entry.source.id,folder:entry.source.folder,name:entry.source.name,parent_id:parent})
  if(!result?.id)throw new Error('Import response is incomplete. Retry this task.')
  plan.created.set(entry.source.id,result.id);onProgress(++done,plan.entries.length)
 }
 stopped(signal)
 return done
}
