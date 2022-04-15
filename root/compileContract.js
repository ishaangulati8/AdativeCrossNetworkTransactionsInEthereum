const path = require('path');
const fs = require('fs');
const solc = require('solc');


function compileContract() {
    try {
        const OS = process.platform;
        // TODO: Add relative path for windows OS.
        const CONTRACT_PATH = OS === 'darvin' ? './truffle/contracts/Mint.sol' : 'C:\Users\Neha Surana\blockheads\root\truffle\contracts\Mint.sol'
        const contractPath = path.resolve(__dirname, CONTRACT_PATH);
        const source = fs.readFileSync(contractPath, 'utf8');
        const input = {
            language: 'Solidity',
            sources: {
                'Mint.sol': {
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
        const contractFile = tempFile.contracts['Mint.sol']['Mint'];
        return contractFile;
    } catch (err) {
        throw Error(err);
    }
}

module.exports = compileContract;


