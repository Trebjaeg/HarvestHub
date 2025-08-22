import Image from "next/image";

const AuthBanner = () => {
  return (
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
  );
};

export default AuthBanner;
