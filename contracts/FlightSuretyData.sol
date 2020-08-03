pragma solidity >=0.4.21 <0.7.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/


    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false



    address[] registeredAirlines;
    mapping(address => bool) registered;

    struct PassengerInsurance{
        bool registered;
        uint amount;
    }

    mapping(address => mapping(bytes32 => PassengerInsurance)) passengerFlightInsurances;
    mapping(address => uint) passengerCredit;

    mapping(bytes32 => address[]) insuredPassengersByFlight;
    mapping(address => uint) airlineContributions;
    mapping(address => bool) authorizedCallers;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                    address firstAirlineAdr
                                )
                                public
    {
        contractOwner = msg.sender;
        //register first airline
        registeredAirlines.push(firstAirlineAdr);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorizedCaller(){
        require(authorizedCallers[msg.sender] == true, "Caller is not authorized");
        _;
    }


    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
                            external
                            view
                            returns(bool)
    {
        return operational;
    }

    function authorizeCaller(address contractAddress) external requireContractOwner{
        authorizedCallers[contractAddress] = true;
    }

    function deAuthorizeCaller(address contractAddress) public requireContractOwner{
        delete authorizedCallers[contractAddress];
    }

    function isCallerAuthorized(address contractAddress) external view returns (bool){
        return authorizedCallers[contractAddress];
    }
    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
                            (
                                bool mode
                            )
                            external
                            requireContractOwner
    {
        //check that it's not setting to a state that it already is in
        require(mode != operational, "this is already the existing state of the contract");
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function registerAirline(address airlineAddress) external requireIsOperational requireAuthorizedCaller returns (bool)
    {
        require(airlineAddress != address(0), "not a valid address for registering airline");
        require(!registered[airlineAddress], "airline already registered");
        registeredAirlines.push(airlineAddress);
        registered[airlineAddress] = true;
        return true;
    }

    function isRegistered(address airlineAddress) external view returns (bool){
        return registered[airlineAddress];
    }

    function getRegAirlineCount() external requireAuthorizedCaller view returns (uint){
        return registeredAirlines.length;
    }

   /**
    * @dev Buy insurance for a flight
    *
    */
    function buy
                            (
                            address _airline,
                            string calldata _flightName,
                            uint256 _timestamp,
                            address _passenger,
                            uint _amount
                            )
                            external
                            requireIsOperational
                            requireAuthorizedCaller
                            payable
    {

    bytes32 flightKey = getFlightKey(_airline, _flightName, _timestamp);
    require(!passengerFlightInsurances[_passenger][flightKey].registered, "already bought insurance");

    //add passenger info for the flight
    passengerFlightInsurances[_passenger][flightKey].amount = _amount;
    passengerFlightInsurances[_passenger][flightKey].registered = true;

    //add passengers who are insured
    insuredPassengersByFlight[flightKey].push(_passenger);

    }

    function getInsuredPassengersByFlight(address _airline, string calldata _flightName, uint256 _timestamp) internal  requireAuthorizedCaller view returns (address[] memory){
        bytes32 flightKey = getFlightKey(_airline, _flightName, _timestamp);
        return insuredPassengersByFlight[flightKey];
    }

    function getAmountInsuredByPassenger(address _airline, string calldata _flightName, uint256 _timestamp, address _passenger) internal requireAuthorizedCaller view returns(uint amount){
        bytes32 flightKey = getFlightKey(_airline, _flightName, _timestamp);
        return passengerFlightInsurances[_passenger][flightKey].amount;
    }

    function isFlightInsuredByPassenger(address airline, string calldata flightName, uint256 timestamp, address passenger)
            external requireAuthorizedCaller view returns (bool){
        return passengerFlightInsurances[passenger][getFlightKey(airline, flightName, timestamp)].registered;
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees (address _airline, string calldata _flightName, uint256 _timestamp, uint _multiplier) external requireIsOperational requireAuthorizedCaller
    {

        //find passengers who are affected by the flight
        address[] memory insuredPassengersByFlightList = getInsuredPassengersByFlight(_airline, _flightName, _timestamp);

        //credit accounts of insurees
        for(uint i=0; i < insuredPassengersByFlightList.length; i++){
            //get amount paid by insuree for the flight
            address passenger = insuredPassengersByFlightList[i];
            uint insuredAmount = getAmountInsuredByPassenger( _airline, _flightName, _timestamp, passenger);
            uint amountToCredit = insuredAmount.mul(_multiplier);
            //credit multiplier
            passengerCredit[passenger] = passengerCredit[passenger].add(amountToCredit);
        }
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                                uint amount,
                                address payable insuree
                            )
                            external
                            requireIsOperational
                            requireAuthorizedCaller
                            payable
    {
        //payout the insuree
        (bool success,  ) = insuree.call.value(amount)("");
        require(success, "Transfer failed.");
    }

   /**
    * @dev funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    */
    function fund
                            (
                                address airline,
                                uint amount
                            )
                            external
                            requireIsOperational
                            requireAuthorizedCaller
                            payable
    {
        airlineContributions[airline] = airlineContributions[airline].add(amount);
    }

    function getFunding(address airline) external requireIsOperational requireAuthorizedCaller view returns (uint){
        return airlineContributions[airline];
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    fallback() external payable{
        address(this).call.value(msg.value)("");
    }

    receive() external payable {}


}

