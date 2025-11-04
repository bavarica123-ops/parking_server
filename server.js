const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "web"))); // 웹 폴더 서빙

// 주차된 차량 정보 저장
let parkedCars = [];

// ✅ 주차 등록 (휴대폰 → 서버)
app.post("/park", (req, res) => {
  const { number, time } = req.body;
  console.log(`🚗 차량 등록됨: ${number}`);

  // 중복 번호 제거 후 추가
  parkedCars = parkedCars.filter((c) => c.number !== number);
  parkedCars.push({ number, time, confirmed: false });

  io.emit("update", parkedCars); // 웹 실시간 업데이트
  res.sendStatus(200);
});

// ✅ 차량 리스트 가져오기 (웹 초기 로딩)
app.get("/parked", (req, res) => {
  res.json(parkedCars);
});

// ✅ 차량 확인 (PC → 서버)
app.post("/confirm", (req, res) => {
  const { number } = req.body;
  const car = parkedCars.find((c) => c.number === number);

  if (car) {
    car.confirmed = true;
    console.log(`✅ 차량 확인됨: ${number}`);
    io.emit("update", parkedCars); // 모든 클라이언트에 반영
    return res.sendStatus(200);
  } else {
    console.log(`❌ 등록된 번호 아님: ${number}`);
    return res.status(404).send("등록된 번호가 없습니다");
  }
});

// ✅ 차량 삭제 (휴대폰에서 빈칸 클릭)
app.post("/remove", (req, res) => {
  const { number } = req.body;
  parkedCars = parkedCars.filter((c) => c.number !== number);
  console.log(`🗑️ 차량 삭제됨: ${number}`);
  io.emit("update", parkedCars);
  res.sendStatus(200);
});

// ✅ 실시간 연결
io.on("connection", (socket) => {
  console.log("📡 실시간 연결됨");
  socket.emit("update", parkedCars);
});

// ✅ Render용 포트 설정
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
