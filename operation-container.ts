import { XrpcOperation } from "./types.ts";
const normalizePathname = (value: string) => new URL(value, "file://").pathname;

const operationPathMapper = (basePath: string) => {
  const basePathNormalized = normalizePathname(basePath);
  const base = basePathNormalized === "/" ? "" : basePathNormalized;

  return (operationId: string) => `${base}${normalizePathname(operationId)}`;
};

export const OperationContainer = <C>(basePath: string) => {
  const endpoint_ids = new Set();
  const endpoints = new Map<string, XrpcOperation<any, C>>();

  const getOperationPath = operationPathMapper(basePath);

  return {
    add: (endpoint: XrpcOperation<any, C>) => {
      const opPath = getOperationPath(endpoint.id);

      if (endpoint_ids.has(endpoint.id)) {
        throw new Error(`Duplicate endpoint id: ${endpoint.id}`);
      }

      endpoint_ids.add(opPath);
      endpoints.set(opPath, endpoint);

      return opPath;
    },

    get: (pathname: string) => endpoints.get(pathname),
  };
};