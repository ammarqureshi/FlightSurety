# FlightSurety

FlightSurety is a flight insurance application based on the Ethereum platform. Airlines can vote for which other airlines can participate in the contract. The airlines fund the smart contract and the passengers can purchase insurance for their flights. In case the oracles send an update that a particular flight has been delayed, the passengers who purchased insurance for that flight through the smart contract are compensated and are able to withdraw their funds from the smart contract.

![Screenshot 2020-08-07 at 20 34 10](https://user-images.githubusercontent.com/17296281/89681828-9bbe2500-d8ed-11ea-9caf-6bc446252bd8.png)

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`

## Setup Local Ganache environment
`npm run ganache`

## Develop Client

 ### to compile: 
`npm run compile`

### to test:
`truffle develop`
`truffle test`

### to migrate to local ganache environment:
`npm run migrate`

### to view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder


## Resources

* [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
* [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
* [Truffle Framework](http://truffleframework.com/)
* [Ganache Local Blockchain](http://truffleframework.com/ganache/)
* [Remix Solidity IDE](https://remix.ethereum.org/)
* [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
* [Ethereum Blockchain Explorer](https://etherscan.io/)
* [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
