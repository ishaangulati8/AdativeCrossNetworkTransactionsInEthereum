const os = require('os');
const { compileContract: getContractFile, compileCrossNetworkContract } = require('./compileContract');

const sabChain1 = new SharedArrayBuffer(1024);
const chain1Locks = new Int32Array(sabChain1);

const sabChain2 = new SharedArrayBuffer(1024);
const chain2Locks = new Int32Array(sabChain2);

const COIN_CHAIN1 = process.env.COIN_CHAIN1 || '0xD74768232a7f5C0A39Bf4b1a70941A512de7f40E';
const COIN_CHAIN2 = process.env.COIN_CHAIN2 || '0x4Af1fE1955Ed067dcC8BfB8352959b7949d73c6b';

const COIN_CHAIN1_FILEPATH = './private-network1/truffle/contracts/Coin.sol';
const COIN_CHAIN2_FILEPATH = './private-network2/truffle/contracts/Coin.sol';


function mediate() {
    const memoryUsagePercentage = ((os.totalmem() - os.freemem()) / os.totalmem()) * 100;
    const [cpuLoad] = os.loadavg();
    if (memoryUsagePercentage <= 45 && cpuLoad <= 3.5) {
        return 'SYNC';
    } else if ((memoryUsagePercentage >= 45 && memoryUsagePercentage <= 65) && (cpuLoad >= 3.5 && cpuLoad <= 55)) {
        return 'COMBINATION';
    }
    return 'ASYNC';
}

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function getContract(web3, contractAddress, contractFilePath, contractName, coinContractPath) {
    let contractFile;
    if (contractName == 'Coin') {
        contractFile = getContractFile(contractFilePath, contractName);
    } else {
        contractFile = compileCrossNetworkContract(contractFilePath, contractName, coinContractPath, 'Coin');
    }
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

function getRandomNumbers(chain1Range, chain2Range) {
    let first = Math.random() * chain1Range;
    let second = Math.random() * chain2Range;
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

async function makeRandomTransactions({
    chain1Web3, chain2Web3, chain1ContractAddress,
    chain1ContractFilePath, chain2ContractAddress,
    chain2ContractFilePath, type, force = false }) {
    try {
        const chain1Contract = getContract(chain1Web3, chain1ContractAddress, chain1ContractFilePath, 'CrossNetworkTransaction', COIN_CHAIN1_FILEPATH);
        const chain2Contract = getContract(chain2Web3, chain2ContractAddress, chain2ContractFilePath, 'CrossNetworkTransaction', COIN_CHAIN2_FILEPATH);
        const chain1Accounts = await getAccounts(chain1Web3, chain1Locks);
        const chain2Accounts = await getAccounts(chain2Web3, chain2Locks);
        if (chain1Accounts.length == 0 || chain2Accounts.length == 1) {
            throw new Error("Please add more accounts to continue.");
        }
        await unlockAccounts(chain1Web3, chain1Accounts);
        await unlockAccounts(chain2Web3, chain2Accounts);
        const transactions = [];
        for (let i = 0; i < 5; i++) {
            if (force !== 'true' || force === false) {
                type = mediate();
            }
            if (type == 'SYNC') {
                transactions.push(makeSyncTransactions({
                    chain1Web3, chain2Web3,
                    chain1Contract, chain2Contract,
                    chain1Accounts, chain2Accounts
                }));
            } else if (type === 'COMBINATION') {
                if (i % 2 == 0) {
                    transactions.push(makeSyncTransactions({
                        chain1Web3, chain2Web3,
                        chain1Contract, chain2Contract,
                        chain1Accounts, chain2Accounts
                    }));
                } else {
                    transactions.push(makeAsyncTransaction({
                        chain1Web3, chain2Web3,
                        chain1Contract, chain2Contract,
                        chain1Accounts, chain2Accounts
                    }));
                }
            }
            else {
                transactions.push(makeAsyncTransaction({
                    chain1Web3, chain2Web3,
                    chain1Contract, chain2Contract,
                    chain1Accounts, chain2Accounts
                }));
            }
        }
        await Promise.all(transactions);
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
}

async function makeSyncTransactions({
    chain1Web3, chain2Web3, chain1Contract,
    chain2Contract, chain1Accounts, chain2Accounts }) {
    let first, second;
    try {
        [first, second] = getRandomNumbers(chain1Accounts.length - 1, chain2Accounts.length - 1);
        while (Atomics.compareExchange(chain1Locks, first, 1, 0) === 1 || Atomics.compareExchange(chain2Locks, second, 1, 0) === 1) {
            // do nothing wait for accounts to unlock.
            console.log(`Accounts Locked: ${first}, ${second}`);
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
        Atomics.store(chain1Locks, first, 0);
        Atomics.store(chain2Locks, second, 0);
    } catch (error) {
        // call transaction rollback.
        console.error(error);
        await rollback({
            chain1Contract,
            chain2Contract,
            chain1Account: chain1Accounts[first],
            chain2Account: chain2Accounts[second],
            chain1Web3, chain2Web3
        });
        Atomics.store(chain1Locks, first, 0);
        Atomics.store(chain2Locks, second, 0);
    }
}

async function makeAsyncTransaction(
    { chain1Web3, chain2Web3, chain1Contract,
        chain2Contract, chain1Accounts, chain2Accounts }) {
    let first, second, amount;
    try {
        [first, second] = getRandomNumbers(chain1Accounts.length - 1, chain2Accounts.length - 1);
        while (Atomics.compareExchange(chain1Locks, first, 1, 0) === 1) {
            //wait for account to unlock.
            console.log(`Account Locked ${chain1Accounts[first]}`)

        }
        // lock chain 1 account
        Atomics.store(chain1Locks, first, 1);
        //call debit async
        amount = getRandomAmount();
        await debitAsync({ account: chain1Accounts[first], contract: chain1Contract, web3: chain1Web3, amount });
        while (Atomics.compareExchange(chain2Locks, second, 1, 0) === 1) {
            //wait for the account to unlock.
            console.log(`Account Locked ${chain2Accounts[second]}`)
        }
        // lock the account.
        Atomics.store(chain2Locks, second, 1);
        await creditAsync({ account: chain2Accounts[second], contract: chain2Contract, web3: chain2Web3, amount });
        // unlock the accounts.
        Atomics.store(chain1Locks, first, 0);
        Atomics.store(chain2Locks, second, 0);
        // check 
    } catch (error) {
        console.log(error);
        // rollback the transaction for both of the accounts.
        await rollbackAsync({
            chain1Account: chain1Accounts[first], chain1Contract,
            chain2Account: chain2Accounts[second], chain2Contract,
            chain1Web3, chain2Web3,
        })
        Atomics.store(chain1Locks, first, 0);
        Atomics.store(chain2Locks, second, 0);
    }


}

async function debitAsync({ account, contract, amount, web3 }) {
    const { transactionHash } = await contract.methods.commitAsyncDebit(account, amount).send({ from: account });
    const transactionReceipt = await getTransactionReceipt({ web3, transactionHash });
    const state = await contract.methods.undo_log(account).call();
    if (Math.abs(state) != amount) {
        throw new Error('TRANSACTION_ROLLBACK');
    }
    return transactionReceipt;
}

async function creditAsync({ account, contract, amount, web3 }) {
    const { transactionHash } = await contract.methods.commitAsyncCredit(account, amount).send({ from: account });
    const transactionReceipt = await getTransactionReceipt({ transactionHash, web3 });
    const state = await contract.methods.undo_log(account).call();
    if (state != amount) {
        throw new Error('TRANSACTION_ROLLBACK');
    }
    return transactionReceipt;
}

async function prepare({ account, contract, amount, web3 }) {
    const { transactionHash } = await contract.methods.prepare(account, amount).send({ from: account });
    let transactionReceipt = await getTransactionReceipt({ transactionHash, web3 });
    const state = await contract.methods.pending_transactions(account).call();
    if (state != amount) {
        throw new Error('TRANSACTION_ROLLBACK');
    }
}

async function rollbackAsync({
    chain1Account, chain1Contract, chain2Account, chain2Contract, chain1Web3, chain2Web3
}) {
    try {
        const chain1TransactionHash = await chain1Contract.methods.reverseTransaction(chain1Account);
        const chain1TransactionReceipt = await getTransactionReceipt({ transactionHash: chain1TransactionHash, web3: chain1Web3 });
        const chain2TransactionHash = await chain2Contract.methods.reverseTransaction(chain2Account);
        const chain2TransactionReceipt = await getTransactionReceipt({ transactionHash: chain2TransactionHash, web3: chain2Web3 });
        return { chain1TransactionReceipt, chain2TransactionReceipt };
    } catch (error) {
        console.log(error);
    }
}

async function rollback({ chain1Contract, chain2Contract, chain1Account, chain2Account, chain1Web3, chain2Web3 }) {
    try {
        await chain1Contract.methods.abort(chain1Account).send({ from: chain1Account }, async (err, transactionHash) => {
            if (err) {
                console.log(err);
            }
            let transactionReceipt = null;
            while (transactionReceipt === null) {
                transactionReceipt = await chain1Web3.eth.getTransactionReceipt(transactionHash);
                await sleep(1000)
            }
            return transactionReceipt
        })
        await chain2Contract.methods.abort(chain2Account).send({ from: chain2Account }, async (err, transactionHash) => {
            if (err) {
                console.log(err);
            }
            let transactionReceipt = await getTransactionReceipt({ transactionHash, web3: chain2Web3 });
            return transactionReceipt;
        })
    } catch (error) {
        console.error(error)
    }
}

async function commit({ account, contract, web3 }) {
    try {
        const { transactionHash } = await contract.methods.commit(account).send({ from: account })
        let transactionReceipt = await getTransactionReceipt({ transactionHash, web3 });
        return transactionReceipt;
    } catch (err) {
        throw new Error(err);
    }
}

async function getTransactionReceipt({ transactionHash, web3 }) {
    let transactionReceipt = null;
    while (transactionReceipt == null) {
        transactionReceipt = await web3.eth.getTransactionReceipt(transactionHash);
        await sleep(1000);
    }
    return transactionReceipt;
}

async function mint(web3, contractAddress, contractFilePath, chainNumber) {
    try {

        const contract = getContract(web3, contractAddress, contractFilePath, 'Coin');
        let locks;
        if (chainNumber == 1) {
            locks = chain1Locks;
        } else {
            locks = chain2Locks;
        }
        const accounts = await getAccounts(web3, locks);
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

async function getBalances(web3, contractFilePath, contractAddress) {
    try {
        const contractFile = getContractFile(contractFilePath, 'Coin');
        const abi = contractFile.abi;
        const CONTRACT_ADDRESS = contractAddress;
        const minter = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
        const balances = await minter.methods.getBalances().call();
        return balances;
    } catch (error) {
        throw new Error(error);
    }
}


module.exports = { getBalances, makeRandomTransactions, mint, sleep };
