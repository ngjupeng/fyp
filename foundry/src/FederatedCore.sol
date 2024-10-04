// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { FederatedAgreement } from "./FederatedAgreement.sol";
import { IFederatedCore } from "./interfaces/IFederatedCore.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FederatedCore is IFederatedCore {
    int256 private constant REPUTATION_INCREASE = 1;
    int256 private constant REPUTATION_DECREASE = 2;

    uint256 private agreementCount;

    mapping(uint256 => address) private idToAgreement;
    mapping(address => uint256) private agreementToId;
    mapping(address => int256) private reputations;

    // ************************************
    // ************ MODIFIERs *************
    // ************************************
    modifier onlyAgreement(address agreement) {
        if (agreementToId[agreement] == 0) {
            revert NotAgreement();
        }
        _;
    }

    // ************************************
    // ************ PUBLICs ***************
    // ************************************

    function createAgreement(
        address _owner,
        address _tokenAddress,
        uint256 _totalRewards,
        uint256 _collateralAmount,
        uint256 _maximumParticipants,
        uint256 _reputationThreshold,
        uint256 _maximumRounds
    )
        public
        returns (address)
    {
        FederatedAgreement agreement = new FederatedAgreement(
            _owner,
            _tokenAddress,
            _totalRewards,
            _collateralAmount,
            _maximumParticipants,
            _reputationThreshold,
            address(this),
            _maximumRounds
        );

        // owner need to first transfer the totalRewards and collateralAmount to the agreement contract
        bool isSuccess =
            IERC20(_tokenAddress).transferFrom(_owner, address(agreement), _totalRewards + _collateralAmount);
        if (!isSuccess) {
            revert TransferFailed();
        }

        agreementCount++;
        idToAgreement[agreementCount] = address(agreement);
        agreementToId[address(agreement)] = agreementCount;

        emit AgreementCreated(
            address(agreement),
            _owner,
            _tokenAddress,
            _totalRewards,
            _collateralAmount,
            _maximumParticipants,
            _reputationThreshold
        );

        return address(agreement);
    }

    function addReputation(address user) public onlyAgreement(msg.sender) {
        reputations[user] += REPUTATION_INCREASE;
    }

    function subtractReputation(address user) public onlyAgreement(msg.sender) {
        reputations[user] -= REPUTATION_DECREASE;
    }

    function getReputation(address user) public view returns (int256) {
        return reputations[user];
    }
}
