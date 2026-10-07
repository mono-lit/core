import type { ObjectSchema, Schema } from "yup";

export interface ValidateSchema<T = any> {
    schema: any;
    field?: keyof T;
    input: T;
    error: any;
}

export type ValidateErrorItem = {
    valid: boolean;
    message: string;
};

export type ValidateError<T extends string = string> = Record<T, ValidateErrorItem>;

type WithUndefined<T> = {
    [P in keyof T]: T[P] | undefined;
};

export interface SchemaType<T> extends WithUndefined<T> { }

export interface Schema<T> extends ObjectSchema<SchemaType<T>> { }

type AnyObject = yup.AnyObject;

/** Map a TS type T to the corresponding Yup schema type */
type SchemaFor<T> =
    T extends string ? yup.StringSchema<string> :
    T extends number ? yup.NumberSchema<number> :
    T extends boolean ? yup.BooleanSchema<boolean> :
    T extends Date ? yup.DateSchema<Date> :
    T extends (infer U)[] ? yup.ArraySchema<SchemaFor<U>, AnyObject, U[]> :
    T extends Record<string, any>
    ? yup.ObjectSchema<{ [K in keyof T]-?: SchemaFor<T[K]> }, AnyObject, T>
    : yup.Schema<T>;

/** Build a per-key schema shape with proper schema types */
export type SchemaObject<T> = { [K in keyof T]-?: SchemaFor<T[K]> };


export type ValidateErrorSingle<T> = {
    [K in keyof T]: T[K] extends object ? ValidateError<T[K]> : ValidateErrorItem;
};
export type ValidateErrorComplex<T> = {
    [K in keyof T]: T[K] extends object[]
    ? ValidateErrorItem[] // or more complex handling
    : T[K] extends object
    ? ValidateErrorComplex<T[K]>
    : ValidateErrorItem;
};


