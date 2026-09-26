import page from "./index.html";
import graphPage from "./graph.html";

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
  routes: { "/": page, "/index.html": page, "/graph.html": graphPage },
  development: true,
});

console.log(`Tree Lab → ${server.url}`);
