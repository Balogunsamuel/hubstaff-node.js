const express = require("express");
const {
  JWTHandler,
  ACCESS_TOKEN_EXPIRE_MINUTES,
} = require("../auth/jwt_handler");
const { getCurrentUser } = require("../auth/dependencies");
const { DatabaseOperations } = require("../database/mongodb");
const {
  User,
  validateUserCreate,
  validateUserLogin,
  createUserFromData,
} = require("../models/User");

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    // Validate input
    const userData = validateUserCreate(req.body);

    // Check if user already exists
    const existingUser = await DatabaseOperations.getDocument("users", {
      email: userData.email,
    });
    if (existingUser) {
      return res.status(400).json({
        error: "Email already registered",
        message: "A user with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = JWTHandler.hashPassword(userData.password);

    // Create user
    const user = createUserFromData({
      name: userData.name,
      email: userData.email,
      company: userData.company,
      role: userData.role,
    });

    const userDoc = user.toJSON();
    userDoc.password = hashedPassword;

    await DatabaseOperations.createDocument("users", userDoc);

    // Create tokens
    const accessToken = JWTHandler.createAccessToken(
      { sub: user.id },
      `${ACCESS_TOKEN_EXPIRE_MINUTES}m`
    );
    const refreshToken = JWTHandler.createRefreshToken({ sub: user.id });

    res.status(201).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      user: user.toResponse(),
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.message.includes("Validation error")) {
      return res.status(400).json({
        error: "Validation Error",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Registration failed",
      message: "Internal server error during registration",
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    // Validate input
    const credentials = validateUserLogin(req.body);

    // Get user
    const userData = await DatabaseOperations.getDocument("users", {
      email: credentials.email,
    });
    if (
      !userData ||
      !JWTHandler.verifyPassword(credentials.password, userData.password)
    ) {
      return res.status(401).json({
        error: "Invalid credentials",
        message: "Incorrect email or password",
      });
    }

    const user = createUserFromData(userData);

    // Update last active and status
    await DatabaseOperations.updateDocument(
      "users",
      { id: user.id },
      {
        status: "active",
        last_active: new Date(),
      }
    );

    // Create tokens
    const accessToken = JWTHandler.createAccessToken(
      { sub: user.id },
      `${ACCESS_TOKEN_EXPIRE_MINUTES}m`
    );
    const refreshToken = JWTHandler.createRefreshToken({ sub: user.id });

    res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      user: user.toResponse(),
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error.message.includes("Validation error")) {
      return res.status(400).json({
        error: "Validation Error",
        message: error.message,
      });
    }

    res.status(500).json({
      error: "Login failed",
      message: "Internal server error during login",
    });
  }
});

// Logout user
router.post("/logout", getCurrentUser, async (req, res) => {
  try {
    const user = req.user;

    // Update user status
    await DatabaseOperations.updateDocument(
      "users",
      { id: user.id },
      { status: "offline" }
    );

    res.json({ message: "Successfully logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: "Logout failed",
      message: "Internal server error during logout",
    });
  }
});

// Get current user information
router.get("/me", getCurrentUser, async (req, res) => {
  try {
    const user = createUserFromData(req.user);
    res.json(user.toResponse());
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      error: "Failed to get user information",
      message: "Internal server error",
    });
  }
});

// Refresh access token
router.post("/refresh", async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: "Refresh token required",
        message: "Please provide a refresh token",
      });
    }

    const decoded = JWTHandler.verifyToken(refresh_token);
    if (!decoded) {
      return res.status(401).json({
        error: "Invalid refresh token",
        message: "Refresh token is invalid or expired",
      });
    }

    // Verify user still exists
    const userData = await DatabaseOperations.getDocument("users", {
      id: decoded.sub,
    });
    if (!userData) {
      return res.status(401).json({
        error: "User not found",
        message: "User associated with token not found",
      });
    }

    // Create new access token
    const accessToken = JWTHandler.createAccessToken(
      { sub: decoded.sub },
      `${ACCESS_TOKEN_EXPIRE_MINUTES}m`
    );

    res.json({
      access_token: accessToken,
      token_type: "bearer",
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      error: "Token refresh failed",
      message: "Internal server error during token refresh",
    });
  }
});

module.exports = router;
