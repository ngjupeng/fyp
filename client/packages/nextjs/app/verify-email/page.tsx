"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "../../components/Loading";
import ResultPage from "./_components/ResultPage";
import useVerifyEmail from "~~/hooks/server/useVerifyEmail";

const VerifyEmail = () => {
  const [render, setRender] = useState(false);
  const router = useRouter();

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ local states ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  const [isVerifySuccess, setIsVerifySuccess] = useState(true);

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ server hooks ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  const { mutate: verifyEmail, isPending: verifyEmailLoading } = useVerifyEmail(handleVerifySuccess, handleVerifyFail);

  /* ╭━━━━━━━━━━━━━━━━━━━━ server hooks success handlers ━━━━━━━━━━━━━━━━━━━━━╮ */
  function handleVerifySuccess() {
    setIsVerifySuccess(true);
  }

  /* ╭━━━━━━━━━━━━━━━━━━━━ server hooks failed handlers ━━━━━━━━━━━━━━━━━━━━━╮ */
  function handleVerifyFail() {
    setIsVerifySuccess(false);
  }

  useEffect(() => {
    const currentUrl = window.location.href;

    const url = new URL(currentUrl);

    const searchParams = url.searchParams;
    const token = searchParams.get("token");

    if (token) {
      verifyEmail(token);
    } else {
      setIsVerifySuccess(false);
    }
    if (!verifyEmailLoading) setRender(true);
  }, []);

  return (
    <div>
      {render ? (
        <>
          {isVerifySuccess ? (
            <ResultPage
              type={"verifyFailed"}
              altText={"verify email"}
              textMessage={"Successfully Verified"}
              buttonText={"Go to login"}
              onclick={() => router.push("/login")}
            />
          ) : (
            <ResultPage
              type={"verifySuccess"}
              altText={"Error 2"}
              textMessage={"Failed To Verify"}
              buttonText={"Sign up again"}
              onclick={() => router.push("/register")}
            />
          )}
        </>
      ) : (
        <div className="flex justify-center mx-auto mt-10">
          <Loading />
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
