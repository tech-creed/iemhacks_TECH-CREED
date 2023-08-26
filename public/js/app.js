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
                console.log(task)
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
        document.querySelector('#tokenAvailable').innerHTML = web3.utils.fromWei(availableToken.toString(), 'ether')
        document.querySelector('#tokenName').innerHTML = await App.token.name()
        document.querySelector('#tokenSymbol').innerHTML = await App.token.symbol()
        const tokenPrice = await App.token.tokenPrice()
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
        await App.token.initialAllowance(industryWalletID,initTokens, { from: App.account })
        window.location.href = '/dashboard'
    }

}