"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Loading from "~~/components/Loading";
import useMyProjects from "~~/hooks/server/useMyProjects";

const MyProjects = () => {
  const router = useRouter();

  const { data: projects, isLoading: projectsLoading } = useMyProjects();

  return (
    <div className="bg-gray-900">
      <main className="py-6 px-12 space-y-12 min-h-screen w-full">
        <div className="flex flex-col h-full w-full mx-auto  space-y-6">
          <section className="flex flex-col mx-auto rounded-lg p-6 shadow-sm shadow-secondary space-y-6 w-full">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold text-white">My Projects</h2>
            </div>
            {/* <!-- projects --> */}
            {projectsLoading ? (
              <Loading />
            ) : (
              projects?.reverse().map(project => (
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
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default MyProjects;
