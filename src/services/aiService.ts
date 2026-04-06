// Advanced AI Service with Context Awareness & Claude API
import { faqDatabase, getTutorials } from '@/data/faqDatabase';

export interface UserContext {
  currentPage: string;
  lastAction: string;
  projectName?: string;
  projectStage?: 'creation' | 'calculation' | 'review' | 'export';
  errorMessage?: string;
  hasMultipleProjects: boolean;
}

export interface AIResponse {
  text: string;
  type: 'answer' | 'suggestion' | 'error' | 'success';
  recommendations?: Array<{
    type: 'tutorial' | 'faq' | 'action';
    title: string;
    link?: string;
  }>;
  language: 'en' | 'id';
}

class AIService {
  private language: 'en' | 'id' = 'id';
  private claudeApiKey: string;
  private contextHistory: UserContext[] = [];

  constructor(language: 'en' | 'id' = 'id', claudeApiKey?: string) {
    this.language = language;
    const apiKey = typeof process !== 'undefined' && process.env?.VITE_CLAUDE_API_KEY 
      ? process.env.VITE_CLAUDE_API_KEY 
      : (import.meta.env?.VITE_CLAUDE_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY || '');
    this.claudeApiKey = claudeApiKey || apiKey;
  }

  // Set user context for smarter responses
  setUserContext(context: UserContext): void {
    this.contextHistory.push(context);
    // Keep only last 10 contexts
    if (this.contextHistory.length > 10) {
      this.contextHistory.shift();
    }
  }

  // Get current context
  getCurrentContext(): UserContext | null {
    return this.contextHistory[this.contextHistory.length - 1] || null;
  }

  // Main method to get AI response
  async getResponse(userInput: string): Promise<AIResponse> {
    const context = this.getCurrentContext();
    const matchedFAQ = this.searchFAQ(userInput);
    
    // If FAQ match found, use it with context awareness
    if (matchedFAQ) {
      return this.formatFAQResponse(matchedFAQ);
    }

    // Try Gemini first (free), then Claude, then fallback
    const geminiKey = import.meta.env?.VITE_GEMINI_API_KEY || '';
    if (geminiKey) {
      return await this.getGeminiResponse(userInput, context, geminiKey);
    }

    // If Claude API available, use it for advanced responses
    if (this.claudeApiKey) {
      return await this.getClaudeResponse(userInput, context);
    }

    // Fallback to rule-based responses
    return this.getFallbackResponse(userInput, context);
  }

  private searchFAQ(userInput: string): any {
    const input = userInput.toLowerCase();
    
    for (const faq of faqDatabase) {
      const keywords = faq.keywords[this.language] || faq.keywords.en;
      const keywordMatches = keywords.filter(keyword => 
        input.includes(keyword.toLowerCase())
      );
      
      // If any keyword matches, return this FAQ
      if (keywordMatches.length > 0) {
        return faq;
      }
    }
    
    return null;
  }

  private formatFAQResponse(faq: any): AIResponse {
    const answer = faq.answer[this.language] || faq.answer.en;
    return {
      text: answer,
      type: 'answer',
      recommendations: this.getRecommendations(faq.category),
      language: this.language
    };
  }

  private getRecommendations(category: string): any[] {
    const tutorials = getTutorials()[this.language];
    const recommendations: any[] = [];

    // Add related tutorials
    const relatedTutorials = tutorials.filter(t => {
      const titleLower = t.title.toLowerCase();
      const categoryLower = category.toLowerCase();
      return titleLower.includes(categoryLower) || categoryLower.includes(titleLower.split(' ')[0]);
    });

    relatedTutorials.forEach(tut => {
      recommendations.push({
        type: 'tutorial',
        title: tut.title,
        link: tut.videoUrl
      });
    });

    return recommendations;
  }

  private async getGeminiResponse(userInput: string, context: UserContext | null, apiKey: string): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser: ${userInput}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
          })
        }
      );

      if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!aiText) throw new Error('Empty response from Gemini');

      return {
        text: aiText,
        type: 'answer',
        recommendations: this.getRecommendations('General'),
        language: this.language
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      return this.getFallbackResponse(userInput, context);
    }
  }

  private async getClaudeResponse(userInput: string, context: UserContext | null): Promise<AIResponse> {
    try {
      // Build context-aware prompt
      let systemPrompt = this.buildSystemPrompt(context);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userInput
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiText = data.content[0].text;

      return {
        text: aiText,
        type: 'answer',
        recommendations: this.getRecommendations('General'),
        language: this.language
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      // Fallback to rule-based
      return this.getFallbackResponse(userInput, context);
    }
  }

  private buildSystemPrompt(context: UserContext | null): string {
    const language = this.language === 'id' ? 'Indonesian' : 'English';
    let prompt = `You are SIVILIZE-HUB PRO AI Assistant. You help users with construction cost calculations (RAB), materials, and project management.
Language: ${language}
Be helpful, professional, and provide step-by-step guidance when needed.`;

    if (context) {
      prompt += `\n\nCurrent User Context:
- Page: ${context.currentPage}
- Last Action: ${context.lastAction}
- Project: ${context.projectName || 'No active project'}
- Stage: ${context.projectStage || 'N/A'}
${context.errorMessage ? `- Last Error: ${context.errorMessage}` : ''}
- Multiple Projects: ${context.hasMultipleProjects ? 'Yes' : 'No'}`;
    }

    return prompt;
  }

  private getFallbackResponse(userInput: string, context: UserContext | null): AIResponse {
    const input = userInput.toLowerCase().trim();
    
    // Context-aware responses
    if (context?.projectStage === 'creation') {
      if (input.includes('help') || input.includes('bagaimana') || input.includes('cara')) {
        return this.createResponse(
          this.language === 'id' 
            ? 'Untuk membuat proyek: 1) Isi nama proyek 2) Pilih lokasi 3) Tentukan luas bangunan 4) Pilih provinsi 5) Klik Lanjut'
            : 'To create a project: 1) Enter project name 2) Select location 3) Set building area 4) Choose province 5) Click Continue',
          'suggestion'
        );
      }
    }

    if (context?.projectStage === 'calculation') {
      if (input.includes('error') || input.includes('salah')) {
        return this.createResponse(
          this.language === 'id'
            ? 'Kesalahan mungkin karena: 1) Angka negatif 2) Field kosong 3) Provinsi tidak dipilih. Cek kembali dan coba lagi.'
            : 'Error might be due to: 1) Negative numbers 2) Missing fields 3) Province not selected. Check again and retry.',
          'error'
        );
      }
    }

    if (context?.projectStage === 'export') {
      if (input.includes('export') || input.includes('unduh')) {
        return this.createResponse(
          this.language === 'id'
            ? 'Untuk export RAB: Klik tombol "Unduh ke Excel" atau "Unduh ke PDF" di hasil perhitungan. File akan langsung terunduh.'
            : 'To export RAB: Click "Export to Excel" or "Export to PDF" button in the results. File will download immediately.',
          'suggestion'
        );
      }
    }

    // General fallback
    return this.createResponse(
      this.language === 'id'
        ? 'Saya bisa membantu dengan: RAB, AHSP, Export, Tipe Rumah, dan Error. Tanya spesifik ya! Atau ketik "bantuan" untuk panduan lengkap.'
        : 'I can help with: RAB, AHSP, Export, House Types, and Errors. Ask specifically! Or type "help" for complete guide.',
      'answer'
    );
  }

  private createResponse(text: string, type: AIResponse['type']): AIResponse {
    return {
      text,
      type,
      language: this.language
    };
  }

  setLanguage(lang: 'en' | 'id'): void {
    this.language = lang;
  }

  getLanguage(): 'en' | 'id' {
    return this.language;
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(language: 'en' | 'id' = 'id'): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService(language);
  }
  return aiServiceInstance;
}

export function createAIService(language: 'en' | 'id' = 'id'): AIService {
  aiServiceInstance = new AIService(language);
  return aiServiceInstance;
}

export default AIService;
