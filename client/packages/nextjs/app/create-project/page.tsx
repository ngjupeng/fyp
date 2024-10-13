import React from "react";

const CreateProject = () => {
  return (
    <div className="bg-gray-900">
      <div className="flex items-center justify-center">
        {/* <!-- Author: FormBold Team --> */}
        <div className="mx-auto w-full max-w-[60%] py-1">
          <form className="py-4 px-9">
            <div className="mb-5">
              <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                Project Name:
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Project Name"
                className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                Project Description:
              </label>
              <textarea
                name="email"
                id="email"
                placeholder="What is this project about?"
                className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
              />
            </div>

            <div className="mb-5">
              <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                Verification Dataset Url
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="Project Name"
                className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
              />
              <p className="my-0 mt-1 text-xs text-gray-500">
                * This will be later used htmlFor participant compare accuracy of global model against participant
                uploaded model
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                Token
              </label>
              <select
                id="gender"
                name="gender"
                className="w-full rounded-md border border-base-100 py-3 px-6 text-base font-medium text-[#6B7280] outline-none focus:shadow-md"
                required
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="-mx-3 flex flex-wrap">
              <div className="w-full px-3 sm:w-1/2">
                <div className="mb-5">
                  <label htmlFor="email" className="mb-3 block text-base font-medium text-white">
                    Minimum Reputation
                  </label>
                  <input
                    type="number"
                    name="date"
                    id="date"
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
                    type="number"
                    name="date"
                    id="date"
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
                    type="number"
                    name="date"
                    id="date"
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
                    type="number"
                    name="date"
                    id="date"
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
                    type="number"
                    name="date"
                    id="date"
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
                    type="number"
                    name="date"
                    id="date"
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
                <input type="file" name="file" id="file" className="sr-only" />
                <label
                  htmlFor="file"
                  className="relative flex min-h-[200px] items-center justify-center rounded-md border border-dashed border-[#e0e0e0] p-12 text-center"
                >
                  <div className="cursor-pointe">
                    <span className="mb-2 block text-xl font-semibold text-white">Drop files here</span>
                    <span className="mb-2 block text-base font-medium text-white">Or</span>
                    <span className="inline-flex rounded border border-[#e0e0e0] py-2 px-7 text-base font-medium text-white">
                      Browse
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <button className="mb-10 hover:shadow-form w-full rounded-md bg-[#6A64F1] py-3 px-8 text-center text-base font-semibold text-white outline-none">
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
