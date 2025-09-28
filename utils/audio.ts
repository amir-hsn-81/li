
import { Blob } from '@google/genai';

/**
 * Encodes a Uint8Array into a Base64 string.
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Creates a Blob object for the Gemini API from raw audio data.
 * @param data The raw Float32Array audio data from the microphone.
 * @param encodeFn The function to use for base64 encoding.
 * @returns A Blob object with base64 encoded PCM data.
 */
export function createBlob(data: Float32Array, encodeFn: (bytes: Uint8Array) => string): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Convert float to 16-bit PCM
    int16[i] = data[i] * 32768;
  }
  return {
    data: encodeFn(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

/**
 * Decodes a Base64 string into a Uint8Array.
 */
function decode(base64: string): Uint8Array {
  const binaryString = base64; // atob is already called in App.tsx
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Manually decodes raw PCM audio data into an AudioBuffer for playback.
 * @param base64 The Base64 encoded audio string from the Gemini API.
 * @param ctx The AudioContext for creating the buffer.
 * @returns A Promise that resolves to an AudioBuffer.
 */
export async function decodeAudioData(
  base64: string,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const data = decode(base64);
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}
