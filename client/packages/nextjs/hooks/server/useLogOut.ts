import { signOut } from "../../api/auth";
import { useMutation } from "@tanstack/react-query";

const useLogOut = (onSuccess: () => void, onError: () => void) => {
  return useMutation({
    mutationFn: signOut,
    onSuccess: onSuccess,
    onError: onError,
  });
};

export default useLogOut;
