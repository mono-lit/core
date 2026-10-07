// src/composables/host-provider.ts
import {
    ref,
    watch,
    onBeforeUnmount,
    type Ref,
    type InjectionKey,
} from 'vue'

type HostKey<T> = string | symbol | InjectionKey<Ref<T>>

const registry = new Map<HostKey<any>, Ref<any>>()

type InjectHostOptions<T> = {
    key: HostKey<T>
    defaultValue: T
}

type HostProviderOptions<T> = {
    key: HostKey<T>
    syncRef: Ref<T>
    immediate?: boolean
    deep?: boolean
    resetOnUnmount?: boolean
    resetValue?: T
    deleteOnUnmount?: boolean
}

function getOrCreateHostRef<T>(key: HostKey<T>, defaultValue: T): Ref<T> {
    let target = registry.get(key) as Ref<T> | undefined

    if (!target) {
        target = ref(defaultValue) as Ref<T>
        registry.set(key, target)
    }

    return target
}

export function monoInject<T>(options: InjectHostOptions<T>): Ref<T> {
    const { key, defaultValue } = options

    return getOrCreateHostRef(key, defaultValue)
}


export function monoProvide<T>(options: HostProviderOptions<T>): Ref<T> {
    const {
        key,
        syncRef,
        immediate = true,
        deep = true,
        resetOnUnmount = false,
        resetValue,
        deleteOnUnmount = false,
    } = options

    const target = getOrCreateHostRef(key, syncRef.value)

    const stop = watch(
        syncRef,
        (value) => {
            target.value = value
        },
        {
            immediate,
            deep,
        },
    )

    onBeforeUnmount(() => {
        stop()

        if (resetOnUnmount) {
            target.value = resetValue ?? syncRef.value
        }

        if (deleteOnUnmount) {
            registry.delete(key)
        }
    })

    return target
}