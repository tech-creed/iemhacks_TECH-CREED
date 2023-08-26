const express = require("express")
const router = express.Router()

// route controller
const authController = require("../controllers/authController")

router.get("/login",authController.loginPage)
router.get("/register",authController.registerPage)


module.exports = router