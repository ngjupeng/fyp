import api from ".";
import { Project } from "~~/types/Projects";

async function getProjectStates(): Promise<string> {
  const response = await api.get("project/stats", {});
  return JSON.stringify(response.data);
}

async function createProject(data: Project): Promise<string> {
  const response = await api.post("project/create", data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return response.data;
}

export { getProjectStates, createProject };
