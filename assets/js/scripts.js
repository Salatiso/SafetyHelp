// assets/js/scripts.js

// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail // Import for password reset
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration for SafetyHelp (Main Auth and User Data)
const firebaseConfig = {
    apiKey: "AIzaSyDASGZnUyav23Mte5Q96H0j-T3LlGzVK-k", // Ensure this is your correct API key
    authDomain: "safetyfirst2025-aea34.firebaseapp.com",
    projectId: "safetyfirst2025-aea34",
    storageBucket: "safetyfirst2025-aea34.firebasestorage.app",
    messagingSenderId: "620306944192",
    appId: "1:620306944192:web:ddadeef6825901068a9d25",
    measurementId: "G-VQL1FCD8NN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variable to store current user data, accessible by other scripts like chatbot.js
window.currentUser = null;
window.db = db; // Make main db instance globally available if needed by other scripts like testimonials

// --- Authentication Functions ---

/**
 * Handles user registration with email/password.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {string} companyName - User's company name (optional).
 * @returns {Promise<void>}
 */
async function signUp(email, password, companyName = '') {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            companyName: companyName,
            membershipPlan: 'free', // Default to free plan
            createdAt: new Date()
        });

        console.log("User registered and data saved to Firestore:", user.uid);
        displayMessage("Registration successful! You are now a Registered User (Free). Redirecting to your dashboard...", "success", "auth-message"); // Specify ID
        setTimeout(() => {
            window.location.href = '/SafetyHelp/member-dashboard.html'; // Corrected path
        }, 3000);

    } catch (error) {
        console.error("Error during sign up:", error.code, error.message);
        let errorMessage = "Registration failed. Please try again.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already in use. Please log in or use a different email.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email address format.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Password should be at least 6 characters.";
        }
        displayMessage(errorMessage, "error", "auth-message"); // Specify ID
    }
}

/**
 * Handles user login with email/password.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<void>}
 */
async function signIn(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User signed in successfully!");
        displayMessage("Login successful! Redirecting to your dashboard...", "success", "auth-message"); // Specify ID
        setTimeout(() => {
            window.location.href = '/SafetyHelp/member-dashboard.html'; // Corrected path
        }, 2000);

    } catch (error) {
        console.error("Error during sign in:", error.code, error.message);
        let errorMessage = "Login failed. Please check your credentials.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = "Invalid email or password.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email address format.";
        }
        displayMessage(errorMessage, "error", "auth-message"); // Specify ID
    }
}

/**
 * Handles Google Sign-in/Sign-up.
 * @returns {Promise<void>}
 */
async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            await setDoc(userDocRef, {
                email: user.email,
                displayName: user.displayName || '',
                companyName: '',
                membershipPlan: 'free',
                createdAt: new Date(),
                authMethod: 'google'
            });
            console.log("New user registered via Google and data saved to Firestore:", user.uid);
            displayMessage("Registration successful with Google! Redirecting to your dashboard...", "success", "auth-message"); // Specify ID
        } else {
            console.log("Existing user signed in with Google:", user.uid);
            displayMessage("Login successful with Google! Redirecting to your dashboard...", "success", "auth-message"); // Specify ID
        }
        setTimeout(() => {
            window.location.href = '/SafetyHelp/member-dashboard.html'; // Corrected path
        }, 2000);

    } catch (error) {
        console.error("Error during Google sign in:", error.code, error.message);
        let errorMessage = "Google login failed. Please try again.";
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = "Google login window closed. Please try again.";
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = "Google login already in progress or cancelled.";
        }
        displayMessage(errorMessage, "error", "auth-message"); // Specify ID
    }
}

/**
 * Handles user logout.
 * @returns {Promise<void>}
 */
async function signOutUser() {
    try {
        await signOut(auth);
        console.log("User signed out successfully!");
        // Display logout message on the current page or redirect and then display
        // For simplicity, we'll assume a message display on current page before redirect
        // If there's a dedicated message area on all pages, use it.
        // Otherwise, alert is a fallback (but generally avoided).
        // Let's assume 'auth-message' might exist on the page or we can create one.
        displayMessage("You have been logged out.", "success", "auth-message", true); // true to persist for a moment
        setTimeout(() => {
            window.location.href = '/SafetyHelp/index.html'; // Corrected path
        }, 2000); // Slightly longer delay to see message
    } catch (error) {
        console.error("Error during sign out:", error.code, error.message);
        displayMessage("Error logging out. Please try again.", "error", "auth-message"); // Specify ID
    }
}


/**
 * Handles password reset request.
 * @param {string} email - The user's email address.
 */
async function resetPassword(email) {
    if (!email) {
        displayMessage("Please enter your email address to reset your password.", "error", "auth-message");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        displayMessage("Password reset email sent! Please check your inbox (and spam folder).", "success", "auth-message");
    } catch (error) {
        console.error("Error sending password reset email:", error);
        let errorMessage = "Failed to send password reset email. Please try again.";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "No account found with this email address.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email address format.";
        }
        displayMessage(errorMessage, "error", "auth-message");
    }
}


// --- UI Management ---

/**
 * Displays a message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - Type of message ('success' or 'error').
 * @param {string} elementId - The ID of the HTML element to display the message in.
 * @param {boolean} persistShort - If true, message persists for a short while even if page redirects.
 */
function displayMessage(message, type, elementId = "auth-message", persistShort = false) {
    let messageContainer = document.getElementById(elementId);

    // If the container doesn't exist on the current page, try to create a temporary one for general messages
    if (!messageContainer && persistShort) {
        const tempContainer = document.createElement('div');
        tempContainer.id = "temp-auth-message";
        tempContainer.style.position = 'fixed';
        tempContainer.style.top = '20px';
        tempContainer.style.left = '50%';
        tempContainer.style.transform = 'translateX(-50%)';
        tempContainer.style.padding = '10px 20px';
        tempContainer.style.borderRadius = '5px';
        tempContainer.style.zIndex = '2000';
        tempContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        document.body.appendChild(tempContainer);
        messageContainer = tempContainer;
    }


    if (messageContainer) {
        messageContainer.textContent = message;
        // Apply Tailwind-like classes for styling
        messageContainer.className = ''; // Reset classes
        messageContainer.classList.add('p-3', 'mt-4', 'rounded-md', 'text-center');
        if (type === 'success') {
            messageContainer.classList.add('bg-green-100', 'text-green-800', 'message-success');
        } else {
            messageContainer.classList.add('bg-red-100', 'text-red-800', 'message-error');
        }
        messageContainer.style.display = 'block';

        setTimeout(() => {
            messageContainer.style.display = 'none';
            if (messageContainer.id === "temp-auth-message") {
                messageContainer.remove(); // Clean up temporary container
            }
        }, persistShort ? 2500 : 5000); // Shorter timeout if it's a pre-redirect message
    } else {
        // Fallback if no message container is found (e.g., for critical errors)
        console.log(`Message (${type}): ${message}`);
        // Avoid alert() if possible, but it's a last resort.
        // alert(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Updates UI elements based on authentication state.
 * @param {Object|null} user - The Firebase User object or null if logged out.
 */
function updateUI(user) {
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const memberDashboardLink = document.querySelector('a[href*="member-dashboard.html"]'); // More robust selector

    if (user) {
        window.currentUser = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            providerId: user.providerData && user.providerData.length > 0 ? user.providerData[0].providerId : 'email/password'
        };
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'inline'; // Use 'inline' or 'block' as appropriate for your layout
        if (memberDashboardLink) memberDashboardLink.style.display = 'inline';


        const userDocRef = doc(db, "users", user.uid);
        getDoc(userDocRef).then((docSnap) => {
            if (docSnap.exists()) {
                window.currentUser = { ...window.currentUser, ...docSnap.data() };
                console.log("Current user data from Firestore:", window.currentUser);
                // Example: Update a welcome message if an element with ID 'user-welcome' exists
                const userWelcomeElement = document.getElementById('user-welcome');
                if (userWelcomeElement) {
                    userWelcomeElement.textContent = `Welcome, ${window.currentUser.displayName || window.currentUser.email}!`;
                }
            } else {
                console.log("No additional user data found in Firestore for this user.");
            }
        }).catch((error) => {
            console.error("Error fetching user data from Firestore:", error);
        });

    } else {
        window.currentUser = null;
        if (loginLink) loginLink.style.display = 'inline';
        if (logoutLink) logoutLink.style.display = 'none';
        if (memberDashboardLink) memberDashboardLink.style.display = 'none'; // Hide dashboard link if not logged in

        const userWelcomeElement = document.getElementById('user-welcome');
        if (userWelcomeElement) {
            userWelcomeElement.textContent = ''; // Clear welcome message
        }
    }
}

// --- Event Listeners and Initial Setup ---

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        updateUI(user);
    });

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const companyName = document.getElementById('signup-company').value;
            await signUp(email, password, companyName);
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await signIn(email, password);
        });
    }

    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            await signInWithGoogle();
        });
    }

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (event) => {
            event.preventDefault();
            await signOutUser();
        });
    }

    // Password Reset Listener (assuming it's on the login page)
    const resetPasswordLink = document.querySelector('a[href="#"][data-i18n="login.reset_password_link"]'); // More specific selector
    if (resetPasswordLink) {
        resetPasswordLink.addEventListener('click', async (event) => {
            event.preventDefault();
            const email = prompt("Please enter your email address to reset your password:");
            if (email) { // Proceed if the user entered an email
                await resetPassword(email);
            } else if (email === "") { // User entered blank
                 displayMessage("Email address cannot be empty.", "error", "auth-message");
            }
            // If user cancels prompt, email will be null, and nothing happens, which is fine.
        });
    }
});
