// SPDX-License-Identifier: AGPL-3.0-or-later
export const tokenGroups = [
 {id:'active',label:'Active tokens'},
 {id:'expiring',label:'Tokens expiring in 2 weeks'},
 {id:'revoked',label:'Revoked tokens'},
 {id:'expired',label:'Expired tokens'},
]
export function tokenState(token, now) {
 if(token.revoked_at != null || token.status==='revoked')return 'revoked'
 return token.expires_at<=now?'expired':'active'
}
export function matchesToken(token, group, now) {
 const state=tokenState(token,now)
 return group==='all' || (group==='expiring'?state==='active' && token.expires_at<=now+14*86400:state===group)
}
export function localMinute(seconds) {
 const date=new Date(seconds*1000)
 return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16)
}
export function expiryBounds(policy) {
 if(!Number.isInteger(policy?.server_time)||!Number.isInteger(policy?.max_lifetime_seconds)||policy.max_lifetime_seconds<60||policy.max_lifetime_seconds>31536000)throw new Error('Token lifetime policy is unavailable. Close this dialog and retry after updating the app.')
 const min=Math.ceil((policy.server_time+1)/60)*60
 const max=Math.floor((policy.server_time+policy.max_lifetime_seconds)/60)*60
 return {min,max,suggested:Math.max(min,Math.min(max,Math.floor((policy.server_time+7*86400)/60)*60))}
}
