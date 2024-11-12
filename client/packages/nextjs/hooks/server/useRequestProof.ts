import { useMutation } from "@tanstack/react-query";
import { createProject } from "~~/api/projects";
import { requestProof } from "~~/api/users";

const useRequestProof = (
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
    mutationFn: requestProof,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useRequestProof;
