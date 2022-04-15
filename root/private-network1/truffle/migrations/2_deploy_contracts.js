var Mint = artifacts.require("./Mint.sol");
var Coin = artifacts.require("./Coin.sol");

module.exports = function(deployer) {
    deployer.deploy(Mint);
    deployer.deploy(Coin);
};