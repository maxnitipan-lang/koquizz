const mongoose = require("mongoose");

async function connectDB() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error("[DB] ไม่พบ MONGODB_URI ใน environment variables — ตรวจสอบไฟล์ .env");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log(`[DB] เชื่อมต่อ MongoDB สำเร็จ (${mongoose.connection.name})`);
    } catch (err) {
        console.error("[DB] เชื่อมต่อ MongoDB ไม่สำเร็จ:", err.message);
        process.exit(1);
    }

    mongoose.connection.on("disconnected", () => {
        console.warn("[DB] MongoDB หลุดการเชื่อมต่อ");
    });
}

module.exports = connectDB;
