const jwt = require("jsonwebtoken");

// middleware นี้เช็คว่า request มี token ที่ถูกต้องไหม ใช้ป้องกัน route ที่ต้อง login ก่อน
function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: "ไม่พบ token กรุณาเข้าสู่ระบบ" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.sub; // แนบ user id ไว้ให้ route ถัดไปใช้
        next();
    } catch (err) {
        return res.status(401).json({ error: "token ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
    }
}

module.exports = requireAuth;
