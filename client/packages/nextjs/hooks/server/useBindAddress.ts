import { bindWallet } from "../../api/users";
import { useMutation } from "@tanstack/react-query";

const useBindAddress = (
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
    mutationFn: bindWallet,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useBindAddress;
