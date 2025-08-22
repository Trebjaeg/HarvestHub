"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    // Optional: extra validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    // Continue submit logic here...
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Background/Image section */}
      <div className="relative hidden lg:flex lg:w-1/2">
        <div className="relative w-full h-full">
          <Image
            src="/images/harvesthubleft2.png"
            alt="Farm landscape"
            fill
            className="w-full h-full object-cover"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <p className="leading-none text-[#285508] font-myFont text-5xl m-0">
                <span className="mr-9">Direct from the</span>
                <br />
                <span className="text-7xl font-bold">Farm.</span>
                <span className="ml-2">Straight</span>
                <br />
                <span className="text-6xl">to</span>
                <span className="text-7xl font-bold ml-2 mr-37">You.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form section */}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <label
              htmlFor="initialEmail"
              className="block text-md font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <input
              id="initialEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent 
              ${
                error
                  ? "border border-red-500 focus:ring-red-500"
                  : "border border-gray-300 focus:ring-green-600"
              }`}
            />
            {error && (
              <p className="text-red-600 text-sm m-0 -mt-2 mb-2 flex items-center">
                <span className="mr-1">⚠️</span> {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-green-700 text-white font-semibold py-3 rounded-md hover:bg-green-800 transition cursor-pointer"
            >
              Proceed
            </button>
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
    </div>
  );
}
