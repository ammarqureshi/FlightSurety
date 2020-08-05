// import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
// import Config from './config.json';
// import Web3 from 'web3';
// import express from 'express';


// let config = Config['localhost'];
// let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
// web3.eth.defaultAccount = web3.eth.accounts[0];
// let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
// let ORACLE_COUNT = 20;

// var FLIGHT_STATUS = {
//   CODE_UNKNOWN: 0,
//   CODE_ON_TIME: 10,
//   CODE_LATE_AIRLINE: 20,
//   CODE_LATE_WEATHER: 30,
//   CODE_LATE_TECHNICAL: 40,
//   CODE_LATE_HER: 50
// };

// // (async () => {
// //   let accounts = await web3.eth.getAccounts();
// //   console.log(accounts);
// //   // all of the script....

// // })();

// // // nothing else
// (async () => {

//   let accounts = await web3.eth.getAccounts();


//   //register oracle
//   for (var i = 1; i < 21; i++) {
//     await flightSuretyApp.methods.registerOracle().send({ from: accounts[i], value: web3.utils.toWei("1", "ether") , gas: 9999999});
//     let oracleIndexes = await flightSuretyApp.methods.getMyIndexes().call({ from: accounts[i] });
//     console.log('Oracle: ' + accounts[i] + ' indexes: ' + oracleIndexes);
//   }


//   //listen for OracleRequest events
//   flightSuretyApp.events.OracleRequest({
//     fromBlock: 0
//   }, function (error, event) {

//     if (error) {
//       console.log(error);
//     }

//     else {
//       //get all event parameters

//       let index = event.returnValues.index;
//       let airline = event.returnValues.airline;
//       let flight = event.returnValues.flight;
//       let timestamp = event.returnValues.timestamp;

//       console.log('return values: ' + event.returnValues);

//       //find oracles that match any of the index
//       for (var i = 1; i < 21; i++) {
//         let oracleIndexes = flightSuretyApp.methods.getMyIndexes().call({ from: accounts[i] });

//         if (oracleIndexes.include(index)) {

//           //randomize status
//           var randomFlightStatus = Object.keys(FLIGHT_STATUS)[Math.floor(Math.random() * Object.keys(FLIGHT_STATUS).length)];

//           //submit response
//           flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, randomFlightStatus).send( {from: accounts[i] });

//         }

//       }

//     }
//   });


// })();




// const app = express();
// app.get('/api', (req, res) => {
//   res.send({
//     message: 'An API for use with your Dapp!'
//   })
// })

// export default app;



import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json'
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json'
import Config from './config.json'
import Web3 from 'web3'
import express from 'express'

// Flight status codees
const STATUS_CODE_UNKNOWN = 0
const STATUS_CODE_ON_TIME = 10
const STATUS_CODE_LATE_AIRLINE = 20
const STATUS_CODE_LATE_WEATHER = 30
const STATUS_CODE_LATE_TECHNICAL = 40
const STATUS_CODE_LATE_OTHER = 50
const ORACLES_COUNT = 30
const STATUSCODES = [
  STATUS_CODE_UNKNOWN,
  STATUS_CODE_ON_TIME,
  STATUS_CODE_LATE_AIRLINE,
  STATUS_CODE_LATE_WEATHER,
  STATUS_CODE_LATE_TECHNICAL,
  STATUS_CODE_LATE_OTHER
]
// Track all registered oracles
let oracles = {}
let config = Config['localhost']
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws'))
)
web3.eth.defaultAccount = web3.eth.accounts[0]
let flightSuretyApp = new web3.eth.Contract(
  FlightSuretyApp.abi,
  config.appAddress
)
let flightSuretyData = new web3.eth.Contract(
  FlightSuretyData.abi,
  config.dataAddress
)

web3.eth.getAccounts().then(accounts => {
  console.log('length :' + accounts.length)
  flightSuretyData.methods
    .authorizeCaller(config.appAddress)
    .send({ from: accounts[0] })
    .then(result => {
      console.log(
        'appAddress registered as the authorized contract of dataContract'
      )
    })
    .catch(error => {
      console.log('Error in authorizing appcontract. ' + error)
    })
  flightSuretyApp.methods
    .REGISTRATION_FEE()
    .call()
    .then(fee => {
      for (let a = 1; a < ORACLES_COUNT; a++) {
        flightSuretyApp.methods
          .registerOracle()
          .send({ from: accounts[a], value: fee, gas: 4000000 })
          .then(result => {
            flightSuretyApp.methods
              .getMyIndexes()
              .call({ from: accounts[a] })
              .then(indices => {
                oracles[accounts[a]] = indices
                console.log(
                  'Oracle registered: ' + accounts[a] + ' indices:' + indices
                )
              })
          })
          .catch(error => {
            console.log(
              'Error while registering oracles: ' +
                accounts[a] +
                ' Error: ' +
                error
            )
          })
      }
    })
})


flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 0
  },
  function (error, event) {
    if (error) console.log(error)
    else {
      console.log('Received OracleRequest event:  ' + JSON.stringify(event))
    }
  }
)

flightSuretyApp.events.FlightStatusInfo(
  {
    fromBlock: 0
  },
  function (error, event) {
    if (error) console.log(error)
    else {
      console.log('Received flightstatusInfo event:  ' + JSON.stringify(event))
    }
  }
)

flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 0
  },
  function (error, event) {
    if (error) console.log(error)
    else {
      const index = event.returnValues.index
      const airline = event.returnValues.airline
      const flight = event.returnValues.flight
      const timestamp = event.returnValues.timestamp
      // let randomstatusCode = STATUSCODES[Math.floor(Math.random()*STATUSCODES.length)];
      // console.log("statuscode is:" + randomstatusCode);
      for (var key in oracles) {
        var indexes = oracles[key]
        if (indexes.includes(index)) {
          let randomstatusCode = STATUS_CODE_LATE_AIRLINE // STATUSCODES[Math.floor(Math.random()*STATUSCODES.length)];
          flightSuretyApp.methods
            .submitOracleResponse(
              index,
              airline,
              flight,
              timestamp,
              randomstatusCode
            )
            .send({ from: key, gas: 1000000 })
            .then(result => {
              console.log(
                'Oracle response sent with statuscode: ' +
                  randomstatusCode +
                  ' for ' +
                  flight +
                  ' and index:' +
                  index
              )
            })
            .catch(error => {
              console.log(
                'Error while sending Oracle response  for ' +
                  flight +
                  ' Error:' +
                  error
              )
            })
        }
      }
      // console.log(event);
    }
  }
)

const app = express()
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})

export default app


