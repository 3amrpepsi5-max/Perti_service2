import { io } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";

class SocketManager {
  constructor(zone = "nozha2") {
    this.zone = zone;
    this.socket = null;
  }

  connect() {
    this.socket = io(
      window.SOCKET_URL || "http://localhost:3001",
      {
        auth: {
          token: localStorage.getItem("auth_token")
        },
        transports: ["websocket"]
      }
    );

    this.socket.on("connect", () => {
      console.log("✅ WebSocket Connected");
      this.socket.emit("join:zone", this.zone);
    });

    return this.socket;
  }
}

export default SocketManager;