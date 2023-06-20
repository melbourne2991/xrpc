import { XrpcOperation } from "./types.ts";
import { OperationContainer } from "./operation-container.ts";
import { oas31 } from "./deps.ts";

function buildResponse(op: XrpcOperation): oas31.ResponsesObject {
  const output = op.output;

  if (output === undefined) {
    return {
      204: {
        description: "No Content",
      },
    };
  }

  return {
    200: {
      description: "Output",
      content: {
        "application/json": {
          schema: output,
        },
      },
    },
  };
}

function buildRequestBody(
  op: XrpcOperation
): oas31.RequestBodyObject {
  const input = op.input;

  if (input === undefined) {
    return {
      content: {
        "application/json": {
          schema: {
            type: "object",
          },
        },
      },
    };
  }

  return {
    content: {
      "application/json": {
        schema: input,
      },
    },
  };
}

function BuildParameters(
  op: XrpcOperation
): oas31.ParameterObject[] {
  const input = op.input;

  if (input === undefined) {
    return [];
  }

  return [
    {
      in: "query",
      name: "input",
      content: {
        "application/json": {
          schema: input,
        },
      },
    },
  ];
}

export interface BuildDocParams {
  basePath: string;
  operations: XrpcOperation[];
  info: oas31.InfoObject;
}

export function buildDoc({ basePath, operations, info }: BuildDocParams) {
  const opContainer = OperationContainer<unknown>(basePath);
  const builder = oas31.OpenApiBuilder.create();

  for (const operation of operations) {
    const opPath = opContainer.add(operation);

    builder.addInfo(info);

    if (operation.mutation) {
      builder.addPath(opPath, {
        post: {
          operationId: operation.id,
          requestBody: buildRequestBody(operation),
          responses: buildResponse(operation),
        },
      });
    } else {
      builder.addPath(opPath, {
        get: {
          operationId: operation.id,
          parameters: BuildParameters(operation),
          responses: buildResponse(operation),
        },
      });
    }
  }

  return builder.getSpec();
}
