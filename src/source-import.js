// SPDX-License-Identifier: AGPL-3.0-or-later
import {mediaType,validName} from './rules.js'
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
export async function prepareImport(sources,enumerate,signal,onProgress=()=>{}){
 stopped(signal)
 if(!sources.length||sources.length>MAX_SOURCES)throw new Error('Choose between 1 and 1000 sources.')
 const roots=sourceRoots(sources),names=new Set(),entries=[],seen=new Set(),skipped=[];let scanned=roots.length
 for(const source of roots){if(names.has(source.name))throw new Error('Selected sources share the destination name “'+source.name+'”. Choose them separately or rename a single file.');names.add(source.name)}
 const queue=roots.map(source=>({source,parentSource:null,depth:1}))
 while(queue.length){
  stopped(signal)
  const item=queue.shift(),s=item.source;validate(s)
  if(seen.has(s.id))throw new Error('A source occurs more than once or its folder structure changed. Browse again.')
  if(entries.length>=MAX_SOURCES||item.depth>128)throw new Error('Import supports at most 1000 entries and 128 folder levels per task. Choose smaller folders.')
  seen.add(s.id);entries.push(item);onProgress(entries.length)
  if(s.folder){
   const children=await enumerate(s.path,signal);stopped(signal)
   if(children.length>MAX_SOURCES)throw new Error('This folder has too many entries. Choose a smaller folder.')
   for(const child of children){
    if(++scanned>MAX_SOURCES)throw new Error('Import supports at most 1000 source entries, including unsupported files. Choose smaller folders.')
    if(!eligibleSource(child)){skipped.push(child.path);continue}
    if(!child.path.startsWith(s.path+'/')||child.path.slice(s.path.length+1).includes('/'))throw new Error('Source folder changed. Browse again.')
    queue.push({source:child,parentSource:s.id,depth:item.depth+1})
    if(queue.length+entries.length>MAX_SOURCES)throw new Error('Import supports at most 1000 entries per task. Choose smaller folders.')
   }
  }
 }
 if(sources.some(s=>!seen.has(s.id)))throw new Error('A selected source moved or became unsupported during enumeration. Browse again.')
 return {entries,skipped,covered:sources.length-roots.length,created:new Map()}
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
