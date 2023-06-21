import { build, emptyDir } from "https://deno.land/x/dnt/mod.ts";

await emptyDir("../npm-dist");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm-dist",
  shims: {
    // see JS docs for overview and more options
    deno: true,
    timers: true,
    undici: true,
    domException: true,
    custom: [{
      package: { name: "stream/web" },
      globalNames: ['TransformStream']
    }]
  },
  mappings: {
    './tests/create-server.deno.ts': './tests/create-server.node.ts',
  },
  package: {
    // package.json properties
    name: "@melbourne2991/xrpc",
    version: Deno.args[0],
    description: "Simple RPC",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/meloburne2991/xrpc.git",
    },
    bugs: {
      url: "https://github.com/meloburne2991/xrpc/issues",
    },
    devDependencies: {
      "@types/node": "^16",
    },
  },
  scriptModule: false,
  compilerOptions: {
    importHelpers: true,
    lib: ["ES2021", "DOM"],
    target: "ES2021",
  },
  postBuild() {
    // steps to run after building and before running the tests
    // Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm-dist/README.md");
  },
});