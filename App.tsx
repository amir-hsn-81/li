
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { MicButton } from './components/MicButton';
import { TranscriptView } from './components/TranscriptView';
import { StatusIndicator } from './components/StatusIndicator';
import type { Status, Transcript } from './types';
import { createBlob, decodeAudioData, encode } from './utils/audio';

// IMPORTANT: Do not hardcode the API key. It is read from environment variables.
const API_KEY = process.env.API_KEY;

const App: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentOutput, setCurrentOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const currentInputRef = useRef('');
  const currentOutputRef = useRef('');

  useEffect(() => {
    currentInputRef.current = currentInput;
    currentOutputRef.current = currentOutput;
  }, [currentInput, currentOutput]);

  const handleStopSession = useCallback(async () => {
    setStatus('idle');
    if (sessionPromiseRef.current) {
      try {
        const session = await sessionPromiseRef.current;
        session.close();
      } catch (e) {
        console.error('Error closing session:', e);
      }
      sessionPromiseRef.current = null;
    }
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      audioSourcesRef.current.forEach(source => source.stop());
      audioSourcesRef.current.clear();
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    nextStartTimeRef.current = 0;
    setCurrentInput('');
    setCurrentOutput('');
  }, []);

  const handleStartSession = useCallback(async () => {
    if (!API_KEY) {
      setError('API_KEY environment variable not set.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setError(null);
    setTranscripts([]);
    setCurrentInput('');
    setCurrentOutput('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            if (!inputAudioContextRef.current) return;
            mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData, encode);
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
            };
            
            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setCurrentOutput(prev => prev + text);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setCurrentInput(prev => prev + text);
            }
            if (message.serverContent?.turnComplete) {
              const fullInput = currentInputRef.current;
              const fullOutput = currentOutputRef.current;

              if (fullInput.trim()) {
                setTranscripts(prev => [...prev, { speaker: 'user', text: fullInput.trim() }]);
              }
              if (fullOutput.trim()) {
                setTranscripts(prev => [...prev, { speaker: 'liana', text: fullOutput.trim() }]);
              }
              
              setCurrentInput('');
              setCurrentOutput('');
            }
            
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            if (audioData && outputAudioContextRef.current) {
              setStatus('speaking');
              const outputAudioContext = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(
                atob(audioData),
                outputAudioContext
              );
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContext.destination);
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                  setStatus('listening');
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setError('An error occurred with the assistant. Please try again.');
            handleStopSession();
          },
          onclose: () => {
            handleStopSession();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are Liana, a friendly and helpful AI assistant. You are an expert in both English and Persian (Farsi). Respond to the user in the language they use. Keep your answers concise and conversational.',
        },
      });

    } catch (err) {
      console.error(err);
      setError('Failed to start session. Please check microphone permissions and try again.');
      setStatus('error');
    }
  }, [handleStopSession]);

  const toggleSession = () => {
    if (status === 'idle' || status === 'error') {
      handleStartSession();
    } else {
      handleStopSession();
    }
  };

  return (
    <div className="bg-black text-white w-full h-screen flex flex-col items-center justify-between p-4 overflow-hidden">
        <div className="w-full max-w-3xl flex flex-col items-center flex-grow min-h-0">
            <header className="text-center p-4">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                    Liana
                </h1>
            </header>
            
            <TranscriptView 
              transcripts={transcripts} 
              currentInput={currentInput}
              currentOutput={currentOutput}
            />

            <footer className="w-full flex flex-col items-center justify-center p-4 space-y-4">
                <StatusIndicator status={status} error={error} />
                <MicButton status={status} onClick={toggleSession} />
            </footer>
        </div>
    </div>
  );
};

export default App;
