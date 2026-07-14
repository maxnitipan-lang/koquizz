const mongoose = require("mongoose");

// คำถามแต่ละข้อในด่านย่อย
const questionSchema = new mongoose.Schema(
    {
        // questionId เดิมจากไฟล์ data.js (เก็บไว้เผื่ออ้างอิง/debug)
        questionId: { type: Number, required: true },
        q: { type: String, required: true, trim: true },
        choices: {
            type: [String],
            required: true,
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length >= 2,
                message: "choices ต้องมีอย่างน้อย 2 ตัวเลือก",
            },
        },
        // index ของคำตอบที่ถูกต้องใน choices (0-based) — ห้ามส่งให้ client ก่อนตอบ!
        answer: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

// ด่านย่อย (subStage) ภายในแต่ละด่านใหญ่ (stage)
const subStageSchema = new mongoose.Schema(
    {
        subStageId: { type: Number, required: true },
        name: { type: String, required: true, trim: true },
        bossName: { type: String, default: "" },
        bossIcon: { type: String, default: "" }, // class ไอคอน เช่น "fa-solid fa-bug"
        difficulty: { type: Number, default: 1, min: 1, max: 5 },
        questions: {
            type: [questionSchema],
            default: [],
        },
    },
    { _id: false }
);

// ด่านใหญ่ (stage) เช่น "เขียนโค้ดเบื้องต้น", "ประวัติศาสตร์ไทย"
const stageSchema = new mongoose.Schema(
    {
        // stageId เดิมจาก key ของ STAGES_DATA (1, 2, 3, ...) ใช้ query/อ้างอิงจาก frontend
        stageId: { type: Number, required: true, unique: true },
        title: { type: String, required: true, trim: true },
        desc: { type: String, default: "" },
        subStages: {
            type: [subStageSchema],
            default: [],
        },
    },
    { timestamps: true }
);

// เวลาส่งให้ client เล่นเกม ไม่ควรส่ง "answer" ไปด้วย (กันโกงเปิด dev tools ดูเฉลย)
stageSchema.methods.toPlayerJSON = function () {
    return {
        stageId: this.stageId,
        title: this.title,
        desc: this.desc,
        subStages: this.subStages.map((sub) => ({
            subStageId: sub.subStageId,
            name: sub.name,
            bossName: sub.bossName,
            bossIcon: sub.bossIcon,
            difficulty: sub.difficulty,
            questions: sub.questions.map((qs) => ({
                questionId: qs.questionId,
                q: qs.q,
                choices: qs.choices,
                // ไม่ส่ง answer กลับไป
            })),
        })),
    };
};

module.exports = mongoose.model("Stage", stageSchema);
