import { PeerServer } from "peer";

let peerServerInstance = null;

export function startPeerServer(port) {
  if (peerServerInstance) return peerServerInstance;
  try {
    peerServerInstance = PeerServer(
      {
        port,
        path: "/",
        allow_discovery: true,
      },
      () => {
        console.log(`PeerServer running on port ${port}`);
      }
    );
    peerServerInstance.on("error", (error) => {
      console.error("PeerServer error:", error.message);
    });
  } catch (error) {
    console.error("Failed to start PeerServer:", error.message);
    peerServerInstance = null;
  }
  return peerServerInstance;
}
