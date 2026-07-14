const express = require("express");
const User = require("../models/User");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const ALLOWED_MAPS = ["map1", "map2", "map3"];

// PATCH /api/users/me — บันทึกความคืบหน้าปัจจุบันของผู้เล่น (xp, level, ด่านที่ผ่าน, แผนที่/ตัวละครที่เลือก)
// ต้องแนบ Authorization: Bearer <token> มาด้วยเสมอ (เช็คผ่าน requireAuth)
router.patch("/me", requireAuth, async (req, res) => {
    try {
        const { xp, level, clearedSubStages, selectedMap, selectedCharacter, title } = req.body;

        const update = {};

        if (xp !== undefined) {
            if (typeof xp !== "number" || xp < 0) {
                return res.status(400).json({ error: "xp ต้องเป็นตัวเลขที่ไม่ติดลบ" });
            }
            update.xp = xp;
        }

        if (level !== undefined) {
            if (typeof level !== "number" || level < 1) {
                return res.status(400).json({ error: "level ต้องเป็นตัวเลขตั้งแต่ 1 ขึ้นไป" });
            }
            update.level = level;
        }

        if (clearedSubStages !== undefined) {
            if (!Array.isArray(clearedSubStages) || !clearedSubStages.every((s) => typeof s === "string")) {
                return res.status(400).json({ error: "clearedSubStages ต้องเป็น array ของ string" });
            }
            update.clearedSubStages = clearedSubStages;
        }

        if (selectedMap !== undefined) {
            if (!ALLOWED_MAPS.includes(selectedMap)) {
                return res.status(400).json({ error: "selectedMap ไม่ถูกต้อง" });
            }
            update.selectedMap = selectedMap;
        }

        if (selectedCharacter !== undefined) {
            if (typeof selectedCharacter !== "string" || selectedCharacter.length > 60) {
                return res.status(400).json({ error: "selectedCharacter ไม่ถูกต้อง" });
            }
            update.selectedCharacter = selectedCharacter;
        }

        if (title !== undefined) {
            if (typeof title !== "string" || title.length > 100) {
                return res.status(400).json({ error: "title ไม่ถูกต้อง" });
            }
            update.title = title;
        }

        const user = await User.findByIdAndUpdate(req.userId, update, {
            new: true,
            runValidators: true,
        });

        if (!user) {
            return res.status(404).json({ error: "ไม่พบผู้ใช้นี้ในระบบ" });
        }

        return res.json({ user: user.toSafeJSON() });
    } catch (err) {
        console.error("[Users] update progress error:", err.message);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดที่ server กรุณาลองใหม่ภายหลัง" });
    }
});

module.exports = router;
