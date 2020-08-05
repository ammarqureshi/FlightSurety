import DOM from './dom'
import Contract from './contract'
import './flightsurety.css'
import config from './config.json'
import Web3 from 'web3'
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json'
  ;(async () => {
  let result = null

  let contract = new Contract('localhost', () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result)
      display('Operational Status', 'Check if contract is operational', [
        { label: 'Operational Status', error: error, value: result }
      ])
    })

    contract.flightSuretyApp.methods
      .getRegisteredAirlines()
      .call({ from: contract.owner }, (error, result) => {

        console.log('all airlines: ' + result)
        console.log('contract.airlines: ' + JSON.stringify(contract.airlines));
        populateRegisteredAirlines(
          contract.airlines,
          result,
          'registered-airlines'
        )
        populateRegisteredAirlines(
          contract.airlines,
          result,
          'insurance-airline'
        )
        populateRegisteredAirlines(contract.airlines, result, 'funding-airline')
        populateRegisteredAirlines(contract.airlines, result, 'status-airline')
        initialize(contract.airlines)
        populateAirlines(contract.airlines, result, 'airline-address')

        // populate airline funding
        let fundingairline = DOM.elid('funding-airline').value
        contract.flightSuretyApp.methods
          .getAirlineBalance(fundingairline.toString())
          .call({ from: contract.owner }, (error, result) => {
            const funds_ether = contract.web3.utils.fromWei(result, 'ether')
            populateFunding(funds_ether)
          })
      })

    populatePassengerList(contract.passengers, 'withdraw-passenger')
    populatePassengerList(contract.passengers, 'insurance-passenger')
    // populates all the airlines in the airline to register dropdown
    // populate insured funds
    let passenger = DOM.elid('withdraw-passenger').value
    contract.getPassengerBalance(passenger, (error, result) => {
      if (!error) {
        const funds = contract.web3.utils.fromWei(result, 'ether')
        populateBalance(funds)
      }
    })

    DOM.elid('register-airline').addEventListener('click', () => {
      let x = DOM.elid('registered-airlines')
      let airlinetoregister = DOM.elid('airline-address').value
      console.log('to airline:' + airlinetoregister)
      let fromairline = x.options[x.selectedIndex].value
      console.log('from:' + fromairline)
      contract.registerAirline(
        fromairline,
        airlinetoregister,
        (error, result) => {
          if (error) {
            display('Airlines', 'Register Airline', [
              { label: 'Register Airline', error: error, value: result }
            ])
          }

          if (!error) {
            display('Airlines', 'Register Airline', [
              { label: 'Register Airline', error: error, value: result }
            ])

            contract.flightSuretyApp.methods
              .getRegisteredAirlines()
              .call({ from: contract.owner }, (error, result) => {
                console.log(result)
                populateRegisteredAirlines(
                  contract.airlines,
                  result,
                  'registered-airlines'
                )
                populateRegisteredAirlines(
                  contract.airlines,
                  result,
                  'insurance-airline'
                )
                populateRegisteredAirlines(
                  contract.airlines,
                  result,
                  'funding-airline'
                )
                populateRegisteredAirlines(
                  contract.airlines,
                  result,
                  'status-airline'
                )
                populateAirlines(contract.airlines, result, 'airline-address')
                initialize(contract.airlines)
                initializeStatus(contract.airlines)
              })
          }
        }
      )
    })

    // User-submitted transaction
    DOM.elid('funding-airline').addEventListener('change', () => {
      let fundingairline = DOM.elid('funding-airline').value

      contract.flightSuretyApp.methods
        .getAirlineBalance(fundingairline.toString())
        .call({ from: contract.owner }, (error, result) => {
          const funds_ether = contract.web3.utils.fromWei(result, 'ether')
          populateFunding(funds_ether)
        })
    })

    DOM.elid('fund-airline').addEventListener('click', () => {
      let funds_ether = DOM.elid('airline-funds').value
      let fundingairline = DOM.elid('funding-airline').value

      // Write transaction
      contract.sendFunds(fundingairline, funds_ether, (error, result) => {
        // display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result + ' ' + result.args.flight + ' ' + result.args.timestamp} ]);
        display('Airline Funding', 'Send Funds', [
          { label: 'Send Funds', error: error, value: result }
        ])
        if (!error) {
          contract.flightSuretyApp.methods
            .getAirlineBalance(fundingairline.toString())
            .call({ from: contract.owner }, (error, result) => {
              console.log(result)
              const funds_ether = contract.web3.utils.fromWei(result, 'ether')
              populateFunding(funds_ether)
            })
        }
      })
    })

    // purchase insurance for flight
    DOM.elid('purchase-insurance').addEventListener('click', () => {
      let airline = DOM.elid('insurance-airline').value
      let flight = DOM.elid('insurance-flight-number').value
      let funds_ether = DOM.elid('insurance-add-funds').value
      let passenger = DOM.elid('insurance-passenger').value
      let ts = DOM.elid('insurance-datepicker').value
      let timestamp = new Date(ts).getTime() / 1000

      // Write transaction
      contract.purchaseInsurance(
        airline,
        flight,
        passenger,
        funds_ether,
        timestamp,
        (error, result) => {
          console.log(error)
          display('Insurance', 'Purchase Insurance', [
            { label: 'Purchase Insurance', error: error, value: result }
          ])
        }
      )
    })

    // withdraw balance for flight
    DOM.elid('withdraw-funds').addEventListener('click', () => {
      let funds = DOM.elid('withdraw-amount').value
      let passenger = DOM.elid('withdraw-passenger').value

      // Write transaction
      contract.withdrawFunds(passenger, funds, (error, result) => {
        display('Withdraw', 'Withdraw Funds', [
          { label: 'Withdraw Funds', error: error, value: result }
        ])
        let passenger = DOM.elid('withdraw-passenger').value
        contract.getPassengerBalance(passenger, (error, result) => {
          if (!error) {
            const funds = contract.web3.utils.fromWei(result, 'ether')
            populateBalance(funds)
          }
        })
      })
    })

    DOM.elid('withdraw-passenger').addEventListener('change', () => {
      let passenger = DOM.elid('withdraw-passenger').value

      contract.getPassengerBalance(passenger, (error, result) => {
        if (error) {
          display('Withdraw', 'Withdraw funds', [
            { label: 'Get Balance', error: error, value: result }
          ])
          populateBalance(0)
        } else {
          const funds = contract.web3.utils.fromWei(result, 'ether')
          populateBalance(funds)
        }
      })
    })

    DOM.elid('insurance-airline').addEventListener('change', () => {
      let airline = DOM.elid('insurance-airline').value
      // console.log("test airline" + airline);
      let airlineObj = contract.airlines.find(a => {
        return a.address == airline
      })
      populateFlights(airlineObj.flights, 'insurance-flight-number')
    })
    DOM.elid('status-airline').addEventListener('change', () => {
      let airline = DOM.elid('status-airline').value
      let airlineObj = contract.airlines.find(a => {
        return a.address == airline
      })
      populateFlights(airlineObj.flights, 'status-flight-number')
    })

    DOM.elid('submit-oracle').addEventListener('click', () => {
      let flight = DOM.elid('status-flight-number').value
      let airline = DOM.elid('status-airline').value
      let ts = DOM.elid('status-datepicker').value
      let timestamp = new Date(ts).getTime() / 1000
      // Write transaction
      contract.fetchFlightStatus(
        airline,
        flight,
        timestamp,
        (error, result) => {
          display('Oracles', 'Trigger oracles', [
            { label: 'Fetch Flight Status', error: error, value: result }
          ])
        }
      )
    })
  })
  let web3 = new Web3(
    new Web3.providers.WebsocketProvider(
      config['localhost'].url.replace('http', 'ws')
    )
  )
  web3.eth.defaultAccount = web3.eth.accounts[0]
  let flightSuretyApp = new web3.eth.Contract(
    FlightSuretyApp.abi,
    config['localhost'].appAddress
  )
  flightSuretyApp.events.FlightStatusInfo(
    {
      fromBlock: 0
    },
    function (error, result) {
      if (error) console.log(error)
      else {
        display('Oracles', 'Trigger oracles', [
          {
            label: 'Fetch Flight Status',
            error: error,
            value:
              result.transactionHash +
              ' ' +
              result.returnValues.flight +
              ' ' +
              result.returnValues.timestamp +
              ' ' +
              getStatus(result.returnValues.status)
          }
        ])
        let passenger = DOM.elid('withdraw-passenger').value
        contract.getPassengerBalance(passenger, (error, result) => {
          if (!error) {
            const funds = contract.web3.utils.fromWei(result, 'ether')
            populateBalance(funds)
          }
        })
      }
    }
  )
})()

function initialize (airlines) {
  // initialize flights
  let airline = DOM.elid('insurance-airline').value
  let selectedairline = airlines.find(a => {
    return a.address == airline
  })
  console.log('insured airline:' + selectedairline)
  populateFlights(selectedairline.flights, 'insurance-flight-number')

  // initialize flights for getStatus
  airline = DOM.elid('status-airline').value
  selectedairline = airlines.find(a => {
    return a.address == airline
  })
  console.log('status airline:' + selectedairline)
  populateFlights(selectedairline.flights, 'status-flight-number')
}

function initializeStatus (airlines) {
  // initialize flights
  let airline = DOM.elid('status-airline').value
  let selectedairline = airlines.find(a => {
    return a.address == airline
  })
  // console.log("insured airline:" + selectedairline);

  populateFlights(selectedairline.flights, 'status-flight-number')
}

function populateBalance (balance) {
  var balancetxt = document.getElementById('withdraw-balance')
  balancetxt.value = balance
  console.log('balance :' + balance)
}

function populatePassengerList (passengers, elid) {
  var list = document.getElementById(elid)
  list.innerHTML = ''

  passengers.forEach(passenger => {
    var option = document.createElement('option')
    option.text = passenger.name
    option.value = passenger.address
    list.add(option)
  })
}

function populateFunding (funds) {
  var fund = document.getElementById('airline-balance')
  fund.value = funds
}

function populateRegisteredAirlines (airlines, registeredAirlines, airlineel) {
  var list = document.getElementById(airlineel)
  list.innerHTML = ''
  registeredAirlines.forEach(address => {
    var option = document.createElement('option')
    const airline = airlines.find(a => {
      return a.address == address
    })

    option.value = address
    option.text = airline.name
    list.add(option)
  })
}

function populateAirlines (airlines, registeredairlines, airlineid) {
  var list = document.getElementById(airlineid)
  list.innerHTML = ''
  airlines.forEach((airline, index) => {
    if (registeredairlines.indexOf(airline.address) < 0) {
      var option = document.createElement('option')
      option.text = airline.name
      option.value = airline.address
      list.add(option)
    }
  })
}

function populateFlights (flights, elid) {
  var list = document.getElementById(elid)
  list.innerHTML = ''
  flights.forEach(flight => {
    var option = document.createElement('option')
    option.text = flight
    list.add(option)
  })
}

function display (title, description, results) {
  let displayDiv = DOM.elid('display-wrapper')
  let section = DOM.section()
  section.appendChild(DOM.h2(title))
  section.appendChild(DOM.h5(description))
  results.map(result => {
    let row = section.appendChild(DOM.div({ className: 'row' }))
    row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label))
    row.appendChild(
      DOM.div(
        { className: 'col-sm-8 field-value' },
        result.error ? String(result.error) : String(result.value)
      )
    )
    section.appendChild(row)
  })
  displayDiv.append(section)
}

function getStatus (status) {
  switch (status) {
    case '10':
      return 'STATUS_CODE_ON_TIME'
    case '20':
      return 'STATUS_CODE_LATE_AIRLINE'
    case '30':
      return 'STATUS_CODE_LATE_WEATHER'
    case '40':
      return 'STATUS_CODE_LATE_TECHNICAL'
    case '50':
      return 'STATUS_CODE_LATE_OTHER'
    case '0':
      return 'STATUS_CODE_UNKNOWN'
  }
}
