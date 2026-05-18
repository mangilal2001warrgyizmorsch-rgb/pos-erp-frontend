import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/constants";

// Strip the '/api' subpath to get the base HTTP server URL
const socketUrl = API_BASE_URL.replace("/api", "");

let socket: Socket | null = null;

/**
 * Get unified Socket.IO client instance
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      upgrade: true,
      secure: false,
      rejectUnauthorized: false,
      forceNew: false,
      multiplex: true,
      path: "/socket.io/",
      query: {}
    });

    socket.on("connect", () => {
      console.log(`[Socket.IO Client] Connected to backend! Socket ID: ${socket?.id}`);
    });

    socket.on("disconnect", (reason) => {
      console.warn(`[Socket.IO Client] Disconnected! Reason: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      console.error("[Socket.IO Client] Connection Error:", error);
    });

    socket.on("error", (error) => {
      console.error("[Socket.IO Client] Socket Error:", error);
    });
  }
  
  return socket;
};
