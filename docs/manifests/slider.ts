import type { DemoEntry } from './types'

export const demos: DemoEntry[] = [
  { id: 'basic',       title: 'Basic',        description: 'One number, one thumb; the value ends the label row.' },
  { id: 'range',       title: 'Range',        description: 'An array is one thumb per entry; drag the filled span to move both.' },
  { id: 'multi-thumb', title: 'Multiple thumbs', description: '[2, 2, 3]: three thumbs, two stacked; drag up or down to split a stack.' },
  { id: 'vertical',    title: 'Vertical',     description: 'type="vertical": min at the bottom, height sets the track length.' },
  { id: 'min-gap',     title: 'Min gap',      description: 'min-gap keeps neighbouring thumbs apart.' },
  { id: 'stops',       title: 'Stops',        description: 'stops: the thumb lands only on the listed values.' },
  { id: 'marks',       title: 'Marks',        description: 'Ticks at every step, or a labelled list of values.' },
  { id: 'track-gap',   title: 'Track gap',    description: 'track-gap cuts the track back around each thumb (Material 3).' },
  { id: 'fill',        title: 'Fill',         description: 'fill="auto | start | end | none".' },
  { id: 'tooltip',     title: 'Value tooltip', description: 'value-tooltip="auto | always | never": the bubble on each thumb.' },
  { id: 'format',      title: 'Formatting',   description: 'format-display: Rupiah, percent, or a function.' },
  { id: 'sizes',       title: 'Sizes',        description: 'xs to xxl scale the track and thumb.' },
  { id: 'colors',      title: 'Colors',       description: 'color paints the fill, thumb and focus halo.' },
  { id: 'states',      title: 'States',       description: 'Disabled, readonly, required and validation.' },
  { id: 'form',        title: 'Form',         description: 'controlMonoForm owns the value and renders the validation.' },
  { id: 'event-log',   title: 'Event log',    description: 'input while dragging, change on release.' },
  { id: 'css-vars',    title: 'CSS Variables', description: 'Restyle through --mono-slider-* knobs.' },
]
