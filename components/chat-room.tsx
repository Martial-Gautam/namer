"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions";

type Message = {
  id: number;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function ChatRoom({
  roomId,
  userId,
  initialMessages
}: {
  roomId: string;
  userId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const formRef = useRef<HTMLFormElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const next = payload.new as Message;
          setMessages((current) => {
            if (current.some((message) => message.id === next.id)) return current;
            return [...current, next];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await sendMessage(roomId, formData);
    formRef.current?.reset();
  }

  return (
    <section className="chat-panel">
      <div className="message-list">
        {messages.map((message) => {
          const isMe = message.sender_id === userId;
          return (
            <motion.article
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`message ${isMe ? "me" : ""}`}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              key={message.id}
              layout
            >
              <div className="message-meta">
                {isMe ? "You" : "Namesake"}
              </div>
              <p>{message.body}</p>
            </motion.article>
          );
        })}
      </div>
      <form className="message-form" onSubmit={handleSubmit} ref={formRef}>
        <input name="body" placeholder="Send a nameless message" autoComplete="off" />
        <motion.button className="send-button" type="submit" whileHover={{ y: -2 }} whileTap={{ scale: 0.92 }}>
          ↑
        </motion.button>
      </form>
    </section>
  );
}
