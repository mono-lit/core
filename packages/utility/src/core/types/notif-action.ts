import type { NotivueItem } from 'notivue'
import type { NotifProps } from './notif'

/** Relaxed button descriptor — no Vuetify dependency. */
export interface MonoNotifButton {
    text?: string
    label?: string
    to?: string | Record<string, any>
    color?: string
    variant?: string
    class?: string
    disabled?: boolean
    [key: string]: any
}

/** `item` prop type for MonoNotifAction (self-contained). */
export type MonoNotifActionTypes = NotivueItem & {
    props: NotifProps['props']
}

export interface MonoNotifActionProps {
    item: MonoNotifActionTypes
}
