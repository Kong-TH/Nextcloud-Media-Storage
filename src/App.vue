<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script setup>
import {ref,computed,onMounted,onBeforeUnmount,nextTick,watch} from 'vue'
import {eligibleSource,importIdentity,prepareImport,executeImport,MAX_SOURCES} from './source-import.js'
import {resolveSelection} from './bulk-selection.js'
import {ObjectPager} from './object-pager.js'
import Icon from './components/MaterialIcon.vue'
import {selectLabel as vSelectLabel} from './select-label.js'
import UploadPanel from './components/UploadPanel.vue'
import UploadNotice from './components/UploadNotice.vue'
import MediaPreview from './components/MediaPreview.vue'
import {api,allNodes,allBuckets,davFiles} from './api.js'
import {validName,mediaType,typeLabel} from './rules.js'
import DesignOverlays from './overlays.js'
import {tokenGroups,tokenState,matchesToken,expiryBounds,localMinute} from './token-model.js'
import {readLocation,locationHash,folderPath,InvalidLocation} from './navigation.js'
defineProps({version:{type:String,required:true}})
const root=ref(),main=ref(),toolbar=ref(),taskDialog=ref(),uploadPanel=ref()
const uploadedNode=ref(null)
const buckets=ref([]),bucket=ref(null),path=ref([]),nodes=ref([]),query=ref(''),submitted=ref(''),sort=ref('name'),bucketFilter=ref('')
const pageTotal=ref(0),pageMore=ref(false),appendLoading=ref(false),appendError=ref(''),pageChanged=ref(false)
const selectionMode=ref('loaded'),allSelection=ref(null),selectionSnapshot=ref([]),selectionProgress=ref(null),selectionError=ref(''),selectionMenu=ref(),selectionMenuOpen=ref(false)
let selectionAbort
const selection=ref([]),clipboard=ref([]),loading=ref(false),busy=ref(false),error=ref(''),status=ref(''),details=ref(null),page=ref('objects'),drawer=ref(false)
const detailFields=computed(()=>{
 const n=details.value;if(!n)return []
 const fields=[{label:'Type',icon:iconFor(n),value:typeLabel(n)},{label:'Binding',icon:n.binding_status==='available'?'check':'info',value:bindingLabel(n)},{label:'Bucket',icon:'folder',value:bucket.value?.name},{label:'Virtual path',icon:'grid_view',value:n.virtual_path,path:true}]
 if(n.binding)fields.push({label:'Original file',icon:'description',value:n.binding.last_known_path,path:true},{label:'Size',icon:'info',value:Number(n.binding.file_size).toLocaleString()+' bytes'})
 return fields
})
const task=ref(null),draft=ref(''),taskError=ref(''),destinations=ref([]),destination=ref(''),files=ref([]),filePath=ref(''),fileLoading=ref(false),chosen=ref(null),fileError=ref('')
const sourceSelection=ref([]),importPlan=ref(null),importProgress=ref(null)
let importAbort,importRequest=''
const pickerEligible=computed(()=>files.value.filter(eligibleSource))
const pickerAll=computed(()=>pickerEligible.value.length>0&&pickerEligible.value.every(f=>sourceSelection.value.some(s=>s.id===f.id)))
const pickerSingle=computed(()=>sourceSelection.value.length===1&&!sourceSelection.value[0].folder)
function pickerSelected(f){return sourceSelection.value.some(s=>s.id===f.id)}
function toggleSource(f){
 if(busy.value||importPlan.value||!eligibleSource(f))return
 if(pickerSelected(f))sourceSelection.value=sourceSelection.value.filter(s=>s.id!==f.id)
 else if(sourceSelection.value.length<MAX_SOURCES)sourceSelection.value.push(f)
 else {taskError.value='Choose at most 1000 sources per task.';return}
 chosen.value=pickerSingle.value?sourceSelection.value[0]:null;draft.value=chosen.value?.name??'';taskError.value=''
}
function pickerSelectAll(){
 if(busy.value||fileLoading.value||importPlan.value)return
 const ids=new Set(pickerEligible.value.map(f=>f.id))
 if(pickerAll.value)sourceSelection.value=sourceSelection.value.filter(s=>!ids.has(s.id))
 else {const next=[...new Map([...sourceSelection.value,...pickerEligible.value].map(f=>[f.id,f])).values()];if(next.length>MAX_SOURCES){taskError.value='Choose at most 1000 sources per task.';return}sourceSelection.value=next}
 chosen.value=pickerSingle.value?sourceSelection.value[0]:null;draft.value=chosen.value?.name??'';taskError.value=''
}
async function importSources(){
 if(!sourceSelection.value.length){taskError.value='Choose files or folders to add.';return}
 if(pickerSingle.value&&!validName(draft.value)){taskError.value='Use a valid display name up to 255 UTF-8 bytes.';return}
 busy.value=true;taskError.value='';const controller=new AbortController();importAbort=controller
 try{
  if(!importPlan.value){
   importProgress.value={stage:'Preparing',done:0,total:null}
   const sources=sourceSelection.value.map(f=>({...f,...(pickerSingle.value?{name:draft.value}:{})}))
   importPlan.value=await prepareImport(sources,davFiles,controller.signal,n=>{importProgress.value={stage:'Preparing',done:n,total:null}})
  }
  const plan=importPlan.value
  const done=await executeImport(plan,importRequest,destination.value,body=>api('/imports/entries','POST',body),controller.signal,(done,total)=>{importProgress.value={stage:'Adding',done,total}})
  status.value='Added '+done+' virtual reference(s). '+(plan.skipped.length?plan.skipped.length+' unsupported item(s) skipped. ':'')+(plan.covered?plan.covered+' selected descendant(s) included through their folder. ':'')+'Original Nextcloud files are unchanged.'
  taskDialog.value.close();await load()
 }catch(e){const done=importPlan.value?.created.size??0;taskError.value=(e.name==='AbortError'?'Stopped.':e.message)+' '+done+' reference(s) confirmed. '+(importPlan.value?(e.status===409?'Close this task and choose a different name or destination. Saved references are kept.':'Retry continues this task without duplicating saved references.'):'No references were created.')}
 finally{importProgress.value=null;busy.value=false}
}
const tokens=ref([]),secret=ref(''),tokenScopes=ref(['media:read']),tokenExpiry=ref(''),tokenFolder=ref('')
const managedBucket=ref(null),bucketFocusId=ref(null)
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
let routeAbort,tokenAbort,routeSerial=0,restoring=false,routeReady=false,pendingNavigation=false,displayedHash='',requestedHash='',navigationTimer
const abortEvents=new AbortController()
const actions=[{id:'move',label:'Move',icon:'drive_file_move',tip:'Change virtual folder only'},{id:'copy',label:'Copy',icon:'content_copy',tip:'Copy links, not file contents'},{id:'paste',label:'Paste',icon:'content_paste',tip:'Create links in this folder'},{id:'rename',label:'Rename',icon:'edit',tip:'Change the plugin name only'},{id:'remove',label:'Remove links',icon:'delete',tip:'Keep all original Nextcloud files'}]
const parent=computed(()=>path.value.at(-1)?.id??bucket.value?.id)
const selectionCount=computed(()=>allSelection.value?allSelection.value.total-allSelection.value.excluded.length:selection.value.length)
const context=computed(()=>selectionCount.value>0||clipboard.value.length>0)
const showContext=computed(()=>context.value&&!details.value&&page.value==='objects'&&!drawer.value&&!task.value)
const showFab=computed(()=>!context.value&&!details.value&&page.value==='objects'&&!drawer.value&&!task.value)
const filteredBuckets=computed(()=>buckets.value.filter(b=>b.name.toLocaleLowerCase().includes(bucketFilter.value.toLocaleLowerCase())))
const sorted=computed(()=>nodes.value)
const selectedNodes=computed(()=>[...new Map([...selectionSnapshot.value,...nodes.value].map(n=>[n.id,n])).values()].filter(n=>selection.value.includes(n.id)))
const selectChecked=computed(()=>selectionMode.value==='all'?(allSelection.value?!allSelection.value.excluded.length&&selectionCount.value>0:pageTotal.value>0&&selection.value.length===pageTotal.value):nodes.value.length>0&&nodes.value.every(isSelected))
const selectMixed=computed(()=>!selectChecked.value&&selectionCount.value>0)
function isSelected(node){return allSelection.value?!allSelection.value.excluded.includes(node.id):selection.value.includes(node.id)}
function clearSelection(){selectionError.value='';selection.value=[];allSelection.value=null;selectionSnapshot.value=[];selectionMenu.value?.close()}
function selectAll(){
 if(busy.value||loading.value||appendLoading.value||pageChanged.value||error.value)return
 if(selectChecked.value){clearSelection();return}
 applySelectionMode(selectionMode.value)
}
function applySelectionMode(mode){
 if(busy.value||loading.value||appendLoading.value||pageChanged.value||error.value||objectPager.revision===null)return
 clearSelection();selectionMode.value=mode
 if(mode==='all')allSelection.value={scope:{parent:parent.value,search:submitted.value,sort:sort.value,revision:objectPager.revision},total:pageTotal.value,excluded:[]}
 else {selection.value=nodes.value.map(n=>n.id);selectionSnapshot.value=nodes.value.map(n=>({id:n.id,name:n.name,node_type:n.node_type}))}
}
function chooseSelectionScope(mode,event){
 const reason=event.detail?.reason
 if(reason?.kind==='click-selection'||reason?.kind==='keydown'&&['Enter','Space'].includes(reason.key))applySelectionMode(mode)
}
function selectionMenuClosing(){
 // Native focus restoration can scroll a sticky anchor back to its flow position.
 const menu=selectionMenu.value,active=document.activeElement
 if(menu?.contains(active)||active===menu||active===document.body)menu.anchorElement?.focus({preventScroll:true})
}
function showSelectionMenu(event){
 overlays?.closeMenu();overlays?.hideTip(true)
 const menu=selectionMenu.value,anchor=event.currentTarget,r=anchor.getBoundingClientRect(),bounds=document.getElementById('objects').getBoundingClientRect(),rtl=getComputedStyle(root.value).direction==='rtl'
 const width=Math.min(280,bounds.width),naturalLeft=rtl?r.right-width:r.left,left=Math.max(bounds.left,Math.min(naturalLeft,bounds.right-width))
 menu.style.minWidth=menu.style.maxWidth=width+'px';menu.xOffset=(left-naturalLeft)*(rtl?-1:1);menu.anchorElement=anchor;menu.show()
}
async function prepareSelection(){
 if(!allSelection.value)return true
 busy.value=true;selectionError.value='';selectionProgress.value={done:0,total:allSelection.value.total};status.value=''
 const controller=new AbortController();selectionAbort=controller
 try{
  const rows=await resolveSelection(allSelection.value,async(scope,signal)=>{
   const params=new URLSearchParams({parent_id:scope.parent,search:scope.search,sort:scope.sort,paged:'true',limit:String(scope.limit),offset:String(scope.offset),revision:String(scope.revision)})
   return api('/nodes?'+params,'GET',undefined,signal)
  },controller.signal,(done,total)=>{selectionProgress.value={done,total}})
  if(!live)return false
  selectionSnapshot.value=rows;selection.value=rows.map(n=>n.id);allSelection.value=null;return true
 }catch(e){if(live){selectionError.value=e.message;if(e.status===409)pageChanged.value=true}return false}
 finally{selectionProgress.value=null;busy.value=false}
}
function disabled(id){return busy.value||loading.value||(id==='paste'?!clipboard.value.length:id==='rename'?selectionCount.value!==1:!selectionCount.value)}
function iconFor(n){const type=typeLabel(n);return type==='Folder'?'folder':type==='Image'?'image':type==='Video'?'movie':'description'}
function bindingLabel(n){return n.node_type==='folder'?'—':n.binding_status==='available'?'Available':n.binding_status==='needs_rebind'?'Needs rebind':n.binding_status==='unavailable'?'Unavailable':'Checking…'}
const objectPager=new ObjectPager(async(scope,signal)=>{
 const params=new URLSearchParams({parent_id:scope.parent,search:scope.search,sort:scope.sort,paged:'true',limit:'25',offset:String(scope.offset)})
 if(scope.revision!==null)params.set('revision',String(scope.revision))
 const data=await api('/nodes?'+params,'GET',undefined,signal)
 const media=data.nodes.filter(n=>n.node_type==='media'),hydrated=new Map()
 for(let i=0;i<media.length;i+=6){
  const rows=await Promise.all(media.slice(i,i+6).map(n=>api('/nodes/'+n.id,'GET',undefined,signal).catch(e=>{if(e.name==='AbortError')throw e;return {...n,binding_status:'unavailable'}})))
  if(signal.aborted)throw new DOMException('Aborted','AbortError')
  rows.forEach(n=>hydrated.set(n.id,n))
 }
 return {...data,nodes:data.nodes.map(n=>hydrated.get(n.id)??n)}
},state=>{
 if(!live)return
 nodes.value=state.rows;pageTotal.value=state.total;pageMore.value=state.more
 loading.value=state.loading&&!state.rows.length;appendLoading.value=state.loading&&!!state.rows.length
 error.value=!state.rows.length?state.error?.message??'':'';appendError.value=state.rows.length?state.error?.message??'':'';pageChanged.value=state.error?.status===409
})
async function load(){
 if(!parent.value)return
 const promise=objectPager.reset({parent:parent.value,search:submitted.value,sort:sort.value})
 listAbort={abort:()=>objectPager.cancel()}
 await promise;await nextTick();checkObjectEnd()
}
function reloadObjects(){clearSelection();document.getElementById('main-scroll').scrollTop=0;rememberScroll();load()}
async function loadMore(){
 if(page.value!=='objects'||busy.value||loading.value||appendLoading.value||!pageMore.value||pageChanged.value)return
 await objectPager.next();await nextTick();checkObjectEnd()
}
function checkObjectEnd(){
 if(!live||restoring||task.value||drawer.value||details.value||page.value!=='objects'||error.value||appendError.value||busy.value||loading.value||appendLoading.value||!pageMore.value)return
 const scroller=document.getElementById('main-scroll'),end=document.getElementById('object-page-end')
 if(scroller&&end&&end.getBoundingClientRect().top<=scroller.getBoundingClientRect().bottom+32)loadMore()
}
function currentLocation(){return {page:page.value,bucket:bucket.value?.id??'',folder:path.value.at(-1)?.id??'',search:submitted.value,sort:sort.value,detail:details.value?.id??''}}
function rememberScroll(){
 if(!routeReady||restoring||pendingNavigation||displayedHash!==location.hash)return
 history.replaceState({...history.state,mediastorage:{scrollTop:document.getElementById('main-scroll')?.scrollTop??0}},'')
}
function writeLocation(mode='push'){
 const hash=locationHash(currentLocation())
 if(mode==='push'&&hash===location.hash)return
 if(mode==='push')rememberScroll()
 const state={...history.state,mediastorage:{scrollTop:mode==='replace'?history.state?.mediastorage?.scrollTop??0:0}}
 history[mode==='replace'?'replaceState':'pushState'](state,'',location.pathname+location.search+hash)
 displayedHash=hash
 if(mode==='push')nextTick(()=>{document.getElementById('main-scroll').scrollTop=0})
}
function commitNavigation(mode='push'){
 if(!routeReady||pendingNavigation)return
 routeAbort?.abort();++routeSerial;restoring=false
 writeLocation(mode)
}
async function restoreLocation(refresh=true){
 if(busy.value){pendingNavigation=true;return}
 routeAbort?.abort();listAbort?.abort();tokenAbort?.abort();++detailSerial
 const controller=new AbortController(),serial=++routeSerial;routeAbort=controller;restoring=true;requestedHash=location.hash
 const route=readLocation(location.hash),scrollTop=Math.max(0,Number(history.state?.mediastorage?.scrollTop)||0)
 loading.value=true;tokenLoading.value=false;error.value='';status.value='';clearSelection();details.value=null;nodes.value=[]
 overlays?.closeMenu();overlays?.hideTip(true);closeDrawer()
 if(taskDialog.value?.open){secret.value='';taskDialog.value.close();task.value=null}
 try{
  if(refresh){const rows=await allBuckets(controller.signal);if(controller.signal.aborted||serial!==routeSerial||!live)return;buckets.value=rows}
  if(controller.signal.aborted||!live)return
  const target=buckets.value.find(b=>b.id===route.bucket)??buckets.value.find(b=>b.is_default)
  if(!target)throw new Error('No accessible default bucket. Reload and try again.')
  let restoredPath=[],notice=''
  if(route.bucket&&target.id!==route.bucket){notice='This bucket is unavailable. Showing the default bucket.';route.folder=route.detail=route.search=''}
  try{restoredPath=await folderPath(target.id,route.folder,id=>api('/nodes/'+id,'GET',undefined,controller.signal))}
  catch(e){if(e instanceof InvalidLocation||e.status===404||e.status===403){notice='This folder is unavailable in this bucket. Showing its root.';route.folder=route.detail=route.search=''}else throw e}
  if(controller.signal.aborted||!live)return
  bucket.value=target;path.value=restoredPath;query.value=submitted.value=route.search;sort.value=route.sort;page.value=route.page
  if(route.page==='tokens'){loading.value=false;await loadTokens()}
  else {
   await load()
   if(controller.signal.aborted||serial!==routeSerial||!live)return
   if(route.detail){
    try{const node=await api('/nodes/'+route.detail,'GET',undefined,controller.signal);if(controller.signal.aborted||serial!==routeSerial||!live)return;if(node.parent_id!==parent.value)throw new InvalidLocation('Details are outside the current folder.');details.value=node}
    catch(e){if(e instanceof InvalidLocation||e.status===404||e.status===403){notice='These object details are no longer available in this folder.'}else throw e}
   }
  }
  if(controller.signal.aborted||serial!==routeSerial||!live)return
  status.value=notice;writeLocation('replace');await nextTick()
  const scroller=document.getElementById('main-scroll')
  while(route.page==='objects'&&objectPager.more&&!objectPager.error&&scroller.scrollHeight<scrollTop+scroller.clientHeight&&!controller.signal.aborted){await objectPager.next();await nextTick()}
  if(controller.signal.aborted||serial!==routeSerial||!live)return
  scroller.scrollTop=scrollTop
  if(details.value)document.getElementById('close-detail')?.focus({preventScroll:true});else main.value?.focus({preventScroll:true})
 }catch(e){if(!controller.signal.aborted&&live)error.value=e.message}
 finally{if(serial===routeSerial){restoring=false;loading.value=false;layout();nextTick(checkObjectEnd)}}
}
function historyNavigation(){
 clearTimeout(navigationTimer)
 navigationTimer=setTimeout(()=>{if(!live)return;if(busy.value){pendingNavigation=true;return}if(restoring&&requestedHash===location.hash)return;restoreLocation()},0)
}
async function initialize(){
 routeAbort?.abort();const controller=new AbortController();routeAbort=controller;loading.value=true;error.value=''
 try{const rows=await allBuckets(controller.signal);if(controller.signal.aborted||!live)return;buckets.value=rows;routeReady=true;await restoreLocation(false)}
 catch(e){if(!controller.signal.aborted&&live){error.value=e.message;loading.value=false}}
}
function switchBucket(b){if(busy.value)return;bucket.value=b;path.value=[];clearSelection();query.value=submitted.value='';details.value=null;++detailSerial;page.value='objects';closeDrawer();tokenAbort?.abort();commitNavigation();load()}
function navigate(index){if(busy.value)return;path.value=path.value.slice(0,index+1);clearSelection();query.value=submitted.value='';details.value=null;++detailSerial;commitNavigation();load()}
function search(){if(busy.value)return;submitted.value=query.value;clearSelection();details.value=null;++detailSerial;commitNavigation();load()}
function toggle(n){if(busy.value)return;if(allSelection.value){const ids=allSelection.value.excluded;allSelection.value={...allSelection.value,excluded:ids.includes(n.id)?ids.filter(id=>id!==n.id):[...ids,n.id]}}else{selectionSnapshot.value=[...selectionSnapshot.value.filter(x=>x.id!==n.id),{id:n.id,name:n.name,node_type:n.node_type}];selection.value=selection.value.includes(n.id)?selection.value.filter(id=>id!==n.id):[...selection.value,n.id]}}
async function openNode(n,event){if(busy.value)return;if(n.node_type==='folder'){path.value.push({id:n.id,name:n.name});clearSelection();query.value=submitted.value='';details.value=null;++detailSerial;commitNavigation();load()}else await inspect(n,event?.currentTarget)}
async function inspect(n,owner){if(busy.value)return;pathStatus.value=manualPath.value='';trigger=owner;const serial=++detailSerial;details.value={...n,loading:true};commitNavigation();try{const data=await api('/nodes/'+n.id);if(serial===detailSerial&&details.value)details.value=data}catch(e){if(serial===detailSerial&&details.value)details.value={...n,error:e.message}}await nextTick();if(serial===detailSerial&&details.value)document.getElementById('close-detail')?.focus()}
function closeDetails(){details.value=null;pathStatus.value=manualPath.value='';++detailSerial;commitNavigation();nextTick(()=>{if(trigger?.isConnected)trigger.focus();else main.value?.focus({preventScroll:true})})}
async function copyVirtualPath(){
 const file=details.value
 if(file?.loading||file?.error||file?.node_type!=='media'||!file.virtual_path)return
 const virtualPath=file.virtual_path
 pathStatus.value='';manualPath.value=''
 try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(virtualPath);if(details.value?.id===file.id)pathStatus.value='Virtual path copied. This path is relative to the displayed bucket; media URLs are not available yet.'}
 catch{if(details.value?.id===file.id){manualPath.value=virtualPath;pathStatus.value='Clipboard unavailable. Select and copy the plugin path below. This is a path within the displayed bucket.'}}
}
function cancelContext(){clearSelection();clipboard.value=[];overlays?.closeMenu();overlays?.hideTip(true);status.value='Selection and copied links cleared.';nextTick(()=>document.getElementById('fab')?.focus())}
function openMenu(id,event){if(busy.value||loading.value)return;overlays?.openMenu(document.getElementById(id),event.currentTarget)}
function fabTask(kind){startTask(kind,document.getElementById('fab'))}
function closeDrawer(){drawer.value=false;nextTick(()=>{if(document.getElementById('drawer')?.contains(document.activeElement))document.getElementById('open-drawer')?.focus()})}
function openDrawer(){drawer.value=true;nextTick(()=>document.getElementById('drawer').querySelector('button,md-icon-button,md-text-button')?.focus())}
function keydown(e){
 if(drawer.value&&!task.value){if(e.key==='Escape'){e.preventDefault();closeDrawer()}if(e.key==='Tab'){const tabs=[...document.getElementById('drawer').querySelectorAll('button,md-icon-button,md-text-button,input')].filter(el=>!el.disabled&&el.getClientRects().length);if(e.shiftKey&&document.activeElement===tabs[0]){e.preventDefault();tabs.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===tabs.at(-1)){e.preventDefault();tabs[0]?.focus()}}}
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
 selectionMenu.value?.close();trigger=owner;overlays?.closeMenu();overlays?.hideTip(true);draft.value='';taskError.value='';chosen.value=null;secret.value='';copyFeedback.value='';expiryError.value='';tokenBounds.value=null;fileError.value='';sourceSelection.value=[];importPlan.value=null;importProgress.value=null;importRequest=kind==='bind'?importIdentity():'';task.value=kind
 if(kind==='manageBucket')draft.value=managedBucket.value.name
 if(kind==='rename')draft.value=selectedNodes.value[0]?.name??''
 if(kind==='paste')draft.value=clipboard.value.length===1?clipboard.value[0].name:''
 if(kind==='folder'||kind==='bind'||kind==='bucket'||kind==='upload'){clearSelection();clipboard.value=[]}
 destination.value=parent.value;await nextTick();taskDialog.value.showModal()
 if(kind==='bind'||kind==='rebind')browseFiles()
 if(kind==='move'){
  busy.value=true
  try{
   await folderChoices();await nextTick()
   const field=document.getElementById('move-destination')
   await field.updateComplete;await Promise.all(field.options.map(option=>option.updateComplete))
   // Async option insertion can select before headline slots are ready.
   field.select(destination.value)
  }catch(e){taskError.value=e.message}finally{busy.value=false}
 }
 if(kind==='token'){
  tokenScopes.value=['media:read'];tokenFolder.value=parent.value;tokenExpiry.value='';busy.value=true
  try{const data=await api('/tokens?limit=1');tokenBounds.value=expiryBounds(data.policy);tokenClockOffset=data.policy.server_time-Date.now()/1000;tokenClock.value=data.policy.server_time;tokenExpiry.value=localMinute(tokenBounds.value.suggested)}
  catch(e){taskError.value=e.message}
  finally{busy.value=false}
 }
}
async function editBucket(b,event){if(busy.value||loading.value)return;managedBucket.value=b;await startTask('manageBucket',event.currentTarget)}
function confirmBucket(kind){if(busy.value||(kind==='removeBucket'&&managedBucket.value.is_default))return;taskError.value='';task.value=kind;nextTick(()=>taskDialog.value.querySelector('.dialog-actions md-text-button')?.focus())}
function bucketCancel(event){if(task.value==='bind'&&busy.value){event?.preventDefault();importAbort?.abort();return}if(task.value==='bind'&&importPlan.value?.created.size){status.value=importPlan.value.created.size+' reference(s) saved before closing. Original files are unchanged.';load()}if(task.value==='upload'&&busy.value){event?.preventDefault();uploadPanel.value?.stop();return}if(busy.value){event?.preventDefault();return}if(['removeBucket','clearBucket'].includes(task.value)){event?.preventDefault();task.value='manageBucket';taskError.value='';nextTick(()=>document.getElementById('bucket-edit-name')?.focus());return}if(!event)taskDialog.value.close()}
function closeTask(){bucketCancel()}
function selectOpening(event){
 selectionMenu.value?.close();overlays?.closeMenu();overlays?.hideTip(true)
 // Material Web 2.5.0 composes a public md-menu inside the select shadow root.
 // Its default focus restore scrolls sticky fields back to their flow position.
 const menu=event.currentTarget.shadowRoot?.querySelector('md-menu')
 if(menu)menu.skipRestoreFocus=true
}
function selectClosing(event){
 const field=event.currentTarget,active=document.activeElement
 if(field===active||field.contains(active)||active===document.body)field.focus({preventScroll:true})
}
function selectEscape(event){
 // Consume the option menu Escape, but let a closed field dismiss its parent.
 if(event.defaultPrevented||event.composedPath().some(el=>el.localName==='md-select-option')){event.preventDefault();event.stopPropagation()}
}
function taskEscape(event){event.preventDefault();event.stopPropagation();bucketCancel()}
function taskClosed(){fileAbort?.abort();sourceSelection.value=[];importPlan.value=null;importProgress.value=null;task.value=null;secret.value='';copyFeedback.value='';nextTick(()=>{if(trigger?.isConnected&&trigger.getClientRects().length)trigger.focus();else if(bucketFocusId.value){const target=document.getElementById('bucket-'+bucketFocusId.value);if(target?.getClientRects().length)target.focus();else if(drawer.value)document.querySelector('#drawer .filter input')?.focus();else document.getElementById('open-drawer')?.focus();bucketFocusId.value=null}else document.getElementById('fab')?.focus()})}
async function uploadDone(node){busy.value=false;clearSelection();uploadedNode.value=node;taskDialog.value.close();await load()}
function dismissUploadNotice(){uploadedNode.value=null;nextTick(()=>main.value?.focus({preventScroll:true}))}
async function submit(){
 if(task.value==='upload')return
 if(busy.value)return;const kind=task.value;taskError.value=''
 if(kind==='bind'){await importSources();return}
 if(kind==='token'){
  expiryError.value=''
  const expires=Math.floor(new Date(tokenExpiry.value).getTime()/1000)
  if(!tokenBounds.value){taskError.value='Token lifetime policy is unavailable. Close this dialog and retry.';return}
  if(!Number.isFinite(expires)||expires<=Date.now()/1000+tokenClockOffset||expires<tokenBounds.value.min||expires>tokenBounds.value.max){expiryError.value=expiryHelp.value;await nextTick();document.getElementById('token-expiry')?.focus();return}
  if(!draft.value.trim()||draft.value.trim()!==draft.value||new TextEncoder().encode(draft.value).length>100||/[\x00-\x1f\x7f]/.test(draft.value)){taskError.value='Use a token name of 1–100 UTF-8 bytes without outer spaces or control characters.';return}
  if(!tokenScopes.value.length){taskError.value='Choose at least one permission.';return}
 }
 if(['folder','bucket','rename','bind','manageBucket'].includes(kind)&&!validName(draft.value)){taskError.value='Use a name up to 255 UTF-8 bytes, without slashes, control characters or outer spaces.';return}
 if((kind==='bind'||kind==='rebind')&&!chosen.value){taskError.value='Choose an existing supported image or video.';return}
 busy.value=true;let completed=0
 try{
  if(kind==='bucket'){const b=await api('/buckets','POST',{name:draft.value});buckets.value.push(b);bucket.value=b;path.value=[];submitted.value=query.value='';closeDrawer()}
  if(kind==='manageBucket'){
   const updated=await api('/buckets/'+managedBucket.value.id,'PATCH',{name:draft.value})
   buckets.value=buckets.value.map(b=>b.id===updated.id?updated:b);if(bucket.value?.id===updated.id)bucket.value=updated
   if(!updated.name.toLocaleLowerCase().includes(bucketFilter.value.toLocaleLowerCase()))bucketFilter.value=''
   status.value='Bucket name saved.';busy.value=false;taskDialog.value.close();return
  }
  if(kind==='removeBucket'||kind==='clearBucket'){
   const target=managedBucket.value,clearing=kind==='clearBucket'
   await api('/buckets/'+target.id+(clearing?'/clear':''),clearing?'POST':'DELETE')
   if(!clearing)buckets.value=buckets.value.filter(b=>b.id!==target.id)
   clipboard.value=[]
   if(bucket.value?.id===target.id){if(!clearing)bucket.value=buckets.value.find(b=>b.is_default);path.value=[];clearSelection();details.value=null;++detailSerial;query.value=submitted.value=bucketFilter.value='';page.value='objects';closeDrawer()}
   bucketFocusId.value=bucket.value?.id;status.value=clearing?'Bucket contents cleared. Original Nextcloud files are unchanged.':'Bucket removed. Original Nextcloud files are unchanged.'
   if(page.value==='objects')await load();commitNavigation('replace');busy.value=false;taskDialog.value.close();return
  }
  if(kind==='folder')await api('/folders','POST',{name:draft.value,parent_id:parent.value})
  if(kind==='bind')await api('/bindings','POST',{name:draft.value,file_id:chosen.value.id,parent_id:parent.value})
  if(kind==='rebind'){await api('/bindings/'+details.value.id,'PATCH',{file_id:chosen.value.id});details.value=await api('/nodes/'+details.value.id)}
  if(kind==='rename')await api('/nodes/'+selection.value[0],'PATCH',{name:draft.value})
  if(kind==='move'||kind==='remove')for(const id of [...selection.value]){await api('/nodes/'+id,kind==='move'?'PATCH':'DELETE',kind==='move'?{parent_id:destination.value}:undefined);completed++;selection.value=selection.value.filter(x=>x!==id)}
  if(kind==='paste')for(const node of clipboard.value){await api('/nodes/'+node.id+'/copy','POST',{parent_id:parent.value,...(clipboard.value.length===1?{name:draft.value}:{} )});completed++}
  if(kind==='token'){const data=await api('/tokens','POST',{name:draft.value,scopes:tokenScopes.value,expires_at:Math.floor(new Date(tokenExpiry.value).getTime()/1000),folder_id:tokenFolder.value||null});secret.value=data.secret;task.value='secret';await loadTokens();return}
  clearSelection();status.value='Saved. Original Nextcloud files are unchanged.';commitNavigation();taskDialog.value.close();await load()
 }catch(e){taskError.value=(completed?completed+' item(s) saved before this error. ':'')+e.message;if(completed)await load()}
 finally{busy.value=false}
}
async function action(id,event){
 if(disabled(id))return
 overlays?.closeMenu();overlays?.hideTip(true)
 selectionMenu.value?.close()
 if(id!=='paste'&&!await prepareSelection())return
 if(id==='copy'){clipboard.value=selectedNodes.value.map(n=>({id:n.id,name:n.name}));status.value=clipboard.value.length+' reference(s) copied. Open a destination folder to paste.';return}
 await startTask(id,event?.currentTarget)
}
async function loadTokens(){
 tokenAbort?.abort();const controller=new AbortController();tokenAbort=controller;tokenLoading.value=true;error.value=''
 try{const rows=[];let offset=0;while(true){const data=await api('/tokens?limit=100&offset='+offset,'GET',undefined,controller.signal);if(controller.signal.aborted||!live)return;rows.push(...data.tokens);if(data.policy){tokenClockOffset=data.policy.server_time-Date.now()/1000;tokenClock.value=data.policy.server_time}if(data.tokens.length<100)break;offset+=100}tokens.value=rows}
 catch(e){if(!controller.signal.aborted&&live)error.value=e.message}
 finally{if(tokenAbort===controller)tokenLoading.value=false}
}
function showPage(value){if(busy.value)return;clearSelection();listAbort?.abort();tokenAbort?.abort();loading.value=false;error.value='';page.value=value;details.value=null;++detailSerial;closeDrawer();commitNavigation();if(value==='tokens')loadTokens();else load()}
async function tokenAction(t,kind,event){
 if(busy.value)return
 if(kind==='rotate'){await startTask('rotate',event.currentTarget);task.value='rotate';destination.value=t.id;return}
 await startTask('revoke',event.currentTarget);destination.value=t.id
}
async function tokenConfirm(){busy.value=true;taskError.value='';try{const data=await api('/tokens/'+destination.value+(task.value==='rotate'?'/rotate':''),task.value==='rotate'?'POST':'DELETE');if(data?.secret){secret.value=data.secret;task.value='secret'}else taskDialog.value.close();await loadTokens()}catch(e){taskError.value=e.message}finally{busy.value=false}}
const titles={upload:'Upload media',manageBucket:'Edit bucket',clearBucket:'Clear bucket contents',removeBucket:'Remove bucket',folder:'New folder',bind:'Add from Nextcloud',rebind:'Rebind reference',bucket:'New bucket',rename:'Rename reference',move:'Move references',remove:'Remove links',paste:'Paste references',token:'Create API token',secret:'Save your API token',rotate:'Rotate API token',revoke:'Revoke API token'}
watch(busy,value=>{if(!value&&pendingNavigation){pendingNavigation=false;restoreLocation()}else if(!value)nextTick(checkObjectEnd)})
watch(sort,()=>{if(!restoring){commitNavigation();load()}})
watch(tokenFolder,()=>{if(tokenFolder.value)tokenScopes.value=tokenScopes.value.filter(s=>s!=='token:manage')})
watch([showContext,showFab,details,page,drawer,selection,selectionCount,clipboard,busy],()=>nextTick(layout),{deep:false})
onMounted(async()=>{
 tokenClockTimer=setInterval(()=>{tokenClock.value=Date.now()/1000+tokenClockOffset},30000)
 overlays=new DesignOverlays(root.value);observer=new ResizeObserver(()=>{layout();checkObjectEnd()});observer.observe(root.value);observer.observe(main.value);observer.observe(document.getElementById('library-footer'));observer.observe(document.getElementById('fab'))
 addEventListener('resize',()=>{selectionMenu.value?.close();layout()},{signal:abortEvents.signal});document.addEventListener('keydown',keydown,{signal:abortEvents.signal});document.fonts?.ready.then(layout)
 addEventListener('popstate',historyNavigation,{signal:abortEvents.signal});addEventListener('hashchange',historyNavigation,{signal:abortEvents.signal});document.getElementById('main-scroll').addEventListener('scroll',()=>{rememberScroll();checkObjectEnd()},{passive:true,signal:abortEvents.signal})
 await initialize();layout()
})
onBeforeUnmount(()=>{importAbort?.abort();clearInterval(tokenClockTimer);clearTimeout(navigationTimer);live=false;selectionAbort?.abort();selectionMenu.value?.close();routeAbort?.abort();tokenAbort?.abort();listAbort?.abort();fileAbort?.abort();observer?.disconnect();abortEvents.abort();overlays?.closeMenu();overlays?.hideTip()})
</script>
<template>
<div id="media-design" ref="root">
<div class="app" :class="{'with-detail':details}">
<aside id="drawer" class="drawer" aria-label="Media Storage navigation" :class="{'open':drawer}" :role="drawer?'dialog':undefined" :aria-modal="drawer?'true':undefined" :inert="task || undefined">
<div class="brand"><span class="brand-icon" aria-hidden="true">M</span><strong>Media Storage</strong><md-icon-button class="icon close-drawer" aria-label="Close navigation" @click="closeDrawer" type="button"><Icon name="close" /></md-icon-button></div>
<p class="section-label">WORKSPACE</p><nav aria-label="Plugin pages"><button class="destination" :class="{active:page==='objects'}" :aria-current="page==='objects'?'page':undefined" @click="showPage('objects')"><md-ripple :disabled="busy || loading" /><Icon name="grid_view" />Objects</button><button class="destination" :class="{active:page==='tokens'}" :aria-current="page==='tokens'?'page':undefined" @click="showPage('tokens')"><md-ripple :disabled="busy || loading" /><Icon name="key" />API tokens</button></nav>
<div class="bucket-title"><h2>Buckets</h2><md-text-button id="add-bucket" class="text" aria-label="Add bucket" data-tip="Create a virtual bucket" :disabled="busy || loading" @click="startTask('bucket',$event.currentTarget)" type="button"><Icon slot="icon" name="add" />Add</md-text-button></div>
<label class="filter"><span class="sr-only">Filter buckets</span><input v-model="bucketFilter" type="search" placeholder="Filter buckets"></label>
<nav aria-label="Buckets"><div v-for="b in filteredBuckets" :key="b.id" class="bucket-entry" :class="{active:b.id===bucket?.id}"><button :id="'bucket-'+b.id" class="destination" :aria-current="b.id===bucket?.id?'page':undefined" :disabled="busy" @click="switchBucket(b)"><md-ripple :disabled="busy || loading" /><span class="bucket-name">{{b.name}}</span></button><md-icon-button :id="'edit-bucket-'+b.id" class="edit-bucket" :aria-label="'Edit bucket '+b.name" :data-tip="'Edit bucket '+b.name" :disabled="busy || loading" type="button" @click="editBucket(b,$event)"><Icon name="edit" /></md-icon-button></div></nav><p v-if="!filteredBuckets.length && !loading">No matching buckets</p>
<div class="drawer-footer">v{{version}}</div></aside>
<button id="scrim" class="scrim" aria-label="Close navigation" :hidden="!drawer" @click="closeDrawer"></button>
<main id="main" ref="main" tabindex="-1" :inert="drawer || undefined" :class="{'has-toolbar':showContext,'has-fab':showFab}">
<UploadNotice v-if="uploadedNode" :key="uploadedNode.id" :node="uploadedNode" @dismiss="dismissUploadNotice" />
<header class="library-navbar"><md-icon-button id="open-drawer" class="icon" aria-label="Open navigation" :aria-expanded="drawer" aria-controls="drawer" @click="openDrawer" type="button"><Icon name="menu" /></md-icon-button><h1>{{page==='tokens'?'API tokens':bucket?.name??'Media Storage'}}</h1>
<form id="search-form" v-show="page==='objects'" role="search" aria-label="Current folder" @submit.prevent="search"><label class="search"><Icon name="search" /><span class="sr-only">Search this folder by name</span><input v-model="query" type="search" placeholder="Search this folder by name"><md-icon-button class="icon" aria-label="Search" :disabled="busy" type="submit"><Icon name="arrow_forward" /></md-icon-button></label></form></header>
<div id="main-scroll" class="main-scroll">
<section v-show="page==='objects'" id="explorer">
<nav v-if="path.length" id="path-row" class="path-row" aria-label="Folder path"><md-text-button class="text" @click="navigate(-1)" type="button">{{bucket?.name}}</md-text-button><template v-for="(p,i) in path" :key="p.id"><span aria-hidden="true">/</span><md-text-button class="text" :aria-current="i===path.length-1?'page':undefined" @click="navigate(i)" type="button">{{p.name}}</md-text-button></template></nav>
<div class="object-headers">
<div class="collection-heading"><div class="collection-summary"><h2>Objects</h2><span id="count" role="status">{{nodes.length}} of {{pageTotal}} objects</span><strong v-if="selectionCount" id="selected-count">{{selectionCount}} selected</strong><span v-if="clipboard.length" id="clipboard-count">{{clipboard.length}} copied</span></div><div class="sort"><span id="object-sort-label">Sort by</span><md-outlined-select v-select-label id="object-sort" aria-labelledby="object-sort-label" :value.prop="sort" :disabled="busy" menu-positioning="popover" @opening="selectOpening" @closing="selectClosing" @keydown.esc="selectEscape" @change="sort=$event.target.value"><md-select-option value="name" :selected="sort==='name'"><span slot="headline">Name</span></md-select-option><md-select-option value="type" :selected="sort==='type'"><span slot="headline">Type</span></md-select-option></md-outlined-select></div></div>
<div class="column-head">
<label class="select-all check"><input id="select-all" type="checkbox" :checked="selectChecked" :indeterminate="selectMixed" :disabled="busy || loading || appendLoading || pageChanged || !!error || !nodes.length" @change="selectAll"><span class="sr-only">Select all: {{selectionMode==='all'?'All matching objects':'Loaded objects'}}</span></label>
<div class="name-heading"><md-icon-button id="selection-scope" :aria-label="'Choose select-all scope: '+(selectionMode==='all'?'All matching objects':'Loaded objects')" aria-haspopup="listbox" :aria-expanded="selectionMenuOpen" :disabled="busy || loading || appendLoading || pageChanged || !!error" :data-tip="'Select-all scope: '+(selectionMode==='all'?'All matching objects':'Loaded objects')" @click="showSelectionMenu"><Icon name="expand_more" /></md-icon-button>
<span aria-hidden="true">Name</span></div><span class="type" aria-hidden="true">Type</span><span class="binding" aria-hidden="true">Binding</span><span aria-hidden="true"></span></div>
</div>
<md-menu ref="selectionMenu" id="selection-menu" role="listbox" aria-label="Selection scope" positioning="popover" anchor-corner="end-start" menu-corner="start-start" no-horizontal-flip skip-restore-focus @closing="selectionMenuClosing" @opened="selectionMenuOpen=true" @closed="selectionMenuOpen=false">
<md-menu-item v-for="mode in ['loaded','all']" :key="mode" type="option" :aria-selected="selectionMode===mode" @close-menu="chooseSelectionScope(mode,$event)"><Icon slot="start" :name="selectionMode===mode?'check':'select_all'" /><span slot="headline">{{mode==='all'?'All matching objects':'Loaded objects'}}</span><span slot="supporting-text">{{mode==='all'?'Include objects not yet loaded':'Only objects currently loaded'}}</span></md-menu-item>
</md-menu>
<div v-if="selectionProgress" class="selection-progress" role="status"><md-linear-progress :value="selectionProgress.total?selectionProgress.done/selectionProgress.total:0" />Preparing selection {{selectionProgress.done}} / {{selectionProgress.total}}…</div>
<div v-if="selectionError" class="selection-error error" role="alert">{{selectionError}} <md-text-button v-if="pageChanged" :disabled="busy" @click="reloadObjects">Reload objects</md-text-button></div>
<div v-if="loading && !nodes.length" class="loading" role="status"><md-circular-progress indeterminate aria-label="Loading objects" />Loading objects…</div>
<div v-if="error" class="error" role="alert">{{error}} <md-text-button @click="initialize">Retry</md-text-button></div>

<ul id="objects" class="objects" aria-label="Objects in current folder" :aria-busy="loading || appendLoading">
<li v-for="n in sorted" :key="n.id" class="object"><label class="check"><input type="checkbox" :aria-label="'Select '+n.name" :checked="isSelected(n)" :disabled="busy" @change="toggle(n)"></label><button :id="'open-node-'+n.id" class="object-name" :disabled="busy" @click="openNode(n,$event)"><span class="file-icon"><MediaPreview v-if="n.node_type==='media'" :node="n" /><Icon v-else :name="iconFor(n)" /></span><span class="name-copy">{{n.name}}<span class="mobile-meta">{{typeLabel(n)}}<template v-if="n.node_type==='media'"> · {{bindingLabel(n)}}</template></span></span></button><md-ripple class="row-ripple" :for="'open-node-'+n.id" :disabled="busy" /><span class="type">{{typeLabel(n)}}</span><span class="binding" :class="{broken:n.binding_status==='needs_rebind'}">{{bindingLabel(n)}}</span><md-icon-button class="icon" :aria-label="'Details for '+n.name" data-tip="Inspect this virtual reference" :disabled="busy" @click="inspect(n,$event.currentTarget)" type="button"><Icon name="info" /></md-icon-button></li>
</ul>
<div id="object-page-end" class="object-page-end">
<div v-if="appendLoading" role="status"><md-linear-progress indeterminate aria-label="Loading more objects" />Loading more objects…</div>
<div v-else-if="appendError" class="error" role="alert">{{appendError}} <md-text-button  :disabled="busy" @click="pageChanged?reloadObjects():loadMore()">{{pageChanged?'Reload objects':'Retry loading more'}}</md-text-button></div>
<md-text-button v-else-if="pageMore && !loading && !error && !pageChanged" :disabled="busy" @click="loadMore">Load more objects</md-text-button>
</div>
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
<md-outlined-select v-select-label id="token-filter" label="Status" :value.prop="tokenFilter" menu-positioning="popover" @opening="selectOpening" @closing="selectClosing" @keydown.esc="selectEscape" @change="tokenFilter=$event.target.value"><md-select-option value="all" :selected="tokenFilter==='all'"><span slot="headline">All tokens</span></md-select-option><md-select-option v-for="group in tokenGroups" :key="group.id" :value="group.id" :selected="tokenFilter===group.id"><span slot="headline">{{group.label}}</span></md-select-option></md-outlined-select>
<md-outlined-select v-select-label id="token-sort" label="Sort by" :value.prop="tokenSort" menu-positioning="popover" @opening="selectOpening" @closing="selectClosing" @keydown.esc="selectEscape" @change="tokenSort=$event.target.value"><md-select-option value="expiry" :selected="tokenSort==='expiry'"><span slot="headline">Expiration date</span></md-select-option><md-select-option value="name" :selected="tokenSort==='name'"><span slot="headline">Name</span></md-select-option></md-outlined-select>
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
<aside v-if="details" id="details" class="details" aria-labelledby="detail-name" :inert="drawer || undefined"><div class="detail-top"><span class="eyebrow">OBJECT DETAILS</span><md-icon-button id="close-detail" class="icon" aria-label="Close object details" @click="closeDetails" type="button"><Icon name="close" /></md-icon-button></div><div class="detail-symbol" :class="{'has-preview':details.node_type==='media'}"><MediaPreview v-if="details.node_type==='media' && !details.loading" :key="details.id" :node="details" large /><Icon v-else :name="iconFor(details)" /></div><h2 id="detail-name">{{details.name}}</h2><p v-if="details.loading" role="status">Loading details…</p><p v-if="details.error" class="error" role="alert">{{details.error}}</p><dl v-else class="detail-facts"><div v-for="field in detailFields" :key="field.label" class="detail-fact" :class="{compact:!field.path}"><dt><Icon :name="field.icon" /><span>{{field.label}}</span></dt><dd>{{field.value}}</dd></div></dl><div class="detail-actions"><md-text-button v-if="details.node_type==='media' && !details.loading && !details.error" :disabled="busy" @click="startTask('rebind',$event.currentTarget)"><Icon slot="icon" name="edit" />Rebind to another file</md-text-button><md-text-button v-if="details.node_type==='media' && !!details.virtual_path && !details.loading && !details.error" id="copy-virtual-path" :disabled="busy" @click="copyVirtualPath"><Icon slot="icon" name="content_copy" />Copy virtual path</md-text-button></div><p v-if="pathStatus" class="link-status" role="status">{{pathStatus}}</p><label v-if="manualPath" class="detail-link">Plugin virtual path<input id="manual-virtual-path" type="text" :value="manualPath" readonly @focus="$event.target.select()"></label></aside>
</div>
<div id="fab-area" class="fab-area" :hidden="!showFab" :style="fabStyle"><md-fab id="fab" class="fab" aria-label="Add" aria-haspopup="menu" aria-expanded="false" aria-controls="fab-menu" data-tip="Upload media, add a link or create a virtual folder" :aria-disabled="loading || busy" :inert="loading || busy || undefined" @click="openMenu('fab-menu',$event)" :label="fabLabel" variant="secondary"><Icon slot="icon" name="add" /></md-fab></div>
<div id="fab-menu" class="action-menu" role="menu" aria-label="Add to this folder" hidden><button role="menuitem" tabindex="-1" data-tip="Upload an image or video from your device" @click="fabTask('upload')"><md-ripple :disabled="busy || loading" /><Icon name="add" />Upload media</button><button role="menuitem" tabindex="-1" data-tip="Reference an existing Nextcloud file" @click="fabTask('bind')"><md-ripple :disabled="busy || loading" /><Icon name="add" />Add from Nextcloud</button><button role="menuitem" tabindex="-1" data-tip="Create a virtual folder" @click="fabTask('folder')"><md-ripple :disabled="busy || loading" /><Icon name="folder" />New folder</button></div>
<div id="toolbar-menu" class="action-menu" role="menu" aria-label="More virtual reference actions" hidden><button v-for="a in overflow" :key="a.id" role="menuitem" tabindex="-1" :aria-disabled="disabled(a.id)" :data-tip="a.tip" :class="{danger:a.id==='remove'}" @click="action(a.id,$event)"><md-ripple :disabled="disabled(a.id)" /><Icon :name="a.icon" />{{a.label}}</button></div>
<dialog id="task" ref="taskDialog" :class="{'upload-task':task==='upload'}" :aria-label="titles[task]" @close="taskClosed" @cancel="bucketCancel($event)" @keydown.esc="taskEscape"><form @submit.prevent="task==='rotate'||task==='revoke'?tokenConfirm():submit()">
<h2>{{titles[task]}}</h2>
<UploadPanel v-if="task==='upload'" ref="uploadPanel" :parent="destination" @busy="busy=$event" @done="uploadDone" @close="closeTask" /><template v-if="task==='manageBucket'"><md-outlined-text-field id="bucket-edit-name" label="Bucket name" required :value="draft" :disabled="busy" supporting-text="Required. Up to 255 UTF-8 bytes." @input="draft=$event.target.value" /><div class="bucket-management"><h3>Manage contents</h3><p>These actions affect virtual folders and links only. Original Nextcloud files stay in place.</p><md-text-button id="bucket-clear" type="button" :disabled="busy" @click="confirmBucket('clearBucket')"><Icon slot="icon" name="folder_open" />Clear contents</md-text-button><md-text-button id="bucket-delete" type="button" :disabled="busy || managedBucket?.is_default" @click="confirmBucket('removeBucket')"><Icon slot="icon" name="delete" />Delete bucket</md-text-button><p v-if="managedBucket?.is_default" id="default-bucket-help">The default bucket can be renamed or cleared, but cannot be deleted.</p></div></template>
<p v-if="task==='clearBucket'">Clear all virtual folders and links inside “{{managedBucket?.name}}”? The bucket is kept. Original Nextcloud files and links in other buckets are kept.</p><p v-if="task==='removeBucket'">Remove bucket “{{managedBucket?.name}}” and all virtual folders and links inside it? Original Nextcloud files and links in other buckets are kept.</p><p v-if="task==='remove'">Remove {{selectionCount}} selected reference(s), including virtual children? Original Nextcloud files and other links are kept.</p><p v-if="task==='move'">Choose a virtual destination. Original files stay in Nextcloud.</p><p v-if="task==='paste'">Create independent links to the same originals.</p><p v-if="task==='revoke'">This token will stop authorizing integrations immediately.</p><p v-if="task==='rotate'">A new secret will be issued. The old token remains active until you revoke it.</p>
<template v-if="task==='bind'||task==='rebind'"><p>{{task==='bind'?'Choose images, videos or folders. Add virtual references without moving originals.':'Choose an existing image or video. Update this reference without moving the original.'}}</p><nav class="picker-navigation" aria-label="Nextcloud folders"><md-icon-button id="picker-back" type="button" aria-label="Up one folder" data-tip="Up one folder" :disabled="!filePath || fileLoading || busy || !!importPlan" @click="browseFiles(filePath.split('/').slice(0,-1).join('/'),true)"><Icon name="arrow_back" class="directional" /></md-icon-button><md-icon-button id="picker-home" type="button" aria-label="Go to root folder" data-tip="Go to root folder" :disabled="!filePath || fileLoading || busy || !!importPlan" @click="browseFiles('',true)"><Icon name="home" /></md-icon-button><md-icon-button v-if="task==='bind'" id="picker-select-all" type="button" :aria-label="pickerAll?'Deselect this folder':'Select this folder'" :aria-pressed="pickerAll" data-tip="Select all eligible items in this folder" :disabled="fileLoading || busy || !!importPlan || !pickerEligible.length" @click="pickerSelectAll"><Icon :name="pickerAll?'check':'select_all'" /></md-icon-button><span id="picker-location" class="picker-location" tabindex="-1" role="status" :title="filePath?'/'+filePath:undefined" :aria-label="filePath?'Current Nextcloud folder: /'+filePath:'Nextcloud files (root)'">{{filePath.split('/').at(-1) || 'Nextcloud files'}}</span></nav><md-linear-progress v-if="fileLoading" indeterminate aria-label="Loading Nextcloud files" /><p v-if="fileError" class="error" role="alert">{{fileError}} <md-text-button type="button" class="text" @click="browseFiles(filePath)">Retry</md-text-button></p><ul class="file-picker"><li v-for="f in files" :key="f.path" :class="{'picker-multi-row':task==='bind'}"><label v-if="task==='bind'" class="check"><input type="checkbox" :aria-label="'Select source '+f.name" :checked="pickerSelected(f)" :disabled="busy || !!importPlan || !eligibleSource(f)" @change="toggleSource(f)"></label><button type="button" :disabled="busy || !!importPlan || (!f.folder && (!mediaType(f.mime)||!f.id))" :class="{chosen:task==='bind'?pickerSelected(f):chosen?.id===f.id && !f.folder}" :aria-pressed="!f.folder?(task==='bind'?pickerSelected(f):chosen?.id===f.id):undefined" @click="f.folder?browseFiles(f.path,true):task==='bind'?toggleSource(f):(chosen=f,draft=f.name)"><md-ripple :disabled="busy || !!importPlan || (!f.folder && (!mediaType(f.mime)||!f.id))" /><Icon :name="f.folder?'folder':'image'" />{{f.name}}</button></li></ul><p v-if="task==='bind'" id="picker-count" role="status">{{sourceSelection.length}} selected<template v-if="pickerSingle"> · Selected: {{chosen?.name}}</template></p><p v-else-if="chosen">Selected: {{chosen.name}}</p><p v-if="task==='bind' && sourceSelection.some(s=>s.folder)" class="field-help">Folders keep their structure. Unsupported files are skipped.</p><div v-if="importProgress" id="import-progress" role="status"><md-linear-progress :indeterminate="importProgress.total===null" :value="importProgress.total?importProgress.done/importProgress.total:0" :aria-label="importProgress.stage+' references'" /><p>{{importProgress.stage}} {{importProgress.done}}<template v-if="importProgress.total!==null"> of {{importProgress.total}}</template> references…</p></div><p v-if="importPlan?.skipped.length" class="field-help">{{importPlan.skipped.length}} unsupported item(s) skipped.</p></template>
<label v-if="['folder','bucket','rename','bind','paste','token'].includes(task) && !(task==='paste'&&clipboard.length>1) && (task!=='bind'||pickerSingle)" class="task-field">{{task==='token'?'Token name':'Name'}} (required)<input v-model="draft" required :disabled="busy || (task==='bind'&&!!importPlan)" autocomplete="off" :maxlength="task==='token'?100:255"></label>
<md-outlined-select v-select-label v-if="task==='move'" id="move-destination" class="task-field" label="Destination folder" :value.prop="destination" :disabled="busy" menu-positioning="popover" @opening="selectOpening" @closing="selectClosing" @keydown.esc="selectEscape" @change="destination=$event.target.value"><md-select-option v-for="d in destinations" :key="d.id" :value="d.id" :selected="destination===d.id"><span slot="headline">{{d.label}}</span></md-select-option></md-outlined-select>
<template v-if="task==='token'"><label class="task-field">Expires (required)<input id="token-expiry" v-model="tokenExpiry" type="datetime-local" required :disabled="busy || !tokenBounds" :min="tokenBounds?localMinute(tokenBounds.min):undefined" :max="tokenBounds?localMinute(tokenBounds.max):undefined" step="60" aria-describedby="token-expiry-help" :aria-invalid="!!expiryError" @input="expiryError=''"><span id="token-expiry-help" class="field-help" :class="{error:expiryError}" :role="expiryError?'alert':undefined">{{expiryError || expiryHelp}}</span></label><md-outlined-select v-select-label id="token-boundary" class="task-field" label="Access boundary" :value.prop="tokenFolder" :disabled="busy" menu-positioning="popover" @opening="selectOpening" @closing="selectClosing" @keydown.esc="selectEscape" @change="tokenFolder=$event.target.value"><md-select-option value="" :selected="!tokenFolder"><span slot="headline">All my buckets and folders</span></md-select-option><md-select-option v-for="b in buckets" :key="b.id" :value="b.id" :selected="tokenFolder===b.id"><span slot="headline">{{b.name}}</span></md-select-option><md-select-option v-if="path.length" :value="parent" :selected="tokenFolder===parent"><span slot="headline">Current folder only</span></md-select-option></md-outlined-select><fieldset class="scope-options"><legend>Permissions (choose at least one)</legend><label v-for="scope in ['media:read','media:manage','media:delete','token:manage']" :key="scope"><input v-model="tokenScopes" type="checkbox" :value="scope" :disabled="busy || (scope==='token:manage' && !!tokenFolder)">{{scope}}</label></fieldset></template>
<template v-if="task==='secret'"><p>Copy this secret now. It will not be shown again after closing.</p><code class="secret" tabindex="0" aria-label="API token secret">{{secret}}</code><p v-if="copyFeedback" id="token-copy-feedback" class="field-help" role="status">{{copyFeedback}}</p></template>
<p v-if="taskError" class="error" role="alert">{{taskError}}</p><div v-if="task!=='upload'" class="dialog-actions" :class="{'secret-actions':task==='secret'}"><md-text-button type="button" :disabled="busy && task!=='bind'" @click="closeTask">{{task==='bind'&&busy?'Stop':task==='bind'&&importPlan?'Close':task==='secret'?'Done':'Cancel'}}</md-text-button><md-filled-button v-if="task==='secret'" id="copy-token-secret" type="button" :disabled="copying || busy" @click="copyTokenSecret"><Icon slot="icon" name="content_copy" />{{copying?'Copying…':'Copy token'}}</md-filled-button><md-filled-button v-if="task!=='secret'" type="button" :disabled="busy || (task==='token'&&!tokenBounds) || (task==='move'&&!destinations.length) || (task==='bind'&&(!sourceSelection.length||fileLoading))" @click="task==='rotate'||task==='revoke'?tokenConfirm():submit()">{{task==='bind'?(busy?'Adding…':importPlan?'Retry import':'Add selected'):busy?'Saving…':task==='manageBucket'?'Save changes':task==='clearBucket'?'Clear contents':task==='removeBucket'?'Remove bucket':task==='remove'?'Remove links':task==='revoke'?'Revoke':task==='rotate'?'Rotate':'Save'}}</md-filled-button></div>
</form></dialog><div id="action-tooltip" class="action-tooltip" role="tooltip" hidden></div>
</div>
</template>
