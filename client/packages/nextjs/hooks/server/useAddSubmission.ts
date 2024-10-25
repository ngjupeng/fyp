import { useMutation } from "@tanstack/react-query";
import { addSubmission, createProject } from "~~/api/projects";

const useAddSubmission = (
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
    mutationFn: addSubmission,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useAddSubmission;
