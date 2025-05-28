// assets/js/chatbot.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, getDocs, limit } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration for the Chatbot (Separate Project)
const chatbotFirebaseConfig = { // Renamed to avoid conflict if scripts.js also defines firebaseConfig
    apiKey: "AIzaSyDlzylJ0WF_WMZQA2bJeqbzkEMhihYcZW0", // Ensure this is your correct API key for the chatbot project
    authDomain: "safety-first-chatbot.firebaseapp.com",
    projectId: "safety-first-chatbot",
    storageBucket: "safety-first-chatbot.firebasestorage.app",
    messagingSenderId: "741489856541",
    appId: "1:741489856541:web:0833fa5deb60dd54c9b6f4",
    measurementId: "G-04Y1PQDYVD"
};

// Predefined responses for common OHS queries
const predefinedResponses = {
    'health and safety specification': {
        response: 'wizard.chatbot.responses.hs_spec',
        link: '/SafetyHelp/resources/ohs-act-construction-regulations.pdf', // Corrected path
        keywords: ['health and safety specification', 'hs spec', 'safety specification', 'specification']
    },
    'health and safety plan': {
        response: 'wizard.chatbot.responses.hs_plan',
        link: '/SafetyHelp/resources/ohs-act-construction-regulations.pdf', // Corrected path
        keywords: ['health and safety plan', 'hs plan', 'safety plan', 'plan']
    },
    'risk assessment': {
        response: 'wizard.chatbot.responses.risk_assessment',
        link: '/SafetyHelp/pages/risk-assessment.html', // Link to the page instead of a direct PDF
        keywords: ['risk assessment', 'hazard identification', 'risk evaluation', 'assessment']
    },
    'sacpcmp': {
        response: 'wizard.chatbot.responses.sacpcmp',
        link: 'https://www.sacpcmp.org.za',
        keywords: ['sacpcmp', 'construction management professionals', 'council']
    },
    'coida': {
        response: 'wizard.chatbot.responses.coida',
        link: '/SafetyHelp/resources/coida-guide.pdf', // Corrected path
        keywords: ['coida', 'compensation for occupational injuries and diseases act', 'compensation']
    }
    // Add more predefined responses as needed
};

// Initialize Firebase for Chatbot
let chatbotDbInstance; // Renamed to be specific
try {
    const chatbotApp = initializeApp(chatbotFirebaseConfig, "chatbotApp"); // Give a unique name to this Firebase app instance
    chatbotDbInstance = getFirestore(chatbotApp);
    console.log("Firebase initialized successfully for chatbotApp (safety-first-chatbot project)");
    window.chatbotDbInstance = chatbotDbInstance; // Make it globally accessible if needed elsewhere
} catch (error) {
    console.error("Firebase initialization failed for chatbotApp:", error);
    const chatOutputElement = document.getElementById('chat-output');
    if (chatOutputElement) {
        addChatMessage('Salatiso', i18next.t('wizard.chatbot.unavailable'), chatOutputElement);
    }
}

// Sanitize user input to prevent XSS
const sanitizeInput = (input) => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
};

// Track unrecognized queries for escalation
let unrecognizedCount = 0;
const MAX_UNRECOGNIZED = 3;

// Add a message to the chat output
function addChatMessage(sender, message, chatOutputElement) {
    if (chatOutputElement) {
        const messageElement = document.createElement('p');
        messageElement.classList.add('mb-2'); // Tailwind margin bottom
        // Sanitize sender and message before setting innerHTML
        const sanitizedSender = sanitizeInput(sender);
        // Message might contain HTML (like links), so only sanitize parts that are pure text
        messageElement.innerHTML = `<strong>${sanitizedSender}:</strong> ${message}`; // Message already contains HTML from bot
        chatOutputElement.appendChild(messageElement);
        chatOutputElement.scrollTop = chatOutputElement.scrollHeight; // Scroll to the bottom
    }
}


// Send and display messages
async function handleSendMessage() {
    const chatInputElement = document.getElementById('chat-input');
    const chatOutputElement = document.getElementById('chat-output');

    if (!chatInputElement || !chatOutputElement) {
        console.error("Chat input or output element not found.");
        return;
    }
    const rawInput = chatInputElement.value.trim();
    if (!rawInput) return;

    const sanitizedInput = sanitizeInput(rawInput); // Sanitize user input before displaying
    addChatMessage(i18next.t('wizard.chatbot.you'), sanitizedInput, chatOutputElement);
    chatInputElement.value = ''; // Clear input

    // Display "Searching..." message
    addChatMessage('Salatiso', 'Searching...', chatOutputElement);
    const searchingMessageElement = chatOutputElement.lastElementChild; // Get the "Searching..." p element


    try {
        if (!chatbotDbInstance) throw new Error("Chatbot Firestore not initialized");

        // Log message to Firestore (in safety-first-chatbot project)
        await addDoc(collection(chatbotDbInstance, 'chat_messages'), {
            userId: window.currentUser?.uid || 'anonymous_SafetyHelp', // Get UID from main SafetyHelp auth if available
            email: window.currentUser?.email || 'anonymous_SafetyHelp',
            site: 'SafetyHelp', // Indicate the message is from this site
            message: sanitizedInput, // Log the sanitized input
            timestamp: serverTimestamp()
        });

        const queryText = sanitizedInput.toLowerCase();
        let responseText = null;
        let responseFound = false;

        // 1. Check predefined responses
        for (const key in predefinedResponses) {
            if (predefinedResponses[key].keywords.some(keyword => queryText.includes(keyword))) {
                responseText = i18next.t(predefinedResponses[key].response);
                if (predefinedResponses[key].link) {
                    responseText += ` <a href="${predefinedResponses[key].link}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${i18next.t('wizard.chatbot.see_more')}</a>`;
                }
                responseFound = true;
                unrecognizedCount = 0;
                break;
            }
        }

        // 2. Fallback to Firestore 'ohs-knowledge' collection search
        if (!responseFound) {
            const keywordsInQuery = queryText.split(' ').filter(kw => kw.length > 2); // Simple keyword extraction
            let querySnapshot;
            if (keywordsInQuery.length > 0) {
                 querySnapshot = await getDocs(
                    query(collection(chatbotDbInstance, 'ohs-knowledge'), where('keywords', 'array-contains-any', keywordsInQuery), limit(5))
                );
            }


            if (querySnapshot && !querySnapshot.empty) {
                // Basic relevance: prefer documents that contain the full query text or more keywords
                let bestMatch = null;
                let highestScore = 0;

                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    let currentScore = 0;
                    if (data.content && data.content.toLowerCase().includes(queryText)) {
                        currentScore += 10; // High score for full phrase match
                    }
                    keywordsInQuery.forEach(kw => {
                        if (data.keywords && data.keywords.includes(kw)) currentScore++;
                        if (data.content && data.content.toLowerCase().includes(kw)) currentScore++;
                    });

                    if (currentScore > highestScore) {
                        highestScore = currentScore;
                        bestMatch = data;
                    }
                });

                if (bestMatch) {
                    responseText = `${i18next.t('wizard.chatbot.from', { book: bestMatch.book || 'our resources', chapter: bestMatch.chapter || 'N/A' })}<br>${sanitizeInput(bestMatch.content.substring(0, 250))}... `;
                    if (bestMatch.file) {
                        responseText += `<a href="/SafetyHelp/resources/${bestMatch.file}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${i18next.t('wizard.chatbot.full_chapter')}</a>`;
                    }
                    responseFound = true;
                    unrecognizedCount = 0;
                }
            }
        }

        if (!responseFound) {
            unrecognizedCount++;
            responseText = i18next.t('wizard.chatbot.no_match');
            if (unrecognizedCount >= MAX_UNRECOGNIZED) {
                responseText += ` ${i18next.t('wizard.chatbot.escalate')} <a href="/SafetyHelp/contact.html" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${i18next.t('wizard.chatbot.contact_support')}</a>`;
                unrecognizedCount = 0;
            }
        }
        // Update the "Searching..." message with the actual response
        if (searchingMessageElement) {
            searchingMessageElement.innerHTML = `<strong>Salatiso:</strong> ${responseText}`;
        } else { // Fallback if somehow the searching message wasn't found
            addChatMessage('Salatiso', responseText, chatOutputElement);
        }


    } catch (error) {
        console.error("Chatbot operation failed:", error);
         if (searchingMessageElement) {
            searchingMessageElement.innerHTML = `<strong>Salatiso:</strong> ${i18next.t('wizard.chatbot.error_generic')}`;
        } else {
            addChatMessage('Salatiso', i18next.t('wizard.chatbot.error_generic'), chatOutputElement);
        }
    }
    if (chatOutputElement) chatOutputElement.scrollTop = chatOutputElement.scrollHeight;
}


// Expose openChatbot function globally
function openChatbot() {
    const chatbotWindow = document.getElementById('chat-window');
    const chatToggleBtn = document.getElementById('chat-toggle');
    const chatInput = document.getElementById('chat-input');

    if (chatbotWindow && chatToggleBtn && chatInput) {
        chatbotWindow.classList.remove('chat-hidden');
        chatbotWindow.classList.add('chat-expanded');
        chatToggleBtn.classList.remove('collapsed'); // Assuming 'collapsed' is a class for the minimized button icon
        chatInput.focus();
        // Reset inactivity timer if it exists and chatbot is opened directly
        if (window.chatbotInactivityTimer) { // Check if timer is defined
            clearTimeout(window.chatbotInactivityTimer);
            // Restart timer (logic should be in DOMContentLoaded)
        }
    }
}
window.openChatbot = openChatbot;

// Main DOM Content Loaded Listener
document.addEventListener('DOMContentLoaded', () => {
    const chatToggleBtn = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send'); // Corrected ID
    const chatOutput = document.getElementById('chat-output'); // Define for initial message

    // Add initial welcome message if i18next is ready
    if (typeof i18next !== 'undefined' && i18next.isInitialized) {
        const welcomeMsg = i18next.t('chatbot.welcome'); // Ensure this key exists in translations
        if (chatOutput && chatOutput.children.length === 1 && chatOutput.firstElementChild.textContent.includes("Hello! How can I help you with OHS today?")) {
             // Update existing placeholder if it's the default one
            chatOutput.firstElementChild.innerHTML = `<strong>Salatiso:</strong> ${welcomeMsg}`;
        }
    } else {
        // Fallback or wait for i18next to initialize
        // The welcome message might be set by i18next in index.html's own script
    }


    let inactivityTimer;
    window.chatbotInactivityTimer = inactivityTimer; // Make timer accessible globally if needed

    const resetInactivityTimer = () => {
        clearTimeout(window.chatbotInactivityTimer);
        window.chatbotInactivityTimer = setTimeout(() => {
            if (chatWindow && !chatWindow.classList.contains('chat-hidden')) {
                chatWindow.classList.add('chat-hidden');
                chatWindow.classList.remove('chat-expanded');
                if(chatToggleBtn) chatToggleBtn.classList.add('collapsed'); // Show minimized icon/text
            }
        }, 60000); // 60 seconds of inactivity
    };

    chatToggleBtn?.addEventListener('click', () => {
        if (!chatWindow) return;
        const isHidden = chatWindow.classList.contains('chat-hidden');
        if (isHidden) {
            chatWindow.classList.remove('chat-hidden');
            chatWindow.classList.add('chat-expanded');
            chatToggleBtn.classList.remove('collapsed');
            chatInput?.focus();
            resetInactivityTimer();
        } else {
            chatWindow.classList.add('chat-hidden');
            chatWindow.classList.remove('chat-expanded');
            chatToggleBtn.classList.add('collapsed');
            clearTimeout(window.chatbotInactivityTimer);
        }
    });

    chatSendBtn?.addEventListener('click', handleSendMessage);
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
        resetInactivityTimer(); // Reset timer on typing
    });

    chatWindow?.addEventListener('click', resetInactivityTimer); // Reset on click within window
    chatWindow?.addEventListener('scroll', resetInactivityTimer); // Reset on scroll within window

    // Initial state: chatbot hidden and button collapsed
    if(chatWindow) chatWindow.classList.add('chat-hidden');
    if(chatToggleBtn) chatToggleBtn.classList.add('collapsed'); // Start with collapsed button if chat is hidden

    // No real-time listener for 'chat_messages' here as it's a single user interaction model.
    // Messages are added to UI directly by `addChatMessage`.
});
