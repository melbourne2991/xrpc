import {
  XrpcOperation,
  TJsonValue,
  MapUndefinedToVoid,
  MaybeStatic,
} from "./types.ts";

function makeImpl<
  ID extends string,
  C,
  I extends TJsonValue | undefined,
  O extends TJsonValue | undefined,
  M extends boolean
>(id: ID, inputSchema: I, outputSchema: O, mutation: M) {
  return (
    executor: (
      context: C,
      input: MaybeStatic<I>
    ) => PromiseLike<MapUndefinedToVoid<MaybeStatic<O>>> | MaybeStatic<O>
  ): XrpcOperation<ID, C, I, O, M> => {
    return {
      id,
      input: inputSchema,
      output: outputSchema,
      mutation,
      executor,
    };
  };
}

function createEndpoint<
  C,
  M extends true | false,
  ID extends string
>(id: ID, mutation: M) {
  return {
    impl: makeImpl<ID, C, undefined, undefined, M>(
      id,
      undefined,
      undefined,
      mutation
    ),

    input: <I extends TJsonValue | undefined>(inputSchema: I) => {
      return {
        impl: makeImpl<ID, C, I, undefined, M>(
          id,
          inputSchema,
          undefined,
          mutation
        ),

        output: <O extends TJsonValue | undefined>(outputSchema: O) => {
          return {
            impl: makeImpl<ID, C, I, O, M>(
              id,
              inputSchema,
              outputSchema,
              mutation
            ),
          };
        },
      };
    },

    output: <O extends TJsonValue | undefined>(outputSchema: O) => {
      return {
        impl: makeImpl<ID, C, undefined, O, M>(
          id,
          undefined,
          outputSchema,
          mutation
        ),

        input: <I extends TJsonValue | undefined>(inputSchema: I) => {
          return {
            impl: makeImpl<ID, C, I, O, M>(
              id,
              inputSchema,
              outputSchema,
              mutation
            ),
          };
        },
      };
    },
  };
}

function Query<C, ID extends string>(id: ID) {
  return createEndpoint<C, false, ID>(id, false as false);
}

function Mutation<C, ID extends string>(id: ID) {
  return createEndpoint<C, true, ID>(id, true as true);
}

export const Operation = <C>() => {
  return {
    query: <ID extends string>(id: ID) => Query<C, ID>(id),
    mutation: <ID extends string>(id: ID) => Mutation<C, ID>(id),
  };
};
