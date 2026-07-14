const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // username ใช้ล็อกอิน — เก็บเป็นตัวพิมพ์เล็กเสมอเพื่อกันสมัครซ้ำด้วยตัวพิมพ์ต่างกัน
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 32,
        },
        // ชื่อที่โชว์ในเกม (คนละอันกับ username ก็ได้)
        displayName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 40,
        },
        // เก็บเฉพาะ hash ห้ามเก็บ password จริงเด็ดขาด
        passwordHash: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            default: "",
        },
        selectedCharacter: {
            type: String,
            default: null,
        },
        // แผนที่/ฉากต่อสู้ที่เลือกไว้ล่าสุด (map1 = น้ำแข็ง, map2 = ลาวา, map3 = สายฟ้า)
        selectedMap: {
            type: String,
            default: "map1",
        },
        xp: {
            type: Number,
            default: 0,
            min: 0,
        },
        level: {
            type: Number,
            default: 1,
            min: 1,
        },
        clearedSubStages: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true } // เพิ่ม createdAt / updatedAt ให้อัตโนมัติ
);

// เวลาส่ง user object กลับไปให้ client อย่าส่ง passwordHash ไปด้วยเด็ดขาด
userSchema.methods.toSafeJSON = function () {
    return {
        id: this._id,
        username: this.username,
        displayName: this.displayName,
        title: this.title,
        selectedCharacter: this.selectedCharacter,
        selectedMap: this.selectedMap,
        xp: this.xp,
        level: this.level,
        clearedSubStages: this.clearedSubStages,
        createdAt: this.createdAt,
    };
};

module.exports = mongoose.model("User", userSchema);