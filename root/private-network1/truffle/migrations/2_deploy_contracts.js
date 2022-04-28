var Coin = artifacts.require("./Coin.sol");
var CrossNetworkTransaction = artifacts.require("./CrossNetworkTransaction.sol");

module.exports = function(deployer) {
    deployer.deploy(Coin);
    deployer.deploy(CrossNetworkTransaction);
};