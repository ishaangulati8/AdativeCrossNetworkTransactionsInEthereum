const getContractFile = require('./compileContract');


const sabChain1 = new SharedArrayBuffer(1024);
const chain1Locks = new Int32Array(sabChain1);

const sabChain2 = new SharedArrayBuffer(1024);
const chain2Locks = new Int32Array(sabChain2);

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function getContract(web3, contractAddress, contractFilePath) {
    const contractFile = getContractFile(contractFilePath);
    const abi = contractFile.abi;
    const minter = new web3.eth.Contract(abi, contractAddress);
    return minter;
}


async function getAccounts(web3, locks) {
    const accounts = await web3.eth.getAccounts();

    for (let i = 0; i < accounts.length; i++) {
        // populate shared buffer
        Atomics.store(locks, i, 0);
    }
    return accounts;
}

function getRandomNumbers(range) {
    let first = Math.random() * range;
    let second = Math.random() * range;
    while (Math.ceil(first) == Math.floor(second)) {
        second = Math.random() * range;
    }
    return [Math.ceil(first), Math.floor(second)];

}

async function unlockAccounts(web3, accounts = []) {
    if (accounts.length == 0) {
        accounts = await getAccounts();
    }
    await Promise.all(accounts.map(i => web3.eth.personal.unlockAccount(i, 'pass')));
}

function getRandomAmount() {
    const amount = Math.floor(Math.random() * (10_00_0 - 1) + 1)
    return amount
}

async function makeRandomSyncTransactions({
    chain1Web3, chain2Web3, chain1ContractAddress,
    chain1ContractFilePath, chain2ContractAddress,
    chain2ContractFilePath }) {
    try {
        const chain1Contract = getContract(chain1Web3, chain1ContractFilePath);
        const chain2Contract = getContract(chain2Web3, chain2ContractAddress);
        const chain1Accounts = await getAccounts(chain1Web3, chain1Locks);
        const chain2Accounts = await getAccounts(chain2Web3, chain2Locks);
        if (accounts.length == 0 || accounts.length == 1) {
            throw new Error("Please add more accounts to continue.");
        }
        await unlockAccounts(chain1Web3, chain1Accounts);
        await unlockAccounts(chain1Web3, chain2Accounts);
        const transactions = [];
        for (let i = 0; i < 100; i++) {
            transactions.push(makeTransactions({
                chain1Web3, chain2Web3,
                chain1Contract, chain2Contract,
                chain1Accounts, chain2Accounts
            }));
        }
        await Promise.all(transactions);
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

async function makeSyncTransactions({ chain1Web3, chain2Web3,
    chain1Contract, chain2Contract,
    chain1Accounts, chain2Accounts }) {
    let first, second;
    try {
        [first, second] = getRandomNumbers(accounts.length - 1);
        while (Atomics.compareExchange(chain1Locks, first, 1, 0) === 1 && Atomics.compareExchange(chain2Locks, second, 1, 0) === 1) {
            // do nothing wait for accounts to unlock.
            console.log(`inside while loop! for accounts ${first}, ${second}`);
        }
        // Lock the accounts
        console.log(`outside while loop! for accounts ${first}, ${second}`);
        Atomics.store(chain1Locks, first, 1);
        Atomics.store(chain2Locks, second, 1);
        // perform transaction
        const amount = getRandomAmount();
        // call prepare
        await prepare({
            account: chain1Accounts[first],
            contract: chain1Contract,
            amount: -amount,
            web3: chain1Web3,
        });
        await prepare({
            account: chain2Accounts[second],
            contract: chain2Contract,
            amount,
            web3: chain2Web3,
        });
        // call commit
        await commit({
            contract: chain1Contract,
            account: chain1Accounts[first],
            web3: chain1Web3,
        });
        await commit({
            contract: chain2Contract,
            account: chain2Accounts[second],
            web3: chain2Web3,
        })
        // Unlock the accounts.
        Atomics.store(locks, first, 0);
        Atomics.store(locks, second, 0);
        return transaction;
    } catch (error) {
        // call transaction rollback.
        console.error(error);
        await rollback({
            chain1Contract,
            chain2Contract,
            chain1Account: chain1Accounts[first],
            chain2Account: chain2Accounts[second],
        });
        Atomics.store(locks, first, 0);
        Atomics.store(locks, second, 0);
    }
}

async function prepare({ account, contract, amount, web3 }) {
    const transactionHash = await contract.methods.prepare(account, amount).send({ from: account });
    let transactionReceipt = await getTransactionReceipt({transactionHash, web3});
    const state = await contract.pending_transaction.call();
    if (state[account] != amount) {
        throw new Error('TRANSACTION_ROLLBACK');
    }
}

async function rollback({
    chain1Contract,
    chain2Contract,
    chain1Account,
    chain2Account }) {
    try {
        await chain1Contract.methods.abort(chain1Account).send({ from: chain1Account }, async (err, transactionHash) => {
            if (err) {
                console.log(err);
            }
            let transactionReceipt = null;
            while (transactionReceipt === null) {
                transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
                await sleep(1000)
            }
            return transactionReceipt
        })
        await chain2Contract.methods.abort(chain2Account).send({ from: chain2Account }, async (err, transactionHash) => {
            if (err) {
                console.log(err);
            }
            let transactionReceipt = await getTransactionReceipt({transactionHash, web3});
            return transactionReceipt;
        })
    } catch (error) {
        console.error(error)
    }
}

async function commit({ account, contract, web3 }) {
    try {
        const transactionHash = await contract.methods.commit(account).send({ from: chain1Account })
        let transactionReceipt = await getTransactionReceipt({transactionHash, web3});
        return transactionReceipt;
    } catch (err) {
        throw new Error(err);
    }
}

async function getTransactionReceipt({ transactionHash, web3 }) {
    let transactionReceipt = null;
    while (transactionReceipt == null) {
        transactionReceipt = await web3.eth.getTransactionReceipt(transactionReceipt);
        await sleep(1000);
    }
    return transactionReceipt;
}

async function mint(web3, contractAddress, contractFilePath) {
    try {

        const contract = getContract(web3, contractAddress, contractFilePath);
        const accounts = await getAccounts(web3);
        await Promise.all(accounts.map(account => web3.eth.personal.unlockAccount(account, 'pass')));
        await contract.methods.mint().send({ from: accounts[0] }, async (error, transactionHash) => {
            if (error) {
                console.log(error);
                return
            }
            let transactionReceipt = null;
            while (transactionReceipt == null) {
                transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
                await sleep(1000);
            }
            return transactionReceipt;
        });
    } catch (err) {
        console.log(err)

    }
}

async function getBalances(web3, contractFilePath) {
    try {
        const contractFile = getContractFile(contractFilePath);
        const abi = contractFile.abi;
        const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xE131e4136c6f8B193CbEF6552353ba0D9392D522'
        const minter = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
        const balances = await minter.methods.getBalances().call();
        return balances;
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = { getBalances, makeRandomSyncTransactions, mint, sleep };
