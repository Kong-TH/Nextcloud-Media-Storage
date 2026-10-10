<!-- SPDX-License-Identifier: AGPL-3.0-or-later -->
<script setup>
import {ref,computed,watch} from 'vue'
import Icon from './MaterialIcon.vue'
import {mediaUrl} from '../api.js'
const props=defineProps({node:{type:Object,required:true},large:Boolean})
const failed=ref(false),loaded=ref(false),revision=ref(0)
const video=computed(()=>props.node.binding?.mime_type?.startsWith('video/'))
const source=computed(()=>revision.value?mediaUrl(props.node.id,props.large&&video.value?'content':'preview',props.large)+(props.large?'&':'?')+'retry='+revision.value:mediaUrl(props.node.id,props.large&&video.value?'content':'preview',props.large))
watch(()=>[props.node.id,props.node.binding?.nextcloud_file_id,props.node.binding_status],()=>{failed.value=false;loaded.value=false;revision.value=0})
function retry(){failed.value=false;loaded.value=false;revision.value++}
</script>
<template>
<span class="media-preview" :class="{'large-preview':large}">
<template v-if="node.binding_status==='available' && !failed">
<video v-if="large && video" :key="source" :src="source" controls preload="metadata" :aria-label="'Video preview: '+node.name" @loadedmetadata="loaded=true" @error="failed=true" />
<img v-else :key="source" :src="source" :loading="large?'eager':'lazy'" decoding="async" :alt="large?'Preview of '+node.name:''" @load="loaded=true" @error="failed=true">
<span v-if="large && !loaded" class="preview-status" role="status">Loading preview…</span>
</template>
<template v-else><Icon :name="node.binding?.mime_type?.startsWith('video/')?'movie':'image'" /><span v-if="large" class="preview-fallback"><span>Preview unavailable.</span><md-text-button v-if="node.binding_status==='available'" type="button" @click="retry">Retry preview</md-text-button></span></template>
</span>
</template>
