import { FC, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { validateEmail } from "@/lib/validate-email";
import { toast } from "sonner";
import AuthFormInput from "../AuthFormInput";

export interface AuthFormProps {
  email?: string;
  setEmail?: (email: string) => void;
  error?: string;
  setError?: (error: string) => void;
  nextStep?: boolean;
  setNextStep?: (nextStep: boolean) => void;
  password?: string;
  setPassword?: (password: string) => void;
  handleSubmit?: (e: React.FormEvent) => void;
}

const AuthForm: FC<AuthFormProps> = ({
  email,
  error,
  nextStep,
  password,
  setEmail,
  setPassword,
  setError,
  handleSubmit,
  setNextStep,
}) => {
  const emailValid = useMemo(() => {
    if (email === "") return true;
    return !validateEmail(email || "");
  }, [email]);

  useEffect(() => {
    if (emailValid) setError?.("Email must be correct");
    if (!emailValid) setError?.("");
  }, [emailValid, email]);

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center px-8 bg-gray-100">
      <div className="max-w-lg w-full shadow-lg rounded-lg bg-white p-8">
        <div className="flex justify-start mb-4">
          <Image
            src="/images/harvesthub.png"
            alt="Harvest Hub"
            width={40}
            height={40}
          />
          <h1 className="text-3xl font-semibold text-green-700 ml-2">
            Harvest Hub
          </h1>
        </div>
        <h2 className="text-3xl font-bold mb-2 text-gray-800">
          Enter your email to continue
        </h2>
        <p className="text-gray-600 mb-6">
          Log in to Harvest Hub using your email. If you don&apos;t have an
          account yet, you&apos;ll be prompted to create one.
        </p>

        <form
          onSubmit={(e) => {
            handleSubmit?.(e);
            console.log("test");
          }}
          className="space-y-4"
        >
          <AuthFormInput
            email={email}
            setEmail={setEmail}
            error={error}
            nextStep={nextStep}
            password={password}
            setPassword={setPassword}
          />
          <Button
            disabled={emailValid}
            variant={"default"}
            type="button"
            onClick={() => {
              setNextStep?.(emailValid);
              if (emailValid) toast.success("Email passed!");
            }}
            className="w-full text-white font-semibold py-3 rounded-md transition cursor-pointer"
          >
            Proceed
          </Button>
        </form>

        <p className="text-center mt-4">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-green-700 font-semibold hover:underline"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

AuthForm.displayName = "AuthForm";
export default AuthForm;
