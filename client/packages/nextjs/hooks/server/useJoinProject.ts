import { verifyEmail } from "../../api/auth";
import { useMutation } from "@tanstack/react-query";
import { joinProject } from "~~/api/projects";

const useJoinProject = (onSuccess: () => void, onError: (err: string) => void) => {
  return useMutation({
    mutationFn: joinProject,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useJoinProject;
