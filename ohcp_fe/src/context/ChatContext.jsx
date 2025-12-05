import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedChatPartner, setSelectedChatPartner] = useState(null);

    const openChatWith = (partner) => {
        if (partner && partner.uid) {
            // ✅ CRITICAL: Sanitize UID để đảm bảo không có dấu gạch ngang
            const sanitizedPartner = {
                ...partner,
                uid: partner.uid.replace(/-/g, '')
            };
            setSelectedChatPartner(sanitizedPartner);
        } else {
            setSelectedChatPartner(partner);
        }
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
            setSelectedChatPartner: openChatWith, // ✅ Wrap với sanitize logic
            openChatWith,
            closeChat,
            toggleChat
        }}>
            {children}
        </ChatContext.Provider>
    );
};
