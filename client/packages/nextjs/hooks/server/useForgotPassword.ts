import { forgotPassword } from "../../api/auth";
import { useMutation } from "@tanstack/react-query";

const useForgotPassword = (
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
    mutationFn: forgotPassword,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useForgotPassword;
