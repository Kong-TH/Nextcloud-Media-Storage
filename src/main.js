// SPDX-License-Identifier: AGPL-3.0-or-later
import {createApp} from 'vue'
import '@material/web/button/filled-button.js'
import '@material/web/button/text-button.js'
import '@material/web/progress/circular-progress.js'
import '@material/web/iconbutton/icon-button.js'
import '@material/web/iconbutton/filled-tonal-icon-button.js'
import '@material/web/fab/fab.js'
import '@material/web/ripple/ripple.js'
import '@material/web/icon/icon.js'
import '@material/web/textfield/outlined-text-field.js'
import App from './App.vue'
import './style.css'
createApp(App,{version:document.getElementById('mediastorage-root').dataset.version??''}).mount('#mediastorage-root')
