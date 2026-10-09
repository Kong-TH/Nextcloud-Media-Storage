// SPDX-License-Identifier: AGPL-3.0-or-later
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
await mkdir('css',{recursive:true})
// Keep the official self-hosted font URL relative to the deployed CSS directory.
const fontHash=createHash('sha256').update(await readFile('img/material-symbols-outlined.ttf')).digest('hex').slice(0,12)
const fontFace=`@font-face{font-family:'Material Symbols Outlined';font-style:normal;font-weight:400;font-display:block;src:url('../img/material-symbols-outlined.ttf?v=${fontHash}') format('truetype');}\n`
await writeFile('css/mediastorage.css',fontFace+await readFile('js/mediastorage.css','utf8'))
let notices='Frontend dependencies bundled locally. Source available in this repository and package-lock.json.\n'
for(const [name,file] of [['Vue','vue/LICENSE'],['Material Web','@material/web/LICENSE'],['Lit','lit/LICENSE'],['Nextcloud router','@nextcloud/router/LICENSE'],['Nextcloud auth','@nextcloud/auth/LICENSE']]){
 notices+='\n'+name+'\n'+await readFile('node_modules/'+file,'utf8')+'\n'
}
notices+='\nGoogle Material Symbols font\n'+await readFile('img/material-symbols-NOTICE.txt','utf8')+'\n'+await readFile('img/material-symbols-LICENSE.txt','utf8')
await writeFile('js/THIRD-PARTY-NOTICES.txt',notices)
