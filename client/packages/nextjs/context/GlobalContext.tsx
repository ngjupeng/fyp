"use client";

import { PropsWithChildren, createContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Loading from "../components/Loading";
import useCurrentUser from "../hooks/server/useCurrentUser";
import { CurrentUser } from "../types/User";
import { QueryObserverResult, RefetchOptions, RefetchQueryFilters } from "@tanstack/react-query";

interface GlobalContextData {
  userCredentials: {
    id: number;
    roles: string;
    email: string;
    name: string;
    address: string;
  };
  setUserCredentials: React.Dispatch<
    React.SetStateAction<{
      id: number;
      roles: string;
      email: string;
      name: string;
      address: string;
    }>
  >;
  currentUserDataRefetch: (options?: RefetchOptions & RefetchQueryFilters) => Promise<QueryObserverResult<CurrentUser>>;
}

const GlobalContext = createContext<GlobalContextData>({
  userCredentials: {
    id: -1,
    roles: "",
    email: "",
    name: "",
    address: "",
  },
  setUserCredentials: () => {},
  currentUserDataRefetch: async (): Promise<QueryObserverResult<CurrentUser>> =>
    ({} as QueryObserverResult<CurrentUser>),
});

export const GlobalContextProvider = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const pathname = usePathname();
  const [userCredentials, setUserCredentials] = useState<{
    id: number;
    roles: string;
    name: string;
    email: string;
    address: string;
  }>({
    id: 0,
    roles: "",
    email: "",
    name: "",
    address: "",
  });

  const {
    data: currentUserData,
    isLoading: currentUserDataLoading,
    isError: currentUserDataError,
    refetch: currentUserDataRefetch,
  } = useCurrentUser();

  useEffect(() => {
    if (currentUserData) {
      setUserCredentials({
        id: currentUserData?.id,
        roles: currentUserData?.role!,
        email: currentUserData?.email,
        name: currentUserData?.name,
        address: currentUserData?.address,
      });

      if (["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"].includes(pathname)) {
        router.replace("/home");
      }
    }
    if (
      currentUserDataError &&
      location.pathname !== "/login" &&
      location.pathname !== "/register" &&
      location.pathname !== "/forgot-password" &&
      location.pathname !== "/reset-password" &&
      location.pathname !== "/verify-email"
    ) {
      // If the user is not authenticated and not on the login or register pages, redirect to the login page
      router.replace("/login");
    }
  }, [currentUserData, currentUserDataLoading, currentUserDataError, router]);

  return (
    <GlobalContext.Provider
      value={{
        userCredentials,
        setUserCredentials,
        currentUserDataRefetch,
      }}
    >
      {currentUserDataLoading &&
      !currentUserDataError &&
      (pathname.includes("/dashboard") || pathname.includes("/stats/company") || pathname.includes("/transaction")) ? (
        <div className="w-screen h-screen flex items-center justify-center bg-primary">
          <Loading />
        </div>
      ) : (
        children
      )}
    </GlobalContext.Provider>
  );
};

export default GlobalContext;
