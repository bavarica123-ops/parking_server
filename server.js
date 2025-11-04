const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "web")));

let parkedCars = []; // { number, time, confirmed }

app.post("/park", (req, res) => {
  const { number, time } = req.body;
  console.log(`🚗 등록됨: ${number}`);

  parkedCars = parkedCars.filter((c) => c.number !== number);
  parkedCars.push({ number, time, confirmed: false });

  io.emit("update", parkedCars);
  res.sendStatus(200);
});

app.post("/confirm", (req, res) => {
  const { number } = req.body;
  const car = parkedCars.find((c) => c.number === number);
  if (car) {
    car.confirmed = true;
    console.log(`✅ 확인됨: ${number}`);
    io.emit("update", parkedCars);
    res.sendStatus(200);
  } else {
    res.status(404).send("등록된 번호가 없습니다.");
  }
});

app.post("/remove", (req, res) => {
  const { number } = req.body;
  parkedCars = parkedCars.filter((c) => c.number !== number);
  console.log(`🗑️ 삭제됨: ${number}`);
  io.emit("update", parkedCars);
  res.sendStatus(200);
});

app.get("/parked", (req, res) => {
  res.json(parkedCars);
});

io.on("connection", (socket) => {
  console.log("📡 연결됨:", socket.id);
  socket.emit("update", parkedCars);

  socket.on("disconnect", () => console.log("❌ 연결 해제:", socket.id));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
