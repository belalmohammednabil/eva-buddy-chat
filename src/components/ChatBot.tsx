import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe, Zap, Database, Copy, Share2, ThumbsUp, ThumbsDown, Bookmark, Trash2, Download, Mic, MicOff, Settings, MoreHorizontal, Lightbulb, Brain, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  language: 'ar' | 'en';
  tone: 'formal' | 'friendly';
  source?: 'eva' | 'grok';
  rating?: 'like' | 'dislike';
  isBookmarked?: boolean;
}

type ChatMode = 'normal' | 'creative' | 'analytical';

interface LanguageToggleProps {
  currentLanguage: 'ar' | 'en';
  onLanguageChange: (lang: 'ar' | 'en') => void;
}

const LanguageToggle = ({ currentLanguage, onLanguageChange }: LanguageToggleProps) => (
  <div className="flex gap-2">
    <Button
      variant={currentLanguage === 'ar' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onLanguageChange('ar')}
      className="text-xs"
    >
      العربية
    </Button>
    <Button
      variant={currentLanguage === 'en' ? 'default' : 'outline'}
      size="sm"
      onClick={() => onLanguageChange('en')}
      className="text-xs"
    >
      English
    </Button>
  </div>
);

const detectTone = (text: string): 'formal' | 'friendly' => {
  const friendlyIndicators = ['يا', 'اهلا', 'ازيك', 'hello', 'hi', 'hey', 'thanks', 'شكرا'];
  const formalIndicators = ['حضرتك', 'سيادتكم', 'sir', 'madam', 'please', 'kindly', 'من فضلك'];
  
  const lowerText = text.toLowerCase();
  const friendlyCount = friendlyIndicators.filter(word => lowerText.includes(word)).length;
  const formalCount = formalIndicators.filter(word => lowerText.includes(word)).length;
  
  return friendlyCount > formalCount ? 'friendly' : 'formal';
};

const detectLanguage = (text: string): 'ar' | 'en' => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text) ? 'ar' : 'en';
};

const getResponse = async (message: string, language: 'ar' | 'en', tone: 'formal' | 'friendly'): Promise<{ content: string; source: 'eva' | 'grok' }> => {
  // Mock Eva Data responses
  const evaData = {
    ar: {
      friendly: {
        'شركة': 'إيفا شركة رائعة بتشتغل في مجال التكنولوجيا! 😊 نحن متخصصون في الحلول الذكية',
        'خدمات': 'عندنا خدمات كتيرة زي تطوير البرمجيات والاستشارات التقنية',
        'مساعدة': 'أكيد يا صديقي! أنا هنا عشان أساعدك في أي حاجة تخص إيفا 🤝'
      },
      formal: {
        'شركة': 'شركة إيفا متخصصة في تقديم الحلول التقنية المتقدمة لعملائها الكرام',
        'خدمات': 'تقدم الشركة مجموعة شاملة من الخدمات التقنية والاستشارية',
        'مساعدة': 'نحن في خدمتكم لتقديم المساعدة المطلوبة بخصوص خدمات الشركة'
      }
    },
    en: {
      friendly: {
        'company': 'Eva is an awesome tech company! 😊 We specialize in smart solutions',
        'services': 'We offer lots of services like software development and tech consulting',
        'help': 'Sure buddy! I\'m here to help you with anything Eva-related 🤝'
      },
      formal: {
        'company': 'Eva Company specializes in providing advanced technological solutions',
        'services': 'The company offers a comprehensive range of technical and consulting services',
        'help': 'We are at your service to provide the required assistance regarding our services'
      }
    }
  };

  // Check Eva data first
  const dataSet = evaData[language][tone];
  for (const [key, response] of Object.entries(dataSet)) {
    if (message.toLowerCase().includes(key)) {
      return { content: response, source: 'eva' };
    }
  }

  // Fallback to mock Grok response
  const grokResponses = {
    ar: {
      friendly: 'معلش، مش لاقي المعلومة دي في بيانات إيفا، بس حسب معرفتي العامة...',
      formal: 'نعتذر، لم نجد هذه المعلومة في قاعدة بيانات إيفا، ولكن وفقاً للمعرفة العامة...'
    },
    en: {
      friendly: 'Sorry, couldn\'t find that in Eva\'s data, but based on my general knowledge...',
      formal: 'We apologize, this information was not found in Eva\'s database, however based on general knowledge...'
    }
  };

  return { content: grokResponses[language][tone], source: 'grok' };
};

export const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'ar' | 'en'>('ar');
  const [isRecording, setIsRecording] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('normal');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [savedChats, setSavedChats] = useState<Message[][]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatModes = [
    { id: 'normal', name: { ar: 'عادي', en: 'Normal' }, icon: Bot },
    { id: 'creative', name: { ar: 'إبداعي', en: 'Creative' }, icon: Lightbulb },
    { id: 'analytical', name: { ar: 'تحليلي', en: 'Analytical' }, icon: BarChart3 }
  ];

  const quickSuggestions = {
    ar: [
      'ما هي خدمات شركة إيفا؟',
      'كيف يمكنني التواصل معكم؟',
      'أخبرني عن المشاريع الجديدة',
      'ما هي رؤية الشركة؟'
    ],
    en: [
      'What are Eva Company services?',
      'How can I contact you?',
      'Tell me about new projects',
      'What is the company vision?'
    ]
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault();
            clearChat();
            break;
          case 'e':
            e.preventDefault();
            exportChat();
            break;
          case '/':
            e.preventDefault();
            setShowSettings(!showSettings);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [showSettings]);

  // Message interaction functions
  const copyMessage = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast({
      title: currentLanguage === 'ar' ? 'تم النسخ' : 'Copied',
      description: currentLanguage === 'ar' ? 'تم نسخ الرسالة' : 'Message copied to clipboard',
    });
  };

  const shareMessage = async (content: string) => {
    if (navigator.share) {
      await navigator.share({
        title: 'Eva Assistant Message',
        text: content,
      });
    } else {
      copyMessage(content);
    }
  };

  const rateMessage = (messageId: string, rating: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ));
    toast({
      title: currentLanguage === 'ar' ? 'تم التقييم' : 'Rating saved',
      description: currentLanguage === 'ar' ? 'شكراً لتقييمك' : 'Thank you for your feedback',
    });
  };

  const bookmarkMessage = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isBookmarked: !msg.isBookmarked } : msg
    ));
  };

  const clearChat = () => {
    if (messages.length > 0) {
      setSavedChats(prev => [...prev, messages]);
    }
    setMessages([]);
    toast({
      title: currentLanguage === 'ar' ? 'تم مسح المحادثة' : 'Chat cleared',
      description: currentLanguage === 'ar' ? 'تم حفظ المحادثة تلقائياً' : 'Chat saved automatically',
    });
  };

  const exportChat = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      language: currentLanguage,
      mode: chatMode,
      messages: messages
    };
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eva-chat-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startVoiceRecording = () => {
    setIsRecording(!isRecording);
    toast({
      title: currentLanguage === 'ar' ? 'التسجيل الصوتي' : 'Voice Recording',
      description: currentLanguage === 'ar' ? 'قريباً جداً!' : 'Coming soon!',
    });
  };

  const handleQuickSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    setShowQuickActions(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const detectedLanguage = detectLanguage(inputValue);
    const detectedTone = detectTone(inputValue);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      language: detectedLanguage,
      tone: detectedTone
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(async () => {
      const response = await getResponse(inputValue, detectedLanguage, detectedTone);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.content,
        isUser: false,
        timestamp: new Date(),
        language: detectedLanguage,
        tone: detectedTone,
        source: response.source
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br from-background via-background to-eva-primary/10 ${currentLanguage === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="bg-card border-b border-border/50 p-4 shadow-eva">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-eva flex items-center justify-center shadow-glow">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-eva-primary">
                {currentLanguage === 'ar' ? 'مساعد إيفا الذكي' : 'Eva Smart Assistant'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentLanguage === 'ar' ? 'مساعدك الودود للمعلومات' : 'Your friendly info companion'}
              </p>
            </div>
          </div>
          <LanguageToggle currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-gradient-eva mx-auto mb-4 flex items-center justify-center shadow-glow animate-pulse-eva">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-eva-primary mb-2">
                {currentLanguage === 'ar' ? 'أهلاً بك في مساعد إيفا!' : 'Welcome to Eva Assistant!'}
              </h2>
              <p className="text-muted-foreground">
                {currentLanguage === 'ar' 
                  ? 'اسألني أي شيء عن شركة إيفا أو أي موضوع آخر' 
                  : 'Ask me anything about Eva Company or any other topic'}
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 animate-slide-up",
                message.isUser ? "justify-end" : "justify-start"
              )}
            >
              {!message.isUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-eva flex items-center justify-center shadow-message">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-md rounded-2xl px-4 py-3 shadow-message group relative",
                  message.isUser
                    ? "bg-eva-primary text-white"
                    : "bg-card border border-border/50"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {/* Message Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-2 right-2 flex gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="secondary" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48" align="end">
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => copyMessage(message.content)}
                        >
                          <Copy className="w-3 h-3 mr-2" />
                          {currentLanguage === 'ar' ? 'نسخ' : 'Copy'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => shareMessage(message.content)}
                        >
                          <Share2 className="w-3 h-3 mr-2" />
                          {currentLanguage === 'ar' ? 'مشاركة' : 'Share'}
                        </Button>
                        {!message.isUser && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start"
                              onClick={() => bookmarkMessage(message.id)}
                            >
                              <Bookmark className={cn("w-3 h-3 mr-2", message.isBookmarked && "fill-current")} />
                              {currentLanguage === 'ar' ? 'حفظ' : 'Bookmark'}
                            </Button>
                            <Separator />
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn("flex-1", message.rating === 'like' && "bg-green-100")}
                                onClick={() => rateMessage(message.id, 'like')}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn("flex-1", message.rating === 'dislike' && "bg-red-100")}
                                onClick={() => rateMessage(message.id, 'dislike')}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {!message.isUser && message.source && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {message.source === 'eva' ? (
                        <>
                          <Database className="w-3 h-3 mr-1" />
                          {currentLanguage === 'ar' ? 'بيانات إيفا' : 'Eva Data'}
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3 mr-1" />
                          {currentLanguage === 'ar' ? 'جروك' : 'Grok'}
                        </>
                      )}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      {message.tone === 'friendly' 
                        ? (currentLanguage === 'ar' ? 'ودود' : 'Friendly')
                        : (currentLanguage === 'ar' ? 'رسمي' : 'Formal')
                      }
                    </Badge>
                  </div>
                )}
              </div>
              
              {message.isUser && (
                <div className="w-8 h-8 rounded-full bg-eva-secondary flex items-center justify-center">
                  <User className="w-4 h-4 text-eva-primary" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 animate-slide-up">
              <div className="w-8 h-8 rounded-full bg-gradient-eva flex items-center justify-center shadow-message animate-pulse-eva">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-card border border-border/50 rounded-2xl px-4 py-3 shadow-message">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-eva-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-eva-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-eva-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border/50 p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Quick Suggestions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 animate-fade-in">
              {quickSuggestions[currentLanguage].map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}

          {/* Chat Controls */}
          <div className="flex items-center gap-3">
            <Select value={chatMode} onValueChange={(value: ChatMode) => setChatMode(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chatModes.map((mode) => (
                  <SelectItem key={mode.id} value={mode.id}>
                    <div className="flex items-center gap-2">
                      <mode.icon className="w-4 h-4" />
                      {mode.name[currentLanguage]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                disabled={messages.length === 0}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportChat}
                disabled={messages.length === 0}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Popover open={showSettings} onOpenChange={setShowSettings}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium">
                      {currentLanguage === 'ar' ? 'الإعدادات' : 'Settings'}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {currentLanguage === 'ar' ? 'التسجيل الصوتي' : 'Voice Recording'}
                        </span>
                        <Button
                          variant={voiceEnabled ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVoiceEnabled(!voiceEnabled)}
                        >
                          {voiceEnabled ? currentLanguage === 'ar' ? 'مفعل' : 'On' : currentLanguage === 'ar' ? 'معطل' : 'Off'}
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                      <p>{currentLanguage === 'ar' ? 'اختصارات لوحة المفاتيح:' : 'Keyboard shortcuts:'}</p>
                      <p>Ctrl+K: {currentLanguage === 'ar' ? 'مسح المحادثة' : 'Clear chat'}</p>
                      <p>Ctrl+E: {currentLanguage === 'ar' ? 'تصدير المحادثة' : 'Export chat'}</p>
                      <p>Ctrl+/: {currentLanguage === 'ar' ? 'الإعدادات' : 'Settings'}</p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Input Row */}
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentLanguage === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
              className="flex-1 text-base"
              disabled={isTyping}
            />
            {voiceEnabled && (
              <Button
                variant="outline"
                onClick={startVoiceRecording}
                disabled={isTyping}
                className={cn(
                  "transition-all duration-300",
                  isRecording && "bg-red-500 text-white animate-pulse"
                )}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="px-6 bg-gradient-eva hover:shadow-glow transition-all duration-300"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};