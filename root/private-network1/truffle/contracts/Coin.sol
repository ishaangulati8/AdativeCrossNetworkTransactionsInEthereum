// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

contract Coin {
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
        // require(msg.sender == minter);

        for (uint i=0; i<10; i++){
            balances[accounts[i]] = starting_balance;
        }
    }

    function getBalance(address addr) public view returns(uint) {
        return balances[addr];
    }


    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT licence
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    function getBalances() public view returns(string[10] memory) {
        string[10] memory account_and_balance;
    
        for (uint i=0; i<10; i++){
            
            string memory i_str = toString(i);
            string memory account_str = string(abi.encodePacked("Account ", i_str));  
            string memory balance_str = toString(balances[accounts[i]]);
        
            account_and_balance[i] = string(abi.encodePacked(account_str, ": ", balance_str));
        }

        return account_and_balance;
    }

    // Events allow clients to react to specific
    // contract changes you declare
    event TransactionCompleted(address from, address to, uint amount);

    function makeTransaction(address sender, address receiver, uint amount) public returns (int) {
        if (amount > balances[sender]) {
            return -1;
        }
        // send coins
        balances[sender] -= amount;
        balances[receiver] += amount;
        // emit TransactionCompleted(sender, receiver, amount);
        return 1;
    }

    // function changeBalance(address account, int amount) public {
    //     uint u_amount;
    //     if (amount < 0){
    //         // subtract balance if ammount is negative
    //         u_amount = uint(-1*amount);
    //         balances[account] -= u_amount;
    //     } else{
    //         // add balance if ammount is positive
    //         u_amount = uint(amount);
    //          balances[account] += u_amount;
    //     }
    // }

    function deductBalance(address account, uint amount) public {
        balances[account] -= amount;
    }

     function addBalance(address account, uint amount) public {
        balances[account] += amount;
    }
}