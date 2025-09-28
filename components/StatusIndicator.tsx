
import React from 'react';
import type { Status } from '../types';

interface StatusIndicatorProps {
  status: Status;
  error: string | null;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, error }) => {
  let text = '';
  let textColor = 'text-gray-400';

  if (error) {
    text = error;
    textColor = 'text-red-500';
  } else {
    switch (status) {
      case 'connecting':
        text = 'Connecting...';
        break;
      case 'listening':
        text = 'Listening...';
        break;
      case 'speaking':
        text = 'Liana is speaking...';
        break;
      case 'idle':
        text = 'Press the button to start';
        break;
      default:
        text = '';
    }
  }

  return (
    <div className="h-6 text-center">
      <p className={`text-sm transition-opacity duration-300 ${text ? 'opacity-100' : 'opacity-0'} ${textColor}`}>
        {text}
      </p>
    </div>
  );
};
