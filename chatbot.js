// AWS Bedrock Chatbot for EchoLearn
// Accessibility-focused AI assistant for students with disabilities

class EchoLearnChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        this.currentUser = null;
        this.initializeChatbot();
    }

    initializeChatbot() {
        this.createChatbotHTML();
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    createChatbotHTML() {
        const chatbotHTML = `
            <!-- Chatbot Toggle Button -->
            <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Open accessibility assistant chatbot">
                <div class="chatbot-icon">
                    <span class="chat-bubble">💬</span>
                    <span class="accessibility-icon">♿</span>
                </div>
                <span class="chatbot-label">Need Help?</span>
            </button>

            <!-- Chatbot Container -->
            <div id="chatbot-container" class="chatbot-container" role="dialog" aria-labelledby="chatbot-title" aria-hidden="true">
                <div class="chatbot-header">
                    <div class="chatbot-title-section">
                        <h3 id="chatbot-title">EchoLearn Assistant</h3>
                        <p class="chatbot-subtitle">Accessibility Support AI</p>
                    </div>
                    <div class="chatbot-controls">
                        <button id="chatbot-voice-toggle" class="chatbot-control-btn" aria-label="Toggle voice responses" title="Voice Responses">
                            🔊
                        </button>
                        <button id="chatbot-minimize" class="chatbot-control-btn" aria-label="Minimize chatbot">
                            ➖
                        </button>
                        <button id="chatbot-close" class="chatbot-control-btn" aria-label="Close chatbot">
                            ✖️
                        </button>
                    </div>
                </div>

                <div id="chatbot-messages" class="chatbot-messages" role="log" aria-live="polite" aria-label="Chat messages">
                    <!-- Messages will be added here -->
                </div>

                <div class="chatbot-quick-actions">
                    <button class="quick-action-btn" onclick="chatbot.sendQuickMessage('How do I use speech-to-text?')">
                        🎤 Speech Help
                    </button>
                    <button class="quick-action-btn" onclick="chatbot.sendQuickMessage('How do I create flashcards?')">
                        🃏 Flashcards
                    </button>
                    <button class="quick-action-btn" onclick="chatbot.sendQuickMessage('Accessibility features')">
                        ♿ Accessibility
                    </button>
                </div>

                <div class="chatbot-input-section">
                    <div class="chatbot-input-container">
                        <textarea 
                            id="chatbot-input" 
                            class="chatbot-input" 
                            placeholder="Ask me anything about EchoLearn accessibility features..."
                            rows="2"
                            aria-label="Type your message to the accessibility assistant"
                        ></textarea>
                        <div class="chatbot-input-actions">
                            <button id="chatbot-voice-input" class="chatbot-action-btn" aria-label="Voice input" title="Speak your message">
                                🎤
                            </button>
                            <button id="chatbot-send" class="chatbot-action-btn" aria-label="Send message">
                                ➤
                            </button>
                        </div>
                    </div>
                </div>

                <div class="chatbot-status" id="chatbot-status" aria-live="polite">
                    Ready to help with accessibility questions
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    setupEventListeners() {
        // Toggle chatbot
        document.getElementById('chatbot-toggle').addEventListener('click', () => this.toggleChatbot());
        document.getElementById('chatbot-close').addEventListener('click', () => this.closeChatbot());
        document.getElementById('chatbot-minimize').addEventListener('click', () => this.minimizeChatbot());

        // Send message
        document.getElementById('chatbot-send').addEventListener('click', () => this.sendMessage());
        document.getElementById('chatbot-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Voice input
        document.getElementById('chatbot-voice-input').addEventListener('click', () => this.startVoiceInput());
        document.getElementById('chatbot-voice-toggle').addEventListener('click', () => this.toggleVoiceResponses());

        // Accessibility: Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChatbot();
            }
        });
    }

    addWelcomeMessage() {
        const welcomeMessage = {
            type: 'bot',
            content: `👋 Hi! I'm your EchoLearn accessibility assistant. I'm here to help you navigate the platform and make the most of our accessibility features.

I can help you with:
• Speech-to-text and text-to-speech features
• Creating and studying flashcards
• Accessibility settings and preferences
• Navigation and platform features
• Technical support

How can I assist you today?`,
            timestamp: new Date()
        };
        this.addMessage(welcomeMessage);
    }

    toggleChatbot() {
        if (this.isOpen) {
            this.closeChatbot();
        } else {
            this.openChatbot();
        }
    }

    openChatbot() {
        const container = document.getElementById('chatbot-container');
        const toggle = document.getElementById('chatbot-toggle');
        
        container.style.display = 'flex';
        container.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
        
        this.isOpen = true;
        
        // Focus on input for accessibility
        setTimeout(() => {
            document.getElementById('chatbot-input').focus();
        }, 100);

        // Announce to screen readers
        this.updateStatus('Chatbot opened. You can now ask questions about accessibility features.');
    }

    closeChatbot() {
        const container = document.getElementById('chatbot-container');
        const toggle = document.getElementById('chatbot-toggle');
        
        container.style.display = 'none';
        container.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        
        this.isOpen = false;
        
        // Return focus to toggle button
        toggle.focus();
        
        this.updateStatus('Chatbot closed.');
    }

    minimizeChatbot() {
        const container = document.getElementById('chatbot-container');
        container.classList.toggle('minimized');
        
        const isMinimized = container.classList.contains('minimized');
        this.updateStatus(isMinimized ? 'Chatbot minimized.' : 'Chatbot restored.');
    }

    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage({
            type: 'user',
            content: message,
            timestamp: new Date()
        });

        // Clear input
        input.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Send to AWS Bedrock
            const response = await this.sendToAI(message);
            
            // Remove typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage({
                type: 'bot',
                content: response,
                timestamp: new Date()
            });

            // Speak response if voice is enabled
            if (this.voiceEnabled) {
                this.speakMessage(response);
            }

        } catch (error) {
            console.error('Chatbot error:', error);
            this.hideTypingIndicator();
            
            this.addMessage({
                type: 'bot',
                content: `I apologize, but I'm having trouble connecting right now. Here are some quick tips:

• For speech-to-text: Click the 🎤 button in the Notes section
• For flashcards: Upload a PDF in the Flashcards section  
• For accessibility: Check your Profile settings
• For help: Use the Feedback form to contact our team

Please try again in a moment, or use the Feedback form for additional support.`,
                timestamp: new Date(),
                isError: true
            });
        }
    }

    sendQuickMessage(message) {
        document.getElementById('chatbot-input').value = message;
        this.sendMessage();
    }

    async sendToAI(message) {
        // Get user context
        const userContext = this.getUserContext();
        
        const response = await fetch('/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                context: userContext,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get AI response');
        }

        const data = await response.json();
        return data.response;
    }

    getUserContext() {
        return {
            currentSection: currentSection || 'home',
            isLoggedIn: !!currentUser,
            userDisability: currentUser?.disability || null,
            userPreferences: currentUser?.preferences || {},
            currentPage: window.location.pathname,
            hasNotes: localStorage.getItem('savedNotes') ? true : false,
            browserSupport: {
                speechRecognition: !!recognition,
                speechSynthesis: !!synthesis,
                webAudio: !!(window.AudioContext || window.webkitAudioContext)
            }
        };
    }

    addMessage(message) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageElement = document.createElement('div');
        messageElement.className = `chatbot-message ${message.type}-message ${message.isError ? 'error-message' : ''}`;
        
        const timeString = message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(message.content)}</div>
                <div class="message-time">${timeString}</div>
            </div>
            ${message.type === 'bot' ? `
                <div class="message-actions">
                    <button class="message-action-btn" onclick="chatbot.speakMessage('${message.content.replace(/'/g, "\\'")}')">
                        🔊
                    </button>
                    <button class="message-action-btn" onclick="chatbot.copyMessage('${message.content.replace(/'/g, "\\'")}')">
                        📋
                    </button>
                </div>
            ` : ''}
        `;

        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Store message
        this.messages.push(message);
    }

    formatMessage(content) {
        // Convert markdown-like formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/•/g, '•')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingElement = document.createElement('div');
        typingElement.id = 'typing-indicator';
        typingElement.className = 'chatbot-message bot-message typing';
        typingElement.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        messagesContainer.appendChild(typingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        this.isTyping = true;
        
        this.updateStatus('Assistant is typing...');
    }

    hideTypingIndicator() {
        const typingElement = document.getElementById('typing-indicator');
        if (typingElement) {
            typingElement.remove();
        }
        this.isTyping = false;
        this.updateStatus('Ready for your next question.');
    }

    startVoiceInput() {
        if (!recognition) {
            this.updateStatus('Voice input not supported in this browser.');
            return;
        }

        const button = document.getElementById('chatbot-voice-input');
        const input = document.getElementById('chatbot-input');
        
        button.textContent = '🔴';
        button.setAttribute('aria-label', 'Stop voice input');
        this.updateStatus('Listening... Speak your question.');

        recognition.start();
        
        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            input.value = transcript;
            button.textContent = '🎤';
            button.setAttribute('aria-label', 'Voice input');
            this.updateStatus('Voice input received. Click send or press Enter.');
        };

        recognition.onerror = () => {
            button.textContent = '🎤';
            button.setAttribute('aria-label', 'Voice input');
            this.updateStatus('Voice input error. Please try typing instead.');
        };

        recognition.onend = () => {
            button.textContent = '🎤';
            button.setAttribute('aria-label', 'Voice input');
        };
    }

    toggleVoiceResponses() {
        this.voiceEnabled = !this.voiceEnabled;
        const button = document.getElementById('chatbot-voice-toggle');
        
        if (this.voiceEnabled) {
            button.textContent = '🔊';
            button.setAttribute('title', 'Voice responses enabled');
            this.updateStatus('Voice responses enabled.');
        } else {
            button.textContent = '🔇';
            button.setAttribute('title', 'Voice responses disabled');
            this.updateStatus('Voice responses disabled.');
        }
    }

    speakMessage(text) {
        if (!synthesis || !this.voiceEnabled) return;
        
        // Clean text for speech
        const cleanText = text.replace(/<[^>]*>/g, '').replace(/[•]/g, '');
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        // Use selected voice if available
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        
        synthesis.speak(utterance);
    }

    copyMessage(text) {
        const cleanText = text.replace(/<[^>]*>/g, '');
        navigator.clipboard.writeText(cleanText).then(() => {
            this.updateStatus('Message copied to clipboard.');
        }).catch(() => {
            this.updateStatus('Could not copy message.');
        });
    }

    updateStatus(message) {
        const statusElement = document.getElementById('chatbot-status');
        statusElement.textContent = message;
        
        // Clear status after 3 seconds
        setTimeout(() => {
            if (statusElement.textContent === message) {
                statusElement.textContent = 'Ready to help with accessibility questions';
            }
        }, 3000);
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new EchoLearnChatbot();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EchoLearnChatbot;
}