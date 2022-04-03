const getContractFile = require('./compileContract');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

async function interactWithContract(web3) {
    try {
        const contractFile = getContractFile();
        const byteCode = contractFile.evm.bytecode.object;
        const abi = contractFile.abi;
        const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xE131e4136c6f8B193CbEF6552353ba0D9392D522'
        const minter = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
        const accounts = await web3.eth.getAccounts();
        await Promise.all(accounts.map(account => web3.eth.personal.unlockAccount(account, 'pass')));
        minter.deploy({
            data: byteCode,
        });
        const balancesBeforeTransaction = await minter.methods.getBalances().call();
        const transaction = await minter.methods.makeRandomTransaction().send({ from: accounts[0] }, async (error, transactionHash) => {
            let transactionReceipt = null;
            while (transactionReceipt == null) {
                transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
                await sleep(1000)
            }
            return transactionReceipt;
        });
        const balancesAfterTransaction = await minter.methods.getBalances().call();
        return { balancesBeforeTransaction, balancesAfterTransaction };
    } catch (err) {
        throw new Error(err);
    }
}


async function getBalances(web3) {
    try {
        const contractFile = getContractFile();
        const abi = contractFile.abi;
        const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xE131e4136c6f8B193CbEF6552353ba0D9392D522'
        const minter = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
        const balances = await minter.methods.getBalances().call();
        return balances;
    } catch (error) {
        throw new Error(error);
    }
}
module.exports = { interactWithContract, getBalances };
