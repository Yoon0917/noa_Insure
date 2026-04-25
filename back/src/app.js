const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 헬스 체크용 엔드포인트
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Noa Insure API is running!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend Server is running on http://localhost:${PORT}`);
});
