import { XrpcOperation, XrpcClient, } from './types.ts'

export class XrpcResponseError extends Error {
  constructor(public readonly response: Response) {
    super(`${XrpcResponseError.name}: ${response.statusText} (${response.status})`);
  }
}

export class XrpcParseError extends Error {
  constructor(public readonly response: Response, originalError: Error) {
    super(`${XrpcParseError.name}: ${originalError.message}`);
  }
}

export function createClient<E extends XrpcOperation<any, any, any, any>[]>(baseUrl: string): XrpcClient<E> {
  const handleResponse = async (response: Response) => {
    if (response.status < 200 || response.status >= 400) {
      throw new XrpcResponseError(response);
    }

    if (response.status === 204) {
      return undefined;
    }

    try {
      return await response.json();
    } catch (err) {
      throw new XrpcParseError(response, err as Error);
    }
  }

  const queryFetcher =  (id: string, requestInit: RequestInit = {}) => {
    return async (input: unknown) => {
      const url = new URL(id, baseUrl)

      if (input) {
        url.searchParams.set('input', encodeURIComponent(JSON.stringify(input)))
      }

      const response = await fetch(url.toString(), {
        ...requestInit,
        headers: {
          ...requestInit.headers,
        }
      })

      return handleResponse(response)
    }
  };

  const mutationFetcher =  (id: string, requestInit: RequestInit = {}) => {
    return async (input: unknown) => {
      const url = new URL(id, baseUrl)

      const response = await fetch(url.toString(), {
        method: 'POST',
        body: JSON.stringify(input),
        ...requestInit,
        headers: {
          ...requestInit.headers,
          'Content-Type': 'application/json',
        }
      })

      return handleResponse(response)
    }
  };

  const mutation = new Proxy({}, {
    get: (target, name) => {
      if (typeof name !== 'string') throw new Error('Invalid property - expected string.');
      return mutationFetcher(name);
    }
  })

  const query = new Proxy({}, {
    get: (target, name) => {
      if (typeof name !== 'string') throw new Error('Invalid property - expected string.');
      return queryFetcher(name);
    }
  })

  return {
    mutation,
    query
  } as any
}