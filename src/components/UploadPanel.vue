<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script setup>
import {ref,computed,onMounted,onBeforeUnmount} from 'vue'
import {api,uploadFile} from '../api.js'
import {validName} from '../rules.js'
import Icon from './MaterialIcon.vue'
const props=defineProps({parent:{type:String,required:true}})
const emit=defineEmits(['busy','done','close'])
const policy=ref(null),file=ref(null),name=ref(''),error=ref(''),message=ref(''),active=ref(false),progress=ref(null),attempted=ref(false),checking=ref(false)
const fileInput=ref()
const id=[...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('')
let controller,alive=true
const limit=computed(()=>policy.value?new Intl.NumberFormat(undefined,{maximumFractionDigits:1}).format(policy.value.max_bytes/1048576)+' MiB':'…')
async function loadPolicy(){error.value='';try{const value=await api('/uploads/policy');if(!Number.isFinite(value?.max_bytes)||!Array.isArray(value.mime_types))throw new Error('Upload policy unavailable. Retry before choosing a file.');if(alive)policy.value=value}catch(e){if(alive)error.value=e.message}}
function choose(event){file.value=event.target.files?.[0]??null;name.value=file.value?.name??'';error.value='';message.value=''}
function stop(){controller?.abort()}
defineExpose({stop})
async function send(){
 if(active.value)return
 error.value='';message.value=''
 if(!file.value||!policy.value){error.value='Choose a file and wait for the upload policy.';return}
 if(!validName(name.value)){error.value='Use a display name up to 255 UTF-8 bytes without slashes or outer spaces.';return}
 if(file.value.size<1||file.value.size>policy.value.max_bytes){error.value='Choose a non-empty file no larger than '+limit.value+'.';return}
 if(file.value.type&&!policy.value.mime_types.includes(file.value.type)){error.value='Choose a supported image or video.';return}
 active.value=true;attempted.value=true;emit('busy',true);progress.value=0;controller=new AbortController()
 try{
  const result=await uploadFile(file.value,name.value,props.parent,id,value=>{if(alive)progress.value=value},controller.signal)
  if(alive)emit('done',result.node)
 }catch(e){
  if(!alive)return
  checking.value=true;message.value='Checking upload status…'
  try{
   const result=await api('/uploads/'+id,'GET',undefined,AbortSignal.timeout(15000))
   if(!alive)return
   if(result.state==='complete'){emit('done',result.node);return}
   if(result.state==='removed'){error.value='Upload completed but its reference was removed. Add an existing-file link instead.';return}
   message.value=e.name==='AbortError'?'Transmission stopped. The server may still finish. Retry the same file to reconcile without duplicates.':''
   error.value=e.name==='AbortError'?'':e.message
  }catch{if(alive)error.value='Upload status is unknown. Retry the same file to reconcile without duplicates.'}
 }finally{if(alive){checking.value=false;active.value=false;emit('busy',false)}}
}
onMounted(loadPolicy)
onBeforeUnmount(()=>{alive=false;controller?.abort()})
</script>
<template>
<div class="upload-panel">
<div class="upload-content">
<p>Add an image or video from your device. Originals are stored in your Nextcloud files under <strong class="upload-storage" dir="ltr">Media Storage/YYYY-MM-DD/</strong></p>
<p id="upload-policy" class="field-help">Maximum {{limit}}. JPEG, PNG, GIF, WebP, AVIF, MP4, WebM or Ogg video. Dates use your account timezone, falling back to UTC.</p>
<md-text-button v-if="!policy" type="button" @click="loadPolicy">Retry upload policy</md-text-button>
<div class="upload-choice"><input id="upload-file" ref="fileInput" type="file" hidden :accept="policy?.mime_types.join(',')" :disabled="active || attempted || !policy" aria-label="Choose upload file" @change="choose"><md-outlined-button id="choose-upload" type="button" :disabled="active || attempted || !policy" aria-describedby="upload-policy selected-upload" @click="fileInput.click()"><Icon slot="icon" name="image" />Choose file</md-outlined-button><p id="selected-upload" role="status">{{file?.name || 'No file selected'}}</p></div>
<md-outlined-text-field id="upload-name" label="Display name" required :value="name" :disabled="active || attempted" supporting-text="This names the virtual link; the original gets a unique storage filename." @input="name=$event.target.value" />
<p v-if="file" class="field-help">{{new Intl.NumberFormat().format(file.size)}} bytes · Current virtual folder</p>
<div v-if="active" class="upload-progress"><md-linear-progress :value="progress??0" :indeterminate="progress===null || progress===1 || checking" aria-label="Upload progress" /><p role="status">{{checking?'Checking upload status…':progress===1?'Transfer complete. Saving in Nextcloud…':progress===null?'Uploading…':'Uploading: '+Math.floor(progress*100)+'%'}}</p></div>
<p class="field-help">Stop cancels transmission; it cannot undo an upload already saved. Moving or removing links later keeps originals in Nextcloud.</p><p v-if="attempted && !active" class="field-help">To choose a different file or display name, close and reopen Upload.</p>
<p v-if="message && !active" role="status">{{message}}</p><p v-if="error" class="error" role="alert">{{error}}</p>
</div>
<div class="dialog-actions upload-actions"><md-text-button v-if="active" id="upload-stop" type="button" :disabled="checking" @click="stop">Stop upload</md-text-button><md-text-button v-else type="button" @click="emit('close')">Cancel</md-text-button><md-filled-button id="upload-send" type="button" :disabled="active || !file || !policy || !policy.max_bytes" @click="send">{{attempted?'Retry upload':'Upload'}}</md-filled-button></div>
</div>
</template>
