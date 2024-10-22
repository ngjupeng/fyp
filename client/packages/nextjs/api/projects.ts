import api from ".";

async function getProjectStates(): Promise<string> {
  const response = await api.get("project/stats", {});
  return JSON.stringify(response.data);
}

export { getProjectStates };
