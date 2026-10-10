// SPDX-License-Identifier: AGPL-3.0-or-later
// Resolve metadata only when a command needs the all-matching selection.
export async function resolveSelection(descriptor,fetchPage,signal,progress=()=>{}) {
 const rows=[],seen=new Set(),excluded=new Set(descriptor.excluded),scope={...descriptor.scope}
 let offset=0
 do {
  signal?.throwIfAborted()
  const data=await fetchPage({...scope,offset,limit:25},signal)
  signal?.throwIfAborted()
  if(data.revision!==scope.revision||data.total!==descriptor.total||!Array.isArray(data.nodes)||data.nodes.length>25||data.next_offset!==offset+data.nodes.length||data.next_offset>data.total||data.has_more!==(data.next_offset<data.total)||data.has_more&&!data.nodes.length)throw Object.assign(new Error('This collection changed. Reload objects and select again.'),{status:409})
  for(const node of data.nodes){
   if(!node.id||seen.has(node.id))throw new Error('Invalid selection page. Reload objects and select again.')
   seen.add(node.id)
   if(!excluded.has(node.id))rows.push({id:node.id,name:node.name,node_type:node.node_type})
  }
  offset=data.next_offset;progress(offset,descriptor.total)
 }while(offset<descriptor.total)
 // Catch changes after the last batch, before beginning any command.
 const final=await fetchPage({...scope,offset:0,limit:1},signal)
 signal?.throwIfAborted()
 if(final.revision!==scope.revision||final.total!==descriptor.total)throw Object.assign(new Error('This collection changed. Reload objects and select again.'),{status:409})
 return rows
}
