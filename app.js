const { Client, LegacySessionAuth } = require("whatsapp-web.js");
const fs = require("fs");
const socketIO = require("socket.io");
const express = require("express");
const qrcode = require("qrcode");
const http = require("http");
const { response } = require("express");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const SESSION_FILE_PATH = "./session.json";
let sessionData;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});
const client = new Client({
  authStrategy: new LegacySessionAuth({
    session: sessionData,
  }),
});

client.on("authenticated", (session) => {
  sessionData = session;
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
    if (err) {
      console.error(err);
    }
  });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message", (msg) => {
  if (msg.body == "dek") {
    msg.reply("iyaa?");
  }
});

client.initialize();

io.on("connection", function (socket) {
  socket.emit("message", "connecting...");
  client.on("qr", (qr) => {
    // Generate and scan this code with your phone
    console.log("QR RECEIVED", qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR Code receive");
    });
  });
  client.on("ready", () => {
    socket.emit("message", "whatssapp is ready");
  });
});

app.post("/send-message", (req, res) => {
  const number = req.body.number;
  const message = req.body.message;

  client
    .sendMessage(number, message)
    .then((response) => {
      res.status(200).json({
        status: true,
        response: response,
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: false,
        response: err,
      });
    });
});

server.listen(3000, function () {
  console.log("app runing ");
});