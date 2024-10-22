import { useRouter } from "next/navigation";

interface TwoStepVerificationProps {
  email: string;
}

const TwoStepVerification = ({ email }: TwoStepVerificationProps) => {
  const router = useRouter();

  return (
    <div className="mt-10 flex gap-10 justify-center items-center">
      <div>
        <img src="/register-success.png" alt="" className="max-w-[350px]" />
      </div>
      <div className="flex flex-col justify-between gap-5">
        <h3 className="font-bold text-2xl">Two-step verification</h3>
        <p className="leading-10">
          Thanks for signing up. An email has been sent to your email address
          containing an activation link.
          <br />
          Check your email : {email}
        </p>
        <div
          onClick={() => router.replace("/login")}
          className="mt-5 cursor-pointer border border-tertiary w-fit rounded-full px-8 py-3 text-lg"
        >
          Login Now
        </div>
      </div>
    </div>
  );
};

export default TwoStepVerification;
