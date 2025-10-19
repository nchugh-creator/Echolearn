// Global variables
let currentUser = null;
let currentSection = 'home';
let flashcards = [];
let currentCardIndex = 0;
let recognition = null;
let synthesis = window.speechSynthesis;
let isRecording = false;
let isSpeaking = false;
let isPdfSpeaking = false;
let currentPdfText = '';
let pdfUtterance = null;
let speechRate = 1;
let speechPitch = 1;
let selectedVoice = null;
let availableVoices = [];

// Rewards System Variables
let userBalance = 0;
let userAchievements = {};
let rewardsData = {
    activities: {
        note: { coins: 10, name: 'Take Notes' },
        flashcard: { coins: 25, name: 'Generate Flashcards' },
        study: { coins: 15, name: 'Study Session' },
        speech: { coins: 5, name: 'Voice Recording' },
        daily: { coins: 20, name: 'Daily Login' },
        feedback: { coins: 50, name: 'Share Feedback' }
    },
    achievements: {
        'first-note': { target: 1, current: 0, coins: 100 },
        'flashcard-master': { target: 10, current: 0, coins: 250 },
        'daily-learner': { target: 7, current: 0, coins: 150 },
        'voice-champion': { target: 50, current: 0, coins: 300 }
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = handleSpeechResult;
        recognition.onerror = handleSpeechError;
        recognition.onend = handleSpeechEnd;
    } else {
        // Disable speech features if not supported
        document.getElementById('startRecording').disabled = true;
        document.getElementById('stopRecording').disabled = true;
        showToast('Speech recognition not supported in this browser', 'error');
    }

    // Initialize speech synthesis voices
    initializeVoices();

    // Load saved notes
    loadSavedNotes();

    // Check AI/Bedrock status
    checkBedrockStatus();
}

function initializeVoices() {
    console.log('Initializing voices...');

    // Load voices when they become available
    function loadVoices() {
        availableVoices = synthesis.getVoices();
        console.log('Available voices:', availableVoices.length);
        console.log('Voices:', availableVoices.map(v => `${v.name} (${v.lang})`));

        populateVoiceSelect();

        // Set a default friendly voice
        setDefaultVoice();
    }

    // Voices might load asynchronously
    if (synthesis.onvoiceschanged !== undefined) {
        synthesis.onvoiceschanged = loadVoices;
    }

    // Try to load voices immediately (some browsers)
    loadVoices();

    // Fallback: try again after a short delay
    setTimeout(loadVoices, 100);

    // Another fallback for slower systems
    setTimeout(loadVoices, 1000);
}

function populateVoiceSelect() {
    const voiceSelect = document.getElementById('voiceSelect');
    if (!voiceSelect) return;

    voiceSelect.innerHTML = '';

    if (availableVoices.length === 0) {
        voiceSelect.innerHTML = '<option value="">No voices available</option>';
        return;
    }

    // Filter for English voices and prioritize natural-sounding ones
    const englishVoices = availableVoices.filter(voice =>
        voice.lang.startsWith('en') || voice.lang === 'en-US' || voice.lang === 'en-GB'
    );

    // Sort voices to put better ones first
    const sortedVoices = englishVoices.sort((a, b) => {
        // Prioritize voices with "natural", "premium", or female names
        const aScore = getVoiceScore(a);
        const bScore = getVoiceScore(b);
        return bScore - aScore;
    });

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Default Voice';
    voiceSelect.appendChild(defaultOption);

    // Add voice options
    sortedVoices.forEach((voice, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });
}

function getVoiceScore(voice) {
    let score = 0;
    const name = voice.name.toLowerCase();

    // Prefer natural/premium voices
    if (name.includes('natural') || name.includes('premium') || name.includes('neural')) score += 10;

    // Prefer female voices (often sound friendlier)
    if (name.includes('female') || name.includes('woman') ||
        name.includes('samantha') || name.includes('alex') ||
        name.includes('karen') || name.includes('susan') ||
        name.includes('victoria') || name.includes('allison')) score += 5;

    // Prefer US English
    if (voice.lang === 'en-US') score += 3;

    // Avoid robotic-sounding voices
    if (name.includes('robot') || name.includes('machine') || name.includes('computer')) score -= 5;

    return score;
}

function setDefaultVoice() {
    if (availableVoices.length === 0) {
        console.log('No voices available for default selection');
        return;
    }

    console.log('Setting default voice from', availableVoices.length, 'available voices');

    // Try to find a good default voice
    const preferredVoices = availableVoices.filter(voice => {
        const name = voice.name.toLowerCase();
        return (voice.lang === 'en-US' || voice.lang.startsWith('en')) &&
            (name.includes('natural') || name.includes('samantha') ||
                name.includes('alex') || name.includes('karen'));
    });

    if (preferredVoices.length > 0) {
        selectedVoice = preferredVoices[0];
        console.log('Selected preferred voice:', selectedVoice.name);
    } else {
        // Fallback to first English voice
        const englishVoices = availableVoices.filter(voice =>
            voice.lang.startsWith('en')
        );
        if (englishVoices.length > 0) {
            selectedVoice = englishVoices[0];
            console.log('Selected English voice:', selectedVoice.name);
        } else {
            selectedVoice = availableVoices[0];
            console.log('Selected first available voice:', selectedVoice.name);
        }
    }
}

function setupEventListeners() {
    // Authentication forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);

    // Speech controls for notes
    document.getElementById('startRecording').addEventListener('click', startRecording);
    document.getElementById('stopRecording').addEventListener('click', stopRecording);
    document.getElementById('playNotes').addEventListener('click', readNotesAloud);
    document.getElementById('pauseNotesSpeech').addEventListener('click', pauseNotesSpeech);

    // PDF speech controls
    document.getElementById('notesPdfFile').addEventListener('change', handlePdfUpload);
    document.getElementById('testSpeech').addEventListener('click', testSpeechSynthesis);
    document.getElementById('playPdfText').addEventListener('click', readPdfAloud);
    document.getElementById('pausePdfSpeech').addEventListener('click', pausePdfSpeech);
    document.getElementById('stopPdfSpeech').addEventListener('click', stopPdfSpeech);
    document.getElementById('speechRate').addEventListener('input', updateSpeechRate);
    document.getElementById('speechPitch').addEventListener('input', updateSpeechPitch);
    document.getElementById('voiceSelect').addEventListener('change', updateSelectedVoice);

    // Notes actions
    document.getElementById('saveNotes').addEventListener('click', saveNotes);
    document.getElementById('clearNotes').addEventListener('click', clearNotes);

    // File upload for flashcards
    document.getElementById('pdfFile').addEventListener('change', handleFileSelect);

    // Flashcard navigation
    document.getElementById('prevCard').addEventListener('click', () => navigateCard(-1));
    document.getElementById('nextCard').addEventListener('click', () => navigateCard(1));

    // Modal close on outside click
    document.getElementById('authModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeAuth();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);

    // Feedback form
    document.getElementById('feedbackForm').addEventListener('submit', handleFeedbackSubmit);
    document.getElementById('feedbackMessage').addEventListener('input', updateCharCounter);

    // Star rating
    setupStarRating();
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName + 'Section').classList.add('active');
    currentSection = sectionName;

    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Announce section change for screen readers
    announceToScreenReader(`Navigated to ${sectionName} section`);
}

function handleKeyboardNavigation(e) {
    // Escape key closes modals
    if (e.key === 'Escape') {
        closeAuth();
    }

    // Arrow keys for flashcard navigation
    if (currentSection === 'flashcards' && flashcards.length > 0) {
        if (e.key === 'ArrowLeft') {
            navigateCard(-1);
        } else if (e.key === 'ArrowRight') {
            navigateCard(1);
        } else if (e.key === ' ') {
            e.preventDefault();
            flipCurrentCard();
        }
    }
}

// Authentication functions
function showAuth() {
    document.getElementById('authModal').style.display = 'block';
    document.getElementById('authModal').setAttribute('aria-hidden', 'false');
    document.getElementById('loginEmail').focus();
}

function closeAuth() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('authModal').setAttribute('aria-hidden', 'true');
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.tab-btn').classList.add('active');
    document.getElementById('authTitle').textContent = 'Login';
}

function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('authTitle').textContent = 'Sign Up';
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Simulate login (in real app, this would be an API call)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
        updateAuthUI();
        closeAuth();
        showToast('Login successful! Welcome to EchoLearn!', 'success');
        updateProfileDisplay();
    } else {
        showToast('Invalid email or password', 'error');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('signupName').value,
        email: document.getElementById('signupEmail').value,
        password: document.getElementById('signupPassword').value,
        city: document.getElementById('signupCity').value,
        age: document.getElementById('signupAge').value,
        disability: document.getElementById('signupDisability').value,
        memo: document.getElementById('signupMemo').value,
        id: Date.now().toString()
    };

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.email === formData.email)) {
        showToast('User with this email already exists', 'error');
        return;
    }

    // Save user
    users.push(formData);
    localStorage.setItem('users', JSON.stringify(users));

    // Auto-login
    currentUser = formData;
    localStorage.setItem('currentUser', JSON.stringify(formData));

    showMainApp();
    updateAuthUI();
    closeAuth();
    showToast('Account created successfully! Welcome to EchoLearn!', 'success');
    updateProfileDisplay();
}

function checkAuthStatus() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
        updateAuthUI();
        updateProfileDisplay();
    } else {
        showLoginRequired();
    }
}

function showLoginRequired() {
    document.getElementById('loginRequired').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';

    // Hide navigation links
    const navButtons = document.querySelectorAll('.nav-links .nav-btn:not(#authBtn)');
    navButtons.forEach(btn => btn.style.display = 'none');
}

function showMainApp() {
    document.getElementById('loginRequired').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';

    // Show navigation links
    const navButtons = document.querySelectorAll('.nav-links .nav-btn:not(#authBtn)');
    navButtons.forEach(btn => btn.style.display = 'inline-block');

    // Show home section by default
    showSection('home');
}

function updateAuthUI() {
    const authBtn = document.getElementById('authBtn');
    if (currentUser) {
        authBtn.textContent = currentUser.name.split(' ')[0];
        authBtn.onclick = () => showSection('profile');
    } else {
        authBtn.textContent = 'Login';
        authBtn.onclick = showAuth;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLoginRequired();
    updateAuthUI();
    updateProfileDisplay();
    showToast('Logged out successfully', 'success');
}

function updateProfileDisplay() {
    if (currentUser) {
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileLocation').textContent = currentUser.city;
        document.getElementById('profileAge').textContent = currentUser.age;
        document.getElementById('profileDisability').textContent =
            currentUser.disability || 'Not specified';
        document.getElementById('profileMemo').textContent =
            currentUser.memo || 'No description provided';

        // Set initials
        const initials = currentUser.name.split(' ').map(n => n[0]).join('');
        document.getElementById('profileInitials').textContent = initials;
    } else {
        document.getElementById('profileName').textContent = 'Please log in to view your profile';
        document.getElementById('profileLocation').textContent = '';
        document.getElementById('profileAge').textContent = '-';
        document.getElementById('profileDisability').textContent = '-';
        document.getElementById('profileMemo').textContent = '-';
        document.getElementById('profileInitials').textContent = '?';
    }
}

// Speech Recognition Functions
function startRecording() {
    if (!recognition) {
        showToast('Speech recognition not available', 'error');
        return;
    }

    if (!isRecording) {
        recognition.start();
        isRecording = true;
        document.getElementById('startRecording').disabled = true;
        document.getElementById('stopRecording').disabled = false;
        showToast('Recording started...', 'success');
        announceToScreenReader('Voice recording started');
    }
}

function stopRecording() {
    if (recognition && isRecording) {
        recognition.stop();
        isRecording = false;
        document.getElementById('startRecording').disabled = false;
        document.getElementById('stopRecording').disabled = true;
        showToast('Recording stopped', 'success');
        announceToScreenReader('Voice recording stopped');
    }
}

function handleSpeechResult(event) {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript;
        } else {
            interimTranscript += transcript;
        }
    }

    const notesText = document.getElementById('notesText');
    if (finalTranscript) {
        notesText.value += finalTranscript + ' ';
    }
}

function handleSpeechError(event) {
    console.error('Speech recognition error:', event.error);
    showToast('Speech recognition error: ' + event.error, 'error');
    stopRecording();
}

function handleSpeechEnd() {
    isRecording = false;
    document.getElementById('startRecording').disabled = false;
    document.getElementById('stopRecording').disabled = true;
}

// Test Speech Synthesis Function
function testSpeechSynthesis() {
    console.log('Testing speech synthesis...');

    if (!synthesis) {
        showToast('Speech synthesis not available', 'error');
        return;
    }

    const testText = 'Hello! This is a test of the speech synthesis. If you can hear this, the voice system is working correctly.';
    const utterance = new SpeechSynthesisUtterance(testText);

    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = 0.9;

    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Using voice:', selectedVoice.name);
    }

    utterance.onstart = () => {
        console.log('Test speech started');
        showToast('Testing speech...', 'success');
    };

    utterance.onend = () => {
        console.log('Test speech ended');
        showToast('Speech test completed', 'success');
    };

    utterance.onerror = (event) => {
        console.error('Test speech error:', event);
        showToast('Speech test failed: ' + event.error, 'error');
    };

    console.log('Starting speech synthesis...');
    synthesis.speak(utterance);
}

// PDF Upload and Text-to-Speech Functions
async function handlePdfUpload(event) {
    console.log('PDF upload started');
    const file = event.target.files[0];

    if (!file) {
        showToast('No file selected', 'error');
        return;
    }

    if (file.type !== 'application/pdf') {
        showToast('Please select a PDF file', 'error');
        console.log('File type:', file.type);
        return;
    }

    console.log('Processing PDF:', file.name, 'Size:', file.size);
    showLoading(true);
    document.getElementById('pdfStatus').textContent = 'Processing...';

    try {
        const formData = new FormData();
        formData.append('pdf', file);

        console.log('Sending request to /api/extract-text');
        const response = await fetch('/api/extract-text', {
            method: 'POST',
            body: formData
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Extracted text length:', data.text ? data.text.length : 0);
        console.log('First 100 chars:', data.text ? data.text.substring(0, 100) : 'No text');

        currentPdfText = data.text;

        // Display PDF info and text
        document.getElementById('pdfFileName').textContent = file.name;
        document.getElementById('pdfStatus').textContent = 'Ready to read';
        document.getElementById('pdfTextContent').textContent = currentPdfText;
        document.getElementById('pdfControls').style.display = 'block';

        showToast('PDF loaded successfully!', 'success');

    } catch (error) {
        console.error('PDF processing error:', error);
        showToast('Failed to process PDF: ' + error.message, 'error');
        document.getElementById('pdfStatus').textContent = 'Error';

        // Fallback: try to use sample text for testing
        console.log('Using fallback sample text');
        currentPdfText = 'This is a sample text for testing the text-to-speech functionality. The PDF processing failed, but you can still test the speech synthesis with this sample content.';
        document.getElementById('pdfFileName').textContent = file.name + ' (Sample Text)';
        document.getElementById('pdfStatus').textContent = 'Using sample text';
        document.getElementById('pdfTextContent').textContent = currentPdfText;
        document.getElementById('pdfControls').style.display = 'block';
        showToast('Using sample text for testing', 'success');
    } finally {
        showLoading(false);
    }
}

function readPdfAloud() {
    console.log('readPdfAloud called');
    console.log('currentPdfText:', currentPdfText);
    console.log('currentPdfText length:', currentPdfText ? currentPdfText.length : 0);

    if (!currentPdfText || !currentPdfText.trim()) {
        showToast('No PDF text to read. Please upload a PDF first.', 'error');
        console.log('No PDF text available');
        return;
    }

    if (isPdfSpeaking) {
        // Resume if paused
        if (synthesis.paused) {
            synthesis.resume();
            updatePdfSpeechControls(true);
            return;
        }
        // Stop if already speaking
        stopPdfSpeech();
        return;
    }

    console.log('Creating speech utterance...');

    // Create new utterance with friendly settings
    pdfUtterance = new SpeechSynthesisUtterance(currentPdfText);
    pdfUtterance.rate = speechRate;
    pdfUtterance.pitch = speechPitch;
    pdfUtterance.volume = 0.9; // Slightly softer volume

    // Use selected voice or default to a friendly one
    if (selectedVoice) {
        pdfUtterance.voice = selectedVoice;
        console.log('Using selected voice:', selectedVoice.name);
    } else {
        console.log('No voice selected, using default');
    }

    // Set up event handlers
    pdfUtterance.onstart = () => {
        isPdfSpeaking = true;
        updatePdfSpeechControls(true);
        document.getElementById('readingProgress').style.display = 'block';
        document.getElementById('progressText').textContent = 'Reading PDF...';
        announceToScreenReader('Started reading PDF aloud');
    };

    pdfUtterance.onend = () => {
        isPdfSpeaking = false;
        updatePdfSpeechControls(false);
        document.getElementById('readingProgress').style.display = 'none';
        document.getElementById('progressFill').style.width = '0%';
        announceToScreenReader('Finished reading PDF');
    };

    pdfUtterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        showToast('Speech error occurred', 'error');
        stopPdfSpeech();
    };

    // Start speaking
    synthesis.speak(pdfUtterance);

    // Simulate progress (since we can't get real progress from speech synthesis)
    simulateReadingProgress();
}

function pausePdfSpeech() {
    if (isPdfSpeaking && !synthesis.paused) {
        synthesis.pause();
        updatePdfSpeechControls(false);
        document.getElementById('progressText').textContent = 'Paused';
        announceToScreenReader('PDF reading paused');
    }
}

function stopPdfSpeech() {
    if (isPdfSpeaking || synthesis.speaking) {
        synthesis.cancel();
        isPdfSpeaking = false;
        updatePdfSpeechControls(false);
        document.getElementById('readingProgress').style.display = 'none';
        document.getElementById('progressFill').style.width = '0%';
        announceToScreenReader('PDF reading stopped');
    }
}

function updateSpeechRate(event) {
    speechRate = parseFloat(event.target.value);
    document.getElementById('rateValue').textContent = speechRate + 'x';

    // If currently speaking, update the rate
    if (isPdfSpeaking && pdfUtterance) {
        // Note: Changing rate mid-speech requires restarting
        const wasPlaying = !synthesis.paused;
        if (wasPlaying) {
            synthesis.cancel();
            // Small delay to ensure cancellation completes
            setTimeout(() => {
                pdfUtterance.rate = speechRate;
                pdfUtterance.pitch = speechPitch;
                if (selectedVoice) pdfUtterance.voice = selectedVoice;
                synthesis.speak(pdfUtterance);
            }, 100);
        }
    }
}

function updateSpeechPitch(event) {
    speechPitch = parseFloat(event.target.value);
    document.getElementById('pitchValue').textContent = speechPitch + 'x';

    // If currently speaking, update the pitch
    if (isPdfSpeaking && pdfUtterance) {
        const wasPlaying = !synthesis.paused;
        if (wasPlaying) {
            synthesis.cancel();
            setTimeout(() => {
                pdfUtterance.rate = speechRate;
                pdfUtterance.pitch = speechPitch;
                if (selectedVoice) pdfUtterance.voice = selectedVoice;
                synthesis.speak(pdfUtterance);
            }, 100);
        }
    }
}

function updateSelectedVoice(event) {
    const voiceIndex = event.target.value;
    if (voiceIndex === '') {
        selectedVoice = null;
    } else {
        const englishVoices = availableVoices.filter(voice =>
            voice.lang.startsWith('en') || voice.lang === 'en-US' || voice.lang === 'en-GB'
        );
        selectedVoice = englishVoices[parseInt(voiceIndex)];
    }

    // Test the voice with a short phrase
    if (selectedVoice) {
        const testUtterance = new SpeechSynthesisUtterance('Hello, this is your selected voice.');
        testUtterance.voice = selectedVoice;
        testUtterance.rate = speechRate;
        testUtterance.pitch = speechPitch;
        testUtterance.volume = 0.7;
        synthesis.speak(testUtterance);
    }
}

function updatePdfSpeechControls(isPlaying) {
    document.getElementById('playPdfText').disabled = isPlaying;
    document.getElementById('pausePdfSpeech').disabled = !isPlaying;
    document.getElementById('stopPdfSpeech').disabled = !isPlaying;

    // Update button text
    const playBtn = document.getElementById('playPdfText');
    if (isPlaying) {
        playBtn.innerHTML = '⏸️ Pause PDF';
    } else {
        playBtn.innerHTML = '🔊 Read PDF Aloud';
    }
}

function simulateReadingProgress() {
    if (!isPdfSpeaking) return;

    const progressFill = document.getElementById('progressFill');
    const textLength = currentPdfText.length;
    const estimatedDuration = (textLength / (speechRate * 200)) * 1000; // Rough estimate
    const updateInterval = 100;
    const increment = (updateInterval / estimatedDuration) * 100;

    let currentProgress = 0;

    const progressInterval = setInterval(() => {
        if (!isPdfSpeaking || synthesis.paused) {
            clearInterval(progressInterval);
            return;
        }

        currentProgress += increment;
        if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(progressInterval);
        }

        progressFill.style.width = currentProgress + '%';
    }, updateInterval);
}

// Text-to-Speech Functions for Notes
function readNotesAloud() {
    const text = document.getElementById('notesText').value;
    if (!text.trim()) {
        showToast('No text to read', 'error');
        return;
    }

    if (isSpeaking) {
        synthesis.cancel();
        isSpeaking = false;
        document.getElementById('playNotes').disabled = false;
        document.getElementById('pauseNotesSpeech').disabled = true;
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = 0.9; // Softer volume

    // Use selected voice or default friendly voice
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
        isSpeaking = true;
        document.getElementById('playNotes').disabled = true;
        document.getElementById('pauseNotesSpeech').disabled = false;
        announceToScreenReader('Started reading notes aloud');
    };

    utterance.onend = () => {
        isSpeaking = false;
        document.getElementById('playNotes').disabled = false;
        document.getElementById('pauseNotesSpeech').disabled = true;
        announceToScreenReader('Finished reading notes');
    };

    synthesis.speak(utterance);
}

function pauseNotesSpeech() {
    if (isSpeaking) {
        synthesis.cancel();
        isSpeaking = false;
        document.getElementById('playNotes').disabled = false;
        document.getElementById('pauseNotesSpeech').disabled = true;
        announceToScreenReader('Notes speech paused');
    }
}

// Notes Management
function saveNotes() {
    const text = document.getElementById('notesText').value;
    if (!text.trim()) {
        showToast('No notes to save', 'error');
        return;
    }

    const note = {
        id: Date.now().toString(),
        content: text,
        date: new Date().toLocaleString(),
        userId: currentUser ? currentUser.id : 'anonymous'
    };

    const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
    savedNotes.unshift(note);
    localStorage.setItem('savedNotes', JSON.stringify(savedNotes));

    loadSavedNotes();
    showToast('Notes saved successfully!', 'success');
    announceToScreenReader('Notes saved');
}

function clearNotes() {
    if (confirm('Are you sure you want to clear all notes?')) {
        document.getElementById('notesText').value = '';
        showToast('Notes cleared', 'success');
        announceToScreenReader('Notes cleared');
    }
}

function loadSavedNotes() {
    const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
    const userNotes = currentUser ?
        savedNotes.filter(note => note.userId === currentUser.id) :
        savedNotes.filter(note => note.userId === 'anonymous');

    const notesList = document.getElementById('notesList');
    notesList.innerHTML = '';

    if (userNotes.length === 0) {
        notesList.innerHTML = '<p>No saved notes yet.</p>';
        return;
    }

    userNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-item';
        noteElement.innerHTML = `
            <div class="note-date">${note.date}</div>
            <div class="note-content">${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</div>
            <div class="note-actions">
                <button onclick="loadNote('${note.id}')" aria-label="Load this note">Load</button>
                <button onclick="deleteNote('${note.id}')" aria-label="Delete this note">Delete</button>
                <button onclick="readNoteAloud('${note.id}')" aria-label="Read this note aloud">🔊</button>
            </div>
        `;
        notesList.appendChild(noteElement);
    });
}

function loadNote(noteId) {
    const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
    const note = savedNotes.find(n => n.id === noteId);
    if (note) {
        document.getElementById('notesText').value = note.content;
        showToast('Note loaded', 'success');
    }
}

function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
        const filteredNotes = savedNotes.filter(n => n.id !== noteId);
        localStorage.setItem('savedNotes', JSON.stringify(filteredNotes));
        loadSavedNotes();
        showToast('Note deleted', 'success');
    }
}

function readNoteAloud(noteId) {
    const savedNotes = JSON.parse(localStorage.getItem('savedNotes') || '[]');
    const note = savedNotes.find(n => n.id === noteId);
    if (note) {
        const utterance = new SpeechSynthesisUtterance(note.content);
        utterance.rate = speechRate;
        utterance.pitch = speechPitch;
        utterance.volume = 0.9;

        // Use selected voice
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        synthesis.speak(utterance);
    }
}

// File Upload and Flashcard Generation
function handleFileSelect(event) {
    const file = event.target.files[0];
    const generateBtn = document.getElementById('generateBtn');

    if (file && file.type === 'application/pdf') {
        generateBtn.disabled = false;
        showToast('PDF file selected: ' + file.name, 'success');
    } else {
        generateBtn.disabled = true;
        if (file) {
            showToast('Please select a PDF file', 'error');
        }
    }
}

async function uploadPDF() {
    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];

    if (!file) {
        showToast('Please select a PDF file first', 'error');
        return;
    }

    showLoading(true);

    try {
        const formData = new FormData();
        formData.append('pdf', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        flashcards = data.flashcards || generateSampleFlashcards(file.name);
        currentCardIndex = 0;

        displayFlashcards();
        showToast('Flashcards generated successfully!', 'success');

    } catch (error) {
        console.error('Upload error:', error);
        // Generate sample flashcards as fallback
        flashcards = generateSampleFlashcards(file.name);
        currentCardIndex = 0;
        displayFlashcards();
        showToast('Generated sample flashcards (server unavailable)', 'success');
    } finally {
        showLoading(false);
    }
}

function generateSampleFlashcards(filename) {
    // Generate sample flashcards based on filename or generic content
    return [
        {
            question: "What is the main topic of this document?",
            answer: `The document "${filename}" covers key concepts and important information for learning.`
        },
        {
            question: "What are the key learning objectives?",
            answer: "Understanding the fundamental concepts, applying knowledge practically, and retaining information effectively."
        },
        {
            question: "How can this information be applied?",
            answer: "The concepts can be applied through practice exercises, real-world scenarios, and continued study."
        },
        {
            question: "What are the main benefits of studying this material?",
            answer: "Enhanced understanding, improved skills, and better preparation for assessments or practical applications."
        },
        {
            question: "What should be reviewed regularly?",
            answer: "Key definitions, important formulas or concepts, and practical examples from the material."
        }
    ];
}

function displayFlashcards() {
    if (flashcards.length === 0) return;

    document.getElementById('flashcardControls').style.display = 'flex';
    updateFlashcardDisplay();
    updateCardCounter();
    updateNavigationButtons();
}

function updateFlashcardDisplay() {
    const flashcardDisplay = document.getElementById('flashcardDisplay');
    const card = flashcards[currentCardIndex];

    flashcardDisplay.innerHTML = `
        <div class="flashcard" onclick="flipCurrentCard()" tabindex="0" 
             role="button" aria-label="Flashcard ${currentCardIndex + 1}. Click to flip.">
            <div class="flashcard-content" id="cardContent">
                ${card.question}
            </div>
            <div class="card-hint">Click to reveal answer</div>
        </div>
    `;

    // Add keyboard support for flashcard
    const flashcardElement = flashcardDisplay.querySelector('.flashcard');
    flashcardElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            flipCurrentCard();
        }
    });
}

function flipCurrentCard() {
    const flashcardElement = document.querySelector('.flashcard');
    const cardContent = document.getElementById('cardContent');
    const card = flashcards[currentCardIndex];

    if (flashcardElement.classList.contains('flipped')) {
        // Show question
        cardContent.textContent = card.question;
        flashcardElement.classList.remove('flipped');
        document.querySelector('.card-hint').textContent = 'Click to reveal answer';
        announceToScreenReader('Showing question: ' + card.question);
    } else {
        // Show answer
        cardContent.textContent = card.answer;
        flashcardElement.classList.add('flipped');
        document.querySelector('.card-hint').textContent = 'Click to see question';
        announceToScreenReader('Showing answer: ' + card.answer);
    }
}

function navigateCard(direction) {
    const newIndex = currentCardIndex + direction;

    if (newIndex >= 0 && newIndex < flashcards.length) {
        currentCardIndex = newIndex;
        updateFlashcardDisplay();
        updateCardCounter();
        updateNavigationButtons();

        announceToScreenReader(`Card ${currentCardIndex + 1} of ${flashcards.length}`);
    }
}

function updateCardCounter() {
    document.getElementById('cardCounter').textContent =
        `Card ${currentCardIndex + 1} of ${flashcards.length}`;
}

function updateNavigationButtons() {
    document.getElementById('prevCard').disabled = currentCardIndex === 0;
    document.getElementById('nextCard').disabled = currentCardIndex === flashcards.length - 1;
}

// Utility Functions
function showLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

function editProfile() {
    if (!currentUser) {
        showToast('Please log in first', 'error');
        return;
    }

    // Simple implementation - in a real app, this would open an edit form
    const newName = prompt('Enter new name:', currentUser.name);
    if (newName && newName.trim()) {
        currentUser.name = newName.trim();

        // Update in localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        updateAuthUI();
        updateProfileDisplay();
        showToast('Profile updated successfully!', 'success');
    }
}

// Check Bedrock AI status
async function checkBedrockStatus() {
    const statusElement = document.getElementById('aiStatus');
    const iconElement = document.getElementById('aiStatusIcon');
    const textElement = document.getElementById('aiStatusText');

    try {
        const response = await fetch('/api/bedrock-status');
        const data = await response.json();

        if (data.status === 'connected') {
            statusElement.className = 'ai-status connected';
            iconElement.textContent = '';
            textElement.textContent = `AI Connected: ${data.model.split('.')[1]} (${data.region})`;
        } else {
            statusElement.className = 'ai-status fallback';
            iconElement.textContent = '';
            textElement.textContent = 'AI Unavailable - Using Rule-Based Generation';
        }
    } catch (error) {
        console.error('Failed to check Bedrock status:', error);
        statusElement.className = 'ai-status fallback';
        iconElement.textContent = '';
        textElement.textContent = 'AI Status Unknown - Using Rule-Based Generation';
    }
}

// Feedback Form Functions
function setupStarRating() {
    const stars = document.querySelectorAll('.star-rating input');
    const ratingText = document.getElementById('ratingText');

    const ratingLabels = {
        '1': 'Poor - Needs significant improvement',
        '2': 'Fair - Some issues to address',
        '3': 'Good - Generally satisfactory',
        '4': 'Very Good - Exceeds expectations',
        '5': 'Excellent - Outstanding experience'
    };

    stars.forEach(star => {
        star.addEventListener('change', function () {
            const rating = this.value;
            ratingText.textContent = ratingLabels[rating];
            ratingText.style.color = '#667eea';
        });
    });
}

function updateCharCounter() {
    const textarea = document.getElementById('feedbackMessage');
    const counter = document.getElementById('charCount');
    const currentLength = textarea.value.length;
    const maxLength = 1000;

    counter.textContent = currentLength;

    // Update counter styling based on character count
    const counterElement = counter.parentElement;
    counterElement.classList.remove('warning', 'danger');

    if (currentLength > maxLength * 0.9) {
        counterElement.classList.add('danger');
    } else if (currentLength > maxLength * 0.75) {
        counterElement.classList.add('warning');
    }
}

async function handleFeedbackSubmit(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('feedbackName').value,
        email: document.getElementById('feedbackEmail').value,
        type: document.getElementById('feedbackType').value,
        disability: document.getElementById('feedbackDisability').value,
        rating: document.querySelector('input[name="rating"]:checked')?.value || '',
        subject: document.getElementById('feedbackSubject').value,
        message: document.getElementById('feedbackMessage').value,
        sendCopy: document.getElementById('feedbackCopy').checked,
        updates: document.getElementById('feedbackUpdates').checked,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        currentUser: currentUser ? currentUser.id : 'anonymous'
    };

    // Validate required fields
    if (!formData.name || !formData.email || !formData.type || !formData.subject || !formData.message) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch('/api/submit-feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to submit feedback');
        }

        const result = await response.json();

        // Show success message
        document.getElementById('feedbackForm').style.display = 'none';
        document.getElementById('feedbackSuccess').style.display = 'block';

        showToast('Feedback submitted successfully!', 'success');

        // Scroll to success message
        document.getElementById('feedbackSuccess').scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

    } catch (error) {
        console.error('Feedback submission error:', error);
        showToast('Failed to submit feedback. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function clearFeedbackForm() {
    if (confirm('Are you sure you want to clear all form data?')) {
        document.getElementById('feedbackForm').reset();
        document.getElementById('ratingText').textContent = 'Click to rate';
        document.getElementById('ratingText').style.color = '#666';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('charCount').parentElement.classList.remove('warning', 'danger');
        showToast('Form cleared', 'success');
    }
}

function resetFeedbackForm() {
    document.getElementById('feedbackForm').style.display = 'block';
    document.getElementById('feedbackSuccess').style.display = 'none';
    clearFeedbackForm();
}

// Initialize drag and drop for file uploads
document.addEventListener('DOMContentLoaded', function () {
    // Flashcards upload area
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        setupDragAndDrop(uploadArea, 'pdfFile', handleFileSelect);
    }

    // Notes PDF upload area
    const pdfUploadArea = document.querySelector('.pdf-upload-area');
    if (pdfUploadArea) {
        setupDragAndDrop(pdfUploadArea, 'notesPdfFile', handlePdfUpload);
    }
});

function setupDragAndDrop(uploadArea, fileInputId, handleFunction) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        uploadArea.classList.add('highlight');
    }

    function unhighlight(e) {
        uploadArea.classList.remove('highlight');
    }

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            const fileInput = document.getElementById(fileInputId);
            fileInput.files = files;

            // Create a synthetic event object
            const syntheticEvent = {
                target: { files: files }
            };

            handleFunction(syntheticEvent);
        }
    }
}
// ==================== REWARDS SYSTEM ====================

// Initialize rewards system
function initializeRewards() {
    loadUserBalance();
    loadUserAchievements();
    updateBalanceDisplay();
    updateAchievementsDisplay();
    checkDailyLogin();
}

// Load user balance from localStorage
function loadUserBalance() {
    const savedBalance = localStorage.getItem('echolearn_balance');
    userBalance = savedBalance ? parseInt(savedBalance) : 50; // Welcome bonus

    // Save welcome bonus if new user
    if (!savedBalance) {
        saveUserBalance();
        addTransaction('Welcome bonus', 50, 'positive');
    }
}

// Save user balance to localStorage
function saveUserBalance() {
    localStorage.setItem('echolearn_balance', userBalance.toString());
}

// Load user achievements from localStorage
function loadUserAchievements() {
    const savedAchievements = localStorage.getItem('echolearn_achievements');
    if (savedAchievements) {
        rewardsData.achievements = JSON.parse(savedAchievements);
    }
}

// Save user achievements to localStorage
function saveUserAchievements() {
    localStorage.setItem('echolearn_achievements', JSON.stringify(rewardsData.achievements));
}

// Award coins for activity
function awardCoins(activity, customAmount = null) {
    const coins = customAmount || rewardsData.activities[activity]?.coins || 0;
    if (coins > 0) {
        userBalance += coins;
        saveUserBalance();
        updateBalanceDisplay();

        // Show coin animation
        showCoinAnimation(coins);

        // Add transaction
        const activityName = rewardsData.activities[activity]?.name || 'Activity';
        addTransaction(activityName, coins, 'positive');

        // Update achievements
        updateAchievementProgress(activity);

        // Show toast notification
        showToast(`🪙 Earned ${coins} EchoCoins for ${activityName}!`, 'success');
    }
}

// Update balance display
function updateBalanceDisplay() {
    const balanceElement = document.getElementById('currentBalance');
    if (balanceElement) {
        balanceElement.textContent = userBalance.toLocaleString();
    }
}

// Show coin animation
function showCoinAnimation(amount) {
    const coin = document.createElement('div');
    coin.className = 'coin-earned';
    coin.textContent = `+${amount} 🪙`;
    coin.style.left = '50%';
    coin.style.top = '50%';
    document.body.appendChild(coin);

    setTimeout(() => {
        document.body.removeChild(coin);
    }, 2000);
}

// Add transaction to history
function addTransaction(description, amount, type) {
    const transactions = getTransactions();
    const transaction = {
        id: Date.now(),
        description,
        amount,
        type,
        timestamp: new Date().toISOString()
    };

    transactions.unshift(transaction);

    // Keep only last 10 transactions
    if (transactions.length > 10) {
        transactions.splice(10);
    }

    localStorage.setItem('echolearn_transactions', JSON.stringify(transactions));
    updateTransactionsDisplay();
}

// Get transactions from localStorage
function getTransactions() {
    const saved = localStorage.getItem('echolearn_transactions');
    return saved ? JSON.parse(saved) : [];
}

// Update transactions display
function updateTransactionsDisplay() {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;

    const transactions = getTransactions();

    if (transactions.length === 0) {
        transactionsList.innerHTML = '<p style="text-align: center; color: #666;">No recent activity</p>';
        return;
    }

    transactionsList.innerHTML = transactions.map(transaction => {
        const timeAgo = getTimeAgo(new Date(transaction.timestamp));
        const sign = transaction.type === 'positive' ? '+' : '-';

        return `
            <div class="transaction-item">
                <div class="transaction-icon">${transaction.type === 'positive' ? '🎉' : '💸'}</div>
                <div class="transaction-info">
                    <span class="transaction-desc">${transaction.description}</span>
                    <span class="transaction-time">${timeAgo}</span>
                </div>
                <div class="transaction-amount ${transaction.type}">${sign}${transaction.amount} 🪙</div>
            </div>
        `;
    }).join('');
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// Update achievement progress
function updateAchievementProgress(activity) {
    let updated = false;

    // Map activities to achievements
    const activityMap = {
        'note': 'first-note',
        'flashcard': 'flashcard-master',
        'speech': 'voice-champion'
    };

    const achievementKey = activityMap[activity];
    if (achievementKey && rewardsData.achievements[achievementKey]) {
        rewardsData.achievements[achievementKey].current++;

        // Check if achievement is completed
        const achievement = rewardsData.achievements[achievementKey];
        if (achievement.current >= achievement.target && !achievement.completed) {
            achievement.completed = true;
            awardCoins(null, achievement.coins);
            showToast(`🏅 Achievement Unlocked! Earned ${achievement.coins} bonus coins!`, 'success');
            updated = true;
        }
    }

    // Check daily login achievement
    checkDailyLoginAchievement();

    if (updated) {
        saveUserAchievements();
        updateAchievementsDisplay();
    }
}

// Check daily login
function checkDailyLogin() {
    const lastLogin = localStorage.getItem('echolearn_last_login');
    const today = new Date().toDateString();

    if (lastLogin !== today) {
        localStorage.setItem('echolearn_last_login', today);

        // Award daily login bonus
        setTimeout(() => {
            awardCoins('daily');
        }, 1000);

        // Update daily login streak
        updateDailyLoginStreak();
    }
}

// Update daily login streak
function updateDailyLoginStreak() {
    const streakData = JSON.parse(localStorage.getItem('echolearn_login_streak') || '{"count": 0, "lastDate": null}');
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (streakData.lastDate === yesterday) {
        streakData.count++;
    } else if (streakData.lastDate !== today) {
        streakData.count = 1;
    }

    streakData.lastDate = today;
    localStorage.setItem('echolearn_login_streak', JSON.stringify(streakData));

    // Update daily learner achievement
    rewardsData.achievements['daily-learner'].current = streakData.count;
    saveUserAchievements();
}

// Check daily login achievement
function checkDailyLoginAchievement() {
    const streakData = JSON.parse(localStorage.getItem('echolearn_login_streak') || '{"count": 0}');
    const achievement = rewardsData.achievements['daily-learner'];

    if (streakData.count >= achievement.target && !achievement.completed) {
        achievement.completed = true;
        awardCoins(null, achievement.coins);
        showToast(`🏅 Daily Learner Achievement Unlocked! Earned ${achievement.coins} bonus coins!`, 'success');
        saveUserAchievements();
        updateAchievementsDisplay();
    }
}

// Update achievements display
function updateAchievementsDisplay() {
    const achievementsList = document.getElementById('achievementsList');
    if (!achievementsList) return;

    const achievementElements = achievementsList.querySelectorAll('.achievement-item');

    achievementElements.forEach(element => {
        const achievementKey = element.dataset.achievement;
        const achievement = rewardsData.achievements[achievementKey];

        if (achievement) {
            const progressElement = element.querySelector('.achievement-progress');
            if (progressElement) {
                progressElement.textContent = `${Math.min(achievement.current, achievement.target)}/${achievement.target}`;
            }

            if (achievement.completed) {
                element.classList.remove('locked');
                element.classList.add('unlocked');
            }
        }
    });
}

// Redeem reward
function redeemReward(rewardType, cost) {
    if (userBalance >= cost) {
        userBalance -= cost;
        saveUserBalance();
        updateBalanceDisplay();

        // Add transaction
        addTransaction(`Redeemed ${rewardType}`, cost, 'negative');

        // Show success message
        showToast(`🎉 Successfully redeemed ${rewardType}! Check your profile for updates.`, 'success');

        // Apply reward (this would integrate with actual features)
        applyReward(rewardType);
    } else {
        showToast(`❌ Insufficient EchoCoins. You need ${cost - userBalance} more coins.`, 'error');
    }
}

// Apply reward (placeholder for actual implementation)
function applyReward(rewardType) {
    switch (rewardType) {
        case 'theme':
            // Unlock custom themes
            localStorage.setItem('echolearn_custom_theme', 'true');
            break;
        case 'voices':
            // Unlock premium voices
            localStorage.setItem('echolearn_premium_voices', 'true');
            break;
        case 'speed':
            // Unlock speed boost
            localStorage.setItem('echolearn_speed_boost', 'true');
            break;
        case 'badge':
            // Add achievement badge
            localStorage.setItem('echolearn_achievement_badge', 'true');
            break;
        case 'mobile':
            // Grant mobile app access
            localStorage.setItem('echolearn_mobile_access', 'true');
            break;
        case 'gift':
            // Award surprise gift (random bonus coins)
            const bonusCoins = Math.floor(Math.random() * 500) + 100;
            awardCoins(null, bonusCoins);
            showToast(`🎁 Surprise! You received ${bonusCoins} bonus EchoCoins!`, 'success');
            break;
    }
}

// Enhanced existing functions to award coins

// Override saveNotes function to award coins
const originalSaveNotes = window.saveNotes;
window.saveNotes = function () {
    if (originalSaveNotes) {
        originalSaveNotes();
    } else {
        // Original saveNotes functionality
        const notesText = document.getElementById('notesText').value.trim();
        if (notesText) {
            const notes = getSavedNotes();
            const newNote = {
                id: Date.now(),
                content: notesText,
                timestamp: new Date().toISOString()
            };
            notes.unshift(newNote);
            localStorage.setItem('echolearn_notes', JSON.stringify(notes));
            loadSavedNotes();
            document.getElementById('notesText').value = '';
            showToast('Notes saved successfully!', 'success');
        }
    }

    // Award coins for saving notes
    awardCoins('note');
};

// Override generateFlashcards to award coins
const originalGenerateFlashcards = window.uploadPDF;
window.uploadPDF = function () {
    if (originalGenerateFlashcards) {
        originalGenerateFlashcards();
    }

    // Award coins for generating flashcards
    setTimeout(() => {
        if (flashcards && flashcards.length > 0) {
            awardCoins('flashcard');
        }
    }, 2000);
};

// Override speech recording to award coins
const originalStopRecording = window.stopRecording;
window.stopRecording = function () {
    if (originalStopRecording) {
        originalStopRecording();
    }

    // Award coins for voice recording
    awardCoins('speech');
};

// Override feedback submission to award coins
const originalSubmitFeedback = document.getElementById('feedbackForm')?.onsubmit;
if (document.getElementById('feedbackForm')) {
    document.getElementById('feedbackForm').addEventListener('submit', function (e) {
        if (originalSubmitFeedback) {
            originalSubmitFeedback(e);
        }

        // Award coins for feedback
        setTimeout(() => {
            awardCoins('feedback');
        }, 1000);
    });
}

// ==================== VISA GIFT CARD SYSTEM ====================

// VISA Gift Card redemption function
function redeemVisaCard(dollarAmount, coinCost) {
    if (userBalance >= coinCost) {
        // Show confirmation dialog
        const confirmed = confirm(
            `🎉 Redeem $${dollarAmount} VISA Gift Card?\n\n` +
            `Cost: ${coinCost.toLocaleString()} EchoCoins\n` +
            `Your Balance: ${userBalance.toLocaleString()} EchoCoins\n\n` +
            `This will be delivered to your email within 24-48 hours.\n\n` +
            `Continue with redemption?`
        );

        if (confirmed) {
            // Process the redemption
            processVisaRedemption(dollarAmount, coinCost);
        }
    } else {
        const needed = coinCost - userBalance;
        showToast(
            `❌ Insufficient EchoCoins! You need ${needed.toLocaleString()} more coins to redeem this gift card. Keep learning to earn more! 📚`,
            'error'
        );

        // Show earning suggestions
        setTimeout(() => {
            showEarningSuggestions(needed);
        }, 2000);
    }
}

// Process VISA gift card redemption
function processVisaRedemption(dollarAmount, coinCost) {
    // Deduct coins
    userBalance -= coinCost;
    saveUserBalance();
    updateBalanceDisplay();

    // Add transaction
    addTransaction(`VISA Gift Card $${dollarAmount}`, coinCost, 'negative');

    // Save redemption record
    saveVisaRedemption(dollarAmount, coinCost);

    // Show processing animation
    showVisaProcessing(dollarAmount);

    // Simulate API call to VISA system
    setTimeout(() => {
        completeVisaRedemption(dollarAmount);
    }, 3000);
}

// Show VISA processing animation
function showVisaProcessing(dollarAmount) {
    const button = document.getElementById(`visa-${dollarAmount}`);
    if (button) {
        button.disabled = true;
        button.innerHTML = '🔄 Processing...';
        button.classList.add('visa-processing');
    }

    showToast('🔄 Processing your VISA gift card...', 'info');
}

// Complete VISA redemption
function completeVisaRedemption(dollarAmount) {
    // Generate mock gift card details
    const giftCardNumber = generateMockCardNumber();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Save gift card details
    const giftCard = {
        id: Date.now(),
        amount: dollarAmount,
        cardNumber: giftCardNumber,
        expiryDate: expiryDate.toISOString(),
        redeemedAt: new Date().toISOString(),
        status: 'active'
    };

    saveGiftCard(giftCard);

    // Reset button
    const button = document.getElementById(`visa-${dollarAmount}`);
    if (button) {
        button.disabled = false;
        button.innerHTML = `Redeem for ${coinCost.toLocaleString()} 🪙`;
        button.classList.remove('visa-processing');
    }

    // Show success message
    showVisaSuccess(giftCard);

    // Update achievements
    updateVisaAchievements(dollarAmount);
}

// Generate mock card number (for demo purposes)
function generateMockCardNumber() {
    const prefix = '4000'; // VISA prefix
    let number = prefix;

    for (let i = 0; i < 12; i++) {
        number += Math.floor(Math.random() * 10);
    }

    return number;
}

// Show earning suggestions
function showEarningSuggestions(needed) {
    const suggestions = [
        { activity: 'Take Notes', coins: 10, count: Math.ceil(needed / 10) },
        { activity: 'Generate Flashcards', coins: 25, count: Math.ceil(needed / 25) },
        { activity: 'Voice Recordings', coins: 5, count: Math.ceil(needed / 5) },
        { activity: 'Daily Logins', coins: 20, count: Math.ceil(needed / 20) }
    ];

    let message = `💡 Ways to earn ${needed.toLocaleString()} more coins:\n\n`;
    suggestions.forEach(suggestion => {
        if (suggestion.count <= 50) { // Only show reasonable suggestions
            message += `• ${suggestion.activity}: ${suggestion.count} times (${suggestion.coins} coins each)\n`;
        }
    });

    message += `\n🎯 Keep learning to unlock your VISA gift card!`;

    alert(message);
}

// Save VISA redemption record
function saveVisaRedemption(dollarAmount, coinCost) {
    const redemptions = getVisaRedemptions();
    const redemption = {
        id: Date.now(),
        amount: dollarAmount,
        coinCost: coinCost,
        timestamp: new Date().toISOString(),
        status: 'completed'
    };

    redemptions.unshift(redemption);
    localStorage.setItem('echolearn_visa_redemptions', JSON.stringify(redemptions));
}

// Get VISA redemptions from localStorage
function getVisaRedemptions() {
    const saved = localStorage.getItem('echolearn_visa_redemptions');
    return saved ? JSON.parse(saved) : [];
}

// Save gift card details
function saveGiftCard(giftCard) {
    const giftCards = getGiftCards();
    giftCards.unshift(giftCard);
    localStorage.setItem('echolearn_gift_cards', JSON.stringify(giftCards));
}

// Get gift cards from localStorage
function getGiftCards() {
    const saved = localStorage.getItem('echolearn_gift_cards');
    return saved ? JSON.parse(saved) : [];
}

// Show VISA success message
function showVisaSuccess(giftCard) {
    showToast(
        `🎉 SUCCESS! Your $${giftCard.amount} VISA Gift Card has been redeemed!\n\n` +
        `Card Number: ${formatCardNumber(giftCard.cardNumber)}\n` +
        `Expires: ${new Date(giftCard.expiryDate).toLocaleDateString()}\n\n` +
        `Details sent to your email! 📧`,
        'success'
    );
}

// Format card number for display
function formatCardNumber(number) {
    return number.replace(/(.{4})/g, '$1 ').trim();
}

// Update VISA-related achievements
function updateVisaAchievements(dollarAmount) {
    // Add new achievement for first VISA redemption
    if (!rewardsData.achievements['visa-redeemer']) {
        rewardsData.achievements['visa-redeemer'] = {
            target: 1,
            current: 0,
            coins: 200,
            completed: false
        };
    }

    rewardsData.achievements['visa-redeemer'].current++;

    if (rewardsData.achievements['visa-redeemer'].current >= rewardsData.achievements['visa-redeemer'].target && !rewardsData.achievements['visa-redeemer'].completed) {
        rewardsData.achievements['visa-redeemer'].completed = true;
        awardCoins(null, rewardsData.achievements['visa-redeemer'].coins);
        showToast(`🏅 VISA Redeemer Achievement Unlocked! Earned ${rewardsData.achievements['visa-redeemer'].coins} bonus coins!`, 'success');
    }

    saveUserAchievements();
}

// Update balance display to show VISA eligibility
function updateBalanceDisplayWithVisa() {
    // Update VISA button states
    const visaButtons = document.querySelectorAll('.visa-redeem-btn');
    visaButtons.forEach(button => {
        const onclickStr = button.getAttribute('onclick');
        if (onclickStr) {
            const matches = onclickStr.match(/redeemVisaCard\(\d+,\s*(\d+)\)/);
            if (matches) {
                const cost = parseInt(matches[1]);
                if (userBalance >= cost) {
                    button.disabled = false;
                    button.style.opacity = '1';
                } else {
                    button.disabled = true;
                    button.style.opacity = '0.6';
                }
            }
        }
    });
}

// Override the original updateBalanceDisplay
const originalUpdateBalanceDisplay = updateBalanceDisplay;
updateBalanceDisplay = function () {
    originalUpdateBalanceDisplay();
    updateBalanceDisplayWithVisa();
};

// Initialize VISA system
function initializeVisaSystem() {
    // Check if user has enough coins for any VISA card
    const minVisaCost = 1000; // $10 card

    if (userBalance >= minVisaCost) {
        showToast('🎉 You can now redeem VISA gift cards! Check the VISA section.', 'success');
    }

    updateBalanceDisplayWithVisa();
}

// Initialize rewards when page loads
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        initializeRewards();
        initializeVisaSystem();
    }, 500);
});