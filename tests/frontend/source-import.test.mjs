// SPDX-License-Identifier: AGPL-3.0-or-later
import assert from 'node:assert/strict'
import {importIdentity,eligibleSource,sourceRoots,prepareImport,executeImport,checkImportDestination} from '../../src/source-import.js'
assert.match(importIdentity(),/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
const f=(id,path,folder=false)=>({id,path,name:path.split('/').at(-1),folder,mime:folder?'httpd/unix-directory':'image/png'})
const a=f(1,'A',true),sub=f(2,'A/Sub',true),file=f(3,'A/one.png'),deep=f(4,'A/Sub/deep.png'),b=f(5,'B',true)
assert.equal(eligibleSource({...file,mime:'application/pdf'}),false)
assert.equal(eligibleSource({...file,id:0}),false)
assert.deepEqual(sourceRoots([file,a,sub]),[a])
assert.deepEqual(sourceRoots([a,a,b]),[a,b])
const tree={A:[file,sub,{...f(6,'A/no.pdf'),mime:'application/pdf'}],'A/Sub':[deep],B:[]}
const plan=await prepareImport([file,a,b],async p=>tree[p])
assert.equal(plan.entries.length,5);assert.equal(plan.covered,1);assert.deepEqual(plan.skipped,['A/no.pdf'])
const calls=[];let fail=true
const write=async payload=>{calls.push(payload);if(payload.file_id===3&&fail){fail=false;throw new Error('Lost response')}return {id:'v'+payload.file_id}}
await assert.rejects(executeImport(plan,'request','root',write),/Lost response/)
assert.equal(plan.created.size,2)
await executeImport(plan,'request','root',write)
assert.equal(plan.created.size,5)
assert.equal(calls.filter(p=>p.file_id===1).length,1)
assert.equal(calls.find(p=>p.file_id===4).parent_id,'v2')
assert.equal(calls.find(p=>p.file_id===3).parent_id,'v1')
assert.equal(calls.filter(p=>p.file_id===3).length,2)
await assert.rejects(prepareImport([a],async()=>[a]),/folder changed/)
await assert.rejects(prepareImport([f(7,'X/same.png'),f(8,'Y/same.png')],async()=>[]),/share the destination name/)
await assert.rejects(prepareImport([a],async()=>Array.from({length:1001},(_,i)=>f(i+10,'A/'+i+'.png'))),/too many/)
await assert.rejects(prepareImport([],async()=>[]),/Choose/)
const abort=new AbortController(),pending=await prepareImport([file,deep],async()=>[])
await assert.rejects(executeImport(pending,'request','root',async p=>{abort.abort();return {id:'v'+p.file_id}},abort.signal),{name:'AbortError'})
assert.equal(pending.created.size,1)
const empty=await prepareImport([b],async()=>[]);assert.equal(empty.entries.length,1)
console.log('Source selection, overlap, traversal, partial retry and cancellation cases passed.')

await assert.rejects(prepareImport([a,file],async()=>[]),/selected source moved/)

// Per-root modes omit only outer wrappers; selected descendants follow their ancestor.
const ten=Array.from({length:10},(_,i)=>f(20+i,'A/file-'+i+'.png'))
const bFile=f(40,'B/other.png'),trees={A:[...ten,sub],'A/Sub':[deep],B:[bFile]}
for(const modes of [{},{1:'contents'},{5:'contents'},{1:'contents',5:'contents'}]){
 const p=await prepareImport([a,b,sub],async path=>trees[path],undefined,undefined,modes)
 assert.equal(p.covered,1)
 assert.equal(p.entries.length,15-(modes[1]==='contents'?1:0)-(modes[5]==='contents'?1:0))
 assert.equal(p.entries.some(e=>e.source.id===1),modes[1]!=='contents')
 assert.equal(p.entries.some(e=>e.source.id===5),modes[5]!=='contents')
 assert.equal(p.entries.find(e=>e.source.id===2).parentSource,modes[1]==='contents'?null:1)
 assert.equal(p.entries.find(e=>e.source.id===4).parentSource,2)
 assert.equal(p.entries.find(e=>e.source.id===20).virtualPath,modes[1]==='contents'?'/file-0.png':'/A/file-0.png')
 assert.equal(p.entries.find(e=>e.source.id===40).parentSource,modes[5]==='contents'?null:5)
}
const flat=await prepareImport([a,sub],async path=>trees[path],undefined,undefined,{1:'contents',2:'contents'})
assert.equal(flat.entries.find(e=>e.source.id===2).parentSource,null)
assert.equal(flat.entries.find(e=>e.source.id===4).parentSource,2)
const noContents=await prepareImport([b],async()=>[],undefined,undefined,{5:'contents'})
assert.equal(noContents.entries.length,0);assert.equal(noContents.emptyFlattened,1)
assert.equal(await executeImport(noContents,'request','root',async()=>{throw new Error('Unexpected write')}),0)
await assert.rejects(prepareImport([a,b],async path=>path==='A'?[f(51,'A/same.png')]:[f(52,'B/same.png')],undefined,undefined,{1:'contents',5:'contents'}),/Destination name conflict/)
await assert.rejects(prepareImport([a],async()=>[f(51,'A/same.png'),f(52,'A/same.png')]),/Destination name conflict/)
await assert.rejects(prepareImport([a],async()=>[],undefined,undefined,{1:'invalid'}),/valid folder mode/)
await assert.rejects(prepareImport([a],async path=>[f(path.split('/').length+1,path+'/Next',true)]),/128 folder levels/)
await assert.rejects(prepareImport([a],async()=>Array.from({length:1000},(_,i)=>f(i+100,'A/'+i+'.png')),undefined,undefined,{1:'contents'}),/1000 source entries/)
let enumerateAbort=new AbortController()
await assert.rejects(prepareImport([a],async()=>{enumerateAbort.abort();return []},enumerateAbort.signal),{name:'AbortError'})
const destRows=Array.from({length:51},(_,i)=>({id:'d'+i,name:'existing-'+i}))
let changed=false
const page=async scope=>{const list=destRows.slice(scope.offset,scope.offset+scope.limit);return {nodes:list,total:destRows.length,next_offset:scope.offset+list.length,has_more:scope.offset+list.length<destRows.length,revision:changed?2:1}}
await checkImportDestination(flat,'root',page)
destRows[50].name='file-0.png'
await assert.rejects(checkImportDestination(flat,'root',page),/already exists/)
destRows[50].name='existing-50'
await assert.rejects(checkImportDestination(flat,'root',async scope=>{const result=await page(scope);if(scope.offset===25)result.revision=2;return result}),/collection changed/)
await assert.rejects(checkImportDestination(flat,'root',async scope=>({...await page(scope),total:10001,has_more:true})),/10000 entries/)
await assert.rejects(checkImportDestination(flat,'root',async scope=>{const result=await page(scope);if(scope.limit===1)result.total++;return result}),/Destination changed/)
const flatAbort=new AbortController();let writes=0
await assert.rejects(executeImport(flat,'same-request','root',async payload=>{writes++;if(writes===2)flatAbort.abort();return {id:'flat-'+payload.file_id}},flatAbort.signal),{name:'AbortError'})
assert.equal(flat.created.size,2)
await executeImport(flat,'same-request','root',async payload=>({id:'flat-'+payload.file_id}))
assert.equal(flat.created.size,flat.entries.length)
console.log('Per-folder keep/contents combinations, nested preservation, bounds, conflicts, preflight revisions and partial continuation passed.')

const unsupportedEmpty=await prepareImport([b],async()=>[{...f(60,'B/no.pdf'),mime:'application/pdf'}],undefined,undefined,{5:'contents'})
assert.equal(unsupportedEmpty.entries.length,0);assert.equal(unsupportedEmpty.emptyFlattened,1);assert.equal(unsupportedEmpty.skipped.length,1)
const maximum=await prepareImport([a],async()=>Array.from({length:999},(_,i)=>f(i+100,'A/'+i+'.png')),undefined,undefined,{1:'contents'})
assert.equal(maximum.entries.length,999)
await assert.rejects(prepareImport([a,b],async path=>{if(path==='B')throw new Error('Folder unavailable');return []}),/Folder unavailable/)

const nestedOnly=await prepareImport([a],async path=>path==='A'?[sub]:[deep],undefined,undefined,{1:'contents'})
assert.deepEqual(nestedOnly.entries.map(e=>e.virtualPath),['/Sub','/Sub/deep.png'])
