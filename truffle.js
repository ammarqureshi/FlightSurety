var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic =   'doll source together survey box meat assist green sand conduct ostrich ginger';

module.exports = {
  networks: {
    development: {
      // provider: function() {
      //   return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/", 0, 50);
      // },
      // network_id: '*',
      // gas: 9999999
      host: "127.0.0.1",     // Localhost
      port: 8545,            // Standard Ganache UI port
      network_id: "*",
      gas: 4600000
    }
  },
  compilers: {
    solc: {
      version: "^0.6.0"
    }
  }
};