import { useState } from "react";
import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import axios from "axios";
import { PinataSDK } from "pinata-web3";
import toast from "react-hot-toast";
import { useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import useAddSubmission from "~~/hooks/server/useAddSubmission";

interface AddSubmissionProps {
  projectId: number;
  g: string;
  n: string;
  currentRound: number;
  structure: object;
  agreementAddress: string;
  projectStatus: string;
  refetchProjectCurrentRoundDetail: () => void;
}

export default function AddSubmission({
  projectId,
  g,
  n,
  currentRound,
  structure,
  agreementAddress,
  projectStatus,
  refetchProjectCurrentRoundDetail,
}: AddSubmissionProps) {
  const agreementAbi = deployedContracts[8008148].FederatedAgreement.abi;

  let [isOpen, setIsOpen] = useState(false);
  let [ipfsHash, setIpfsHash] = useState("");
  let [encryptedArray, setEncryptedArray] = useState("");

  const { writeContractAsync: agreementContractWrite } = useWriteContract();

  const { mutate: addSubmission } = useAddSubmission(
    () => {
      close();
      refetchProjectCurrentRoundDetail();
      toast.success("Submission added successfully");
    },
    error => {
      toast.error(error.response.data.message);
    },
  );

  function open() {
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
  }

  const encryptArray = async (array: string[], g: string, n: string) => {
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
    const file = new File([blob], `${model_name}_${currentRound}_${new Date().toISOString()}_submission.json`, {
      type: "application/json",
    });

    // Upload to IPFS
    const upload = await pinata.upload.file(file);

    // Get IPFS hash
    const ipfsHash = upload.IpfsHash;
    return ipfsHash;
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const BASIS_POINT = 1000;
    const OFFSET = 10;
    const file = e.target.files?.[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = async event => {
        try {
          toast.loading("Uploading file...");
          const json = JSON.parse(event.target?.result as string);
          if (json.model_name && json.parameters) {
            const { model_name, parameters } = json;
            const { flattenedArray, structure: uploadedStructure } = flattenParameters(parameters);

            // check if structure is the same as the project structure
            if (JSON.stringify(structure) !== JSON.stringify(uploadedStructure)) {
              toast.error("Structure of the uploaded file is not the same as the project structure");
              return;
            }
            const multipliedArray = flattenedArray.map(num => {
              num = Number((num + OFFSET) * BASIS_POINT);
              return num.toString();
            });

            const encryptedArray = await encryptArray(multipliedArray, g, n);

            // const response = await fetch("/api/decrypt", {
            //   method: "POST",
            //   body: JSON.stringify({
            //     encryptedArray,
            //     phi: "39447589266885628430822614441030007857765438352372081135685522527121299205614527047368425139318170632365470718880490614013766119047902098128839510504637631964296646619546843032839315964780912943562332108526258541196906036359223796496353142521753023741259133703072707878812731097492381419235856276035360738552",
            //     n: "39447589266885628430822614441030007857765438352372081135685522527121299205614527047368425139318170632365470718880490614013766119047902098128839510504637644981378859565521418562435408979126887934419084674645291401476949823847892578389946773610522166650652851867899175376654935595836454386226158406541284616111",
            //   }),
            // });
            // const data = await response.json();
            // const array = data?.decryptedArray?.split("|");
            // console.log(array);

            const ipfsHash = await uploadToIPFS(model_name, encryptedArray);
            setIpfsHash(ipfsHash);

            setEncryptedArray(encryptedArray);

            toast.dismiss();
            toast.success("Model uploaded successfully");
          } else {
            toast.error("Invalid JSON structure. Must contain 'model_name' and 'parameters'.");
          }
        } catch (error) {
          toast.dismiss();
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

  const handleAddSubmission = async () => {
    if (!ipfsHash) {
      toast.error("Please upload a file first");
      return;
    }
    try {
      const result = await agreementContractWrite({
        abi: agreementAbi,
        address: agreementAddress,
        functionName: "submitRoundIPFSState",
        args: [ipfsHash],
      });
      addSubmission({
        projectId: projectId,
        roundNumber: currentRound,
        ipfsHash,
        encryptedParameters: encryptedArray,
      });
    } catch (error) {
      toast.error("Failed to add submission");
    }
  };

  return (
    <>
      {projectStatus.toLowerCase() == "running" && (
        <Button
          onClick={open}
          className="rounded-md bg-black/20 py-2 px-4 text-sm font-medium text-white focus:outline-none data-[hover]:bg-black/30 data-[focus]:outline-1 data-[focus]:outline-white"
        >
          Add Submission +
        </Button>
      )}

      <Dialog open={isOpen} as="div" className="relative z-10 focus:outline-none" onClose={close}>
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel
              transition
              className="w-full max-w-md rounded-xl bg-white/5 p-6 backdrop-blur-2xl duration-300 ease-out data-[closed]:transform-[scale(95%)] data-[closed]:opacity-0"
            >
              <DialogTitle as="h3" className="text-base/7 font-medium text-white">
                Add submission
              </DialogTitle>
              <p className="mt-2 text-sm/6 text-white/50">
                <div className="mb-5">
                  <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="file_input">
                    Upload file:
                  </label>
                  <input
                    onChange={handleUploadFile}
                    className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                    id="file_input"
                    type="file"
                    accept=".json,application/json"
                  />
                </div>
              </p>
              <div className="mt-4 flex justify-end">
                <Button
                  className="inline-flex items-center gap-2 rounded-md bg-gray-700 py-1.5 px-3 text-sm/6 font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-600 data-[focus]:outline-1 data-[focus]:outline-white data-[open]:bg-gray-700"
                  onClick={handleAddSubmission}
                >
                  Add
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
