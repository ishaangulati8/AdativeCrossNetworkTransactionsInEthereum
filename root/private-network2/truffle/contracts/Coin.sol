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
        accounts =  [0x288c2E0FEaD9B374de9c6D06f685Fe5Af02af9a2,
                    0xA76dF879718C97c39b7AE1C478E2AB7040508883,
                    0xdA3DA609Fa1821A5b6EB38b744d87E6Bd2EC69f8,
                    0xFC4f732e264056C0e67fF4628bB659BFe54D86d1,
                    0x645eaE8Cf8DC770e5BD0CA196EA0eB02A85005CF,
                    0xDf8d57889843AFcDe4e5b786F3a8Ba00026Baaba,
                    0x146e5aD6671D8cED3e25d91D298425cF9EC021b3,
                    0xd0bF06efDa59c96Fb50C24639c52D6F727620769,
                    0xaf3C523370A13444e469218641705f8cA90B4823,
                    0x77cdA257eFCf749a7f9dC9657048Db7E88BbC94A];
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
        emit TransactionCompleted(sender, receiver, amount);
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