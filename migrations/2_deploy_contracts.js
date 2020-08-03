// const FlightSuretyApp = artifacts.require("FlightSuretyApp");
// const FlightSuretyData = artifacts.require("FlightSuretyData");
// const fs = require('fs');

// module.exports = function(deployer) {

//     let firstAirline = '0xfFAb0a348286c23E6D50415bB217d69A44e6FC04';
//     deployer.deploy(FlightSuretyData)
//     .then(() => {
//         return deployer.deploy(FlightSuretyApp)
//                 .then(() => {
//                     let config = {
//                         localhost: {
//                             url: 'http://localhost:8545',
//                             dataAddress: FlightSuretyData.address,
//                             appAddress: FlightSuretyApp.address
//                         }
//                     }
//                     fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
//                     fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
//                 });
//     });
// }

const FlightSuretyApp = artifacts.require('FlightSuretyApp')
const FlightSuretyData = artifacts.require('FlightSuretyData')
const fs = require('fs')

module.exports = function (deployer) {
  let firstAirline = '0xfFAb0a348286c23E6D50415bB217d69A44e6FC04'
  deployer.deploy(FlightSuretyData, firstAirline).then(() => {
    return deployer
      .deploy(FlightSuretyApp, FlightSuretyData.address)
      .then(() => {
        let config = {
          localhost: {
            url: 'http://localhost:8545',
            dataAddress: FlightSuretyData.address,
            appAddress: FlightSuretyApp.address
          }
        }
        fs.writeFileSync(
          __dirname + '/../src/dapp/config.json',
          JSON.stringify(config, null, '\t'),
          'utf-8'
        )
        fs.writeFileSync(
          __dirname + '/../src/server/config.json',
          JSON.stringify(config, null, '\t'),
          'utf-8'
        )
      })
  })
}
