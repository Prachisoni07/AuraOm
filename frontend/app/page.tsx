'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './auth/AuthContext';
import { ChatMessage, AttachmentType } from './types';
import EmojiPicker from 'emoji-picker-react';
import { stickers } from './stickers';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentType[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      setNewMessage(prev => prev + transcript);
    }
  }, [transcript]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/history');
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: newMessage,
      attachments: attachments.length > 0 ? attachments : undefined,
      username: user?.username || 'User',
      profilePicture: user?.profile_picture || '/default-avatar.png'
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setAttachments([]);
    setIsTyping(true);
    resetTranscript();

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: newMessage }),
      });

      const reader = response.body?.getReader();
      let botResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          botResponse += chunk;
          
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            
            if (lastMessage?.role === 'assistant') {
              lastMessage.content = botResponse;
            } else {
              newMessages.push({
                role: 'assistant',
                content: botResponse,
                username: 'AI Assistant',
                profilePicture: '/ai-avatar.png'
              });
            }
            
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments(prev => [...prev, {
          type: 'file',
          url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addSticker = (sticker: { url: string; name: string }) => {
    setAttachments(prev => [...prev, { type: 'sticker', ...sticker }]);
    setShowStickerPicker(false);
  };
//   return (
//     <main className="flex min-h-screen flex-col bg-gradient-to-br">
//       <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col">
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text inline-block">
//             AI Chat Assistant
//           </h1>
//           <p className="text-gray-600 mt-2">Your intelligent conversation partner</p>
//         </div>
        
//         <div className="flex-1 glass-morphism rounded-xl p-6 mb-6 overflow-y-auto max-h-[calc(100vh-280px)] shadow-xl">
//           (
//             <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-4 animate-fade-in">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm text-red-700"></p>
//                 </div>
//               </div>
//             </div>
//           )
          
// //           <div className="space-y-6">
// //             {messages.map((message, index) => (
//               <div
//                 key={`${message.role}-${index}-${message.content.substring(0, 10)}`}
//                 className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
//               >
//                 <div
//                   className={`message-bubble max-w-[80%] rounded-2xl p-4 ${
//                     message.role === 'user'
//                       ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20'
//                       : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-purple-500/20'
//                   } shadow-lg`}
//                 >
//                   <p className="whitespace-pre-wrap break-words leading-relaxed">
//                     {message.content}
//                   </p>
//                   {message.attachments && (
//                     <div className="message-attachment">
//                       {message.attachments.map((attachment, i) => (
//                         attachment.type === 'sticker' ? (
//                           <img
//                             key={i}
//                             src={attachment.url}
//                             alt={attachment.name}
//                             className="w-16 h-16 object-contain"
//                           />
//                         ) : (
//                           <a
//                             key={i}
//                             href={attachment.url}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-sm"
//                           >
//                             📎 {attachment.name}
//                           </a>
//                         )
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//             {isLoading && (
//               <div className="flex justify-start">
//                 <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 rounded-2xl p-4 shadow-lg">
//                   <div className="typing-animation">
//                     Thinking
//                     <span className="typing-dot"></span>
//                     <span className="typing-dot"></span>
//                     <span className="typing-dot"></span>
//                   </div>
//                 </div>
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </div>
//         </div>

//         <form onSubmit={handleSubmit} className="relative">
//           {showEmojiPicker && (
//             <div className="emoji-picker-container">
//               <EmojiPicker
//                 onEmojiClick={(emojiData) => {
//                   setInput(prev => prev + emojiData.emoji);
//                   setShowEmojiPicker(false);
//                 }}
//               />
//             </div>
//           )}

//           {showStickerPicker && (
//             <div className="sticker-picker">
//               {stickers.map(sticker => (
//                 <div
//                   key={sticker.id}
//                   className="sticker-item"
//                   onClick={() => handleStickerSelect(sticker)}
//                 >
//                   <img
//                     src={sticker.url}
//                     alt={sticker.name}
//                     className="w-full h-auto"
//                   />
//                 </div>
//               ))}
//             </div>
//           )}

//           {attachments.length > 0 && (
//             <div className="attachment-preview mb-2">
//               {attachments.map((attachment, index) => (
//                 <div key={index} className="attachment-item">
//                   <span>{attachment.type === 'sticker' ? '🎯' : '📎'} {attachment.name}</span>
//                   <button
//                     type="button"
//                     onClick={() => removeAttachment(index)}
//                     className="remove-attachment"
//                   >
//                     ✕
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}

//           <div className="flex gap-4">
//             <div className="input-container flex-1">
//               <input
//                 type="text"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 placeholder="Type your message..."
//                 className="w-full p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
//                 disabled={isLoading}
//               />
//             </div>

//             <div className="flex gap-2">
//               <button
//                 type="button"
//                 onClick={() => setShowEmojiPicker(!showEmojiPicker)}
//                 className="p-4 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200"
//               >
//                 😊
//               </button>

//               <button
//                 type="button"
//                 onClick={() => setShowStickerPicker(!showStickerPicker)}
//                 className="p-4 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200"
//               >
//                 🎯
//               </button>

//               <button
//                 type="button"
//                 onClick={() => fileInputRef.current?.click()}
//                 className="p-4 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200"
//               >
//                 📎
//               </button>

//               {browserSupportsSpeechRecognition && (
//                 <button
//                   type="button"
//                   onClick={toggleVoice}
//                   className={`p-4 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200 ${
//                     listening ? 'text-red-500' : ''
//                   }`}
//                 >
//                   🎤
//                 </button>
//               )}

//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl disabled:hover:shadow-lg font-medium"
//               >
//                 {isLoading ? (
//                   <span className="flex items-center">
//                     <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Sending
//                   </span>
//                 ) : 'Send'}
//               </button>
//             </div>

//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleFileChange}
//               className="hidden"
//               multiple
//             />
//           </div>
//         </form>
//       </div>
//     </main>
//   );
// } 
return (
  <main className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-purple-50">
    <div className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col">
      <div className="flex-1 glass-morphism rounded-xl p-6 mb-6 overflow-y-auto max-h-[calc(100vh-280px)] shadow-xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text inline-block">
          AI Chat Assistant
        </h1>
        <p className="text-gray-600 mt-2">Your intelligent conversation partner</p>
      </div>

      
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-4 animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700"></p>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}
                >
                  <img
                    src={message.profilePicture || (message.role === 'user' ? '/default-avatar.png' : '/ai-avatar.png')}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      {message.username || (message.role === 'user' ? 'User' : 'AI Assistant')}
                    </div>
                    <div
                      className={`message-bubble rounded-2xl p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.attachments && (
                        <div className="message-attachment">
                          {message.attachments.map((attachment, i) => (
                            <div key={i}>
                              {attachment.type === 'sticker' ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="w-16 h-16"
                                />
                              ) : attachment.url ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="max-w-[200px] rounded-lg"
                                />
                              ) : (
                                <a href="#" className="text-blue-500 hover:underline">
                                  {attachment.name}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-2">
                <div className="bg-gray-200 rounded-full p-2">
                  <div className="typing-animation">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
            {attachments.length > 0 && (
              <div className="attachment-preview mb-2">
                {attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span>{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="remove-attachment ml-2"
                    ></button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              {showEmojiPicker && (
                <div className="emoji-picker-container">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setNewMessage(prev => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}

              {showStickerPicker && (
                <div className="sticker-picker">
                  {stickers.map(sticker => (
                    <div
                      key={sticker.id}
                      className="sticker-item"
                      onClick={() => addSticker(sticker)}
                    >
                      <img
                        src={sticker.url}
                        alt={sticker.name}
                        className="w-12 h-12"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <div className="input-container flex-1">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="w-full p-4"
                  />
                </div>

                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  😊
                </button>

                <button
                  onClick={() => setShowStickerPicker(!showStickerPicker)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  🌟
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  📎
                </button>

                {browserSupportsSpeechRecognition && (
                  <button
                    onClick={() => {
                      if (listening) {
                        SpeechRecognition.stopListening();
                      } else {
                        SpeechRecognition.startListening();
                      }
                    }}
                    className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${
                      listening ? 'text-red-500' : ''
                    }`}
                  >
                    🎤
                  </button>
                )}

                <button
                  onClick={handleSendMessage}
                  className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                >
                  Send
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
);}