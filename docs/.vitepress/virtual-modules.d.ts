declare module 'virtual:mono-component-types' {
  interface TypeRow {
    prop: string
    value: string
    default: string
    description: string
  }
  interface TypeGroup {
    element: string
    interfaceName: string
    rows: TypeRow[]
  }
  const types: Record<string, { groups: TypeGroup[] }>
  export default types
}
