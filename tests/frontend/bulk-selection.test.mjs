// SPDX-License-Identifier: AGPL-3.0-or-later
import test from 'node:test'
import assert from 'node:assert/strict'
import {resolveSelection} from '../../src/bulk-selection.js'
const descriptor={scope:{parent:'owned-folder',search:'match',sort:'name',revision:7},total:100,excluded:['n4','n90']}
function fixture(){
 const calls=[]
 return {calls,fetch:async scope=>{calls.push(scope);const nodes=Array.from({length:Math.min(scope.limit,100-scope.offset)},(_,i)=>({id:'n'+(scope.offset+i),name:'Name '+(scope.offset+i),node_type:'media'}));return {nodes,total:100,revision:7,next_offset:scope.offset+nodes.length,has_more:scope.offset+nodes.length<100}}}
}
test('100 matching objects resolve in bounded pages with loaded and unloaded exclusions',async()=>{
 const f=fixture(),progress=[];const rows=await resolveSelection(descriptor,f.fetch,new AbortController().signal,(done,total)=>progress.push([done,total]))
 assert.equal(rows.length,98);assert.equal(rows.at(-1).id,'n99');assert(!rows.some(n=>['n4','n90'].includes(n.id)))
 assert.deepEqual(f.calls.map(c=>[c.offset,c.limit]),[[0,25],[25,25],[50,25],[75,25],[0,1]])
 assert(f.calls.every(c=>c.parent==='owned-folder'&&c.search==='match'&&c.revision===7));assert.deepEqual(progress,[[25,100],[50,100],[75,100],[100,100]])
})
test('revision change or failure at any batch prevents command resolution',async()=>{
 for(const offset of [0,25,50,75]){
  const f=fixture();await assert.rejects(resolveSelection(descriptor,async scope=>{if(scope.offset===offset)throw Object.assign(new Error('Changed'),{status:409});return f.fetch(scope)}),/Changed/)
 }
 const f=fixture();await assert.rejects(resolveSelection(descriptor,async scope=>({...await f.fetch(scope),revision:8})),/collection changed/)
})
test('final check rejects changes after enumeration',async()=>{
 const f=fixture();await assert.rejects(resolveSelection(descriptor,async scope=>({...await f.fetch(scope),revision:scope.limit===1?8:7})),/collection changed/)
})
test('duplicate, malformed or inconsistent pages never produce a selection',async()=>{
 for(const corrupt of [d=>({...d,nodes:[d.nodes[0],d.nodes[0]],next_offset:2}),d=>({...d,total:101}),d=>({...d,next_offset:0}),d=>({...d,has_more:false})]){
  const f=fixture();await assert.rejects(resolveSelection(descriptor,async scope=>corrupt(await f.fetch(scope))))
 }
})
test('abort is honored even when transport ignores cancellation',async()=>{
 const f=fixture(),controller=new AbortController();await assert.rejects(resolveSelection(descriptor,async scope=>{const data=await f.fetch(scope);controller.abort();return data},controller.signal),{name:'AbortError'});assert.equal(f.calls.length,1)
})
