const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log("Servidor iniciado en puerto", PORT);

wss.on("connection", (ws) => {
    console.log("Cliente conectado");

    ws.on("message", (message) => {
        console.log("Audio recibido:", message.length, "bytes");

        // Reenviar audio a todos menos al que envió el mensaje
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });

        console.log("Reenviando audio a", wss.clients.size - 1, "clientes");
    });

    ws.on("close", () => {
        console.log("Cliente desconectado");
    });
});
