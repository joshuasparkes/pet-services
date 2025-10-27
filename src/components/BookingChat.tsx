"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComment,
  faPaperPlane,
  faTimes,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import type { Message, BookingRequest } from "@/types/booking";

interface BookingChatProps {
  booking: BookingRequest;
  currentUserId: string;
  currentUserName: string;
  isAdmin: boolean;
  onClose: () => void;
}

export default function BookingChat({
  booking,
  currentUserId,
  currentUserName,
  isAdmin,
  onClose,
}: BookingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen to messages for this booking
    const messagesQuery = query(
      collection(db, "messages"),
      where("bookingId", "==", booking.id),
      orderBy("timestamp", "asc"),
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          // Handle serverTimestamp which might be null on first write
          const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
          return {
            id: doc.id,
            ...data,
            timestamp,
          };
        })
        .filter((msg) => msg.timestamp) as Message[]; // Filter out messages without timestamps

      setMessages(messagesData);

      // Mark messages as read
      markMessagesAsRead(messagesData);
    });

    return () => unsubscribe();
  }, [booking.id, currentUserId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const markMessagesAsRead = async (messagesData: Message[]) => {
    // Find messages that haven't been read by current user
    const unreadMessages = messagesData.filter(
      (msg) => !msg.readBy.includes(currentUserId),
    );

    // Mark them as read
    for (const message of unreadMessages) {
      try {
        await updateDoc(doc(db, "messages", message.id), {
          readBy: arrayUnion(currentUserId),
        });
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await addDoc(collection(db, "messages"), {
        bookingId: booking.id,
        senderId: currentUserId,
        senderType: isAdmin ? "admin" : "customer",
        senderName: currentUserName,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        readBy: [currentUserId], // Sender has already "read" their own message
      });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Booking Chat
            </h3>
            <p className="text-sm text-gray-600">
              {booking.serviceType.replace("-", " ")} -{" "}
              {booking.date.toLocaleDateString("en-GB")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FontAwesomeIcon icon={faComment} className="text-3xl mb-2" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderId === currentUserId
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderId === currentUserId
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium">
                        {message.senderName}
                      </span>
                      <span
                        className={`text-xs ${
                          message.senderId === currentUserId
                            ? "text-blue-100"
                            : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <FontAwesomeIcon icon={faPaperPlane} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
