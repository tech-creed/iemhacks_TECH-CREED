const express = require("express")
const router = express.Router()

// route controller
const authController = require("../controllers/authController")

router.get("/login",authController.loginPage)
router.get("/register",authController.registerPage)
router.post("/register",authController.PostRegister)
router.post("/login",authController.PostLogin)

module.exports = router