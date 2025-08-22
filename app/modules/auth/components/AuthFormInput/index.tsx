import { FC } from "react";
import { AuthFormProps } from "../AuthForm";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const AuthFormInput: FC<AuthFormProps> = ({
  nextStep,
  password,
  setPassword,
  email,
  setEmail,
  error,
}) => {
  if (nextStep)
    return (
      <div>
        <Label
          htmlFor="initialPassword"
          className="block text-md font-medium text-gray-700 mb-2"
        >
          Password
        </Label>
        <Input
          id="initialPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword?.(e.target.value)}
          className={`w-full rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent mb-2
              ${
                error
                  ? "border border-red-500 focus:ring-red-500"
                  : "border border-gray-300 focus:ring-green-600"
              }`}
        />
        {error && (
          <p className="text-red-600 text-sm m-0 mb-2 flex items-center">
            <span className="mr-1">⚠️</span> {error}
          </p>
        )}
      </div>
    );

  return (
    <div>
      <Label
        htmlFor="initialEmail"
        className="block text-md font-medium text-gray-700 mb-2"
      >
        Email
      </Label>
      <Input
        id="initialEmail"
        type="email"
        value={email}
        onChange={(e) => setEmail?.(e.target.value)}
        className={`w-full rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent mb-2
              ${
                error
                  ? "border border-red-500 focus:ring-red-500"
                  : "border border-gray-300 focus:ring-green-600"
              }`}
      />
      {error && (
        <p className="text-red-600 text-sm m-0 mb-2 flex items-center">
          <span className="mr-1">⚠️</span> {error}
        </p>
      )}
    </div>
  );
};

AuthFormInput.displayName = "AuthFormInput";
export default AuthFormInput;
