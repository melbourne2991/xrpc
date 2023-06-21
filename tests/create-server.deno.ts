import { Server } from "https://deno.land/std@0.192.0/http/server.ts"

export const createServer = async (
  handler: (request: Request) => Promise<Response>
) => {
  const server = new Server({
    hostname: "localhost",
    port: 8046,
    handler,
  });
  const finished = server.listenAndServe();
  await new Promise((resolve) => setTimeout(resolve, 50));

  return async () => {
    server.close();
    await finished;
  };
};