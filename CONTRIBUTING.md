# Contributing to EchoLearn 🤝

Thank you for your interest in contributing to EchoLearn! We welcome contributions that make learning more accessible for students with disabilities.

## 🎯 Our Mission

EchoLearn is dedicated to creating an inclusive learning environment for students with disabilities through:
- Accessibility-first design principles
- AI-powered educational tools
- Speech recognition and synthesis
- Universal design for learning

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git for version control
- Basic understanding of web accessibility (WCAG guidelines)
- Familiarity with HTML, CSS, JavaScript

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/echolearn.git
   cd echolearn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🎨 Code Style Guidelines

### HTML
- Use semantic HTML5 elements
- Include proper ARIA labels and roles
- Maintain logical heading hierarchy (h1 → h2 → h3)
- Ensure minimum 44px touch targets for mobile

### CSS
- Follow BEM naming convention when possible
- Maintain 4.5:1 color contrast ratio minimum
- Use relative units (rem, em) for scalability
- Support reduced motion preferences

### JavaScript
- Use clear, descriptive variable names
- Add comments for complex accessibility logic
- Handle errors gracefully with user feedback
- Test with keyboard navigation

## ♿ Accessibility Requirements

All contributions must meet WCAG 2.1 AA standards:

### Testing Checklist
- [ ] **Keyboard Navigation**: All functionality accessible via keyboard
- [ ] **Screen Reader**: Test with NVDA, JAWS, or VoiceOver
- [ ] **Color Contrast**: Minimum 4.5:1 ratio for normal text
- [ ] **Focus Indicators**: Visible focus states for all interactive elements
- [ ] **ARIA Labels**: Proper labels for form controls and buttons
- [ ] **Semantic Structure**: Logical heading and landmark structure

### Accessibility Testing Tools
- **Browser Extensions**: axe DevTools, WAVE
- **Screen Readers**: NVDA (free), VoiceOver (Mac), JAWS
- **Contrast Checkers**: WebAIM Contrast Checker
- **Keyboard Testing**: Tab through entire interface

## 🔄 Development Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `accessibility/description` - Accessibility improvements
- `docs/description` - Documentation updates

### Commit Messages
Use conventional commits format:
```
type(scope): description

feat(speech): add voice selection for text-to-speech
fix(auth): resolve login validation issue
a11y(nav): improve keyboard navigation
docs(readme): update installation instructions
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow code style guidelines
   - Add tests if applicable
   - Update documentation

3. **Test Accessibility**
   - Run accessibility checklist
   - Test with screen readers
   - Verify keyboard navigation

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(feature): add new accessibility feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Requirements**
   - Clear description of changes
   - Accessibility impact assessment
   - Screenshots/videos if UI changes
   - Link to related issues

## 🎯 Priority Contribution Areas

### High Priority
- **Mobile Accessibility**: Touch interface improvements
- **Voice Recognition**: Enhanced speech-to-text accuracy
- **AI Integration**: Better flashcard generation
- **Performance**: Loading time optimizations

### Medium Priority
- **Internationalization**: Multi-language support
- **Themes**: High contrast and dark mode options
- **Analytics**: Learning progress tracking
- **Export Features**: PDF and audio export

### Documentation
- **User Guides**: Step-by-step tutorials
- **API Documentation**: Server endpoint documentation
- **Accessibility Guide**: Best practices for users
- **Deployment Guide**: Production setup instructions

## 🐛 Bug Reports

When reporting bugs, please include:

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**Accessibility Impact**
How does this affect users with disabilities?

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 10, macOS]
- Browser: [e.g. Chrome 91, Firefox 89]
- Assistive Technology: [e.g. NVDA, VoiceOver]
- Device: [e.g. Desktop, iPhone 12]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to accessibility?**
Describe the accessibility problem or opportunity.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Target Users**
Which disability communities would benefit?

**Additional context**
Add any other context or screenshots.
```

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special recognition for accessibility improvements

## 📚 Resources

### Accessibility Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Resources](https://webaim.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### Development Resources
- [MDN Web Docs](https://developer.mozilla.org/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

## 📞 Getting Help

- **GitHub Issues**: Technical questions and bug reports
- **GitHub Discussions**: General questions and ideas
- **Accessibility Questions**: Priority support for accessibility improvements

## 🤝 Code of Conduct

### Our Pledge
We are committed to making participation in EchoLearn a harassment-free experience for everyone, regardless of:
- Disability status
- Age, body size, visible or invisible disability
- Ethnicity, sex characteristics, gender identity and expression
- Level of experience, education, socio-economic status
- Nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards
Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members
- Prioritizing accessibility in all contributions

### Enforcement
Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

---

**Thank you for helping make learning accessible for everyone!** 🌟

*Every contribution, no matter how small, makes a difference in the lives of students with disabilities.*