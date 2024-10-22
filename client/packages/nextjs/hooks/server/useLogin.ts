import { signIn } from "../../api/auth";
import { useMutation } from "@tanstack/react-query";

const useLogin = (
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
    mutationFn: signIn,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useLogin;
