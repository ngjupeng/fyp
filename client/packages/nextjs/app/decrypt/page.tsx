"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

const Decrypt = () => {
  const [phi, setPhi] = useState("");
  const [n, setN] = useState("");
  const [encryptedArray, setEncryptedArray] = useState("");
  const [decryptedArray, setDecryptedArray] = useState([]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = async event => {
        try {
          toast.loading("Uploading file...");
          const json = JSON.parse(event.target?.result as string);
          if (json.model_name && json.parameters) {
            const { model_name, parameters } = json;

            setEncryptedArray(parameters);

            toast.dismiss();
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

  const handleDecrypt = async () => {
    const BASIS_POINT = 1000;
    const OFFSET = 10;
    if (!encryptedArray || !phi || !n) {
      toast.error("Please fill all the fields");
      return;
    }
    const response = await fetch("/api/decrypt", {
      method: "POST",
      body: JSON.stringify({ encryptedArray, phi, n }),
    });
    const data = await response.json();
    const array = data?.decryptedArray?.split("|");
    // const decryptedArray = array.map((num: any) => {
    //   return Number(num) / (BASIS_POINT * BASIS_POINT) - OFFSET;
    // });
    const decryptedArray = array.map((num: any, index: any) => {
      return Number(num) / BASIS_POINT - OFFSET;
    });

    setDecryptedArray(decryptedArray);
    console.log(decryptedArray);
  };

  return (
    <div>
      <div className="mx-auto w-full max-w-[60%] py-1">
        <h1 className="mt-10 text-3xl font-semibold text-white">Decrypt</h1>
        <div className="mt-5 mb-8 r">
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
        <div className="mb-5">
          <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
            Place phi here:
          </label>
          <input
            onChange={e => setPhi(e.target.value)}
            value={phi}
            type="text"
            name="phi"
            id="phi"
            placeholder="Phi"
            className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
          />
        </div>
        <div className="mb-5">
          <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
            Place n here:
          </label>
          <input
            onChange={e => setN(e.target.value)}
            value={n}
            type="text"
            name="n"
            id="n"
            placeholder="n"
            className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
          />
        </div>
        <button
          onClick={handleDecrypt}
          className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-white outline-none focus:shadow-md"
        >
          Decrypt
        </button>
        <div>
          {decryptedArray.length > 0 && (
            <div className="mb-10 mt-4 p-4 bg-gray-800 rounded-md">
              <div className="mt-4">
                <p className="text-sm text-gray-300 mb-2">Decrypted array:</p>
                <pre className="text-xs text-gray-400 bg-gray-700 p-2 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(decryptedArray, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Decrypt;
