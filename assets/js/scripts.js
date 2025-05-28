// assets/js/scripts.js

// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider, // Import GoogleAuthProvider
    signInWithPopup // Import signInWithPopup
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration for SafetyHelp (from user's provided credentials)
const firebaseConfig = {
    apiKey: "AIzaSyDASGZnUyav23Mte5Q96H0j-T3LlGzVK-k",
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

// Global variable to store current user data
window.currentUser = null;

// --- Authentication Functions ---

/**
 * Handles user registration with email/password.
 * Users will initially be registered for the 'free' plan.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {string} companyName - User's company name (optional for free tier).
 * @returns {Promise<void>}
 */
async function signUp(email, password, companyName = '') {
    try {
        // Create user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store additional user data in Firestore
        // Default to 'free' membership plan upon initial signup
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            companyName: companyName,
            membershipPlan: 'free', // Default to free plan
            createdAt: new Date()
        });

        console.log("User registered and data saved to Firestore:", user.uid);
        displayMessage("Registration successful! You are now a Registered User (Free). Redirecting to dashboard...", "success");
        // Redirect to member dashboard after successful registration
        setTimeout(() => {
            window.location.href = '/safety-plans/member-dashboard.html';
        }, 2000);

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
        displayMessage(errorMessage, "error");
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
        displayMessage("Login successful! Redirecting to dashboard...", "success");
        // Redirect to member dashboard after successful login
        setTimeout(() => {
            window.location.href = '/safety-plans/member-dashboard.html';
        }, 2000);

    } catch (error) {
        console.error("Error during sign in:", error.code, error.message);
        let errorMessage = "Login failed. Please check your credentials.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = "Invalid email or password.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Invalid email address format.";
        }
        displayMessage(errorMessage, "error");
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

        // Check if user data already exists in Firestore, if not, create it
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);

        if (!docSnap.exists()) {
            // New user via Google, register them for the 'free' plan
            await setDoc(userDocRef, {
                email: user.email,
                companyName: '', // Company name can be added later in dashboard
                membershipPlan: 'free', // Default to free plan
                createdAt: new Date(),
                authMethod: 'google'
            });
            console.log("New user registered via Google and data saved to Firestore:", user.uid);
            displayMessage("Registration successful with Google! You are now a Registered User (Free). Redirecting to dashboard...", "success");
        } else {
            console.log("Existing user signed in with Google:", user.uid);
            displayMessage("Login successful with Google! Redirecting to dashboard...", "success");
        }

        // Redirect to member dashboard after successful login/registration
        setTimeout(() => {
            window.location.href = '/safety-plans/member-dashboard.html';
        }, 2000);

    } catch (error) {
        console.error("Error during Google sign in:", error.code, error.message);
        let errorMessage = "Google login failed. Please try again.";
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = "Google login window closed. Please try again.";
        } else if (error.code === 'auth/cancelled-popup-request') {
            errorMessage = "Google login already in progress or cancelled.";
        }
        displayMessage(errorMessage, "error");
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
        displayMessage("You have been logged out.", "success");
        // Redirect to home page after logout
        setTimeout(() => {
            window.location.href = '/safety-plans/index.html';
        }, 1000);
    } catch (error) {
        console.error("Error during sign out:", error.code, error.message);
        displayMessage("Error logging out. Please try again.", "error");
    }
}

// --- UI Management ---

/**
 * Displays a message to the user.
 * @param {string} message - The message to display.
 * @param {string} type - Type of message ('success' or 'error').
 */
function displayMessage(message, type) {
    const messageContainer = document.getElementById('auth-message');
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.className = `p-3 mt-4 rounded-md text-center ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        messageContainer.style.display = 'block'; // Ensure it's visible
        setTimeout(() => {
            messageContainer.style.display = 'none'; // Hide after a few seconds
        }, 5000);
    }
}

/**
 * Updates UI elements based on authentication state.
 * @param {Object|null} user - The Firebase User object or null if logged out.
 */
function updateUI(user) {
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');

    if (user) {
        // User is logged in
        window.currentUser = {
            uid: user.uid,
            email: user.email,
            // Add provider data if available
            providerId: user.providerData && user.providerData.length > 0 ? user.providerData[0].providerId : 'email/password'
        };
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'block';

        // Fetch additional user data from Firestore
        const userDocRef = doc(db, "users", user.uid);
        getDoc(userDocRef).then((docSnap) => {
            if (docSnap.exists()) {
                window.currentUser = { ...window.currentUser, ...docSnap.data() };
                console.log("Current user data:", window.currentUser);
                // You can update UI elements here based on membershipPlan if needed
            } else {
                console.log("No additional user data found in Firestore for this user.");
                // This might happen for new Google sign-ins before the setDoc completes
                // or if data was somehow not saved. Handle gracefully.
            }
        }).catch((error) => {
            console.error("Error fetching user data:", error);
        });

    } else {
        // User is logged out
        window.currentUser = null;
        if (loginLink) loginLink.style.display = 'block';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}

// --- Event Listeners and Initial Setup ---

document.addEventListener('DOMContentLoaded', () => {
    // Listen for authentication state changes
    onAuthStateChanged(auth, (user) => {
        updateUI(user);
    });

    // Handle Sign Up Form Submission (on signup.html)
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const companyName = document.getElementById('signup-company').value; // This field is now optional for free tier

            await signUp(email, password, companyName); // Pass companyName, it will be optional
        });
    }

    // Handle Login Form Submission (on login.html)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            await signIn(email, password);
        });
    }

    // Handle Google Login/Signup Button (on both login.html and signup.html)
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            await signInWithGoogle();
        });
    }

    // Handle Logout Button/Link Click (if present in header or other pages)
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (event) => {
            event.preventDefault();
            await signOutUser();
        });
    }
});
