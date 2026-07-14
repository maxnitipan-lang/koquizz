const express = require("express");
const User = require("../models/User");

const router = express.Router();

// GET /api/leaderboard — อันดับผู้เล่นทั้งหมด เรียงจาก XP มาก -> น้อย
// เป็นข้อมูลสาธารณะ ไม่ต้องแนบ token ก็ดูได้ (ไม่ผ่าน requireAuth)
// รองรับ query param ?limit=50 (ปรับจำนวนอันดับที่ส่งกลับได้ ค่าเริ่มต้น 50 สูงสุด 200)
router.get("/", async (req, res) => {
    try {
        let limit = parseInt(req.query.limit, 10);
        if (!Number.isFinite(limit) || limit <= 0) limit = 50;
        limit = Math.min(limit, 200);

        const users = await User.find({})
            .sort({ xp: -1, level: -1 })
            .limit(limit)
            .select("username displayName xp level clearedSubStages selectedCharacter")
            .lean();

        const leaderboard = users.map((u) => ({
            username: u.username,
            displayName: u.displayName,
            xp: u.xp,
            level: u.level,
            clearedSubStages: u.clearedSubStages || [],
            selectedCharacter: u.selectedCharacter,
        }));

        return res.json({ leaderboard });
    } catch (err) {
        console.error("[Leaderboard] fetch error:", err.message);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดที่ server กรุณาลองใหม่ภายหลัง" });
    }
});

module.exports = router;
