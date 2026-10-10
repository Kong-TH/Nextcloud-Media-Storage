// SPDX-License-Identifier: AGPL-3.0-or-later
export class ObjectPager {
 constructor(fetchPage,changed=()=>{}){this.fetchPage=fetchPage;this.changed=changed;this.serial=0;this.rows=[];this.total=0;this.more=false;this.loading=false;this.error=null;this.revision=null;this.offset=0}
 cancel(){this.controller?.abort();this.serial++;this.loading=false;this.changed(this)}
 async reset(scope){this.cancel();this.scope={...scope};this.rows=[];this.total=0;this.more=true;this.error=null;this.revision=null;this.offset=0;return this.next()}
 async next(){
  if(this.loading||!this.more||!this.scope)return
  const serial=this.serial,controller=new AbortController();this.controller=controller;this.loading=true;this.error=null;this.changed(this)
  try{
   const data=await this.fetchPage({...this.scope,limit:25,offset:this.offset,revision:this.revision},controller.signal)
   if(controller.signal.aborted||serial!==this.serial)return
   if(!Array.isArray(data.nodes)||data.nodes.length>25||!Number.isSafeInteger(data.total)||data.total<0||!Number.isSafeInteger(data.revision)||data.revision<0||!Number.isSafeInteger(data.next_offset)||data.next_offset!==this.offset+data.nodes.length||typeof data.has_more!=='boolean'||data.has_more!==(data.next_offset<data.total)||data.next_offset>data.total||data.has_more&&data.nodes.length===0)throw new Error('Invalid object page. Reload objects and retry.')
   if(this.revision!==null&&data.revision!==this.revision)throw Object.assign(new Error('This collection changed. Reload objects to continue.'),{status:409})
   const ids=new Set(this.rows.map(n=>n.id));
   if(data.nodes.some(n=>!n.id||ids.has(n.id)||(ids.add(n.id),false)))throw Object.assign(new Error('This collection changed. Reload objects to continue.'),{status:409})
   this.rows=[...this.rows,...data.nodes];this.total=data.total;this.more=data.has_more;this.offset=data.next_offset;this.revision=data.revision
  }catch(error){if(!controller.signal.aborted&&serial===this.serial)this.error=error}
  finally{if(serial===this.serial){this.loading=false;this.changed(this)}}
 }
}
