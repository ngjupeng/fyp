import { getCurrentUser } from "../../api/auth";
import { CurrentUser } from "../../types/User";
import { useQuery } from "@tanstack/react-query";

const useAllUsers = () => {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async (): Promise<CurrentUser> => {
      const currentUser = await getCurrentUser();
      return JSON.parse(currentUser);
    },
    enabled: true,
    staleTime: 5000,
  });
};

export default useAllUsers;
