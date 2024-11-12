import api from ".";
import { User } from "../types/User";

async function getAllUsers(data?: { ids: number[] }): Promise<User[]> {
  let params = {};
  if (data) {
    const idsAsString = data.ids.join(",");
    params = { ids: idsAsString };
  }
  const response = await api.get("user/management/list", {
    params: params,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });

  return response.data;
}

async function assignRole(data: { id: string; role: string }): Promise<string> {
  const { role, id } = data;

  const endPoint: string = role == "staff" ? "update-staff-role" : "update-client-role";

  const response = await api.patch(
    `user/management/${endPoint}`,
    {},
    {
      params: { id },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    },
  );

  return response.data;
}

async function removeUser(id: string | number): Promise<string> {
  return await api
    .delete(`management/remove-user/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
    .then(response => {
      return JSON.stringify(response.data);
    });
}

async function changeUserCompanies(data: { userId: number; companyIds: number[] }): Promise<string> {
  const { userId, companyIds } = data;
  const params = { userId, companyIds: companyIds.join(",") };
  return await api
    .patch(
      "user/management/change-companies",
      {},
      {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      },
    )
    .then(response => {
      return JSON.stringify(response.data);
    });
}

async function getUserDetail(data: { id: number | string }): Promise<string> {
  const { id } = data;
  const response = await api.get(`user/management/info?id=${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return JSON.stringify(response.data);
}

async function bindWallet(address: string): Promise<string> {
  const response = await api.patch(
    "user/bind-address",
    { address },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    },
  );
  return JSON.stringify(response.data);
}

async function requestProof(data: { address: string; providerId: string }): Promise<string> {
  const response = await api.post(
    `user/request-proofs?address=${data.address}&providerId=${data.providerId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    },
  );
  return JSON.stringify(response.data);
}

export { getAllUsers, assignRole, removeUser, changeUserCompanies, getUserDetail, bindWallet, requestProof };
