// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

contract Mint {
    // The keyword "public" makes variables
    // accessible from other contracts
    address public minter;
    address[10] public accounts;
    mapping (address => uint) public balances;


    // Constructor code is only run when the contract
    // is created
    constructor() {
        minter = msg.sender;
        accounts =  [0x0cAA0C75eb072ABf72a61dF0a2Cd84A8d8E078da,
                    0xd9437084aaA20716C43B8dA138591b5aC7acF9A6, 
                    0x3af25D87fE2422CeD6a2bbbbeDf27825983235A2, 
                    0x3b3efc0dDd12845B1F310E746be522440F2E00D0,
                    0x45Bf2462d250A614bB28b391215004EeD2a7b99E, 
                    0xBedbba51B64ec575e28156c16980211B88d12b49, 
                    0x51f47a0B2A62433828BD256A40b408df9CC75782, 
                    0x1e02F1624962c1777324D51382436Bc969537F29, 
                    0xD316b5e627F2BeB8c95e7Ed786AFDe75a3a90bba, 
                    0xaaD5e06B60D5B9210a02C3001F784dD2d20Cd252];
    }
    // Sends an amount of newly created coins to an address
    // Can only be called by the contract creator
    function mint() public {
        uint starting_balance = 100000;
        require(msg.sender == minter);

        for (uint i=0; i<10; i++){
            balances[accounts[i]] = starting_balance;
        }
    }

    function getBalance(address addr) public view returns(uint) {
        return balances[addr];
    }
    
    function getBalances() public view returns(string[] memory) {
        string[] memory acount_balance = new string[](10);
    

        for (uint i=0; i<10; i++){
            // format account number and balance to strings and concatenate
            bytes32 i_bytes = bytes32(i);
            bytes memory bytesString = new bytes(32);
            for (uint j=0; j<32; j++) {
                byte char = byte(bytes32(uint(data) * 2 ** (8 * j)));
                if (char != 0) {
                    bytesString[j] = char;
                }
            }
            string i_string = string(bytesString);




            acount_balance[i] = : " + balances[accounts[i]];
        }
        return acount_balance;
    }

    // Events allow clients to react to specific
    // contract changes you declare
    event TransactionCompleted(address from, address to, uint amount);

    function makeRandomTransaction() public {

        uint amount = 100;

        address sender =    0x0cAA0C75eb072ABf72a61dF0a2Cd84A8d8E078da;
        address receiver =  0x0cAA0C75eb072ABf72a61dF0a2Cd84A8d8E078da;

        uint i = block.number % 10;
        uint j = block.timestamp % 10;

        while (sender == receiver || amount > balances[sender]){
           i += 1;
           j += 2;
           sender = accounts[i % 10];
           receiver = accounts[j % 10];
        }

        // send coins
        balances[sender] -= amount;
        balances[receiver] += amount;
        emit TransactionCompleted(sender, receiver, amount);


    }
}