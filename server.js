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

const PORT = 52331;

app.get("/",(req,res)=>{
    res.send('HomePage');
})

app.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));