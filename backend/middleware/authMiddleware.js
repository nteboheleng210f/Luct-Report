const admin = require("../config/firebaseAdmin");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // VERIFY Firebase token
    const decoded = await admin.auth().verifyIdToken(token);

    // GET role from Firestore (IMPORTANT)
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(decoded.uid)
      .get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const userData = userDoc.data();

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      role: userData.role || "student",
      username: userData.username || "",
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access",
    });
  }
};

module.exports = authMiddleware;