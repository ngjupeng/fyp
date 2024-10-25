import { verifyEmail } from "../../api/auth";
import { useMutation } from "@tanstack/react-query";
import { joinProject, startProject } from "~~/api/projects";

const useStartProject = (onSuccess: () => void, onError: (err: string) => void) => {
  return useMutation({
    mutationFn: startProject,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useStartProject;
