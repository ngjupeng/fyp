import api from ".";

async function signUp(data: {
  email: string;
  name: string;
  password: string;
  confirm: string;
  // companyName: string;
}): Promise<string> {
  const response = await api.post("auth/signup", data, {
    withCredentials: false,
  });
  return response.data;
}

async function signIn(data: { email: string; password: string }): Promise<string> {
  return await api.post("auth/signin", data).then(async response => {
    return JSON.stringify(response.data);
  });
}
async function generateTwoFactorQrCode(): Promise<string> {
  const response = await api.get("/auth/gen-qr-code", {
    responseType: "blob",
    withCredentials: false,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  return URL.createObjectURL(response.data);
}
async function authentication2FA(code: string): Promise<string> {
  const config = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  };
  const response = await api.post("auth/authenticate-2fa", { code }, config);
  return response.data;
}

async function signOut(): Promise<string> {
  const config = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  };
  // remove access token from local storage
  localStorage.removeItem("accessToken");
  const response = await api.post("auth/logout", {}, config);
  return JSON.stringify(response.data);
}

async function verifyEmail(token: string): Promise<void> {
  const response = await api.post("auth/email-verification", { token });
  return response.data;
}

async function forgotPassword(data: { email: string }): Promise<string> {
  const response = await api.post("auth/forgot-password", data, {});
  return JSON.stringify(response.data);
}

async function resetPassword(data: { token: string; password: string; confirm: string }): Promise<string> {
  const response = await api.post("auth/restore-password", data);
  return JSON.stringify(response.data);
}

async function getCurrentUser(): Promise<string> {
  const response = await api.get("user/info", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return JSON.stringify(response.data);
}

export {
  signUp,
  signOut,
  signIn,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  verifyEmail,
  generateTwoFactorQrCode,
  authentication2FA,
};
