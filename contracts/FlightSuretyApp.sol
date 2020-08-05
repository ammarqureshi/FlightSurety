// pragma solidity >=0.4.21 <0.7.0;
pragma solidity >=0.4.0 <0.7.0;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    //reference for the data contract
    FlightSuretyData private flightSuretyData;


    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    uint private constant MIN_AIRLINE_CONTRIBUTION = 10 ether;
    uint private constant MAX_INSURANCE_FLIGHT_BY_PASSENGER = 1 ether;
    address private contractOwner;          // Account used to deploy contract

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }

    bool operational;
    address flightSuretyDataContractAddress;
    uint8 private constant CONSENSUS_THRESHOLD = 3;
    mapping(bytes32 => Flight) private flights;
    mapping(address => address[]) private airlineVoters;


    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.


    modifier airlineHasContirbutedMinFunding(){
        //get funding amount
        uint currFunds = flightSuretyData.getFunding(msg.sender);

        require(currFunds >= MIN_AIRLINE_CONTRIBUTION, "airline has not funded enough to participate");
        _;
    }

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
         // Modify to call data contract's status
        require(isOperational(), "Contract is currently not operational");
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

    modifier airlineRegistered(){
        require(flightSuretyData.isRegistered(msg.sender), "airline not registered");
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address dataContract) public
    {
        contractOwner = msg.sender;

        //reference the deployed data contract
        flightSuretyData = FlightSuretyData(dataContract);
        flightSuretyDataContractAddress = dataContract;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational()
                            public
                            view
                            returns(bool)
    {
        return flightSuretyData.isOperational();  // Modify to call data contract's status
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


   /**
    * @dev Add an airline to the registration queue
    *
    */
    function registerAirline
                            (
                                address airlineAdr
                            )
                            external
                            requireIsOperational
                            airlineRegistered
                            airlineHasContirbutedMinFunding
                            returns(bool _success, uint256 _votes)
    {

        require(airlineAdr != address(0), "not a valid address");
        require(!flightSuretyData.isRegistered(airlineAdr), "airline already registered");

        bool success = false;
        uint256 currVotes = 0;
        uint regAirlineCount = flightSuretyData.getRegAirlineCount();

        //check num of registered airlines
        if(regAirlineCount <= CONSENSUS_THRESHOLD){
            // flightSuretyData.registerAirline(airlineAdr);
            success = flightSuretyData.registerAirline(airlineAdr);
        }

        //need multi-party consensus to register this airline
        else{

            //make sure airlines can only vote once
            bool hasVotedBefore = false;
            address[] memory voters = airlineVoters[airlineAdr];
            for(uint i = 0; i < voters.length; i++){
                if(voters[i] == msg.sender){
                    hasVotedBefore = true;
                    break;
                }
            }
            require(!hasVotedBefore, "caller has already voted before to register the airline");

            //if hasnt voted before, add into list of voters to register that airline
            airlineVoters[airlineAdr].push(msg.sender);
            currVotes = airlineVoters[airlineAdr].length;

            //check if airline has received enough votes to be registered
            if(currVotes > regAirlineCount.div(2)){
                success = flightSuretyData.registerAirline(airlineAdr);
            }

        }

        return (success, currVotes);
    }

    function getRegisteredAirlineCount() public requireIsOperational view returns(uint){
        return flightSuretyData.getRegAirlineCount();
    }


    function getRegisteredAirlines() public requireIsOperational view returns(address[] memory){
        return flightSuretyData.getRegisteredAirlines();
    }

    function getPassengerBalance() public requireIsOperational view returns(uint balance){
        return flightSuretyData.getPassengerBalance(msg.sender);
    }

    function getAirlineBalance(address airline) public requireIsOperational view returns (uint){
        return flightSuretyData.getAirlineBalance(airline);
    }

    function withdrawFunds(uint amountToWithdraw) public requireIsOperational returns (uint){
        require(flightSuretyData.getPassengerBalance(msg.sender) >= amountToWithdraw, 'withdraw amount exceeds balance');
        return flightSuretyData.withdrawFunds(msg.sender, amountToWithdraw);
    }

    function fundAirline() public requireIsOperational airlineRegistered payable {
        //credit data contract
        flightSuretyDataContractAddress.call.value(msg.value)("");

        //add funding
        flightSuretyData.fund(msg.sender, msg.value);

    }

   /**
    * @dev Register a future flight for insuring.
    *
    */
    function registerFlightInsurance
                                (
                                    address airline,
                                    string calldata flightName,
                                    uint256 timestamp
                                )
                                external
                                requireIsOperational
                                payable

    {

        //check that insurance has not been bought for this flight before by the passenger
        require(!flightSuretyData.isFlightInsuredByPassenger(airline, flightName, timestamp, msg.sender),
            "this flight has already been insured by the caller");

        //transfer the amount to contract
        (bool success, ) = flightSuretyDataContractAddress.call.value(msg.value)("");
        require(success, "Transfer failed.");

        flightSuretyData.buy(airline, flightName, timestamp, msg.sender, msg.value);

    }

   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
                                (
                                    address _airline,
                                    string memory _flightName,
                                    uint256 _timestamp,
                                    uint8 _statusCode
                                )
                                internal
                                requireIsOperational
    {

        //check status code
        if(_statusCode == STATUS_CODE_LATE_AIRLINE){
            uint multiplier = uint(1).mul(uint(150)).div(uint(100));
            flightSuretyData.creditInsurees(_airline, _flightName,_timestamp, multiplier);
        }


    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string calldata flight,
                            uint256 timestamp
                        )
                        external

    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    }


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3] memory)
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string calldata flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        view
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (
                                address account
                            )
                            internal
                            returns(uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}

abstract contract FlightSuretyData{

    function registerAirline(address airlineAddress) virtual external returns (bool);
    function isFlightInsuredByPassenger(address airline, string calldata flightName, uint256 timestamp, address passenger) virtual external view returns (bool);
    function getRegAirlineCount() virtual external pure returns (uint);
    function isRegistered(address airlineAddress) virtual external view returns (bool);
    function buy (address _airline, string calldata _flightName, uint256 _timestamp, address _passenger, uint amount) virtual external payable;
    function creditInsurees (address _airline, string calldata _flightName, uint256 _timestamp, uint _multiplier) virtual external;
    function getAmountInsuredByPassenger(address _airline, string calldata _flightName, uint256 _timestamp, address _passenger) virtual external view returns(uint amount);
    function fund(address airline, uint amount) virtual external payable;
    function getFunding(address airline) virtual external view returns (uint);
    function isOperational() virtual external view returns(bool);
    function getRegisteredAirlines() virtual external view returns(address[] memory);
    function getPassengerBalance(address passenger) virtual external view returns (uint);
    function withdrawFunds(address passenger, uint amoutToWithdraw) virtual external returns(uint);
    function getAirlineBalance(address airline) virtual external view returns (uint);


}
