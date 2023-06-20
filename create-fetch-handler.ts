import { XrpcOperation, TJsonValue, ContextFn } from "./types.ts";
import { Value } from "./typebox.ts";
import { OperationContainer } from './operation-container.ts';

interface FetchHandlerOptions<C> {
  basePath?: string;
  operations: XrpcOperation<any, C, any, any>[];
  createContext?: ContextFn<C>;
}

function isPromise<T>(value: any): value is PromiseLike<T> {
  return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
}

export const createFetchHandler = <C>({
  basePath = "/",
  operations,
  createContext = async () => ({} as C),
}: FetchHandlerOptions<C>) => {
  const opContainer = OperationContainer<C>(basePath);

  for (const endpoint of operations) {
    opContainer.add(endpoint);
  }

  return async (request: Request): Promise<Response> => {
    const method = request.method.toLowerCase();

    if (method !== "get" && method !== "post") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const endpoint = opContainer.get(url.pathname);

    if (!endpoint) {
      return new Response("Not Found", { status: 404 });
    }

    let inputObj: unknown = undefined;

    if (endpoint.mutation) {
      if (method !== "post") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      if (endpoint.input !== undefined) {
        const body = await request.json();
        inputObj = body;
      } else {
        await request.body?.cancel();
      }
    } else {
      if (method !== "get") {
        return new Response("Method Not Allowed", { status: 405 });
      }

      try {
        if (endpoint.input !== undefined) {
          const inputParam = url.searchParams.get("input");
          if (!inputParam) return new Response("Bad Request", { status: 400 });
          inputObj = JSON.parse(decodeURIComponent(inputParam));
        } else {
          await request.body?.cancel();
        }
      } catch (err) {
        return new Response("Bad Request", { status: 400 });
      }
    }

    if (
      endpoint.input !== undefined &&
      !Value.Check(endpoint.input, inputObj)
    ) {
      return new Response("Bad Request", { status: 400 });
    }

    try {      
      const createContextResult = createContext(request);

      let context: C;

      if (isPromise(createContextResult)) {
        context = await createContextResult;
      } else {
        context = createContextResult;
      }

      const output = await endpoint.executor(context, inputObj as TJsonValue);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      const status = output === undefined ? 204 : 200;

      return new Response(JSON.stringify(output), {
        status,
        headers,
      });
    } catch (err) {
      return new Response("Internal Server Error", { status: 500 });
    }

    throw new Error("Unreachable");
  };
};
