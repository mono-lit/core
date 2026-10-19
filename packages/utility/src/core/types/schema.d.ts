import type * as yup from "yup";

/**
 * Minimal Standard Schema v1 shape (https://standardschema.dev) — what Valibot,
 * Zod, ArkType, … expose as `schema["~standard"]`. Inlined so no schema library
 * is a type dependency.
 */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
    readonly "~standard": {
        readonly version: 1;
        readonly vendor: string;
        readonly validate: (value: unknown) =>
            | StandardSchemaV1Result<Output>
            | Promise<StandardSchemaV1Result<Output>>;
        readonly types?: { readonly input: Input; readonly output: Output } | undefined;
    };
}

export type StandardSchemaV1Result<Output> =
    | { readonly value: Output; readonly issues?: undefined }
    | {
        readonly issues: ReadonlyArray<{
            readonly message: string;
            readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
        }>;
    };

/** A yup schema or any Standard Schema (Valibot, Zod, …). */
export type ValidationSchemaLike = yup.AnySchema | yup.AnyObjectSchema | StandardSchemaV1<any, any>;

export interface ValidateSchema<T = any> {
    /** yup schema or any Standard Schema (Valibot, Zod, …) */
    schema: ValidationSchemaLike | any;
    /** field to validate; dotted / indexed paths allowed (`"address.city"`, `"items[0].name"`) */
    field?: keyof T | (string & {});
    input: T;
    /** `{ valid, message }` slots mirroring `input` (object or Ref) */
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

export interface Schema<T> extends yup.ObjectSchema<SchemaType<T>> { }

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


