const express = require("express");
const { verifyToken } = require("../middleware/auth.middleware");

const authController = require("../controllers/auth.controller");

const router = express.Router();

function setupRoutes(app) {
  app.get("/", (req, res) => {
    res.send("Hello, World!");
  });

  // Test endpoint for API health check
  app.get('/api/status', (req, res) => {
    res.json({ 
      status: 'ok',
      timestamp: new Date(),
      message: 'API is running correctly'
    });
  });

  // Authentication routes
  // app.use("/auth", authRoutes);

  app.post("/auth/login", authController.login);
  app.post("/auth/refresh", authController.refresh);
  app.post("/auth/logout", authController.logout);
  app.post("/auth/signup", authController.signup);

  // Protected route example
  app.get("/protected", verifyToken, (req, res) => {
    res.json({ message: "This is a protected route", userId: req.userId });
  });
}

module.exports = { setupRoutes };
