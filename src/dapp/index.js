
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';
import Config from './config.json';
import Web3 from 'web3';

import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';

// var FlightSuretyApp = artifacts.require("FlightSuretyApp");
// var FlightSuretyData = artifacts.require("FlightSuretyData");





(async() => {

    let result = null;
    let config = Config['localhost'];
    console.log('config url: ' + config);
    let web3Provider;
    if (window.ethereum) {
        web3Provider = window.ethereum;
        try {
            // Request account access
            console.log('request account access');
            await window.ethereum.enable();
            console.log('ethereum window enabled')
        } catch (error) {
            // User denied account access...
            console.error("User denied account access")
        }
    }

     // Legacy dapp browsers...
     else if (window.web3) {
        web3Provider = window.web3.currentProvider;
        console.log('currrent provider web3: ' +  web3Provider);
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
        // this.web3 = new Web3.providers.HttpProvider('http://localhost:9545');
        console.log('config url: ' + config.url)
        web3Provider = new Web3(new Web3.providers.HttpProvider(config.url))
        console.log('config url web3: ' + web3Provider);

    }
    // await window.ethereum.enable();
    let web3 = new Web3(web3Provider);

    //  let web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    console.log('web3: ' + JSON.stringify(web3.eth.Contract.defaultAccount));
    console.log('web3 instantiated in contract')
    // Retrieving accounts

    let owner;
    web3.eth.getAccounts(function (err, res) {
        if (err) {
            console.log('Error:', err);
            return;
        }
        console.log('metamask:', res);
        owner = res;

    })
    console.log('abi: ' + FlightSuretyApp);
    console.log('appAddress: ' + config.appAddress);
    let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi,  config.appAddress);


    console.log('flight surety app: ' +JSON.stringify(await flightSuretyApp.methods));


    // let status = await flightSuretyApp.methods
    // .isOperational()
    // .call();

    // console.log('status: ' + status);
    flightSuretyApp.methods
    .isOperational()
    .call({ from: owner}).then(function(result){console.log('isOperational: ' + result)}).catch(function(err){'error: ' + err});

    //    // Read transaction
    //     contract.isOperational((error, result) => {
    //         console.log('checking is operational§')
    //         console.log(error,result);
    //         display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
    //     });





})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







