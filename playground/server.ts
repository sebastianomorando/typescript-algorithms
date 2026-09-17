import page from "./index.html";

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT ?? 3000),
  routes: { "/": page },
  development: true,
});

console.log(`Tree Lab → ${server.url}`);
