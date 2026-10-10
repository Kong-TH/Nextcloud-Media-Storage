// SPDX-License-Identifier: AGPL-3.0-or-later
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ObjectPager} from '../../src/object-pager.js'
const page=(total,offset=0,revision=1)=>({nodes:Array.from({length:Math.min(25,total-offset)},(_,i)=>({id:'n'+(offset+i)})),total,revision,next_offset:Math.min(offset+25,total),has_more:offset+25<total})
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
for(const total of [0,1,24,25,26,50,51,100])test('batches and exhaustion '+total,async()=>{
 const calls=[],pager=new ObjectPager(async scope=>{calls.push(scope);return page(total,scope.offset)})
 await pager.reset({parent:'root',sort:'name',search:''});assert.equal(pager.rows.length,Math.min(25,total));assert.equal(calls.length,1)
 while(pager.more)await pager.next()
 assert.equal(pager.rows.length,total);assert.equal(new Set(pager.rows.map(n=>n.id)).size,total)
 const count=calls.length;await pager.next();assert.equal(calls.length,count)
 assert.ok(calls.every(n=>n.limit===25));assert.deepEqual(calls.map(n=>n.offset),Array.from({length:Math.max(1,Math.ceil(total/25))},(_,i)=>i*25))
})
test('one request in flight and stale transport ignored',async()=>{
 const first=deferred(),second=deferred(),calls=[]
 const pager=new ObjectPager((scope,signal)=>{calls.push({scope,signal});return calls.length===1?first.promise:second.promise})
 const old=pager.reset({parent:'old'});await pager.next();assert.equal(calls.length,1)
 const fresh=pager.reset({parent:'fresh'});assert.ok(calls[0].signal.aborted)
 second.resolve(page(1));await fresh;first.resolve(page(25));await old
 assert.equal(pager.rows.length,1);assert.equal(pager.scope.parent,'fresh');assert.equal(pager.loading,false)
})
test('append retry retains rows and same offset; concurrent end signals deduplicate',async()=>{
 let fail=true,calls=0;const waiting=deferred();const pager=new ObjectPager(async scope=>{calls++;if(!scope.offset)return page(51);if(fail)throw new Error('Offline');return waiting.promise})
 await pager.reset({parent:'root'});await pager.next();assert.equal(pager.rows.length,25);assert.equal(pager.offset,25);assert.equal(pager.error.message,'Offline')
 fail=false;const retry=pager.next();await pager.next();assert.equal(calls,3)
 waiting.resolve(page(51,25));await retry;assert.equal(pager.rows.length,50);assert.equal(pager.error,null)
})
test('changed revision or duplicate page never silently merges',async()=>{
 for(const invalid of [page(50,25,2),{...page(50,25),nodes:page(50).nodes}]){
  let calls=0;const pager=new ObjectPager(async()=>++calls===1?page(50):invalid)
  await pager.reset({parent:'root'});await pager.next();assert.equal(pager.rows.length,25);assert.equal(pager.error.status,409)
 }
})
test('invalid progress cannot loop, and cancellation discards late failure',async()=>{
 const pager=new ObjectPager(async()=>({nodes:[],total:100,revision:1,next_offset:0,has_more:true}))
 await pager.reset({parent:'root'});assert.ok(pager.error);assert.equal(pager.rows.length,0)
 const wait=deferred();pager.fetchPage=()=>wait.promise;const request=pager.reset({parent:'other'});pager.cancel();wait.reject(new Error('Late error'));await request;assert.equal(pager.error,null);assert.equal(pager.loading,false)
})
