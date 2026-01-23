"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);

  // Generate particles with consistent random values
  const particles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 4,
    }));
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    // Redirect after animation
    const redirectTimer = setTimeout(() => {
      router.push("/login");
    }, 5500);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-indigo-400/30 dark:bg-indigo-600/20 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Animated Character */}
        <div className={`mb-16 transition-all duration-1000 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <svg
            className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72"
            viewBox="0 0 300 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Character body - Robot/Mascot style */}
            <g className="animate-[float_3s_ease-in-out_infinite]">
              {/* Head */}
              <rect
                x="100"
                y="60"
                width="100"
                height="80"
                rx="15"
                className="fill-indigo-500 dark:fill-indigo-400"
              />
              
              {/* Antenna */}
              <line
                x1="150"
                y1="60"
                x2="150"
                y2="30"
                className="stroke-indigo-500 dark:stroke-indigo-400"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle
                cx="150"
                cy="30"
                r="8"
                className="fill-purple-500 dark:fill-purple-400 animate-ping"
                style={{ animationDuration: '2s' }}
              />
              <circle
                cx="150"
                cy="30"
                r="8"
                className="fill-purple-500 dark:fill-purple-400"
              />

              {/* Eyes */}
              <g className="animate-[blink_4s_ease-in-out_infinite]">
                <circle
                  cx="125"
                  cy="95"
                  r="12"
                  className="fill-white dark:fill-gray-200"
                />
                <circle
                  cx="125"
                  cy="95"
                  r="6"
                  className="fill-gray-900 dark:fill-gray-800"
                />
                <circle
                  cx="175"
                  cy="95"
                  r="12"
                  className="fill-white dark:fill-gray-200"
                />
                <circle
                  cx="175"
                  cy="95"
                  r="6"
                  className="fill-gray-900 dark:fill-gray-800"
                />
              </g>

              {/* Smile */}
              <path
                d="M 130 115 Q 150 125 170 115"
                className="stroke-gray-900 dark:stroke-gray-800"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />

              {/* Body */}
              <rect
                x="90"
                y="140"
                width="120"
                height="100"
                rx="20"
                className="fill-indigo-600 dark:fill-indigo-500"
              />

              {/* Chest detail */}
              <circle
                cx="150"
                cy="190"
                r="15"
                className="fill-purple-500 dark:fill-purple-400 animate-pulse"
              />

              {/* Arms - animated waving */}
              <g className="animate-[wave_2s_ease-in-out_infinite]" style={{ transformOrigin: '85px 160px' }}>
                <rect
                  x="50"
                  y="150"
                  width="40"
                  height="60"
                  rx="10"
                  className="fill-indigo-500 dark:fill-indigo-400"
                />
              </g>

              <rect
                x="210"
                y="150"
                width="40"
                height="60"
                rx="10"
                className="fill-indigo-500 dark:fill-indigo-400"
              />

              {/* Legs */}
              <rect
                x="105"
                y="240"
                width="35"
                height="50"
                rx="10"
                className="fill-indigo-700 dark:fill-indigo-600"
              />
              <rect
                x="160"
                y="240"
                width="35"
                height="50"
                rx="10"
                className="fill-indigo-700 dark:fill-indigo-600"
              />
            </g>

            {/* Sparkles around character */}
            <g className="animate-[sparkle_2s_ease-in-out_infinite]">
              <circle cx="60" cy="100" r="3" className="fill-yellow-400 dark:fill-yellow-300" />
              <circle cx="240" cy="120" r="3" className="fill-yellow-400 dark:fill-yellow-300" />
              <circle cx="80" cy="200" r="3" className="fill-yellow-400 dark:fill-yellow-300" />
              <circle cx="220" cy="180" r="3" className="fill-yellow-400 dark:fill-yellow-300" />
            </g>
          </svg>
        </div>

        {/* Text content */}
        <div className={`text-center mb-12 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-[gradient_3s_ease-in-out_infinite]">
            Welcome Aboard!
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Preparing your amazing experience...
          </p>
        </div>

        {/* Progress bar */}
        <div className={`w-full max-w-md px-4 transition-all duration-1000 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 rounded-full transition-all duration-300 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-[shimmer_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
            {progress < 100 ? `Loading... ${progress}%` : 'Redirecting...'}
          </p>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {mounted && particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-2 h-2 bg-indigo-500/40 dark:bg-indigo-400/40 rounded-full animate-[float_4s_ease-in-out_infinite]"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
        
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}