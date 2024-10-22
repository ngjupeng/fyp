import { signUp } from "../../api/auth";
import { useMutation } from "@tanstack/react-query";

const useRegister = (
  onSuccess: (data: string) => void,
  onError: (error: {
    response: {
      data: {
        message: string | Array<{ constraints: { matches: string } }>;
      };
    };
  }) => void,
) => {
  return useMutation({
    mutationFn: signUp,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useRegister;
