
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
       // toggle the status
      await config.flightSuretyData.setOperatingStatus(true);
      await config.flightSuretyData.setOperatingStatus(false);
      let newAirline = accounts[2];

      let reverted = false;
      try
      {
        //   await config.flightSuretyApp.re
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});

      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");

      // Set it back for other tests to work
    //   await config.flightSuretyData.setOperatingStatus(true);

  });


  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

    // ARRANGE
    let newAirline = accounts[2];


    // await config.flightSuretyData.setOperatingStatus(true);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    let isAuthorized = await config.flightSuretyData.isCallerAuthorized.call(config.flightSuretyApp.address);
    console.log('isauthorized: ' + isAuthorized);
    assert.equal(isAuthorized, true);

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isRegistered.call(newAirline);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });


  it('register another airline', async() =>{

    await config.flightSuretyData.setOperatingStatus(true);
    await config.flightSuretyData.setOperatingStatus(false);
    //fund airline
    await config.flightSuretyApp.fundAirline({from: config.firstAirline, value: 11});

    //register another airline
    await config.flightSuretyApp.registerAirline(accounts[3], {from: config.firstAirline});

    //verify new airline is registered
    let registeredAirlines = config.flightSuretyApp.getRegisteredAirlines();
    console.log('registered airline: ' + registeredAirlines);

  })



});
