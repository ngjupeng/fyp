// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { FHE, inEuint128, euint256, euint128 } from "@fhenixprotocol/contracts/FHE.sol";
import { Permissioned, Permission } from "@fhenixprotocol/contracts/access/Permissioned.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IFederatedAgreementTypes } from "./interfaces/IFederatedAgreementTypes.sol";
import { IFederatedCore } from "./interfaces/IFederatedCore.sol";

contract FederatedAgreement is Permissioned, Initializable, IFederatedAgreementTypes {
    // constant variables
    uint256 constant PROPOSAL_VOTING_TIME = 2 hours;
    uint256 constant BASIS_POINT = 10_000;
    uint256 constant VOTES_THRESHOLD = 7000;

    // immutable variables
    uint256 public immutable TOTAL_REWARDS;
    uint256 public immutable COLLATERAL_AMOUNT;
    uint256 public immutable MAXIMUM_PARTICIPANTS;
    uint256 public immutable REPUTATION_THRESHOLD;
    address public immutable TOKEN_ADDRESS;
    address public immutable CORE_ADDRESS;

    euint128 private encHighPrivateKey;
    euint128 private encLowPrivateKey;
    bytes private remainderPrivateKey;

    address public owner;
    address[] public participants;
    mapping(address => bool) public isParticipant;
    mapping(uint256 => Proposal[]) public proposals;
    mapping(address => mapping(uint256 => bool)) public hasVoted;

    uint256 public round;
    uint256 public proposalId;
    FederatedAgreementStatus public status;

    // ************************************
    // ************ MODIFIERs *************
    // ************************************
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert NotOwner();
        }
        _;
    }

    modifier onlyPending() {
        if (status != FederatedAgreementStatus.PENDING) {
            revert NotPending();
        }
        _;
    }

    modifier onlyRunning() {
        if (status != FederatedAgreementStatus.RUNNING) {
            revert NotRunning();
        }
        _;
    }

    constructor(
        address _owner,
        address _tokenAddress,
        uint256 _totalRewards,
        uint256 _collateralAmount,
        uint256 _maximumParticipants,
        uint256 _reputationThreshold,
        address _coreAddress
    ) {
        owner = _owner;
        status = FederatedAgreementStatus.PENDING;
        TOTAL_REWARDS = _totalRewards;
        COLLATERAL_AMOUNT = _collateralAmount;
        MAXIMUM_PARTICIPANTS = _maximumParticipants;
        REPUTATION_THRESHOLD = _reputationThreshold;
        TOKEN_ADDRESS = _tokenAddress;
        CORE_ADDRESS = _coreAddress;
    }

    // ************************************
    // ************ PUBLICs ***************
    // ************************************
    function setPrivateKey(bytes calldata privateKey) public onlyOwner initializer {
        // check if private key is valid
        if (privateKey.length != 256) {
            revert InvalidPrivateKey();
        }

        // extract first 16 bytes of private key
        bytes16 highPrivateKey = bytes16(privateKey[:16]);

        // extract last 16 bytes of private key
        bytes16 lowPrivateKey = bytes16(privateKey[privateKey.length - 16:]);

        // extract remainder of private key
        remainderPrivateKey = privateKey[16:privateKey.length - 16];

        // encrypt high private key
        encHighPrivateKey = FHE.asEuint128(uint128(highPrivateKey));
        encLowPrivateKey = FHE.asEuint128(uint128(lowPrivateKey));
    }

    function proceedNextRound() public { }

    function createProposal(address suspiciousParticipant, string memory description) public onlyRunning {
        proposalId += 1;
        proposals[round].push(
            Proposal({
                proposer: msg.sender,
                suspiciousParticipant: suspiciousParticipant,
                proposalId: proposalId,
                proposalRound: round,
                proposalExpirationTime: block.timestamp + PROPOSAL_VOTING_TIME,
                proposalVotesYes: 0,
                proposalVotesNo: 0,
                proposalStatus: ProposalStatus.VOTING,
                proposalDescription: description
            })
        );

        emit ProposalCreated(
            msg.sender, suspiciousParticipant, round, proposalId, block.timestamp + PROPOSAL_VOTING_TIME, description
        );
    }

    function voteProposal(uint256 index, bool isVoteYes) public onlyRunning {
        Proposal memory proposal = proposals[round][index];

        // check if already voted
        if (hasVoted[msg.sender][proposal.proposalId]) {
            revert AlreadyVoted();
        }

        if (proposal.proposalStatus != ProposalStatus.VOTING) {
            revert ProposalNotVoting();
        }

        if (proposal.proposalExpirationTime < block.timestamp) {
            revert ProposalExpired();
        }

        if (isVoteYes) {
            proposal.proposalVotesYes += 1;
        } else {
            proposal.proposalVotesNo += 1;
        }

        proposals[round][index] = proposal;
        hasVoted[msg.sender][proposal.proposalId] = true;

        emit ProposalVoted(msg.sender, proposal.proposalId, proposal.proposalRound, isVoteYes);
    }

    function finalizeProposal(uint256 index) public onlyRunning {
        Proposal memory proposal = proposals[round][index];

        if (proposal.proposalStatus != ProposalStatus.VOTING) {
            revert ProposalNotVoting();
        }

        if (proposal.proposalExpirationTime < block.timestamp) {
            revert ProposalExpired();
        }

        uint256 totalVotes = proposal.proposalVotesYes + proposal.proposalVotesNo;
        uint256 totalParticipants = participants.length;

        // Condition 1: Check if the total number of votes meets the minimum threshold
        uint256 minimumVotesRequired = (totalParticipants * 2) / 3; // 2/3 of participants
        if (totalVotes < minimumVotesRequired) {
            proposal.proposalStatus = ProposalStatus.REJECTED;
            emit ProposalFinalized(proposal.proposalId, proposal.proposalRound, false);
            return;
        }

        uint256 yesVotePercentage = (proposal.proposalVotesYes * BASIS_POINT) / totalVotes;
        if (yesVotePercentage >= VOTES_THRESHOLD) {
            proposal.proposalStatus = ProposalStatus.ACCEPTED;
            _penalizeSuspiciousParticipant(proposal.suspiciousParticipant);
            _rewardProposer(proposal.proposer);
            emit ProposalFinalized(proposal.proposalId, proposal.proposalRound, true);
        } else {
            proposal.proposalStatus = ProposalStatus.REJECTED;
            emit ProposalFinalized(proposal.proposalId, proposal.proposalRound, false);
        }
    }

    function addParticipant(address participant) public onlyPending {
        if (participants.length >= MAXIMUM_PARTICIPANTS) {
            revert MaximumParticipantsReached();
        }

        // if ady a participant, revert
        if (_isParticipant(participant)) {
            revert AlreadyParticipant();
        }

        // reputation check
        _reputationCheck(participant);

        // pay collateral
        bool isSuccess = IERC20(TOKEN_ADDRESS).transferFrom(msg.sender, address(this), COLLATERAL_AMOUNT);

        if (!isSuccess) {
            revert CollateralTransferFailed();
        }

        participants.push(participant);
        isParticipant[participant] = true;

        emit ParticipantAdded(participant);
    }

    function getPrivateKey(Permission memory auth)
        public
        view
        onlyPermitted(auth, msg.sender)
        returns (string memory)
    {
        // check is participant
        _requiredParticipant(msg.sender);
        // decrypt high private key
        bytes16 highPrivateKey = bytes16(FHE.decrypt(encHighPrivateKey));

        // decrypt low private key
        bytes16 lowPrivateKey = bytes16(FHE.decrypt(encLowPrivateKey));

        return string(abi.encodePacked(highPrivateKey, remainderPrivateKey, lowPrivateKey));
    }

    function getProposals() public view returns (Proposal[] memory) {
        return proposals[round];
    }

    // ************************************
    // ************ PRIVATEs **************
    // ************************************
    function _penalizeSuspiciousParticipant(address participant) private {
        // TODO: implement
    }

    function _rewardProposer(address participant) private {
        // TODO: implement
    }

    function _reputationCheck(address participant) private view {
        // get reputation of participant from core contract
        int256 reputation = IFederatedCore(CORE_ADDRESS).getReputation(participant);

        if (reputation < int256(REPUTATION_THRESHOLD)) {
            revert ReputationCheckFailed();
        }
    }

    function _requiredParticipant(address participant) private view {
        if (!isParticipant[participant]) {
            revert NotParticipant();
        }
    }

    function _isParticipant(address participant) private view returns (bool) {
        return isParticipant[participant];
    }
}
