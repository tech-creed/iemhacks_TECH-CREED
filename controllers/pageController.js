const homePage = async(req,res)=>{
    res.render('index')
}

const dashboard = async(req,res)=>{
    if(req.cookies.role == "government"){
        res.render('dashboard',{title:"Government Dashboard"})
    }else if(req.cookies.role == "industry"){
        res.render('dashboard',{title:"Industry Dashboard"})
    }else{
        res.render('dashboard',{title:"Individual Dashboard"})
    }
}

const mark_co2 = async (req,res)=>{
        res.render('markCo2')
}

const buy_token = async (req,res)=>{
    res.render('buytoken')
}

const sell_token = async (req,res)=>{
    res.render('selltoken')
}


const report_co2 = async(req,res)=>{
    res.render('reportCo2')
}

const allowance = async(req,res)=>{
    res.render('allowance')
}

const marketplace = async(req,res)=>{
    res.render('marketplace')
}

const transparent = async(req,res)=>{
    res.render('transparent')
}

const all_emission = async(req,res)=>{
    res.render('allEmission')
}

module.exports = {homePage, dashboard, mark_co2, report_co2, allowance, marketplace, transparent, all_emission, buy_token, sell_token}