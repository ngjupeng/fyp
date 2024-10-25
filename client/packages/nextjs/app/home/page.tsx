"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "~~/components/Loading";
import useAllProjects from "~~/hooks/server/useAllProjects";
import useProjectStats from "~~/hooks/server/useProjectStats";

const Home = () => {
  const router = useRouter();
  const { data: projectStats, isLoading: projectStatsLoading } = useProjectStats();
  const { data: projects, isLoading: projectsLoading } = useAllProjects();
  return (
    <div className="bg-gray-900">
      <main className="py-6 px-12 space-y-12 min-h-screen w-full">
        {projectStatsLoading || projectsLoading ? (
          <div className="flex justify-center mt-10">
            {" "}
            <Loading />
          </div>
        ) : (
          <div className="flex flex-col h-full w-full mx-auto  space-y-6">
            <section className="flex flex-col mx-auto rounded-lg p-6 shadow-sm shadow-secondary space-y-6 w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full min-w-0">
                {/* <!-- In use --> */}
                <div className="flex flex-col px-6 py-2 border border-base-100  rounded-lg overflow-hidden">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-6xl font-bold tracking-tight leading-none text-blue-500">
                      {projectStats?.ongoingProjects}
                    </div>
                    <div className="text-lg font-medium text-blue-500">Ongoing</div>
                  </div>
                </div>
                {/* <!-- renovation --> */}
                <div className="flex flex-col px-6 py-2 border border-base-100  rounded-lg overflow-hidden">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-6xl font-bold tracking-tight leading-none text-amber-500">
                      {projectStats?.pendingProjects}
                    </div>
                    <div className="text-lg font-medium text-amber-600">Pending</div>
                  </div>
                </div>
                {/* <!-- Suspended --> */}
                <div className="flex flex-col px-6 py-2 border border-base-100  rounded-lg overflow-hidden">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-6xl font-bold tracking-tight leading-none text-red-500">
                      {projectStats?.completedProjects}
                    </div>
                    <div className="text-lg font-medium text-red-600">Completed</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <h2 className="mt-10 text-3xl font-bold text-white">Projects</h2>
                <button
                  onClick={() => router.push("/create-project")}
                  className="mt-5 h-[50px] rounded-md bg-slate-800 py-2 px-4 border border-transparent text-center text-sm text-white transition-all shadow-md hover:shadow-lg focus:bg-slate-700 focus:shadow-none active:bg-slate-700 hover:bg-slate-700 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none ml-2"
                  type="button"
                >
                  Create New Project +
                </button>
              </div>
              {/* <!-- projects --> */}
              {[...(projects || [])].reverse().map(project => (
                <div className="container mx-auto">
                  <div className="grid grid-cols-1 gap-6">
                    {/* <!-- Card 1 --> */}
                    <div className="bg-base-300 p-6 rounded-lg relative">
                      {/* <!-- Title and Content --> */}
                      <h3 className="text-xl font-bold mb-1">{project.name}</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {project.creator.name} | {new Date(project.createdAt).toLocaleDateString()}
                      </p>

                      {/* <!-- Tags --> */}
                      <div className="flex space-x-2 mb-4">
                        <span
                          className={`${
                            project.status.toLowerCase() === "running"
                              ? "bg-green-500"
                              : project.status.toLowerCase() === "pending"
                              ? "bg-amber-500"
                              : "bg-red-500"
                          } text-xs font-semibold px-2 py-1 rounded-full`}
                        >
                          {project.status}
                        </span>
                      </div>

                      <p className="text-gray-400 mb-3">{project.description}</p>
                      <p className="text-gray-400 mb-6">
                        Participants: {project.participantsCount} / {project.maximumParticipantAllowed}
                      </p>
                      <div className="flex justify-end">
                        <div
                          onClick={() => router.push(`/projects/${project.id}`)}
                          className="text-blue-500 flex justify-end cursor-pointer hover:scale-[105%] transition w-fit"
                        >
                          View Detail
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
