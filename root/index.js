require('dotenv').config({});

const Web3 = require('web3');
const express = require('express');
const bodyParser = require('body-parser');

const { interactWithContract: minter, getBalances } = require('./deploy.js');

const app = express();


app.use(bodyParser.json());

let web3;
const PORT = process.env.PORT || 3001;
const IPC_URL = process.env.IPC_URL || 'http://127.0.0.1:8543';

app.listen(PORT, (err) => {
    if (err) {
        console.err(err);
    } else {
        web3 = new Web3(new Web3.providers.HttpProvider(IPC_URL));
        console.log('Server started successfully on port: ', PORT);
    }
});

app.use('/random-transaction', async (req, res, next) => {
    try {
        const balances = await minter(web3);
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



