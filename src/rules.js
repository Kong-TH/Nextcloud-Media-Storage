// SPDX-License-Identifier: AGPL-3.0-or-later
export function validName(value){return value!==''&&value===value.trim()&&value!=='.'&&value!=='..'&&!/[\\/\u0000-\u001f\u007f]/u.test(value)&&new TextEncoder().encode(value).length<=255}
export function mediaType(mime){return /^(image\/(jpeg|png|gif|webp|avif)|video\/(mp4|webm|ogg))$/.test(mime)}
export function typeLabel(node){if(node.node_type==='folder')return 'Folder';const mime=node.binding?.mime_type??'';return mime.startsWith('image/')?'Image':mime.startsWith('video/')?'Video':mime.startsWith('audio/')?'Audio':mime==='application/pdf'?'Document':'File'}
