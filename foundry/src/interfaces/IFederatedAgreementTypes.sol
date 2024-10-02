// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IFederatedAgreementTypes {
    enum FederatedAgreementStatus {
        PENDING,
        RUNNING,
        ENDED
    }

    enum ProposalStatus {
        VOTING,
        ACCEPTED,
        REJECTED
    }

    struct Proposal {
        address proposer;
        address suspiciousParticipant;
        uint256 proposalId;
        uint256 proposalRound;
        uint256 proposalExpirationTime;
        uint256 proposalVotesYes;
        uint256 proposalVotesNo;
        ProposalStatus proposalStatus;
        string proposalDescription;
    }

    // ************************************
    // ************ EVENTS ****************
    // ************************************
    event ProposalCreated(
        address indexed proposer,
        address indexed suspiciousParticipant,
        uint256 indexed proposalRound,
        uint256 proposalId,
        uint256 proposalExpirationTime,
        string proposalDescription
    );

    event ProposalVoted(
        address indexed voter, uint256 indexed proposalId, uint256 indexed proposalRound, bool isVoteYes
    );

    event ParticipantAdded(address indexed participant);

    event ProposalFinalized(uint256 indexed proposalId, uint256 indexed proposalRound, bool isAccepted);

    // ************************************
    // ************ ERRORs ****************
    // ************************************
    error NotOwner();
    error NotPending();
    error NotRunning();
    error InvalidPrivateKey();
    error MaximumParticipantsReached();
    error AlreadyParticipant();
    error NotParticipant();
    error AlreadyVoted();
    error ProposalNotVoting();
    error ProposalExpired();
    error ReputationCheckFailed();
    error CollateralTransferFailed();
}
