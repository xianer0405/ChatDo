import React from 'react';
import { Message, Sender } from '../types';
import { SparklesIcon } from './Icon';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isBot = message.sender === Sender.BOT;

  return (
    <div className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`flex max-w-[85%] md:max-w-[75%] ${isBot ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
          isBot ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
        }`}>
          {isBot ? <SparklesIcon className="w-5 h-5" /> : <span className="font-bold text-xs">YOU</span>}
        </div>

        {/* Message Content */}
        <div
          className={`relative px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm ${
            isBot
              ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              : 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.text}</div>
          <div className={`text-[10px] mt-1.5 opacity-60 ${isBot ? 'text-slate-400' : 'text-indigo-100'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
