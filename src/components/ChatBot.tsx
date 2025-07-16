import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe, Mic, MicOff, Volume2, VolumeX, RefreshCw, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EVA_COMPANY_DATA, SMART_RESPONSES, CONVERSATION_DATABASE, CONVERSATION_PATTERNS } from '@/data/evaData';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  language: 'ar' | 'en';
  tone?: 'formal' | 'informal';
  source?: 'eva' | 'groq';
}

interface ChatbotProps {
  apiKey?: string;
}

// Language and tone detection functions
const detectLanguage = (text: string): 'ar' | 'en' => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text) ? 'ar' : 'en';
};

const detectTone = (text: string, language: 'ar' | 'en'): 'formal' | 'informal' => {
  const lowerText = text.toLowerCase();
  const patterns = CONVERSATION_PATTERNS;
  
  const formalIndicators = patterns.formal[language];
  const informalIndicators = patterns.informal[language];
  
  const formalCount = formalIndicators.filter(word => lowerText.includes(word.toLowerCase())).length;
  const informalCount = informalIndicators.filter(word => lowerText.includes(word.toLowerCase())).length;
  
  return informalCount > formalCount ? 'informal' : 'formal';
};

// Enhanced Eva data search with comprehensive matching
const searchEvaData = (query: string, userLanguage: 'ar' | 'en'): string | null => {
  const lowerQuery = query.toLowerCase();
  const data = EVA_COMPANY_DATA;
  
  // First check conversation database for exact matches
  const matchingConversations = CONVERSATION_DATABASE.conversations.filter(conv => {
    const queryWords = lowerQuery.split(' ');
    const convWords = conv.userQuery.toLowerCase().split(' ');
    
    // Check for exact match or partial match
    return lowerQuery.includes(conv.userQuery.toLowerCase()) || 
           conv.userQuery.toLowerCase().includes(lowerQuery) ||
           queryWords.some(word => convWords.some(convWord => 
             word.length > 2 && convWord.includes(word)
           ));
  });

  if (matchingConversations.length > 0) {
    // Prefer same language matches
    const languageMatches = matchingConversations.filter(conv => conv.language === userLanguage);
    if (languageMatches.length > 0) {
      return languageMatches[0].botResponse;
    }
    return matchingConversations[0].botResponse;
  }
  
  // Company information - concise
  if (lowerQuery.includes('company') || lowerQuery.includes('شركة') || lowerQuery.includes('إيفا') || 
      lowerQuery.includes('eva') || lowerQuery.includes('about') || lowerQuery.includes('عن') ||
      lowerQuery.includes('تأسست') || lowerQuery.includes('founded')) {
    return userLanguage === 'ar' 
      ? `🏢 إيفا شركة تكنولوجيا رائدة تأسست 2020\n📍 المقر: القاهرة\n🏢 الفروع: الإسكندرية، الجيزة، العاصمة الإدارية\n👥 فريق: 500+ موظف\n📈 نمو: 200% سنوياً\n🏆 جوائز: أفضل شركة تكنولوجيا ناشئة 2023`
      : `🏢 Eva is a leading tech company founded in 2020\n📍 HQ: Cairo\n🏢 Branches: Alexandria, Giza, New Capital\n👥 Team: 500+ employees\n📈 Growth: 200% annually\n🏆 Awards: Best Tech Startup 2023`;
  }

  // Services - concise
  if (lowerQuery.includes('service') || lowerQuery.includes('خدمة') || lowerQuery.includes('خدمات') || 
      lowerQuery.includes('development') || lowerQuery.includes('تطوير') || lowerQuery.includes('solutions') ||
      lowerQuery.includes('حلول') || lowerQuery.includes('منتجات') || lowerQuery.includes('products')) {
    return userLanguage === 'ar'
      ? `🔧 خدماتنا الرئيسية:\n• تطوير المواقع والتطبيقات (من 30,000 ج.م)\n• الذكاء الاصطناعي والتحول الرقمي\n• الحلول السحابية (AWS, Azure, Google Cloud)\n• التجارة الإلكترونية والمتاجر الرقمية\n\n📊 500+ مشروع مكتمل | 98% معدل نجاح`
      : `🔧 Our main services:\n• Web & mobile development (from 30,000 EGP)\n• AI solutions & digital transformation\n• Cloud solutions (AWS, Azure, Google Cloud)\n• E-commerce & digital stores\n\n📊 500+ completed projects | 98% success rate`;
  }

  // Contact information - concise
  if (lowerQuery.includes('contact') || lowerQuery.includes('تواصل') || lowerQuery.includes('رقم') || 
      lowerQuery.includes('ايميل') || lowerQuery.includes('email') || lowerQuery.includes('phone') ||
      lowerQuery.includes('address') || lowerQuery.includes('عنوان') || lowerQuery.includes('location') ||
      lowerQuery.includes('موقع') || lowerQuery.includes('اتصال') || lowerQuery.includes('call')) {
    return userLanguage === 'ar'
      ? `📞 معلومات التواصل:\n🏥 إيفا فارما: ${data.contact.evaPharma.phone}\n💻 إيفا تك: ${data.contact.evaTech.phone}\n📧 إيميل فارما: ${data.contact.evaPharma.email}\n📧 إيميل تك: ${data.contact.evaTech.email}\n🕒 ساعات العمل: السبت-الخميس 8:30ص-5:30م`
      : `📞 Contact info:\n🏥 Eva Pharma: ${data.contact.evaPharma.phone}\n💻 Eva Tech: ${data.contact.evaTech.phone}\n📧 Pharma email: ${data.contact.evaPharma.email}\n📧 Tech email: ${data.contact.evaTech.email}\n🕒 Working hours: Sat-Thu 8:30AM-5:30PM`;
  }

  // Pricing - concise
  if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('سعر') || 
      lowerQuery.includes('تكلفة') || lowerQuery.includes('فلوس') || lowerQuery.includes('budget') ||
      lowerQuery.includes('quote') || lowerQuery.includes('عرض سعر') || lowerQuery.includes('ميزانية') ||
      lowerQuery.includes('كام')) {
    return userLanguage === 'ar'
      ? `💰 أسعارنا:\n📱 تطبيقات الموبايل: من 30,000 ج.م\n🌐 مواقع الويب: من 25,000 ج.م\n🤖 حلول الذكاء الاصطناعي: حسب المشروع\n📊 إدارة العملاء CRM: 500 ج.م/شهر/مستخدم\n💡 استشارة مجانية أولى!`
      : `💰 Our pricing:\n📱 Mobile apps: from 30,000 EGP\n🌐 Websites: from 25,000 EGP\n🤖 AI solutions: project-based\n📊 CRM system: 500 EGP/month/user\n💡 Free initial consultation!`;
  }

  // Team and careers - concise
  if (lowerQuery.includes('team') || lowerQuery.includes('فريق') || lowerQuery.includes('موظف') || 
      lowerQuery.includes('staff') || lowerQuery.includes('employees') || lowerQuery.includes('career') ||
      lowerQuery.includes('وظيفة') || lowerQuery.includes('وظائف') || lowerQuery.includes('job') ||
      lowerQuery.includes('work') || lowerQuery.includes('شغل') || lowerQuery.includes('hiring')) {
    return userLanguage === 'ar'
      ? `👥 فريق إيفا:\n👨‍💻 50+ مطور\n🎨 15+ مصمم\n📈 20+ متخصص تسويق\n\n💼 وظائف متاحة:\n• مطور Full Stack (القاهرة)\n• مهندس AI (عن بُعد)\n\nابعت CV: ${data.contact.evaTech.email}`
      : `👥 Eva team:\n👨‍💻 50+ developers\n🎨 15+ designers\n📈 20+ marketing specialists\n\n💼 Open positions:\n• Full Stack Developer (Cairo)\n• AI Engineer (Remote)\n\nSend CV: ${data.contact.evaTech.email}`;
  }

  // Training - concise
  if (lowerQuery.includes('training') || lowerQuery.includes('تدريب') || lowerQuery.includes('course') ||
      lowerQuery.includes('دورة') || lowerQuery.includes('دورات') || lowerQuery.includes('learning') ||
      lowerQuery.includes('تعلم') || lowerQuery.includes('education') || lowerQuery.includes('تعليم')) {
    return userLanguage === 'ar'
      ? `🎓 دوراتنا التدريبية:\n• تطوير الويب: 3 شهور - 5,000 ج.م\n• الذكاء الاصطناعي: 4 شهور - 8,000 ج.م\n🏆 شهادات معتمدة مع ضمان التوظيف\n📝 التسجيل: ${data.contact.evaTech.email}`
      : `🎓 Our training courses:\n• Web Development: 3 months - 5,000 EGP\n• AI Course: 4 months - 8,000 EGP\n🏆 Certified with job guarantee\n📝 Registration: ${data.contact.evaTech.email}`;
  }

  // Technologies - concise
  if (lowerQuery.includes('technology') || lowerQuery.includes('tech') || lowerQuery.includes('تكنولوجيا') || 
      lowerQuery.includes('تقنية') || lowerQuery.includes('برمجة') || lowerQuery.includes('programming') ||
      lowerQuery.includes('tools') || lowerQuery.includes('أدوات') || lowerQuery.includes('stack') ||
      lowerQuery.includes('framework') || lowerQuery.includes('library')) {
    return userLanguage === 'ar'
      ? `💻 تقنياتنا:\n🎨 Frontend: React, Vue.js, Next.js\n⚙️ Backend: Node.js, Python, Java\n📱 Mobile: React Native, Flutter\n🗄️ Database: MySQL, MongoDB\n☁️ Cloud: AWS, Azure, Google Cloud\n🧠 AI: TensorFlow, PyTorch`
      : `💻 Our technologies:\n🎨 Frontend: React, Vue.js, Next.js\n⚙️ Backend: Node.js, Python, Java\n📱 Mobile: React Native, Flutter\n🗄️ Database: MySQL, MongoDB\n☁️ Cloud: AWS, Azure, Google Cloud\n🧠 AI: TensorFlow, PyTorch`;
  }

  return null;
};

const EvaChatbot: React.FC<ChatbotProps> = ({ apiKey = 'demo-key' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [detectedTone, setDetectedTone] = useState<'formal' | 'informal'>('informal');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationMode, setConversationMode] = useState<'smart' | 'eva-only' | 'ai-only'>('smart');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      content: language === 'ar' 
        ? 'أهلاً وسهلاً! أنا مساعد إيفا الذكي 🤖 إزيك النهاردة؟ أقدر أساعدك في أي حاجة خاصة بشركة إيفا أو أي استفسارات تانية! اكتب بالعربي أو الإنجليزي زي ما تحب، وهاكتشف إذا كنت عايز تتكلم بشكل رسمي ولا ودود.'
        : 'Hello and welcome! I\'m Eva\'s smart assistant 🤖 How are you today? I can help you with anything about Eva Company or any other inquiries! Write in Arabic or English as you prefer, and I\'ll detect whether you want to communicate formally or friendly.',
      isUser: false,
      timestamp: new Date(),
      language,
      tone: 'informal',
      source: 'eva'
    };
    setMessages([welcomeMessage]);
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enhanced message handling with smart mode
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const detectedLang = detectLanguage(inputValue);
    const tone = detectTone(inputValue, detectedLang);
    setDetectedTone(tone);
    setLanguage(detectedLang);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      language: detectedLang,
      tone
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Always add delay for realistic chat experience
    setTimeout(async () => {
      try {
        let response: string;
        let source: 'eva' | 'groq' = 'eva';

        // Search Eva data first
        response = searchEvaData(currentQuery, detectedLang) || 
          (detectedLang === 'ar' 
            ? 'عذراً، لا أملك معلومات عن هذا الموضوع في قاعدة بيانات إيفا. جرب تسأل عن خدماتنا أو معلومات الشركة!'
            : 'Sorry, I don\'t have information about this topic in Eva\'s database. Try asking about our services or company information!');

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response,
          isUser: false,
          timestamp: new Date(),
          language: detectedLang,
          tone,
          source
        };

        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error in handleSendMessage:', error);
        const fallbackResponse = detectedLang === 'ar'
          ? 'عذراً، حدث خطأ مؤقت. من فضلك حاول مرة أخرى.'
          : 'Sorry, a temporary error occurred. Please try again.';
        
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: fallbackResponse,
          isUser: false,
          timestamp: new Date(),
          language: detectedLang,
          tone,
          source: 'eva'
        };

        setMessages(prev => [...prev, botMessage]);
      } finally {
        setIsLoading(false);
      }
    }, 1500); // 1.5 second delay
  };

  // Copy message to clipboard
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: language === 'ar' ? 'تم النسخ' : 'Copied',
      description: language === 'ar' ? 'تم نسخ الرسالة' : 'Message copied to clipboard'
    });
  };

  // Export conversation
  const exportConversation = () => {
    const conversation = messages.map(msg => 
      `${msg.isUser ? (language === 'ar' ? 'أنت' : 'You') : 'Eva'} (${msg.timestamp.toLocaleString()}): ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([conversation], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eva-conversation-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: language === 'ar' ? 'تم التصدير' : 'Exported',
      description: language === 'ar' ? 'تم تصدير المحادثة بنجاح' : 'Conversation exported successfully'
    });
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([]);
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: '1',
        content: language === 'ar' 
          ? 'تم مسح المحادثة! 🔄 كيف يمكنني مساعدتك اليوم؟'
          : 'Conversation cleared! 🔄 How can I help you today?',
        isUser: false,
        timestamp: new Date(),
        language,
        tone: detectedTone,
        source: 'eva'
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  // Speech recognition (placeholder)
  const toggleSpeechRecognition = () => {
    setIsListening(!isListening);
    toast({
      title: language === 'ar' ? 'التعرف على الصوت' : 'Speech Recognition',
      description: language === 'ar' ? 'سيتم تفعيل هذه الميزة قريباً' : 'This feature will be activated soon'
    });
  };

  // Text to speech (placeholder)
  const toggleTextToSpeech = () => {
    setIsSpeaking(!isSpeaking);
    toast({
      title: language === 'ar' ? 'التحويل إلى صوت' : 'Text to Speech',
      description: language === 'ar' ? 'سيتم تفعيل هذه الميزة قريباً' : 'This feature will be activated soon'
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg ring-2 ring-primary/30">
              <img src="/lovable-uploads/a78facb2-fb5f-41ef-a7f9-648f1171ad42.png" alt="Eva Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {language === 'ar' ? 'مساعد إيفا الذكي' : 'Eva Smart Assistant'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'مساعدك الشخصي في شركة إيفا' : 'Your personal assistant at Eva Company'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={detectedTone === 'formal' ? 'default' : 'secondary'} className="animate-pulse">
              {language === 'ar' 
                ? (detectedTone === 'formal' ? 'رسمي' : 'ودود') 
                : (detectedTone === 'formal' ? 'Formal' : 'Friendly')
              }
            </Badge>
            
            <Select value={conversationMode} onValueChange={(value: 'smart' | 'eva-only' | 'ai-only') => setConversationMode(value)}>
              <SelectTrigger className="w-32 h-8 text-xs bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smart">{language === 'ar' ? 'ذكي' : 'Smart'}</SelectItem>
                <SelectItem value="eva-only">{language === 'ar' ? 'إيفا فقط' : 'Eva Only'}</SelectItem>
                <SelectItem value="ai-only">{language === 'ar' ? 'ذكاء اصطناعي' : 'AI Only'}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              onClick={exportConversation}
              className="text-muted-foreground hover:text-primary transition-colors"
              title={language === 'ar' ? 'تصدير المحادثة' : 'Export Conversation'}
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title={language === 'ar' ? 'مسح المحادثة' : 'Clear Conversation'}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Globe className="w-4 h-4 mr-1" />
              {language === 'ar' ? 'EN' : 'عر'}
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-200px)] overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[80%] p-4 group hover:shadow-lg transition-all duration-200 ${
                message.isUser 
                  ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-primary/20' 
                  : 'bg-card border-border hover:border-primary/30'
              }`}>
                <div className="flex items-start gap-3">
                  {!message.isUser && (
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  {message.isUser && (
                    <div className="w-6 h-6 bg-primary-foreground/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="whitespace-pre-wrap leading-relaxed break-words">
                      {message.content}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-xs opacity-70">
                      <div className="flex items-center gap-2">
                        <span>
                          {message.timestamp.toLocaleTimeString(
                            message.language === 'ar' ? 'ar-EG' : 'en-US'
                          )}
                        </span>
                        {message.source && (
                          <Badge variant="outline" className="text-xs border-current">
                            {message.source === 'eva' ? 
                              (language === 'ar' ? 'بيانات إيفا' : 'Eva Data') : 
                              (language === 'ar' ? 'مساعد ذكي' : 'AI Assistant')
                            }
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyMessage(message.content)}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-black/10 transition-all"
                        title={language === 'ar' ? 'نسخ' : 'Copy'}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-card border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'جارٍ الكتابة...' : 'Typing...'}
                  </span>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSpeechRecognition}
              className={`text-muted-foreground hover:text-primary transition-colors ${isListening ? 'text-primary animate-pulse' : ''}`}
              title={language === 'ar' ? 'التعرف على الصوت' : 'Speech Recognition'}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
            
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder={
                  language === 'ar'
                    ? 'اكتب رسالتك هنا... مثال: "إيه خدماتكم؟" أو "How much does development cost?"'
                    : 'Type your message here... Example: "What are your services?" or "كام سعر التطوير؟"'
                }
                className="bg-background border-border text-foreground placeholder:text-muted-foreground pr-14 pl-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTextToSpeech}
              className={`text-muted-foreground hover:text-primary transition-colors ${isSpeaking ? 'text-primary animate-pulse' : ''}`}
              title={language === 'ar' ? 'التحويل إلى صوت' : 'Text to Speech'}
            >
              {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="text-center mt-3">
            <p className="text-xs text-muted-foreground">
              {language === 'ar'
                ? '🤖 مدعوم بالذكاء الاصطناعي من إيفا • يدعم العربية والإنجليزية • ذكي في اكتشاف نبرة المحادثة'
                : '🤖 Powered by Eva AI • Supports Arabic & English • Smart tone detection'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaChatbot;