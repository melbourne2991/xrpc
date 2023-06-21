import { describe, it, assertEquals, spy } from "../deps-dev.ts";
import { Operation } from "../builder.ts";
import { Type } from "../typebox.ts";
import { createClient } from "../create-client.ts";
import { InferContextTypeFromFn } from "../types.ts";
import { createFetchHandler } from "../create-fetch-handler.ts";
import { createServer } from './create-server.deno.ts';

const simpleMutation = () => {
  return Operation()
    .mutation("first_mutation")
    .input(
      Type.Object({
        name: Type.String(),
      })
    )
    .output(
      Type.Object({
        result: Type.String(),
      })
    )
    .impl((ctx, input) => {
      return Promise.resolve({
        result: `Hello ${input.name}!`,
      });
    });
};

const simpleQuery = () =>
  Operation()
    .query("first_query")
    .input(
      Type.Object({
        name: Type.String(),
      })
    )
    .output(
      Type.Object({
        result: Type.String(),
      })
    )
    .impl((ctx, input) => {
      return Promise.resolve({
        result: `Hello ${input.name}!`,
      });
    });

describe("xrpc", () => {
  it("mutations", async () => {
    const operations = [simpleMutation()];

    const handler = createFetchHandler({
      operations,
      basePath: "/"
    });

    const closeServer = await createServer(handler);

    const client = createClient<typeof operations>("http://localhost:8046");

    const response = await client.mutation.first_mutation({ name: "Billy" });

    assertEquals(response.result, "Hello Billy!");

    await closeServer();
  });

  it("queries", async () => {
    const operations = [simpleQuery()];

    const handler = createFetchHandler({
      operations,
      basePath: "/",
    });

    const closeServer = await createServer(handler);

    const client = createClient<typeof operations>("http://localhost:8046");
    const response = await client.query.first_query({ name: "Billy" });

    assertEquals(response.result, "Hello Billy!");

    await closeServer();
  });

  it("supports no inputs", async () => {
    const testQuery = Operation()
      .query("first_query")
      .output(
        Type.Object({
          result: Type.String(),
        })
      )
      .impl((ctx, input) => {
        return Promise.resolve({
          result: `Hello!`,
        });
      });

    const operations = [testQuery];

    const handler = createFetchHandler({
      operations,
      basePath: "/",
    });

    const closeServer = await createServer(handler);

    const client = createClient<typeof operations>("http://localhost:8046");
    const response = await client.query.first_query();

    assertEquals(response.result, "Hello!");

    await closeServer();
  });

  it("supports no outputs", async () => {
    const implSpy = spy(async (ctx, input) => {});

    const testQuery = Operation()
      .query("first_query")
      .input(
        Type.Object({
          name: Type.String(),
        })
      )
      .impl(implSpy);

    const operations = [testQuery];

    const handler = createFetchHandler({
      operations,
      basePath: "/",
    });

    const closeServer = await createServer(handler);

    const client = createClient<typeof operations>("http://localhost:8046");

    const response = await client.query.first_query({
      name: "Billy",
    });

    assertEquals(implSpy.calls.length, 1);

    assertEquals(implSpy.calls[0].args[1], {
      name: "Billy",
    });

    await closeServer();
  });

  it("allows async context", async () => {
    const createContext = async () => {
      return {
        mycontext: "Magical",
      };
    };

    type TestContext = InferContextTypeFromFn<typeof createContext>;

    const testQuery = Operation<TestContext>()
      .query("first_query")
      .input(
        Type.Object({
          name: Type.String(),
        })
      )
      .output(
        Type.Object({
          result: Type.String(),
        })
      )
      .impl((ctx, input) => {
        return Promise.resolve({
          result: `Hello ${input.name}! Your context is ${ctx.mycontext}`,
        });
      });

    const operations = [testQuery];

    const handler = createFetchHandler({
      operations,
      basePath: "/",
      createContext,
    });

    const closeServer = await createServer(handler);

    const client = createClient<typeof operations>("http://localhost:8046");

    const response = await client.query.first_query({
      name: "Billy",
    });

    assertEquals(response.result, "Hello Billy! Your context is Magical");

    await closeServer();
  });

  it("allows sync context", async () => {
    const createContext = () => {
      return {
        mycontext: "Magical",
      };
    };

    type TestContext = InferContextTypeFromFn<typeof createContext>;

    const testQuery = Operation<TestContext>()
      .query("first_query")
      .input(
        Type.Object({
          name: Type.String(),
        })
      )
      .output(
        Type.Object({
          result: Type.String(),
        })
      )
      .impl((ctx, input) => {
        return Promise.resolve({
          result: `Hello ${input.name}! Your context is ${ctx.mycontext}`,
        });
      });

    const operations = [testQuery];

    const handler = createFetchHandler({
      operations,
      basePath: "/",
      createContext,
    });

    const closeServer = await createServer(handler);

    const client = createClient<typeof operations>("http://localhost:8046");

    const response = await client.query.first_query({
      name: "Billy",
    });

    assertEquals(response.result, "Hello Billy! Your context is Magical");

    await closeServer();
  });

  it("allows sync impl", async () => {
    const testQuery = Operation()
      .query("first_query")
      .input(
        Type.Object({
          name: Type.String(),
        })
      )
      .output(
        Type.Object({
          result: Type.String(),
        })
      )
      .impl((ctx, input) => {
        return {
          result: `Hello ${input.name}!`,
        };
      });

    const operations = [testQuery];

    const handler = createFetchHandler({
      operations,
      basePath: "/",
    });

    const closeServer = await createServer(handler);

    const client = createClient<typeof operations>("http://localhost:8046");

    const response = await client.query.first_query({
      name: "Billy",
    });

    assertEquals(response.result, "Hello Billy!");

    await closeServer();
  });
});
