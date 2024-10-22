import React from "react";

interface ResultPageProps {
  type: string;
  altText: string;
  textMessage: string;
  buttonText: string;
  optionalMessage?: string;
  onclick: () => void;
}
const ResultPage: React.FC<ResultPageProps> = ({
  type,
  altText,
  textMessage,
  buttonText,
  onclick,
  optionalMessage,
}) => {
  const imageMap: Record<string, string> = {
    noAccess: "/no-access.png",
    verifyFailed: "/verify-failed.png",
    verifySuccess: "/verify-success.png",
  };
  const selectedImageUrl = imageMap[type];

  return (
    <div className="w-[80%] lg:w-[40%] mx-auto mt-10">
      <div className="font-semibold text-center text-xl">{textMessage}</div>
      <img src={selectedImageUrl} alt={altText} className="w-[80%] mx-auto" />
      <div className="text-center">{optionalMessage}</div>
      <div className="mt-5 flex justify-center items-center mx-auto">
        <button
          onClick={onclick}
          type="button"
          className="bg-tertiary rounded-full px-6 py-3 w-[60%]"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ResultPage;
