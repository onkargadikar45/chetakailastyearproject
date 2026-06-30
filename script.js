// ==========================================
// 1. DOM Elements & State Setup
// ==========================================
const startBtn = document.getElementById('start-btn');
const transcriptEl = document.getElementById('transcript');
const responseEl = document.getElementById('response');
const statusEl = document.getElementById('status-indicator');
const listeningAnim = document.getElementById('listening-animation');

const micBtn = document.getElementById('mic-btn');
const chatWindow = document.getElementById('chat-window');
const statusText = document.getElementById('status-text');

let isListening = false;
let firstActivation = true;

// ==========================================
// 🔥 NEW: CHETAK SELF INFO
// ==========================================
const chetakInfo = `
Hello, I am CHETAK AI assistant, created by Onkar Gadikar.

I am designed to help with Python programming, answer questions, and perform voice-based tasks.

My developer Onkar Gadikar is a BCA student at Maharashtra Mahavidyalaya, Nilanga.

I can search information, explain concepts, and interact using voice commands.
`;

// ==========================================
// 2. Python Syllabus Knowledge Base
// ==========================================
const pythonSyllabus = {
    "what is python": "Python is a high-level, interpreted programming language created by Guido van Rossum.",
    "variable": "A variable stores data in memory.",
    "data type": "Python has int, float, string, boolean.",
    "list": "A list stores multiple values using square brackets.",
    "tuple": "A tuple is immutable and uses parentheses.",
    "dictionary": "Stores key-value pairs.",
    "operator": "Performs operations like +, -, *.",
    "if statement": "Used for decision making.",
    "loop": "Repeats code using for/while.",
    "function": "Reusable code using def.",
    "object oriented": "Uses classes and objects.",
    "library": "Pre-written code like NumPy.",
    "file handling": "Read/write files using open()."
};

// ==========================================
// 🔥 NEW: MAHARASHTRA MAHAVIDYALAYA INFO
// ==========================================
const collegeInfo = `
Maharashtra Mahavidyalaya is a well-established college located in Nilanga, Latur district, Maharashtra. It was founded in June 1970 by Maharashtra Shikshan Samiti to provide quality education in rural areas.

The college is affiliated with Swami Ramanand Teerth Marathwada University, Nanded and has NAAC B Plus grade.

It offers courses like BA, BCom, BSc, BCA, B.Voc and postgraduate courses like MSc, MCom and MCA.

The campus includes modern labs, library, auditorium, sports facilities, hostel, WiFi, and placement support.

Address: Main Road, Nilanga, Latur, Maharashtra.
`;

// ==========================================
// 3. Speech Synthesis
// ==========================================
const synth = window.speechSynthesis;
let availableVoices = [];

const loadVoices = () => {
    availableVoices = synth.getVoices();
};
loadVoices();

if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
}

function speak(text) {
    if (!text) return;

    if (responseEl) {
        responseEl.textContent = text;
    }

    synth.cancel();

    const utterThis = new SpeechSynthesisUtterance(text);

    const preferredVoice = availableVoices.find(v => v.name.toLowerCase().includes('male')) || availableVoices[0];
    if (preferredVoice) utterThis.voice = preferredVoice;

    utterThis.pitch = 0.9;
    utterThis.rate = 1;

    utterThis.onend = () => {
        if (isListening) startListening();
    };

    synth.speak(utterThis);
}
// ==========================================
// 4. Wikipedia API
// ==========================================
async function fetchAnswer(query) {
    if (transcriptEl) transcriptEl.textContent = "Searching...";

    try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.query && data.query.search && data.query.search.length > 0) {
            const raw = data.query.search[0].snippet;

            const div = document.createElement("div");
            div.innerHTML = raw;

            return div.textContent;
        }

        return "No result found.";
    } catch (error) {
        console.error(error);
        return "Search failed.";
    }
}

// ==========================================
// 5. Command Logic
// ==========================================
async function processCommand(command) {
    const cmd = command.toLowerCase().trim();

    if (
        cmd.includes('about yourself') ||
        cmd.includes('who are you') ||
        cmd.includes('tell me about yourself') ||
        cmd.includes('chetak')
    ) {
        speak(chetakInfo);
    }
    else if (cmd.includes('hello') || cmd === 'hi') {
        speak("Hello sir!");
    }
    else if (cmd.includes('time')) {
        speak(new Date().toLocaleTimeString());
    }
    else if (cmd.includes('search')) {
        let query = cmd.replace('search', '').trim();

        if (!query) {
            speak("What should I search?");
            return;
        }

        const ans = await fetchAnswer(query);
        speak(ans);
    }
    else if (cmd.includes('what is')) {
        const ans = await fetchAnswer(cmd.replace('what is', ''));
        speak(ans);
    }
    else if (
        cmd.includes('maharashtra mahavidyalaya') ||
        cmd.includes('about college') ||
        cmd.includes('tell me about college')
    ) {
        speak(collegeInfo);
    }
    else {
        // FIX: Instead of just saying "Processing...", it will now use the 
        // Wikipedia search function for any general questions it doesn't recognize.
        speak("Let me look that up...");
        const ans = await fetchAnswer(cmd);
        speak(ans);
    }
}

// ==========================================
// 6. Speech Recognition
// ==========================================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;

        if (transcriptEl) transcriptEl.textContent = transcript;

        processCommand(transcript);
    };

    recognition.onerror = (e) => {
        console.error("Recognition error:", e.error);
        isListening = false;

        if (statusEl) {
            statusEl.innerHTML = "OFFLINE";
        }
    };
}

// ==========================================
// 7. Controls
// ==========================================
function activateSystem() {
    if (statusEl) statusEl.innerHTML = "ONLINE";

    isListening = true;
    speak("System activated");
}

function startListening() {
    if (!recognition) return;

    try {
        recognition.start();
        isListening = true;
    } catch (e) {
        console.warn("Recognition already started.");
    }
}

function stopListening() {
    if (recognition) {
        try {
            recognition.stop();
        } catch (e) {
            console.warn("Recognition already stopped.");
        }
    }

    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    isListening = false;

    if (statusEl) {
        statusEl.innerHTML = "OFFLINE";
    }
}

if (startBtn) {
    startBtn.addEventListener('click', () => {
        isListening ? stopListening() : activateSystem();
    });
}

// ==========================================
// 8. Chat Mic
// ==========================================
if (micBtn && SpeechRecognition) {
    let chatRec = new SpeechRecognition();
    chatRec.continuous = false;
    chatRec.interimResults = false;

    chatRec.onresult = async (e) => {
        const text = e.results[0][0].transcript;

        appendMessage(text, 'user');

        const cmd = text.toLowerCase().trim();

        if (
            cmd === 'chetak' ||
            cmd.includes('who are you') ||
            cmd.includes('tell me about yourself') ||
            cmd.includes('about yourself')
        ) {
            await appendAIMessageWithTyping(chetakInfo);
            speak(chetakInfo);
            return;
        }

        if (
            cmd.includes('tell me about maharashtra mahavidyalaya nilanga') ||
            cmd.includes('about college') ||
            cmd.includes('tell me about college')
        ) {
            await appendAIMessageWithTyping(collegeInfo);
            speak(collegeInfo);
            return;
        }

        const ans = await fetchAnswer(text);

        await appendAIMessageWithTyping(ans);
        speak(ans);
    };

    chatRec.onerror = (e) => {
        console.error("Chat mic error:", e.error);
    };

    micBtn.addEventListener('click', () => {
        try {
            chatRec.start();
        } catch (e) {
            console.warn("Chat mic already active");
        }
    });
}

// ==========================================
// 9. Chat UI
// ==========================================
function appendMessage(text, sender) {
    const div = document.createElement('div');
    div.classList.add('message', sender);
    div.innerText = text;

    chatWindow.appendChild(div);

    chatWindow.scrollTo({
        top: chatWindow.scrollHeight,
        behavior: "smooth"
    });
}

function appendAIMessageWithTyping(text) {
    return new Promise(res => {
        const div = document.createElement('div');
        div.classList.add('message', 'ai');

        const span = document.createElement('span');
        div.appendChild(span);

        chatWindow.appendChild(div);

        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                span.textContent += text[i++];
                chatWindow.scrollTop = chatWindow.scrollHeight;
            } else {
                clearInterval(interval);
                res();
            }
        }, 25);
    });
}