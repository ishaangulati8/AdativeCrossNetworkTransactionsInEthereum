var dotenv = require('dotenv')
var dotenvExpand = require('dotenv-expand')

var myEnv = dotenv.config()
dotenvExpand.expand(myEnv)
const os = require('os');
const Web3 = require('web3');
const express = require('express');
const bodyParser = require('body-parser');

const { getBalances, makeRandomTransactions, mint, sleep } = require('./simulation.js');

const app = express();


app.use(bodyParser.json());
const COIN_CHAIN1 = process.env.COIN_CHAIN1   || '0xD74768232a7f5C0A39Bf4b1a70941A512de7f40E';
const COIN_CHAIN2 = process.env.COIN_CHAIN2   || '0x4Af1fE1955Ed067dcC8BfB8352959b7949d73c6b';
const CROSS_CHAIN1 = process.env.CROSS_CHAIN1 || '0xB166d2e99C6dC468Fbac73e3526daC8cd15E361F';
const CROSS_CHAIN2 = process.env.CROSS_CHAIN2 || '0x51C621a01b7C9417f4Cd2B0e4B2b6FC6f3C007F3';

const COIN_CHAIN1_FILEPATH = './private-network1/truffle/contracts/Coin.sol';
const COIN_CHAIN2_FILEPATH = './private-network2/truffle/contracts/Coin.sol';
const CROSS_CHAIN1_FILEPATH = './private-network1/truffle/contracts/CrossNetworkTransaction.sol';
const CROSS_CHAIN2_FILEPATH = './private-network2/truffle/contracts/CrossNetworkTransaction.sol';

let CHAIN1_WEB3, CHAIN2_WEB3;
const PORT = process.env.PORT || 3000;

const CHAIN1_IPC_URL = process.env.CHAIN1_IPC_URL || 'http://127.0.0.1:8543';
const CHAIN2_IPC_URL = process.env.CHAIN2_IPC_URL || 'http://127.0.0.1:8544';

function getCpuStats() {
    setInterval(() => {
        console.log(`CPU usage: ${process.cpuUsage()}`)
        console.log(`Total Memory: ${((os.totalmem() - os.freemem())/os.totalmem()) / 100}`)
    }, 1000);
}

app.listen(PORT, async (err) => {
    try {
        if (err) {
            console.err(err);
            process.exit(1);
        } else {
            CHAIN1_WEB3 = new Web3(new Web3.providers.HttpProvider(CHAIN1_IPC_URL));
            CHAIN2_WEB3 = new Web3(new Web3.providers.HttpProvider(CHAIN2_IPC_URL));
            // Add default balance to accounts on both chains.
            await Promise.all([mint(CHAIN1_WEB3, COIN_CHAIN1, COIN_CHAIN1_FILEPATH, 1), mint(CHAIN2_WEB3, COIN_CHAIN2, COIN_CHAIN2_FILEPATH, 2)]);
            await sleep(1000);
            console.log('Server started successfully on port: ', PORT);
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
});

app.use('/random-transaction', async (req, res, next) => {
    try {
        const { type = 'SYNC', force = false } = req.query;
        await makeRandomTransactions({
            chain1Web3: CHAIN1_WEB3,
            chain2Web3: CHAIN2_WEB3,
            chain1ContractAddress: CROSS_CHAIN1,
            chain1ContractFilePath: CROSS_CHAIN1_FILEPATH,
            chain2ContractAddress: CROSS_CHAIN2,
            chain2ContractFilePath: CROSS_CHAIN2_FILEPATH,
            type, force,
        });
        const chain1Balances = await getBalances(CHAIN1_WEB3, COIN_CHAIN1_FILEPATH, COIN_CHAIN1);
        const chain2Balances = await getBalances(CHAIN2_WEB3, COIN_CHAIN2_FILEPATH, COIN_CHAIN2);
        res.status(200).json({
            success: true,
            chain1Balances,
            chain2Balances,
        });
    } catch (err) {
        next(err)
    }
});

app.use('/balance', async (req, res, next) => {
    try {
        const chain1Balances = await getBalances(CHAIN1_WEB3, COIN_CHAIN1_FILEPATH, COIN_CHAIN1);
        const chain2Balances = await getBalances(CHAIN2_WEB3, COIN_CHAIN2_FILEPATH, COIN_CHAIN2);
        res.status(200).json({
            success: true,
            chain1Balances,
            chain2Balances,
        });
    } catch (error) {
        next(error);
    }
})

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({
        error: JSON.stringify(err),
    });
});


