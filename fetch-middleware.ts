/**
 * TODO
 */
type FetchMiddleware = (
  request: Request,
  next: (request: Request) => Response
) => Promise<Response>;

const compose = (...middlewares: FetchMiddleware[]) => {
  return (request: Request) => {
    let index = -1;

    const dispatch = (request: Request) => {
      index += 1;
      const middleware = middlewares[index];

      if (!middleware) {
        throw new Error("Missing handler");
      }

      return middleware(request, dispatch);
    };

    return dispatch(request);
  };
};

const x = compose(
  async (request, next) => {
    console.log("first middleware");
    return await next(request);
  },
  async (request, next) => {
    console.log("second middleware");
    return await next(request);
  },

  // This is the last middleware, so it doesn't (and must not) call next.
  () => {
    console.log("third middleware");
    return Promise.resolve(new Response("Hello World"));
  }
);

const response = await x(new Request("https://google.com"));

console.log(response);