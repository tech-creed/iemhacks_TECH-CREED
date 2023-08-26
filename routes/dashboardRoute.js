const express = require("express")
const router = express.Router()

// route controller
const pageController = require("../controllers/pageController")


router.get("/",pageController.dashboard)

module.exports = router