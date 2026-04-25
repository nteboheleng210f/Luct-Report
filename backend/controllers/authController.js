const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");


const registerUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      confirmPassword,
      phone,
      role,
    } = req.body;

    // validation
    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !phone ||
      !role
    ) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUsers = await db
      .collection("users")
      .where("email", "==", email.trim())
      .get();

    if (!existingUsers.empty) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // save user
    const newUser = {
      username: username.trim(),
      email: email.trim(),
      password: hashedPassword,
      phone: phone.trim(),
      role,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("users").add(newUser);

    return res.status(201).json({
      message: "User registered successfully",
      userId: docRef.id,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // check if user exists
    const userSnapshot = await db
      .collection("users")
      .where("email", "==", email.trim())
      .get();

    if (userSnapshot.empty) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

   
    const isMatch = await bcrypt.compare(
      password,
      userData.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: userDoc.id,
        email: userData.email,
        role: userData.role,
      },
      process.env.JWT_SECRET || "secretkey",
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: userDoc.id,
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
      },
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
};