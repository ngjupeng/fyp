import { useQuery } from "@tanstack/react-query";
import {
  getProjectCurrentRound,
  getProjectDetails,
  getProjectStates,
  getProjectss,
  getRoundDetail,
} from "~~/api/projects";
import { ProjectDetails, ProjectList, ProjectStats, RoundDetail } from "~~/types/Projects";

const useProjectCurrentRoundDetail = (id: number, currentRound: number) => {
  return useQuery({
    queryKey: ["projectCurrentRoundDetail", id, currentRound],
    queryFn: async (): Promise<RoundDetail> => {
      const projectStats = await getRoundDetail(id, currentRound);
      return JSON.parse(projectStats);
    },
    enabled: currentRound > 0,
    staleTime: 5000,
  });
};

export default useProjectCurrentRoundDetail;
