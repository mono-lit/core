import type { DxDataGrid } from 'devextreme-vue/data-grid'

export type FilterExpression = "=" | "<>" | ">" | ">=" | "<" | "<=" | "startswith" | "endswith" | "contains" | "notcontains"

export interface HeaderFilter<T> {
    value: [keyof T, FilterExpression, string],
    text: string

}

export interface Format {
    type?: 'currency',
    currency?: 'IDR'
    precision?: number,
}

export interface CustomSummary {
    column: string,
    summaryType: "sum" | "min" | "max" | "avg" | "count",
    name?: string,
    alignment?: 'right' | 'center' | 'left',
    cssClass?: string,
    displayFormat?: string,
    showInColumn?: string,
    valueFormat?: Format | string,
}


export type DataGrid<T = {}> = (InstanceType<typeof DxDataGrid>['$props']) & {
    keyExpr?: keyof T extends never ? string | string[] : keyof T | (keyof T)[],
}