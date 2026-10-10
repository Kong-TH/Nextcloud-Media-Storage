<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script setup>
import {ref,computed,onMounted,onBeforeUnmount} from 'vue'
import {generateUrl} from '@nextcloud/router'
import {api} from '../api.js'
import Icon from './MaterialIcon.vue'
const props=defineProps({node:{type:Object,required:true}})
defineEmits(['dismiss'])
const path=ref(''),loading=ref(true)
const controller=new AbortController()
const folderUrl=computed(()=>{
 if(!path.value)return ''
 const folder='/'+path.value.replace(/^\/+/, '').split('/').slice(0,-1).join('/')
 return generateUrl('/apps/files/')+'?'+new URLSearchParams({dir:folder,view:'files'}).toString()
})
onMounted(async()=>{
 try{
  const current=await api('/nodes/'+props.node.id,'GET',undefined,controller.signal)
  if(!controller.signal.aborted && current.binding_status==='available')path.value=current.binding?.last_known_path??''
 }catch{/* The upload remains successful even if its location cannot be resolved. */}
 finally{if(!controller.signal.aborted)loading.value=false}
})
onBeforeUnmount(()=>controller.abort())
</script>
<template>
<section id="upload-notice" class="upload-notice" aria-label="Upload result">
<div class="upload-notice-copy" role="status" aria-live="polite" aria-atomic="true"><strong>Uploaded {{node.name}}</strong><p v-if="loading">Finding its location in Nextcloud…</p><p v-else-if="path">Saved in Nextcloud: <span dir="ltr">/{{path.replace(/^\/+/, '')}}</span></p><p v-else>Saved in Nextcloud. Its current folder could not be retrieved.</p></div>
<md-icon-button id="dismiss-upload-notice" type="button" aria-label="Dismiss upload notification" @click="$emit('dismiss')"><Icon name="close" /></md-icon-button>
<md-text-button v-if="folderUrl" id="open-upload-folder" :href="folderUrl" target="_blank" rel="noopener noreferrer"><Icon slot="icon" name="folder_open" />Open folder in Nextcloud</md-text-button>
</section>
</template>
