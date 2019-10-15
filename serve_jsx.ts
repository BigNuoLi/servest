import React from "./vendor/https/dev.jspm.io/react/index.js";
import ReactDOMServer from "./vendor/https/dev.jspm.io/react-dom/server.js";
import { HttpHandler } from "./router.ts";
import { resolveIndexPath } from "./router_util.ts";

export type DFC<P = {}> = React.FC<P> & {
  getInitialProps?: () => Promise<P>;
};

/** Serve jsx/tsx by dynamic import */
export function serveJsx(
  dir: string,
  parentComponent: any = React.Fragment
): HttpHandler {
  return async function serveJsx(req) {
    const { pathname } = new URL(req.url, "http://dummy");
    const p = await resolveIndexPath(dir, pathname, [".tsx", ".jsx"]);
    if (p) {
      const jsx = await import(p);
      const el = jsx.default as DFC;
      if (!el) {
        throw new Error(
          "jsx: jsx/tsx files served by serveJsx must has default export!"
        );
      }
      if (typeof el !== "function") {
        throw new Error("jsx: default export must be React component!");
      }
      let props = {};
      if (typeof el.getInitialProps === "function") {
        props = await el.getInitialProps();
      }
      await req.respond({
        status: 200,
        headers: new Headers({
          "content-type": "text/html; charset=UTF-8"
        }),
        body: ReactDOMServer.renderToString(
          React.createElement(
            parentComponent,
            {},
            React.createElement(el, props, [])
          )
        )
      });
    }
  };
}