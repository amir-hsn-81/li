
import React from 'react';
import type { Status } from '../types';

interface MicButtonProps {
  status: Status;
  onClick: () => void;
}

const MicrophoneIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM11 5a1 1 0 0 1 2 0v6a1 1 0 0 1-2 0V5Z"></path>
        <path d="M12 15a5 5 0 0 0 5-5V5a1 1 0 0 0-2 0v5a3 3 0 0 1-6 0V5a1 1 0 0 0-2 0v5a5 5 0 0 0 5 5Z"></path>
        <path d="M12 19a1 1 0 0 0 1-1v-1a1 1 0 1 0-2 0v1a1 1 0 0 0 1 1ZM17 12a1 1 0 0 0 1 1 5 5 0 0 1-5 5 1 1 0 0 0 0 2 7 7 0 0 0 7-7 1 1 0 0 0-1-1Z"></path>
    </svg>
);


export const MicButton: React.FC<MicButtonProps> = ({ status, onClick }) => {
  const isConnecting = status === 'connecting';
  const isActive = status === 'listening' || status === 'speaking';

  const baseClasses = "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/50";
  const shadowClasses = "shadow-[0_0_15px_rgba(59,130,246,0.5),0_0_30px_rgba(59,130,246,0.3)]";
  
  let dynamicClasses = '';
  switch (status) {
    case 'listening':
      dynamicClasses = 'bg-blue-500 animate-pulse';
      break;
    case 'speaking':
      dynamicClasses = 'bg-cyan-500 scale-105';
      break;
    case 'connecting':
        dynamicClasses = 'bg-gray-600 cursor-not-allowed';
        break;
    case 'error':
      dynamicClasses = 'bg-red-600';
      break;
    default: // idle
      dynamicClasses = 'bg-blue-600 hover:bg-blue-500 transform hover:scale-105';
      break;
  }

  return (
    <button
      onClick={onClick}
      disabled={isConnecting}
      className={`${baseClasses} ${dynamicClasses} ${isActive || status === 'idle' ? shadowClasses : ''}`}
      aria-label={isActive ? "Stop session" : "Start session"}
    >
        {isConnecting ? (
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-t-transparent border-white rounded-full animate-spin"></div>
        ) : (
            <MicrophoneIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        )}
        {status === 'speaking' && (
            <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-cyan-300 animate-ping opacity-75"></div>
        )}
    </button>
  );
};
