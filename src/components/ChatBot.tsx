import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Globe, Mic, MicOff, Volume2, VolumeX, RefreshCw, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { EVA_COMPANY_DATA, SKIN_ANALYSIS, evaProducts, SKIN_CONSULTATION, CONVERSATION_DATA } from '@/data/evaData';

// Local patterns and lightweight conversation DB for tone detection and quick replies
const CONVERSATION_PATTERNS = {
  formal: {
    ar: ['من فضلك', 'لو سمحت', 'رجاء', 'هل يمكن', 'أحتاج'],
    en: ['please', 'could you', 'would you', 'i need', 'kindly']
  },
  informal: {
    ar: ['عايز', 'عاوزه', 'عايزة', 'انا عايز', 'فين', 'كام', 'ايه'],
    en: ['i want', 'hey', 'hi', 'yo', 'what', 'price', 'how much']
  }
} as const;

const CONVERSATION_DATABASE = {
  conversations: [
    { userQuery: 'من انتم', botResponse: 'نحن إيفا – نقدم حلول تجميل وصحة مدعومة بالعلم.', language: 'ar' as const },
    { userQuery: 'what is eva', botResponse: 'Eva provides science-backed beauty and skincare solutions.', language: 'en' as const },
  ]
} as const;
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

// Helper: format product details for rich, practical reply
const formatProductDetails = (p: any, lang: 'ar' | 'en') => {
  const benefits = Array.isArray(p.keyBenefits) ? p.keyBenefits.slice(0, 3).join(lang === 'ar' ? ' • ' : ' • ') : '';
  const ingredients = Array.isArray(p.mainIngredients) ? p.mainIngredients.slice(0, 3).join(lang === 'ar' ? ' • ' : ' • ') : '';
  const safe = p.safeDuringPregnancy ? (lang === 'ar' ? 'آمن للحمل' : 'Safe in pregnancy') : (lang === 'ar' ? 'غير موصى به أثناء الحمل' : 'Not advised in pregnancy');
  const derm = p.dermatologistApproved ? (lang === 'ar' ? 'معتمد من أطباء الجلدية' : 'Dermatologist-approved') : '';
  const usedBy = lang === 'ar'
    ? `الأكثر استخدامًا: أصحاب ${p.targetType} (استنادًا إلى ${p.reviews} مراجعة)`
    : `Most used by: ${p.targetType} (based on ${p.reviews} reviews)`;
  const buy = `https://eva-cosmetics.com/p/${p.id}`;

  if (lang === 'ar') {
    return (
      `• ${p.name} (ID: ${p.id})\n` +
      `الفئة: ${p.category} – ${p.subcategory}\n` +
      `مناسب لـ: ${p.targetType}\n` +
      `المكونات الرئيسية: ${ingredients}\n` +
      `الفوائد الأساسية: ${benefits}\n` +
      `طريقة الاستخدام: ${p.usageRoutine}\n` +
      `الآثار الجانبية/تحذيرات: ${p.warnings || '—'}\n` +
      `${derm ? derm + ' • ' : ''}${safe}\n` +
      `${usedBy}\n` +
      `التقييم: ${p.rating}/5 • السعر: ${p.price} ج.م\n` +
      `موصى به من: ${(p.recommendedBy || []).join(', ') || '—'}\n` +
      `شراء مباشر: ${buy}`
    );
  }
  return (
    `• ${p.name} (ID: ${p.id})\n` +
    `Category: ${p.category} – ${p.subcategory}\n` +
    `Best for: ${p.targetType}\n` +
    `Key ingredients: ${ingredients}\n` +
    `Key benefits: ${benefits}\n` +
    `How to use: ${p.usageRoutine}\n` +
    `Side effects/Warnings: ${p.warnings || '—'}\n` +
    `${derm ? derm + ' • ' : ''}${safe}\n` +
    `${usedBy}\n` +
    `Rating: ${p.rating}/5 • Price: EGP ${p.price}\n` +
    `Recommended by: ${(p.recommendedBy || []).join(', ') || '—'}\n` +
    `Buy: ${buy}`
  );
};

// Enhanced Eva data search with comprehensive matching
const searchEvaData = (query: string, userLanguage: 'ar' | 'en'): string | null => {
  const lowerQuery = query.toLowerCase();
  const data = EVA_COMPANY_DATA;

  // 0) Greeting detection -> onboarding to skin consultation
  const GREETINGS = {
    ar: ['ازيك', 'إزيك', 'صباح الخير', 'مساء الخير', 'سلام', 'أهلا', 'مرحبا', 'هاي', 'ازيك يا شات', 'يا شات', 'اهلا يا شات'],
    en: ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon']
  } as const;
  const isGreeting = (userLanguage === 'ar'
    ? GREETINGS.ar.some(g => lowerQuery.includes(g))
    : GREETINGS.en.some(g => lowerQuery.includes(g))
  );
  if (isGreeting) {
    return userLanguage === 'ar'
      ? `${SKIN_CONSULTATION.greetings[0]}\nاسأليني مثلاً: \'بشرتي دهنية وفيها حبوب – أستخدم إيه؟\' أو سجلي صوتك من أيقونة الميكروفون.`
      : `${SKIN_CONSULTATION.greetings[0]}\nAsk me: 'My skin is oily with acne – what should I use?' or record audio via the mic icon.`;
  }

  // 1) Skin problem analysis -> detailed product recommendations
  try {
    const matchedProblems = Object.entries(SKIN_ANALYSIS.problemKeywords)
      .filter(([_, keywords]) => keywords.some(k => lowerQuery.includes(k.toLowerCase())))
      .map(([key]) => key);

    if (matchedProblems.length > 0) {
      const ids = Array.from(new Set(matchedProblems.flatMap(p => (SKIN_ANALYSIS.solutions as any)[p] || [])));
      const prods = evaProducts.filter(p => ids.includes(p.id)).slice(0, 3);

      const arMap: Record<string, string> = {
        acne: 'حبوب', oily: 'بشرة دهنية', dry: 'جفاف', sensitive: 'حساسية', aging: 'شيخوخة', darkSpots: 'تصبغات', pores: 'مسام واسعة', dullness: 'بهتان'
      };

      const problemsLabelAR = matchedProblems.map(p => arMap[p] || p).join('، ');
      const problemsLabelEN = matchedProblems.join(', ');

      const influencerWords = ['تريند','يوتيوبر','تيك','tiktok','trend','influencer'];
      const cautionAR = influencerWords.some(w => lowerQuery.includes(w))
        ? 'مهم: اختاري على أساس الدليل العلمي، مش التريند. التوصيات التالية آمنة ومدعومة طبيًا.'
        : SKIN_CONSULTATION.medicalAdvice[1];
      const cautionEN = influencerWords.some(w => lowerQuery.includes(w))
        ? 'Important: choose science-based products, not trends. These are safe, dermatologist-backed picks.'
        : SKIN_CONSULTATION.medicalAdvice[1];

      const details = prods.map(p => formatProductDetails(p, userLanguage)).join('\n\n');

      const footerAR = `\n\n${SKIN_CONSULTATION.medicalAdvice[2]}\nلو عايزة أشوف كل الاختيارات، قولي: \'عرض الكل\' أو اسألي عن منتج برقم الـID.`;
      const footerEN = `\n\n${SKIN_CONSULTATION.medicalAdvice[2]}\nSay 'show all' for more options or ask by product ID.`;

      return userLanguage === 'ar'
        ? `بناءً على وصفك (${problemsLabelAR})، دي أفضل ترشيحات مناسبة ليكي بالتفاصيل:\n\n${details}\n\n${cautionAR}${footerAR}`
        : `Based on your description (${problemsLabelEN}), here are the best detailed picks for you:\n\n${details}\n\n${cautionEN}${footerEN}`;
    }
  } catch {}
  
  // 2) Conversation DB quick matches
  const matchingConversations = CONVERSATION_DATABASE.conversations.filter(conv => {
    const queryWords = lowerQuery.split(' ');
    const convWords = conv.userQuery.toLowerCase().split(' ');
    return lowerQuery.includes(conv.userQuery.toLowerCase()) || 
           conv.userQuery.toLowerCase().includes(lowerQuery) ||
           queryWords.some(word => convWords.some(convWord => word.length > 2 && convWord.includes(word)));
  });

  if (matchingConversations.length > 0) {
    const languageMatches = matchingConversations.filter(conv => conv.language === userLanguage);
    if (languageMatches.length > 0) return languageMatches[0].botResponse;
    return matchingConversations[0].botResponse;
  }

  // 3) Company information - concise
  if (lowerQuery.includes('company') || lowerQuery.includes('شركة') || lowerQuery.includes('إيفا') || 
      lowerQuery.includes('eva') || lowerQuery.includes('about') || lowerQuery.includes('عن') ||
      lowerQuery.includes('تأسست') || lowerQuery.includes('founded')) {
    return userLanguage === 'ar' 
      ? `🏢 إيفا شركة رائدة في مستحضرات التجميل والعناية الصحية\n📍 القاهرة • فروع: الإسكندرية، الجيزة\n👥 فريق متخصص • جودة معتمدة`
      : `🏢 Eva is a leading beauty and healthcare brand\n📍 Cairo • Branches: Alexandria, Giza\n👥 Expert team • Certified quality`;
  }

  // 4) Services/Products overview - concise
  if (lowerQuery.includes('service') || lowerQuery.includes('خدمة') || lowerQuery.includes('خدمات') || 
      lowerQuery.includes('solutions') || lowerQuery.includes('حلول') || lowerQuery.includes('منتجات') || lowerQuery.includes('products')) {
    return userLanguage === 'ar'
      ? `🔧 المجالات:\n• عناية بالبشرة • عناية بالشعر • مكياج\n🤝 توصيات ذكية + شراء مباشر عبر المتجر`
      : `🔧 Areas:\n• Skincare • Haircare • Makeup\n🤝 Smart recommendations + one-click purchase`;
  }

  // 5) Contact information - concise
  if (lowerQuery.includes('contact') || lowerQuery.includes('تواصل') || lowerQuery.includes('رقم') || 
      lowerQuery.includes('ايميل') || lowerQuery.includes('email') || lowerQuery.includes('phone') ||
      lowerQuery.includes('address') || lowerQuery.includes('عنوان') || lowerQuery.includes('location') ||
      lowerQuery.includes('موقع') || lowerQuery.includes('اتصال') || lowerQuery.includes('call')) {
    return userLanguage === 'ar'
      ? `📞 تواصل:\n🏥 إيفا فارما: ${(data as any).contact?.evaPharma?.phone || '+20 2 1234 5678'}\n💄 إيفا كوزمتيكس: ${(data as any).contact?.evaCosmetics?.phone || '+20 2 8765 4321'}\n📧 فارما: ${(data as any).contact?.evaPharma?.email || 'contact@evapharma.com'}\n📧 كوزمتيكس: ${(data as any).contact?.evaCosmetics?.email || 'support@evacosmetics.com'}`
      : `📞 Contact:\n🏥 Eva Pharma: ${(data as any).contact?.evaPharma?.phone || '+20 2 1234 5678'}\n💄 Eva Cosmetics: ${(data as any).contact?.evaCosmetics?.phone || '+20 2 8765 4321'}\n📧 Pharma: ${(data as any).contact?.evaPharma?.email || 'contact@evapharma.com'}\n📧 Cosmetics: ${(data as any).contact?.evaCosmetics?.email || 'support@evacosmetics.com'}`;
  }

  // 6) Pricing - concise
  if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('سعر') || 
      lowerQuery.includes('تكلفة') || lowerQuery.includes('فلوس') || lowerQuery.includes('budget') ||
      lowerQuery.includes('quote') || lowerQuery.includes('عرض سعر') || lowerQuery.includes('ميزانية') ||
      lowerQuery.includes('كام')) {
    return userLanguage === 'ar'
      ? `💰 الأسعار تختلف حسب المنتج؛ منظف الوجه يبدأ من 150 ج.م، والمرطب من 220 ج.م، والواقي من الشمس من 250 ج.م.`
      : `💰 Prices vary by product; cleansers from 150 EGP, moisturizers from 220 EGP, sunscreen from 250 EGP.`;
  }

  // 7) Technologies/stack - concise (kept)
  if (lowerQuery.includes('technology') || lowerQuery.includes('tech') || lowerQuery.includes('تكنولوجيا') || 
      lowerQuery.includes('تقنية') || lowerQuery.includes('برمجة') || lowerQuery.includes('programming') ||
      lowerQuery.includes('tools') || lowerQuery.includes('أدوات') || lowerQuery.includes('stack') ||
      lowerQuery.includes('framework') || lowerQuery.includes('library')) {
    return userLanguage === 'ar'
      ? `💻 داخل منصة التوصية الذكية نستخدم مطابقة كلمات مفتاحية وتحليل نبرة الكلام لضمان توصيات دقيقة وسريعة.`
      : `💻 Our smart recommender uses keyword matching and tone analysis for accurate, fast suggestions.`;
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
const recognitionRef = useRef<any>(null);
const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
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

// Speech recognition (Web Speech API)
const toggleSpeechRecognition = () => {
  try {
    const SpeechRecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      toast({
        title: language === 'ar' ? 'غير مدعوم' : 'Not supported',
        description: language === 'ar' ? 'متصفحك لا يدعم التعرف على الصوت' : 'Your browser does not support speech recognition'
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop?.();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognitionCtor();
    recognitionRef.current = rec;
    rec.lang = language === 'ar' ? 'ar-EG' : 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e: any) => {
      const text = e.results?.[0]?.[0]?.transcript || '';
      setInputValue(text);
      setIsListening(false);
      toast({
        title: language === 'ar' ? 'تم الالتقاط' : 'Captured',
        description: language === 'ar' ? 'تم تحويل الصوت إلى نص، اضغط إرسال' : 'Speech converted to text, press send'
      });
    };
    rec.onerror = () => {
      setIsListening(false);
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'تعذر التعرف على الصوت' : 'Could not recognize speech' });
    };
    rec.onend = () => setIsListening(false);

    rec.start();
    setIsListening(true);
  } catch (e) {
    setIsListening(false);
  }
};

// Text to Speech
const toggleTextToSpeech = () => {
  try {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const lastBot = [...messages].reverse().find(m => !m.isUser);
    if (!lastBot) {
      toast({ title: language === 'ar' ? 'لا توجد رسالة' : 'No message', description: language === 'ar' ? 'لا توجد رسالة لقراءتها' : 'No bot message to read' });
      return;
    }
    const utter = new SpeechSynthesisUtterance(lastBot.content);
    utter.lang = language === 'ar' ? 'ar-EG' : 'en-US';
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsSpeaking(true);
  } catch (e) {
    setIsSpeaking(false);
  }
};

useEffect(() => {
  return () => {
    recognitionRef.current?.stop?.();
    window.speechSynthesis.cancel();
  };
}, []);
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