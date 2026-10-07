import type { Router, RouteLocationNormalizedLoadedGeneric } from 'vue-router'
import { type PushOptions } from 'notivue'
import type { MonoNotifButton } from './notif-action'

export type NotifProps = {
    route?: RouteLocationNormalizedLoadedGeneric,
    router?: Router,
    message: string,
    type: "info" | 'promise' | "warning" | "error" | "success"
} & Omit<PushOptions, 'message'> & {
    props?: {
        [key: string]: any,
        redirect?: string,
        isAction?: boolean,
        isNewMessageRequest?: boolean,
        buttons?: MonoNotifButton[]
    }
}