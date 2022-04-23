require('dotenv').config();

const Web3 = require('web3');
const express = require('express');
const bodyParser = require('body-parser');

const { interactWithContract: minter, getBalances, makeRandomTransactions, mint } = require('./simulation.js');

const app = express();


app.use(bodyParser.json());

let web3;
const PORT = process.env.PORT || 3000;
const IPC_URL = process.env.IPC_URL || 'http://127.0.0.1:8543';

app.listen(PORT, async(err) => { 
    try {
        if (err) {
            console.err(err);
            process.exit(1);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider(IPC_URL));
            const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x20C319d05fDB8Ae786053E7cdc734324D9804e36'
            await mint(web3, CONTRACT_ADDRESS)
            console.log('Server started successfully on port: ', PORT);
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
});

app.use('/random-transaction', async (req, res, next) => {
    try {
        const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x20C319d05fDB8Ae786053E7cdc734324D9804e36'
        await makeRandomTransactions(web3, CONTRACT_ADDRESS);
        const balances = await getBalances(web3);
        res.status(200).json({
            success: true,
            balances,
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


