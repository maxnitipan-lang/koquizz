const express = require("express");
const Stage = require("../models/Stage");

const router = express.Router();

// GET /api/stages — ดึงด่านทั้งหมด (ไม่ส่งเฉลย "answer" ไปด้วย ป้องกันโกง)
router.get("/", async (req, res) => {
    try {
        const stages = await Stage.find().sort({ stageId: 1 });
        return res.json({ stages: stages.map((s) => s.toPlayerJSON()) });
    } catch (err) {
        console.error("[Stages] get all error:", err.message);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดที่ server" });
    }
});

// GET /api/stages/:stageId — ดึงด่านเดียว (ใช้ตอนเข้าเล่นด่านนั้นๆ)
router.get("/:stageId", async (req, res) => {
    try {
        const stageId = Number(req.params.stageId);
        if (!Number.isInteger(stageId)) {
            return res.status(400).json({ error: "stageId ต้องเป็นตัวเลข" });
        }

        const stage = await Stage.findOne({ stageId });
        if (!stage) {
            return res.status(404).json({ error: "ไม่พบด่านนี้" });
        }

        return res.json({ stage: stage.toPlayerJSON() });
    } catch (err) {
        console.error("[Stages] get one error:", err.message);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดที่ server" });
    }
});

// POST /api/stages/:stageId/substages/:subStageId/verify
// ใช้เช็คคำตอบฝั่ง server แทนการเปิดเผย "answer" ให้ client เห็นตรงๆ
// body: { questionId: number, selected: number }
router.post("/:stageId/substages/:subStageId/verify", async (req, res) => {
    try {
        const stageId = Number(req.params.stageId);
        const subStageId = Number(req.params.subStageId);
        const { questionId, selected } = req.body;

        if (!Number.isInteger(questionId) || !Number.isInteger(selected)) {
            return res.status(400).json({ error: "questionId และ selected ต้องเป็นตัวเลข" });
        }

        const stage = await Stage.findOne({ stageId });
        if (!stage) {
            return res.status(404).json({ error: "ไม่พบด่านนี้" });
        }

        const subStage = stage.subStages.find((s) => s.subStageId === subStageId);
        if (!subStage) {
            return res.status(404).json({ error: "ไม่พบด่านย่อยนี้" });
        }

        const question = subStage.questions.find((q) => q.questionId === questionId);
        if (!question) {
            return res.status(404).json({ error: "ไม่พบคำถามนี้" });
        }

        const isCorrect = question.answer === selected;
        return res.json({ correct: isCorrect, correctAnswer: question.answer });
    } catch (err) {
        console.error("[Stages] verify error:", err.message);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดที่ server" });
    }
});

module.exports = router;
