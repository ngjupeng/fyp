import { useQuery } from "@tanstack/react-query";
import { getProjectDetails, getProjectStates, getProjectss } from "~~/api/projects";
import { ProjectDetails, ProjectList, ProjectStats } from "~~/types/Projects";

const useProjectDetails = (id: number) => {
  return useQuery({
    queryKey: ["projectDetails", id],
    queryFn: async (): Promise<ProjectDetails> => {
      const projectStats = await getProjectDetails(id);
      return JSON.parse(projectStats);
    },
    enabled: true,
    staleTime: 5000,
  });
};

export default useProjectDetails;
