# Adaptive Cross Network Transactions using Node.js and Ethereum

## Set Up:
1. Install Geth on your system, using this [link](https://geth.ethereum.org/docs/install-and-build/installing-geth).
2. Install Node.js based on your platform using the [link](https://nodejs.org/en/download/).
3. Install truffle using `npm i -g truffle` globally.
4. Move to root directory using `cd` command: `cd root`.
5. Install Node.js dependencies using `npm i`.
6. Start the blockchain networks using the following commands:
   1. Move to private-network1 in your terminal and run the following command to start private-network1
 ```shell
 geth --port 3002 --networkid 145 --nodiscover --datadir=./blkchain1 --maxpeers=0 --http --http.port 8543 --http.addr 127.0.0.1 --http.corsdomain "*" --http.api "eth,net,web3,personal,miner" --allow-insecure-unlock
 ```
 Open a new shell window and connect to the blockchain using:
 ```shell
 geth attach http://localhost:8543
 ```
 Once you are connected to the blockchain run the miner:
 ```js
 miner.start()
 ```
   2. In a new terminal window move to private-network2 directory to start private-network2
 ```shell
 geth --port 3001 --networkid 145 --nodiscover --datadir=./blkchain2 --maxpeers=0 --http --http.port 8544 --http.addr 127.0.0.1 --http.corsdomain "*" --http.api "eth,net,web3,personal,miner" --allow-insecure-unlock
 ```
 Open a new shell window and connect to the blockchain using:
 ```shell
 geth attach http://localhost:8544
 ```
 Once you are connected to the blockchain run the miner:
 ```js
 miner.start()
 ```
 7. Now in a new terminal window start the Node.Js server to run the simulator by using `node index.js` command.
 8. Now using postman or any other http client send a  request to the url: `http://localhost:3000/random-transaction` and wait for the response.
   