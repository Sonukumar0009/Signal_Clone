"use client";

import { useEffect, useRef } from 'react';
import { useMessageStore } from '@/store/messageStore';
import { useConversationStore } from '@/store/conversationStore';
import { MessageBubble } from './MessageBubble';
import api from '@/lib/api';

export function MessageList({ conversationId, searchQuery }: { conversationId: string, searchQuery?: string }) {
  const messagesByConversation = useMessageStore(state => state.messagesByConversation);
  const setMessages = useMessageStore(state => state.setMessages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  
  const conversation = useConversationStore(state => 
    state.conversations.find(c => c.id === conversationId)
  );
  const isGroup = conversation?.type === 'group';
  
  const messages = messagesByConversation[conversationId] || [];

  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await api.get(`/api/conversations/${conversationId}/messages`);
        setMessages(conversationId, res.data);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    }

    // Fetch immediately on load
    fetchMessages();

    // Then poll every 3 seconds
    const interval = setInterval(fetchMessages, 3000);

    // Stop polling when leaving the conversation
    return () => clearInterval(interval);
  }, [conversationId, setMessages]);

  // Track if user is scrolled to bottom
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;
    }
  };

  // Auto-scroll only if user was already at bottom
  useEffect(() => {
    if (scrollRef.current && isAtBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 bg-[#EFEAE2] dark:bg-[#0b141a] space-y-2 relative"
      style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-light_04fcacde539c58cca6745483d4858c52.png")', backgroundRepeat: 'repeat', opacity: 0.9 }}
    >
      <div className="flex justify-center mb-4">
        <span className="bg-white dark:bg-[#182229] px-3 py-1 rounded-lg text-xs text-gray-500 dark:text-[#8696A0] shadow-sm uppercase tracking-wider">
          Today
        </span>
      </div>

      {messages
        .filter(msg => !searchQuery || msg.content?.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((msg, index, filteredArr) => {
        const prevMsg = index > 0 ? filteredArr[index - 1] : null;
        const isConsecutive = prevMsg?.sender_id === msg.sender_id;
        
        return (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isConsecutive={isConsecutive}
            isGroup={isGroup}
          />
        );
      })}
    </div>
  );
}