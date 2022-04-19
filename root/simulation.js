const getContractFile = require('./compileContract');
const sab = new SharedArrayBuffer(1024)
const locks = new Int32Array(sab);

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}


setInterval(async (web) => {
    try {
        await interactWithContract(web3)
    } catch (error) {
        console.error(error);
    }
})(web3)

function getContract(web3, contractAddress) {
    const contractFile = getContractFile();
    // const byteCode = contractFile.evm.bytecode.object;
    const abi = contractFile.abi;
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || contractAddress;
    const minter = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
    return minter;
}


async function getAccounts(web3) {
    const accounts = await web3.eth.getAccounts();
    // populate buffer

    for (let i = 0; i < accounts.length; i++) {
        Atomics.store(locks, i, 0);
    }
    return accounts;
}

function getRandomNumbers(range) {
    let first = Math.random() * range;
    let second = Math.random() * random;
    while (first == second) {
        second = Math.random() * random;
    }
    return [first, second];

}

async function unlockAccounts(web3, accounts = []) {
    if (accounts.length == 0) {
        accounts = await getAccounts();
    }
    await Promise.all(accounts.map(i => web3.eth.personal.unlockAccount(i.account, 'pass')));
}

function getRandomAmount() {
    return Math.floor(Math.random * (100 - 1) + 1)
}

async function makeRandomTransactions(web3, smartContractsAddress) {
    try {
        const contract = getContract(web3, smartContractsAddress);
        const accounts = await getAccounts();
        if (accounts.length == 0 || accounts.length == 1) {
            throw new Error("Please add more accounts to continue.");
        }
        await unlockAccounts(web3, accounts);
        const transactions = [];
        for (let i = 0; i < 20; i++) {
            transactions.push(makeTransactions(contract, accounts, getRandomNumbers(accounts.length - 1)));
        }
        await Promise.all(transactions);
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

async function makeTransactions(contract, accounts, accountIndexes) {
    const [first, second] = accountIndexes;
    // TODO: Test if it works.
    while (Atomics.wait(locks, first, 1) && Atomics.wait(locks, second, 1)) {
        // do nothing wait for accounts to unlock.
    }
    // Lock the accounts
    Atomics.store(buffer, first, 1);
    Atomics.store(buffer, second, 1);
    // perform transaction
    const transaction = await contract.methods.makeTransaction(accounts[first], accounts[second], getRandomAmount()).send({ from: accounts[0] },
        async (error, transactionHash) => {
            let transactionReceipt = null;
            while (transactionReceipt == null) {
                transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
                await sleep(1000)
            }
            return transactionReceipt;
        });
    // Unlock the accounts.
    Atomics.store(buffer, first, 0);
    Atomics.store(buffer, second, 0);
    Atomics.notify(buffer, first);
    Atomics.notify(buffer, second);
    return transaction;
}


// TODO: Remove
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
        const transaction = await minter.methods.makeRandomTransaction().send({ from: accounts[0] },
            async (error, transactionHash) => {
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


async function mint(web3) {
    const contract = getContract();
    // const accounts = await getAccounts()
    await contract.methods.mint().call();
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
module.exports = { interactWithContract, getBalances, makeRandomTransactions, mint };
