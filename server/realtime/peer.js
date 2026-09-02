import { ExpressPeerServer } from "peer";
import { WebSocketServer } from "ws";

let peerServerInstance = null;
let peerWss = null;

export function mountPeerServer(app, httpServer, { path = "/peer" } = {}) {
  if (peerServerInstance) return peerServerInstance;
  // ExpressPeerServer internally does `app.use(options.path, api)` and derives
  // its WebSocket path from options.path, so mount the returned app at ROOT.
  //
  // Peer and Socket.IO both run on this same http.Server. If peer's ws server
  // attaches to the server's 'upgrade' event (the default when passed a
  // `server`), it fights socket.io's ws server for every upgrade: each one
  // ABORTS a request whose path it does not own (ws lib line ~277), so one
  // destroys the other's sockets ("Invalid WebSocket frame: RSV1 must be
  // clear" on the socket.io client, or peer never connecting). Fix: give peer
  // a noServer ws (no upgrade listener of its own, compression off) and route
  // ONLY the /peer upgrades to it via a single upgrade dispatcher registered
  // at the FRONT of the listener list, leaving everything else to socket.io.
  peerWss = null;
  peerServerInstance = ExpressPeerServer(httpServer, {
    path,
    allow_discovery: true,
    createWebSocketServer: (options) => {
      const { server: _server, path: _p, ...rest } = options;
      peerWss = new WebSocketServer({ ...rest, noServer: true, perMessageDeflate: false });
      return peerWss;
    },
  });
  peerServerInstance.on?.("error", (error) => {
    console.error("PeerServer error:", error.message);
  });
  app.use(peerServerInstance);

  httpServer.prependListener("upgrade", (req, socket, head) => {
    const pathname = (req.url || "").split("?")[0];
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      peerWss.handleUpgrade(req, socket, head, (ws) => {
        peerWss.emit("connection", ws, req);
      });
    }
    // Any other path is left to socket.io's own upgrade listener.
  });

  console.log(`PeerServer mounted at ${path} on the main HTTP server`);
  return peerServerInstance;
}