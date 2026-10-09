// SPDX-License-Identifier: AGPL-3.0-or-later
import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validName,mediaType} from '../../src/rules.js'
test('names use UTF-8 byte bounds and reject path/control input',()=>{
 assert.equal(validName('ภาพ.png'),true)
 for(const value of ['', '.', '..',' folder','folder ','a/b','a\\b','bad\n', 'ก'.repeat(86)])assert.equal(validName(value),false,value)
 assert.equal(validName('ก'.repeat(85)),true)
})
test('file picker matches the backend media allowlist',()=>{
 for(const mime of ['image/jpeg','image/png','image/gif','image/webp','image/avif','video/mp4','video/webm','video/ogg'])assert.equal(mediaType(mime),true,mime)
 for(const mime of ['image/svg+xml','text/html','application/pdf','audio/mpeg','application/octet-stream'])assert.equal(mediaType(mime),false,mime)
})
