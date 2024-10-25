import { useQuery } from "@tanstack/react-query";
import { getProjectStates, getProjectss } from "~~/api/projects";
import { ProjectList, ProjectStats } from "~~/types/Projects";

const useAllProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async (): Promise<ProjectList[]> => {
      const projectStats = await getProjectss();
      return JSON.parse(projectStats);
    },
    enabled: true,
    staleTime: 5000,
  });
};

export default useAllProjects;
