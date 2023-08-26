const express = require("express")
const router = express.Router()

// route controller
const authController = require("../controllers/authController")

router.get("/login",authController.loginPage)

module.exports = router