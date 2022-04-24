// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./Coin.sol";

contract CrossNetworkTransaction {

    mapping (address => int) public pending_transactions; 
    
    // contract address
    Coin _coin = Coin(0x20C319d05fDB8Ae786053E7cdc734324D9804e36);

    function prepare(address account, int amount) public returns(int) {
       
        if (amount < 0){
            // account is sending coins. balance verification required
            if (int(_coin.getBalance(account)) < (-1*amount)){
                // insufficient balance for transaction
                return -1;
            }
        }
        //  pending_transactions is used later to commit the transaction or undo transaction preparation
        pending_transactions[account] = amount;
        return 1;
    }

    function commit(address account) public returns (int){
        // commit balance change
        if (pending_transactions[account] == 0){
            return -1;
        }
        _coin.changeBalance(account, pending_transactions[account]);
        return 1;
    }

    function clearTransactionLog(address account) public returns (int){
        pending_transactions[account] = 0;
        return 1;
    }

    function abort(address account) public returns (int){
        clearTransactionLog(account);
        return 1;
    }
}