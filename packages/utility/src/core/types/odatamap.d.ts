import { QStringPath, QNumberPath, QBooleanPath, QDateTimeOffsetPath, QEntityCollectionPath, QEntityPath } from '@odata2ts/odata-query-objects';


type Mutable<T> = { -readonly [P in keyof T]: T[P] };

type GetInstance<T> = T extends new (...args: any) => infer I ? I : T;

type UnwrapPath<T> =
  T extends QStringPath<infer U> ? U :
  T extends QNumberPath<infer U> ? U :
  T extends QBooleanPath<infer U> ? U :
  T extends QDateTimeOffsetPath<infer U> ? U :
  T extends QEntityCollectionPath<infer Q> ? DTO_FromQ<Q>[] :
  T extends QEntityPath<infer Q> ? DTO_FromQ<Q> :
  never;

type AllowedPath =
  | QStringPath<any>
  | QNumberPath<any>
  | QBooleanPath<any>
  | QDateTimeOffsetPath<any>
  | QEntityCollectionPath<any>
  | QEntityPath<any>;

type DTO_FromQ<Q> = {
  [K in keyof Mutable<GetInstance<Q>> as
  Mutable<GetInstance<Q>>[K] extends AllowedPath ? K : never]:
  UnwrapPath<Mutable<GetInstance<Q>>[K]>
};

type Ctor<T = any> = new (...args: any) => T;

export type OdataMapTypes<
  Q,
  Overrides extends Record<string, Ctor<any> | Ctor<any>[]> = {}
> =
  Omit<DTO_FromQ<Q>, keyof Overrides> & {
    [K in keyof Overrides]:
    Overrides[K] extends Ctor<infer _>
    ? DTO_FromQ<Overrides[K]>
    : Overrides[K] extends Array<infer U>
    ? DTO_FromQ<U>[]
    : never;
  };

