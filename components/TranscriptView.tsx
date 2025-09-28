
import React, { useEffect, useRef } from 'react';
import type { Transcript } from '../types';

interface TranscriptViewProps {
  transcripts: Transcript[];
  currentInput: string;
  currentOutput: string;
}

const BlinkingCursor: React.FC = () => <span className="inline-block w-2 h-5 bg-blue-400 ml-1 animate-pulse"></span>;

const Message: React.FC<{ transcript: Transcript }> = ({ transcript }) => {
    const isLiana = transcript.speaker === 'liana';
    const bubbleClasses = isLiana
        ? 'bg-blue-900/50 self-start'
        : 'bg-gray-800 self-end';
    const speakerLabel = isLiana ? 'Liana' : 'You';
    const labelClasses = isLiana ? 'text-blue-400' : 'text-gray-400';

    return (
        <div className={`w-full flex flex-col ${isLiana ? 'items-start' : 'items-end'} mb-4`}>
             <p className={`text-sm font-semibold mb-1 ${labelClasses}`}>{speakerLabel}</p>
            <div className={`max-w-[85%] md:max-w-xl p-3 rounded-lg ${bubbleClasses}`}>
                <p className="text-white whitespace-pre-wrap">{transcript.text}</p>
            </div>
        </div>
    );
};


export const TranscriptView: React.FC<TranscriptViewProps> = ({ transcripts, currentInput, currentOutput }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts, currentInput, currentOutput]);
    
    return (
        <div className="w-full flex-grow overflow-y-auto p-4 flex flex-col space-y-2 min-h-0">
            {transcripts.map((t, index) => (
                <Message key={index} transcript={t} />
            ))}
            {currentInput && (
                <div className="w-full flex flex-col items-end mb-4 opacity-70">
                    <p className="text-sm font-semibold mb-1 text-gray-400">You</p>
                    <div className="max-w-[85%] md:max-w-xl p-3 rounded-lg bg-gray-800 self-end">
                        <p className="text-white whitespace-pre-wrap">{currentInput}<BlinkingCursor/></p>
                    </div>
                </div>
            )}
            {currentOutput && (
                <div className="w-full flex flex-col items-start mb-4 opacity-70">
                    <p className="text-sm font-semibold mb-1 text-blue-400">Liana</p>
                    <div className="max-w-[85%] md:max-w-xl p-3 rounded-lg bg-blue-900/50 self-start">
                        <p className="text-white whitespace-pre-wrap">{currentOutput}<BlinkingCursor/></p>
                    </div>
                </div>
            )}
            <div ref={endOfMessagesRef} />
        </div>
    );
};
