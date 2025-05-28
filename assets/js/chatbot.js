// assets/js/chatbot.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration for the Chatbot
const firebaseConfig = {
    apiKey: "AIzaSyDlzylJ0WF_WMZQA2bJeqbzkEMhihYcZW0",
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
        link: '/safety-plans/resources/ohs-act-construction-regulations.pdf',
        keywords: ['health and safety specification', 'hs spec', 'safety specification']
    },
    'health and safety plan': {
        response: 'wizard.chatbot.responses.hs_plan',
        link: '/safety-plans/resources/ohs-act-construction-regulations.pdf',
        keywords: ['health and safety plan', 'hs plan', 'safety plan']
    },
    'risk assessment': {
        response: 'wizard.chatbot.responses.risk_assessment',
        link: '/safety-plans/resources/risk-assessment-guide.pdf',
        keywords: ['risk assessment', 'hazard identification', 'risk evaluation']
    },
    'sacpcmp': {
        response: 'wizard.chatbot.responses.sacpcmp',
        link: 'https://www.sacpcmp.org.za',
        keywords: ['sacpcmp', 'construction management professionals']
    },
    'coida': {
        response: 'wizard.chatbot.responses.coida',
        link: '/safety-plans/resources/coida-guide.pdf',
        keywords: ['coida', 'compensation for occupational injuries and diseases act']
    }
};

// Initialize Firebase
let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully for chatbot");
    // Make db globally accessible if other scripts need it directly (e.g., testimonials in index.html)
    window.db = db;
} catch (error) {
    console.error("Firebase initialization failed for chatbot:", error);
    const chatOutput = document.getElementById('chat-output');
    if (chatOutput) {
        chatOutput.innerHTML = `<p><strong>Salatiso:</strong> Chatbot unavailable. Please try again later.</p>`;
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

// Send and display messages
async function sendMessage(input) {
    const chatOutput = document.getElementById('chat-output');
    const chatInput = document.getElementById('chat-input'); // Get chatInput here for clearing
    if (!input || !chatOutput || !chatInput) {
        console.error("Chat input or output not found");
        return;
    }

    const sanitizedInput = sanitizeInput(input);
    chatOutput.innerHTML += `<p><strong>You:</strong> ${sanitizedInput}</p>`;
    chatInput.value = ''; // Clear input immediately after sending

    try {
        if (!db) throw new Error("Firestore not initialized");

        // Store message in Firestore
        // Using a public collection for messages, but could be user-specific if needed
        await addDoc(collection(db, 'chat_messages'), { // Changed collection name to avoid conflict/clarity
            userId: window.currentUser?.uid || 'anonymous', // Use uid from scripts.js
            email: window.currentUser?.email || 'anonymous',
            message: sanitizedInput,
            timestamp: serverTimestamp()
        });

        // Add a "Searching..." message
        addChatMessage('Salatiso', 'Searching...');

        const queryText = sanitizedInput.toLowerCase();
        let response = null;
        let responseFound = false;

        // 1. Check predefined responses
        for (const [key, data] of Object.entries(predefinedResponses)) {
            if (data.keywords.some(keyword => queryText.includes(keyword))) {
                response = i18next.t(data.response);
                if (data.link) {
                    response += ` <a href="${data.link}" target="_blank" class="text-blue-500 hover:underline">${i18next.t('wizard.chatbot.see_more')}</a>`;
                }
                responseFound = true;
                unrecognizedCount = 0;
                break;
            }
        }

        // 2. Fallback to Firestore 'ohs-knowledge' collection search if no predefined response
        if (!responseFound) {
            // Query by keywords array or content
            const knowledgeSnapshot = await getDocs(
                query(collection(db, 'ohs-knowledge'), where('keywords', 'array-contains-any', queryText.split(' ')))
            );

            if (!knowledgeSnapshot.empty) {
                knowledgeSnapshot.forEach(doc => {
                    const data = doc.data();
                    // Prioritize exact keyword matches or more relevant content if possible
                    if (data.content && data.content.toLowerCase().includes(queryText)) {
                        response = `${i18next.t('wizard.chatbot.from', { book: data.book || 'our resources', chapter: data.chapter || 'N/A' })}<br>${data.content.substring(0, 250)}... `;
                        if (data.file) {
                            response += `<a href="/safety-plans/resources/${data.file}" target="_blank" class="text-blue-500 hover:underline">${i18next.t('wizard.chatbot.full_chapter')}</a>`;
                        }
                        responseFound = true;
                        unrecognizedCount = 0;
                        return; // Found a match, exit forEach
                    }
                });
            }

            // If still no response, try a broader search on content
            if (!responseFound) {
                const broaderKnowledgeSnapshot = await getDocs(collection(db, 'ohs-knowledge'));
                broaderKnowledgeSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.content && data.content.toLowerCase().includes(queryText)) {
                        response = `${i18next.t('wizard.chatbot.from', { book: data.book || 'our resources', chapter: data.chapter || 'N/A' })}<br>${data.content.substring(0, 250)}... `;
                        if (data.file) {
                            response += `<a href="/safety-plans/resources/${data.file}" target="_blank" class="text-blue-500 hover:underline">${i18next.t('wizard.chatbot.full_chapter')}</a>`;
                        }
                        responseFound = true;
                        unrecognizedCount = 0;
                        return; // Found a match, exit forEach
                    }
                });
            }
        }

        // Handle unrecognized queries
        if (!responseFound) {
            unrecognizedCount++;
            response = i18next.t('wizard.chatbot.no_match');
            if (unrecognizedCount >= MAX_UNRECOGNIZED) {
                response += ` ${i18next.t('wizard.chatbot.escalate')} <a href="/safety-plans/contact.html" target="_blank" class="text-blue-500 hover:underline">${i18next.t('wizard.chatbot.contact_support')}</a>`;
                unrecognizedCount = 0; // Reset after escalation
            }
        }

        // Update the "Searching..." message with the actual response
        const searchingMessage = chatOutput.querySelector('p:last-child');
        if (searchingMessage && searchingMessage.textContent.includes('Searching...')) {
            searchingMessage.innerHTML = `<strong>Salatiso:</strong> ${response}`;
        } else {
            addChatMessage('Salatiso', response);
        }

    } catch (error) {
        console.error("Firestore operation failed:", error);
        const searchingMessage = chatOutput.querySelector('p:last-child');
        if (searchingMessage && searchingMessage.textContent.includes('Searching...')) {
            searchingMessage.innerHTML = `<strong>Salatiso:</strong> ${i18next.t('wizard.chatbot.error_generic')}`;
        } else {
            addChatMessage('Salatiso', i18next.t('wizard.chatbot.error_generic'));
        }
    }

    chatOutput.scrollTop = chatOutput.scrollHeight;
}

function addChatMessage(sender, message) {
    if (chatOutput) {
        const messageElement = document.createElement('p');
        messageElement.classList.add('mb-2');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
        chatOutput.appendChild(messageElement);
        chatOutput.scrollTop = chatOutput.scrollHeight;
    }
}

// Expose openChatbot function globally
function openChatbot() {
    const chatbotWindow = document.getElementById('chat-window');
    const chatToggleBtn = document.getElementById('chat-toggle');
    if (chatbotWindow && chatToggleBtn) {
        chatbotWindow.classList.remove('chat-hidden');
        chatbotWindow.classList.add('chat-expanded');
        chatToggleBtn.classList.remove('collapsed');
        // Reset inactivity timer if it exists and chatbot is opened directly
        if (window.chatbotInactivityTimer) {
            clearTimeout(window.chatbotInactivityTimer);
            window.chatbotInactivityTimer = setTimeout(() => {
                chatbotWindow.classList.add('minimized'); // Or chat-hidden
            }, 30000); // 30 seconds
        }
        document.getElementById('chat-input').focus();
    }
}
window.openChatbot = openChatbot; // Make it globally accessible

// Main DOM Content Loaded Listener
document.addEventListener('DOMContentLoaded', () => {
    const chatToggleBtn = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    // Initial state: chatbot minimized
    chatWindow.classList.add('chat-hidden'); // Ensure it starts hidden

    // Chatbot UI Toggle Logic
    let inactivityTimer; // Local timer variable

    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            chatWindow.classList.add('chat-hidden'); // Hide after inactivity
            chatWindow.classList.remove('chat-expanded');
            chatToggleBtn.classList.remove('collapsed'); // Ensure button state is correct
        }, 30000); // 30 seconds
    };

    chatToggleBtn?.addEventListener('click', () => {
        const isHidden = chatWindow.classList.contains('chat-hidden');
        if (isHidden) {
            chatWindow.classList.remove('chat-hidden');
            chatWindow.classList.add('chat-expanded');
            chatToggleBtn.classList.remove('collapsed');
            chatInput.focus();
            resetInactivityTimer();
        } else {
            chatWindow.classList.add('chat-hidden');
            chatWindow.classList.remove('chat-expanded');
            chatToggleBtn.classList.add('collapsed');
            clearTimeout(inactivityTimer);
        }
    });

    // Event listeners for sending messages
    chatSend?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(chatInput.value.trim());
        }
    });

    // Reset timer on user interaction within the chat window
    chatWindow.addEventListener('click', resetInactivityTimer);
    chatWindow.addEventListener('keydown', resetInactivityTimer);

    // Start listening for messages (real-time updates)
    // This should only start after Firebase is initialized and db is available
    if (db) {
        const q = query(collection(db, 'chat_messages'), orderBy('timestamp', 'asc'));
        onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    // Only display messages for the current user's session or if it's a bot response
                    // For simplicity, we'll display all messages added to the collection
                    // In a multi-user chat, you'd filter by userId. For a chatbot, it's simpler.
                    // Removed filtering by userId as it's a chatbot, not a multi-user chat.
                    // We only display the user's message when they send it, and bot's response.
                    // The onSnapshot here is more for debugging/monitoring if needed,
                    // or for more complex chat history loading.
                    // For a simple chatbot, you might not need real-time listener for ALL messages.
                    // The `sendMessage` function already adds the message to the UI.
                    // This onSnapshot might be redundant for a single-user chatbot.
                    // Keeping it for now as it was in original, but consider if truly needed.
                }
            });
        });
    }
});
