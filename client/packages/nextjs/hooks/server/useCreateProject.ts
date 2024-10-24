import { useMutation } from "@tanstack/react-query";
import { createProject } from "~~/api/projects";

const useCreateProject = (
  onSuccess: (data: string) => void,
  onError: (error: {
    response: {
      data: {
        message: string;
      };
    };
  }) => void,
) => {
  return useMutation({
    mutationFn: createProject,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useCreateProject;
