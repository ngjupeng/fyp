"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import TwoStepVerification from "./_components/TwoStepVerification";
import toast from "react-hot-toast";
import useRegister from "~~/hooks/server/useRegister";

const Register = () => {
  const router = useRouter();
  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ local states ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  const [isRegisterSuccess, setRegisterSuccess] = useState(false);
  const [registerDetail, setRegisterDetail] = useState({
    email: "",
    name: "",
    password: "",
    confirm: "",
  });

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ server hooks ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  const { mutate: register, isPending: registerLoading } = useRegister(registerSuccess, registerFailed);

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ server hooks function handlers ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  function registerSuccess() {
    toast.dismiss();
    toast.success("Register Successfully");
    setRegisterSuccess(true);
  }

  function registerFailed(error: {
    response: {
      data: {
        message: string | Array<{ constraints: { matches: string } }>;
      };
    };
  }) {
    toast.dismiss();
    let errorMsg = "email already exist";
    if (Array.isArray(error?.response?.data?.message)) {
      errorMsg = Object.values(error?.response?.data?.message[0]?.constraints)[0];
    }
    toast.error(errorMsg);
  }

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ local function handlers ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  function handleRedirectToLogin() {
    router.push("/login");
  }

  function handleSignUp() {
    console.log(registerDetail);
    if (
      registerDetail.email.trim() === "" ||
      registerDetail.name.trim() === "" ||
      registerDetail.password.trim() === "" ||
      registerDetail.confirm.trim() === ""
      // registerDetail.companyName?.trim() === ""
    ) {
      toast.dismiss();
      toast.error("Please enter valid information");
    } else {
      if (registerDetail.password.trim() != registerDetail.confirm.trim()) {
        toast.dismiss();
        toast.error("Please make sure the password is correct");
      } else {
        toast.loading("Loading...");
        register(registerDetail);
      }
    }
  }

  function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    setRegisterDetail(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }
  return (
    <div className="bg-gray-900 text-white flex min-h-screen flex-col items-center pt-16 sm:justify-center sm:-mt-20">
      <div className="relative mt-12 w-full max-w-lg sm:mt-10">
        <div className="relative -mb-px h-px w-full bg-gradient-to-r from-transparent via-sky-300 to-transparent"></div>
        {isRegisterSuccess ? (
          <TwoStepVerification email={registerDetail.email} />
        ) : (
          <div className="mx-5 border dark:border-b-white/50 dark:border-t-white/50 border-b-white/20 sm:border-t-white/20 shadow-[20px_0_20px_20px] shadow-slate-500/10 dark:shadow-white/20 rounded-lg border-white/20 border-l-white/20 border-r-white/20 sm:shadow-sm lg:rounded-xl lg:shadow-none">
            <div className="flex flex-col p-6">
              <h3 className="text-xl font-semibold leading-6 tracking-tighter">Register</h3>
              <p className="mt-1.5 text-sm font-medium text-white/50"> Welcome! Create your account to continue.</p>
            </div>
            <div className="p-6 pt-0">
              <div>
                <div>
                  <div>
                    <div className="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
                      <div className="flex justify-between">
                        <label className="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                          Email
                        </label>
                        <div className="absolute right-3 translate-y-2 text-green-200"></div>
                      </div>
                      <input
                        onChange={handleOnChange}
                        value={registerDetail.email}
                        type="email"
                        name="email"
                        placeholder="Your email"
                        autoComplete="off"
                        className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div>
                    <div className="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
                      <div className="flex justify-between">
                        <label className="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                          Name
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          onChange={handleOnChange}
                          value={registerDetail.name}
                          type="text"
                          name="name"
                          placeholder="Your name"
                          className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div>
                    <div className="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
                      <div className="flex justify-between">
                        <label className="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                          Password
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          onChange={handleOnChange}
                          value={registerDetail.password}
                          type="password"
                          name="password"
                          placeholder="Your password"
                          className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div>
                    <div className="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
                      <div className="flex justify-between">
                        <label className="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">
                          Confirm Password
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          onChange={handleOnChange}
                          value={registerDetail.confirm}
                          type="password"
                          name="confirm"
                          placeholder="Confirm password"
                          className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm">
                  {" "}
                  Already have an account?{" "}
                  <a href="/login" className="underline cursor-pointer">
                    Sign in here
                  </a>
                </p>
                <div className="mt-4 flex items-center justify-end gap-x-2">
                  <button
                    onClick={handleSignUp}
                    disabled={registerLoading}
                    className="font-semibold hover:bg-black hover:text-white hover:ring hover:ring-white transition duration-300 inline-flex items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-black h-10 px-4 py-2"
                    type="submit"
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
