import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;

export const getSocketUrl = () => {
  if (typeof window === "undefined") return null;
  const base =
    (process.env.NEXT_PUBLIC_BACKEND_URL as string) ||
    `${window.location.protocol}//${window.location.hostname}:5000`;
  return base.replace(/^http/, "ws");
};

export const getPeerUrl = () => {
  if (typeof window === "undefined") return null;
  const host =
    (process.env.NEXT_PUBLIC_PEER_URL as string) ||
    `${window.location.hostname}:9000`;
  return {
    host: host.split(":")[0],
    port: Number(host.split(":")[1] || 9000),
    path: "/",
  };
};

export async function getSocket(): Promise<Socket> {
  if (socket) return socket;
  if (connecting) return connecting;

  connecting = new Promise<Socket>((resolve, reject) => {
    (async () => {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      try {
        await Promise.race([
          auth.authStateReady(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("Timed out signing in")), 12000)),
        ]);
      } catch (e) {
        reject(e as Error);
        return;
      }
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        reject(new Error("You need to be signed in to join a watch party"));
        return;
      }
      const token = await firebaseUser.getIdToken();
      const url = getSocketUrl();
      if (!url) {
        reject(new Error("Socket URL unavailable"));
        return;
      }
      const s = io(url, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 2,
        timeout: 15000,
      });

      const onConnect = () => {
        cleanup();
        resolve(s);
      };
      const onConnectError = (err: Error & { description?: string; type?: string }) => {
        cleanup();
        const detail =
          err?.message || err?.description || "Could not connect to the watch party server";
        console.error("[watchparty] socket connect_error:", err);
        reject(new Error(detail));
      };
      const cleanup = () => {
        s.off("connect", onConnect);
        s.off("connect_error", onConnectError);
      };

      s.on("connect", onConnect);
      s.on("connect_error", onConnectError);
    })();
  })
    .then((s) => {
      socket = s;
      return s;
    })
    .catch((e) => {
      socket = null;
      connecting = null;
      throw e;
    });

  return connecting;
}

export function closeSocket() {
  socket?.disconnect();
  socket = null;
  connecting = null;
}
