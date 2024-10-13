"use client";

import React, { useEffect, useState } from "react";
import AddSubmission from "./_components/AddSubmission";
import CreateProposal from "./_components/CreateProposal";
import { Button } from "@headlessui/react";
import { BlockieAvatar } from "~~/components/scaffold-eth";

const ProjectDetail = () => {
  return (
    <div className="bg-gray-900">
      <main className="py-6 px-12 space-y-12 min-h-screen w-full">
        <div className="flex flex-col h-full w-full mx-auto  space-y-6">
          <section className="flex flex-col mx-auto rounded-lg p-6 shadow-sm shadow-secondary space-y-6 w-full">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold text-white">Project Name here</h2>
                <div className="text-blue-500 cursor-pointer">[Get private key]</div>
              </div>
              <div>
                <button
                  type="button"
                  className="text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800"
                >
                  Start
                </button>
                <button
                  type="button"
                  className="text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900"
                >
                  End
                </button>
              </div>
            </div>
            {/* <!-- projects --> */}
            <div className="container mx-auto">
              <p>project description here</p>

              <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Project Details
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Creator
                      </th>
                      <td className="px-6 py-4">0x..</td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Verification Dataset URL
                      </th>
                      <td className="px-6 py-4">link here</td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Status
                      </th>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-500 text-xs font-semibold px-2 py-1 rounded-full">
                          Ongoing
                        </span>
                      </td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Initial global model
                      </th>
                      <td className="px-6 py-4">0x..</td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Participants Amount
                      </th>
                      <td className="px-6 py-4">5 / 10</td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Maximum Participants
                      </th>
                      <td className="px-6 py-4">10</td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Maximum Rounds
                      </th>
                      <td className="px-6 py-4">10</td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Current Round
                      </th>
                      <td className="px-6 py-4">0</td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Minimum Reputation
                      </th>
                      <td className="px-6 py-4">10</td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Collateral Amount
                      </th>
                      <td className="px-6 py-4">10</td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Total Reward Amount
                      </th>
                      <td className="px-6 py-4">10</td>
                    </tr>
                    <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        Agreement Address
                      </th>
                      <td className="px-6 py-4">0x</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-6">
                  <h2 className="text-xl font-bold text-white">Participants</h2>
                  <div className="max-h-[300px] overflow-y-scroll">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                      <tbody>
                        <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                          <th
                            scope="row"
                            className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                          >
                            Name
                          </th>
                          <td className="px-6 py-4">0x3B584D901D4aEFC30950fd5af50882413E013A60</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* here only show if project is started */}
                <div className="mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Current Round Participant Submission</h3>
                    <div className="flex gap-3">
                      <Button className="rounded-md bg-black/20 py-2 px-4 text-sm font-medium text-white focus:outline-none data-[hover]:bg-black/30 data-[focus]:outline-1 data-[focus]:outline-white">
                        Confirm State
                      </Button>
                      <AddSubmission />
                    </div>
                  </div>
                  <h4 className="my-2 text-lg">
                    Current round global model:{" "}
                    <span className="font-bold text-blue-500 cursor-pointer">IPFS LINK HERE</span>
                  </h4>
                  <h4 className="my-2 text-lg">
                    Current round confirmed state: <span className="font-bold">5/10</span>
                  </h4>
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Participant
                        </th>
                        <th scope="col" className="px-6 py-3">
                          IPFS Submission
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                        >
                          Creator
                        </th>
                        <td className="px-6 py-4">0x..</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Current Round Proposal</h3>
                    <CreateProposal />
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="mx-auto">
                      <div className="relative flex flex-col mt-6 text-white border border-base-100 shadow-md bg-clip-border rounded-xl w-96">
                        <div className="p-6">
                          <h5 className="block mb-2 font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                            Proposal of SUSPICIOUS ON `Address`
                          </h5>
                          <p className="block font-sans text-base antialiased font-light leading-relaxed text-inherit">
                            justification here
                          </p>
                        </div>
                        <div className="flex justify-end pb-2">
                          <button
                            className="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                            type="button"
                          >
                            Vote No
                          </button>
                          <button
                            className="align-middle select-none font-sans font-bold text-center uppercase transition-all disabled:opacity-50 disabled:shadow-none disabled:pointer-events-none text-xs py-3 px-6 rounded-lg bg-gray-900 text-white shadow-md shadow-gray-900/10 hover:shadow-lg hover:shadow-gray-900/20 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none"
                            type="button"
                          >
                            Vote Yes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-bold text-white">Query Previous Round Submission</h3>

                  <div className="relative">
                    <input
                      type="number"
                      className="w-full pl-3 pr-3 py-3 bg-transparent placeholder:text-slate-400 text-white text-sm border border-slate-200 rounded-md transition duration-300 ease focus:outline-none focus:border-slate-400 hover:border-slate-300 shadow-sm focus:shadow"
                      placeholder="Round Number"
                    />
                    <button
                      type="submit"
                      className="text-blue-500 absolute end-6 top-1.5 inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50h-10 px-4 py-2 duration-200"
                    >
                      Search
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-bold text-white">Collateral & Reward</h3>

                  <div className="relative">
                    <div>
                      Your reward amount: 10 <span className="text-blue-500 cursor-pointer">[Redeem]</span>
                    </div>
                    <div>
                      Your collateral amount: 10 <span className="text-blue-500 cursor-pointer">[Redeem]</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetail;
