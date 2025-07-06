const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");

// Register new user
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    body("company")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Company name must be between 2 and 100 characters"),
    body("role")
      .optional()
      .isIn(["admin", "manager", "user"])
      .withMessage("Role must be one of: admin, manager, user"),
    body("department")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Department name must be less than 100 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const {
        name,
        email,
        password,
        company,
        role = "user",
        department,
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          error: "User already exists with this email",
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user with role
      const user = new User({
        id: uuidv4(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        company: company.trim(),
        department: department ? department.trim() : undefined,
        role: role,
        lastLogin: new Date(),
        isActive: true,
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Log the registration
      console.log(`New user registered: ${user.email} with role: ${user.role}`);

      res.status(201).json({
        message: "User registered successfully",
        user: user.toJSON(),
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);

      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          error: "User already exists with this email",
        });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Login user
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: "Account has been deactivated. Please contact support.",
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Log the login
      console.log(`User logged in: ${user.email}`);

      res.json({
        message: "Login successful",
        user: user.toJSON(),
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get current user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // req.user is already populated by authMiddleware
    res.json({
      user: req.user.toJSON(),
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Refresh token
router.post("/refresh", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: "Account has been deactivated",
      });
    }

    // Generate new token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Token refreshed successfully",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout (optional - mainly for logging purposes since JWT is stateless)
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    console.log(`User logged out: ${req.user.email}`);

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change password
router.put(
  "/change-password",
  authMiddleware,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "New password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Find user with password
      const user = await User.findOne({ id: req.user.id });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          error: "Current password is incorrect",
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedNewPassword;
      await user.save();

      console.log(`Password changed for user: ${user.email}`);

      res.json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update user settings
router.put(
  "/settings",
  authMiddleware,
  [
    body("settings")
      .optional()
      .isObject()
      .withMessage("Settings must be an object"),
    body("timezone")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Timezone is required if provided"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { settings, timezone } = req.body;
      const updateData = {};

      // Update settings if provided
      if (settings) {
        // Merge with existing settings
        const user = await User.findOne({ id: req.user.id });
        updateData.settings = {
          ...user.settings,
          ...settings,
          // Ensure nested objects are properly merged
          notifications: {
            ...user.settings?.notifications,
            ...settings.notifications,
          },
          privacy: {
            ...user.settings?.privacy,
            ...settings.privacy,
          },
          tracking: {
            ...user.settings?.tracking,
            ...settings.tracking,
          },
        };
      }

      // Update timezone if provided
      if (timezone) {
        updateData.timezone = timezone.trim();
      }

      const updatedUser = await User.findOneAndUpdate(
        { id: req.user.id },
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`Settings updated for user: ${updatedUser.email}`);

      res.json({
        message: "Settings updated successfully",
        user: updatedUser.toJSON(),
      });
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Forgot password (generate reset token)
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({
          message:
            "If an account with that email exists, a password reset link has been sent.",
        });
      }

      // Generate reset token (valid for 1 hour)
      const resetToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          type: "password_reset",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // TODO: Send email with reset link
      // For now, we'll just log it (in production, integrate with email service)
      const frontendUrl =
        process.env.FRONTEND_URL ||
        "https://hubstaff-node-js-git-main-balogunsamuels-projects.vercel.app";
      console.log(`Password reset requested for: ${user.email}`);
      console.log(
        `Reset link: ${frontendUrl}/reset-password?token=${resetToken}`
      );

      res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
        // Remove this in production - only for development
        resetToken:
          process.env.NODE_ENV === "development" ? resetToken : undefined,
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Reset password with token
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    body("confirmPassword").custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match");
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          errors: errors.array(),
        });
      }

      const { token, newPassword } = req.body;

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if token is specifically for password reset
        if (decoded.type !== "password_reset") {
          return res.status(400).json({
            error: "Invalid reset token",
          });
        }
      } catch (error) {
        return res.status(400).json({
          error: "Invalid or expired reset token",
        });
      }

      // Find user
      const user = await User.findOne({
        id: decoded.id,
        email: decoded.email,
      });

      if (!user) {
        return res.status(400).json({
          error: "Invalid reset token",
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedPassword;
      await user.save();

      console.log(`Password reset completed for user: ${user.email}`);

      res.json({
        message: "Password reset successful",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Verify token (check if token is valid)
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    res.json({
      valid: true,
      user: req.user.toJSON(),
    });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
