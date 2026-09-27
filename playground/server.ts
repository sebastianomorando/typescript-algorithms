import page from "./index.html";
import graphPage from "./graph.html";
import flowPage from "./flow.html";

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
  routes: { "/": page, "/index.html": page, "/graph.html": graphPage, "/flow.html": flowPage },
  development: true,
});

console.log(`Tree Lab → ${server.url}`);
