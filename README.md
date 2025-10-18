# EchoLearn 🎓♿

> An AI-powered, accessibility-focused learning platform designed specifically for students with disabilities

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange.svg)](https://aws.amazon.com/bedrock/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-blue.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

EchoLearn transforms the learning experience for students with disabilities through innovative accessibility features, AI-powered content generation, and inclusive design principles.

![EchoLearn Demo](https://via.placeholder.com/800x400/667eea/ffffff?text=EchoLearn+Demo)

## ✨ Features

### 🎤 Smart Notes
- **Speech-to-Text**: Convert spoken words into written notes using Web Speech API
- **Text-to-Speech**: Have your notes and PDFs read aloud with natural voice synthesis
- **PDF Text Reader**: Upload PDFs and listen to content with adjustable speed and pitch
- **Voice Selection**: Choose from available system voices for personalized experience
- **Note Management**: Save, organize, and replay notes with timestamps

### 🤖 AI-Powered Flashcards
- **AWS Bedrock Integration**: Uses Claude 3 AI models for intelligent flashcard generation
- **PDF Processing**: Upload study materials and automatically generate relevant Q&A pairs
- **Smart Question Types**: Definitions, concepts, applications, and analysis questions
- **Accessibility Optimized**: AI prompts specifically designed for learning disabilities
- **Interactive Study Mode**: Flip cards, keyboard navigation, and progress tracking

### 👤 Inclusive User Profiles
- **Accessibility Preferences**: Store disability type and accommodation needs
- **Personalized Experience**: Customized interface based on individual requirements
- **Secure Authentication**: Privacy-focused user management
- **Profile Management**: Track learning progress and preferences

### ♿ Accessibility Excellence
- **WCAG 2.1 AA Compliant**: Meets international accessibility standards
- **Screen Reader Support**: Full ARIA labels and semantic HTML structure
- **Keyboard Navigation**: Complete functionality without mouse interaction
- **High Contrast Support**: Adapts to system accessibility preferences
- **Reduced Motion**: Respects user's motion sensitivity settings
- **Touch Accessibility**: Minimum 44px touch targets for mobile users

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- AWS account (optional, for AI features)
- Modern web browser with Web Speech API support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/echolearn.git
   cd echolearn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional for AI features)
   ```bash
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🤖 AI Setup (Optional)

EchoLearn works great without AI, but for the best flashcard generation experience:

### AWS Bedrock Configuration
1. **Create AWS Account**: [aws.amazon.com](https://aws.amazon.com)
2. **Enable Bedrock**: Request access to Claude 3 models
3. **Get Credentials**: Create IAM user with Bedrock permissions
4. **Configure App**: Update `.env` file with credentials

See [BEDROCK_SETUP.md](./BEDROCK_SETUP.md) for detailed instructions.

### Supported AI Models
- **Claude 3 Haiku**: Fast and economical (~$0.001 per PDF)
- **Claude 3 Sonnet**: Balanced performance (~$0.01 per PDF) 
- **Claude 3 Opus**: Most capable (~$0.05 per PDF)

## 🎯 Usage Guide

### For Students
1. **Create Account**: Sign up with accessibility preferences
2. **Upload PDFs**: Drag and drop study materials
3. **Listen & Learn**: Use text-to-speech for audio learning
4. **Take Notes**: Voice recording or traditional typing
5. **Study Flashcards**: AI-generated questions for review

### For Educators
1. **Accessibility Assessment**: Understand student needs
2. **Content Preparation**: Upload course materials as PDFs
3. **Customization**: Adjust speech settings for different disabilities
4. **Progress Monitoring**: Track student engagement and learning

### For Developers
1. **Accessibility Testing**: Use screen readers and keyboard navigation
2. **Voice Integration**: Extend speech synthesis features
3. **AI Enhancement**: Improve flashcard generation algorithms
4. **Mobile Optimization**: Enhance touch accessibility

## 🏗️ Architecture

```
EchoLearn/
├── 📁 Frontend (Vanilla JS)
│   ├── index.html          # Main application interface
│   ├── styles.css          # Accessibility-focused styling
│   └── script.js           # Client-side functionality
├── 📁 Backend (Node.js/Express)
│   ├── server.js           # API server and PDF processing
│   └── package.json        # Dependencies and scripts
├── 📁 AI Integration
│   ├── AWS Bedrock         # Claude 3 models for flashcards
│   └── Fallback Algorithm  # Rule-based generation
└── 📁 Documentation
    ├── README.md           # This file
    ├── BEDROCK_SETUP.md    # AI configuration guide
    └── CONTRIBUTING.md     # Development guidelines
```

## 🛠️ Technology Stack

### Frontend
- **HTML5**: Semantic structure with ARIA accessibility
- **CSS3**: Responsive design with accessibility features
- **Vanilla JavaScript**: No framework dependencies for simplicity
- **Web Speech API**: Browser-native speech recognition and synthesis

### Backend
- **Node.js**: JavaScript runtime for server-side logic
- **Express.js**: Web framework for API endpoints
- **Multer**: File upload handling for PDFs
- **PDF-Parse**: Text extraction from PDF documents

### AI & Cloud
- **AWS Bedrock**: Claude 3 AI models for content generation
- **AWS SDK**: JavaScript client for Bedrock integration
- **Environment Config**: Secure credential management

### Accessibility
- **WCAG 2.1 AA**: International accessibility standards
- **ARIA Labels**: Screen reader compatibility
- **Semantic HTML**: Proper document structure
- **Keyboard Navigation**: Full functionality without mouse

## 🤝 Contributing

We welcome contributions that make AccessiLearn more inclusive and helpful!

### Priority Areas
- 🔊 Enhanced speech recognition accuracy
- 📱 Mobile accessibility improvements  
- 🌍 Internationalization (i18n) support
- 🎨 High contrast theme options
- 🧠 Additional AI model integrations
- 📊 Learning analytics and progress tracking

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-accessibility`
3. Follow accessibility guidelines in [CONTRIBUTING.md](./CONTRIBUTING.md)
4. Test with screen readers and keyboard navigation
5. Submit pull request with accessibility impact description

### Accessibility Testing
- **Screen Readers**: NVDA, JAWS, VoiceOver
- **Keyboard Navigation**: Tab order and focus management
- **Color Contrast**: Minimum 4.5:1 ratio verification
- **Motion Sensitivity**: Reduced motion preference testing

## 📊 Browser Support

| Browser | Speech Recognition | Text-to-Speech | Core Features |
|---------|-------------------|----------------|---------------|
| Chrome 80+ | ✅ Full Support | ✅ Full Support | ✅ Full Support |
| Edge 80+ | ✅ Full Support | ✅ Full Support | ✅ Full Support |
| Firefox 70+ | ⚠️ Limited | ✅ Full Support | ✅ Full Support |
| Safari 14+ | ⚠️ Limited | ✅ Full Support | ✅ Full Support |
| Mobile Chrome | ✅ Full Support | ✅ Full Support | ✅ Full Support |
| Mobile Safari | ⚠️ Limited | ✅ Full Support | ✅ Full Support |

## 📈 Roadmap

### Version 2.0 (Planned)
- [ ] **Mobile App**: Native iOS/Android applications
- [ ] **Offline Mode**: Local AI models for offline usage
- [ ] **Collaboration**: Shared study sessions and notes
- [ ] **Analytics**: Learning progress and accessibility metrics
- [ ] **Integration**: LMS compatibility (Canvas, Blackboard)

### Version 1.5 (In Progress)
- [x] **AWS Bedrock**: AI-powered flashcard generation
- [x] **Voice Selection**: Multiple voice options
- [x] **PDF Text-to-Speech**: Audio reading of documents
- [ ] **Advanced Notes**: Rich text formatting and organization
- [ ] **Export Features**: PDF and audio export options

## 🏆 Recognition

EchoLearn is designed with input from:
- **Disability Rights Advocates**: Ensuring authentic accessibility
- **Special Education Teachers**: Practical classroom needs
- **Students with Disabilities**: Real-world usage feedback
- **Accessibility Experts**: WCAG compliance and best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Web Speech API**: Enabling browser-based speech features
- **AWS Bedrock**: Powering intelligent content generation
- **PDF-Parse**: Reliable document text extraction
- **Accessibility Community**: Guidance and advocacy for inclusive design
- **Students with Disabilities**: Inspiration and feedback for authentic solutions

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/echolearn/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/echolearn/discussions)
- **Accessibility Feedback**: Priority support for accessibility improvements
- **Educational Partnerships**: Contact for institutional implementations

---

**EchoLearn** - Making learning accessible for everyone 🌟

*Built with ❤️ for students with disabilities*