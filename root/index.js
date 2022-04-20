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
            const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xE131e4136c6f8B193CbEF6552353ba0D9392D522'
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
        // const balances = await minter(web3);
        const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xE131e4136c6f8B193CbEF6552353ba0D9392D522'
        await makeRandomTransactions(web3, CONTRACT_ADDRESS);
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


