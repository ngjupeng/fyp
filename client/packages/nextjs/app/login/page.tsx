"use client";

import React, { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import GlobalContext from "~~/context/GlobalContext";
import useLogin from "~~/hooks/server/useLogin";

const Login = () => {
  const router = useRouter();
  const { setUserCredentials, currentUserDataRefetch } = useContext(GlobalContext);

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ local states ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  const [loginCredentials, setLoginCredentials] = useState({
    email: "",
    password: "",
  });

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ server hooks ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  const { mutate: login, isPending: loginLoading } = useLogin(loginSuccess, loginFailed);
  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ server hooks function handlers ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  function loginSuccess(data: string) {
    const loginRes: {
      role: string;
      accessToken: string;
      isTwoFactorAuthEnabled: boolean;
    } = JSON.parse(data);
    localStorage.setItem("accessToken", loginRes.accessToken);

    router.push("/home");

    setUserCredentials(prev => ({
      ...prev,
      roles: loginRes.role,
      email: loginCredentials.email,
    }));
    currentUserDataRefetch();
    toast.dismiss();
  }

  function loginFailed(error: {
    response: {
      data: {
        message: string;
      };
    };
  }) {
    console.log("faileddd", error);
    toast.dismiss();
    toast.error("Invalid credentials");
  }

  /* ╭━━━━━━━━━━━━━━━━━━━━━━━━ local function handlers ━━━━━━━━━━━━━━━━━━━━━━━━━╮ */
  function handleLogin() {
    if (loginCredentials.email.trim() == "" || loginCredentials.password.trim() == "") {
      toast.error("Please enter a valid email or password");
    } else {
      toast.loading("Loading...");
      login({
        email: loginCredentials.email,
        password: loginCredentials.password,
      });
    }
  }

  function handleOnChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLoginCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  return (
    <div className="bg-gray-900 text-white flex min-h-screen flex-col items-center pt-16 sm:justify-center sm:-mt-20">
      <div className="relative mt-12 w-full max-w-lg sm:mt-10">
        <div className="relative -mb-px h-px w-full bg-gradient-to-r from-transparent via-sky-300 to-transparent"></div>
        <div className="mx-5 border dark:border-b-white/50 dark:border-t-white/50 border-b-white/20 sm:border-t-white/20 shadow-[20px_0_20px_20px] shadow-slate-500/10 dark:shadow-white/20 rounded-lg border-white/20 border-l-white/20 border-r-white/20 sm:shadow-sm lg:rounded-xl lg:shadow-none">
          <div className="flex flex-col p-6">
            <h3 className="text-xl font-semibold leading-6 tracking-tighter">Login</h3>
            <p className="mt-1.5 text-sm font-medium text-white/50">
              Welcome back, enter your credentials to continue.
            </p>
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
                      value={loginCredentials.email}
                      onChange={handleOnChange}
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
                        Password
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        value={loginCredentials.password}
                        onChange={handleOnChange}
                        type="password"
                        name="password"
                        placeholder="Your password"
                        className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <a className="text-sm font-medium text-foreground underline" href="/forgot-password">
                  Forgot password?
                </a>
              </div>
              <div className="mt-4 flex items-center justify-end gap-x-2">
                <a
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:ring hover:ring-white h-10 px-4 py-2 duration-200"
                  href="/register"
                >
                  Register
                </a>
                <button
                  onClick={handleLogin}
                  className="disabled:opacity-50 font-semibold hover:bg-black hover:text-white hover:ring hover:ring-white transition duration-300 inline-flex items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none bg-white text-black h-10 px-4 py-2"
                  type="submit"
                  disabled={loginLoading}
                >
                  Log in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
