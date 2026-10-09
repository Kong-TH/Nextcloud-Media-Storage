// SPDX-License-Identifier: AGPL-3.0-or-later
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
 define:{'process.env.NODE_ENV':JSON.stringify('production')},
 plugins:[vue({template:{compilerOptions:{isCustomElement:tag=>tag.startsWith('md-')}}})],
 build:{outDir:'js',emptyOutDir:true,lib:{entry:'src/main.js',name:'MediaStorage',formats:['iife'],fileName:()=> 'mediastorage-main.js',cssFileName:'mediastorage'},sourcemap:false},
})
