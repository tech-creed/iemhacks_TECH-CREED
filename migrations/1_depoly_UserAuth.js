const UserAuth = artifacts.require("UserAuth.sol");

module.exports = function(deployer) {
  deployer.deploy(UserAuth);
};