import * as http from "node:http";
import { FetchLikeRequest } from "../create-fetch-handler.ts";

export const createServer = async (
  handler: (request: Request) => Promise<Response>
) => {
  const server = http
    .createServer((req: any, res: any) => {
      const url = "http://localhost:8046" + req.url;

      let body = "";

      req.on("data", function (chunk: any) {
        body += chunk;
      });

      req.on("end", function () {
        let fetchReq: FetchLikeRequest;

        if (req.method.toLowerCase() === 'get' || req.method.toLowerCase() === 'head') {
          fetchReq = {
            url,
            method: req.method.toLowerCase(),
            json: async () => JSON.parse(body),
          }
        } else {
          fetchReq = {
            url,
            method: req.method.toLowerCase(),
            json: async () => JSON.parse(body),
          }
        }

        // TODO
        handler(fetchReq as Request).then((response) => {
          res.statusCode = response.status;
          Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });

          response.text().then((data) => {
            res.end(data);
          });
        });
      });
    })
    .listen(8046);

  await new Promise((resolve) => setTimeout(resolve, 50));

  return async () => {
    server.close();
  };
};
