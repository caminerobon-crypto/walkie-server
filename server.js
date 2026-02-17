const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

const clients = new Map();

// 👇 CAMBIA LOS USUARIOS QUE QUIERAS AUTORIZAR
const allowedUsers = ["juan", "carlos"];

wss.on("connection", (ws) => {

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "register") {
      if (!allowedUsers.includes(data.userId)) {
        ws.send(JSON.stringify({ type: "error", message: "No autorizado" }));
        ws.close();
        return;
      }

      clients.set(data.userId, ws);
      ws.userId = data.userId;
      console.log(data.userId + " conectado");
    }

    if (data.target && clients.has(data.target)) {
      clients.get(data.target).send(JSON.stringify(data));
    }
  });

  ws.on("close", () => {
    if (ws.userId) {
      clients.delete(ws.userId);
      console.log(ws.userId + " desconectado");
    }
  });

});

console.log("Servidor iniciado en puerto 3000");
