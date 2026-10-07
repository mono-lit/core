// src/storage.ts — client localStorage/sessionStorage util (moved verbatim).

import type { LocalStorageParams } from './types'

export const useMyStorage = (options?: LocalStorageParams) => {

    const storage = !options?.type || options.type == 'local' ? localStorage : sessionStorage

    const get = (name: LocalStorageParams['name']): LocalStorageParams['value'] | LocalStorageParams[] | null => {

        const optionName = name || options?.name

        if (typeof optionName === 'string') {
            return storage.getItem(optionName)
        }

        if (Array.isArray(optionName)) {
            const mapStorage = optionName?.map((e) => {
                return {
                    name: e,
                    value: storage.getItem(e)
                }
            }).filter((e) => e.value) as LocalStorageParams[]

            if (mapStorage.length > 0) return mapStorage

            return null
        }

        if (optionName instanceof RegExp) {
            var result: LocalStorageParams[] = []
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i)
                if (key && optionName.test(key)) {
                    result.push({
                        name: key,
                        value: storage.getItem(key) ?? undefined
                    })
                }
            }

            const filterResult = result.filter((e) => e.value)

            if (filterResult.length > 0) return filterResult as LocalStorageParams[]

            return null
        }

        return null
    }

    const change = ({ name, value }: Pick<LocalStorageParams, 'name' | 'value'>): string | null => {
        const optionName = name || options?.name;
        const optionValue = value || options?.value;

        if (typeof optionName !== 'string' || typeof optionValue === 'undefined') return null;

        const existing = storage.getItem(optionName);
        if (!existing) return null;

        try {
            const parsed = JSON.parse(existing);

            // ✅ Only shallow-merge if both are plain objects
            if (
                parsed &&
                typeof parsed === 'object' &&
                !Array.isArray(parsed) &&
                typeof optionValue === 'object' &&
                !Array.isArray(optionValue)
            ) {
                const merged = { ...parsed, ...optionValue };
                const stringified = JSON.stringify(merged);
                storage.setItem(optionName, stringified);
                return stringified;
            }

            const stringified = typeof optionValue === 'string' ? optionValue : JSON.stringify(optionValue);
            // ❌ Not a mergeable object — replace entirely
            storage.setItem(optionName, stringified);

            return stringified;
        } catch {
            // If parsing failed, just replace
            const stringified = typeof optionValue === 'string' ? optionValue : JSON.stringify(optionValue);
            storage.setItem(optionName, stringified);
            return stringified;
        }
    }

    const add = ({ name, value, items }: Pick<LocalStorageParams, 'name' | 'value' | 'items'>): string | null => {
        const optionName = name || options?.name;
        const optionValue = value || options?.value;
        const optionItems = items || options?.items;

        if (!optionItems && typeof optionName === 'string' && optionValue) {
            const stringified = typeof optionValue === 'string' ? optionValue : JSON.stringify(optionValue);
            storage.setItem(optionName, stringified);
            return stringified;
        }

        if (optionItems) {
            const filterItems = optionItems.filter(item => typeof item?.name === 'string' && item.value);

            var stringifiedd: string | null = '';
            filterItems.forEach(item => {
                const stringified = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
                stringifiedd += stringified;
                storage.setItem(String(item?.name), stringified);
            });
            return stringifiedd;
        }

        return null;
    };

    const remove = (name: LocalStorageParams['name']): boolean => {

        const optionName = name || options?.name

        if (typeof optionName === 'string') {
            storage.removeItem(optionName)
            return true
        }

        if (Array.isArray(optionName)) {
            optionName.forEach(key => storage.removeItem(key))
            return true
        }

        if (optionName instanceof RegExp) {
            const toRemove: string[] = []
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i)
                if (key && optionName.test(key)) {
                    toRemove.push(key)
                }
            }
            toRemove.forEach(key => storage.removeItem(key))
            return true
        }

        return false
    }

    // new method
    const pull = (name: LocalStorageParams['name']): LocalStorageParams['value'] | null => {
        const value = get(name);
        if (value) {
            remove(name)
            return value
        }
        return null
    }

    const redirect = (url: string, { name, value, items }: Pick<LocalStorageParams, 'name' | 'value' | 'items'>) => {
        if (add({ name, value, items })) {
            window.location.href = url;
        }
    }

    return { get, add, remove, change, pull, redirect }
}
