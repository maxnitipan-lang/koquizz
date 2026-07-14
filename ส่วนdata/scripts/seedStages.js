// วิธีรัน: node scripts/seedStages.js
// สคริปต์นี้อ่านข้อมูลจาก data/stagesData.js แล้วบันทึก (upsert) เข้า MongoDB
// รันครั้งเดียวตอน setup หรือรันซ้ำได้ทุกครั้งที่แก้ข้อมูลคำถาม (จะอัปเดตทับของเดิม ไม่สร้างซ้ำ)

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../db");
const Stage = require("../models/Stage");
const STAGES_DATA = require("../data/stagesData");

async function seed() {
    await connectDB();

    const stageKeys = Object.keys(STAGES_DATA); // ["1","2",...,"13"]
    console.log(`[Seed] พบข้อมูลทั้งหมด ${stageKeys.length} ด่านใน data/stagesData.js`);

    let successCount = 0;

    for (const key of stageKeys) {
        const raw = STAGES_DATA[key];
        const stageId = Number(key);

        const subStages = (raw.subStages || []).map((sub) => ({
            subStageId: sub.id,
            name: sub.name,
            bossName: sub.bossName,
            bossIcon: sub.bossIcon,
            difficulty: sub.difficulty,
            questions: (sub.questions || []).map((q) => ({
                questionId: q.id,
                q: q.q,
                choices: q.choices,
                answer: q.answer,
            })),
        }));

        await Stage.findOneAndUpdate(
            { stageId },
            {
                stageId,
                title: raw.title,
                desc: raw.desc,
                subStages,
            },
            { upsert: true, new: true, runValidators: true }
        );

        successCount++;
        console.log(`[Seed] บันทึกด่านที่ ${stageId} (${raw.title}) สำเร็จ — ${subStages.length} ด่านย่อย`);
    }

    console.log(`[Seed] เสร็จสิ้น: บันทึกทั้งหมด ${successCount}/${stageKeys.length} ด่าน`);
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error("[Seed] เกิดข้อผิดพลาด:", err);
    process.exit(1);
});
