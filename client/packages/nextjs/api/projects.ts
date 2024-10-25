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

async function getProjectss(): Promise<string> {
  const response = await api.get("project/all", {});
  return JSON.stringify(response.data);
}

async function getMyProjects(): Promise<string> {
  const response = await api.get(`project/my`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return JSON.stringify(response.data);
}

async function getProjectCurrentRound(id: number): Promise<string> {
  const response = await api.get(`project/${id}/current-round`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return JSON.stringify(response.data);
}

async function getProjectDetails(id: number): Promise<string> {
  const response = await api.get(`project/details/${id}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return JSON.stringify(response.data);
}

async function getRoundDetail(projectId: number, roundNumber: number): Promise<string> {
  const response = await api.get(`round/${projectId}/${roundNumber}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
  return JSON.stringify(response.data);
}

async function joinProject(id: number): Promise<string> {
  const response = await api.post(
    `project/join/${id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    },
  );
  return JSON.stringify(response.data);
}

async function startProject(id: number): Promise<string> {
  const response = await api.post(
    `project/start/${id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    },
  );
  return JSON.stringify(response.data);
}

async function addSubmission(data: {
  projectId: number;
  roundNumber: number;
  ipfsHash: string;
  encryptedParameters: string;
}): Promise<string> {
  const response = await api.post(
    `round/submission`,
    {
      projectId: data.projectId,
      roundNumber: data.roundNumber,
      encryptedParameters: data.encryptedParameters,
      ipfsLink: data.ipfsHash,
    },
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    },
  );
  return JSON.stringify(response.data);
}

export {
  getProjectStates,
  createProject,
  getProjectss,
  getMyProjects,
  getProjectDetails,
  joinProject,
  startProject,
  getProjectCurrentRound,
  getRoundDetail,
  addSubmission,
};
