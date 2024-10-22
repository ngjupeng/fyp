import { useQuery } from "@tanstack/react-query";
import { getProjectStates } from "~~/api/projects";
import { ProjectStats } from "~~/types/Projects";

const useProjectStats = () => {
  return useQuery({
    queryKey: ["projectStats"],
    queryFn: async (): Promise<ProjectStats> => {
      const projectStats = await getProjectStates();
      return JSON.parse(projectStats);
    },
    enabled: true,
    staleTime: 5000,
  });
};

export default useProjectStats;
