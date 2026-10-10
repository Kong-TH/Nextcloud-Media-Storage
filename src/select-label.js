// SPDX-License-Identifier: AGPL-3.0-or-later
// Material Web 2.5.0 exposes no CSS part for the selected value. Keep this
// version-specific shadow styling local; options and accessible text stay intact.
// The nested field must also allow its flex content to shrink below min-content.
const states=new WeakMap()
const labelStyle=new CSSStyleSheet()
labelStyle.replaceSync('#label {min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}')
const fieldStyle=new CSSStyleSheet()
fieldStyle.replaceSync('.container,.middle,.content {min-width:0;}')
async function refresh(element){
 const state=states.get(element);if(!state)return
 const revision=++state.revision
 await element.updateComplete
 await new Promise(requestAnimationFrame)
 if(states.get(element)!==state||state.revision!==revision)return
 const label=element.shadowRoot?.querySelector('#label')
 if(label&&label.scrollWidth>label.clientWidth+1)element.dataset.tip=element.displayText
 else delete element.dataset.tip
}
export const selectLabel={
 async mounted(element){
  const state={revision:0,resize:new ResizeObserver(()=>refresh(element)),refresh:()=>refresh(element)}
  states.set(element,state)
  await element.updateComplete
  if(states.get(element)!==state)return
  element.shadowRoot.adoptedStyleSheets=[...element.shadowRoot.adoptedStyleSheets,labelStyle]
  const field=element.shadowRoot.querySelector('.field')
  await field.updateComplete
  if(states.get(element)!==state)return
  field.shadowRoot.adoptedStyleSheets=[...field.shadowRoot.adoptedStyleSheets,fieldStyle]
  state.resize.observe(element)
  element.addEventListener('change',state.refresh)
  element.addEventListener('closed',state.refresh)
  refresh(element)
 },
 updated:refresh,
 unmounted(element){const state=states.get(element);state?.resize.disconnect();element.removeEventListener('change',state?.refresh);element.removeEventListener('closed',state?.refresh);states.delete(element)},
}
