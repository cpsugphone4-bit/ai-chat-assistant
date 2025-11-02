import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Settings, Moon, Sun, Search, Menu, User, Sparkles, Mic, Paperclip, Smile, ChevronDown, Zap } from 'lucide-react';

export default function AIChatApp() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(1);
  const [selectedModel, setSelectedModel] = useState('deepseek/deepseek-chat-v3.1:free');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chats, setChats] = useState({
    1: {
      id: 1,
      title: 'Chat Baru',
      date: new Date().toISOString(),
      messages: [
        { id: 1, type: 'bot', text: 'Halo! Saya asisten AI Anda. Ada yang bisa saya bantu hari ini?', timestamp: new Date().toISOString() }
      ]
    }
  });
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // API Keys
  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const currentMessages = chats[currentChatId]?.messages || [];

  // Daftar model AI yang tersedia
  const aiModels = [
    {
      id: 'deepseek/deepseek-chat-v3.1:free',
      name: 'DeepSeek Chat v3.1',
      provider: 'OpenRouter',
      type: 'free',
      description: 'Model reasoning yang cepat dan efisien',
      icon: '🧠'
    },
    {
      id: 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free',
      name: 'Dolphin Mistral 24B Venice',
      provider: 'OpenRouter',
      type: 'free',
      description: 'Model open-source dengan uncensored responses',
      icon: '🐬'
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'Google',
      type: 'premium',
      description: 'Model terbaru Google dengan multimodal capabilities',
      icon: '✨'
    }
  ];

  const currentModelInfo = aiModels.find(m => m.id === selectedModel);

  // Deteksi ukuran layar
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isTyping]);

  // Fungsi untuk membuat chat baru
  const createNewChat = () => {
    const newChatId = Date.now();
    const newChat = {
      id: newChatId,
      title: 'Chat Baru',
      date: new Date().toISOString(),
      model: selectedModel,
      messages: [
        { 
          id: 1, 
          type: 'bot', 
          text: `Halo! Saya ${aiModels.find(m => m.id === selectedModel)?.name}. ${aiModels.find(m => m.id === selectedModel)?.description}. Ada yang bisa saya bantu?`,
          timestamp: new Date().toISOString(),
          model: selectedModel
        }
      ]
    };
    setChats(prev => ({ ...prev, [newChatId]: newChat }));
    setCurrentChatId(newChatId);
  };

  // Update model untuk chat saat ini
  const changeModel = async (modelId) => {
    const oldModel = selectedModel;
    setSelectedModel(modelId);
    setShowModelSelector(false);
    
    // Tambah pesan notifikasi pergantian model
    const modelInfo = aiModels.find(m => m.id === modelId);
    const notification = {
      id: currentMessages.length + 1,
      type: 'system',
      text: `Model diubah dari ${aiModels.find(m => m.id === oldModel)?.name} ke ${modelInfo.name} (${modelInfo.provider})`,
      timestamp: new Date().toISOString()
    };

    setChats(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: [...prev[currentChatId].messages, notification],
        model: modelId
      }
    }));

    // Send automatic greeting from new model
    setIsTyping(true);
    try {
      const greeting = await generateAIResponse(
        `Perkenalkan dirimu sebagai ${modelInfo.name} yang baru saja diaktifkan. Jelaskan singkat keunggulanmu.`,
        []
      );
      
      setIsTyping(false);
      const greetingMessage = {
        id: currentMessages.length + 2,
        type: 'bot',
        text: greeting,
        timestamp: new Date().toISOString()
      };
      
      setChats(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: [...prev[currentChatId].messages, notification, greetingMessage]
        }
      }));
    } catch (error) {
      setIsTyping(false);
    }
  };

  // Fungsi untuk menghapus chat
  const deleteChat = (chatId) => {
    const newChats = { ...chats };
    delete newChats[chatId];
    setChats(newChats);
    
    const remainingIds = Object.keys(newChats);
    if (remainingIds.length > 0) {
      setCurrentChatId(Number(remainingIds[0]));
    } else {
      createNewChat();
    }
  };

  // Fungsi untuk generate respons AI berdasarkan model menggunakan API
  const generateAIResponse = async (userMessage, conversationHistory = []) => {
    try {
      const modelInfo = aiModels.find(m => m.id === selectedModel);
      
      if (modelInfo.provider === 'OpenRouter') {
        // OpenRouter API - gunakan ID model yang tepat
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'AI Chat Assistant'
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: 'system',
                content: `Kamu adalah ${modelInfo.name}. ${modelInfo.description}. Jawab dalam bahasa Indonesia dengan natural dan membantu.`
              },
              ...conversationHistory.slice(-6).filter(msg => msg.type !== 'system').map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.text
              })),
              {
                role: 'user',
                content: userMessage
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenRouter Error Response:', errorText);
          throw new Error(`OpenRouter API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from OpenRouter');
        }
        
        return data.choices[0].message.content;

      } else if (modelInfo.provider === 'Google') {
        // Gemini API - gunakan model yang benar
        const modelName = selectedModel === 'gemini-2.5-pro' ? 'gemini-2.0-flash-exp' : selectedModel;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Kamu adalah ${modelInfo.name}. ${modelInfo.description}. Jawab dalam bahasa Indonesia dengan natural dan membantu.\n\nPercakapan sebelumnya:\n${conversationHistory.slice(-6).filter(m => m.type !== 'system').map(m => `${m.type === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n')}\n\nUser: ${userMessage}\n\nAssistant:`
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gemini Error Response:', errorText);
          throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response format from Gemini');
        }
        
        return data.candidates[0].content.parts[0].text;
      }

    } catch (error) {
      console.error('API Error Details:', error);
      
      // Pesan error yang lebih deskriptif
      if (error.message.includes('Failed to fetch')) {
        return `⚠️ Tidak dapat terhubung ke API. Ini mungkin karena:\n\n1. CORS policy di browser (coba buka di environment yang berbeda)\n2. Koneksi internet terputus\n3. API server sedang down\n\n🔧 Solusi:\n- Gunakan backend/proxy server untuk API calls\n- Deploy aplikasi ke hosting yang support CORS\n- Gunakan browser extension untuk bypass CORS (hanya untuk testing)\n\nError: ${error.message}`;
      } else if (error.message.includes('401') || error.message.includes('403')) {
        return `🔑 API Key tidak valid atau expired. Silakan periksa:\n- OpenRouter API Key: ${OPENROUTER_API_KEY.substring(0, 20)}...\n- Gemini API Key: ${GEMINI_API_KEY.substring(0, 20)}...\n\nError: ${error.message}`;
      } else if (error.message.includes('404')) {
        return `❌ Model tidak ditemukan. Model "${selectedModel}" mungkin tidak tersedia di provider ini.\n\nError: ${error.message}`;
      } else if (error.message.includes('429')) {
        return `⏱️ Rate limit exceeded. Terlalu banyak request, coba lagi dalam beberapa saat.\n\nError: ${error.message}`;
      }
      
      return `❌ Terjadi kesalahan: ${error.message}\n\n💡 Tips:\n- Periksa console browser untuk detail error\n- Pastikan API keys valid\n- Coba model yang berbeda`;
    }
  };

  // Fungsi kirim pesan
  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    const userMessage = {
      id: currentMessages.length + 1,
      type: 'user',
      text: inputValue,
      timestamp: new Date().toISOString()
    };

    // Update chat dengan pesan user
    setChats(prev => ({
      ...prev,
      [currentChatId]: {
        ...prev[currentChatId],
        messages: [...prev[currentChatId].messages, userMessage],
        title: prev[currentChatId].messages.length === 1 ? inputValue.slice(0, 30) : prev[currentChatId].title
      }
    }));

    const messageToSend = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // Get conversation history
      const history = chats[currentChatId].messages;
      
      // Call API
      const aiResponse = await generateAIResponse(messageToSend, history);
      
      setIsTyping(false);
      
      const botResponse = {
        id: currentMessages.length + 2,
        type: 'bot',
        text: aiResponse,
        timestamp: new Date().toISOString()
      };
      
      setChats(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: [...prev[currentChatId].messages, userMessage, botResponse]
        }
      }));
    } catch (error) {
      setIsTyping(false);
      const errorMessage = {
        id: currentMessages.length + 2,
        type: 'bot',
        text: `Maaf, terjadi kesalahan: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      
      setChats(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: [...prev[currentChatId].messages, userMessage, errorMessage]
        }
      }));
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileMessage = {
        id: currentMessages.length + 1,
        type: 'user',
        text: `📎 File diunggah: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        timestamp: new Date().toISOString()
      };

      setChats(prev => ({
        ...prev,
        [currentChatId]: {
          ...prev[currentChatId],
          messages: [...prev[currentChatId].messages, fileMessage]
        }
      }));

      setIsTyping(true);
      
      try {
        // Simulate file processing with API
        const response = await generateAIResponse(
          `Saya baru saja mengunggah file bernama "${file.name}" dengan ukuran ${(file.size / 1024).toFixed(2)} KB. Bisakah kamu membantu menganalisis atau memberikan informasi tentang file ini?`,
          chats[currentChatId].messages
        );
        
        setIsTyping(false);
        const botResponse = {
          id: currentMessages.length + 2,
          type: 'bot',
          text: response,
          timestamp: new Date().toISOString()
        };
        
        setChats(prev => ({
          ...prev,
          [currentChatId]: {
            ...prev[currentChatId],
            messages: [...prev[currentChatId].messages, fileMessage, botResponse]
          }
        }));
      } catch (error) {
        setIsTyping(false);
        const errorMessage = {
          id: currentMessages.length + 2,
          type: 'bot',
          text: `Maaf, terjadi kesalahan saat memproses file: ${error.message}`,
          timestamp: new Date().toISOString()
        };
        
        setChats(prev => ({
          ...prev,
          [currentChatId]: {
            ...prev[currentChatId],
            messages: [...prev[currentChatId].messages, fileMessage, errorMessage]
          }
        }));
      }
    }
  };

  // Format tanggal
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID');
  };

  // Filter chat history berdasarkan pencarian
  const filteredChats = Object.values(chats).filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Emoji yang tersedia
  const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💡', '🚀', '👋', '🤔', '😍'];

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} overflow-hidden`}>
      {/* Overlay untuk mobile */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-80' : 'relative w-64'}
        transition-all duration-300 
        ${darkMode ? 'bg-gray-800' : 'bg-white'} 
        shadow-xl flex flex-col overflow-hidden
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={createNewChat}
            className={`w-full flex items-center justify-center gap-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white py-3 px-4 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg`}
          >
            <Plus size={20} />
            <span className="font-medium">Chat Baru</span>
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center gap-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-3 py-2 rounded-xl`}>
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent outline-none text-sm w-full text-gray-700 dark:text-gray-300"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredChats.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-4">
              Tidak ada chat ditemukan
            </div>
          ) : (
            filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setCurrentChatId(chat.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  currentChatId === chat.id 
                    ? (darkMode ? 'bg-blue-900/50' : 'bg-blue-100') 
                    : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                } group relative`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={16} className="text-blue-500" />
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'} truncate flex-1`}>
                    {chat.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Hapus chat ini?')) {
                        deleteChat(chat.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500 rounded text-white text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center justify-between ml-6">
                  <p className="text-xs text-gray-500">{formatDate(chat.date)}</p>
                  {chat.model && (
                    <span className="text-xs text-gray-500">
                      {aiModels.find(m => m.id === chat.model)?.icon || '🤖'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-all duration-200`}
          >
            <Settings size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Pengaturan</span>
          </button>
          
          {/* Settings Panel */}
          {showSettings && (
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} space-y-3`}>
              <div>
                <label className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2 block`}>
                  Model Default
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} border ${darkMode ? 'border-gray-600' : 'border-gray-300'} outline-none`}
                >
                  {aiModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.icon} {model.name} - {model.provider}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'} p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                💡 Tip: Anda bisa mengganti model kapan saja dari top bar
              </div>
            </div>
          )}
          
          <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-all duration-200`}>
            <User size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Profil</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md px-4 md:px-6 py-3 md:py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-all flex-shrink-0`}
            >
              <Menu size={isMobile ? 20 : 24} className={darkMode ? 'text-gray-300' : 'text-gray-700'} />
            </button>
            <h1 className={`text-base md:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2 truncate`}>
              <Sparkles className="text-blue-500 flex-shrink-0" size={isMobile ? 18 : 24} />
              <span className="hidden sm:inline">AI Assistant</span>
              <span className="sm:hidden">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}
              >
                <span className="text-xl">{currentModelInfo?.icon}</span>
                {!isMobile && (
                  <>
                    <div className="flex flex-col items-start">
                      <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {currentModelInfo?.name.split(' ')[0]}
                      </span>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {currentModelInfo?.provider}
                      </span>
                    </div>
                    <ChevronDown size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </>
                )}
              </button>

              {/* Dropdown Model */}
              {showModelSelector && (
                <div className={`absolute top-full right-0 mt-2 w-80 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden z-50`}>
                  <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                      <Zap size={18} className="text-blue-500" />
                      Pilih Model AI
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {aiModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => changeModel(model.id)}
                        className={`w-full p-4 text-left transition-all ${
                          selectedModel === model.id
                            ? (darkMode ? 'bg-blue-900/30' : 'bg-blue-50')
                            : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')
                        } border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} last:border-b-0`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{model.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {model.name}
                              </h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                model.type === 'free' 
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                  : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                              }`}>
                                {model.type === 'free' ? 'Free' : 'Premium'}
                              </span>
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                              {model.provider}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                              {model.description}
                            </p>
                          </div>
                          {selectedModel === model.id && (
                            <div className="flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-all`}
            >
              {darkMode ? <Sun size={isMobile ? 18 : 20} className="text-yellow-400" /> : <Moon size={isMobile ? 18 : 20} className="text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6">
          {currentMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 
                message.type === 'system' ? 'justify-center' : 
                'justify-start'
              } animate-[slideUp_0.3s_ease-out]`}
            >
              {message.type === 'system' ? (
                <div className={`px-4 py-2 rounded-full text-xs ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                  {message.text}
                </div>
              ) : (
                <>
                  {message.type === 'bot' && (
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center mr-2 md:mr-3 shadow-lg flex-shrink-0`}>
                      <Sparkles size={isMobile ? 16 : 20} className="text-white" />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[85%] md:max-w-2xl">
                    <div
                      className={`px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl shadow-md text-sm md:text-base ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : darkMode
                          ? 'bg-gray-800 text-gray-100 rounded-bl-md'
                          : 'bg-white text-gray-800 rounded-bl-md'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                    <span className={`text-xs mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'} ${darkMode ? 'text-gray-500' : 'text-gray-400'} px-2`}>
                      {new Date(message.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-[slideUp_0.3s_ease-out]">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} flex items-center justify-center mr-2 md:mr-3 shadow-lg flex-shrink-0`}>
                <Sparkles size={isMobile ? 16 : 20} className="text-white" />
              </div>
              <div className={`px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl rounded-bl-md shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex gap-1">
                  <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                  <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                  <div className={`w-2 h-2 ${darkMode ? 'bg-gray-400' : 'bg-gray-500'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-3 md:p-6`}>
          <div className={`max-w-4xl mx-auto ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-2xl md:rounded-3xl shadow-lg flex items-end gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 relative`}>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            
            {/* Tombol Attachment - Sembunyikan di mobile */}
            {!isMobile && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-all flex-shrink-0`}
                title="Upload file"
              >
                <Paperclip size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            )}

            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesanmu..."
              rows={1}
              className={`flex-1 bg-transparent outline-none resize-none ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'} text-sm md:text-base py-2 max-h-[120px]`}
              style={{ minHeight: '24px' }}
            />

            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {/* Emoji - Sembunyikan di mobile kecil */}
              {!isMobile && (
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-all relative`}
                  title="Pilih emoji"
                >
                  <Smile size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              )}
              
              {/* Mic - Tampilkan di mobile */}
              {isMobile && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-all`}
                  title="Upload"
                >
                  <Paperclip size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              )}
              
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${
                  inputValue.trim() 
                    ? (darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600') + ' transform hover:scale-105'
                    : 'bg-gray-400 cursor-not-allowed'
                } text-white transition-all duration-200 shadow-md hover:shadow-lg`}
                title="Kirim pesan"
              >
                <Send size={isMobile ? 16 : 20} />
              </button>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && !isMobile && (
              <div className={`absolute bottom-full right-0 mb-2 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-2xl shadow-xl p-3 grid grid-cols-6 gap-2 z-10`}>
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputValue(inputValue + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className={`text-2xl hover:scale-125 transition-transform p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Info text - Sembunyikan di mobile */}
          {!isMobile && (
            <div className="text-center mt-3">
              <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Tekan Enter untuk kirim, Shift + Enter untuk baris baru
              </span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
