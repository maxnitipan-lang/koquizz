require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");
const connectDB = require('./db');
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const stagesRoutes = require("./routes/stages");
const leaderboardRoutes = require("./routes/leaderboard");

const app = express();

// อนุญาตเฉพาะโดเมนที่ระบุใน CORS_ORIGIN (คั่นด้วย comma) ให้เรียก API ได้
const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // อนุญาต request ที่ไม่มี origin (เช่น Postman/mobile app)
            // และ origin ที่อยู่ใน whitelist
            // เพิ่ม "null" ด้วย เพราะเบราว์เซอร์ส่ง Origin: null (เป็น string จริงๆ)
            // มาให้ตอนเปิดไฟล์ .html ตรงๆ แบบ file:// (ไม่ได้เปิดผ่าน web server)
            if (!origin || origin === "null" || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("CORS: origin นี้ไม่ได้รับอนุญาต"));
        },
    })
);

app.use(helmet()); // ล็อกประตูหน้าต่างพื้นฐานให้อัตโนมัติ
app.use(morgan("dev")); // log ทุก request ที่เข้ามา (โชว์ใน terminal)

app.use(express.json({ limit: "50kb" }));

app.use(mongoSanitize()); // กรองข้อมูลอันตรายที่อาจหลอกฐานข้อมูล (ต้องมาหลัง express.json เสมอ)

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/stages", stagesRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

// จับ error ที่หลุดมาจาก route ทั้งหมด (เช่น CORS error ด้านบน)
app.use((err, req, res, next) => {
    console.error("[Server] Unhandled error:", err.message);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่ server" });
});

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`[Server] KoQuizz backend กำลังทำงานที่ http://localhost:${PORT}`);
    });
});