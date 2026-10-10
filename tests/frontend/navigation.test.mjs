// SPDX-License-Identifier: AGPL-3.0-or-later
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readLocation,locationHash,folderPath,InvalidLocation} from '../../src/navigation.js'
test('navigation encodes Unicode search and excludes transient credentials/state',()=>{
 const route={page:'objects',bucket:'bucket',folder:'child',search:'ภาพ + & #',sort:'type',detail:'image'}
 const hash=locationHash({...route,secret:'never-store',clipboard:['private']})
 assert.deepEqual(readLocation(hash),route)
 assert.ok(!hash.includes('never-store')&&!hash.includes('private'))
 assert.deepEqual(readLocation('#other'),{page:'objects',bucket:'',folder:'',search:'',sort:'name',detail:''})
 assert.equal(readLocation('#ms:bucket=../other&folder=%3Cscript%3E&page=unknown&sort=bad').bucket,'')
 assert.equal(readLocation('#ms:q='+encodeURIComponent('ก'.repeat(86))).search,'')
 assert.ok(!locationHash({...route,page:'tokens'}).includes('detail='))
})
test('restoration uses current ancestors and rejects foreign roots, cycles and media parents',async()=>{
 const rows={bucket:{id:'bucket',node_type:'bucket',parent_id:''},child:{id:'child',name:'Renamed',node_type:'folder',parent_id:'parent'},parent:{id:'parent',name:'Parent',node_type:'folder',parent_id:'bucket'},other:{id:'other',node_type:'bucket',parent_id:''},media:{id:'media',node_type:'media',parent_id:'bucket'},cycle:{id:'cycle',node_type:'folder',parent_id:'cycle'}}
 const get=async id=>rows[id]??Promise.reject(new Error('Not found'))
 assert.deepEqual(await folderPath('bucket','child',get),[{id:'parent',name:'Parent'},{id:'child',name:'Renamed'}])
 assert.deepEqual(await folderPath('bucket','bucket',get),[])
 for(const node of ['other','media','cycle'])await assert.rejects(folderPath('bucket',node,get),InvalidLocation)
 await assert.rejects(folderPath('other','child',get),InvalidLocation)
 await assert.rejects(folderPath('bucket','missing',get),/Not found/)
 await assert.rejects(folderPath('bucket','n0',async id=>({id,name:id,node_type:'folder',parent_id:'n'+(Number(id.slice(1))+1)})),InvalidLocation)
})
