import { useQuery } from "@tanstack/react-query";
import { getProjectCurrentRound, getProjectDetails, getProjectStates, getProjectss } from "~~/api/projects";
import { ProjectDetails, ProjectList, ProjectStats } from "~~/types/Projects";

const useProjectCurrentRound = (id: number) => {
  return useQuery({
    queryKey: ["projectCurrentRound", id],
    queryFn: async (): Promise<ProjectDetails> => {
      const projectStats = await getProjectCurrentRound(id);
      return JSON.parse(projectStats);
    },
    enabled: true,
    staleTime: 5000,
  });
};

export default useProjectCurrentRound;
