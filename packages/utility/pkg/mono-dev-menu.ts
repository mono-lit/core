import { defineCustomElement } from 'vue'
import MonoDevMenu from '../src/components/Menu.vue'

export const MonoDevMenuElement = defineCustomElement(MonoDevMenu)

if (!customElements.get('mono-dev-menu')) {
  customElements.define('mono-dev-menu', MonoDevMenuElement)
}