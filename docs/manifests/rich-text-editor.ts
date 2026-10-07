import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',    title: 'Rich text editor', description: 'SunEditor as a mono form field: label, helper, v-model HTML.' },
  { id: 'toolbar',  title: 'Toolbar',          description: 'Presets (basic / standard / full / default), a buttonList, or a string of names.' },
  { id: 'plugins',  title: 'Plugins',          description: 'auto (default), plugin classes via .prop, names, or none — the toolbar follows.' },
  { id: 'form',     title: 'Form',             description: 'Bound to monoForm: required and max rules over the HTML value.' },
  { id: 'modes',    title: 'Modes',            description: 'inline, balloon and classic:bottom toolbars.' },
  { id: 'sizes',    title: 'Sizes',            description: 'sm, md and lg scale the toolbar, icons and editing font.' },
  { id: 'colors',   title: 'Colors',           description: 'Pick a colour; every variant re-paints live.' },
  { id: 'states',   title: 'States',           description: 'disabled, readonly, validation states and a character cap.' },
  { id: 'lang',     title: 'Language',         description: 'A SunEditor language pack loaded on demand, and rtl content.' },
  { id: 'options',  title: 'Options & API',    description: 'Raw SunEditor options, event handlers, and the instance methods.' },
  { id: 'content',  title: 'Displaying HTML',  description: 'Render saved content with suneditor/css/contents.' },
]
