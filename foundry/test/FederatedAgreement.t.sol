// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { Test } from "forge-std/src/Test.sol";
import { FederatedAgreement } from "../src/FederatedAgreement.sol";
import { Permission } from "../util/PermissionHelper.sol";
import { inEuint128, euint128 } from "@fhenixprotocol/contracts/FHE.sol";
import { console } from "forge-std/src/console.sol";
import { IFederatedAgreementTypes } from "../src/interfaces/IFederatedAgreementTypes.sol";
import { IFederatedCore } from "../src/interfaces/IFederatedCore.sol";
import { FHE, inEuint128, euint256, euint128 } from "@fhenixprotocol/contracts/FHE.sol";
import { Initializable } from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract MockFederatedCore is IFederatedCore {
  mapping(address => int256) public reputations;

  function addReputation(address participant) external {
    reputations[participant] += 10;
  }

  function subtractReputation(address participant) external {
    reputations[participant] -= 10;
  }

  function getReputation(address participant) external view returns (int256) {
    return reputations[participant];
  }

  function emitAgreementFinished(address agreement, uint256 round) external {}
  function emitAgreementProceedNextRound(address agreement, uint256 round) external {}

  // Helper function for testing
  function setReputation(address participant, int256 reputation) external {
    reputations[participant] = reputation;
  }
}

contract FederatedAgreementTest is Test {
  FederatedAgreement internal agreement;
  MockFederatedCore internal mockCore;

  address public owner;
  uint256 public ownerPrivateKey;

  address[] public participants;
  uint256[] public participantKeys;
  mapping(address => uint256) public addressToKey;

  // Test constants
  uint256 constant TOTAL_REWARDS = 100 ether;
  uint256 constant COLLATERAL_AMOUNT = 1 ether;
  uint256 constant MAXIMUM_PARTICIPANTS = 10;
  uint256 constant REPUTATION_THRESHOLD = 100;
  uint256 constant MAXIMUM_ROUNDS = 5;
  uint256 constant NUM_PARTICIPANTS = 5;

  event ParticipantAdded(address indexed participant);
  event AgreementStarted();
  event ProposalCreated(
    address indexed proposer,
    address indexed suspiciousParticipant,
    uint256 round,
    uint256 proposalId,
    uint256 votingEndTime,
    string description
  );
  event ProposalVoted(address indexed voter, uint256 indexed proposalId, uint256 round, bool vote);
  event ProposalFinalized(uint256 indexed proposalId, uint256 round, bool accepted);
  event RoundIPFSStateSubmitted(address indexed participant, uint256 round, string ipfsHash);
  event CollateralRedeemed(address indexed participant, uint256 amount);
  event RewardsRedeemed(address indexed participant, uint256 round, uint256 amount);

  function setUp() public virtual {
    // Deploy mock core contract
    mockCore = new MockFederatedCore();

    // Generate test addresses
    ownerPrivateKey = 0x1;
    owner = vm.addr(ownerPrivateKey);

    // Generate participant addresses
    for (uint i = 0; i < NUM_PARTICIPANTS; i++) {
      uint256 privKey = 0x2 + i;
      address participant = vm.addr(privKey);
      participants.push(participant);
      participantKeys.push(privKey);
      addressToKey[participant] = privKey;

      // Set initial reputation
      mockCore.setReputation(participant, int256(REPUTATION_THRESHOLD + 10));
    }

    // Deploy contract
    address[] memory whitelistedAddresses = new address[](0);
    vm.deal(owner, COLLATERAL_AMOUNT + TOTAL_REWARDS);
    agreement = new FederatedAgreement{ value: COLLATERAL_AMOUNT + TOTAL_REWARDS }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      address(mockCore),
      MAXIMUM_ROUNDS,
      false, // isWhitelist
      whitelistedAddresses
    );

    // Fund contract with rewards
    vm.deal(address(agreement), TOTAL_REWARDS);
  }

  function test_AddParticipants() public {
    for (uint i = 0; i < participants.length; i++) {
      address participant = participants[i];
      vm.deal(participant, COLLATERAL_AMOUNT);

      vm.prank(participant);
      vm.expectEmit(true, false, false, false);
      emit ParticipantAdded(participant);
      agreement.addParticipant{ value: COLLATERAL_AMOUNT }(participant);

      assertTrue(agreement.isParticipant(participant));
      assertEq(agreement.collaterals(participant), COLLATERAL_AMOUNT);
    }
  }

  function test_AddParticipant_InsufficientCollateral() public {
    address newParticipant = address(0x123);
    vm.deal(newParticipant, COLLATERAL_AMOUNT - 1);
    mockCore.setReputation(newParticipant, int256(REPUTATION_THRESHOLD + 10));

    vm.prank(newParticipant);
    vm.expectRevert(IFederatedAgreementTypes.InsufficientFunds.selector);
    agreement.addParticipant{ value: COLLATERAL_AMOUNT - 1 }(newParticipant);
  }

  function test_AddParticipant_LowReputation() public {
    address newParticipant = address(0x123);
    vm.deal(newParticipant, COLLATERAL_AMOUNT);
    mockCore.setReputation(newParticipant, int256(REPUTATION_THRESHOLD - 1));

    vm.prank(newParticipant);
    vm.expectRevert(IFederatedAgreementTypes.ReputationCheckFailed.selector);
    agreement.addParticipant{ value: COLLATERAL_AMOUNT }(newParticipant);
  }

  function test_AddParticipant_AlreadyParticipant() public {
    // First addition should succeed
    address newParticipant = address(0x123);
    vm.deal(newParticipant, COLLATERAL_AMOUNT * 2);
    mockCore.setReputation(newParticipant, int256(REPUTATION_THRESHOLD + 10));

    vm.prank(newParticipant);
    agreement.addParticipant{ value: COLLATERAL_AMOUNT }(newParticipant);

    // Second addition should fail
    vm.prank(newParticipant);
    vm.expectRevert(IFederatedAgreementTypes.AlreadyParticipant.selector);
    agreement.addParticipant{ value: COLLATERAL_AMOUNT }(newParticipant);
  }

  function test_AddParticipant_WhitelistOnly() public {
    // Deploy new agreement with whitelist
    address[] memory whitelistedAddresses = new address[](2);
    whitelistedAddresses[0] = address(0x123);
    whitelistedAddresses[1] = address(0x456);

    vm.deal(owner, COLLATERAL_AMOUNT);
    FederatedAgreement whitelistAgreement = new FederatedAgreement{ value: COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      address(mockCore),
      MAXIMUM_ROUNDS,
      true, // isWhitelist
      whitelistedAddresses
    );

    // Test whitelisted participant
    address whitelisted = address(0x123);
    vm.deal(whitelisted, COLLATERAL_AMOUNT);
    vm.prank(whitelisted);
    whitelistAgreement.addParticipant{ value: COLLATERAL_AMOUNT }(whitelisted);
    assertTrue(whitelistAgreement.isParticipant(whitelisted));

    // Test non-whitelisted participant
    address nonWhitelisted = address(0x789);
    vm.deal(nonWhitelisted, COLLATERAL_AMOUNT);
    vm.prank(nonWhitelisted);
    vm.expectRevert(IFederatedAgreementTypes.NotWhitelistedParticipant.selector);
    whitelistAgreement.addParticipant{ value: COLLATERAL_AMOUNT }(nonWhitelisted);
  }

  function test_AddParticipant_AfterStarted() public {
    test_AddParticipants(); // Add initial participants

    vm.prank(owner);
    agreement.startAgreement();

    address newParticipant = address(0x123);
    vm.deal(newParticipant, COLLATERAL_AMOUNT);
    mockCore.setReputation(newParticipant, int256(REPUTATION_THRESHOLD + 10));

    vm.prank(newParticipant);
    vm.expectRevert(IFederatedAgreementTypes.NotPending.selector);
    agreement.addParticipant{ value: COLLATERAL_AMOUNT }(newParticipant);
  }

  function test_StartAndRunAgreement() public {
    // Add participants
    test_AddParticipants();

    // Start agreement
    vm.prank(owner);
    agreement.startAgreement();

    assertEq(uint256(agreement.status()), uint256(IFederatedAgreementTypes.FederatedAgreementStatus.RUNNING));

    // First: Submit IPFS hashes for all participants INCLUDING OWNER
    vm.prank(owner);
    agreement.submitRoundIPFSState("QmHash123");

    for (uint i = 0; i < participants.length; i++) {
      vm.prank(participants[i]);
      agreement.submitRoundIPFSState("QmHash123");
    }

    // Then: Confirm round states for all participants INCLUDING OWNER
    vm.prank(owner);
    agreement.confirmRoundState();

    for (uint i = 0; i < participants.length - 2; i++) {
      vm.prank(participants[i]);
      agreement.confirmRoundState();
    }

    // Verify round proceeded
    assertEq(agreement.round(), 1);
  }

  function test_SubmitIPFSState_DuplicateSubmission() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    vm.prank(participants[0]);
    agreement.submitRoundIPFSState("QmHash123");

    vm.prank(participants[0]);
    vm.expectRevert(IFederatedAgreementTypes.AlreadySubmitted.selector);
    agreement.submitRoundIPFSState("QmHash456");
  }

  function test_ConfirmRoundState_WithoutIPFSSubmission() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    vm.prank(participants[0]);
    vm.expectRevert(IFederatedAgreementTypes.IPFSStateNotSubmitted.selector);
    agreement.confirmRoundState();
  }

  function test_ConfirmRoundState_DuplicateConfirmation() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    vm.prank(participants[0]);
    agreement.submitRoundIPFSState("QmHash123");

    vm.prank(participants[0]);
    agreement.confirmRoundState();

    vm.prank(participants[0]);
    vm.expectRevert(IFederatedAgreementTypes.AlreadyConfirmed.selector);
    agreement.confirmRoundState();
  }

  function test_ProposalLifecycle() public {
    test_AddParticipants();

    vm.prank(owner);
    agreement.startAgreement();

    vm.prank(owner);
    agreement.submitRoundIPFSState("QmHash123");

    for (uint i = 0; i < participants.length; i++) {
      vm.prank(participants[i]);
      agreement.submitRoundIPFSState("QmHash123");
    }

    vm.prank(owner);
    agreement.confirmRoundState();

    for (uint i = 0; i < participants.length - 2; i++) {
      vm.prank(participants[i]);
      agreement.confirmRoundState();
    }

    address proposer = participants[0];
    address suspicious = participants[1];
    string memory description = "Suspicious behavior";

    vm.prank(proposer);
    agreement.createProposal(suspicious, description);

    for (uint i = 1; i < participants.length; i++) {
      vm.prank(participants[i]);
      agreement.voteProposal(0, true);
    }

    vm.warp(block.timestamp + 3 hours);

    vm.prank(proposer);
    agreement.finalizeProposal(0);

    assertTrue(agreement.suspiciousCounts(suspicious) > 0);
    assertLt(agreement.collaterals(suspicious), COLLATERAL_AMOUNT);
  }

  function test_ProposalVoting_CreatorCannotVote() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    vm.prank(participants[0]);
    agreement.submitRoundIPFSState("QmHash123");
    vm.prank(participants[0]);
    agreement.createProposal(participants[1], "Test proposal");

    vm.prank(participants[0]);
    vm.expectRevert(IFederatedAgreementTypes.ProposalCreatorCannotVote.selector);
    agreement.voteProposal(0, true);
  }

  function test_ProposalVoting_MultipleVoters() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    vm.prank(participants[0]);
    agreement.submitRoundIPFSState("QmHash123");
    vm.prank(participants[0]);
    agreement.createProposal(participants[1], "Test proposal");

    for (uint i = 2; i < participants.length; i++) {
      vm.prank(participants[i]);
      agreement.submitRoundIPFSState("QmHash123");
      vm.prank(participants[i]);
      agreement.voteProposal(0, i % 2 == 0); // Alternate between true/false votes
    }

    // Check vote counts
    IFederatedAgreementTypes.Proposal[] memory props = agreement.getProposals();
    assertTrue(props[0].proposalVotesYes > 0);
    assertTrue(props[0].proposalVotesNo > 0);
  }

  function test_RewardsAndCollateral() public {
    test_AddParticipants();

    vm.prank(owner);
    agreement.startAgreement();

    for (uint256 round = 0; round < MAXIMUM_ROUNDS; round++) {
      vm.prank(owner);
      agreement.submitRoundIPFSState("QmHash123");

      for (uint i = 0; i < participants.length; i++) {
        vm.prank(participants[i]);
        agreement.submitRoundIPFSState("QmHash123");
      }

      vm.prank(owner);
      agreement.confirmRoundState();

      for (uint i = 0; i < participants.length - 2; i++) {
        vm.prank(participants[i]);
        agreement.confirmRoundState();
      }
    }

    assertEq(uint256(agreement.status()), uint256(IFederatedAgreementTypes.FederatedAgreementStatus.FINISHED));

    vm.prank(owner);
    agreement.redeemRewards();

    for (uint i = 0; i < participants.length - 1; i++) {
      address participant = participants[i];
      uint256 expectedRewards = agreement.getRewards(participant);
      uint256 rewardEachRound = agreement.rewardEachRound();
      assertTrue(expectedRewards > 0);

      vm.prank(participant);
      agreement.redeemRewards();
    }

    vm.prank(owner);
    agreement.redeemCollateral();

    for (uint i = 0; i < participants.length - 1; i++) {
      address participant = participants[i];
      uint256 collateral = agreement.collaterals(participant);

      vm.prank(participant);
      agreement.redeemCollateral();

      assertEq(agreement.collaterals(participant), 0);
    }
  }

  function testFail_AddParticipantTwice() public {
    address participant = participants[0];
    vm.deal(participant, COLLATERAL_AMOUNT * 2);

    vm.startPrank(participant);
    agreement.addParticipant{ value: COLLATERAL_AMOUNT }(participant);
    agreement.addParticipant{ value: COLLATERAL_AMOUNT }(participant);
    vm.stopPrank();
  }

  function testFail_UnauthorizedStart() public {
    vm.prank(participants[0]);
    agreement.startAgreement();
  }

  function testFail_InvalidProposalVote() public {
    test_StartAndRunAgreement();

    // Try to vote on non-existent proposal
    vm.prank(participants[0]);
    agreement.voteProposal(99, true);
  }

  function testFail_RedeemRewardsBeforeFinish() public {
    test_AddParticipants();

    vm.prank(participants[0]);
    agreement.redeemRewards();
  }

  function test_WhitelistMode() public {
    // Deploy new contract with whitelist
    address[] memory whitelistedAddresses = new address[](2);
    whitelistedAddresses[0] = participants[0];
    whitelistedAddresses[1] = participants[1];

    vm.deal(owner, COLLATERAL_AMOUNT);
    FederatedAgreement whitelistedAgreement = new FederatedAgreement{ value: COLLATERAL_AMOUNT }(
      owner,
      TOTAL_REWARDS,
      COLLATERAL_AMOUNT,
      MAXIMUM_PARTICIPANTS,
      REPUTATION_THRESHOLD,
      address(mockCore),
      MAXIMUM_ROUNDS,
      true, // isWhitelist
      whitelistedAddresses
    );

    // Test whitelisted participant can join
    vm.deal(participants[0], COLLATERAL_AMOUNT);
    vm.prank(participants[0]);
    whitelistedAgreement.addParticipant{ value: COLLATERAL_AMOUNT }(participants[0]);
    assertTrue(whitelistedAgreement.isParticipant(participants[0]));

    // Test non-whitelisted participant cannot join
    vm.deal(participants[2], COLLATERAL_AMOUNT);
    vm.prank(participants[2]);
    vm.expectRevert(abi.encodeWithSignature("NotWhitelistedParticipant()"));
    whitelistedAgreement.addParticipant{ value: COLLATERAL_AMOUNT }(participants[2]);
  }

  function test_MultipleRoundProgression() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    // Run through multiple rounds
    for (uint currentRound = 0; currentRound < 3; currentRound++) {
      // Submit IPFS state for all participants
      for (uint i = 0; i < participants.length; i++) {
        vm.prank(participants[i]);
        agreement.submitRoundIPFSState("QmHash123");
      }

      // Confirm round state
      for (uint i = 0; i < participants.length - 1; i++) {
        vm.prank(participants[i]);
        agreement.confirmRoundState();
      }

      assertEq(agreement.round(), currentRound + 1);
      assert((agreement.status()) == (IFederatedAgreementTypes.FederatedAgreementStatus.RUNNING));
    }
  }

  function test_EarlyFinish() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    // Submit initial states
    for (uint i = 0; i < participants.length; i++) {
      vm.prank(participants[i]);
      agreement.submitRoundIPFSState("QmHash123");
    }

    // Owner finishes agreement early
    vm.prank(owner);
    agreement.finishAgreement();

    assertEq(uint(agreement.status()), uint(IFederatedAgreementTypes.FederatedAgreementStatus.FINISHED));
    assertEq(agreement.round(), MAXIMUM_ROUNDS);
  }

  function test_CollateralPenalties() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    vm.prank(owner);
    agreement.submitRoundIPFSState("QmHash123");
    vm.prank(owner);
    agreement.createProposal(participants[0], "Multiple violations");

    for (uint i = 0; i < 4; i++) {
      vm.prank(participants[i]);
      agreement.submitRoundIPFSState("QmHash123");
      vm.prank(participants[i]);
      agreement.voteProposal(0, true);
    }

    vm.warp(block.timestamp + 3 hours);
    vm.prank(owner);
    agreement.finalizeProposal(0);

    uint256 expectedCollateral = (COLLATERAL_AMOUNT * 9000) / 10000;
    assertEq(agreement.collaterals(participants[0]), expectedCollateral);
  }

  function test_MultipleProposalsInSameRound() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    // Submit states
    for (uint i = 0; i < participants.length; i++) {
      vm.prank(participants[i]);
      agreement.submitRoundIPFSState("QmHash123");
    }

    // Create multiple proposals
    vm.prank(owner);
    agreement.createProposal(participants[0], "First violation");
    vm.prank(owner);
    agreement.createProposal(participants[1], "Second violation");

    // Vote on both proposals
    for (uint i = 1; i < 5; i++) {
      vm.prank(participants[i]);
      agreement.voteProposal(0, true);
      vm.prank(participants[i]);
      agreement.voteProposal(1, true);
    }

    vm.warp(block.timestamp + 3 hours);

    vm.prank(owner);
    agreement.finalizeProposal(0);
    vm.prank(owner);
    agreement.finalizeProposal(1);

    assertEq(agreement.suspiciousCounts(participants[0]), 1);
    assertEq(agreement.suspiciousCounts(participants[1]), 1);
  }

  function test_ConsecutiveSuspiciousProposals() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    // Submit multiple rounds of proposals against same participant
    for (uint round = 0; round < 3; round++) {
      // Submit states
      for (uint i = 0; i < participants.length; i++) {
        vm.prank(participants[i]);
        agreement.submitRoundIPFSState("QmHash123");
      }

      vm.prank(owner);
      agreement.createProposal(participants[0], "Repeated violation");

      // Vote
      for (uint j = 0; j < 4; j++) {
        vm.prank(participants[j]);
        agreement.voteProposal(0, true);
      }

      vm.warp(block.timestamp + 3 hours);
      vm.prank(owner);
      agreement.finalizeProposal(0);

      // Progress to next round
      for (uint k = 0; k < participants.length - 1; k++) {
        vm.prank(participants[k]);
        agreement.confirmRoundState();
      }
    }

    // Check increasing penalties
    assertEq(agreement.suspiciousCounts(participants[0]), 3);
    assertTrue(agreement.collaterals(participants[0]) < COLLATERAL_AMOUNT / 2); // Should have lost more than 50%
  }

  function test_RewardCalculationWithMissedRounds() public {
    test_AddParticipants();
    vm.deal(address(agreement), TOTAL_REWARDS);

    vm.prank(owner);
    agreement.startAgreement();

    // Participant 0 submits all rounds
    // Participant 1 misses middle round
    // Participant 2 only submits first round

    // Round 0
    for (uint i = 0; i < 4; i++) {
      vm.prank(participants[i]);
      agreement.submitRoundIPFSState("QmHash123");
    }

    for (uint j = 0; j < 4; j++) {
      vm.prank(participants[j]);
      agreement.confirmRoundState();
    }

    // Round 2
    vm.prank(participants[0]);
    agreement.submitRoundIPFSState("QmHash123");
    vm.prank(participants[1]);
    agreement.submitRoundIPFSState("QmHash123");
    vm.prank(participants[0]);
    agreement.confirmRoundState();
    vm.prank(participants[1]);
    agreement.confirmRoundState();

    uint256 reward0 = agreement.getRewards(participants[0]);
    uint256 reward1 = agreement.getRewards(participants[1]);
    uint256 reward2 = agreement.getRewards(participants[2]);

    assertTrue(reward0 == reward1);
    assertTrue(reward1 > reward2);
  }

  function test_ProposalVotingTimeExpiration() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    // Submit states
    for (uint i = 0; i < participants.length; i++) {
      vm.prank(participants[i]);
      agreement.submitRoundIPFSState("QmHash123");
    }

    vm.prank(owner);
    agreement.createProposal(participants[0], "Test violation");

    // Advance time beyond voting period
    vm.warp(block.timestamp + 3 hours);

    // Try to vote after expiration
    vm.prank(participants[1]);
    vm.expectRevert(abi.encodeWithSignature("ProposalVotingTimeExceeded()"));
    agreement.voteProposal(0, true);
  }

  function test_FinishAgreement_Early() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    // Owner finishes agreement early
    vm.prank(owner);
    agreement.finishAgreement();

    assertEq(uint256(agreement.status()), uint256(IFederatedAgreementTypes.FederatedAgreementStatus.FINISHED));
    assertEq(agreement.round(), MAXIMUM_ROUNDS);
  }

  function test_SetPrivateKey() public {
    test_AddParticipants();

    // Only owner can set private key
    inEuint128 memory first30;
    inEuint128 memory last30;
    string memory middlePart = "middle";

    vm.prank(owner);
    agreement.setPrivateKey(first30, last30, middlePart);

    // Cannot set private key twice
    vm.prank(owner);
    vm.expectRevert((abi.encodeWithSignature("InvalidInitialization()")));
    agreement.setPrivateKey(first30, last30, middlePart);
  }

  function test_GetPrivateKey_AccessControl() public {
    test_AddParticipants();

    // Setup private key
    inEuint128 memory first30;
    inEuint128 memory last30;
    string memory middlePart = "middle";
    vm.prank(owner);
    agreement.setPrivateKey(first30, last30, middlePart);

    // Cannot access before agreement starts
    vm.prank(participants[0]);
    vm.expectRevert(IFederatedAgreementTypes.NotRunning.selector);
    agreement.getPrivateKey();

    // Start agreement
    vm.prank(owner);
    agreement.startAgreement();

    // Non-participant cannot access
    address nonParticipant = address(0x999);
    vm.prank(nonParticipant);
    vm.expectRevert(IFederatedAgreementTypes.NotParticipant.selector);
    agreement.getPrivateKey();
  }

  function test_RedeemCollateral_BeforeFinish() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    vm.prank(participants[0]);
    vm.expectRevert(IFederatedAgreementTypes.NotFinished.selector);
    agreement.redeemCollateral();
  }

  function test_ConfirmRoundState_NonRunning() public {
    test_AddParticipants();

    vm.prank(participants[0]);
    vm.expectRevert(IFederatedAgreementTypes.NotRunning.selector);
    agreement.confirmRoundState();
  }

  function test_ProposalVoting_AfterFinish() public {
    test_AddParticipants();
    vm.prank(owner);
    agreement.startAgreement();

    vm.prank(owner);
    agreement.createProposal(participants[0], "Test violation");

    vm.prank(owner);
    agreement.finishAgreement();

    vm.prank(participants[1]);
    vm.expectRevert(IFederatedAgreementTypes.NotRunning.selector);
    agreement.voteProposal(0, true);
  }

  function test_RewardCalculationEdgeCases() public {
    test_AddParticipants();
    vm.deal(address(agreement), TOTAL_REWARDS);

    vm.prank(owner);
    agreement.startAgreement();

    // Complex participation pattern
    for (uint round = 0; round < 5; round++) {
      // Alternating participation
      for (uint i = 0; i < participants.length; i++) {
        if ((round + i) % 2 == 0) {
          vm.prank(participants[i]);
          agreement.submitRoundIPFSState("QmHash");
          vm.prank(participants[i]);
          agreement.confirmRoundState();
        }
      }

      // Create proposals in even rounds
      if (round % 2 == 0) {
        vm.prank(owner);
        agreement.createProposal(
          participants[round % participants.length],
          string(abi.encodePacked("Violation in round ", round))
        );

        // Get minimum required votes
        for (uint i = 0; i < 4; i++) {
          vm.prank(participants[i]);
          agreement.voteProposal(0, true);
        }

        vm.warp(block.timestamp + 3 hours);
        vm.prank(owner);
        agreement.finalizeProposal(0);
      }
    }

    // Check rewards distribution
    for (uint i = 0; i < participants.length; i++) {
      uint256 rewards = agreement.getRewards(participants[i]);
      console.log("Participant", i, "rewards:", rewards);

      // Participants with even indices should have different rewards than odd indices
      if (i > 0) {
        uint256 prevRewards = agreement.getRewards(participants[i - 1]);
        assertTrue(rewards != prevRewards);
      }
    }
  }

  receive() external payable {}
}
