import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, LogOut, User, Settings, MessageSquare, Mic, Paperclip, Smile, Menu, Sticker } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { User as UserType, ChatMessage } from '../types';
import clsx from 'clsx';
import EmojiPicker from 'emoji-picker-react';
import { useMediaRecorder } from '../hooks/useMediaRecorder';

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState<UserType | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isRecording, startRecording, stopRecording, audioBlob } = useMediaRecorder();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUserProfile = async () => {
    try {
      const { data } = await api.get<UserType>('/user');
      setUser(data);
    } catch (error) {
      toast.error('Failed to fetch user profile');
      navigate('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { 
      role: 'user', 
      content: input,
      type: 'text'
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setShowEmojiPicker(false);
    setShowStickers(false);

    try {
      const { data } = await api.post('/chat', { prompt: input });
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: data.response,
        type: 'text'
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/User_logout');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const { data } = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Add the file message to the chat
        const fileMessage: ChatMessage = {
          role: 'user',
          content: data.response, // Use the response from the API
          type: 'file',
          fileName: file.name
        };
        
        setMessages((prev) => [...prev, fileMessage]);

        // Add the assistant's response if any
        if (data.response) {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: data.response,
            type: 'text'
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        toast.error('Failed to upload file');
      }
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const handleStickerClick = async (sticker: string) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: sticker,
      type: 'sticker'
    };
    setMessages((prev) => [...prev, userMessage]);
    setShowStickers(false);
  };

  const handleVoiceMessage = async () => {
    try {
      const response = await startRecording();
      if (response) {
        // Add the transcribed voice message
        const voiceMessage: ChatMessage = {
          role: 'user',
          content: response.response, // This will be the transcribed text
          type: 'text'
        };
        setMessages((prev) => [...prev, voiceMessage]);

        // Add the assistant's response
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.response,
          type: 'text'
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      toast.error('Failed to send voice message');
    }
  };

  const stickers = [
    '😀', '😂', '🥰', '😎', '🤔', '😴', '🥳', '🤩',
    '🎮', '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎺',
    '🌈', '⭐', '🌙', '☀️', '🌸', '🌺', '🌴', '🌵',
    '🐶', '🐱', '🦊', '🦁', '🐼', '🐨', '🐯', '🦄'
  ];

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Toggle Sidebar Button */}
      <button
        onClick={toggleSidebar}
        className="absolute top-4 left-4 z-50 p-2 bg-indigo-100/50 rounded-full shadow-lg hover:bg-indigo-100 transition-all"
      >
        <Menu className="w-5 h-5 text-indigo-600" />
      </button>

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 w-72 bg-white/70 backdrop-blur-md border-r border-purple-100 p-6 transition-all duration-300 ease-in-out z-40',
          showSidebar ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center space-x-4 mb-8 mt-12">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.username}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{user?.username}</h3>
            <p className="text-sm text-gray-600">{user?.profession}</p>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 rounded-xl transition-colors">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            <span>Messages</span>
          </button>

          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-indigo-50 rounded-xl transition-colors">
            <Settings className="w-5 h-5 text-indigo-500" />
            <span>Settings</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className={clsx(
        "flex-1 flex flex-col transition-all duration-300",
        showSidebar ? 'ml-72' : 'ml-0'
      )}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={clsx(
                'max-w-[70%] p-4 rounded-2xl shadow-md',
                message.role === 'user'
                  ? 'ml-auto bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-br-none'
                  : 'bg-white/70 text-gray-800 rounded-bl-none'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-current" />
                </div>
                <span className="font-medium">
                  {message.role === 'user' ? user?.username : 'Assistant'}
                </span>
              </div>
              {message.type === 'sticker' ? (
                <div className="text-4xl">{message.content}</div>
              ) : message.type === 'file' ? (
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  <a href={message.content} target="_blank" rel="noopener noreferrer" className="underline">
                    {message.fileName}
                  </a>
                </div>
              ) : message.type === 'audio' ? (
                <audio controls src={message.content} className="w-full" />
              ) : (
                message.content
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white/70 backdrop-blur-sm border-t border-purple-100">
          {showEmojiPicker && (
            <div className="absolute bottom-24 right-24">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
          
          {showStickers && (
            <div className="absolute bottom-24 right-24 bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-lg grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
              {stickers.map((sticker, index) => (
                <button
                  key={index}
                  onClick={() => handleStickerClick(sticker)}
                  className="text-2xl hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                >
                  {sticker}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="flex space-x-4">
              <div className="flex-1 bg-white/50 border border-purple-100 rounded-xl flex items-center p-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
                />
                
                <div className="flex items-center space-x-2 px-2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Smile className="w-5 h-5 text-indigo-500" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setShowStickers(!showStickers)}
                    className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Sticker className="w-5 h-5 text-indigo-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-indigo-500" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={handleVoiceMessage}
                    onMouseUp={stopRecording}
                    className={clsx(
                      "p-2 rounded-lg transition-colors",
                      isRecording ? "bg-red-100/50 text-red-500" : "hover:bg-indigo-50 text-indigo-500"
                    )}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg"
            />
          </form>
        </div>
      </div>
    </div>
  );
}