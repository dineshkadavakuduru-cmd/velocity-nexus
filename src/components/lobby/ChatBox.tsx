"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLobbyStore } from "@/stores/lobbyStore";
import { COLORS } from "@/lib/constants";

type ChatMessage = {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
};

export const ChatBox = () => {
  const { players } = useLobbyStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(() => {
    if (inputValue.trim() === "") return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      playerId: "local",
      playerName: "You",
      message: inputValue.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [inputValue]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const playerColors = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.primaryLight, COLORS.secondaryLight];

  const getPlayerColor = (playerId: string) => {
    const idx = players.findIndex((p) => p.id === playerId);
    return playerColors[idx % playerColors.length] || COLORS.primary;
  };

  return (
    <div
      className="w-full max-w-md rounded-2xl overflow-hidden"
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div
        className="px-4 py-2 border-b"
        style={{ borderBottomColor: COLORS.border }}
      >
        <span className="text-xs font-display font-bold text-secondary">CHAT</span>
      </div>

      <div
        className="h-48 overflow-y-auto p-3 space-y-2"
        ref={messagesEndRef}
      >
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: `${getPlayerColor(msg.playerId)}20`,
                    color: getPlayerColor(msg.playerId),
                  }}
                >
                  {msg.playerName.substring(0, 1).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-xs font-medium"
                      style={{ color: getPlayerColor(msg.playerId) }}
                    >
                      {msg.playerName}
                    </span>
                    <span className="text-xs text-secondary">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{msg.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {messages.length === 0 && (
          <div className="text-center text-secondary text-sm py-8">
            No messages yet. Say hello!
          </div>
        )}
      </div>

      <div className="p-3 border-t" style={{ borderTopColor: COLORS.border }}>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 rounded-lg bg-input border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
            placeholder="Type a message..."
            maxLength={200}
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={inputValue.trim() === ""}
            className="px-4 py-2 rounded-lg font-display font-bold transition-all"
            style={{
              background: inputValue.trim()
                ? `linear-gradient(135deg, ${COLORS.primary}30, ${COLORS.secondary}30)`
                : "rgba(40, 40, 40, 0.5)",
              color: inputValue.trim() ? COLORS.textPrimary : COLORS.textSecondary,
              border: `1px solid ${COLORS.border}`,
            }}
            whileHover={inputValue.trim() ? { scale: 1.05 } : {}}
            whileTap={inputValue.trim() ? { scale: 0.95 } : {}}
          >
            SEND
          </motion.button>
        </div>
      </div>
    </div>
  );
};


