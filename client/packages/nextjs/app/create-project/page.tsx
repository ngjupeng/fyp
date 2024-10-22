"use client";

import React, { useState } from "react";
import axios from "axios";
import { PinataSDK } from "pinata-web3";
import toast from "react-hot-toast";

const CreateProject = () => {
  const [isShowingNextPage, setIsShowingNextPage] = useState<boolean>(false);
  const [phi, setPhi] = useState<string>("");
  const [projectDetails, setProjectDetails] = useState<{
    name: string;
    description: string;
    verificationDatasetURL: string;
    n: string;
    g: string;
    minimumReputation: number;
    collateralAmount: number;
    totalRewardAmount: number;
    maximumParticipantsAllowed: number;
    maximumRounds: number;
    agreementAddress: string;
    initialGlobalModel: string;
    fileStructure: Object;
  }>({
    name: "",
    description: "",
    verificationDatasetURL: "",
    n: "",
    g: "",
    minimumReputation: 0,
    collateralAmount: 0,
    totalRewardAmount: 0,
    maximumParticipantsAllowed: 0,
    maximumRounds: 0,
    agreementAddress: "",
    initialGlobalModel: "",
    fileStructure: {},
  });

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectDetails({ ...projectDetails, [e.target.name]: e.target.value });
  };

  const handleOnChangeTextArea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProjectDetails({ ...projectDetails, [e.target.name]: e.target.value });
  };

  const generateKeypair = async () => {
    try {
      const response = await axios.get("/api/generate-keypair");
      const { phi, g, n } = response.data;
      console.log(response.data);
      return { phi, g, n };
    } catch (error) {
      console.error("Error generating keypair:", error);
      toast.error("Failed to generate keypair");
      throw error;
    }
  };

  const encryptArray = async (array: number[], g: string, n: string) => {
    try {
      const response = await axios.post("/api/encrypt", {
        array: array.join("|"),
        g,
        n,
      });
      return response.data.encryptedArray;
    } catch (error) {
      console.error("Error encrypting array:", error);
      toast.error("Failed to encrypt array");
      throw error;
    }
  };

  const uploadToIPFS = async (model_name: string, encryptedArray: string) => {
    const data = {
      model_name: model_name,
      parameters: encryptedArray,
    };

    // upload to IPFS
    const pinata = new PinataSDK({
      pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
      pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY || "example-gateway.mypinata.cloud",
    });

    const jsonString = JSON.stringify(data);

    // Create a Blob with the JSON data
    const blob = new Blob([jsonString], { type: "application/json" });

    // Create a File object from the Blob
    const file = new File([blob], `${model_name}_${new Date().toISOString()}_initial_model.json`, {
      type: "application/json",
    });

    // Upload to IPFS
    const upload = await pinata.upload.file(file);
    console.log("IPFS upload result:", upload);

    // Get IPFS hash
    const ipfsHash = upload.IpfsHash;
    return ipfsHash;
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = async event => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.model_name && json.parameters) {
            const { model_name, parameters } = json;
            const { flattenedArray, structure } = flattenParameters(parameters);

            const { phi, g, n } = await generateKeypair();
            setPhi(phi);
            const encryptedArray = await encryptArray(flattenedArray, g, n);
            const ipfsHash = await uploadToIPFS(model_name, encryptedArray);

            setProjectDetails({
              ...projectDetails,
              initialGlobalModel: ipfsHash,
              n: n,
              g: g,
              fileStructure: structure,
            });
            toast.success("Model uploaded successfully");
          } else {
            toast.error("Invalid JSON structure. Must contain 'model_name' and 'parameters'.");
          }
        } catch (error) {
          toast.error("Error parsing JSON file.");
        }
      };
      reader.readAsText(file);
    } else {
      toast.error("Please select a JSON file.");
      e.target.value = "";
    }
  };

  const flattenParameters = (obj: any): { flattenedArray: number[]; structure: any } => {
    const flattenedArray: number[] = [];
    const structure: any = {};

    const getArrayStructure = (arr: any[]): number[] => {
      const dimensions = [arr.length];
      if (arr.length > 0 && Array.isArray(arr[0])) {
        dimensions.push(arr[0].length);
      }
      return dimensions;
    };

    const flatten = (current: any, path: string[] = []) => {
      if (Array.isArray(current)) {
        structure[path.join(".")] = getArrayStructure(current);
        current.flat(Infinity).forEach(item => {
          if (typeof item === "number") {
            flattenedArray.push(item);
          }
        });
      } else if (typeof current === "object" && current !== null) {
        for (const key in current) {
          flatten(current[key], [...path, key]);
        }
      } else if (typeof current === "number") {
        flattenedArray.push(current);
        structure[path.join(".")] = [1];
      }
    };

    flatten(obj);
    return { flattenedArray, structure };
  };

  const handleCreateProject = async () => {
    // Check if all required fields in projectDetails are filled
    const requiredFields = Object.entries(projectDetails).filter(([key]) => key !== "agreementAddress");
    const missingFields = requiredFields.filter(([_, value]) => value === "" || value === 0);

    if (missingFields.length === 0) {
      // go next page
      setIsShowingNextPage(true);
      // 1. approve
      // 2. call core contract create agreement
      // 3. store agreement address in projectDetails
    } else {
      const missingFieldNames = missingFields.map(([key]) => key).join(", ");
      toast.error(`Please fill all required fields: ${missingFieldNames}`);
    }
  };

  return (
    <div className="bg-gray-900">
      <div className="flex items-center justify-center">
        {/* <!-- Author: FormBold Team --> */}
        <div className="mx-auto w-full max-w-[60%] py-1">
          {isShowingNextPage ? (
            <div>
              <h1>1. Approve</h1>
              <button>Approve</button>
            </div>
          ) : (
            <div className="py-4 px-9">
              <div className="mb-5">
                <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                  Project Name:
                </label>
                <input
                  onChange={handleOnChange}
                  value={projectDetails.name}
                  type="text"
                  name="name"
                  id="name"
                  placeholder="Project Name"
                  className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                />
              </div>

              <div className="mb-5">
                <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                  Project Description:
                </label>
                <textarea
                  onChange={handleOnChangeTextArea}
                  value={projectDetails.description}
                  name="description"
                  id="description"
                  placeholder="What is this project about?"
                  className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                />
              </div>

              <div className="mb-5">
                <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                  Verification Dataset Url
                </label>
                <input
                  onChange={handleOnChange}
                  value={projectDetails.verificationDatasetURL}
                  type="text"
                  name="verificationDatasetURL"
                  id="verificationDatasetURL"
                  placeholder="Project Name"
                  className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                />
                <p className="my-0 mt-1 text-xs text-gray-500">
                  * This will be later used htmlFor participant compare accuracy of global model against participant
                  uploaded model
                </p>
              </div>

              <div className="-mx-3 flex flex-wrap">
                <div className="w-full px-3 sm:w-1/2">
                  <div className="mb-5">
                    <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                      Minimum Reputation
                    </label>
                    <input
                      onChange={handleOnChange}
                      value={projectDetails.minimumReputation}
                      type="number"
                      name="minimumReputation"
                      id="minimumReputation"
                      className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                    />
                  </div>
                </div>
                <div className="w-full px-3 sm:w-1/2">
                  <div className="mb-5">
                    <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                      Maximum Participants Allowed
                    </label>
                    <input
                      onChange={handleOnChange}
                      value={projectDetails.maximumParticipantsAllowed}
                      type="number"
                      name="maximumParticipantsAllowed"
                      id="maximumParticipantsAllowed"
                      className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                    />
                  </div>
                </div>
                <div className="w-full px-3 sm:w-1/2">
                  <div className="mb-5">
                    <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                      Maximum Participants Allowed
                    </label>
                    <input
                      onChange={handleOnChange}
                      value={projectDetails.maximumRounds}
                      type="number"
                      name="maximumRounds"
                      id="maximumRounds"
                      className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                    />
                  </div>
                </div>
                <div className="w-full px-3 sm:w-1/2">
                  <div className="mb-5">
                    <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                      Maximum Rounds
                    </label>
                    <input
                      onChange={handleOnChange}
                      value={projectDetails.maximumRounds}
                      type="number"
                      name="maximumRounds"
                      id="maximumRounds"
                      className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                    />
                  </div>
                </div>
                <div className="w-full px-3 sm:w-1/2">
                  <div className="mb-5">
                    <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                      Collateral Amount
                    </label>
                    <input
                      onChange={handleOnChange}
                      value={projectDetails.collateralAmount}
                      type="number"
                      name="collateralAmount"
                      id="collateralAmount"
                      className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                    />
                  </div>
                </div>
                <div className="w-full px-3 sm:w-1/2">
                  <div className="mb-5">
                    <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                      Total Reward Amount
                    </label>
                    <input
                      onChange={handleOnChange}
                      value={projectDetails.totalRewardAmount}
                      type="number"
                      name="totalRewardAmount"
                      id="totalRewardAmount"
                      className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                    />
                    <p className="my-0 mt-1 text-xs text-gray-500">
                      * This will be distributed among participants on each round
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6 pt-4">
                <label className="mb-3 block text-base font-medium text-white">Upload Initial Model</label>

                <div className="mb-8 r">
                  <input
                    onChange={handleUploadFile}
                    type="file"
                    name="initialGlobalModel"
                    id="initialGlobalModel"
                    className="sr-only"
                    accept=".json,application/json"
                  />
                  <label
                    htmlFor="initialGlobalModel"
                    className="relative flex min-h-[200px] items-center justify-center rounded-md border border-dashed border-[#e0e0e0] p-12 text-center"
                  >
                    <div className="cursor-pointe">
                      <span className="mb-2 block text-xl font-semibold text-white">Drop files here</span>
                      <span className="mb-2 block text-base font-medium text-white">Or</span>
                      <span className="inline-flex rounded border border-[#e0e0e0] py-2 px-7 text-base font-medium text-white">
                        Browse JSON
                      </span>
                    </div>
                  </label>
                </div>

                <div>
                  {projectDetails.initialGlobalModel && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-md">
                      <h3 className="text-lg font-semibold text-white mb-2">Upload Details:</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-300">Private Key (phi):</p>
                          <p className="text-xs text-gray-400 break-all">{phi}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-300">IPFS Hash:</p>
                          <p className="text-xs text-gray-400 break-all">{projectDetails.initialGlobalModel}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-300 mb-2">File Structure:</p>
                        <pre className="text-xs text-gray-400 bg-gray-700 p-2 rounded-md overflow-auto max-h-40">
                          {JSON.stringify(projectDetails.fileStructure, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  onClick={handleCreateProject}
                  className="mb-10 hover:shadow-form w-full rounded-md bg-[#6A64F1] py-3 px-8 text-center text-base font-semibold text-white outline-none"
                >
                  Create Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
