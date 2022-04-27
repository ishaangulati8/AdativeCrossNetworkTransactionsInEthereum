// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./Coin.sol";

contract CrossNetworkTransaction {

    // state variable for synchronous protocol
    mapping (address => int) public pending_transactions; 

    //state variables for asynchronous protocol
    struct Transaction { 
        address account;
        int amount;
        int t_id;
    }

    Transaction[25] undo_log;
    
    // contract address
    Coin _coin = Coin(0x0);


    // synchronous functions
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
    
        if (pending_transactions[account] == 0){
            return -1;
        }

        int delta_amount = pending_transactions[account];
        uint amount;
        if (delta_amount < 0){
            amount = uint(-1*delta_amount);
            _coin.deductBalance(account, amount);
        } else {
            amount = uint(delta_amount);
            _coin.addBalance(account, amount);
        }

        clearTransactionLog(account);
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


    // asynchronous functions
    function log(address account, int amount, int t_id) public {
        Transaction memory transaction = Transaction(account, amount, t_id);
        for (uint i = undo_log.length; i > 0; i--){
            undo_log[i] = undo_log[i-1];
        }
        undo_log[0] = transaction;

    }

    function commitAsynDebit(address account, uint amount, int t_id)  public returns(int){
        // account is sending coins. balance verification required
        if (_coin.getBalance(account) < amount){
            // insufficient balance for transaction
            return -1;
        }

        // log transaction in undo log
        int delta_amount = int(amount);
        delta_amount *= -1;
        log(account, delta_amount, t_id);

        // commit debit
        _coin.deductBalance(account, amount);
    }

    function commitAsynCredit(address account, uint amount, int t_id)  public returns(int){
        
        // log transaction in undo log
        int delta_amount = int(amount);
        log(account, delta_amount, t_id);

        // commit debit
        _coin.addBalance(account, amount);
    }
}