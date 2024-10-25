import { useQuery } from "@tanstack/react-query";
import { getMyProjects, getProjectStates, getProjectss } from "~~/api/projects";
import { ProjectList, ProjectStats } from "~~/types/Projects";

const useMyProjects = () => {
  return useQuery({
    queryKey: ["myprojects"],
    queryFn: async (): Promise<ProjectList[]> => {
      const projectStats = await getMyProjects();
      return JSON.parse(projectStats);
    },
    enabled: true,
    staleTime: 5000,
  });
};

export default useMyProjects;
