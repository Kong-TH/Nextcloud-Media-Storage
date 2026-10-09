/* In-memory design model. Never calls Nextcloud or mutates physical files. */
'use strict';
class VirtualReferenceModel {
 constructor(items) { this.items=items; this.nextId=Math.max(20,...items.map(x=>x.id))+1; }
 get(id) { const item=this.items.find(x=>x.id===id); if(!item)throw new Error('A source reference is no longer available.'); return item; }
 name(value) {
  if(!value||value!==value.trim()||/[\\/\x00-\x1f\x7f]/.test(value)||['.','..'].includes(value)||new TextEncoder().encode(value).length>255) throw new Error('Use a valid name up to 255 UTF-8 bytes without path separators or surrounding spaces.');
 }
 roots(ids) {
  const chosen=[...new Set(ids)].map(id=>this.get(id)); const selected=new Set(chosen.map(x=>x.id));
  return chosen.filter(item=>{let parent=item.parent;while(parent!==null){if(selected.has(parent))return false;parent=this.get(parent).parent;}return true;});
 }
 subtree(id) {
  const result=[];const visit=(current,depth)=>{if(depth>=128||result.length>=1000)throw new Error('The virtual subtree exceeds the design limit.');result.push(current);for(const child of this.items.filter(x=>x.parent===current.id))visit(child,depth+1);};
  visit(this.get(id),1);return result;
 }
 destination(bucket,parent,sources=[]) {
  if(parent!==null){const target=this.get(parent);if(target.type!=='Folder'||target.bucket!==bucket)throw new Error('Choose a folder in the current library.');let cursor=parent,depth=0;while(cursor!==null){cursor=this.get(cursor).parent;if(++depth>=126)throw new Error('The destination is too deep.');}}
  for(const source of sources){
   if(source.bucket!==bucket)throw new Error('Cross-bucket actions await the bucket design.');
   let cursor=parent,depth=0;
   while(cursor!==null){if(cursor===source.id)throw new Error('A folder cannot be moved or copied into itself or a descendant.');cursor=this.get(cursor).parent;if(++depth>=128)throw new Error('The destination is too deep.');}
   const height=(item)=>{const children=this.items.filter(x=>x.parent===item.id);return 1+(children.length?Math.max(...children.map(height)):0);};
   if(depth+height(source)+1>=128)throw new Error('The destination is too deep.');
  }
 }
 collisions(names,bucket,parent,ignored=[]) {
  const seen=new Set();for(const name of names){this.name(name);if(seen.has(name)||this.items.some(x=>x.bucket===bucket&&x.parent===parent&&x.name===name&&!ignored.includes(x.id)))throw new Error('A reference with this name already exists in the destination. Choose a different link name.');seen.add(name);}
 }
 create(name,bucket,parent) {this.destination(bucket,parent);this.collisions([name],bucket,parent);const item={id:this.nextId++,bucket,parent,name,type:'Folder'};this.items.push(item);return item;}
 rename(id,name) {const item=this.get(id);this.collisions([name],item.bucket,item.parent,[id]);item.name=name;}
 move(ids,bucket,parent) {const sources=this.roots(ids);this.destination(bucket,parent,sources);this.collisions(sources.map(x=>x.name),bucket,parent,sources.map(x=>x.id));for(const source of sources)source.parent=parent;}
 copy(ids,bucket,parent,names) {
  const sources=this.roots(ids);if(sources.length!==names.length)throw new Error('The source selection changed. Copy the references again.');this.destination(bucket,parent,sources);this.collisions(names,bucket,parent);
  const staged=[];let candidate=this.nextId;
  const clone=(source,destination,name)=>{const node={...source,id:candidate++,parent:destination,bucket,name};staged.push(node);if(staged.length>1000)throw new Error('The selection exceeds the design limit.');for(const child of this.items.filter(x=>x.parent===source.id))clone(child,node.id,child.name);};
  for(let i=0;i<sources.length;i++)clone(sources[i],parent,names[i]);
  this.items.push(...staged);this.nextId=candidate;return staged;
 }
 remove(ids) {const doomed=new Set(this.roots(ids).flatMap(x=>this.subtree(x.id).map(y=>y.id)));if(doomed.size>1000)throw new Error('The selection exceeds the design limit.');for(let i=this.items.length-1;i>=0;i--)if(doomed.has(this.items[i].id))this.items.splice(i,1);return doomed.size;}
}
globalThis.VirtualReferenceModel=VirtualReferenceModel;
