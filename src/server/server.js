import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let ORACLE_COUNT = 20;

var FLIGHT_STATUS = {
  CODE_UNKNOWN: 0,
  CODE_ON_TIME: 10,
  CODE_LATE_AIRLINE: 20,
  CODE_LATE_WEATHER: 30,
  CODE_LATE_TECHNICAL: 40,
  CODE_LATE_HER: 50
};

// (async () => {
//   let accounts = await web3.eth.getAccounts();
//   console.log(accounts);
//   // all of the script....

// })();

// // nothing else
(async () => {

  let accounts = await web3.eth.getAccounts();

  //register oracle
  for (var i = 1; i < 21; i++) {
    await flightSuretyApp.methods.registerOracle().send({ from: accounts[i], value: web3.utils.toWei("1", "ether") , gas: 9999999});
    let oracleIndexes = await flightSuretyApp.methods.getMyIndexes().call({ from: accounts[i] });
    console.log('Oracle: ' + accounts[i] + ' indexes: ' + oracleIndexes);
  }


  //listen for OracleRequest events
  flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {

    if (error) {
      console.log(error);
    }

    else {
      //get all event parameters

      let index = event.returnValues.index;
      let airline = event.returnValues.airline;
      let flight = event.returnValues.flight;
      let timestamp = event.returnValues.timestamp;

      console.log('return values: ' + event.returnValues);

      //find oracles that match any of the index
      for (var i = 1; i < 21; i++) {
        let oracleIndexes = flightSuretyApp.methods.getMyIndexes().call({ from: accounts[i] });

        if (oracleIndexes.include(index)) {

          //randomize status
          var randomFlightStatus = Object.keys(FLIGHT_STATUS)[Math.floor(Math.random() * Object.keys(FLIGHT_STATUS).length)];

          //submit response
          flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, randomFlightStatus).send( {from: accounts[i] });

        }

      }

    }
  });


})();




const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})

export default app;


