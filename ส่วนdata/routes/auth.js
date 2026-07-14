const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();

// จำกัดจำนวนครั้งที่ยิง login/register ได้ ป้องกัน brute-force เดารหัสผ่าน
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 20,                  // สูงสุด 20 ครั้งต่อ IP ต่อช่วงเวลา
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "พยายามเข้าสู่ระบบ/สมัครบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่" },
});

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,32}$/;

function signToken(userId) {
    return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
}

// POST /api/auth/register
router.post("/register", authLimiter, async (req, res) => {
    try {
        const { username, password, displayName } = req.body;

        if (!username || !password || !displayName) {
            return res.status(400).json({ error: "กรุณากรอก username, password และชื่อที่ใช้แสดงในเกม" });
        }
        if (!USERNAME_REGEX.test(username)) {
            return res.status(400).json({
                error: "username ต้องมี 3-32 ตัวอักษร ใช้ได้แค่ a-z, A-Z, 0-9 และ _ เท่านั้น",
            });
        }
        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ error: "password ต้องมีอย่างน้อย 6 ตัวอักษร" });
        }
        if (typeof displayName !== "string" || displayName.trim().length < 1 || displayName.length > 40) {
            return res.status(400).json({ error: "ชื่อที่แสดงในเกมไม่ถูกต้อง" });
        }

        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: "username นี้มีคนใช้แล้ว กรุณาเลือกชื่ออื่น" });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            username: username.toLowerCase(),
            displayName: displayName.trim(),
            passwordHash,
        });

        const token = signToken(user._id);
        return res.status(201).json({ token, user: user.toSafeJSON() });
    } catch (err) {
        console.error("[Auth] register error:", err.message);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดที่ server กรุณาลองใหม่ภายหลัง" });
    }
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "กรุณากรอก username และ password" });
        }

        const user = await User.findOne({ username: username.toLowerCase() });
        // ข้อความ error ตั้งใจให้เหมือนกันทั้งกรณี username ไม่พบ/password ผิด
        // เพื่อไม่ให้คนร้ายรู้ว่า username ไหนมีอยู่จริงในระบบ
        const invalidMsg = { error: "username หรือ password ไม่ถูกต้อง" };

        if (!user) {
            return res.status(401).json(invalidMsg);
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json(invalidMsg);
        }

        const token = signToken(user._id);
        return res.json({ token, user: user.toSafeJSON() });
    } catch (err) {
        console.error("[Auth] login error:", err.message);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดที่ server กรุณาลองใหม่ภายหลัง" });
    }
});

// GET /api/auth/me — ดึงข้อมูล user ปัจจุบันจาก token (ใช้เช็คว่ายัง login อยู่ไหมตอนเปิดเกมใหม่)
router.get("/me", requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: "ไม่พบผู้ใช้นี้ในระบบ" });
        }
        return res.json({ user: user.toSafeJSON() });
    } catch (err) {
        console.error("[Auth] me error:", err.message);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดที่ server" });
    }
});

module.exports = router;
