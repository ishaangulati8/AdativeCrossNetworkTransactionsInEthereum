// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./Coin.sol";

contract CrossNetworkTransaction {

    // state variable for synchronous protocol
    mapping (address => int) public pending_transactions; 

    // state variable for asynchronous protocol
    mapping (address => int) public undo_log; 
    
    // contract address
    Coin _coin = Coin(0x4Af1fE1955Ed067dcC8BfB8352959b7949d73c6b);





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
    function reverseTransaction(address account) public returns(int){
        
        int delta_amount = undo_log[account];
        if (delta_amount < 0){
            // the transaction was a debit, so we add the amount back to reverse it
            uint amount = uint(-1*delta_amount);
            _coin.addBalance(account, amount);
            return 1;
        } 
        else if (delta_amount > 0){
            // the transaction was a credit, so we deduct the amount to reverse it
            uint amount = uint(delta_amount);
            _coin.deductBalance(account, amount);
            return 1;
        }
        else{
            // there is no entry for this account in the undo log
            return -1;
        }
    }

    function commitAsyncDebit(address account, uint amount)  public returns(int){
        // account is sending coins. balance verification required
        if (_coin.getBalance(account) < amount){
            // insufficient balance for transaction
            return -1;
        }

        // log transaction in undo log
        int delta_amount = int(amount);
        delta_amount *= -1;
        undo_log[account] = delta_amount;

        // commit debit
        _coin.deductBalance(account, amount);

        return 1;
    }

    function commitAsyncCredit(address account, uint amount)  public returns(int){
        
        // log transaction in undo log
        int delta_amount = int(amount);
        undo_log[account] = delta_amount;

        // commit debit
        _coin.addBalance(account, amount);

        return 1;
    }
}