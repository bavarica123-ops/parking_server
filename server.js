import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("web"));

// ✅ 고정된 3칸 주차 상태 관리
let parkedSpots = [
  { index: 0, number: "", time: "", confirmed: false },
  { index: 1, number: "", time: "", confirmed: false },
  { index: 2, number: "", time: "", confirmed: false },
];

// 🚗 차량 등록 (index 포함)
app.post("/park", (req, res) => {
  const { number, time, index } = req.body;
  if (index < 0 || index > 2) return res.status(400).send("잘못된 인덱스");

  parkedSpots[index] = { index, number, time, confirmed: false };
  io.emit("update", parkedSpots);
  console.log(`✅ 차량 등록: ${number} (${index + 1}번 칸)`);
  res.sendStatus(200);
});

// 🗑️ 차량 삭제
app.post("/remove", (req, res) => {
  const { index } = req.body;
  if (index < 0 || index > 2) return res.status(400).send("잘못된 인덱스");

  parkedSpots[index] = { index, number: "", time: "", confirmed: false };
  io.emit("update", parkedSpots);
  console.log(`🗑️ ${index + 1}번 칸 비워짐`);
  res.sendStatus(200);
});

// ✅ 차량 확인 (웹에서 입력 시)
app.post("/confirm", (req, res) => {
  const { number } = req.body;
  const spot = parkedSpots.find((s) => s.number === number);
  if (spot) {
    spot.confirmed = true;
    io.emit("update", parkedSpots);
    console.log(`💚 차량 확인 완료: ${number}`);
    res.sendStatus(200);
  } else {
    res.status(404).send("등록된 차량이 없습니다.");
  }
});

// 🧾 현재 상태 불러오기
app.get("/parked", (req, res) => {
  res.json(parkedSpots);
});

// 🌐 웹 페이지
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/web/index.html");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
