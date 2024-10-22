"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useResetPassword from "~~/hooks/server/useResetPassword";

const ForgotPassword = () => {
  const router = useRouter();

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ local states ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  const [resetPasswordDetail, setResetPasswordDetail] = useState({
    newPassword: "",
    confirmNewPassword: "",
  });

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ server hooks ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  const {
    mutate: resetPassword,
    isPending: resetPasswordLoading,
    isSuccess: resetPasswordSuccess,
  } = useResetPassword(resetSuccess, resetFailed);
  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ server hooks function handlers ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  function resetSuccess() {
    toast.dismiss();
    toast.success("Password reset successfully");
    router.push("/login");
  }

  function resetFailed(error: {
    response: {
      data: {
        message: string;
      };
    };
  }) {
    toast.dismiss();
    if (typeof error?.response?.data?.message == "string") {
      toast.error(error?.response?.data?.message);
    } else {
      toast.error(
        "Password must at least 8 characters, with at least one uppercase letter, one lowercase letter, and one number and special character",
      );
    }
  }

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ local function handlers ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  function handleSend() {
    if (resetPasswordDetail.confirmNewPassword.trim() == "" || resetPasswordDetail.newPassword.trim() == "") {
      toast.error("Please enter a valid new password");
    } else {
      if (resetPasswordDetail.confirmNewPassword != resetPasswordDetail.newPassword) {
        toast.error("Please make sure that new and confirm password are the same");
      } else {
        const currentURL = window.location.href;
        const urlObject = new URL(currentURL);
        const token = urlObject.searchParams.get("token");
        if (token) {
          resetPassword({
            confirm: resetPasswordDetail.confirmNewPassword,
            password: resetPasswordDetail.newPassword,
            token,
          });
        } else {
          toast.error("Not token found");
        }
      }
    }
  }

  function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    setResetPasswordDetail(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function handleRedirectToLogin() {
    router.push("/login");
  }

  return (
    <div className="bg-gray-900 text-white flex min-h-screen flex-col items-center pt-16 sm:justify-center sm:-mt-20">
      <div className="relative mt-12 w-full max-w-lg sm:mt-10">
        <div className="relative -mb-px h-px w-full bg-gradient-to-r from-transparent via-sky-300 to-transparent"></div>
        <div className="mx-5 border dark:border-b-white/50 dark:border-t-white/50 border-b-white/20 sm:border-t-white/20 shadow-[20px_0_20px_20px] shadow-slate-500/10 dark:shadow-white/20 rounded-lg border-white/20 border-l-white/20 border-r-white/20 sm:shadow-sm lg:rounded-xl lg:shadow-none">
          <div className="flex flex-col p-6">
            <h3 className="text-xl font-semibold leading-6 tracking-tighter">Reset account password</h3>
            <p className="mt-1.5 text-sm font-medium text-white/50">Enter a new password</p>
          </div>
          <div className="p-6 pt-0">
            <div>
              <div>
                <div>
                  <div className="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
                    <div className="flex justify-between">
                      <label className="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                        New password
                      </label>
                      <div className="absolute right-3 translate-y-2 text-green-200"></div>
                    </div>
                    <input
                      value={resetPasswordDetail.newPassword}
                      onChange={handleOnChange}
                      type="password"
                      name="newPassword"
                      placeholder="Your new password"
                      autoComplete="off"
                      className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground"
                    />
                  </div>
                  <div className="mt-5 group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
                    <div className="flex justify-between">
                      <label className="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                        Confirm password
                      </label>
                      <div className="absolute right-3 translate-y-2 text-green-200"></div>
                    </div>
                    <input
                      value={resetPasswordDetail.confirmNewPassword}
                      onChange={handleOnChange}
                      type="password"
                      name="confirmNewPassword"
                      placeholder="Confirm your new password"
                      autoComplete="off"
                      className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-x-2">
                <button
                  onClick={handleSend}
                  className="font-semibold hover:bg-black hover:text-white hover:ring hover:ring-white transition duration-300 inline-flex items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-black h-10 px-4 py-2"
                  type="submit"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
