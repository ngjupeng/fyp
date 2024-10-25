"use client";

import React, { useContext, useState } from "react";
import axios from "axios";
import { JsonRpcProvider } from "ethers";
import { EncryptionTypes, FhenixClient } from "fhenixjs";
import { PinataSDK } from "pinata-web3";
import toast from "react-hot-toast";
import { parseEther } from "viem";
import { useSimulateContract, useWriteContract } from "wagmi";
import GlobalContext from "~~/context/GlobalContext";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import useCreateProject from "~~/hooks/server/useCreateProject";
import { publicClient } from "~~/services/web3/fhenixClient";

const CreateProject = () => {
  const agreementAbi = deployedContracts[8008135].FederatedAgreement.abi;
  const coreAddress = deployedContracts[8008135].FederatedCore.address;
  const coreAbi = deployedContracts[8008135].FederatedCore.abi;

  let isAgreementCreated = false;

  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [isShowingNextPage, setIsShowingNextPage] = useState<boolean>(false);
  const [agreementAddress, setAgreementAddress] = useState<`0x${string}`>("0x0");

  const [phi, setPhi] = useState<string>("");
  const { userCredentials } = useContext(GlobalContext);
  const [projectDetails, setProjectDetails] = useState<{
    name: string;
    description: string;
    verificationDatasetURL: string;
    n: string;
    g: string;
    minimumReputation: number;
    collateralAmount: number;
    totalRewardAmount: number;
    maximumParticipantAllowed: number;
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
    maximumParticipantAllowed: 0,
    maximumRounds: 0,
    agreementAddress: "",
    initialGlobalModel: "",
    fileStructure: {},
  });

  // contract hooks
  const { writeContractAsync: coreContractWrite } = useScaffoldWriteContract("FederatedCore");

  const { writeContractAsync: agreementContractWrite } = useWriteContract();

  const { mutate: createProject } = useCreateProject(
    () => {
      toast.success("Project updated with agreement address");
    },
    error => {
      console.log(error);
      if (typeof error.response.data.message == "string") {
        toast.error(error.response.data.message);
      } else {
        toast.error("Create project failed");
      }
    },
  );

  const result = useSimulateContract({
    abi: agreementAbi,
    address: agreementAddress,
    functionName: "getPrivateKey",
    args: [],
    account: userCredentials.address,
  });

  const unwatch = publicClient.watchContractEvent({
    address: coreAddress,
    abi: coreAbi,
    eventName: "AgreementCreated",
    args: {
      owner: userCredentials.address,
    },
    onLogs(logs: any) {
      const log = logs[0];
      if (!isAgreementCreated) {
        const agreementAddress = log?.args?.agreement;
        setAgreementAddress(agreementAddress);
        createProject({
          ...projectDetails,
          agreementAddress: agreementAddress,
        });
        isAgreementCreated = true;
      }
    },
  });

  const handleCreateAgreement = async () => {
    const { totalRewardAmount, collateralAmount, maximumParticipantAllowed, minimumReputation, maximumRounds } =
      projectDetails;
    let owner = userCredentials.address;

    if (owner == null) {
      return toast.error("You have to bind your wallet first!");
    }

    try {
      console.log(projectDetails);
      const value = Number(projectDetails.collateralAmount) + Number(projectDetails.totalRewardAmount);
      await coreContractWrite({
        functionName: "createAgreement",
        args: [
          owner,
          BigInt(parseEther(totalRewardAmount.toString())),
          BigInt(parseEther(collateralAmount.toString())),
          BigInt(maximumParticipantAllowed),
          BigInt(minimumReputation),
          BigInt(maximumRounds),
        ],
        value: parseEther(String(value)),
      });
    } catch (e) {
      console.log(e);
      console.error("Error create agreement:", e);
    }
  };

  const handleSetPrivateKey = async () => {
    // initialize your web3 provider
    const provider = new JsonRpcProvider("https://api.helium.fhenix.zone");

    // initialize Fhenix Client
    const client = new FhenixClient({ provider });
    console.log(phi);
    const first30 = Number(phi.slice(0, 16));
    console.log(first30);
    const last30 = Number(phi.slice(-16));
    const middlePart = phi.slice(16, -16);

    try {
      console.log(agreementAddress);
      let encryptedFirst30 = await client.encrypt(first30, EncryptionTypes.uint128);
      let encryptedLast30 = await client.encrypt(last30, EncryptionTypes.uint128);

      // Convert Uint8Array to hex string
      const first30Hex = "0x" + Buffer.from(encryptedFirst30.data).toString("hex");
      const last30Hex = "0x" + Buffer.from(encryptedLast30.data).toString("hex");

      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: agreementAddress,
        functionName: "setPrivateKey",
        args: [{ data: first30Hex }, { data: last30Hex }, middlePart],
      });

      console.log("Write contract result:", result);
      toast.success("Private key set successfully");
    } catch (error) {
      console.error("Error setting private key:", error);
      toast.error("Failed to set private key");
    }
  };

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
          setIsUploadingFile(true);
          toast.loading("Uploading file...");
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
            toast.dismiss();
            toast.success("Model uploaded successfully");
            setIsUploadingFile(false);
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
    const missingFields = requiredFields.filter(([_, value]) => value === "");

    if (missingFields.length === 0) {
      // first create project record in db
      console.log(projectDetails);

      setIsShowingNextPage(true);
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
            <div className="mt-10">
              <h2 className="text-3xl text-white font-bold mb-5">Setup your project</h2>
              <div>
                <div className="mb-5">
                  <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                    1. Create agreement with collateral and reward:
                  </label>
                </div>
                <button
                  onClick={handleCreateAgreement}
                  className="disabled:opacity-50 font-semibold hover:bg-black hover:text-white hover:ring hover:ring-white transition duration-300 inline-flex items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none bg-white text-black h-10 px-4 py-2"
                >
                  Create
                </button>
              </div>

              <div className="mt-5">
                <div className="mb-5">
                  <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                    2. Set private key in agreement address:
                  </label>
                </div>
                <button
                  onClick={handleSetPrivateKey}
                  className="disabled:opacity-50 font-semibold hover:bg-black hover:text-white hover:ring hover:ring-white transition duration-300 inline-flex items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none bg-white text-black h-10 px-4 py-2"
                >
                  Set
                </button>
              </div>

              <div className="mt-5">Your project has been set up successfully!</div>
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
                  placeholder="Verification Dataset URL"
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
                      value={projectDetails.maximumParticipantAllowed}
                      type="number"
                      name="maximumParticipantAllowed"
                      id="maximumParticipantAllowed"
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
                          <p className="text-xs text-gray-400">
                            Please do a backup of this private key, our platform will not store it or remain any record
                          </p>
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
