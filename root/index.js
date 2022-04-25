var dotenv = require('dotenv')
var dotenvExpand = require('dotenv-expand')

var myEnv = dotenv.config()
dotenvExpand.expand(myEnv)

const Web3 = require('web3');
const express = require('express');
const bodyParser = require('body-parser');

const { getBalances, makeRandomSyncTransactions, mint, sleep } = require('./simulation.js');

const app = express();


app.use(bodyParser.json());
// TODO: Update Chin2 addresses.
const COIN_CHAIN1 = process.env.COIN_CHAIN1 || '0x20C319d05fDB8Ae786053E7cdc734324D9804e36';
const COIN_CHAIN2 = process.env.COIN_CHAIN2 || '0x20C319d05fDB8Ae786053E7cdc734324D9804e36';
const CROSS_CHAIN1 = process.env.CROSS_CHAIN1 || '0x015C04289174cB550968b23d3e9a447E79ef0b7e';
const CROSS_CHAIN2 = process.env.CROSS_CHAIN2 || '0x015C04289174cB550968b23d3e9a447E79ef0b7e';

const COIN_CHAIN1_FILEPATH = './private-network1/truffle/contracts/Coin.sol';
const COIN_CHAIN2_FILEPATH = './private-network2/truffle/contracts/Coin.sol';
const CROSS_CHAIN1_FILEPATH = './private-network1/truffle/contracts/CrossNetworkTransaction.sol';
const CROSS_CHAIN2_FILEPATH = './private-network2/truffle/contracts/CrossNetworkTransaction.sol';

let CHAIN1_WEB3, CHAIN2_WEB3;
const PORT = process.env.PORT || 3000;

const CHAIN1_IPC_URL = process.env.CHAIN1_IPC_URL || 'http://127.0.0.1:8543';
const CHAIN2_IPC_URL = process.env.CHAIN2_IPC_URL || 'http://127.0.0.1:8544';

app.listen(PORT, async (err) => {
    try {
        if (err) {
            console.err(err);
            process.exit(1);
        } else {
            CHAIN1_WEB3 = new Web3(new Web3.providers.HttpProvider(CHAIN1_IPC_URL));
            CHAIN2_WEB3 = new Web3(new Web3.providers.HttpProvider(CHAIN2_IPC_URL));
            // Add default balance to accounts on both chains.
            await Promise.all([mint(CHAIN1_WEB3, COIN_CHAIN1, COIN_CHAIN1_FILEPATH), mint(CHAIN2_WEB3, COIN_CHAIN2, COIN_CHAIN2_FILEPATH)]);
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
        // TODO: Test
        await makeRandomSyncTransactions({
            chain1Web3: CHAIN1_WEB3,
            chain2Web3: CHAIN2_WEB3,
            chain1ContractAddress: CROSS_CHAIN1,
            chain1ContractFilePath: CROSS_CHAIN1_FILEPATH,
            chain2ContractAddress: CROSS_CHAIN2,
            chain2ContractFilePath: CROSS_CHAIN2_FILEPATH,
        });
        const chain1Balances = await getBalances(CHAIN1_WEB3, COIN_CHAIN1_FILEPATH);
        const chain2Balances = await getBalances(CHAIN2_WEB3, COIN_CHAIN2_FILEPATH);
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
        const balances = await getBalances(web3);
        res.json({
            success: true,
            balances,
        })
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


