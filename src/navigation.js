// SPDX-License-Identifier: AGPL-3.0-or-later
const id = value => /^[A-Za-z0-9_-]{1,64}$/.test(value ?? '') ? value : ''
export function readLocation(hash) {
 const params = new URLSearchParams(hash.startsWith('#ms:') ? hash.slice(4) : '')
 const search = params.get('q') ?? ''
 return {page:params.get('page')==='tokens'?'tokens':'objects',bucket:id(params.get('bucket')),folder:id(params.get('folder')),
  search:new TextEncoder().encode(search).length<=255?search:'',sort:params.get('sort')==='type'?'type':'name',detail:id(params.get('detail'))}
}
export function locationHash(route) {
 const params = new URLSearchParams({bucket:route.bucket})
 if(route.page==='tokens')params.set('page','tokens')
 if(route.folder)params.set('folder',route.folder)
 if(route.search)params.set('q',route.search)
 if(route.sort==='type')params.set('sort','type')
 if(route.detail&&route.page!=='tokens')params.set('detail',route.detail)
 return '#ms:'+params.toString()
}
export class InvalidLocation extends Error {}
// Server parent relationships, not URL-provided names, establish bucket membership.
export async function folderPath(bucket, folder, getNode) {
 const path=[],seen=new Set()
 let cursor=folder
 while(cursor&&cursor!==bucket) {
  if(seen.has(cursor)||path.length>=128)throw new InvalidLocation('Invalid folder hierarchy.')
  seen.add(cursor)
  const node=await getNode(cursor)
  if(node.node_type!=='folder'||!node.parent_id)throw new InvalidLocation('Folder is outside this bucket.')
  path.unshift({id:node.id,name:node.name});cursor=node.parent_id
 }
 if(folder&&cursor!==bucket)throw new InvalidLocation('Folder is outside this bucket.')
 return path
}
