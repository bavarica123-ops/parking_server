import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ✅ 주차된 차량 데이터
let parkedCars = [];

// 📍 차량 등록
app.post("/park", (req, res) => {
  const { number, time } = req.body;
  if (!number) return res.status(400).json({ message: "번호 누락" });

  const exists = parkedCars.find((c) => c.number === number);
  if (!exists) {
    parkedCars.push({ number, time, status: "parked" });
    io.emit("update", JSON.stringify(parkedCars));
  }
  console.log("🚗 등록:", number);
  res.json({ success: true });
});

// 📍 차량 확인
app.post("/confirm", (req, res) => {
  const { number } = req.body;
  const found = parkedCars.find((c) => c.number === number);
  if (found) {
    found.status = "confirmed";
    io.emit("update", JSON.stringify(parkedCars));
    console.log("✅ 확인:", number);
    res.json({ success: true });
  } else {
    res.status(404).json({ message: "등록된 차량이 없습니다." });
  }
});

// 📍 차량 삭제
app.post("/remove", (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ message: "번호 누락" });

  parkedCars = parkedCars.filter((c) => c.number !== number);
  io.emit("update", JSON.stringify(parkedCars));

  console.log("🗑 삭제:", number);
  res.json({ success: true });
});

// 📍 차량 목록
app.get("/parked", (req, res) => {
  res.json(parkedCars);
});

// 📡 실시간 연결
io.on("connection", (socket) => {
  console.log("🌐 클라이언트 연결됨");
  socket.emit("update", JSON.stringify(parkedCars));
  socket.on("disconnect", () => console.log("❌ 연결 해제"));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 서버 실행 중: ${PORT}`));
