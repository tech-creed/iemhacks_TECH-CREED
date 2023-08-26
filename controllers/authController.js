const loginPage = async(req,res)=>{
    res.render('login')
}

const registerPage = async(req,res)=>{
    res.render('register')
}

module.exports = {loginPage,registerPage}