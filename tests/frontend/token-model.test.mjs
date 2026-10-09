// SPDX-License-Identifier: AGPL-3.0-or-later
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {tokenState,matchesToken,expiryBounds,localMinute} from '../../src/token-model.js'
test('Status precedence and inclusive two-week boundary',()=>{
 const now=1800000000
 assert.equal(tokenState({expires_at:now,revoked_at:null},now),'expired')
 assert.equal(tokenState({expires_at:now-1,revoked_at:now-2},now),'revoked')
 assert.equal(matchesToken({expires_at:now+14*86400},'expiring',now),true)
 assert.equal(matchesToken({expires_at:now+14*86400+1},'expiring',now),false)
 assert.equal(matchesToken({expires_at:now+10,status:'revoked'},'expiring',now),false)
 assert.equal(matchesToken({expires_at:now},'active',now),false)
})
test('Configured expiry range clamps suggestion and rounds inside backend bounds',()=>{
 for(const now of [1800000000,1800000001,1800000059])for(const seconds of [60,3600,31536000]){
  const bounds=expiryBounds({server_time:now,max_lifetime_seconds:seconds})
  assert.ok(bounds.min>now&&bounds.max<=now+seconds&&bounds.min<=bounds.max)
  assert.ok(bounds.suggested>=bounds.min&&bounds.suggested<=bounds.max)
  assert.equal(bounds.min%60,0);assert.equal(bounds.max%60,0)
  assert.equal(new Date(localMinute(bounds.suggested)).getTime()/1000,bounds.suggested)
 }
})
test('Missing or invalid authoritative policy fails closed',()=>{
 for(const policy of [undefined,{}, {server_time:1,max_lifetime_seconds:59},{server_time:1,max_lifetime_seconds:31536001},{server_time:'1',max_lifetime_seconds:60}])assert.throws(()=>expiryBounds(policy),/unavailable/)
})
