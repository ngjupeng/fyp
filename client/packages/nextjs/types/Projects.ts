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
  maximumParticipantsAllowed: number;
  maximumRounds: number;
  agreementAddress: string;
  initialGlobalModel: string;
  fileStructure: Object;
};
