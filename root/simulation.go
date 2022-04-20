package main

import (
	"fmt"

	"github.com/ethereum/go-ethereum/ethclient"
)



func main() {
	client, err := ethclient.Dial("http://127.0.0.1:8543")
	if err != nil {
		panic(err)
	}
	fmt.Println(client)
}