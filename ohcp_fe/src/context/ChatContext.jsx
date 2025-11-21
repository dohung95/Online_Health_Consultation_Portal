import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedChatPartner, setSelectedChatPartner] = useState(null);

    const openChatWith = (partner) => {
        setSelectedChatPartner(partner);
        setIsChatOpen(true);
    };

    const closeChat = () => {
        setIsChatOpen(false);
    };

    const toggleChat = () => {
        setIsChatOpen(prev => !prev);
    };

    return (
        <ChatContext.Provider value={{
            isChatOpen,
            setIsChatOpen,
            selectedChatPartner,
            setSelectedChatPartner,
            openChatWith,
            closeChat,
            toggleChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};
