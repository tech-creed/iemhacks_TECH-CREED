// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GreenCreditToken is ERC20 {
    address payable public GreenChainPlatformOwner;
    uint public tokenPrice;

    mapping(address => bool) public GovernmentAccounts;
    mapping(address => bool) public IndustryAccounts;

    constructor(uint256 initTokenPrice) ERC20("GreenCredit", "GCT") {
        GreenChainPlatformOwner = payable(msg.sender);
        tokenPrice = initTokenPrice;
        _mint(GreenChainPlatformOwner, 100 * 10**decimals());
    }

    modifier onlyPlatformOwner() {
        require(
            msg.sender == GreenChainPlatformOwner,
            "you are not a platform owner"
        );
        _;
    }

    function burnToken(address _address, uint _tokenCount) public {
        require(
            balanceOf(_address) >= _tokenCount * 10 ** decimals(),
            "token count is not enough"
        );
        _burn(_address, _tokenCount * 10**decimals());
    }

    //Gov functionalities
    function grantGovernmentPrivilege(address _account) public {
        GovernmentAccounts[_account] = true;
        _mint(msg.sender, 1000 * 10**decimals());
    }

    modifier onlyGovernment() {
        require(
            GovernmentAccounts[msg.sender] == true,
            "only government authority can change the token price"
        );
        _;
    }

    function setTokenPrice(uint newPrice) public onlyGovernment {
        tokenPrice = newPrice;
    }

    // initial
    function initialAllowance(address _industry, uint _tokenCount)
        public
        onlyGovernment
    {
        require(_industry != address(0), "Invalid addresses");
        require(
            IndustryAccounts[_industry] == true,
            "Seller must be an industry"
        );
        require(_tokenCount > 0, "token Count must be greater than 0");
        _transfer(msg.sender, _industry, _tokenCount * 10**decimals());
    }

    //Industry functionalities
    function grantIndustryPrivilege(address _account) public {
        IndustryAccounts[_account] = true;
    }

    modifier onlyIndustry() {
        require(
            IndustryAccounts[msg.sender] == true,
            "only industry authority can change the token price"
        );
        _;
    }

    event tokenPurchased(address indexed _industryId,address indexed _govId, uint indexed _tokenCount,uint _taxFee);

    // buy a token from Government and pay the tax fee for emission
    function buyToken(
        address _to,
        uint _tokenCount,
        address payable _govAddress
    ) public payable onlyIndustry {
        require(tokenPrice == msg.value, "insufficient amount");
        _mint(_to, _tokenCount * 10**decimals());
        _govAddress.transfer(msg.value); //pay the tax Fee to the Government
        emit tokenPurchased(_to, _govAddress, _tokenCount, msg.value);
    }

    // Carbon credit trading
    function tradeCarbonCredits(address _to, uint _amount)
        public
        onlyIndustry
    {
        require(_to != address(0), "Invalid address");
        require(_amount > 0, "Amount must be greater than 0");
        _transfer(msg.sender, _to, _amount * 10**decimals());
    }
}
