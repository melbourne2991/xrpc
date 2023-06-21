import { XrpcOperation, TJsonValue, ContextFn } from "./types.ts";
import { Value } from "./typebox.ts";
import { OperationContainer } from "./operation-container.ts";

export interface FetchLikeRequest {
  method: string;
  url: string;
  json: () => Promise<unknown>;
}

export interface FetchLikeResponse {
  status: number;
  headers?: Record<string, string>;
  body: string;
}

export interface FetchLikeHandlerOptions<C, R> {
  basePath?: string;
  operations: XrpcOperation<any, C, any, any>[];
  mapToFetchLike: (request: R) => FetchLikeRequest;
  createContext?: ContextFn<C, [R]>;
}

function isPromise<T>(value: any): value is PromiseLike<T> {
  return (
    !!value &&
    (typeof value === "object" || typeof value === "function") &&
    typeof value.then === "function"
  );
}

export const createFetchLikeHandler = <C, R>({
  basePath = "/",
  operations,
  mapToFetchLike,
  createContext = async () => ({} as C),
}: FetchLikeHandlerOptions<C, R>) => {
  const opContainer = OperationContainer<C>(basePath);

  for (const endpoint of operations) {
    opContainer.add(endpoint);
  }

  return async (rawRequest: R): Promise<FetchLikeResponse> => {
    const request = mapToFetchLike(rawRequest);

    const method = request.method.toLowerCase();

    if (method !== "get" && method !== "post") {
      return {
        status: 405,
        body: "Method Not Allowed",
      }
      // return new Response("Method Not Allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const endpoint = opContainer.get(url.pathname);

    if (!endpoint) {
      // return new Response("Not Found", { status: 404 });
      return {
        status: 404,
        body: "Not Found",
      }
    }

    let inputObj: unknown = undefined;

    if (endpoint.mutation) {
      if (method !== "post") {
        return {
          status: 405,
          body: "Method Not Allowed",
        }
      }

      if (endpoint.input !== undefined) {
        const body = await request.json();
        inputObj = body;
      }
    } else {
      if (method !== "get") {
        return {
          status: 405,
          body: "Method Not Allowed",
        }
      }

      try {
        if (endpoint.input !== undefined) {
          const inputParam = url.searchParams.get("input");
          if (!inputParam) return {
            status: 400,
            body: "Bad Request",
          }
          inputObj = JSON.parse(decodeURIComponent(inputParam));
        }
      } catch (err) {
        return {
          status: 400,
          body: "Bad Request",
        }
      }
    }

    if (
      endpoint.input !== undefined &&
      !Value.Check(endpoint.input, inputObj)
    ) {
      return {
        status: 400,
        body: "Bad Request",
      }
    }

    try {
      const createContextResult = createContext(rawRequest);

      let context: C;

      if (isPromise(createContextResult)) {
        context = await createContextResult;
      } else {
        context = createContextResult;
      }

      const output = await endpoint.executor(context, inputObj as TJsonValue);

      const headers = {
        "Content-Type": "application/json",
      };

      const status = output === undefined ? 204 : 200;

      return {
        status,
        headers,
        body: JSON.stringify(output),
      }
    } catch (err) {
      return {
        status: 500,
        body: "Internal Server Error",
      }
    }

  };
};

export type FetchHandlerOptions<C> = Omit<FetchLikeHandlerOptions<C, Request>, 'mapToFetchLike'>

export const createFetchHandler = <C>(opts: FetchHandlerOptions<C>) => {
  const handler = createFetchLikeHandler({
    ...opts,
    mapToFetchLike: (request: Request) => request
  })

  return async (request: Request) => {
    const response = await handler(request)

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    })
  }
}