import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe, Zap, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  language: 'ar' | 'en';
  tone: 'formal' | 'friendly';
  source?: 'eva' | 'grok';
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
                  "max-w-md rounded-2xl px-4 py-3 shadow-message",
                  message.isUser
                    ? "bg-eva-primary text-white"
                    : "bg-card border border-border/50"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                
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
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentLanguage === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
              className="flex-1 text-base"
              disabled={isTyping}
            />
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