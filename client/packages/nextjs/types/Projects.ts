import { User } from "./User";

export type ProjectStats = {
  ongoingProjects: number;
  pendingProjects: number;
  completedProjects: number;
};

export type Project = {
  name: string;
  description: string;
  verificationDatasetURL: string;
  n: string;
  g: string;
  minimumReputation: number;
  collateralAmount: number;
  totalRewardAmount: number;
  maximumParticipantAllowed: number;
  maximumRounds: number;
  agreementAddress: string;
  initialGlobalModel: string;
  fileStructure: Object;
};

export type ProjectList = {
  creator: User;
  agreementAddress: string;
  createdAt: string;
  currentRound: number;
  id: string;
  participants: [];
  participantsCount: number;
  status: string;
  name: string;
  description: string;
  verificationDatasetURL: string;
  n: string;
  g: string;
  minimumReputation: number;
  collateralAmount: number;
  totalRewardAmount: number;
  maximumParticipantAllowed: number;
  maximumRounds: number;
  initialGlobalModel: string;
  fileStructure: Object;
};

export type ProjectDetails = {
  creator: User;
  agreementAddress: string;
  createdAt: string;
  currentRound: number;
  id: string;
  participants: User[];
  status: string;
  name: string;
  description: string;
  verificationDatasetURL: string;
  n: string;
  g: string;
  minimumReputation: number;
  collateralAmount: number;
  totalRewardAmount: number;
  maximumParticipantAllowed: number;
  maximumRounds: number;
  initialGlobalModel: string;
  fileStructure: Object;
  rounds: Round[];
};

export type Round = {
  id: number;
  createdAt: string;
  roundNumber: number;
  updatedAt: string;
  globalModelIPFSLink: string;
};

export type RoundDetail = {
  round: Round;
  submissions: Submission[];
};

export type Submission = {
  id: number;
  createdAt: string;
  updatedAt: string;
  IPFSLink: string;
  encryptedParameters: string;
  participant: User;
};

export type Proposal = {
  proposer: string;
  suspiciousParticipant: string;
  proposalId: bigint;
  proposalRound: bigint;
  proposalVotingTime: bigint;
  proposalVotesYes: bigint;
  proposalVotesNo: bigint;
  proposalStatus: number;
  proposalDescription: string;
};
