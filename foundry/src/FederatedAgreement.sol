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
  uint256 private constant PROPOSAL_VOTING_TIME = 2 hours;
  uint256 private constant BASIS_POINT = 10_000;
  uint256 private constant VOTES_THRESHOLD = 7000;

  // immutable variables
  uint256 public immutable TOTAL_REWARDS;
  uint256 public immutable COLLATERAL_AMOUNT;
  uint256 public immutable MAXIMUM_PARTICIPANTS;
  uint256 public immutable REPUTATION_THRESHOLD;
  address public immutable CORE_ADDRESS;
  uint256 public immutable MAXIMUM_ROUNDS;
  uint256 public immutable REWARD_EACH_ROUND;
  euint128 private encHighPrivateKey;
  euint128 private encLowPrivateKey;
  bytes private remainderPrivateKey;

  address public owner;
  address[] public participants;
  uint256 public round;
  uint256 public proposalId;
  FederatedAgreementStatus public status;

  mapping(address => bool) public isParticipant;
  mapping(uint256 => Proposal[]) public proposals;
  mapping(address => mapping(uint256 => bool)) public hasVoted;
  mapping(address => mapping(uint256 => bool)) public roundStateConfirmed;
  mapping(uint256 => uint256) public roundStateConfirmedCount;
  mapping(address => uint256) public rewards;
  mapping(address => uint256) public collaterals;
  mapping(address => uint256) public suspiciousCounts;
  mapping(address => uint256) public lastClaimedRound;
  // participant -> round -> IPFS hash
  mapping(address => mapping(uint256 => string)) public roundIPFSHashes;

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

  modifier onlyFinished() {
    if (status != FederatedAgreementStatus.FINISHED) {
      revert NotFinished();
    }
    _;
  }

  constructor(
    address _owner,
    uint256 _totalRewards,
    uint256 _collateralAmount,
    uint256 _maximumParticipants,
    uint256 _reputationThreshold,
    address _coreAddress,
    uint256 _maximumRounds
  ) {
    owner = _owner;
    status = FederatedAgreementStatus.PENDING;
    TOTAL_REWARDS = _totalRewards;
    COLLATERAL_AMOUNT = _collateralAmount;
    MAXIMUM_PARTICIPANTS = _maximumParticipants;
    REPUTATION_THRESHOLD = _reputationThreshold;
    CORE_ADDRESS = _coreAddress;
    MAXIMUM_ROUNDS = _maximumRounds;
    // update collateral and rewards
    collaterals[msg.sender] = COLLATERAL_AMOUNT;
    isParticipant[msg.sender] = true;
    participants.push(msg.sender);

    // dynamically calculate rewards for each round
    REWARD_EACH_ROUND = TOTAL_REWARDS / MAXIMUM_ROUNDS;
  }

  // ************************************
  // ************ SANDBOXs **************
  // ************************************
  function finishAgreementSandbox() public onlyOwner {
    round = MAXIMUM_ROUNDS;
    status = FederatedAgreementStatus.FINISHED;
    IFederatedCore(CORE_ADDRESS).emitAgreementFinished(address(this), round);
  }

  function proceedNextRoundSandbox() public {
    round += 1;
    IFederatedCore(CORE_ADDRESS).emitAgreementProceedNextRound(address(this), round);
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

  function startAgreement() public onlyOwner {
    // if ady running, throw error
    if (status == FederatedAgreementStatus.RUNNING || status == FederatedAgreementStatus.FINISHED) {
      revert InvalidAgreementStatus();
    }

    status = FederatedAgreementStatus.RUNNING;

    emit AgreementStarted();
  }

  function confirmRoundState() public onlyRunning {
    _requiredParticipant(msg.sender);

    // check if IPFS hash is submitted
    if (bytes(roundIPFSHashes[msg.sender][round]).length == 0) {
      revert IPFSStateNotSubmitted();
    }

    // check if already confirmed
    if (roundStateConfirmed[msg.sender][round]) {
      revert AlreadyConfirmed();
    }

    roundStateConfirmed[msg.sender][round] = true;
    roundStateConfirmedCount[round] += 1;

    _proceedNextRound();
  }

  function finishAgreement() public onlyOwner {
    // finish agreement earlier

    // need to distribute all the remaining rewards to all participants if finish agreement earlier
    // update round to latest round
    round = MAXIMUM_ROUNDS;
    status = FederatedAgreementStatus.FINISHED;

    // increase reputation for all participants
    _increaseAllParticipantsReputation();

    IFederatedCore(CORE_ADDRESS).emitAgreementFinished(address(this), round);
  }

  function createProposal(address suspiciousParticipant, string memory description) public onlyRunning {
    proposalId += 1;
    proposals[round].push(
      Proposal({
        proposer: msg.sender,
        suspiciousParticipant: suspiciousParticipant,
        proposalId: proposalId,
        proposalRound: round,
        proposalVotingTime: block.timestamp + PROPOSAL_VOTING_TIME,
        proposalVotesYes: 0,
        proposalVotesNo: 0,
        proposalStatus: ProposalStatus.VOTING,
        proposalDescription: description
      })
    );

    emit ProposalCreated(
      msg.sender,
      suspiciousParticipant,
      round,
      proposalId,
      block.timestamp + PROPOSAL_VOTING_TIME,
      description
    );
  }

  function submitRoundIPFSState(string memory ipfsHash) public onlyRunning {
    _requiredParticipant(msg.sender);

    // check if already submitted
    if (bytes(roundIPFSHashes[msg.sender][round]).length > 0) {
      revert AlreadySubmitted();
    }

    roundIPFSHashes[msg.sender][round] = ipfsHash;

    emit RoundIPFSStateSubmitted(msg.sender, round, ipfsHash);
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

    if (block.timestamp > proposal.proposalVotingTime) {
      revert ProposalVotingTimeExceeded();
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

    // only if time passed, can finalize proposal
    if (block.timestamp < proposal.proposalVotingTime) {
      revert ProposalVotingTimeNotPassed();
    }

    uint256 totalVotes = proposal.proposalVotesYes + proposal.proposalVotesNo;
    uint256 totalParticipants = participants.length;

    uint256 minimumVotesRequired = (totalParticipants * 2) / 3; // 2/3 of participants
    if (totalVotes < minimumVotesRequired) {
      revert MinimumVotesRequiredNotReached();
    }

    // if reach minimum votes, but current round != proposa.round, revert
    if (proposal.proposalRound != round) {
      revert ProposalRoundNotMatch();
    }

    uint256 yesVotePercentage = (proposal.proposalVotesYes * BASIS_POINT) / totalVotes;
    if (yesVotePercentage >= VOTES_THRESHOLD) {
      proposal.proposalStatus = ProposalStatus.ACCEPTED;
      uint256 amount = _penalizeSuspiciousParticipant(proposal.suspiciousParticipant);
      _rewardProposer(proposal.proposer, amount);
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
    if (msg.value < COLLATERAL_AMOUNT) {
      revert InsufficientFunds();
    }

    participants.push(participant);
    isParticipant[participant] = true;
    collaterals[participant] = COLLATERAL_AMOUNT;

    emit ParticipantAdded(participant);
  }

  function redeemCollateral() public onlyFinished {
    // transfer collateral back to participant
    uint256 amount = collaterals[msg.sender];
    delete collaterals[msg.sender];
    payable(address(msg.sender)).transfer(amount);

    emit CollateralRedeemed(msg.sender, amount);
  }

  function redeemRewards() public {
    uint256 amount = _calculateRewards(msg.sender);
    if (amount <= 0) {
      revert NoRewardsAvailable();
    }
    lastClaimedRound[msg.sender] = round;
    delete rewards[msg.sender];
    payable(address(msg.sender)).transfer(amount);

    emit RewardsRedeemed(msg.sender, round, amount);
  }

  function getPrivateKey() public view returns (string memory) {
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

  function getRewards(address participant) public view returns (uint256) {
    return _calculateRewards(participant);
  }

  // ************************************
  // ************ PRIVATEs **************
  // ************************************
  function _penalizeSuspiciousParticipant(address participant) private returns (uint256) {
    suspiciousCounts[participant] += 1;
    // decrease reputation
    IFederatedCore(CORE_ADDRESS).subtractReputation(participant);
    // decrease collateral
    // according to suspicious count, decrease more collateral if suspicious count is bigger
    // first suspicious count, decrease 10% of collateral
    // second suspicious count, decrease 20% of collateral
    // third suspicious count, decrease 40% of collateral
    // fourth suspicious count, decrease 80% of collateral
    // fifth suspicious count, decrease 100% of collateral
    // if collateral is less than 0, set it to 0

    // get current collateral amount
    uint256 collateralBefore = collaterals[participant];

    if (suspiciousCounts[participant] >= 5) {
      collaterals[participant] = 0;
    } else if (suspiciousCounts[participant] >= 4) {
      collaterals[participant] = (collaterals[participant] * 2000) / BASIS_POINT;
    } else if (suspiciousCounts[participant] >= 3) {
      collaterals[participant] = (collaterals[participant] * 6000) / BASIS_POINT;
    } else if (suspiciousCounts[participant] >= 2) {
      collaterals[participant] = (collaterals[participant] * 8000) / BASIS_POINT;
    } else if (suspiciousCounts[participant] >= 1) {
      collaterals[participant] = (collaterals[participant] * 9000) / BASIS_POINT;
    }

    uint256 collateralAfter = collaterals[participant];

    // calculate the liquidated collateral amount
    uint256 liquidatedCollateral = collateralBefore - collateralAfter;

    return liquidatedCollateral;
  }

  function _rewardProposer(address participant, uint256 amount) private {
    // add extra rewards from liquidated collateral
    rewards[participant] += amount;
  }

  function _increaseReputation(address participant) private {
    IFederatedCore(CORE_ADDRESS).addReputation(participant);
  }

  function _proceedNextRound() public {
    // need at least 2/3 of participants to confirm the round state
    uint256 minimumParticipantsRequired = (participants.length * 2) / 3;

    if (roundStateConfirmedCount[round] >= minimumParticipantsRequired) {
      round += 1;
      // check if maximum rounds is reached
      if (round > MAXIMUM_ROUNDS) {
        status = FederatedAgreementStatus.FINISHED;
        _increaseAllParticipantsReputation();
        IFederatedCore(CORE_ADDRESS).emitAgreementFinished(address(this), round);
        return;
      }
      IFederatedCore(CORE_ADDRESS).emitAgreementProceedNextRound(address(this), round);
    }
  }

  function _calculateRewards(address participant) private view returns (uint256) {
    uint256 lastClaimed = lastClaimedRound[participant];
    if (lastClaimed >= round) {
      return 0;
    }
    uint256 originalRewards = rewards[participant];
    uint256 unclaimedRounds = ((round - lastClaimed) * REWARD_EACH_ROUND) + originalRewards;
    return unclaimedRounds;
  }

  function _increaseAllParticipantsReputation() private {
    for (uint256 i = 0; i < participants.length; i++) {
      // NOTE: BAD APPROACH
      _increaseReputation(participants[i]);
    }
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
