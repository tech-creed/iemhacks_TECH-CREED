App = {

    loading: false,
    contracts: {},
    account: "",

    load: async () => {
        console.log('App connecting...')
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContracts()
        return false;
    },

    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider
            web3 = new Web3(web3.currentProvider)
        } else {
            window.alert("Please connect to Metamask.")
        }
        // Modern dapp browsers...
        if (window.ethereum) {
            window.web3 = new Web3(ethereum)
            try {
                // Request account access if needed
                await ethereum.enable()
                // Acccounts now exposed
                web3.eth.sendTransaction({/* ... */ })
            } catch (error) {
                // User denied account access...
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = web3.currentProvider
            window.web3 = new Web3(web3.currentProvider)
            // Acccounts always exposed
            web3.eth.sendTransaction({/* ... */ })
        }
        // Non-dapp browsers...
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
    },

    loadAccount: async () => {
        // get current account
        web3.eth.getAccounts()
            .then(accounts => {
                App.account = accounts[0]
                console.log(App.account)
            })
            .catch(error => {
                console.error(error)
            })
    },

    loadContracts: async () => {

        // users ABI
        const UserContract = await $.getJSON('/contracts/UserAuth.json')
        App.contracts.user = TruffleContract(UserContract)
        App.contracts.user.setProvider(App.web3Provider)

        // emission ABI
        const Emission = await $.getJSON('/contracts/Emission.json')
        App.contracts.emission = TruffleContract(Emission)
        App.contracts.emission.setProvider(App.web3Provider)

        // token ABI
        const GreenCreditToken = await $.getJSON('/contracts/GreenCreditToken.json')
        App.contracts.token = TruffleContract(GreenCreditToken)
        App.contracts.token.setProvider(App.web3Provider)

        // store the deployes version of the smart contract
        App.user = await App.contracts.user.deployed()
        App.emission = await App.contracts.emission.deployed()
        App.token = await App.contracts.token.deployed()

    },

    connectWalletRegister: async () => {
        await App.load()
        data = {}

        data['name'] = document.getElementById('register_name').value
        data['role'] = document.getElementById('register_role').value
        data['authority'] = document.getElementById('register_authority').value
        data['wallet_id'] = App.account

        if(data['role'] == "government"){
            await App.token.grantGovernmentPrivilege(App.account,{ from: App.account })
        }else if(data['role'] == "industry"){
            await App.token.grantIndustryPrivilege(App.account,{ from: App.account })
        }

        await App.user.setUser(data['wallet_id'], data['name'], data['role'], data['authority'], { from: App.account })
        let r = await fetch('/auth/register', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-type': 'application/json;charset=UTF-8' } })
        r = await r.json()
        if (r) {
            alert(data['name'] + ' Welcome to the GreenChain EcoSystem')
            window.location.href = `/dashboard`
        }
    },

    connectWalletLogin: async () => {
        await App.load()
        data = {}
        data['wallet_id'] = App.account
        
        var userOrNot = await App.user.checkUserExists(App.account)
        if (userOrNot) {
            await App.user.Users(App.account).then(dataChain => {
                data['name'] = dataChain['name']
                data['role'] = dataChain['privilege']
            })
            let r = await fetch('/auth/login', { method: 'POST', body: JSON.stringify(data), headers: { 'Content-type': 'application/json; charset=UTF-8' } })
            r = await r.json();
            if (r) {
                window.location.href = `/dashboard`
            }
        } else {
            alert('need to register')
        }
    },

    EmissionMark: async () => {
        await App.load()

        await App.token.burnToken(document.getElementById('walletID').value,1,{from:document.getElementById('walletID').value})

        await App.emission.createEmissionData(document.getElementById('walletID').value, document.getElementById('co2').value, document.getElementById('emissionDate').value.toString(), { from: App.account, value: web3.utils.toWei((parseFloat(0.001) * parseFloat(document.getElementById('co2').value)).toString(), "ether") })

        window.location.href = '/mark-co2'
    },

    FetchEmission: async () => {
        await App.load()
        const taskCount = await App.emission.dataCount()
        const userWallet = document.cookie.split(';')[0].split('=')[1]

        tabel_body = document.getElementById('tabel-body')
        html = ``
        cum_emission = 0
        cum_fees = 0

        x_data = []
        y_data = []

        j = 1
        for (var i = 1; i <= taskCount; i++) {
            const task = await App.emission.emmis(i)
            if (userWallet == task[0]) {
                cum_emission += parseFloat(task[1])
                cum_fees += parseFloat(task[3])

                x_data.push(task[2])
                y_data.push(task[1])

                html +=
                    `<tr>
          <th scope="row">${j}</th>
          <td>${task[2]}</td>
          <td>${task[0]}</td>
          <td>${task[1]}</td>
          <td>${task[3] / 1000}</td>
          <td>${cum_emission}</td>
          </tr>`
                j += 1
            }
        }
        y_new_data_graph = []

        if(y_data.length > 7){
            const rawResponse = await fetch('http://192.168.0.105:3000/week', {
                method: 'POST',
                headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({data: y_data.slice(y_data.length-7,y_data.length)})
            });

            var y_new_data_responce = await rawResponse.json();
            y_new_data_responce = y_new_data_responce['data']['0']

            for (let i = 1; i < y_data.length; i++) {
                y_new_data_graph.push(null)
            }
            y_new_data_graph.push(y_data[y_data.length-1])

            for (let i = 1; i < y_new_data_responce.length+1; i++) {
                x_data.push(x_data[6].slice(0,8)+(parseInt(x_data[6].slice(8,10))+ parseInt(i)))
                y_new_data_graph.push(y_new_data_responce[i-1])
            }
        }
        

        var ctxL = document.getElementById("lineChart").getContext('2d');
        var myLineChart = new Chart(ctxL, {
            type: 'line',
            data: {
                labels: x_data,
                datasets: [{
                    lineTension: 0.25,
                    label: "Industry Carbon Visualization",
                    data: y_data,
                    backgroundColor: [
                        'rgba(225, 0, 0, .2)',
                    ],
                    borderColor: [
                        'rgba(255, 0, 0, .7)',
                    ],
                    borderWidth: 2
                },
                {
                    lineTension: 0.25,
                    label: "AI Predicted Carbon Visualization",
                    data: y_new_data_graph,
                    backgroundColor: [
                        'rgba(0, 255, 0, .2)',
                    ],
                    borderColor: [
                        'rgba(0, 255, 0, .7)',
                    ],
                    borderWidth: 2
                }
                ]
            },
            options: {
                responsive: true
            }
        });
        tabel_body.innerHTML = html
    },

    tokenDetails: async ()=>{
        await App.load()
        const availableToken = await App.token.balanceOf(App.account)
        document.querySelector('#tokenAvailable').innerHTML = web3.utils.fromWei(availableToken.toString(), 'ether') + " GCT"
        document.querySelector('#tokenName').innerHTML = await App.token.name()
        document.querySelector('#tokenSymbol').innerHTML = await App.token.symbol()
        const tokenPrice = await App.token.tokenPrice()
        const tokenAllowance = await App.token.IndustryAllowance(App.account)
        document.querySelector('#tokenAllowance').innerHTML = tokenAllowance.toString() + " Tokens"
        document.querySelector('#tokenPrice').innerHTML = tokenPrice.toString() + " Wei"
        const totalSupply = await App.token.totalSupply()
        document.querySelector('#tokenSupply').innerHTML = totalSupply.toString() + " Wei"
    },

    setTokenPrice:async()=>{
        await App.load()
        const newPrice = document.querySelector('#newPrice').value;
        await App.token.setTokenPrice(newPrice, { from: App.account })
        window.location.href = '/dashboard'
    },

    initAllowance:async()=>{
        await App.load()
        const industryWalletID = document.querySelector('#industryWalletID').value;
        const initTokens = document.querySelector('#initTokens').value;
        const maxAllowance = document.querySelector('#maxAllowance').value;
        await App.token.initialAllowance(industryWalletID,maxAllowance,initTokens, { from: App.account })
        window.location.href = '/dashboard'
    },

    SpecificFetchEmission:async ()=>{
        await App.load()

        const taskCount = await App.emission.dataCount()
        const userWallet = document.getElementById('walletSearch').value

        tabel_body = document.getElementById('trans-tabel-body')
        html = ``
        cum_emission = 0
        cum_fees = 0
        x_data = []
        y_data = []
        j = 1
        for (var i = 1; i <= taskCount; i++) {
            const task = await App.emission.emmis(i)
            if (userWallet == task[0]) {
                cum_emission += parseFloat(task[1])
                cum_fees += parseFloat(task[3])
                x_data.push(task[2])
                y_data.push(task[1])

                html +=
                    `<tr>
          <th scope="row">${j}</th>
          <td>${task[2]}</td>
          <td>${task[0]}</td>
          <td>${task[1]}</td>
          <td>${task[3]/1000}</td>
          <td>${cum_emission}</td>
          </tr>`
                j += 1
            }
        }

        y_new_data_graph = []

        if(y_data.length > 7){
            const rawResponse = await fetch('http://192.168.0.105:3000/week', {
                method: 'POST',
                headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
                },
                body: JSON.stringify({data: y_data.slice(y_data.length-7,y_data.length)})
            });

            var y_new_data_responce = await rawResponse.json();
            y_new_data_responce = y_new_data_responce['data']['0']

            for (let i = 1; i < y_data.length; i++) {
                y_new_data_graph.push(null)
            }
            y_new_data_graph.push(y_data[y_data.length-1])

            for (let i = 1; i < y_new_data_responce.length+1; i++) {
                x_data.push(x_data[6].slice(0,8)+(parseInt(x_data[6].slice(8,10))+ parseInt(i)))
                y_new_data_graph.push(y_new_data_responce[i-1])
            }
        }

        var ctxL = document.getElementById("lineChart").getContext('2d');
        var myLineChart = new Chart(ctxL, {
            type: 'line',
            data: {
                labels: x_data,
                datasets: [{
                    lineTension: 0.25,
                    label: "Industry Carbon Visualization",
                    data: y_data,
                    backgroundColor: [
                        'rgba(225, 0, 0, .2)',
                    ],
                    borderColor: [
                        'rgba(255, 0, 0, .7)',
                    ],
                    borderWidth: 2
                },
                {
                    lineTension: 0.25,
                    label: "AI Predicted Visualization",
                    data: y_new_data_graph,
                    backgroundColor: [
                        'rgba(0, 255, 0, .2)',
                    ],
                    borderColor: [
                        'rgba(0, 255, 0, .7)',
                    ],
                    borderWidth: 2
                }
                ]
            },
            options: {
                responsive: true
            }
        });
        tabel_body.innerHTML = html
    },

    FetchAllEmission:async()=>{
        await App.load()

        const taskCount = await App.emission.dataCount()

        tabel_body = document.getElementById('full-tabel-body')
        html = ``

        for (var i = 1; i <= taskCount; i++) {
            const task = await App.emission.emmis(i)
            html +=
                `<tr>
        <th scope="row">${i}</th>
        <td>${task[2]}</td>
        <td>${task[0]}</td>
        <td>${task[1]}</td>
        <td>${task[3]}</td>
        </tr>`
        }
        tabel_body.innerHTML = html

    },

    detailsToBuy:async()=>{
        await App.load()

        const tokenPrice = await App.token.tokenPrice()
        const tokenAllowance = await App.token.IndustryAllowance(App.account)
        document.querySelector('#tokenAllowance').innerHTML = tokenAllowance.toString() + " Tokens"
        document.querySelector('#tokenPrice').innerHTML = tokenPrice.toString() + " Wei"
    },

    buyToken:async()=>{
        await App.load()

        const tokenPrice = await App.token.tokenPrice()
        const _to = document.querySelector('#walletID').value
        const _tokenCount = document.querySelector('#tokenCountForBuy').value
        const _governmentAddress = document.querySelector('#governmentId').value
        await App.token.buyToken(_to,_tokenCount,_governmentAddress,{from:App.account,value:tokenPrice.toString()*_tokenCount})
        window.location.href = '/dashboard'
    },

    detailsToListTokenForSell:async ()=>{
        await App.load()

        const tokenPrice = await App.token.tokenPrice()
        const tokenBalance = await App.token.balanceOf(App.account)
        document.querySelector('#tokenBalance').innerHTML = web3.utils.fromWei(tokenBalance.toString(), 'ether') + " GCT"
        document.querySelector('#tokenPrice').innerHTML = tokenPrice.toString() + " Wei"
    },

    listTokenForSell:async()=>{
        await App.load()

        const tokenCount = document.querySelector('#tokenCount').value
        const tokenPriceToSell = document.querySelector('#tokenPriceToSell').value
        await App.token.listTokensForSale(tokenCount,tokenPriceToSell,{from:App.account})
        window.location.href = '/dashboard'

    },

    fetchListedTokensForSell:async()=>{
        await App.load()
        const cardBody = document.querySelector('.cardBody')
        html = ``
        const listingCount = await App.token.listingCount()
        for(var i = 0; i < listingCount; i++) {
            const listData = await App.token.listings(i)

            html += `<div class="col-lg-3 mt-4 mt-lg-0" data-aos="fade-up" data-aos-delay="200" ${!listData[3] ? 'style="display: none;"' : ''}>
            <div class="box">
              <img src="img/logo.png" class="img-fluid" alt="">
              <p style="font-size: 12px;">${listData[0]}</p>
              <p>Token Price: ${listData[2]}</p>
              <input type="hidden" id="listingId" value="${i}">
              <input type="hidden" id="tokenPriceForBuy" value="${listData[2]}">
              <button class="buy" onClick="App.buyListedToken();">Buy ${listData[1]} ECR</button>
            </div>
          </div>`

          cardBody.innerHTML = html
        }
    },

    buyListedToken:async()=>{
        await App.load()

        const listingId = document.querySelector('#listingId').value
        const tokenPrice = document.querySelector('#tokenPriceForBuy').value
        await App.token.buyTokensFromMarketpalce(listingId,{from:App.account,value:tokenPrice})
        window.location.href = '/dashboard'
    }

}