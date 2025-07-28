import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const exists = promisify(fs.exists);

interface ParsedCVData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  skills?: string[];
  experience?: string[];
  education?: string[];
  summary?: string;
}

class CVParserService {
  async parseCV(filePath: string, mimeType: string): Promise<ParsedCVData> {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      console.log(`Parsing CV: ${filePath}, type: ${mimeType}`);
      
      let text = '';
      
      if (mimeType === 'application/pdf') {
        text = await this.parsePDF(filePath);
      } else if (mimeType === 'application/msword' || 
                 mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await this.parseWord(filePath);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      const parsedData = this.extractDataFromText(text);
      console.log('CV parsing successful:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('CV parsing error:', error);
      // Return a basic structure instead of just error message
      return {
        summary: `CV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        name: 'CV Upload',
        skills: [],
        experience: [],
        education: []
      };
    }
  }

  private async parsePDF(filePath: string): Promise<string> {
    try {
      // For now, we'll use a simple text extraction approach
      // In production, you'd want to use a library like pdf-parse
      const buffer = await readFile(filePath);
      
      // Basic text extraction - PDFs often contain readable text
      const text = buffer.toString('utf-8');
      console.log(`PDF text extracted, length: ${text.length}`);
      
      // If the direct text extraction doesn't work well, provide a fallback
      if (text.length < 50) {
        return `PDF file uploaded: ${filePath.split('/').pop()}\nFile size: ${buffer.length} bytes\nThis is a PDF document that requires specialized parsing.`;
      }
      
      return text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseWord(filePath: string): Promise<string> {
    try {
      // For now, we'll use a simple text extraction approach
      // In production, you'd want to use a library like mammoth.js for DOCX or antiword for DOC
      const buffer = await readFile(filePath);
      
      console.log(`Word document read, size: ${buffer.length} bytes`);
      
      // Simple text extraction attempt
      const text = buffer.toString('utf-8');
      
      // Word documents in binary format won't extract well this way
      if (text.length < 50 || !text.includes(' ')) {
        return `Word document uploaded: ${filePath.split('/').pop()}\nFile size: ${buffer.length} bytes\nThis is a Word document that requires specialized parsing.`;
      }
      
      return text;
    } catch (error) {
      console.error('Word parsing error:', error);
      throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractDataFromText(text: string): ParsedCVData {
    const data: ParsedCVData = {};

    // Extract email
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      data.email = emailMatch[0];
    }

    // Extract phone number
    const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) {
      data.phone = phoneMatch[0].trim();
    }

    // Extract name (simple heuristic - first line that's not email/phone)
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    for (const line of lines) {
      if (!emailRegex.test(line) && !phoneRegex.test(line) && line.length < 50 && line.split(' ').length <= 4) {
        data.name = line;
        break;
      }
    }

    // Extract skills (look for common skill keywords)
    const skillKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css',
      'git', 'aws', 'docker', 'kubernetes', 'typescript', 'angular', 'vue',
      'mongodb', 'postgresql', 'mysql', 'redis', 'graphql', 'rest', 'api',
      'machine learning', 'data analysis', 'project management', 'agile',
      'scrum', 'leadership', 'communication', 'problem solving'
    ];

    data.skills = [];
    const lowerText = text.toLowerCase();
    for (const skill of skillKeywords) {
      if (lowerText.includes(skill.toLowerCase())) {
        data.skills.push(skill);
      }
    }

    // Extract experience (look for job titles and companies)
    const experienceKeywords = ['experience', 'work history', 'employment', 'career'];
    const experienceSection = this.extractSection(text, experienceKeywords);
    if (experienceSection) {
      data.experience = experienceSection.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10)
        .slice(0, 5); // Limit to 5 entries
    }

    // Extract education
    const educationKeywords = ['education', 'qualification', 'degree', 'university', 'college'];
    const educationSection = this.extractSection(text, educationKeywords);
    if (educationSection) {
      data.education = educationSection.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 5)
        .slice(0, 3); // Limit to 3 entries
    }

    // Create summary
    data.summary = `CV contains ${data.skills?.length || 0} identified skills, ${data.experience?.length || 0} work experiences, and ${data.education?.length || 0} education entries.`;

    return data;
  }

  private extractSection(text: string, keywords: string[]): string | undefined {
    const lines = text.split('\n');
    let sectionStart = -1;
    let sectionEnd = -1;

    // Find section start
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (keywords.some(keyword => line.includes(keyword))) {
        sectionStart = i;
        break;
      }
    }

    if (sectionStart === -1) return undefined;

    // Find section end (next major heading or end of document)
    const majorHeadings = ['skills', 'experience', 'education', 'contact', 'summary', 'objective'];
    for (let i = sectionStart + 1; i < lines.length; i++) {
      const line = lines[i].toLowerCase().trim();
      if (majorHeadings.some(heading => line === heading || line.startsWith(heading + ':'))) {
        sectionEnd = i;
        break;
      }
    }

    if (sectionEnd === -1) sectionEnd = lines.length;

    return lines.slice(sectionStart + 1, sectionEnd).join('\n');
  }

  private async parseTextFile(filePath: string): Promise<string> {
    try {
      const buffer = await readFile(filePath);
      const text = buffer.toString('utf-8');
      console.log(`Text file read, length: ${text.length}`);
      return text;
    } catch (error) {
      console.error('Text file parsing error:', error);
      throw new Error(`Failed to parse text file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const cvParserService = new CVParserService();
