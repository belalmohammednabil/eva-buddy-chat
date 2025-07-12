// Groq Service for AI responses
export class GroqService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(
    query: string, 
    language: 'ar' | 'en', 
    tone: 'formal' | 'informal',
    context?: any
  ): Promise<string> {
    // Mock implementation for now
    const delay = Math.random() * 1000 + 1500; // 1.5-2.5 seconds delay
    await new Promise(resolve => setTimeout(resolve, delay));
    
    if (language === 'ar') {
      return tone === 'formal' 
        ? `بناءً على استفسارك، يمكنني تقديم المساعدة المطلوبة في هذا الموضوع مع مراعاة سياق شركة إيفا.`
        : `حبيبي، فهمت سؤالك! 😊 خليني أساعدك بناءً على خبرة إيفا في المجال ده.`;
    } else {
      return tone === 'formal'
        ? `Based on your inquiry, I can provide the required assistance on this topic considering Eva Company's context.`
        : `Got your question, buddy! 😊 Let me help you based on Eva's expertise in this area.`;
    }
  }

  extractContext(query: string, data: any): string {
    // Extract relevant context from Eva data
    return JSON.stringify(data).substring(0, 1000);
  }
}

export const detectLanguage = (text: string): 'ar' | 'en' => {
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text) ? 'ar' : 'en';
};

export const detectTone = (text: string, language: 'ar' | 'en'): 'formal' | 'informal' => {
  const lowerText = text.toLowerCase();
  
  if (language === 'ar') {
    const informalWords = ['ازيك', 'ايه', 'عامل', 'يلا', 'حبيبي', 'صديقي', 'كويس', 'جامد'];
    const formalWords = ['حضرتك', 'سيادتكم', 'المحترم', 'أود', 'برجاء', 'من فضلك'];
    
    const informalCount = informalWords.filter(word => lowerText.includes(word)).length;
    const formalCount = formalWords.filter(word => lowerText.includes(word)).length;
    
    return informalCount > formalCount ? 'informal' : 'formal';
  } else {
    const informalWords = ['hey', 'hi', 'what\'s up', 'thanks', 'cool', 'awesome'];
    const formalWords = ['sir', 'madam', 'please', 'kindly', 'would you', 'may i'];
    
    const informalCount = informalWords.filter(word => lowerText.includes(word)).length;
    const formalCount = formalWords.filter(word => lowerText.includes(word)).length;
    
    return informalCount > formalCount ? 'informal' : 'formal';
  }
};