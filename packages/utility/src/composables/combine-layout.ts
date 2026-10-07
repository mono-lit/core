import { type RouteRecordRaw } from "vue-router"

interface SidebarMenu {
    title: string,
    subtitle?: string,
    url?: string,
    icon?: string,
    color?: string,
    button?: {
        title?: string,
        icon?: string
    }
    items?: SidebarMenu[],
    remoteName?: string,
    visible?: boolean,
    order?: number,
    route?: { meta: { layout: string, title: string } },
}

export let defineLayout = ({ menu, routes }: { menu: SidebarMenu[], routes: RouteRecordRaw[] }) => {

    const allMenus = menu
    const autoRoutes = routes

    function joinUrl(parent: string, child: string) {
        const p = parent?.endsWith("/") ? parent.slice(0, -1) : parent
        const c = child?.startsWith("/") ? child : `/${child}`
        return `${p}${c}`
    }

    function buildRouteMetaMap(menus: SidebarMenu[]) {
        const map = new Map<string, Record<string, any>>()

        const walk = (node: SidebarMenu, parentBase = "") => {
            if (!node.items?.length && node.route?.meta) {
                const fullPath = parentBase ? joinUrl(parentBase, String(node.url)) : String(node.url)

                if (map.has(fullPath)) {
                    console.warn("[route-meta] duplicated path:", fullPath, "overridden")
                }

                map.set(fullPath, node.route.meta)
            }
            if (node.items?.length) {
                const base = String(node.url || "")
                node.items.forEach((ch) => walk(ch, base))
            }
        }

        menus.forEach((m) => walk(m))
        return map
    }

    function joinPath(parent: string, child: string) {
        const p = parent.replace(/\/+$/, "")
        const c = child.replace(/^\/+/, "")
        if (!p) return "/" + c
        if (!c) return p || "/"
        return `${p}/${c}`
    }

    function walkRoutesFull(
        routes: RouteRecordRaw[],
        fn: (r: RouteRecordRaw, fullPath: string) => void,
        parentFullPath = ""
    ) {
        for (const r of routes) {
            const raw = String(r.path ?? "")
            const fullPath = raw.startsWith("/")
                ? raw
                : joinPath(parentFullPath || "", raw)

            fn(r, fullPath)

            if (r.children?.length) walkRoutesFull(r.children, fn, fullPath)
        }
    }

    const rawRoutes = [...autoRoutes] as unknown as RouteRecordRaw[]
    const routeMetaByPath = buildRouteMetaMap(allMenus)

    walkRoutesFull(rawRoutes, (r, fullPath) => {
        r.meta ??= {}
        const metaAny = r.meta as any

        // apply meta dari menu jika ada (pakai fullPath)
        const fromMenu = routeMetaByPath.get(fullPath)
        if (fromMenu) Object.assign(metaAny, fromMenu)

        // title fallback
        metaAny.title ??= (typeof r.name === "string" ? r.name : fullPath)

        // ✅ default layout untuk semua page (kecuali public)
        const isPublic = fullPath === "/" || fullPath === "/error"
        const isPage = !!(r as any).component || !!(r as any).components

        if (!isPublic && isPage) {
            metaAny.layout ??= "home"
        }
    })


    return rawRoutes


}


