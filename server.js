
// server.js
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log("Servidor iniciado en puerto " + PORT);
});


app.get("/", (req, res) => {
  res.send("Servidor WebSocket activo");
});

wss.on("connection", (ws) => {
  console.log("Cliente conectado");

  ws.on("message", (message) => {
    console.log("Mensaje recibido:", message.toString());

    // Reenviar a todos los clientes
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Cliente desconectado");
  });
});

server.listen(PORT, () => {
  console.log("Servidor iniciado en puerto", PORT);
});

