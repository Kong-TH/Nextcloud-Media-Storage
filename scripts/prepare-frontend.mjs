// SPDX-License-Identifier: AGPL-3.0-or-later
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises'
await mkdir('css',{recursive:true})
await copyFile('js/mediastorage.css','css/mediastorage.css')
let notices='Frontend dependencies bundled locally. Source available in this repository and package-lock.json.\n'
for(const [name,file] of [['Vue','vue/LICENSE'],['Material Web','@material/web/LICENSE'],['Lit','lit/LICENSE'],['Nextcloud router','@nextcloud/router/LICENSE'],['Nextcloud auth','@nextcloud/auth/LICENSE']]){
 notices+='\n'+name+'\n'+await readFile('node_modules/'+file,'utf8')+'\n'
}
await writeFile('js/THIRD-PARTY-NOTICES.txt',notices)
