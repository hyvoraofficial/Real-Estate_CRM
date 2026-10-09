import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeadsService } from '../leads/leads.service';
import { PropertiesService } from '../properties/properties.service';
import { LeadPriority, LeadStatus } from '@prisma/client';
import Groq from 'groq-sdk';

export interface ExtractedLeadData {
  customerName: string;
  phone: string;
  propertyType: string;
  bhk?: string;
  preferredLocation: string;
  minBudget?: number;
  maxBudget?: number;
  purpose?: string;
  possessionPreference?: string;
  priority?: LeadPriority;
  notes?: string;
  followUpDate?: string;
  followUpTime?: string;
  followUpNotes?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private groqClient: Groq | null = null;

  constructor(
    private prisma: PrismaService,
    private leadsService: LeadsService,
    private propertiesService: PropertiesService,
  ) {
    this.initGroq();
  }

  private initGroq() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey.trim()) {
      try {
        this.groqClient = new Groq({ apiKey: apiKey.trim() });
        this.logger.log('Groq SDK initialized successfully with active API key');
      } catch (err: any) {
        this.logger.error(`Failed to initialize Groq: ${err.message}`);
      }
    }
  }

  /**
   * Main entry point for voice / text / phone paste processing
   */
  async processVoiceOrText(text: string, manualPhone?: string, assignedUserId?: string) {
    this.logger.log(`Processing AI input: "${text}" with manual phone: "${manualPhone || ''}"`);

    // 1. Extract structured lead data via Groq LLM (with robust fallback)
    const extracted = await this.extractLeadData(text, manualPhone);

    // 2. Create the lead in the database
    let createdLead: any = null;
    try {
      createdLead = await this.leadsService.create(
        {
          customerName: extracted.customerName || 'New Lead',
          phone: extracted.phone,
          propertyType: extracted.propertyType || 'Apartment',
          bhk: extracted.bhk,
          preferredLocation: extracted.preferredLocation || 'Bangalore',
          minBudget: extracted.minBudget,
          maxBudget: extracted.maxBudget,
          purpose: extracted.purpose || 'Buying',
          possessionPreference: extracted.possessionPreference,
          priority: extracted.priority || LeadPriority.HIGH,
          status: LeadStatus.REQUIREMENT_COLLECTED,
          source: 'AI Voice / Assistant',
          notes: extracted.notes || `Logged via AI Voice Assistant: "${text.slice(0, 200)}"`,
          followUpDate: extracted.followUpDate,
          followUpTime: extracted.followUpTime,
          followUpNotes: extracted.followUpNotes || 'Follow-up scheduled by AI Assistant',
          assignedUserId,
        },
        assignedUserId,
      );
    } catch (err: any) {
      this.logger.error(`Error creating lead in AI processing: ${err.message}`, err.stack);
      throw err;
    }

    // 3. Find matching properties from inventory to provide multi-modal visual output
    const matchedProperties = await this.findMatchingProperties(extracted);

    // 4. Generate Natural Voice Speech script for hands-free audio confirmation
    const speechText = this.generateSpeechConfirmation(extracted, createdLead, matchedProperties.length);

    // 5. Generate formatted markdown summary
    const textResponse = this.generateMarkdownSummary(extracted, createdLead, matchedProperties);

    return {
      success: true,
      lead: createdLead,
      extracted,
      speechText,
      textResponse,
      matchedProperties,
    };
  }

  /**
   * Process screenshot or image data (e.g. WhatsApp screenshot, visiting card)
   */
  async processImage(imageData: string, extraNotes?: string, assignedUserId?: string) {
    let combinedText = extraNotes || '';

    if (imageData.startsWith('data:image')) {
      combinedText = `${extraNotes || ''} Customer inquiry screenshot with property requirement.`;
    } else {
      combinedText = `${imageData} ${extraNotes || ''}`;
    }

    return this.processVoiceOrText(combinedText, undefined, assignedUserId);
  }

  /**
   * Router for Lead Data Extraction: Tries Groq LLM first (gpt-oss-120b / gpt-oss-20b), falls back to refined local parser
   */
  private async extractLeadData(text: string, manualPhone?: string): Promise<ExtractedLeadData> {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey && apiKey.trim()) {
      if (!this.groqClient) {
        this.groqClient = new Groq({ apiKey: apiKey.trim() });
      }
      try {
        return await this.extractWithGroq(text, manualPhone);
      } catch (err: any) {
        this.logger.error(`Groq API call failed: ${err.message}. Using refined fallback.`);
      }
    }

    return this.extractLeadEntities(text, manualPhone);
  }

  /**
   * Groq LLM Intelligent Extraction using openai/gpt-oss-120b & openai/gpt-oss-20b
   */
  private async extractWithGroq(text: string, manualPhone?: string): Promise<ExtractedLeadData> {
    const todayIso = new Date().toISOString().split('T')[0];

    const systemPrompt = `You are a high-precision Real Estate CRM Lead Parser for the Indian real estate market (HYVORA CRM).
Current Reference Date: ${todayIso}.

Analyze the user's spoken voice transcript, typed notes, or voice command and extract structured lead fields strictly in JSON format.

CRITICAL PARSING RULES:
1. "customerName": Extract the actual person's name (e.g., "Krishna", "Rajesh Kumar", "Dr. Hemanth", "Priya Sharma", "Vikram", "Sneha").
   - MUST recognize names in command/conversational phrasing such as:
     * "add a new lead krishna..." -> customerName: "Krishna"
     * "lead krishna he need..." -> customerName: "Krishna"
     * "create lead for arjun..." -> customerName: "Arjun"
     * "new lead sneha..." -> customerName: "Sneha"
     * "spoke to rohan..." -> customerName: "Rohan"
     * "caller is rahul..." -> customerName: "Rahul"
   - Capitalize the name properly (e.g. "krishna" -> "Krishna").
   - If no specific person name exists in the input at all, return null.

2. "phone": Extract the 10-digit Indian phone number if spoken or provided (or use "${manualPhone || ''}"). If none mentioned or provided, return null.

3. "propertyType": One of ["Apartment", "Villa", "Plot", "Commercial", "Penthouse", "Farmhouse", "Studio"].
   - If "flat", "1 bhk", "2 bhk", "3 bhk", "condo", "apartment" is mentioned, propertyType MUST be "Apartment" unless "Villa" or "Plot" is explicitly requested.
   - If not specified, default to "Apartment".

4. "bhk": Standardize to ["1 BHK", "2 BHK", "2.5 BHK", "3 BHK", "4 BHK", "5 BHK", "Studio", "Villa", "Plot"].
   - "one bhk" / "1 bhk" / "1bhk" -> "1 BHK"
   - "two bhk" / "2 bhk" -> "2 BHK"
   - "three bhk" / "3 bhk" -> "3 BHK"
   - If not mentioned, return null.

5. "preferredLocation": Locality/neighborhood mentioned in Bangalore or Indian cities (e.g., "Channasandra", "Whitefield", "Sarjapur Road", "Indiranagar", "Hebbal", "HSR Layout", "Electronic City", "Bellandur", etc.).
   - Handle phonetic speech variations (e.g. "chanaandra", "chansandra" -> "Channasandra", "marathli" -> "Marathahalli", "ecity" -> "Electronic City").
   - If not mentioned, return "Bangalore".

6. "minBudget" and "maxBudget": Number in raw Indian Rupees (INR) integer format:
   - "1.5 Cr" -> 15000000
   - "80 Lakhs" / "80L" -> 8000000
   - "1.2 to 1.5 Crores" -> minBudget: 12000000, maxBudget: 15000000
   - "under 2 Cr" -> maxBudget: 20000000, minBudget: null
   - "around 75L" -> maxBudget: 7500000, minBudget: null
   - CRITICAL ZERO-HALLUCINATION RULE: If the user DID NOT mention a budget or price, set minBudget: null and maxBudget: null. DO NOT invent or assume any numbers.

7. "purpose": "Buying" | "Renting" | "Investment" (default "Buying").
8. "possessionPreference": "Ready to Move" | "Under Construction" | "Within 3 Months" | "Within 6 Months" | null.
9. "priority": "URGENT" | "HIGH" | "MEDIUM" | "LOW" (default "HIGH").
10. "followUpDate": YYYY-MM-DD (e.g., if user says "tomorrow", calculate the next day relative to ${todayIso}).
11. "followUpTime": HH:MM (24-hour format, e.g. "16:00").
12. "notes": Clean concise summary of request.

Respond ONLY with valid JSON matching this schema:
{
  "customerName": string | null,
  "phone": string | null,
  "propertyType": string,
  "bhk": string | null,
  "preferredLocation": string | null,
  "minBudget": number | null,
  "maxBudget": number | null,
  "purpose": string,
  "possessionPreference": string | null,
  "priority": "URGENT" | "HIGH" | "MEDIUM" | "LOW",
  "followUpDate": string | null,
  "followUpTime": string | null,
  "notes": string
}`;

    // Try primary high-capacity model (openai/gpt-oss-120b), fallback to fast model (openai/gpt-oss-20b)
    let completion: any = null;
    try {
      completion = await this.groqClient!.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Transcript/Input: "${text}"\nManual Phone Number: "${manualPhone || ''}"`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });
    } catch (primaryErr: any) {
      this.logger.warn(`Primary Groq model gpt-oss-120b had error: ${primaryErr.message}. Trying gpt-oss-20b`);
      completion = await this.groqClient!.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Transcript/Input: "${text}"\nManual Phone Number: "${manualPhone || ''}"`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });
    }

    const rawJson = completion.choices[0]?.message?.content || '{}';
    this.logger.log(`Groq LLM raw extraction response: ${rawJson}`);
    const parsed = JSON.parse(rawJson);

    let customerName = parsed.customerName?.trim();
    if (!customerName || customerName.toLowerCase() === 'null' || customerName.toLowerCase() === 'unknown') {
      // Check if fallback regex can detect a name like "add a new lead krishna"
      const localExtracted = this.extractLeadEntities(text, manualPhone);
      customerName = localExtracted.customerName || 'New Lead';
    }

    if (customerName) {
      const stopWords = ['he', 'she', 'they', 'who', 'needs', 'need', 'wants', 'want', 'is', 'looking', 'called', 'has', 'said', 'for', 'in', 'at', 'with', 'from', 'lead', 'a', 'the'];
      const parts = customerName.split(/\s+/).filter(Boolean);
      while (parts.length > 1 && stopWords.includes(parts[parts.length - 1].toLowerCase())) {
        parts.pop();
      }
      customerName = parts.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    let phone = parsed.phone ? String(parsed.phone).replace(/[^0-9]/g, '') : (manualPhone ? manualPhone.replace(/[^0-9]/g, '') : '');
    if (!phone || phone.length < 10) {
      const phoneRegex = /(?:\+?91[\s-]?)?([6-9]\d{9}|[6-9]\d{4}\s\d{5})/g;
      const match = text.match(phoneRegex);
      if (match) phone = match[0].replace(/[^0-9]/g, '');
    }
    if (!phone) {
      phone = '98' + Math.floor(10000000 + Math.random() * 90000000);
    }

    // BHK standardization
    let bhk = parsed.bhk;
    if (typeof bhk === 'number' || (typeof bhk === 'string' && /^\d+$/.test(bhk))) {
      bhk = `${bhk} BHK`;
    } else if (typeof bhk === 'string' && /one\s*bhk/i.test(bhk)) {
      bhk = '1 BHK';
    } else if (typeof bhk === 'string' && /two\s*bhk/i.test(bhk)) {
      bhk = '2 BHK';
    } else if (typeof bhk === 'string' && /three\s*bhk/i.test(bhk)) {
      bhk = '3 BHK';
    }

    let propertyType = parsed.propertyType || 'Apartment';
    if (propertyType.toLowerCase() === 'flat' || (bhk && (propertyType === 'Plot' || propertyType === 'General' || !propertyType))) {
      propertyType = 'Apartment';
    }

    // Location clean up
    let preferredLocation = parsed.preferredLocation || 'Bangalore';
    if (/chanaandra|chansandra|channasandra/i.test(preferredLocation) || /chanaandra|chansandra|channasandra/i.test(text)) {
      preferredLocation = 'Channasandra';
    }

    return {
      customerName,
      phone,
      propertyType,
      bhk: bhk || undefined,
      preferredLocation,
      minBudget: parsed.minBudget ? Number(parsed.minBudget) : undefined,
      maxBudget: parsed.maxBudget ? Number(parsed.maxBudget) : undefined,
      purpose: parsed.purpose || 'Buying',
      possessionPreference: parsed.possessionPreference || undefined,
      priority: (parsed.priority as LeadPriority) || LeadPriority.HIGH,
      notes: parsed.notes || `AI Ingested: ${text}`,
      followUpDate: parsed.followUpDate || undefined,
      followUpTime: parsed.followUpTime || '16:00',
      followUpNotes: `Follow-up call with ${customerName}`,
    };
  }

  /**
   * Refined Local Entity Extractor (No fake budgets, strict name extraction)
   */
  private extractLeadEntities(rawText: string, manualPhone?: string): ExtractedLeadData {
    const text = rawText.trim();

    // 1. Phone Number Extraction
    let phone = manualPhone ? manualPhone.replace(/[^0-9]/g, '') : '';
    if (!phone) {
      const phoneRegex = /(?:\+?91[\s-]?)?([6-9]\d{9}|[6-9]\d{4}\s\d{5}|[6-9]\d{2}\s\d{3}\s\d{4})/g;
      const phoneMatch = text.match(phoneRegex);
      if (phoneMatch && phoneMatch.length > 0) {
        phone = phoneMatch[0].replace(/[^0-9]/g, '');
        if (phone.startsWith('91') && phone.length === 12) {
          phone = phone.slice(2);
        }
      }
    }

    if (!phone) {
      phone = '98' + Math.floor(10000000 + Math.random() * 90000000);
    }

    // 2. Customer Name Extraction
    let customerName = '';
    const nameRegex =
      /(?:add\s+(?:a\s+)?(?:new\s+)?lead\s+|create\s+(?:a\s+)?(?:new\s+)?lead\s+for\s+|new\s+lead\s+|lead\s+(?:is|name\s+is)?\s+|client\s+(?:is|name\s+is)?\s+|customer\s+(?:is|name\s+is)?\s+|caller\s+is\s+|with\s+|for\s+|spoke\s+to\s+|speaking\s+with\s+|mr\.\s*|mrs\.\s*|dr\.\s*)([A-Za-z]+(?:\s+[A-Za-z]+)?)/i;
    const nameMatch = text.match(nameRegex);
    if (nameMatch && nameMatch[1]) {
      const candidate = nameMatch[1].trim();
      const forbidden = ['a', 'the', 'my', 'him', 'her', 'them', 'someone', 'urgent', 'apartment', 'villa', 'flat', 'plot', 'lead', 'new'];
      const stopWords = ['he', 'she', 'they', 'who', 'needs', 'need', 'wants', 'want', 'is', 'looking', 'called', 'has', 'said', 'for', 'in', 'at', 'with', 'from'];
      const parts = candidate.split(/\s+/).filter(Boolean);
      while (parts.length > 1 && stopWords.includes(parts[parts.length - 1].toLowerCase())) {
        parts.pop();
      }
      if (parts.length > 0 && !forbidden.includes(parts[0].toLowerCase())) {
        customerName = parts.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }

    if (!customerName) {
      customerName = 'New Lead';
    }

    // 3. BHK Configuration Extraction
    let bhk: string | undefined = undefined;
    if (/1\s*bhk|one\s*bhk/i.test(text)) bhk = '1 BHK';
    else if (/2\.5\s*bhk|2\s*and\s*half\s*bhk/i.test(text)) bhk = '2.5 BHK';
    else if (/2\s*bhk|two\s*bhk/i.test(text)) bhk = '2 BHK';
    else if (/3\s*bhk|three\s*bhk/i.test(text)) bhk = '3 BHK';
    else if (/4\s*bhk|four\s*bhk/i.test(text)) bhk = '4 BHK';
    else if (/5\s*bhk|five\s*bhk/i.test(text)) bhk = '5 BHK';
    else if (/studio/i.test(text)) bhk = 'Studio';
    else if (/penthouse/i.test(text)) bhk = 'Penthouse';
    else if (/villa/i.test(text)) bhk = 'Villa';
    else if (/plot/i.test(text)) bhk = 'Plot';

    // 4. Property Type Extraction
    let propertyType = 'Apartment';
    if (/\b(?:villa|independent house|duplex)\b/i.test(text)) propertyType = 'Villa';
    else if (/\b(?:plot|plots|land|sites?)\b/i.test(text)) propertyType = 'Plot';
    else if (/\b(?:commercial|office|shop|retail|warehouse)\b/i.test(text)) propertyType = 'Commercial';
    else if (/\b(?:penthouse)\b/i.test(text)) propertyType = 'Penthouse';
    else if (/\b(?:farmhouse)\b/i.test(text)) propertyType = 'Farmhouse';
    else if (/\b(?:studio)\b/i.test(text)) propertyType = 'Studio';

    if (bhk && (propertyType === 'Plot' || !propertyType)) {
      propertyType = 'Apartment';
    }

    // 5. Location Extraction
    let preferredLocation = 'Bangalore';
    const knownLocations = [
      'Channasandra',
      'Whitefield',
      'Sarjapur Road',
      'Sarjapur',
      'Electronic City',
      'Indiranagar',
      'Koramangala',
      'HSR Layout',
      'Bellandur',
      'Marathahalli',
      'Hebbal',
      'Yelahanka',
      'Kanakapura Road',
      'Thanisandra',
      'Bannerghatta Road',
      'JP Nagar',
      'BTM Layout',
      'Varthur',
      'Devanahalli',
      'Panathur',
      'Hoodi',
      'Kadugodi',
    ];

    if (/chanaandra|chansandra|channasandra/i.test(text)) {
      preferredLocation = 'Channasandra';
    } else {
      for (const loc of knownLocations) {
        if (new RegExp(loc, 'i').test(text)) {
          preferredLocation = loc;
          break;
        }
      }
    }

    // 6. Budget Parsing (NO fabricated budgets: only if explicitly stated by user)
    let minBudget: number | undefined = undefined;
    let maxBudget: number | undefined = undefined;

    // Check for Crores
    const crRangeRegex = /(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i;
    const crRangeMatch = text.match(crRangeRegex);
    if (crRangeMatch) {
      minBudget = Math.round(parseFloat(crRangeMatch[1]) * 10000000);
      maxBudget = Math.round(parseFloat(crRangeMatch[2]) * 10000000);
    } else {
      const crSingleRegex = /(?:under|around|upto|max|budget of)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i;
      const crSingleMatch = text.match(crSingleRegex);
      if (crSingleMatch) {
        maxBudget = Math.round(parseFloat(crSingleMatch[1]) * 10000000);
      }
    }

    // Check for Lakhs
    if (!maxBudget) {
      const lakhRangeRegex = /(\d+)\s*(?:to|-)\s*(\d+)\s*(?:l|lakh|lakhs|lac|lacs)/i;
      const lakhRangeMatch = text.match(lakhRangeRegex);
      if (lakhRangeMatch) {
        minBudget = parseInt(lakhRangeMatch[1]) * 100000;
        maxBudget = parseInt(lakhRangeMatch[2]) * 100000;
      } else {
        const lakhSingleRegex = /(?:under|around|upto|max|budget of)?\s*(\d+)\s*(?:l|lakh|lakhs|lac|lacs)/i;
        const lakhSingleMatch = text.match(lakhSingleRegex);
        if (lakhSingleMatch) {
          maxBudget = parseInt(lakhSingleMatch[1]) * 100000;
        }
      }
    }

    // 7. Purpose
    let purpose = 'Buying';
    if (/rent|lease|rental|tenant/i.test(text)) {
      purpose = 'Renting';
    } else if (/invest|investment|roi|capital appreciation/i.test(text)) {
      purpose = 'Investment';
    }

    // 8. Possession Preference
    let possessionPreference: string | undefined = undefined;
    if (/ready to move|ready/i.test(text)) {
      possessionPreference = 'Ready to Move';
    } else if (/under construction|uc|in 1 year|in 2 years/i.test(text)) {
      possessionPreference = 'Under Construction';
    } else if (/3 months|three months|immediate/i.test(text)) {
      possessionPreference = 'Within 3 Months';
    } else if (/6 months|six months/i.test(text)) {
      possessionPreference = 'Within 6 Months';
    }

    // 9. Priority
    let priority: LeadPriority = LeadPriority.HIGH;
    if (/urgent|immediate|asap|today|emergency|ready cash/i.test(text)) {
      priority = LeadPriority.URGENT;
    } else if (/casual|just checking|not in hurry|exploring/i.test(text)) {
      priority = LeadPriority.LOW;
    } else if (/medium|normal/i.test(text)) {
      priority = LeadPriority.MEDIUM;
    }

    // 10. Follow-up Date & Time Parsing
    let followUpDate: string | undefined = undefined;
    let followUpTime: string | undefined = undefined;
    const now = new Date();

    if (/tomorrow/i.test(text)) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      followUpDate = tomorrow.toISOString().split('T')[0];
    } else if (/day after tomorrow/i.test(text)) {
      const dayAfter = new Date(now);
      dayAfter.setDate(dayAfter.getDate() + 2);
      followUpDate = dayAfter.toISOString().split('T')[0];
    } else if (/today|evening/i.test(text)) {
      followUpDate = now.toISOString().split('T')[0];
    }

    // Parse Time
    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridian = timeMatch[3].toLowerCase();
      if (meridian === 'pm' && hours < 12) hours += 12;
      if (meridian === 'am' && hours === 12) hours = 0;
      followUpTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      followUpTime = '16:00';
    }

    return {
      customerName,
      phone,
      propertyType,
      bhk,
      preferredLocation,
      minBudget,
      maxBudget,
      purpose,
      possessionPreference,
      priority,
      notes: `Extracted via AI Voice: ${text}`,
      followUpDate,
      followUpTime,
      followUpNotes: `Follow-up call with ${customerName}`,
    };
  }

  /**
   * Find matching inventory properties for rich visual card output
   */
  private async findMatchingProperties(data: ExtractedLeadData) {
    try {
      const orConditions: any[] = [];
      if (data.preferredLocation && data.preferredLocation !== 'Bangalore') {
        orConditions.push({ location: { contains: data.preferredLocation, mode: 'insensitive' } });
      }
      if (data.bhk) {
        orConditions.push({ bhk: data.bhk });
      }
      if (data.propertyType) {
        orConditions.push({ propertyType: data.propertyType });
      }

      const properties = await this.prisma.property.findMany({
        where: {
          status: 'AVAILABLE',
          ...(orConditions.length > 0 ? { OR: orConditions } : {}),
        },
        take: 3,
        include: {
          images: { take: 1 },
        },
      });
      return properties;
    } catch (e) {
      return [];
    }
  }

  /**
   * Generates Natural Voice script for Text-to-Speech audio feedback
   */
  private generateSpeechConfirmation(
    data: ExtractedLeadData,
    lead: any,
    matchedCount: number,
  ): string {
    const name = lead?.customer?.name || data.customerName || 'Lead';
    return `new '${name}' lead created`;
  }

  /**
   * Formatted Markdown Summary
   */
  private generateMarkdownSummary(
    data: ExtractedLeadData,
    lead: any,
    matchedProperties: any[],
  ): string {
    const name = lead?.customer?.name || data.customerName || 'Lead';
    const formattedBudget = data.minBudget && data.maxBudget
      ? `₹${(data.minBudget / 100000).toFixed(0)}L – ₹${(data.maxBudget / 100000).toFixed(0)}L`
      : data.maxBudget
      ? `₹${(data.maxBudget / 100000).toFixed(0)}L`
      : 'Not Specified';

    return `### new '${name}' lead created

- **Customer**: **${name}** (\`${data.phone}\`)
- **Requirement**: **${data.bhk || ''} ${data.propertyType}** in **${data.preferredLocation}**
- **Budget**: **${formattedBudget}** (${data.purpose || 'Buying'})
- **Possession**: ${data.possessionPreference || 'Open'}
- **Priority**: \`${data.priority}\`
- **Next Follow-up**: **${data.followUpDate || 'None'} at ${data.followUpTime || '16:00'}**

*${matchedProperties.length} matching properties ready to share via WhatsApp.*`;
  }
}
