const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
require('dotenv').config();

// AWS Bedrock imports
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Email functionality
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || 'echolearn.us';
const BASE_URL = process.env.BASE_URL || `https://${DOMAIN}`;

// Initialize AWS Bedrock client
const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    } : undefined // Use default credential chain if no keys provided
});

const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';

// Email configuration
let emailTransporter = null;

function initializeEmailTransporter() {
    try {
        if (process.env.EMAIL_SERVICE === 'gmail') {
            emailTransporter = nodemailer.createTransporter({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        } else if (process.env.EMAIL_HOST) {
            emailTransporter = nodemailer.createTransporter({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }
        
        if (emailTransporter) {
            console.log('📧 Email transporter initialized successfully');
        } else {
            console.log('📧 Email not configured - feedback will be logged only');
        }
    } catch (error) {
        console.error('Email configuration error:', error);
        emailTransporter = null;
    }
}

// Initialize email on startup
initializeEmailTransporter();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// Middleware
app.use(express.static('.'));
app.use(express.static('public'));
app.use(express.json());

// Extract text endpoint for PDF text-to-speech in notes (both /extract-text and /api/extract-text)
app.post('/extract-text', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        console.log(`Extracting text from PDF: ${req.file.originalname} (${req.file.size} bytes)`);

        // Parse PDF to extract text
        const pdfData = await pdfParse(req.file.buffer);
        const text = pdfData.text;

        if (!text || text.trim().length < 10) {
            return res.status(400).json({ 
                error: 'PDF content is too short or could not be extracted' 
            });
        }

        res.json({
            success: true,
            text: text.trim(),
            pageCount: pdfData.numpages,
            textLength: text.length,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        res.status(500).json({ 
            error: 'Failed to extract text from PDF',
            details: error.message 
        });
    }
});

app.post('/api/extract-text', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        console.log(`Extracting text from PDF: ${req.file.originalname} (${req.file.size} bytes)`);

        // Parse PDF to extract text
        const pdfData = await pdfParse(req.file.buffer);
        const text = pdfData.text;

        if (!text || text.trim().length < 10) {
            return res.status(400).json({ 
                error: 'PDF content is too short or could not be extracted' 
            });
        }

        res.json({
            success: true,
            text: text.trim(),
            pageCount: pdfData.numpages,
            textLength: text.length,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        res.status(500).json({ 
            error: 'Failed to extract text from PDF',
            details: error.message 
        });
    }
});

// Upload endpoint for PDF flashcard generation (both /upload and /api/upload)
app.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        console.log(`Processing PDF: ${req.file.originalname} (${req.file.size} bytes)`);

        // Parse PDF
        const pdfData = await pdfParse(req.file.buffer);
        const text = pdfData.text;

        if (!text || text.trim().length < 50) {
            return res.status(400).json({ 
                error: 'PDF content is too short or could not be extracted' 
            });
        }

        // Generate flashcards using AWS Bedrock AI
        const flashcards = await generateFlashcardsWithBedrock(text, req.file.originalname);

        res.json({
            success: true,
            flashcards: flashcards,
            pageCount: pdfData.numpages,
            textLength: text.length,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ 
            error: 'Failed to process PDF',
            details: error.message 
        });
    }
});

app.post('/api/upload', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        console.log(`Processing PDF: ${req.file.originalname} (${req.file.size} bytes)`);

        // Parse PDF
        const pdfData = await pdfParse(req.file.buffer);
        const text = pdfData.text;

        if (!text || text.trim().length < 50) {
            return res.status(400).json({ 
                error: 'PDF content is too short or could not be extracted' 
            });
        }

        // Generate flashcards using AWS Bedrock AI
        const flashcards = await generateFlashcardsWithBedrock(text, req.file.originalname);

        res.json({
            success: true,
            flashcards: flashcards,
            pageCount: pdfData.numpages,
            textLength: text.length,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ 
            error: 'Failed to process PDF',
            details: error.message 
        });
    }
});

// AI-powered flashcard generation using AWS Bedrock
async function generateFlashcardsWithBedrock(text, filename) {
    try {
        console.log('Generating flashcards with AWS Bedrock...');
        
        // Truncate text if too long (Bedrock has token limits)
        const maxTextLength = 8000; // Adjust based on model limits
        const truncatedText = text.length > maxTextLength ? 
            text.substring(0, maxTextLength) + '...' : text;
        
        const prompt = createFlashcardPrompt(truncatedText, filename);
        
        // Prepare the request for Claude
        const requestBody = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 2000,
            temperature: 0.7,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        };

        const command = new InvokeModelCommand({
            modelId: BEDROCK_MODEL_ID,
            contentType: 'application/json',
            body: JSON.stringify(requestBody)
        });

        console.log('Invoking Bedrock model:', BEDROCK_MODEL_ID);
        const response = await bedrockClient.send(command);
        
        // Parse the response
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiResponse = responseBody.content[0].text;
        
        console.log('Bedrock response received, parsing flashcards...');
        
        // Parse the AI response to extract flashcards
        const flashcards = parseFlashcardsFromAI(aiResponse);
        
        // Fallback to rule-based if AI parsing fails
        if (flashcards.length === 0) {
            console.log('AI parsing failed, falling back to rule-based generation');
            return generateFlashcardsFallback(text, filename);
        }
        
        console.log(`Generated ${flashcards.length} flashcards with Bedrock`);
        return flashcards;
        
    } catch (error) {
        console.error('Bedrock error:', error);
        console.log('Falling back to rule-based flashcard generation');
        
        // Fallback to the original rule-based method
        return generateFlashcardsFallback(text, filename);
    }
}

function createFlashcardPrompt(text, filename) {
    return `You are an expert educational content creator specializing in accessibility and inclusive learning for students with disabilities. 

Create 8 high-quality flashcards from the following document content. The flashcards should be:
- Clear and concise for students with learning disabilities
- Varied in question types (definitions, concepts, applications, analysis)
- Accessible and easy to understand
- Focused on the most important information
- Suitable for text-to-speech reading

Document: "${filename}"
Content: ${text}

Please format your response as a JSON array with exactly this structure:
[
  {
    "question": "Clear, specific question here",
    "answer": "Comprehensive but concise answer here"
  },
  {
    "question": "Another question here", 
    "answer": "Another answer here"
  }
]

Requirements:
1. Create exactly 8 flashcards
2. Use simple, clear language
3. Vary question types: definitions, explanations, applications, comparisons
4. Keep answers informative but not overwhelming
5. Focus on key concepts and practical knowledge
6. Make questions specific and answerable
7. Ensure accessibility for students with disabilities
8. Return ONLY the JSON array, no other text

Generate the flashcards now:`;
}

function parseFlashcardsFromAI(aiResponse) {
    try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.log('No JSON array found in AI response');
            return [];
        }
        
        const jsonString = jsonMatch[0];
        const flashcards = JSON.parse(jsonString);
        
        // Validate the structure
        if (!Array.isArray(flashcards)) {
            console.log('AI response is not an array');
            return [];
        }
        
        // Filter and validate flashcards
        const validFlashcards = flashcards.filter(card => 
            card && 
            typeof card.question === 'string' && 
            typeof card.answer === 'string' &&
            card.question.trim().length > 0 &&
            card.answer.trim().length > 0
        ).map(card => ({
            question: card.question.trim(),
            answer: card.answer.trim()
        }));
        
        return validFlashcards.slice(0, 8); // Ensure max 8 cards
        
    } catch (error) {
        console.error('Error parsing AI flashcards:', error);
        return [];
    }
}

// Fallback function (original rule-based algorithm)
function generateFlashcardsFallback(text, filename) {
    const flashcards = [];
    
    // Clean and prepare text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 30);
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 50);
    
    // Extract key terms (words that appear frequently and are capitalized or technical)
    const words = cleanText.split(/\s+/);
    const keyTerms = findKeyTerms(words);
    
    // Generate different types of flashcards
    
    // 1. Definition-based flashcards from key terms
    keyTerms.slice(0, 3).forEach(term => {
        const context = findContextForTerm(term, sentences);
        if (context) {
            flashcards.push({
                question: `What is "${term}"?`,
                answer: context
            });
        }
    });
    
    // 2. Concept-based flashcards from paragraphs
    paragraphs.slice(0, 3).forEach((paragraph, index) => {
        const firstSentence = paragraph.split(/[.!?]/)[0].trim();
        const restOfParagraph = paragraph.substring(firstSentence.length).trim();
        
        if (firstSentence && restOfParagraph) {
            flashcards.push({
                question: `Complete this concept: "${firstSentence}..."`,
                answer: restOfParagraph.substring(0, 200) + (restOfParagraph.length > 200 ? '...' : '')
            });
        }
    });
    
    // 3. Summary-based flashcards
    if (sentences.length > 5) {
        flashcards.push({
            question: `What is the main topic discussed in "${filename}"?`,
            answer: `The document covers ${extractMainTopics(sentences).join(', ')} and provides detailed information about these concepts.`
        });
    }
    
    // 4. Application-based flashcards
    const actionWords = findActionWords(sentences);
    if (actionWords.length > 0) {
        flashcards.push({
            question: "What are the key actions or processes mentioned in this document?",
            answer: `The document mentions several important processes: ${actionWords.slice(0, 5).join(', ')}.`
        });
    }
    
    // 5. Add generic educational flashcards if we don't have enough
    while (flashcards.length < 5) {
        const genericCards = [
            {
                question: "What are the learning objectives of this material?",
                answer: "Understanding the key concepts, applying the knowledge practically, and retaining the information for future use."
            },
            {
                question: "How should this information be studied effectively?",
                answer: "Break down complex concepts, create connections between ideas, practice with examples, and review regularly."
            },
            {
                question: "What questions should you ask yourself while studying this material?",
                answer: "What are the main points? How do concepts relate to each other? What are practical applications? What might be tested?"
            },
            {
                question: "How can you apply this knowledge in real situations?",
                answer: "Look for opportunities to use these concepts in practice, discuss with others, and connect to previous knowledge."
            }
        ];
        
        const randomCard = genericCards[flashcards.length % genericCards.length];
        flashcards.push(randomCard);
    }
    
    return flashcards.slice(0, 8); // Limit to 8 flashcards for better user experience
}

function findKeyTerms(words) {
    const termFrequency = {};
    const keyTerms = [];
    
    words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
        if (cleanWord.length > 3 && !isCommonWord(cleanWord)) {
            termFrequency[cleanWord] = (termFrequency[cleanWord] || 0) + 1;
        }
    });
    
    // Find terms that appear multiple times
    Object.entries(termFrequency)
        .filter(([term, freq]) => freq > 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([term]) => keyTerms.push(term));
    
    return keyTerms;
}

function isCommonWord(word) {
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use'];
    return commonWords.includes(word);
}

function findContextForTerm(term, sentences) {
    for (let sentence of sentences) {
        if (sentence.toLowerCase().includes(term.toLowerCase())) {
            return sentence.trim();
        }
    }
    return null;
}

function extractMainTopics(sentences) {
    const topics = [];
    const topicWords = [];
    
    sentences.slice(0, 5).forEach(sentence => {
        const words = sentence.split(/\s+/);
        words.forEach(word => {
            const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
            if (cleanWord.length > 4 && !isCommonWord(cleanWord)) {
                topicWords.push(cleanWord);
            }
        });
    });
    
    // Get most frequent topic words
    const frequency = {};
    topicWords.forEach(word => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word);
}

function findActionWords(sentences) {
    const actionWords = [];
    const actionPatterns = /\b(implement|create|develop|analyze|evaluate|compare|explain|describe|identify|determine|calculate|solve|apply|use|make|build|design|plan|organize|manage|control|monitor|assess|review|study|learn|understand|know|remember|recall|recognize)\b/gi;
    
    sentences.forEach(sentence => {
        const matches = sentence.match(actionPatterns);
        if (matches) {
            actionWords.push(...matches);
        }
    });
    
    return [...new Set(actionWords.map(word => word.toLowerCase()))];
}

// Health check endpoint (both /health and /api/health for compatibility)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'EchoLearn API',
        domain: DOMAIN,
        baseUrl: BASE_URL,
        version: process.env.npm_package_version || '1.0.0',
        features: {
            speechToText: true,
            textToSpeech: true,
            aiFlashcards: !!process.env.AWS_ACCESS_KEY_ID,
            emailFeedback: !!process.env.EMAIL_USER || !!process.env.SENDGRID_API_KEY
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'EchoLearn API',
        domain: DOMAIN,
        baseUrl: BASE_URL,
        version: process.env.npm_package_version || '1.0.0',
        features: {
            speechToText: true,
            textToSpeech: true,
            aiFlashcards: !!process.env.AWS_ACCESS_KEY_ID,
            emailFeedback: !!process.env.EMAIL_USER || !!process.env.SENDGRID_API_KEY
        }
    });
});

// Bedrock configuration check endpoint (both /bedrock-status and /api/bedrock-status)
app.get('/bedrock-status', async (req, res) => {
    try {
        // Test Bedrock connection with a simple request
        const testPrompt = "Hello, this is a test. Please respond with 'Bedrock is working'.";
        
        const requestBody = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 50,
            temperature: 0.1,
            messages: [
                {
                    role: "user",
                    content: testPrompt
                }
            ]
        };

        const command = new InvokeModelCommand({
            modelId: BEDROCK_MODEL_ID,
            contentType: 'application/json',
            body: JSON.stringify(requestBody)
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        res.json({
            status: 'connected',
            model: BEDROCK_MODEL_ID,
            region: process.env.AWS_REGION || 'us-east-1',
            testResponse: responseBody.content[0].text,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Bedrock connection test failed:', error);
        res.status(500).json({
            status: 'error',
            model: BEDROCK_MODEL_ID,
            region: process.env.AWS_REGION || 'us-east-1',
            error: error.message,
            fallback: 'Will use rule-based generation',
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/bedrock-status', async (req, res) => {
    try {
        // Test Bedrock connection with a simple request
        const testPrompt = "Hello, this is a test. Please respond with 'Bedrock is working'.";
        
        const requestBody = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 50,
            temperature: 0.1,
            messages: [
                {
                    role: "user",
                    content: testPrompt
                }
            ]
        };

        const command = new InvokeModelCommand({
            modelId: BEDROCK_MODEL_ID,
            contentType: 'application/json',
            body: JSON.stringify(requestBody)
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        res.json({
            status: 'connected',
            model: BEDROCK_MODEL_ID,
            region: process.env.AWS_REGION || 'us-east-1',
            testResponse: responseBody.content[0].text,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Bedrock connection test failed:', error);
        res.status(500).json({
            status: 'error',
            model: BEDROCK_MODEL_ID,
            region: process.env.AWS_REGION || 'us-east-1',
            error: error.message,
            fallback: 'Will use rule-based generation',
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'File too large. Maximum size is 10MB.' 
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                error: 'Unexpected file field. Please use "pdf" as the field name.' 
            });
        }
    }
    
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

// Chatbot endpoint - AWS Bedrock integration
app.post('/chatbot', async (req, res) => {
    try {
        const { message, context } = req.body;
        
        if (!message || !message.trim()) {
            return res.status(400).json({ 
                error: 'Message is required' 
            });
        }
        
        console.log('🤖 Chatbot query:', message);
        
        // Generate AI response
        const response = await generateChatbotResponse(message, context);
        
        res.json({
            success: true,
            response: response,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            error: 'Failed to generate response',
            response: getFallbackResponse(req.body.message),
            timestamp: new Date().toISOString()
        });
    }
});

async function generateChatbotResponse(message, context) {
    // If Bedrock is not configured, use rule-based responses
    if (!bedrockClient || !process.env.AWS_ACCESS_KEY_ID) {
        return generateRuleBasedResponse(message, context);
    }
    
    try {
        const prompt = createChatbotPrompt(message, context);
        
        const requestBody = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            temperature: 0.7,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        };

        const command = new InvokeModelCommand({
            modelId: BEDROCK_MODEL_ID,
            contentType: 'application/json',
            body: JSON.stringify(requestBody)
        });

        console.log('🤖 Invoking Bedrock for chatbot response...');
        const response = await bedrockClient.send(command);
        
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const aiResponse = responseBody.content[0].text;
        
        console.log('🤖 Bedrock chatbot response generated');
        return aiResponse;
        
    } catch (error) {
        console.error('Bedrock chatbot error:', error);
        return generateRuleBasedResponse(message, context);
    }
}

function createChatbotPrompt(message, context) {
    return `You are an accessibility assistant for EchoLearn, a learning platform designed for students with disabilities. You are helpful, empathetic, and knowledgeable about accessibility features.

PLATFORM CONTEXT:
- EchoLearn helps students with disabilities through speech-to-text, text-to-speech, AI flashcards, and accessible design
- Current user section: ${context?.currentSection || 'unknown'}
- User is logged in: ${context?.isLoggedIn || false}
- User disability type: ${context?.userDisability || 'not specified'}
- Browser support: Speech recognition: ${context?.browserSupport?.speechRecognition || false}, Speech synthesis: ${context?.browserSupport?.speechSynthesis || false}

FEATURES YOU CAN HELP WITH:
1. Speech-to-Text Notes: Voice recording for note-taking
2. Text-to-Speech: Reading notes and PDFs aloud with voice controls
3. AI Flashcards: PDF upload and automatic flashcard generation
4. Accessibility Settings: Voice selection, speed controls, keyboard navigation
5. User Profiles: Accessibility preferences and settings
6. Navigation: How to use different sections of the platform

RESPONSE GUIDELINES:
- Be concise but helpful (2-4 sentences usually)
- Focus on accessibility and inclusion
- Provide specific, actionable steps
- Be empathetic to disability-related challenges
- Use clear, simple language
- Include relevant emojis for visual clarity
- If technical issues, suggest alternatives

USER QUESTION: "${message}"

Provide a helpful, accessible response:`;
}

function generateRuleBasedResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    
    // Speech-to-text help
    if (lowerMessage.includes('speech') && (lowerMessage.includes('text') || lowerMessage.includes('voice') || lowerMessage.includes('record'))) {
        return `🎤 **Speech-to-Text Help:**

To use voice recording:
1. Go to the **Notes** section
2. Click the **🎤 Start Recording** button
3. Speak clearly into your microphone
4. Click **⏹️ Stop Recording** when done
5. Your speech will appear as text automatically

**Tip:** Make sure your browser allows microphone access when prompted!`;
    }
    
    // Text-to-speech help
    if (lowerMessage.includes('text') && lowerMessage.includes('speech') || lowerMessage.includes('read aloud')) {
        return `🔊 **Text-to-Speech Help:**

To have text read aloud:
1. **For Notes:** Type or record notes, then click **🔊 Read Aloud**
2. **For PDFs:** Upload a PDF in Notes section, then click **🔊 Read PDF Aloud**
3. **Voice Settings:** Adjust speed and pitch with the controls
4. **Voice Selection:** Choose different voices from the dropdown

**Tip:** You can pause/resume playback anytime!`;
    }
    
    // Flashcards help
    if (lowerMessage.includes('flashcard') || lowerMessage.includes('pdf') || lowerMessage.includes('study')) {
        return `🃏 **Flashcards Help:**

To create AI flashcards:
1. Go to the **Flashcards** section
2. **Upload a PDF** by dragging/dropping or clicking browse
3. Click **Generate Flashcards** 
4. Wait for AI processing (uses AWS Bedrock)
5. Study with interactive flip cards

**Navigation:** Use arrow keys or click to flip cards. Perfect for accessible studying!`;
    }
    
    // Accessibility features
    if (lowerMessage.includes('accessibility') || lowerMessage.includes('disability') || lowerMessage.includes('accessible')) {
        return `♿ **Accessibility Features:**

EchoLearn is designed for students with disabilities:
• **Full keyboard navigation** - Tab through all features
• **Screen reader support** - ARIA labels and semantic HTML
• **Voice controls** - Speech-to-text and text-to-speech
• **High contrast support** - Adapts to your system settings
• **Touch accessibility** - 44px minimum touch targets
• **Reduced motion** - Respects motion sensitivity preferences

**Profile Settings:** Update your accessibility needs in your profile for a personalized experience!`;
    }
    
    // Navigation help
    if (lowerMessage.includes('navigate') || lowerMessage.includes('how to use') || lowerMessage.includes('getting started')) {
        return `🧭 **Navigation Help:**

**Main Sections:**
• **Home** - Overview and feature access
• **Notes** - Speech-to-text recording and PDF reading
• **Flashcards** - AI-powered study cards from PDFs
• **Profile** - Your accessibility preferences
• **Feedback** - Share suggestions with our team

**Keyboard Navigation:** Press Tab to move between elements, Enter to activate, Escape to close modals.

**Need specific help?** Ask about any feature!`;
    }
    
    // Login/account help
    if (lowerMessage.includes('login') || lowerMessage.includes('account') || lowerMessage.includes('sign')) {
        return `👤 **Account Help:**

**To Sign Up:**
1. Click **Get Started** on the home page
2. Fill in your information including accessibility needs
3. This helps us customize your experience

**Benefits of Having an Account:**
• Save notes across devices
• Store flashcard sets
• Personalized accessibility settings
• Track your learning progress

**Privacy:** Your accessibility information helps us serve you better and is kept confidential.`;
    }
    
    // Technical issues
    if (lowerMessage.includes('not working') || lowerMessage.includes('error') || lowerMessage.includes('problem')) {
        return `🔧 **Technical Support:**

**Common Solutions:**
• **Microphone issues:** Check browser permissions and try refreshing
• **Speech not working:** Ensure speakers/headphones are connected
• **PDF upload fails:** Try smaller files (under 10MB) or different PDFs
• **Features missing:** Make sure you're logged in

**Browser Compatibility:** Chrome and Edge work best for all features.

**Still having issues?** Use the Feedback form to contact our support team with specific details!`;
    }
    
    // Default helpful response
    return `👋 **I'm here to help with EchoLearn!**

I can assist you with:
• **🎤 Speech-to-text** recording and voice features
• **🔊 Text-to-speech** for reading notes and PDFs
• **🃏 AI flashcards** from PDF uploads
• **♿ Accessibility** settings and navigation
• **📱 Platform features** and how to use them

**What would you like help with?** Just ask about any feature or accessibility need!

**Quick Tips:** Try asking "How do I use speech-to-text?" or "Help with flashcards"`;
}

function getFallbackResponse(message) {
    return `I apologize, but I'm having trouble connecting to my AI service right now. 

**Here are some quick resources:**
• **Speech Help:** Click 🎤 in Notes section for voice recording
• **Reading Help:** Upload PDFs in Notes for text-to-speech
• **Flashcards:** Upload PDFs in Flashcards section for AI generation
• **Support:** Use the Feedback form for detailed assistance

**Please try asking again in a moment, or use our Feedback form for personalized help!**`;
}

// Feedback submission endpoint (both /submit-feedback and /api/submit-feedback)
app.post('/submit-feedback', async (req, res) => {
    try {
        const feedback = req.body;
        
        // Validate required fields
        if (!feedback.name || !feedback.email || !feedback.subject || !feedback.message) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }
        
        console.log('📝 New feedback received from:', feedback.name);
        
        // Save feedback to file/database (for backup)
        const feedbackRecord = {
            ...feedback,
            id: Date.now().toString(),
            receivedAt: new Date().toISOString()
        };
        
        // Log feedback (in production, save to database)
        console.log('Feedback Record:', JSON.stringify(feedbackRecord, null, 2));
        
        // Send emails if configured
        if (emailTransporter) {
            await sendFeedbackEmails(feedback);
        }
        
        res.json({
            success: true,
            message: 'Feedback submitted successfully',
            id: feedbackRecord.id
        });
        
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({
            error: 'Failed to submit feedback',
            details: error.message
        });
    }
});

app.post('/api/submit-feedback', async (req, res) => {
    try {
        const feedback = req.body;
        
        // Validate required fields
        if (!feedback.name || !feedback.email || !feedback.subject || !feedback.message) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }
        
        console.log('📝 New feedback received from:', feedback.name);
        
        // Save feedback to file/database (for backup)
        const feedbackRecord = {
            ...feedback,
            id: Date.now().toString(),
            receivedAt: new Date().toISOString()
        };
        
        // Log feedback (in production, save to database)
        console.log('Feedback Record:', JSON.stringify(feedbackRecord, null, 2));
        
        // Send emails if configured
        if (emailTransporter) {
            await sendFeedbackEmails(feedback);
        }
        
        res.json({
            success: true,
            message: 'Feedback submitted successfully',
            id: feedbackRecord.id
        });
        
    } catch (error) {
        console.error('Feedback submission error:', error);
        res.status(500).json({
            error: 'Failed to submit feedback',
            details: error.message
        });
    }
});

async function sendFeedbackEmails(feedback) {
    const feedbackEmail = process.env.FEEDBACK_EMAIL || process.env.EMAIL_USER;
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    
    // Email to admin/team
    const adminEmailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .feedback-details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .label { font-weight: bold; color: #667eea; }
        .rating { font-size: 1.2em; color: #ffc107; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 EchoLearn Feedback</h1>
        <p>New feedback received from a user</p>
    </div>
    
    <div class="content">
        <div class="feedback-details">
            <p><span class="label">From:</span> ${feedback.name} (${feedback.email})</p>
            <p><span class="label">Type:</span> ${feedback.type}</p>
            <p><span class="label">Accessibility Needs:</span> ${feedback.disability || 'Not specified'}</p>
            <p><span class="label">Rating:</span> <span class="rating">${'★'.repeat(feedback.rating || 0)}${'☆'.repeat(5 - (feedback.rating || 0))}</span> (${feedback.rating || 'Not rated'}/5)</p>
            <p><span class="label">Subject:</span> ${feedback.subject}</p>
        </div>
        
        <h3>Message:</h3>
        <div class="feedback-details">
            <p>${feedback.message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div class="feedback-details">
            <p><span class="label">Submitted:</span> ${new Date().toLocaleString()}</p>
            <p><span class="label">User Agent:</span> ${feedback.userAgent || 'Not provided'}</p>
            <p><span class="label">User ID:</span> ${feedback.currentUser || 'Anonymous'}</p>
            <p><span class="label">Send Copy:</span> ${feedback.sendCopy ? 'Yes' : 'No'}</p>
            <p><span class="label">Updates:</span> ${feedback.updates ? 'Yes' : 'No'}</p>
        </div>
    </div>
    
    <div class="footer">
        <p>This feedback was submitted through the EchoLearn platform.</p>
        <p>Please respond to the user at: ${feedback.email}</p>
    </div>
</body>
</html>`;

    // Email to user (copy)
    const userEmailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .feedback-copy { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
        .label { font-weight: bold; color: #667eea; }
        .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 EchoLearn</h1>
        <p>Thank you for your feedback!</p>
    </div>
    
    <div class="content">
        <p>Dear ${feedback.name},</p>
        
        <p>Thank you for taking the time to share your feedback with us. Your input is invaluable in helping us make EchoLearn more accessible and effective for students with disabilities.</p>
        
        <h3>Your Feedback Summary:</h3>
        <div class="feedback-copy">
            <p><span class="label">Type:</span> ${feedback.type}</p>
            <p><span class="label">Subject:</span> ${feedback.subject}</p>
            <p><span class="label">Rating:</span> ${feedback.rating ? feedback.rating + '/5 stars' : 'Not rated'}</p>
            <p><span class="label">Message:</span></p>
            <p>${feedback.message.replace(/\n/g, '<br>')}</p>
            <p><span class="label">Submitted:</span> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>We review all feedback carefully and will use your suggestions to improve our platform. If your feedback requires a direct response, we'll get back to you within 2-3 business days.</p>
        
        <p>Thank you for helping us create a more inclusive learning environment!</p>
        
        <p>Best regards,<br>The EchoLearn Team</p>
    </div>
    
    <div class="footer">
        <p>This is an automated confirmation. Please do not reply to this email.</p>
        <p>For support, contact us through the EchoLearn platform.</p>
    </div>
</body>
</html>`;

    try {
        // Send email to admin/team
        await emailTransporter.sendMail({
            from: fromEmail,
            to: feedbackEmail,
            subject: `EchoLearn Feedback: ${feedback.subject}`,
            html: adminEmailContent
        });
        
        console.log('📧 Admin notification email sent');
        
        // Send copy to user if requested
        if (feedback.sendCopy) {
            await emailTransporter.sendMail({
                from: fromEmail,
                to: feedback.email,
                subject: 'EchoLearn - Feedback Confirmation',
                html: userEmailContent
            });
            
            console.log('📧 User confirmation email sent to:', feedback.email);
        }
        
    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        path: req.path 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces = require('os').networkInterfaces();
    const localIP = Object.values(networkInterfaces)
        .flat()
        .find(iface => iface.family === 'IPv4' && !iface.internal)?.address;
    
    console.log(`🚀 EchoLearn server running on:`);
    console.log(`   Local:    http://localhost:${PORT}`);
    if (localIP) {
        console.log(`   Network:  http://${localIP}:${PORT}`);
    }
    console.log(`🌐 Production domain: ${BASE_URL}`);
    console.log(`📚 Features: PDF Flashcards, Speech-to-Text, Text-to-Speech, User Profiles`);
    console.log(`♿ Accessibility-focused learning platform for students with disabilities`);
    console.log(`📱 Access from other devices using the Network URL above`);
});