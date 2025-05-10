export interface Chat {
  id: string;
  name: string;
  avatar: string;
  mode: 'observe' | 'automate';
}

export interface Task {
  id: string;
  chatId: string;
  text: string;
  source: string;
  time: string;
  status: 'pending' | 'completed';
  extractedFrom: string;
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  sender: string;
  time: string;
  aiResponse?: {
    text: string;
    reasoning: string;
  };
} 