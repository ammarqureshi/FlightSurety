import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json'
import Config from './config.json'
import Web3 from 'web3'

export default class Contract {
  constructor (network, callback) {
    let config = Config[network]
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url))
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      config.appAddress
    )
    this.initialize(callback)
    this.owner = null
    this.airlines = []
    this.airlineIds = ['DELTA', 'UNITED', 'ALASKA', 'SOUTHWEST', 'JET']
    this.passengers = []
    this.passengerIds = ['MARK', 'JOHN', 'RAVI', 'SMITH', 'SHRUTI']
    this.flightIds = [
      'D01',
      'D02',
      'D03',
      'U01',
      'U02',
      'U03',
      'A01',
      'A02',
      'A03',
      'S01',
      'S02',
      'S03',
      'J01',
      'J02',
      'J03'
    ]
  }

  initialize (callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0]
      console.log('owner: ' + this.owner);
      let counter = 0
      let flightIdIndex = 0

      while (this.airlines.length < 5) {
        const airlineObj = {}
        airlineObj.address = accts[counter]
        airlineObj.name = this.airlineIds[counter]
        airlineObj.flights = [
          this.flightIds[flightIdIndex],
          this.flightIds[flightIdIndex + 1],
          this.flightIds[flightIdIndex + 2]
        ]
        flightIdIndex += 3
        counter++
        this.airlines.push(airlineObj)
      }

      let passengerIdIndex = 0
      while (this.passengers.length < 5) {
        const passengerObj = {}
        passengerObj.address = accts[counter]
        passengerObj.name = this.passengerIds[passengerIdIndex++]
        counter++
        this.passengers.push(passengerObj)
      }

      callback()
    })
  }

  isOperational (callback) {
    let self = this
    console.log('caller: ' + self.owner)

    this.web3.eth.getAccounts(function (err, res) {
      if (err) {
          console.log('Error:', err);
          return;
      }
      console.log('getMetaskID:', res);

  })

    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback)
  }
  fetchFlightStatus (airline, flight, timestamp, callback) {
    let self = this
    let payload = {
      airline: airline,
      flight: flight,
      timestamp
    }

    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.owner }, (error, result) => {
        callback(error, result)
      })
  }

  registerAirline (registeredAirline, airlineToBeRegistered, callback) {
    let self = this

    self.flightSuretyApp.methods
      .registerAirline(airlineToBeRegistered.toString())
      .send(
        { from: registeredAirline.toString(), gas: 1000000 },
        (error, result) => {
          callback(error, result)
        }
      )
  }

  sendFunds (airline, funds, callback) {
    let self = this
    const fundAmount = self.web3.utils.toWei(funds, 'ether')

    self.flightSuretyApp.methods
      .fundAirline()
      .send(
        { from: airline.toString(), value: fundAmount },
        (error, result) => {
          callback(error, result)
        }
      )
  }

  purchaseInsurance (
    airline,
    flight,
    passenger,
    funds_ether,
    timestamp,
    callback
  ) {
    let self = this
    const fundAmount = self.web3.utils.toWei(funds_ether, 'ether')
    console.log('fund amount: ' + fundAmount);
    self.flightSuretyApp.methods
      .registerFlightInsurance(airline.toString(), flight.toString(), timestamp)
      .send(
        { from: passenger.toString(), value: fundAmount, gas: 1000000 },
        (error, result) => {
          callback(error, result)
        }
      )
  }

  withdrawFunds (passenger, funds, callback) {
    let self = this

    const amount = self.web3.utils.toWei(funds, 'ether')
    self.flightSuretyApp.methods
      .withdrawFunds(amount)
      .send({ from: passenger.toString() }, (error, result) => {
        callback(error, result)
      })
  }

  getPassengerBalance (passenger, callback) {
    let self = this
    self.flightSuretyApp.methods
      .getPassengerBalance()
      .call({ from: passenger }, (error, result) => {
        callback(error, result)
      })
  }
}
