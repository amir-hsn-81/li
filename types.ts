
export type Status = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export interface Transcript {
  speaker: 'user' | 'liana';
  text: string;
}
