import { resetPassword } from "../../api/auth";
import { useMutation } from "@tanstack/react-query";

const useResetPassword = (
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
    mutationFn: resetPassword,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useResetPassword;
