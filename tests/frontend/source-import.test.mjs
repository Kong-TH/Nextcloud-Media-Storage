// SPDX-License-Identifier: AGPL-3.0-or-later
import assert from 'node:assert/strict'
import {importIdentity,eligibleSource,sourceRoots,prepareImport,executeImport} from '../../src/source-import.js'
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
