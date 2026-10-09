/* Independent menu and tooltip lifecycles for the standalone design study. */
'use strict';
export default class DesignOverlays {
 constructor(root) {
  this.root=root;this.tip=document.getElementById('action-tooltip');this.menu=null;this.owner=null;this.pending=null;this.suppressed=null;this.overTip=false;this.overOwner=false;
  root.addEventListener('pointerover',e=>{
   if(this.tip.contains(e.target)){this.overTip=true;clearTimeout(this.exitTimer);return;}
   const trigger=e.target.closest('[data-tip]');if(!trigger||trigger.contains(e.relatedTarget))return;
   this.overOwner=true;this.schedule(trigger);
  });
  root.addEventListener('pointerout',e=>{
   if(this.tip.contains(e.target)&&!this.tip.contains(e.relatedTarget)){this.overTip=false;this.delayHide();return;}
   const trigger=e.target.closest('[data-tip]');if(!trigger||trigger.contains(e.relatedTarget))return;
   if(this.suppressed===trigger)this.suppressed=null;
   if(this.owner===trigger||this.pending===trigger){this.overOwner=false;this.delayHide();}
  });
  root.addEventListener('focusin',e=>{const trigger=e.target.closest('[data-tip]');if(trigger)this.schedule(trigger);});
  root.addEventListener('focusout',e=>{if(e.target===this.suppressed)this.suppressed=null;if(e.target===this.owner||e.target===this.pending)this.delayHide();});
  document.addEventListener('pointerdown',e=>{
   if(!this.menu)return;const path=e.composedPath();const {element,trigger}=this.menu;
   const ownedTip=path.includes(this.tip)&&this.owner&&(element.contains(this.owner)||this.owner===trigger);
   if(!path.includes(element)&&!path.includes(trigger)&&!ownedTip)this.closeMenu(false);
  },true);
  document.addEventListener('focusin',e=>{if(this.menu&&!this.menu.element.contains(e.target)&&e.target!==this.menu.trigger)this.closeMenu(false);});
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&!this.tip.hidden){e.preventDefault();e.stopImmediatePropagation();this.hideTip(true);return;}
   if(!this.menu)return;
   const {element,trigger}=this.menu;const entries=[...element.querySelectorAll('[role=menuitem]')].filter(x=>!x.hidden);const index=entries.indexOf(document.activeElement);
   if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();this.closeMenu(true);}
   else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){
    e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?entries.length-1:(index+(e.key==='ArrowDown'?1:-1)+entries.length)%entries.length;entries[next]?.focus();
   }else if(e.key==='Tab'){
    e.preventDefault();const tabs=[...document.querySelectorAll('button,md-text-button,md-filled-button,md-icon-button,md-filled-tonal-icon-button,md-fab,input,select,a[href],[tabindex="0"]')].filter(x=>!x.disabled&&!x.closest('[inert]')&&(x===trigger||x.tabIndex>=0||(x.localName.startsWith('md-')&&!x.hasAttribute('tabindex')))&&x.getClientRects().length&&!element.contains(x));
    const next=tabs[tabs.indexOf(trigger)+(e.shiftKey?-1:1)];this.closeMenu(false);(next??trigger).focus();
   }
  },true);
  root.addEventListener('click',e=>{if(e.target.closest('button,md-text-button,md-icon-button,md-filled-tonal-icon-button,md-fab')&&!this.tip.contains(e.target))this.hideTip(true);},true);
  new MutationObserver(()=>{if(this.owner&&!this.available(this.owner))this.hideTip();if(this.pending&&!this.available(this.pending)){clearTimeout(this.showTimer);this.pending=null;}}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','disabled','open']});
  addEventListener('resize',()=>this.position());document.addEventListener('scroll',()=>this.position(),true);
 }
 available(trigger){return trigger.isConnected&&!trigger.disabled&&!trigger.closest('[hidden],[inert]')&&trigger.getClientRects().length>0;}
 schedule(trigger){
  clearTimeout(this.exitTimer);if(trigger===this.suppressed||!this.available(trigger))return;
  if(trigger===this.owner&&!this.tip.hidden)return;
  this.hideTip();this.pending=trigger;
  this.showTimer=setTimeout(()=>{
   if(this.pending!==trigger||!this.available(trigger)||trigger===this.suppressed)return;
   this.pending=null;this.owner=trigger;const scope=trigger.closest('dialog[open]')??this.root;if(this.tip.parentElement!==scope)scope.append(this.tip);this.tip.textContent=trigger.dataset.tip;this.tip.hidden=false;
   const name=trigger.getAttribute('aria-label')??trigger.textContent.trim();
   if(name!==this.tip.textContent){const ids=new Set((trigger.getAttribute('aria-describedby')??'').split(/\s+/).filter(Boolean));ids.add(this.tip.id);trigger.setAttribute('aria-describedby',[...ids].join(' '));}
   this.positionTip();
  },350);
 }
 delayHide(){clearTimeout(this.exitTimer);this.exitTimer=setTimeout(()=>{const trigger=this.owner??this.pending;if(!this.overTip&&!this.overOwner&&document.activeElement!==trigger)this.hideTip();},450);}
 hideTip(suppress=false){
  clearTimeout(this.showTimer);clearTimeout(this.exitTimer);if(suppress)this.suppressed=this.owner??this.pending;
  if(this.owner){const ids=(this.owner.getAttribute('aria-describedby')??'').split(/\s+/).filter(x=>x&&x!==this.tip.id);if(ids.length)this.owner.setAttribute('aria-describedby',ids.join(' '));else this.owner.removeAttribute('aria-describedby');}
  this.tip.hidden=true;this.owner=null;this.pending=null;this.overTip=false;this.overOwner=false;
 }
 bounds(){const r=this.root.getBoundingClientRect();return {left:Math.max(8,r.left+8),right:Math.min(innerWidth-8,r.right-8),top:Math.max(58,r.top+8),bottom:innerHeight-8};}
 place(element,trigger,above=false){
  const bounds=this.bounds(),r=trigger.getBoundingClientRect();element.style.maxWidth=Math.max(0,bounds.right-bounds.left)+'px';
  const box=element.getBoundingClientRect();let x=trigger.id==='fab'&&getComputedStyle(this.root).direction==='rtl'?r.left:r.right-box.width,y=above?r.top-box.height-8:r.bottom+8;
  if(y+box.height>bounds.bottom)y=r.top-box.height-8;
  element.style.left=Math.max(bounds.left,Math.min(x,bounds.right-box.width))+'px';element.style.top=Math.max(bounds.top,y)+'px';
 }
 positionTip(){if(this.owner&&!this.tip.hidden)this.place(this.tip,this.owner,true);}
 position(){
  if(this.menu&&!this.available(this.menu.trigger)){const focused=this.menu.element.contains(document.activeElement);this.closeMenu(false);if(focused)document.getElementById('main').focus();}
  if(this.owner&&!this.available(this.owner))this.hideTip();
  if(this.menu)this.place(this.menu.element,this.menu.trigger,this.menu.trigger.id==='fab');this.positionTip();
 }
 openMenu(element,trigger){
  if(this.menu?.element===element){this.closeMenu(true);return;}
  this.closeMenu(false);this.hideTip(true);this.menu={element,trigger};element.hidden=false;trigger.setAttribute('aria-expanded','true');this.place(element,trigger,trigger.id==='fab');element.querySelector('[role=menuitem]:not([hidden])')?.focus();
 }
 closeMenu(restore=false){
  if(!this.menu)return;const {element,trigger}=this.menu;this.menu=null;
  if(this.owner&&(element.contains(this.owner)||this.owner===trigger))this.hideTip(true);
  element.hidden=true;trigger.setAttribute('aria-expanded','false');if(restore&&this.available(trigger))trigger.focus();
 }
}

