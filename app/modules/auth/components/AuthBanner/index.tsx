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

          {/* Cloud 1 - Near "Direct" */}
          <div className="absolute top-[25%] left-[8%]" 
               style={{
                 animation: 'swayLeftRight1 6s ease-in-out infinite'
               }}>
            <Image
              src="/images/cloud1.png"
              alt="Cloud 1"
              width={350}
              height={220}
              className="opacity-75"
            />
          </div>
          
          {/* Cloud 2 - Near "You" */}
          <div className="absolute bottom-[15%] right-[8%]" 
               style={{
                 animation: 'swayLeftRight2 8s ease-in-out infinite'
               }}>
            <Image
              src="/images/cloud2.png"
              alt="Cloud 2"
              width={340}
              height={215}
              className="opacity-70"
            />
          </div>
          
          {/* Leaf 1 - Left side */}
          <div className="absolute top-1/3 left-16" 
               style={{
                 animation: 'swayLeaf1 4s ease-in-out infinite'
               }}>
            <Image
              src="/images/leaf1.png"
              alt="Leaf 1"
              width={85}
              height={85}
              className="opacity-80"
            />
          </div>
          
          {/* Leaf 2 - Right side */}
          <div className="absolute bottom-1/4 right-20" 
               style={{
                 animation: 'swayLeaf2 5s ease-in-out infinite'
               }}>
            <Image
              src="/images/leaf2.png"
              alt="Leaf 2"
              width={90}
              height={90}
              className="opacity-75"
            />
          </div>
          
          {/* Small Cloud */}
          <div className="absolute top-1/3 right-[15%]" 
               style={{
                 animation: 'driftSlow 12s ease-in-out infinite'
               }}>
            <Image
              src="/images/cloud1.png"
              alt="Small Cloud"
              width={120}
              height={65}
              className="opacity-30 scale-75"
            />
          </div>
          
          {/* Small Leaf - Top Right */}
          <div className="absolute top-24 right-24" 
               style={{
                 animation: 'rotateGentle 7s ease-in-out infinite'
               }}>
            <Image
              src="/images/leaf2.png"
              alt="Small Leaf"
              width={65}
              height={65}
              className="opacity-60"
            />
          </div>

          <div className="text-center px-4 relative z-10">
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
      
      <style jsx global>{`
        @keyframes swayLeftRight1 {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(15px);
          }
        }
        
        @keyframes swayLeftRight2 {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(-20px);
          }
        }
        
        @keyframes floatCloud1 {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-10px) translateX(5px);
          }
          66% {
            transform: translateY(-5px) translateX(-3px);
          }
        }
        
        @keyframes floatCloud2 {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          50% {
            transform: translateY(-15px) translateX(-8px);
          }
        }
        
        @keyframes swayLeaf1 {
          0%, 100% {
            transform: rotate(0deg) translateY(0px);
          }
          25% {
            transform: rotate(5deg) translateY(-3px);
          }
          75% {
            transform: rotate(-3deg) translateY(2px);
          }
        }
        
        @keyframes swayLeaf2 {
          0%, 100% {
            transform: rotate(0deg) translateY(0px);
          }
          30% {
            transform: rotate(-8deg) translateY(-5px);
          }
          70% {
            transform: rotate(4deg) translateY(3px);
          }
        }
        
        @keyframes driftSlow {
          0%, 100% {
            transform: translateX(0px) translateY(0px);
          }
          50% {
            transform: translateX(20px) translateY(-8px);
          }
        }
        
        @keyframes rotateGentle {
          0%, 100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(10deg);
          }
        }
      `}</style>
    </div>
  );
};

export default AuthBanner;
