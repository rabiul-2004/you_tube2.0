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
  // PeerServer is now mounted on the backend's own HTTP server under /peer
  // (single port = deployable on Render/Vercel/free tiers). Explicit override:
  // NEXT_PUBLIC_PEER_URL (http(s)://host[:port]) for advanced setups.
  const detected =
    (process.env.NEXT_PUBLIC_PEER_URL as string) ||
    (process.env.NEXT_PUBLIC_BACKEND_URL as string) ||
    `${window.location.protocol}//${window.location.hostname}:5000`;
  const raw = detected.includes("://") ? detected : `http://${detected}`;
  try {
    const url = new URL(raw);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80,
      path: "/peer",
      secure: url.protocol === "https:",
    };
  } catch {
    return { host: "localhost", port: 5000, path: "/peer", secure: false };
  }
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
        reconnectionAttempts: 3,
        timeout: 15000,
      });

      let settled = false;
      let lastError: string | null = null;
      let failTimer: ReturnType<typeof setTimeout> | null = null;

      const finish = (onSettle: () => void) => {
        if (settled) return;
        settled = true;
        if (failTimer) {
          clearTimeout(failTimer);
          failTimer = null;
        }
        cleanup();
        onSettle();
      };

      const onConnect = () => finish(() => resolve(s));
      const onConnectError = (err: Error & { description?: string; type?: string }) => {
        // A single transport failure (e.g. the flaky ws:// upgrade during local
        // dev) is NOT fatal: engine.io still tries the next transport in the
        // list (polling) and socket.io keeps reconnecting. Only give up if
        // nothing has connected within the deadline, otherwise callers reject
        // while the socket goes on to connect fine moments later.
        lastError = err?.message || err?.description || "Could not connect to the watch party server";
        if (!failTimer) {
          failTimer = setTimeout(() => {
            finish(() => reject(new Error(lastError || "Could not connect to the watch party server")));
          }, 6000);
        }
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
