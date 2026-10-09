'use strict';
const $ = (id) => document.getElementById(id);
const root = $('media-design');
const app = root.querySelector('.app');
const libraries = ['Brand library', 'Campaign assets', 'Product media', 'Archive'];
let bucket = libraries[0];
let path = [];
let query = '';
let selection = new Set();
let detailTrigger;
let taskTrigger;
let drawerOpen = false;
let clipboard = [];
let referenceTask;
const items = [
 {id:1, bucket, parent:null, name:'Campaigns', type:'Folder'},
 {id:2, bucket, parent:null, name:'Photography', type:'Folder'},
 {id:3, bucket, parent:null, name:'Brand guidelines.pdf', type:'Document', binding:'Available'},
 {id:4, bucket, parent:null, name:'Launch film.mp4', type:'Video', binding:'Available'},
 {id:5, bucket, parent:null, name:'Logo collection.svg', type:'Image', binding:'Needs rebind'},
 {id:6, bucket, parent:1, name:'Autumn launch.jpg', type:'Image', binding:'Available'},
 {id:7, bucket, parent:2, name:'Studio portrait.jpg', type:'Image', binding:'Available'},
 {id:8, bucket:libraries[1], parent:null, name:'Summer campaign', type:'Folder'},
 {id:9, bucket:libraries[2], parent:null, name:'Product cover.jpg', type:'Image', binding:'Available'},
];
const originalFiles = Object.freeze(Object.fromEntries(items.filter(x=>x.type!=='Folder').map(x=>{
 x.sourceFileId='sample-nextcloud-'+x.id;
 return [x.sourceFileId,Object.freeze({id:x.sourceFileId,name:x.name})];
})));
const model=new VirtualReferenceModel(items);
const overlays=new DesignOverlays(root);
function announce(message){$('status').textContent=message;}
function setTip(button,text){button.dataset.tip=text;}
function materialIcon(name) {
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.classList.add('symbol'); svg.setAttribute('aria-hidden','true'); svg.setAttribute('focusable','false');
 const use=document.createElementNS('http://www.w3.org/2000/svg','use'); use.setAttribute('href','#symbol-'+name); svg.append(use); return svg;
}
function button(text, className, action) {
 const b = document.createElement('button'); b.type='button'; b.className=className; b.textContent=text; b.dataset.tip=text; b.addEventListener('click',action); return b;
}
function renderBuckets() {
 $('buckets').replaceChildren();
 const shown = libraries.filter(x => x.toLowerCase().includes($('bucket-filter').value.toLowerCase()));
 for (const name of shown) {
  const b=button(name,'destination'+(name===bucket?' active':''),()=>{
   bucket=name; path=[]; query=''; $('search').value=''; selection.clear(); closeDetails(false); showObjects(); renderBuckets(); render(); closeDrawer(); $('main').focus();
  });
  if(name===bucket) b.setAttribute('aria-current','page'); $('buckets').append(b);
 }
 $('no-buckets').hidden=shown.length>0;
}
function render() {
 overlays.closeMenu(false);overlays.hideTip();
 $('bucket-name').textContent=bucket;
 $('breadcrumbs').replaceChildren();
 $('path-row').hidden=path.length===0;
 if(path.length)$('breadcrumbs').append(button(bucket,'text',()=>navigateTo(-1)));
 path.forEach((folder,index)=>{
  const sep=document.createElement('span'); sep.textContent='/'; sep.setAttribute('aria-hidden','true');
  const b=button(folder.name,'text',()=>navigateTo(index));
  if(index===path.length-1) b.setAttribute('aria-current','location');
  $('breadcrumbs').append(sep,b);
 });
 $('up').hidden=path.length===0;
 const parent=path.at(-1)?.id??null;
 const shown=items.filter(x=>x.bucket===bucket&&x.parent===parent&&x.name.toLowerCase().includes(query.toLowerCase()));
 shown.sort((a,b)=>($('sort').value==='type'?a.type.localeCompare(b.type):0)||a.name.localeCompare(b.name));
 $('objects').replaceChildren();
 for(const item of shown) {
  const li=document.createElement('li'); li.className='object';
  const check=document.createElement('label'); check.className='check';
  const input=document.createElement('input'); input.type='checkbox';input.dataset.nodeId=item.id; input.checked=selection.has(item.id); input.setAttribute('aria-label','Select '+item.name);
  input.addEventListener('change',()=>{input.checked?selection.add(item.id):selection.delete(item.id); renderSelection();}); check.append(input);
  const name=button('','object-name',()=>item.type==='Folder'?openFolder(item):openDetails(item,name));name.dataset.tip=item.type==='Folder'?'Open virtual folder':'Inspect this link';
  const icon=document.createElement('span'); icon.className='file-icon'; icon.setAttribute('aria-hidden','true'); icon.append(materialIcon(item.type==='Folder'?'folder':item.type==='Video'?'movie':item.type==='Image'?'image':'description'));
  const copy=document.createElement('span'); copy.className='name-copy'; copy.textContent=item.name;
  const meta=document.createElement('span'); meta.className='mobile-meta'; meta.textContent=item.type+(item.binding?' · '+item.binding:''); copy.append(meta); name.append(icon,copy);
  const type=document.createElement('span'); type.className='type'; type.textContent=item.type;
  const binding=document.createElement('span'); binding.className='binding'+(item.binding==='Needs rebind'?' broken':''); binding.textContent=item.binding??'—';
  const info=button('','icon',()=>openDetails(item,info)); info.append(materialIcon('info')); info.setAttribute('aria-label','Details for '+item.name);info.dataset.tip='Inspect this virtual reference';
  li.append(check,name,type,binding,info); $('objects').append(li);
 }
 $('count').textContent=shown.length+' in this view'; $('empty').hidden=shown.length!==0;
 $('empty-copy').textContent=query?'Try another name or clear your search.':'Add a file from Nextcloud or create a folder to get started.';
 $('status').textContent=query?shown.length+' matching objects in this folder.':'';
 renderSelection();
}
function renderSelection(){
 for(const checkbox of $('objects').querySelectorAll('input[type=checkbox]'))checkbox.checked=selection.has(Number(checkbox.dataset.nodeId));
 const visible=selection.size>0||clipboard.length>0;
 $('selection').hidden=!visible;
 $('selected-count').hidden=selection.size===0;$('selected-count').textContent=selection.size+' selected';
 $('clipboard-count').hidden=clipboard.length===0;
 $('clipboard-count').textContent=clipboard.length?clipboard.length+' copied':'';
 for(const id of ['move-links','copy-links','remove-links'])$(id).disabled=selection.size===0;
 $('rename-link').disabled=selection.size!==1;
 $('paste-links').disabled=clipboard.length===0;
 $('menu-copy').setAttribute('aria-disabled',String(selection.size===0));$('menu-rename').setAttribute('aria-disabled',String(selection.size!==1));$('menu-remove').setAttribute('aria-disabled',String(selection.size===0));
 const controls=toolbarControls();controls.forEach((x,i)=>x.tabIndex=i===0?0:-1);
 syncSurfaces();
}
function toolbarControls(){return [...$('reference-toolbar').querySelectorAll('button')].filter(x=>!x.disabled&&getComputedStyle(x).display!=='none');}
function layoutToolbar(){
 if($('selection').hidden)return;
 const toolbar=$('reference-toolbar'),active=document.activeElement;
 const menuFocused=overlays.menu?.element===$('toolbar-menu')&&$('toolbar-menu').contains(active);
 const actions=['move-links','copy-links','paste-links','rename-link','remove-links'];
 const priority=['move-links','paste-links','copy-links','rename-link','remove-links'];
 const signature=()=>[...actions,'more-actions'].map(id=>$(id).hidden).join(',');
 const previous=signature();
 const footerStyle=getComputedStyle($('library-footer'));
 const groupBudget=$('library-footer').clientWidth-parseFloat(footerStyle.paddingLeft)-parseFloat(footerStyle.paddingRight);
 const style=getComputedStyle(toolbar),gap=parseFloat(style.columnGap)||0;
 const available=groupBudget-$('cancel-selection').getBoundingClientRect().width-8-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
 toolbar.classList.remove('icon-actions');actions.forEach(id=>$(id).hidden=false);$('more-actions').hidden=true;
 let widths=actions.map(id=>$(id).getBoundingClientRect().width);
 if(widths.reduce((a,b)=>a+b,0)+gap*(actions.length-1)>available){
  toolbar.classList.add('icon-actions');widths=actions.map(id=>$(id).getBoundingClientRect().width);
 }
 if(widths.reduce((a,b)=>a+b,0)+gap*(actions.length-1)>available){
  let used=48;$('more-actions').hidden=false;
  for(const id of priority){const width=widths[actions.indexOf(id)];$(id).hidden=used+gap+width>available;if(!$(id).hidden)used+=gap+width;}
 }
 for(const [id,menu] of [['move-links','menu-move'],['copy-links','menu-copy'],['paste-links','menu-paste'],['rename-link','menu-rename'],['remove-links','menu-remove']]){
  $(menu).hidden=!$(id).hidden;$(menu).setAttribute('aria-disabled',String($(id).disabled));
 }
 const changed=previous!==signature();
 if(changed&&overlays.menu?.element===$('toolbar-menu'))overlays.closeMenu(false);
 if((changed&&menuFocused)||(toolbar.contains(active)&&active.hidden))(!$('more-actions').hidden?$('more-actions'):toolbarControls()[0])?.focus();
 else if(toolbar.contains(active)&&document.activeElement!==active)active.focus();
 const controls=toolbarControls();const current=controls.includes(document.activeElement)?document.activeElement:controls.find(x=>x.tabIndex===0)??controls[0];controls.forEach(x=>x.tabIndex=x===current?0:-1);
}
function syncSurfaces(){
 const suspended=!$('details').hidden||$('explorer').hidden||$('task').open||$('reference-task').open||$('bucket-task').open||drawerOpen;
 const hide=suspended||selection.size>0||clipboard.length>0;
 const contextual=(selection.size>0||clipboard.length>0)&&$('details').hidden&&!$('explorer').hidden&&!$('task').open&&!$('reference-task').open&&!$('bucket-task').open&&!drawerOpen;
 $('selection').hidden=!contextual;
 $('main').classList.toggle('has-toolbar',contextual);
 $('main').classList.toggle('has-fab',!hide);
 $('library-footer').hidden=$('explorer').hidden;
 $('search-form').hidden=$('explorer').hidden;
 $('bucket-name').textContent=$('explorer').hidden?'API tokens':bucket;
 $('fab-area').hidden=hide;if(hide&&overlays.menu?.trigger.id==='fab')overlays.closeMenu(false);positionFab();layoutToolbar();
}
function positionFab(){
 app.style.setProperty('--workspace-height',Math.max(240,innerHeight-app.getBoundingClientRect().top)+'px');
 const scroller=$('main-scroll');
 $('main').style.setProperty('--scroll-gutter',Math.max(0,(scroller.offsetWidth-scroller.clientWidth)/2)+'px');
 if($('fab-area').hidden)return;
 const r=$('main').getBoundingClientRect();const width=$('fab').getBoundingClientRect().width;
 const rtl=root.dir==='rtl';
 const inset=root.clientWidth>=840?29:24;
 const left=rtl?Math.max(16,r.left+inset):Math.min(innerWidth-inset,r.right-inset)-width;
 $('fab-area').style.left=Math.max(r.left+16,left)+'px';$('fab-area').style.bottom='max(24px, env(safe-area-inset-bottom))';
}
function resetFolder(){query='';$('search').value='';selection.clear();closeDetails(false);render();$('main').focus();}
function openFolder(item){path.push(item);resetFolder();}
function navigateTo(index){path=path.slice(0,index+1);resetFolder();}
function openDetails(item,trigger){
 detailTrigger=trigger; $('detail-name').textContent=item.name; $('detail-fields').replaceChildren();
 for(const [key,value] of [['Type',item.type],['Binding',item.binding??'Not applicable'],['Library',bucket],...(item.sourceFileId?[['Original file',originalFiles[item.sourceFileId].name],['Reference target',item.sourceFileId]]:[]),['Virtual path','/'+[...path.map(x=>x.name),item.name].join('/')]]){
  const dt=document.createElement('dt');dt.textContent=key;const dd=document.createElement('dd');dd.textContent=value;$('detail-fields').append(dt,dd);
 }
 $('details').hidden=false;app.classList.add('with-detail');$('close-detail').focus();syncSurfaces();
}
function closeDetails(restore=true){$('details').hidden=true;app.classList.remove('with-detail');if(restore&&detailTrigger?.isConnected)detailTrigger.focus();syncSurfaces();}
function showObjects(){ $('explorer').hidden=false;$('tokens').hidden=true;$('objects-page').setAttribute('aria-current','page');$('objects-page').classList.add('active');$('tokens-page').removeAttribute('aria-current');$('tokens-page').classList.remove('active');syncSurfaces(); }
function closeDrawer(){
 if(!drawerOpen)return;drawerOpen=false;$('drawer').classList.remove('open');$('drawer').removeAttribute('role');$('drawer').removeAttribute('aria-modal');$('scrim').hidden=true;$('open-drawer').setAttribute('aria-expanded','false');
 for(const el of [$('main'),$('details'),root.querySelector('.study'),document.querySelector('.host')])el.inert=false;
 if($('open-drawer').getClientRects().length) $('open-drawer').focus(); else $('main').focus();syncSurfaces();
}
$('open-drawer').addEventListener('click',()=>{
 overlays.closeMenu(false);overlays.hideTip();drawerOpen=true;syncSurfaces();$('drawer').classList.add('open');$('drawer').setAttribute('role','dialog');$('drawer').setAttribute('aria-modal','true');$('scrim').hidden=false;$('open-drawer').setAttribute('aria-expanded','true');
 for(const el of [$('main'),$('details'),root.querySelector('.study'),document.querySelector('.host')])el.inert=true;
 root.querySelector('.close-drawer').focus();
});
$('drawer').addEventListener('keydown',e=>{
 if(!drawerOpen)return;
 if(e.key==='Escape'){e.preventDefault();closeDrawer();}
 if(e.key==='Tab'){
  const focusable=[...$('drawer').querySelectorAll('button,input')].filter(x=>x.getClientRects().length);
  const first=focusable[0],last=focusable.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 }
});
$('scrim').addEventListener('click',closeDrawer);root.querySelector('.close-drawer').addEventListener('click',closeDrawer);
new ResizeObserver(()=>{
 if(root.clientWidth>=840&&drawerOpen)closeDrawer();syncSurfaces();overlays.position();
 const active=document.activeElement;
 if($('reference-toolbar').contains(active)&&getComputedStyle(active).display==='none')$('more-actions').focus();
}).observe(root);
new ResizeObserver(()=>{layoutToolbar();overlays.position();}).observe($('main'));
new ResizeObserver(layoutToolbar).observe($('selection'));
document.fonts.ready.then(layoutToolbar);
document.fonts.addEventListener('loadingdone',layoutToolbar);
addEventListener('scroll',positionFab,true);addEventListener('resize',positionFab);
$('bucket-filter').addEventListener('input',renderBuckets);
$('search-form').addEventListener('submit',e=>{e.preventDefault();query=$('search').value;selection.clear();render();});
$('search').addEventListener('input',()=>{if(!$('search').value){query='';selection.clear();render();}});
$('sort').addEventListener('change',render);
$('up').addEventListener('click',()=>navigateTo(path.length-2));
$('cancel-selection').addEventListener('click',()=>{
 overlays.closeMenu(false);overlays.hideTip(true);selection.clear();clipboard=[];renderSelection();
 announce('Reference actions cancelled. Selection and copied links cleared.');$('fab').focus();
});
$('close-detail').addEventListener('click',()=>closeDetails());
$('objects-page').addEventListener('click',()=>{showObjects();closeDrawer();$('main').focus();});
$('tokens-page').addEventListener('click',()=>{closeDetails(false);$('explorer').hidden=true;$('tokens').hidden=false;$('tokens-page').setAttribute('aria-current','page');$('tokens-page').classList.add('active');$('objects-page').removeAttribute('aria-current');$('objects-page').classList.remove('active');closeDrawer();$('main').focus();syncSurfaces();});
$('theme').addEventListener('click',()=>{const dark=root.classList.toggle('dark');$('theme').setAttribute('aria-pressed',String(dark));$('theme').textContent=dark?'Light theme':'Dark theme';});
$('direction').addEventListener('click',()=>{const rtl=root.dir!=='rtl';root.dir=rtl?'rtl':'ltr';$('direction').setAttribute('aria-pressed',String(rtl));positionFab();overlays.position();});
let bucketCreated=false;
$('add-bucket').addEventListener('click',()=>{
 overlays.closeMenu(false);overlays.hideTip();selection.clear();clipboard=[];renderSelection();bucketCreated=false;
 $('bucket-input').value='';$('bucket-error').hidden=true;$('bucket-task').showModal();syncSurfaces();
});
$('bucket-form').addEventListener('submit',e=>{
 if(e.submitter?.value!=='create')return;
 const name=$('bucket-input').value.trim();
 const duplicate=libraries.some(x=>x.toLocaleLowerCase()===name.toLocaleLowerCase());
 if(!name||name.length>80||duplicate){e.preventDefault();$('bucket-error').textContent=duplicate?'A sample bucket with this name already exists.':'Enter a bucket name of 1 to 80 characters.';$('bucket-error').hidden=false;$('bucket-input').focus();return;}
 libraries.push(name);bucket=name;path=[];query='';selection.clear();clipboard=[];$('search').value='';$('bucket-filter').value='';
 closeDetails(false);showObjects();renderBuckets();render();closeDrawer();bucketCreated=true;announce('Sample bucket created. Nothing is saved to Nextcloud.');
});
$('bucket-task').addEventListener('close',()=>{syncSurfaces();(bucketCreated?$('main'):$('add-bucket')).focus();});
function openTask(kind,trigger){
 // Menu visibility preserves context; invoking a creation command ends it.
 selection.clear();clipboard=[];renderSelection();
 overlays.closeMenu(false);overlays.hideTip();taskTrigger=$('fab');const folder=kind==='folder';$('task-title').textContent=folder?'New folder':'Add from Nextcloud';
 $('task-copy').textContent=folder?'Create a temporary sample folder in this design study. It is not saved.':'Production will use a verified Nextcloud file picker. No file is selected or linked in this study.';
 $('name-label').hidden=!folder;$('folder-input').required=folder;$('folder-input').value='';$('folder-input').setCustomValidity('');$('task-submit').hidden=!folder;$('task-error').hidden=true;$('task').showModal();syncSurfaces();
}
$('new-folder').addEventListener('click',e=>openTask('folder',e.currentTarget));$('add').addEventListener('click',e=>openTask('link',e.currentTarget));
$('task-form').addEventListener('submit',e=>{
 if(e.submitter?.value!=='create')return;
 try {model.create($('folder-input').value,bucket,path.at(-1)?.id??null);render();announce('Sample virtual folder created. No Nextcloud files changed.');}
 catch(error){e.preventDefault();$('task-error').hidden=false;$('task-error').textContent=error.message;}

});
$('folder-input').addEventListener('input',()=>$('folder-input').setCustomValidity(''));
$('task').addEventListener('close',()=>{syncSurfaces();taskTrigger?.focus();});
function command(kind,trigger){
 if(trigger?.getAttribute('aria-disabled')==='true'||trigger?.disabled)return;
 const menuTrigger=overlays.menu?.trigger;overlays.closeMenu(false);overlays.hideTip(true);
 if(kind==='copy'){
  try{clipboard=model.roots([...selection]).map(x=>x.id);renderSelection();announce(clipboard.length+' links copied in this app. Original files are unchanged.');}
  catch(error){announce(error.message);}if(menuTrigger?.getClientRects().length)menuTrigger.focus();return;
 }
 openReferenceTask(kind,trigger);
}
function openReferenceTask(kind,trigger){
 const ids=kind==='paste'?clipboard:[...selection];
 try{
  const sources=model.roots(ids);if(!sources.length)throw new Error('Select a reference first.');
  referenceTask={kind,ids:sources.map(x=>x.id),trigger:trigger?.closest('[role=menu]')?$('more-actions'):trigger};
  $('reference-title').textContent={move:'Move links',paste:'Paste links',remove:'Remove links',rename:'Rename link'}[kind];
  $('reference-copy').textContent=kind==='remove'?'Remove '+sources.length+' selected virtual items and their contained links? Original Nextcloud files and other links are kept.':kind==='move'?'Choose a virtual folder. Original Nextcloud files remain in their current location.':kind==='paste'?'Create independent links in '+(path.at(-1)?.name??bucket)+'. The original files are shared, not copied.':'Change this link name in the plugin. The original Nextcloud file name stays unchanged.';
  $('reference-confirm').textContent={move:'Move links',paste:'Paste links',remove:'Remove links',rename:'Rename link'}[kind];
  $('reference-fields').replaceChildren();$('reference-error').hidden=true;
  if(kind==='move'){
   const label=document.createElement('label');label.textContent='Destination folder';const select=document.createElement('select');select.id='destination-folder';
   const targets=[{id:null,name:bucket},...items.filter(x=>x.bucket===bucket&&x.type==='Folder')];
   for(const target of targets){try{model.destination(bucket,target.id,sources);}catch{continue;}const option=document.createElement('option');option.value=target.id??'';option.textContent=target.id===null?bucket+'/':virtualPath(target.id)+'/';select.append(option);}
   const control=document.createElement('span');control.className='select-control';control.style.width='100%';control.append(select,materialIcon('expand_more'));label.append(control);$('reference-fields').append(label);
  }
  if(kind==='rename'||kind==='paste')sources.forEach((source,index)=>{
   const label=document.createElement('label');label.className='paste-name';label.textContent=kind==='rename'?'Link name':'Name for '+source.name;
   const input=document.createElement('input');input.dataset.nameIndex=index;input.required=true;input.value=source.name;input.autocomplete='off';label.append(input);$('reference-fields').append(label);
  });
  $('reference-task').showModal();syncSurfaces();
 }catch(error){announce(error.message);}
}
function virtualPath(id){const parts=[];let item=model.get(id);while(item){parts.unshift(item.name);item=item.parent===null?null:model.get(item.parent);}return '/'+parts.join('/');}
$('reference-form').addEventListener('submit',e=>{
 if(e.submitter?.value!=='confirm')return;
 const {kind,ids}=referenceTask;
 try{
  if(kind==='move'){const parent=$('destination-folder').value;model.move(ids,bucket,parent===''?null:Number(parent));}
  else if(kind==='rename')model.rename(ids[0],$('reference-fields').querySelector('input').value);
  else if(kind==='paste')model.copy(ids,bucket,path.at(-1)?.id??null,[...$('reference-fields').querySelectorAll('input')].map(x=>x.value));
  else if(kind==='remove')model.remove(ids);
  selection.clear();closeDetails(false);render();announce('Sample '+kind+' completed. All original Nextcloud files are unchanged.');
 }catch(error){e.preventDefault();$('reference-error').hidden=false;$('reference-error').textContent=error.message;}
});
$('reference-task').addEventListener('close',()=>{
 syncSurfaces();const trigger=referenceTask?.trigger;
 if(trigger?.isConnected&&!trigger.disabled&&trigger.getClientRects().length)trigger.focus();else if(!$('selection').hidden)toolbarControls()[0]?.focus();else $('fab').focus();
});
$('fab').addEventListener('click',()=>overlays.openMenu($('fab-menu'),$('fab')));
$('more-actions').addEventListener('click',()=>overlays.openMenu($('toolbar-menu'),$('more-actions')));
for(const [id,kind] of [['move-links','move'],['copy-links','copy'],['paste-links','paste'],['rename-link','rename'],['remove-links','remove'],['menu-move','move'],['menu-paste','paste'],['menu-copy','copy'],['menu-rename','rename'],['menu-remove','remove']])$(id).addEventListener('click',e=>command(kind,e.currentTarget));
$('reference-toolbar').addEventListener('focusin',e=>{if(e.target.tagName==='BUTTON')toolbarControls().forEach(x=>x.tabIndex=x===e.target?0:-1);});
$('reference-toolbar').addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 const controls=toolbarControls();const index=controls.indexOf(document.activeElement);if(index<0)return;e.preventDefault();
 const forward=(e.key==='ArrowRight')!==(root.dir==='rtl');const next=e.key==='Home'?0:e.key==='End'?controls.length-1:(index+(forward?1:-1)+controls.length)%controls.length;controls[next]?.focus();
});
for(const [id,iconName,label] of [['move-links','drive_file_move','Move'],['copy-links','content_copy','Copy'],['paste-links','content_paste','Paste'],['rename-link','edit','Rename'],['remove-links','delete','Remove links']]){
 const b=$(id);b.replaceChildren(materialIcon(iconName));const span=document.createElement('span');span.className='action-label';span.textContent=label;b.append(span);b.setAttribute('aria-label',label);
}
$('cancel-selection').replaceChildren(materialIcon('close'));$('more-actions').replaceChildren(materialIcon('expand_more'));
for(const b of root.querySelectorAll('button'))if(!b.dataset.tip)b.dataset.tip=b.getAttribute('aria-label')??b.textContent.trim();
renderBuckets();render();
