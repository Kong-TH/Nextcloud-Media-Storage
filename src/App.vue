<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script setup>
import {ref,computed,onMounted,onBeforeUnmount,nextTick,watch} from 'vue'
import Icon from './components/MaterialIcon.vue'
import {api,allNodes,allBuckets,davFiles} from './api.js'
import {validName,mediaType,typeLabel} from './rules.js'
import DesignOverlays from './overlays.js'
import {tokenGroups,tokenState,matchesToken,expiryBounds,localMinute} from './token-model.js'
defineProps({version:{type:String,required:true}})
const root=ref(),main=ref(),toolbar=ref(),taskDialog=ref()
const buckets=ref([]),bucket=ref(null),path=ref([]),nodes=ref([]),query=ref(''),submitted=ref(''),sort=ref('name'),bucketFilter=ref('')
const selection=ref([]),clipboard=ref([]),loading=ref(false),busy=ref(false),error=ref(''),status=ref(''),details=ref(null),page=ref('objects'),drawer=ref(false)
const task=ref(null),draft=ref(''),taskError=ref(''),destinations=ref([]),destination=ref(''),files=ref([]),filePath=ref(''),fileLoading=ref(false),chosen=ref(null),fileError=ref('')
const tokens=ref([]),secret=ref(''),tokenScopes=ref(['media:read']),tokenExpiry=ref(''),tokenFolder=ref('')
const tokenFilter=ref('all'),tokenSearch=ref(''),tokenSort=ref('expiry'),tokenClock=ref(Date.now()/1000)
const tokenBounds=ref(null),expiryError=ref(''),copyFeedback=ref(''),copying=ref(false)
let tokenClockTimer,tokenClockOffset=0
const tokenCounts=computed(()=>Object.fromEntries(tokenGroups.map(group=>[group.id,tokens.value.filter(t=>matchesToken(t,group.id,tokenClock.value)).length])))
const visibleTokens=computed(()=>tokens.value.filter(t=>matchesToken(t,tokenFilter.value,tokenClock.value)&&t.name.toLocaleLowerCase().includes(tokenSearch.value.toLocaleLowerCase())).sort((a,b)=>tokenSort.value==='name'?a.name.localeCompare(b.name):a.expires_at-b.expires_at||a.name.localeCompare(b.name)))
const expiryHelp=computed(()=>tokenBounds.value?'Choose a future date, no later than '+formatTokenDate(tokenBounds.value.max)+'.':'Loading the allowed expiry range…')
function formatTokenDate(seconds){return seconds?new Date(seconds*1000).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}):'Never used'}
function tokenBoundary(t){return !t.folder_id?'All my buckets and folders':buckets.value.find(b=>b.id===t.folder_id)?.name??'Restricted folder'}
function resetTokenFilters(){tokenFilter.value='all';tokenSearch.value=''}
async function copyTokenSecret(){
 if(copying.value||!secret.value)return
 const value=secret.value;copying.value=true;copyFeedback.value=''
 try{await navigator.clipboard.writeText(value);if(task.value==='secret'&&secret.value===value)copyFeedback.value='Token copied.'}
 catch{if(task.value==='secret'&&secret.value===value){copyFeedback.value='Clipboard unavailable. Select and copy the token above.';const range=document.createRange();range.selectNodeContents(taskDialog.value.querySelector('.secret'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range)}}
 finally{copying.value=false}
}
const pathStatus=ref(''),manualPath=ref('')
const overflow=ref([]),iconsOnly=ref(false),fabLabel=ref('Add'),fabStyle=ref({}),tokenLoading=ref(false)
let overlays,observer,listAbort,detailSerial=0,fileAbort,trigger,packing=false,live=true
const abortEvents=new AbortController()
const actions=[{id:'move',label:'Move',icon:'drive_file_move',tip:'Change virtual folder only'},{id:'copy',label:'Copy',icon:'content_copy',tip:'Copy links, not file contents'},{id:'paste',label:'Paste',icon:'content_paste',tip:'Create links in this folder'},{id:'rename',label:'Rename',icon:'edit',tip:'Change the plugin name only'},{id:'remove',label:'Remove links',icon:'delete',tip:'Keep all original Nextcloud files'}]
const parent=computed(()=>path.value.at(-1)?.id??bucket.value?.id)
const context=computed(()=>selection.value.length>0||clipboard.value.length>0)
const showContext=computed(()=>context.value&&!details.value&&page.value==='objects'&&!drawer.value&&!task.value)
const showFab=computed(()=>!context.value&&!details.value&&page.value==='objects'&&!drawer.value&&!task.value)
const filteredBuckets=computed(()=>buckets.value.filter(b=>b.name.toLocaleLowerCase().includes(bucketFilter.value.toLocaleLowerCase())))
const sorted=computed(()=>[...nodes.value].sort((a,b)=>sort.value==='type'?typeLabel(a).localeCompare(typeLabel(b))||a.name.localeCompare(b.name):a.name.localeCompare(b.name)))
const selectedNodes=computed(()=>nodes.value.filter(n=>selection.value.includes(n.id)))
function disabled(id){return busy.value||loading.value||(id==='paste'?!clipboard.value.length:id==='rename'?selection.value.length!==1:!selection.value.length)}
function iconFor(n){const type=typeLabel(n);return type==='Folder'?'folder':type==='Image'?'image':type==='Video'?'movie':'description'}
function bindingLabel(n){return n.node_type==='folder'?'—':n.binding_status==='available'?'Available':n.binding_status==='needs_rebind'?'Needs rebind':n.binding_status==='unavailable'?'Unavailable':'Checking…'}
async function load(){
 if(!parent.value)return
 listAbort?.abort();const controller=new AbortController();listAbort=controller
 loading.value=true;error.value='';nodes.value=[]
 try{
  const data=await allNodes(parent.value,submitted.value,controller.signal)
  if(controller.signal.aborted||!live)return
  nodes.value=data.nodes
  // Validate binding metadata in small groups without unbounded parallel requests.
  const media=data.nodes.filter(n=>n.node_type==='media')
  for(let i=0;i<media.length;i+=6){
   const rows=await Promise.all(media.slice(i,i+6).map(n=>api('/nodes/'+n.id,'GET',undefined,controller.signal).catch(e=>{if(e.name==='AbortError')throw e;return {...n,binding_status:'unavailable'}})))
   if(controller.signal.aborted||!live)return
   const byId=new Map(rows.map(n=>[n.id,n]));nodes.value=nodes.value.map(n=>byId.get(n.id)??n)
  }
 }catch(e){if(e.name!=='AbortError')error.value=e.message}
 finally{if(listAbort===controller)loading.value=false}
}
async function initialize(){loading.value=true;error.value='';try{buckets.value=await allBuckets();if(!bucket.value)bucket.value=buckets.value[0];await load()}catch(e){error.value=e.message;loading.value=false}}
function switchBucket(b){if(busy.value)return;bucket.value=b;path.value=[];selection.value=[];query.value=submitted.value='';details.value=null;page.value='objects';closeDrawer();load()}
function navigate(index){if(busy.value)return;path.value=path.value.slice(0,index+1);selection.value=[];query.value=submitted.value='';details.value=null;load()}
function search(){if(busy.value)return;submitted.value=query.value;selection.value=[];load()}
function toggle(n){if(busy.value)return;selection.value=selection.value.includes(n.id)?selection.value.filter(id=>id!==n.id):[...selection.value,n.id]}
async function openNode(n,event){if(busy.value)return;if(n.node_type==='folder'){path.value.push({id:n.id,name:n.name});selection.value=[];query.value=submitted.value='';load()}else await inspect(n,event?.currentTarget)}
async function inspect(n,owner){if(busy.value)return;pathStatus.value=manualPath.value='';trigger=owner;const serial=++detailSerial;details.value={...n,loading:true};try{const data=await api('/nodes/'+n.id);if(serial===detailSerial&&details.value)details.value=data}catch(e){if(serial===detailSerial&&details.value)details.value={...n,error:e.message}}await nextTick();document.getElementById('close-detail')?.focus()}
function closeDetails(){details.value=null;pathStatus.value=manualPath.value='';++detailSerial;nextTick(()=>trigger?.isConnected&&trigger.focus())}
async function copyVirtualPath(){
 const file=details.value
 if(file?.loading||file?.error||file?.node_type!=='media'||!file.virtual_path)return
 const virtualPath=file.virtual_path
 pathStatus.value='';manualPath.value=''
 try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(virtualPath);if(details.value?.id===file.id)pathStatus.value='Virtual path copied. This path is relative to the displayed bucket; media URLs are not available yet.'}
 catch{if(details.value?.id===file.id){manualPath.value=virtualPath;pathStatus.value='Clipboard unavailable. Select and copy the plugin path below. This is a path within the displayed bucket.'}}
}
function cancelContext(){selection.value=[];clipboard.value=[];overlays?.closeMenu();overlays?.hideTip(true);status.value='Selection and copied links cleared.';nextTick(()=>document.getElementById('fab')?.focus())}
function openMenu(id,event){if(busy.value||loading.value)return;overlays?.openMenu(document.getElementById(id),event.currentTarget)}
function fabTask(kind){startTask(kind,document.getElementById('fab'))}
function closeDrawer(){drawer.value=false;nextTick(()=>{if(document.getElementById('drawer')?.contains(document.activeElement))document.getElementById('open-drawer')?.focus()})}
function openDrawer(){drawer.value=true;nextTick(()=>document.getElementById('drawer').querySelector('button,md-icon-button,md-text-button')?.focus())}
function keydown(e){
 if(drawer.value){if(e.key==='Escape'){e.preventDefault();closeDrawer()}if(e.key==='Tab'){const tabs=[...document.getElementById('drawer').querySelectorAll('button,md-icon-button,md-text-button,input')].filter(el=>!el.disabled&&el.getClientRects().length);if(e.shiftKey&&document.activeElement===tabs[0]){e.preventDefault();tabs.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===tabs.at(-1)){e.preventDefault();tabs[0]?.focus()}}}
 if(e.key==='Escape'&&details.value&&!task.value){e.preventDefault();closeDetails()}
}
function toolbarKey(e){
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return
 const controls=[...toolbar.value.querySelectorAll('md-text-button,md-icon-button')].filter(el=>!el.hidden&&!el.disabled);const index=controls.indexOf(document.activeElement)
 const rtl=getComputedStyle(root.value).direction==='rtl',forward=(e.key==='ArrowRight')!==rtl
 const next=e.key==='Home'?0:e.key==='End'?controls.length-1:(index+(forward?1:-1)+controls.length)%controls.length
 e.preventDefault();controls.forEach((el,i)=>el.tabIndex=i===next?0:-1);controls[next]?.focus()
}
async function pack(){
 if(packing||!toolbar.value||!showContext.value)return;packing=true
 try{
 const bar=toolbar.value,footer=document.getElementById('library-footer'),style=getComputedStyle(footer)
 const available=footer.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-64
 const active=document.activeElement,activeId=bar.contains(active)?active.id:null
 iconsOnly.value=false;await nextTick();if(!live||!showContext.value)return
 let buttons=actions.map(a=>document.getElementById('action-'+a.id));const more=document.getElementById('more-actions')
 await Promise.all(buttons.map(b=>b.updateComplete))
 bar.classList.remove('icon-actions');buttons.forEach(b=>b.hidden=false);more.hidden=true
 const labeled=buttons.reduce((sum,b)=>sum+b.getBoundingClientRect().width,16)
 const iconMode=labeled>available;bar.classList.toggle('icon-actions',iconMode);iconsOnly.value=iconMode;await nextTick();if(!live||!showContext.value)return
 buttons=actions.map(a=>document.getElementById('action-'+a.id));await Promise.all(buttons.map(b=>b.updateComplete))
 const slots=Math.max(1,Math.floor((available-16)/48)),count=iconMode?(slots>=5?5:Math.max(0,slots-1)):5
 const priority=['move','paste','copy','rename','remove'],shown=count===5?actions.map(a=>a.id):priority.slice(0,count)
 const hidden=actions.filter(a=>!shown.includes(a.id));const signature=hidden.map(a=>a.id).join(',')
 if(signature!==overflow.value.map(a=>a.id).join(','))overlays?.closeMenu(false)
 overflow.value=hidden
 buttons.forEach((b,i)=>b.hidden=!shown.includes(actions[i].id));more.hidden=!hidden.length
 const eligible=[...buttons,more].filter(b=>!b.hidden&&!b.disabled);let focused=eligible.find(b=>b.id===activeId)??eligible.find(b=>b.tabIndex===0)??eligible[0]
 if(activeId){if(!eligible.some(b=>b.id===activeId))focused=more.hidden?eligible[0]:more;focused?.focus()}
 eligible.forEach(b=>b.tabIndex=b===focused?0:-1)
 }finally{packing=false}
}
function layout(){
 if(!root.value)return
 fabLabel.value=root.value.clientWidth<1200?'':'Add'
 const bounds=root.value.getBoundingClientRect(),rtl=getComputedStyle(root.value).direction==='rtl'
 root.value.style.setProperty('--app-top',Math.max(0,bounds.top)+'px')
 root.value.style.setProperty('--app-left',Math.max(0,bounds.left)+'px')
 root.value.style.setProperty('--app-right',Math.max(0,innerWidth-bounds.right)+'px')
 root.value.style.setProperty('--app-start',Math.max(0,rtl?innerWidth-bounds.right:bounds.left)+'px')
 root.value.style.setProperty('--app-bottom',Math.max(0,innerHeight-bounds.bottom)+'px')
 root.value.style.setProperty('--workspace-height',Math.max(0,Math.min(bounds.height,innerHeight-bounds.top))+'px')
 const scroller=document.getElementById('main-scroll');if(scroller&&main.value)main.value.style.setProperty('--scroll-gutter',Math.max(0,(scroller.offsetWidth-scroller.clientWidth)/2)+'px')
 if(root.value.clientWidth>=840&&drawer.value)closeDrawer()
 if(showFab.value){const r=main.value.getBoundingClientRect(),f=document.getElementById('fab'),inset=root.value.clientWidth>=840?29:24,rtl=getComputedStyle(root.value).direction==='rtl';if(f)fabStyle.value={left:(rtl?r.left+inset:r.right-inset-f.getBoundingClientRect().width)+'px',bottom:'max(24px,env(safe-area-inset-bottom))'}}
 pack();overlays?.position()
}
async function browseFiles(path='',restoreFocus=false){
 fileAbort?.abort()
 const controller=new AbortController();fileAbort=controller
 filePath.value=path;fileLoading.value=true;fileError.value='';files.value=[]
 try{
  const data=await davFiles(path,controller.signal)
  if(!controller.signal.aborted)files.value=data.sort((a,b)=>Number(b.folder)-Number(a.folder)||a.name.localeCompare(b.name))
 }catch(e){if(e.name!=='AbortError')fileError.value=e.message}
 finally{
  if(fileAbort===controller){
   fileLoading.value=false
   if(restoreFocus&&!controller.signal.aborted&&live){
    await nextTick()
    document.getElementById('picker-location')?.focus({preventScroll:true})
   }
  }
 }
}
async function folderChoices(){
 destinations.value=[];const queue=buckets.value.map(b=>({id:b.id,label:b.name,depth:0}));let count=0
 while(queue.length){const entry=queue.shift();destinations.value.push(entry);if(++count>1000)throw new Error('Too many destination folders. Navigate to the destination and use Copy/Paste instead.');const data=await allNodes(entry.id);for(const n of data.nodes.filter(n=>n.node_type==='folder'))queue.push({id:n.id,label:entry.label+' / '+n.name,depth:entry.depth+1})}
}
async function startTask(kind,owner=document.activeElement){
 if(busy.value||loading.value)return
 trigger=owner;overlays?.closeMenu();overlays?.hideTip(true);draft.value='';taskError.value='';chosen.value=null;secret.value='';copyFeedback.value='';expiryError.value='';tokenBounds.value=null;fileError.value='';task.value=kind
 if(kind==='rename')draft.value=selectedNodes.value[0]?.name??''
 if(kind==='paste')draft.value=clipboard.value.length===1?clipboard.value[0].name:''
 if(kind==='folder'||kind==='bind'||kind==='bucket'){selection.value=[];clipboard.value=[]}
 destination.value=parent.value;await nextTick();taskDialog.value.showModal()
 if(kind==='bind'||kind==='rebind')browseFiles()
 if(kind==='move'){busy.value=true;try{await folderChoices()}catch(e){taskError.value=e.message}finally{busy.value=false}}
 if(kind==='token'){
  tokenScopes.value=['media:read'];tokenFolder.value=parent.value;tokenExpiry.value='';busy.value=true
  try{const data=await api('/tokens?limit=1');tokenBounds.value=expiryBounds(data.policy);tokenClockOffset=data.policy.server_time-Date.now()/1000;tokenClock.value=data.policy.server_time;tokenExpiry.value=localMinute(tokenBounds.value.suggested)}
  catch(e){taskError.value=e.message}
  finally{busy.value=false}
 }
}
function closeTask(){if(busy.value)return;taskDialog.value.close()}
function taskClosed(){fileAbort?.abort();task.value=null;secret.value='';copyFeedback.value='';nextTick(()=>{if(trigger?.isConnected&&trigger.getClientRects().length)trigger.focus();else document.getElementById('fab')?.focus()})}
async function submit(){
 if(busy.value)return;const kind=task.value;taskError.value=''
 if(kind==='token'){
  expiryError.value=''
  const expires=Math.floor(new Date(tokenExpiry.value).getTime()/1000)
  if(!tokenBounds.value){taskError.value='Token lifetime policy is unavailable. Close this dialog and retry.';return}
  if(!Number.isFinite(expires)||expires<=Date.now()/1000+tokenClockOffset||expires<tokenBounds.value.min||expires>tokenBounds.value.max){expiryError.value=expiryHelp.value;await nextTick();document.getElementById('token-expiry')?.focus();return}
  if(!draft.value.trim()||draft.value.trim()!==draft.value||new TextEncoder().encode(draft.value).length>100||/[\x00-\x1f\x7f]/.test(draft.value)){taskError.value='Use a token name of 1–100 UTF-8 bytes without outer spaces or control characters.';return}
  if(!tokenScopes.value.length){taskError.value='Choose at least one permission.';return}
 }
 if(['folder','bucket','rename','bind'].includes(kind)&&!validName(draft.value)){taskError.value='Use a name up to 255 UTF-8 bytes, without slashes, control characters or outer spaces.';return}
 if((kind==='bind'||kind==='rebind')&&!chosen.value){taskError.value='Choose an existing supported image or video.';return}
 busy.value=true;let completed=0
 try{
  if(kind==='bucket'){const b=await api('/buckets','POST',{name:draft.value});buckets.value.push(b);bucket.value=b;path.value=[];submitted.value=query.value='';closeDrawer()}
  if(kind==='folder')await api('/folders','POST',{name:draft.value,parent_id:parent.value})
  if(kind==='bind')await api('/bindings','POST',{name:draft.value,file_id:chosen.value.id,parent_id:parent.value})
  if(kind==='rebind'){await api('/bindings/'+details.value.id,'PATCH',{file_id:chosen.value.id});details.value=await api('/nodes/'+details.value.id)}
  if(kind==='rename')await api('/nodes/'+selection.value[0],'PATCH',{name:draft.value})
  if(kind==='move'||kind==='remove')for(const id of [...selection.value]){await api('/nodes/'+id,kind==='move'?'PATCH':'DELETE',kind==='move'?{parent_id:destination.value}:undefined);completed++;selection.value=selection.value.filter(x=>x!==id)}
  if(kind==='paste')for(const node of clipboard.value){await api('/nodes/'+node.id+'/copy','POST',{parent_id:parent.value,...(clipboard.value.length===1?{name:draft.value}:{} )});completed++}
  if(kind==='token'){const data=await api('/tokens','POST',{name:draft.value,scopes:tokenScopes.value,expires_at:Math.floor(new Date(tokenExpiry.value).getTime()/1000),folder_id:tokenFolder.value||null});secret.value=data.secret;task.value='secret';await loadTokens();return}
  selection.value=[];status.value='Saved. Original Nextcloud files are unchanged.';taskDialog.value.close();await load()
 }catch(e){taskError.value=(completed?completed+' item(s) saved before this error. ':'')+e.message;if(completed)await load()}
 finally{busy.value=false}
}
async function action(id,event){
 if(disabled(id))return
 overlays?.closeMenu();overlays?.hideTip(true)
 if(id==='copy'){clipboard.value=selectedNodes.value.map(n=>({id:n.id,name:n.name}));status.value=clipboard.value.length+' reference(s) copied. Open a destination folder to paste.';return}
 await startTask(id,event?.currentTarget)
}
async function loadTokens(){tokenLoading.value=true;error.value='';try{const rows=[];let offset=0;while(true){const data=await api('/tokens?limit=100&offset='+offset);rows.push(...data.tokens);if(data.policy){tokenClockOffset=data.policy.server_time-Date.now()/1000;tokenClock.value=data.policy.server_time}if(data.tokens.length<100)break;offset+=100}tokens.value=rows}catch(e){error.value=e.message}finally{tokenLoading.value=false}}
function showPage(value){if(busy.value)return;if(value==='tokens'){listAbort?.abort();loading.value=false}error.value='';page.value=value;details.value=null;closeDrawer();if(value==='tokens')loadTokens()}
async function tokenAction(t,kind,event){
 if(busy.value)return
 if(kind==='rotate'){await startTask('rotate',event.currentTarget);task.value='rotate';destination.value=t.id;return}
 await startTask('revoke',event.currentTarget);destination.value=t.id
}
async function tokenConfirm(){busy.value=true;taskError.value='';try{const data=await api('/tokens/'+destination.value+(task.value==='rotate'?'/rotate':''),task.value==='rotate'?'POST':'DELETE');if(data?.secret){secret.value=data.secret;task.value='secret'}else taskDialog.value.close();await loadTokens()}catch(e){taskError.value=e.message}finally{busy.value=false}}
const titles={folder:'New folder',bind:'Add from Nextcloud',rebind:'Rebind reference',bucket:'New bucket',rename:'Rename reference',move:'Move references',remove:'Remove links',paste:'Paste references',token:'Create API token',secret:'Save your API token',rotate:'Rotate API token',revoke:'Revoke API token'}
watch(tokenFolder,()=>{if(tokenFolder.value)tokenScopes.value=tokenScopes.value.filter(s=>s!=='token:manage')})
watch([showContext,showFab,details,page,drawer,selection,clipboard],()=>nextTick(layout),{deep:false})
onMounted(async()=>{
 tokenClockTimer=setInterval(()=>{tokenClock.value=Date.now()/1000+tokenClockOffset},30000)
 overlays=new DesignOverlays(root.value);observer=new ResizeObserver(()=>layout());observer.observe(root.value);observer.observe(main.value);observer.observe(document.getElementById('library-footer'));observer.observe(document.getElementById('fab'))
 addEventListener('resize',layout,{signal:abortEvents.signal});document.addEventListener('keydown',keydown,{signal:abortEvents.signal});document.fonts?.ready.then(layout)
 await initialize();layout()
})
onBeforeUnmount(()=>{clearInterval(tokenClockTimer);live=false;listAbort?.abort();fileAbort?.abort();observer?.disconnect();abortEvents.abort();overlays?.closeMenu();overlays?.hideTip()})
</script>
<template>
<div id="media-design" ref="root">
<div class="app" :class="{'with-detail':details}">
<aside id="drawer" class="drawer" aria-label="Media Storage navigation" :class="{'open':drawer}" :role="drawer?'dialog':undefined" :aria-modal="drawer?'true':undefined" :inert="task || undefined">
<div class="brand"><span class="brand-icon" aria-hidden="true">M</span><strong>Media Storage</strong><md-icon-button class="icon close-drawer" aria-label="Close navigation" @click="closeDrawer" type="button"><Icon name="close" /></md-icon-button></div>
<p class="section-label">WORKSPACE</p><nav aria-label="Plugin pages"><button class="destination" :class="{active:page==='objects'}" :aria-current="page==='objects'?'page':undefined" @click="showPage('objects')"><md-ripple :disabled="busy || loading" /><Icon name="grid_view" />Objects</button><button class="destination" :class="{active:page==='tokens'}" :aria-current="page==='tokens'?'page':undefined" @click="showPage('tokens')"><md-ripple :disabled="busy || loading" /><Icon name="key" />API tokens</button></nav>
<div class="bucket-title"><h2>Buckets</h2><md-text-button id="add-bucket" class="text" aria-label="Add bucket" data-tip="Create a virtual bucket" :disabled="busy || loading" @click="startTask('bucket',$event.currentTarget)" type="button"><Icon slot="icon" name="add" />Add</md-text-button></div>
<label class="filter"><span class="sr-only">Filter buckets</span><input v-model="bucketFilter" type="search" placeholder="Filter buckets"></label>
<nav aria-label="Buckets"><button v-for="b in filteredBuckets" :key="b.id" class="destination" :class="{active:b.id===bucket?.id}" :aria-current="b.id===bucket?.id?'page':undefined" :disabled="busy" @click="switchBucket(b)"><md-ripple :disabled="busy || loading" />{{b.name}}</button></nav><p v-if="!filteredBuckets.length && !loading">No matching buckets</p>
<div class="drawer-footer">v{{version}}</div></aside>
<button id="scrim" class="scrim" aria-label="Close navigation" :hidden="!drawer" @click="closeDrawer"></button>
<main id="main" ref="main" tabindex="-1" :inert="drawer || undefined" :class="{'has-toolbar':showContext,'has-fab':showFab}">
<header class="library-navbar"><md-icon-button id="open-drawer" class="icon" aria-label="Open navigation" :aria-expanded="drawer" aria-controls="drawer" @click="openDrawer" type="button"><Icon name="menu" /></md-icon-button><h1>{{page==='tokens'?'API tokens':bucket?.name??'Media Storage'}}</h1>
<form id="search-form" v-show="page==='objects'" role="search" aria-label="Current folder" @submit.prevent="search"><label class="search"><Icon name="search" /><span class="sr-only">Search this folder by name</span><input v-model="query" type="search" placeholder="Search this folder by name"><md-icon-button class="icon" aria-label="Search" :disabled="busy" type="submit"><Icon name="arrow_forward" /></md-icon-button></label></form></header>
<div id="main-scroll" class="main-scroll">
<section v-show="page==='objects'" id="explorer">
<nav v-if="path.length" id="path-row" class="path-row" aria-label="Folder path"><md-text-button class="text" @click="navigate(-1)" type="button">{{bucket?.name}}</md-text-button><template v-for="(p,i) in path" :key="p.id"><span aria-hidden="true">/</span><md-text-button class="text" :aria-current="i===path.length-1?'page':undefined" @click="navigate(i)" type="button">{{p.name}}</md-text-button></template></nav>
<div class="collection-heading"><div class="collection-summary"><h2>Objects</h2><span id="count">{{nodes.length}} in this view</span><strong v-if="selection.length" id="selected-count">{{selection.length}} selected</strong><span v-if="clipboard.length" id="clipboard-count">{{clipboard.length}} copied</span></div><label class="sort"><span>Sort by</span><span class="select-control"><select v-model="sort"><option value="name">Name</option><option value="type">Type</option></select><Icon name="expand_more" /></span></label></div>
<div v-if="loading && !nodes.length" class="loading" role="status"><md-circular-progress indeterminate aria-label="Loading objects" />Loading objects…</div>
<div v-if="error" class="error" role="alert">{{error}} <md-text-button @click="initialize">Retry</md-text-button></div>
<div class="column-head" aria-hidden="true"><span></span><span>Name</span><span>Type</span><span>Binding</span><span></span></div>
<ul id="objects" class="objects" aria-label="Objects in current folder" :aria-busy="loading">
<li v-for="n in sorted" :key="n.id" class="object"><label class="check"><input type="checkbox" :aria-label="'Select '+n.name" :checked="selection.includes(n.id)" :disabled="busy" @change="toggle(n)"></label><button :id="'open-node-'+n.id" class="object-name" :disabled="busy" @click="openNode(n,$event)"><span class="file-icon"><Icon :name="iconFor(n)" /></span><span class="name-copy">{{n.name}}<span class="mobile-meta">{{typeLabel(n)}}<template v-if="n.node_type==='media'"> · {{bindingLabel(n)}}</template></span></span></button><md-ripple class="row-ripple" :for="'open-node-'+n.id" :disabled="busy" /><span class="type">{{typeLabel(n)}}</span><span class="binding" :class="{broken:n.binding_status==='needs_rebind'}">{{bindingLabel(n)}}</span><md-icon-button class="icon" :aria-label="'Details for '+n.name" data-tip="Inspect this virtual reference" :disabled="busy" @click="inspect(n,$event.currentTarget)" type="button"><Icon name="info" /></md-icon-button></li>
</ul>
<div v-if="!loading && !error && !nodes.length" class="empty"><Icon name="folder_open" /><h2>{{submitted?'No matching objects':'This folder is empty'}}</h2><p>{{submitted?'Try another name in this folder.':'Use Add to create a folder or link an existing Nextcloud file.'}}</p></div><p class="status" role="status">{{status}}</p>
</section>
<section v-if="page==='tokens'" id="tokens" :aria-busy="tokenLoading">
<p class="token-intro">Manage access for your integrations. Token secrets are shown only once.</p>
<div class="token-summaries" aria-label="Token status filters">
<button v-for="group in tokenGroups" :key="group.id" type="button" class="token-summary" :class="{selected:tokenFilter===group.id}" :aria-pressed="tokenFilter===group.id" :disabled="tokenLoading || !!error" @click="tokenFilter=tokenFilter===group.id?'all':group.id"><md-ripple :disabled="tokenLoading || !!error" /><span>{{group.label}}</span><strong>{{tokenLoading || error?'—':tokenCounts[group.id]}}</strong><span class="summary-hint">{{tokenFilter===group.id?'Showing this group':'Filter list'}}</span></button>
</div>
<div class="token-list-heading"><div><h2>Access tokens</h2><p v-if="!tokenLoading && !error" role="status">{{visibleTokens.length}} of {{tokens.length}} tokens</p></div><md-filled-button id="create-token" :disabled="busy || tokenLoading" @click="startTask('token',$event.currentTarget)"><Icon slot="icon" name="add" />Create token</md-filled-button></div>
<div class="token-filters">
<md-outlined-text-field id="token-search" label="Search token names" type="search" :value="tokenSearch" @input="tokenSearch=$event.target.value"><Icon slot="leading-icon" name="search" /></md-outlined-text-field>
<label>Status<span class="token-select"><select id="token-filter" v-model="tokenFilter"><option value="all">All tokens</option><option v-for="group in tokenGroups" :key="group.id" :value="group.id">{{group.label}}</option></select><Icon name="expand_more" /></span></label>
<label>Sort by<span class="token-select"><select id="token-sort" v-model="tokenSort"><option value="expiry">Expiration date</option><option value="name">Name</option></select><Icon name="expand_more" /></span></label>
</div>
<div v-if="tokenLoading" class="loading" role="status"><md-circular-progress indeterminate />Loading tokens…</div>
<p v-if="error" class="error" role="alert">{{error}} <md-text-button @click="loadTokens">Retry</md-text-button></p>
<div v-if="!tokenLoading && !error && visibleTokens.length" class="token-columns" aria-hidden="true"><span>Name and permissions</span><span>Status and activity</span><span>Actions</span></div>
<ul v-if="!tokenLoading && !error" class="token-list" aria-label="Access tokens"><li v-for="t in visibleTokens" :key="t.id" class="token-row">
<div class="token-copy"><h3>{{t.name}}</h3><p>{{tokenBoundary(t)}}</p><ul class="token-permissions" aria-label="Permissions"><li v-for="scope in t.scopes" :key="scope">{{scope}}</li></ul></div>
<div class="token-activity"><span class="token-status" :class="tokenState(t,tokenClock)">{{tokenState(t,tokenClock)}}</span><p>Expires {{formatTokenDate(t.expires_at)}}</p><p>Last used: {{formatTokenDate(t.last_used_at)}}</p></div>
<div class="token-actions"><md-text-button v-if="tokenState(t,tokenClock)==='active'" :disabled="busy" :aria-label="'Rotate '+t.name" @click="tokenAction(t,'rotate',$event)">Rotate</md-text-button><md-text-button v-if="tokenState(t,tokenClock)==='active'" :disabled="busy" :aria-label="'Revoke '+t.name" @click="tokenAction(t,'revoke',$event)">Revoke</md-text-button><span v-else class="muted">No actions</span></div>
</li></ul>
<div v-if="!tokenLoading && !error && !visibleTokens.length" class="token-empty"><Icon name="key" /><h3>{{tokens.length?'No matching tokens':'No tokens yet'}}</h3><p>{{tokens.length?'Try another name or status filter.':'Create a token to connect your first integration.'}}</p><md-text-button v-if="tokens.length" @click="resetTokenFilters">Clear filters</md-text-button></div>
</section>
</div>
<footer id="library-footer" class="library-footer" :hidden="page!=='objects'">
<div id="selection" class="selection" :hidden="!showContext"><div id="reference-toolbar" ref="toolbar" class="toolbar-actions" :class="{'icon-actions':iconsOnly}" role="toolbar" aria-label="Virtual reference actions" @keydown="toolbarKey"><component :is="iconsOnly?'md-icon-button':'md-text-button'" v-for="a in actions" :id="'action-'+a.id" :key="a.id" :data-tip="a.tip" :aria-label="a.label" :disabled="disabled(a.id)" :class="{danger:a.id==='remove'}" @click="action(a.id,$event)" class="toolbar-command" type="button"><Icon :slot="iconsOnly?undefined:'icon'" :name="a.icon" /><span v-if="!iconsOnly" class="action-label">{{a.label}}</span></component><md-icon-button id="more-actions" class="icon" aria-label="More reference actions" aria-haspopup="menu" aria-expanded="false" aria-controls="toolbar-menu" data-tip="More link actions" @click="openMenu('toolbar-menu',$event)" type="button"><Icon name="expand_more" /></md-icon-button></div><md-filled-tonal-icon-button id="cancel-selection" class="icon cancel-context" aria-label="Cancel reference actions" data-tip="Cancel selection and copied links" :disabled="busy" @click="cancelContext" type="button"><Icon name="close" /></md-filled-tonal-icon-button></div>
<p v-show="!showContext" class="footnote">Removing links keeps the original files in Nextcloud.</p></footer>
</main>
<aside v-if="details" id="details" class="details" aria-labelledby="detail-name" :inert="drawer || undefined"><div class="detail-top"><span class="eyebrow">OBJECT DETAILS</span><md-icon-button id="close-detail" class="icon" aria-label="Close object details" @click="closeDetails" type="button"><Icon name="close" /></md-icon-button></div><div class="detail-symbol"><Icon :name="iconFor(details)" /></div><h2 id="detail-name">{{details.name}}</h2><p v-if="details.loading" role="status">Loading details…</p><p v-if="details.error" class="error" role="alert">{{details.error}}</p><dl v-else><dt>Type</dt><dd>{{typeLabel(details)}}</dd><dt>Binding</dt><dd>{{bindingLabel(details)}}</dd><dt>Bucket</dt><dd>{{bucket?.name}}</dd><dt>Virtual path</dt><dd>{{details.virtual_path}}</dd><template v-if="details.binding"><dt>Original file</dt><dd>{{details.binding.last_known_path}}</dd><dt>Size</dt><dd>{{details.binding.file_size}} bytes</dd></template></dl><div class="detail-actions"><md-text-button v-if="details.node_type==='media' && !details.loading && !details.error" :disabled="busy" @click="startTask('rebind',$event.currentTarget)">Rebind to another file</md-text-button><md-text-button v-if="details.node_type==='media' && !!details.virtual_path && !details.loading && !details.error" id="copy-virtual-path" :disabled="busy" @click="copyVirtualPath">Copy virtual path</md-text-button></div><p v-if="pathStatus" class="link-status" role="status">{{pathStatus}}</p><label v-if="manualPath" class="detail-link">Plugin virtual path<input id="manual-virtual-path" type="text" :value="manualPath" readonly @focus="$event.target.select()"></label></aside>
</div>
<div id="fab-area" class="fab-area" :hidden="!showFab" :style="fabStyle"><md-fab id="fab" class="fab" aria-label="Add" aria-haspopup="menu" aria-expanded="false" aria-controls="fab-menu" data-tip="Add a link or virtual folder" :aria-disabled="loading || busy" :inert="loading || busy || undefined" @click="openMenu('fab-menu',$event)" :label="fabLabel" variant="secondary"><Icon slot="icon" name="add" /></md-fab></div>
<div id="fab-menu" class="action-menu" role="menu" aria-label="Add to this folder" hidden><button role="menuitem" tabindex="-1" data-tip="Reference an existing Nextcloud file" @click="fabTask('bind')"><md-ripple :disabled="busy || loading" /><Icon name="add" />Add from Nextcloud</button><button role="menuitem" tabindex="-1" data-tip="Create a virtual folder" @click="fabTask('folder')"><md-ripple :disabled="busy || loading" /><Icon name="folder" />New folder</button></div>
<div id="toolbar-menu" class="action-menu" role="menu" aria-label="More virtual reference actions" hidden><button v-for="a in overflow" :key="a.id" role="menuitem" tabindex="-1" :aria-disabled="disabled(a.id)" :data-tip="a.tip" :class="{danger:a.id==='remove'}" @click="action(a.id,$event)"><md-ripple :disabled="disabled(a.id)" /><Icon :name="a.icon" />{{a.label}}</button></div>
<dialog id="task" ref="taskDialog" :aria-label="titles[task]" @close="taskClosed" @cancel="busy?$event.preventDefault():undefined"><form @submit.prevent="task==='rotate'||task==='revoke'?tokenConfirm():submit()">
<h2>{{titles[task]}}</h2><p v-if="task==='remove'">Remove {{selection.length}} selected reference(s), including virtual children? Original Nextcloud files and other links are kept.</p><p v-if="task==='move'">Choose a virtual destination. Original files stay in Nextcloud.</p><p v-if="task==='paste'">Create independent links to the same originals.</p><p v-if="task==='revoke'">This token will stop authorizing integrations immediately.</p><p v-if="task==='rotate'">A new secret will be issued. The old token remains active until you revoke it.</p>
<template v-if="task==='bind'||task==='rebind'"><p>Choose an existing image or video. This creates or updates a reference without moving the original.</p><nav class="picker-navigation" aria-label="Nextcloud folders"><md-icon-button id="picker-back" type="button" aria-label="Up one folder" data-tip="Up one folder" :disabled="!filePath || fileLoading || busy" @click="browseFiles(filePath.split('/').slice(0,-1).join('/'),true)"><Icon name="arrow_back" class="directional" /></md-icon-button><md-icon-button id="picker-home" type="button" aria-label="Go to root folder" data-tip="Go to root folder" :disabled="!filePath || fileLoading || busy" @click="browseFiles('',true)"><Icon name="home" /></md-icon-button><span id="picker-location" class="picker-location" tabindex="-1" role="status" :title="filePath?'/'+filePath:undefined" :aria-label="filePath?'Current Nextcloud folder: /'+filePath:'Nextcloud files (root)'">{{filePath.split('/').at(-1) || 'Nextcloud files'}}</span></nav><p v-if="fileLoading" role="status">Loading files…</p><p v-if="fileError" class="error" role="alert">{{fileError}} <md-text-button type="button" class="text" @click="browseFiles(filePath)">Retry</md-text-button></p><ul class="file-picker"><li v-for="f in files" :key="f.path"><button type="button" :disabled="busy || (!f.folder && (!mediaType(f.mime)||!f.id))" :class="{chosen:chosen?.id===f.id && !f.folder}" :aria-pressed="!f.folder?chosen?.id===f.id:undefined" @click="f.folder?browseFiles(f.path,true):(chosen=f,draft=f.name)"><md-ripple :disabled="busy || (!f.folder && (!mediaType(f.mime)||!f.id))" /><Icon :name="f.folder?'folder':'image'" />{{f.name}}</button></li></ul><p v-if="chosen">Selected: {{chosen.name}}</p></template>
<label v-if="['folder','bucket','rename','bind','paste','token'].includes(task) && !(task==='paste'&&clipboard.length>1)" class="task-field">{{task==='token'?'Token name':'Name'}} (required)<input v-model="draft" required :disabled="busy" autocomplete="off" :maxlength="task==='token'?100:255"></label>
<label v-if="task==='move'" class="task-field">Destination folder<select v-model="destination" :disabled="busy"><option v-for="d in destinations" :key="d.id" :value="d.id">{{d.label}}</option></select></label>
<template v-if="task==='token'"><label class="task-field">Expires (required)<input id="token-expiry" v-model="tokenExpiry" type="datetime-local" required :disabled="busy || !tokenBounds" :min="tokenBounds?localMinute(tokenBounds.min):undefined" :max="tokenBounds?localMinute(tokenBounds.max):undefined" step="60" aria-describedby="token-expiry-help" :aria-invalid="!!expiryError" @input="expiryError=''"><span id="token-expiry-help" class="field-help" :class="{error:expiryError}" :role="expiryError?'alert':undefined">{{expiryError || expiryHelp}}</span></label><label class="task-field">Access boundary<select v-model="tokenFolder" :disabled="busy"><option value="">All my buckets and folders</option><option v-for="b in buckets" :key="b.id" :value="b.id">{{b.name}}</option><option v-if="path.length" :value="parent">Current folder only</option></select></label><fieldset class="scope-options"><legend>Permissions (choose at least one)</legend><label v-for="scope in ['media:read','media:manage','media:delete','token:manage']" :key="scope"><input v-model="tokenScopes" type="checkbox" :value="scope" :disabled="busy || (scope==='token:manage' && !!tokenFolder)">{{scope}}</label></fieldset></template>
<template v-if="task==='secret'"><p>Copy this secret now. It will not be shown again after closing.</p><code class="secret" tabindex="0" aria-label="API token secret">{{secret}}</code><p v-if="copyFeedback" id="token-copy-feedback" class="field-help" role="status">{{copyFeedback}}</p></template>
<p v-if="taskError" class="error" role="alert">{{taskError}}</p><div class="dialog-actions" :class="{'secret-actions':task==='secret'}"><md-text-button type="button" :disabled="busy" @click="closeTask">{{task==='secret'?'Done':'Cancel'}}</md-text-button><md-filled-button v-if="task==='secret'" id="copy-token-secret" type="button" :disabled="copying || busy" @click="copyTokenSecret"><Icon slot="icon" name="content_copy" />{{copying?'Copying…':'Copy token'}}</md-filled-button><md-filled-button v-if="task!=='secret'" type="button" :disabled="busy || (task==='token'&&!tokenBounds) || (task==='move'&&!destinations.length)" @click="task==='rotate'||task==='revoke'?tokenConfirm():submit()">{{busy?'Saving…':task==='remove'?'Remove links':task==='revoke'?'Revoke':task==='rotate'?'Rotate':'Save'}}</md-filled-button></div>
</form></dialog><div id="action-tooltip" class="action-tooltip" role="tooltip" hidden></div>
</div>
</template>
