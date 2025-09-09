import React from 'react';
import { AIPersona, ChatMsg, Product, TabType } from '../../types';
import { PersonaSwitcher } from '../ui';
import { ChatContainer } from '../chat/ChatContainer';

interface AssistantPageProps {
  persona: string;
  aiPersonas: AIPersona[];
  messages: ChatMsg[];
  typing: boolean;
  showHistoryHint: boolean;
  tab: TabType;
  onPersonaSwitch: (personaId: string) => void;
  onSend: (text: string) => void;
  onAddToCart: (product: Product) => void;
  justAddedId: string | null;
}

export function AssistantPage({
  persona,
  aiPersonas,
  messages,
  typing,
  showHistoryHint,
  tab,
  onPersonaSwitch,
  onSend,
  onAddToCart,
  justAddedId
}: AssistantPageProps) {
  return (
    <section className="bg-white rounded-2xl border shadow-sm flex flex-col overflow-hidden h-[calc(100vh-100px)]">
      <div className="p-4 border-b">
        <div className="font-medium">AI Shopping Assistant</div>
        <div className="mt-1 text-xs text-gray-500">AI Persona</div>
        <div className="mt-2">
          <PersonaSwitcher 
            value={persona} 
            onChange={onPersonaSwitch}
            personas={aiPersonas}
          />
        </div>
      </div>
      <ChatContainer 
        messages={messages}
        typing={typing}
        showHistoryHint={showHistoryHint}
        tab={tab}
        onSend={onSend}
        onAddToCart={onAddToCart}
        justAddedId={justAddedId}
      />
    </section>
  );
}
