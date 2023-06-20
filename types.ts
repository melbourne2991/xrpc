import { Static, TSchema } from "./typebox.ts";

export type JSONValue = JSONValue[] | JSONPrimitive | JSONRecord;
export type JSONPrimitive = string | number | boolean | null;
export type JSONRecord = { [key: string]: JSONValue };

export interface TJsonValue extends TSchema {
  static: JSONValue;
}

export interface TJSONRecord extends TSchema {
  static: JSONRecord;
}

export interface XrpcSystemContext<T> {
  readonly request: Request;
  readonly endpoint: XrpcOperation<
    string,
    T,
    TJsonValue | undefined,
    TJsonValue | undefined
  >;
}

// export type XrpcProvidedContext<
//   T = unknown
// > = T;

export type XrpcOperationContext<P> = P & {
  readonly __system: XrpcSystemContext<P>;
};

export type MapUndefinedToVoid<T> = T extends undefined ? void : T;

export type MaybeStatic<T extends undefined | TSchema> = T extends TSchema
  ? Static<T>
  : undefined;

export interface XrpcOperation<
  ID extends string = string,
  C = unknown,
  I extends TJsonValue | undefined = TJsonValue | undefined,
  O extends TJsonValue | undefined = TJsonValue | undefined,
  M extends true | false = true | false
> {
  id: ID;
  input: I;
  output: O;
  mutation: M;
  executor: (
    context: C,
    input: MaybeStatic<I>
  ) => PromiseLike<MapUndefinedToVoid<MaybeStatic<O>>> | MaybeStatic<O>;
}

export type OperationInput<E extends XrpcOperation> = MaybeStatic<E["input"]>;
export type OperationOutput<E extends XrpcOperation> = MaybeStatic<E["output"]>;
export type EndpointFromId<
  E extends XrpcOperation[],
  K extends E[number]["id"]
> = Extract<E[number], { id: K }>;

export type EndpointTypes<E extends XrpcOperation[]> = E[number];

export type ExtractByMutation<E extends XrpcOperation> = Extract<
  E,
  { mutation: true }
>;
export type ExtractByQuery<E extends XrpcOperation> = Extract<
  E,
  { mutation: false }
>;
export type ExtractById<E extends XrpcOperation, K> = Extract<E, { id: K }>;

export type MapOperationsToMethods<E extends XrpcOperation> = {
  [K in E["id"]]: OperationInput<ExtractById<E, K>> extends undefined
    ? () => Promise<OperationOutput<ExtractById<E, K>>>
    : (
        input: OperationInput<ExtractById<E, K>>
      ) => Promise<OperationOutput<ExtractById<E, K>>>;
};

export type XrpcClient<E extends XrpcOperation[]> = {
  query: MapOperationsToMethods<ExtractByQuery<EndpointTypes<E>>>;
  mutation: MapOperationsToMethods<ExtractByMutation<EndpointTypes<E>>>;
};

export type InferContextTypeFromFn<T extends ContextFn> = T extends (
  request: Request
) => PromiseLike<infer X>
  ? X
  : T extends (request: Request) => infer X
  ? X
  : never;

export type ContextFn<T = unknown> = (request: Request) => PromiseLike<T> | T;
