require('dotenv').config()
const express = require("express")
const cookieParser = require("cookie-parser")
const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))
app.use(cookieParser())
app.set('view engine', 'ejs')

const PORT = 52332

// routes
const DashboardRoute = require('./routes/dashboardRoute')
const AuthRoute = require('./routes/authRoute')

app.use('/',DashboardRoute)
app.use('/auth',AuthRoute)

app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`))