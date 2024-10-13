"use client";

import React, { useEffect, useState } from "react";

const MyProjects = () => {
  return (
    <div className="bg-gray-900">
      <main className="py-6 px-12 space-y-12 min-h-screen w-full">
        <div className="flex flex-col h-full w-full mx-auto  space-y-6">
          <section className="flex flex-col mx-auto rounded-lg p-6 shadow-sm shadow-secondary space-y-6 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">My Projects</h2>
            </div>
            {/* <!-- projects --> */}
            <div className="container mx-auto">
              <div className="grid grid-cols-1 gap-6">
                {/* <!-- Card 1 --> */}
                <div className="bg-base-300 p-6 rounded-lg relative">
                  {/* <!-- Title and Content --> */}
                  <h3 className="text-xl font-bold mb-1">Project title here</h3>
                  <p className="text-sm text-gray-500 mb-4">By Jane Doe | August 10, 2024</p>

                  {/* <!-- Tags --> */}
                  <div className="flex space-x-2 mb-4">
                    <span className="bg-green-100 text-green-500 text-xs font-semibold px-2 py-1 rounded-full">
                      Ongoing
                    </span>
                  </div>

                  <p className="text-gray-400 mb-3">
                    In this article, we will navigate these deep waters, exploring contrasting perspectives of
                    Scripture, the views of religious denominations, and the arguments presented by experts in this
                    still passionately debated field.
                  </p>
                  <p className="text-gray-400 mb-6">Participants: 5 / 10</p>
                  <div className="flex justify-end">
                    <div className="text-blue-500 flex justify-end cursor-pointer hover:scale-[105%] transition w-fit">
                      View Detail
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

export default MyProjects;
