import { verifyEmail } from "../../api/auth";
import { useMutation } from "@tanstack/react-query";

const useVerifyEmail = (onSuccess: () => void, onError: (err: string) => void) => {
  return useMutation({
    mutationFn: verifyEmail,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useVerifyEmail;
