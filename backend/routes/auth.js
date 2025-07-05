// Update your backend/routes/auth.js registration endpoint to handle roles

// Add this validation to your registration route
const { body, validationResult } = require("express-validator");

router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("company")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Company name is required"),
    body("role")
      .optional()
      .isIn(["admin", "manager", "user"])
      .withMessage("Invalid role specified"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, company, role = "user" } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ error: "User already exists with this email" });
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
        role: role, // Include the selected role
        lastLogin: new Date(),
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
        user: user.toJSON(), // This will exclude the password
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
