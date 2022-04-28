const path = require('path');
const fs = require('fs');
const solc = require('solc');


function compileContract(contractFilePath, smartContractName) {
    try {
        const OS = process.platform;
        // TODO: Add relative path for windows OS.
        const CONTRACT_PATH = contractFilePath;
        const contractPath = path.resolve(__dirname, CONTRACT_PATH);
        const source = fs.readFileSync(contractPath, 'utf8');
        const contractName = `${smartContractName}.sol`;
        const input = {
            language: 'Solidity',
            sources: {
                [`${contractName}`]: {
                    content: source,
                },
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*'],
                    },
                },
            },
        };
        const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
        const contractFile = tempFile.contracts[contractName][smartContractName];
        return contractFile;
    } catch (err) {
        throw new Error(err);
    }
}

function getCoinContractString(coinContractPath) {
    try {
        const CONTRACT_PATH = coinContractPath;
        const contractPath = path.resolve(__dirname, CONTRACT_PATH);
        const source = fs.readFileSync(contractPath, 'utf8');
        const contractName = `Coin.sol`;
        const input = {
            language: 'Solidity',
            sources: {
                [`${contractName}`]: {
                    content: source,
                },
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*'],
                    },
                },
            },
        };
        const tempFile = JSON.parse(solc.compile(JSON.stringify(input)));
        return tempFile;
    } catch (error) {
        throw new Error(error)
    }

}
function compileCrossNetworkContract(contractFilePath, smartContractName, coinContractPath) {
    try {
        const CONTRACT_PATH = contractFilePath;
        const contractPath = path.resolve(__dirname, CONTRACT_PATH);
        const source = fs.readFileSync(contractPath, 'utf8');
        const contractPathCoin = path.resolve(__dirname, coinContractPath);
        const coinSource = fs.readFileSync(contractPathCoin, 'utf8');
        const contractName = `${smartContractName}.sol`;
        const coinContract = getCoinContractString(coinContractPath);
        const input = {
            language: 'Solidity',
            sources: {
                [`${contractName}`]: {
                    content: source,
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };

        function findImports(path) {
            if (path === 'Coin.sol')
                return {
                    contents: coinSource,
                };
            else return { error: 'File not found' };
        }

        // New syntax (supported from 0.5.12, mandatory from 0.6.0)
        const tempFile = JSON.parse(
            solc.compile(JSON.stringify(input), { import: findImports })
        );
        const contractFile = tempFile.contracts[contractName][smartContractName];
        return contractFile;
    } catch (error) {
        console.log(error);
        throw new Error(error)
    }
}

module.exports = { compileContract, compileCrossNetworkContract };


