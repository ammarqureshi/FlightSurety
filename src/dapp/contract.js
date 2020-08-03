import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, web3Provider, callback) {



        let config = Config[network];
        this.web3 = new Web3(web3Provider);
        console.log('web3 instantiated in contract')
        // Retrieving accounts
        this.web3.eth.getAccounts(function (err, res) {
            if (err) {
                console.log('Error:', err);
                return;
            }
            console.log('metamask:', res);

        })
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);


        // console.log('isOperational: ', this.flightSuretyApp.methods
        // .isOperational()
        // .call({ from: this.owner}, callback));


        isOperational((error, result) => {
            console.log('checking is operational§')
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        // this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {

            this.owner = accts[0];
            console.log('accts[0]' + accts[0]);
            // console.log('accts[1]' + accts[1]);


            // let counter = 1;

            // while(this.airlines.length < 5) {
            //     this.airlines.push(accts[counter++]);
            // }

            // while(this.passengers.length < 5) {
            //     this.passengers.push(accts[counter++]);
            // }



            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }


    fetchFlightStatus(flight, callback) {
        let self = this;

        this.web3.eth.getAccounts(function (err, res) {
            if (err) {
                console.log('Error:', err);
                return;
            }
            console.log('caller for fetch flights:', res);

        })

        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        }

        // callback(error, payload);
        // self.flightSuretyApp.methods
        //     .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
        //     .send({ from: self.owner}, (error, result) => {
        //         callback(error, payload);
        //     });
    }
}