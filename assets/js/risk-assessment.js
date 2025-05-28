// assets/js/risk-assessment.js

// Import the functions you need from the Firebase SDKs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration for the Chatbot (from user's provided credentials)
const firebaseConfig = {
    apiKey: "AIzaSyDlzylJ0WF_WMZQA2bJeqbzkEMhihYcZW0",
    authDomain: "safety-first-chatbot.firebaseapp.com",
    projectId: "safety-first-chatbot",
    storageBucket: "safety-first-chatbot.firebasestorage.app",
    messagingSenderId: "741489856541",
    appId: "1:741489856541:web:0833fa5deb60dd54c9b6f4",
    measurementId: "G-04Y1PQDYVD"
};

// Initialize Firebase for the chatbot
let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully for risk-assessment chatbot.");
} catch (error) {
    console.error("Firebase initialization failed for risk-assessment chatbot:", error);
    const chatOutput = document.getElementById('chat-output');
    if (chatOutput) {
        chatOutput.innerHTML = "<p><strong>Error:</strong> Chatbot unavailable. Please try again later.</p>";
    }
}

// Baseline Risk Assessment Database (Updated for All Types)
const riskDatabase = [
    {
        group: "Site Preparation and Access",
        activities: [
            {
                activity: "Site Access",
                hazard: "Unauthorized entry",
                risk: "Delays, security threats",
                controls: "Require ID, conduct induction, provide parking",
                legal: "OHSA Section 8(2)(e), Construction Regulation 4",
                suggested: ["baseline", "periodic"]
            },
            {
                activity: "Site Clearing",
                hazard: "Vegetation/debris",
                risk: "Trips, cuts",
                controls: "Clear debris, wear PPE (gloves, boots)",
                legal: "OHSA Section 8(2)(a)",
                suggested: ["baseline"]
            }
        ]
    },
    {
        group: "Construction and Structural Work",
        activities: [
            {
                activity: "Excavation",
                hazard: "Trench collapse",
                risk: "Burial, suffocation",
                controls: "Shore trenches >1.5m, inspect daily",
                legal: "Construction Regulation 13",
                suggested: ["baseline", "issue-based"]
            },
            {
                activity: "Scaffolding",
                hazard: "Structural failure",
                risk: "Falls, collapse",
                controls: "Comply with SANS 10085, inspect weekly",
                legal: "Construction Regulation 16",
                suggested: ["baseline", "continuous"]
            }
        ]
    },
    {
        group: "Mechanical and Electrical Work",
        activities: [
            {
                activity: "Electrical Installation",
                hazard: "Live circuits",
                risk: "Shocks, burns",
                controls: "Isolate circuits, use competent electricians",
                legal: "OHSA EIR, SANS 10142",
                suggested: ["baseline", "issue-based"]
            }
        ]
    },
    {
        group: "Finishing and Installation",
        activities: [
            {
                activity: "Painting",
                hazard: "Paint fumes",
                risk: "Asphyxiation, nausea",
                controls: "Ensure ventilation, use low-VOC paints",
                legal: "OHSA HCS Regulations",
                suggested: ["baseline"]
            }
        ]
    },
    {
        group: "Maintenance and Repair",
        activities: [
            {
                activity: "Plumbing Maintenance",
                hazard: "Leaking pipes",
                risk: "Slips, water damage",
                controls: "Isolate water, use absorbent mats",
                legal: "OHSA Section 8(2)(i)",
                suggested: ["baseline", "periodic"]
            }
        ]
    },
    {
        group: "Office/Administrative",
        activities: [
            {
                activity: "Office Ergonomics",
                hazard: "Poor workstations",
                risk: "Musculoskeletal disorders",
                controls: "Use adjustable chairs/desks, train in posture",
                legal: "OHSA ERW Regulations",
                suggested: ["ergonomic", "baseline"]
            },
            {
                activity: "Document Handling",
                hazard: "Repetitive tasks",
                risk: "Strain injuries",
                controls: "Take breaks, use ergonomic tools",
                legal: "OHSA Section 8(2)(d)",
                suggested: ["ergonomic"]
            }
        ]
    },
    {
        group: "Chemical and Environmental Risks",
        activities: [
            {
                activity: "Chemical Handling",
                hazard: "Spills, exposure",
                risk: "Burns, poisoning",
                controls: "Store in labeled containers, use PPE",
                legal: "OHSA HCS Regulations",
                suggested: ["chemical", "issue-based"]
            },
            {
                activity: "Asbestos Removal",
                hazard: "Asbestos fibers",
                risk: "Lung diseases",
                controls: "Use respiratory PPE, licensed disposal",
                legal: "OHSA Asbestos Regulations",
                suggested: ["chemical"]
            }
        ]
    },
    {
        group: "Noise Risks",
        activities: [
            {
                activity: "Equipment Operation",
                hazard: "High noise levels",
                risk: "Hearing loss",
                controls: "Use ear protection, monitor noise levels",
                legal: "OHSA NIR Regulations",
                suggested: ["noise", "continuous"]
            }
        ]
    }
];

// Form Navigation and Logic
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, initializing risk assessment");

    const steps = document.querySelectorAll(".step");
    const assessmentTypeForm = document.getElementById("risk-assessment-type-form");
    const activitiesForm = document.getElementById("activities-form");
    const ratingsForm = document.getElementById("ratings-form");
    const reviewForm = document.getElementById("review-form");
    const activitySearch = document.getElementById("activity-search");
    const activityGroups = document.getElementById("activity-groups");
    const ratingsTableBody = document.getElementById("ratings-table-body");
    const reviewTableBody = document.getElementById("review-table-body");
    const complianceNote = document.querySelector(".compliance-note");
    let selectedActivities = [];
    let ratings = {};
    let assessmentDetails = {};

    if (!assessmentTypeForm) {
        console.error("Error: #risk-assessment-type-form not found");
        return;
    }

    // Show/hide steps
    function showStep(stepId) {
        console.log(`Showing step: ${stepId}`);
        steps.forEach(step => step.classList.add("hidden"));
        document.getElementById(stepId).classList.remove("hidden");
        window.scrollTo(0, 0);
    }

    // Step 1: Risk Assessment Type
    assessmentTypeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("Assessment type form submitted");
        const assessmentType = document.getElementById("assessment-type").value;
        console.log(`Selected assessment type: ${assessmentType}`);
        if (!assessmentType) {
            alert("Please select a risk assessment type.");
            console.warn("No assessment type selected");
            return;
        }
        populateActivities(assessmentType);
        showStep("step-2");
    });

    // Fallback: Button click handler
    const nextButton = assessmentTypeForm.querySelector("button[type='submit']");
    if (nextButton) {
        nextButton.addEventListener("click", (e) => {
            console.log("Next button clicked");
            if (!assessmentTypeForm.checkValidity()) {
                console.warn("Form validation failed");
                alert("Please select a risk assessment type.");
                return;
            }
            assessmentTypeForm.dispatchEvent(new Event("submit"));
        });
    }

    // Populate activities based on assessment type
    function populateActivities(assessmentType) {
        console.log(`Populating activities for: ${assessmentType}`);
        activityGroups.innerHTML = "";
        const filteredGroups = riskDatabase.filter(group => {
            return group.activities.some(activity => {
                return activity.suggested?.includes(assessmentType) || assessmentType === "baseline";
            });
        });

        if (!filteredGroups.length) {
            activityGroups.innerHTML = "<p>No activities available for this assessment type.</p>";
            activitiesForm.querySelector("button[type='submit']").disabled = true;
            console.warn("No activities found");
            return;
        }

        filteredGroups.forEach(group => {
            const groupDiv = document.createElement("div");
            groupDiv.className = "activity-group";
            groupDiv.innerHTML = `
                <h4>${group.group}</h4>
                <ul>
                    ${group.activities.map(activity => `
                        <li class="${activity.suggested?.includes(assessmentType) ? 'suggested' : ''}">
                            <label>
                                <input type="checkbox" name="activity" value="${activity.activity}" 
                                    data-hazard="${activity.hazard}" 
                                    data-risk="${activity.risk}" 
                                    data-controls="${activity.controls}" 
                                    data-legal="${activity.legal}"
                                    ${activity.suggested?.includes(assessmentType) ? 'checked' : ''}>
                                ${activity.activity} (${activity.hazard})
                                ${activity.suggested?.includes(assessmentType) ? '<span class="suggested-label">Suggested</span>' : ''}
                            </label>
                        </li>
                    `).join("")}
                </ul>
            `;
            activityGroups.appendChild(groupDiv);
        });

        document.querySelectorAll(".activity-group h4").forEach(header => {
            header.addEventListener("click", () => {
                header.parentElement.classList.toggle("open");
            });
        });

        const updateNextButton = () => {
            const checked = document.querySelectorAll('input[name="activity"]:checked').length;
            activitiesForm.querySelector("button[type='submit']").disabled = !checked;
            console.log(`Next button state: ${!checked ? 'disabled' : 'enabled'}`);
        };
        document.querySelectorAll('input[name="activity"]').forEach(checkbox => {
            checkbox.addEventListener("change", updateNextButton);
        });
        updateNextButton();
    }

    // Search activities
    activitySearch.addEventListener("input", () => {
        const query = activitySearch.value.toLowerCase();
        console.log(`Search query: ${query}`);
        document.querySelectorAll(".activity-group li").forEach(li => {
            const text = li.textContent.toLowerCase();
            li.style.display = query && !text.includes(query) ? "none" : "block";
        });
    });

    // Step 2: Activities
    activitiesForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("Activities form submitted");
        selectedActivities = Array.from(document.querySelectorAll('input[name="activity"]:checked')).map(cb => ({
            activity: cb.value,
            hazard: cb.dataset.hazard,
            risk: cb.dataset.risk,
            controls: cb.dataset.controls,
            legal: cb.dataset.legal
        }));
        if (!selectedActivities.length) {
            alert("Please select at least one activity.");
            console.warn("No activities selected");
            return;
        }
        console.log("Selected activities:", selectedActivities);
        populateRatings();
        showStep("step-3");
    });

    // Back button for Step 2
    activitiesForm.querySelector(".back-btn").addEventListener("click", () => {
        console.log("Back to step-1");
        showStep("step-1");
    });

    // Populate ratings table
    function populateRatings() {
        console.log("Populating ratings table");
        ratingsTableBody.innerHTML = "";
        selectedActivities.forEach((item, index) => {
            ratingsTableBody.innerHTML += `
                <tr>
                    <td>${item.activity}</td>
                    <td>${item.hazard}</td>
                    <td>${item.risk}</td>
                    <td>${item.controls}</td>
                    <td>${item.legal}</td>
                    <td>
                        <select name="rating-${index}" required aria-label="Risk rating for ${item.activity}">
                            <option value="" disabled selected>Select rating</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        ratingsForm.querySelector("button[type='submit']").disabled = true;
        ratingsForm.addEventListener("change", () => {
            const allRated = Array.from(ratingsForm.querySelectorAll("select")).every(select => select.value);
            ratingsForm.querySelector("button[type='submit']").disabled = !allRated;
            console.log(`Ratings next button: ${allRated ? 'enabled' : 'disabled'}`);
        });
    }

    // Step 3: Ratings
    ratingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("Ratings form submitted");
        ratings = {};
        Array.from(ratingsForm.querySelectorAll("select")).forEach(select => {
            const index = select.name.split("-")[1];
            ratings[selectedActivities[index].activity + "-" + selectedActivities[index].hazard] = select.value;
        });
        console.log("Ratings:", ratings);
        populateReview();
        showStep("step-4");
    });

    // Back button for Step 3
    ratingsForm.querySelector(".back-btn").addEventListener("click", () => {
        console.log("Back to step-2");
        showStep("step-2");
    });

    // Populate review table
    function populateReview() {
        console.log("Populating review table");
        reviewTableBody.innerHTML = "";
        selectedActivities.forEach(item => {
            reviewTableBody.innerHTML += `
                <tr>
                    <td>${item.activity}</td>
                    <td>${item.hazard}</td>
                    <td>${item.risk}</td>
                    <td>${item.controls}</td>
                    <td>${item.legal}</td>
                    <td>${ratings[item.activity + "-" + item.hazard]}</td>
                </tr>
            `;
        });

        if (document.getElementById("assessment-type").value === "baseline") {
            complianceNote.classList.remove("hidden");
            console.log("Showing compliance note");
        } else {
            complianceNote.classList.add("hidden");
        }
    }

    // Step 4: Review
    reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("Review form submitted");
        assessmentDetails = {
            type: document.getElementById("assessment-type").value,
            siteName: document.getElementById("site-name").value.trim(),
            siteAddress: document.getElementById("site-address").value.trim(),
            siteLocation: document.getElementById("site-location").value.trim(),
            conductorName: document.getElementById("conductor-name").value.trim(),
            conductorRole: document.getElementById("conductor-role").value.trim(),
            conductorEmail: document.getElementById("conductor-email").value.trim(),
            conductorPhone: document.getElementById("conductor-phone").value.trim(),
            companyName: document.getElementById("company-name").value.trim(),
            companyContact: document.getElementById("company-contact").value.trim(),
            companyRole: document.getElementById("company-role").value.trim(),
            companyDetails: document.getElementById("company-details").value.trim(),
            notes: document.getElementById("custom-notes").value.trim(),
            conductorSignature: "___________________________",
            conductorDate: new Date().toISOString().split("T")[0],
            companySignature: "___________________________",
            companyDate: new Date().toISOString().split("T")[0]
        };
        if (!assessmentDetails.siteName) {
            alert("Please enter a site/project name.");
            console.warn("No site name provided");
            return;
        }
        console.log("Assessment details:", assessmentDetails);
        generatePDF();
        showStep("step-5");
    });

    // Back button for Step 4
    reviewForm.querySelector(".back-btn").addEventListener("click", () => {
        console.log("Back to step-3");
        showStep("step-3");
    });

    // Calculate overall risk rating
    function calculateOverallRating() {
        const ratingValues = Object.values(ratings).map(rating => {
            return rating === "High" ? 3 : rating === "Medium" ? 2 : 1;
        });
        const average = ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length;
        if (average >= 2.5) return "High";
        if (average >= 1.5) return "Medium";
        return "Low";
    }

    // Generate PDF
    function generatePDF() {
        console.log("Generating PDF");
        if (!window.jspdf?.jsPDF) {
            alert("PDF generation failed. Please try again later.");
            console.error("jsPDF not loaded");
            return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Header
        const assessmentType = assessmentDetails.type.charAt(0).toUpperCase() + assessmentDetails.type.slice(1);
        const overallRating = calculateOverallRating();
        doc.setFontSize(16);
        doc.text(`${assessmentType} Risk Assessment – Overall Rating: ${overallRating}`, 10, 10);

        // Site/Project Details
        doc.setFontSize(12);
        doc.text(`Site/Project: ${assessmentDetails.siteName}`, 10, 20);
        doc.text(`Address: ${assessmentDetails.siteAddress || "N/A"}`, 10, 28);
        doc.text(`Location: ${assessmentDetails.siteLocation || "N/A"}`, 10, 36);

        // Conducted By
        doc.text("Conducted By:", 10, 44);
        doc.text(`Name: ${assessmentDetails.conductorName || "N/A"}`, 10, 52);
        doc.text(`Role: ${assessmentDetails.conductorRole || "N/A"}`, 10, 60);
        doc.text(`Email: ${assessmentDetails.conductorEmail || "N/A"}`, 10, 68);
        doc.text(`Phone: ${assessmentDetails.conductorPhone || "N/A"}`, 10, 76);

        // Conducted On Behalf Of
        doc.text("Conducted On Behalf Of:", 10, 84);
        doc.text(`Company: ${assessmentDetails.companyName || "N/A"}`, 10, 92);
        doc.text(`Contact: ${assessmentDetails.companyContact || "N/A"}`, 10, 100);
        doc.text(`Role: ${assessmentDetails.companyRole || "N/A"}`, 10, 108);
        doc.text(`Details: ${assessmentDetails.companyDetails || "N/A"}`, 10, 116);

        // Risk Assessment Table
        const tableData = selectedActivities.map(item => [
            item.activity,
            item.hazard,
            item.risk,
            item.controls,
            item.legal,
            ratings[item.activity + "-" + item.hazard]
        ]);
        if (assessmentDetails.notes) {
            tableData.push(["Custom Notes", "", "", assessmentDetails.notes, "", ""]);
        }
        doc.autoTable({
            startY: 124,
            head: [["Activity", "Hazard", "Risk", "Control Measures", "Legal Reference", "Rating"]],
            body: tableData,
            theme: "grid",
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 30 },
                2: { cellWidth: 30 },
                3: { cellWidth: 40 },
                4: { cellWidth: 30 },
                5: { cellWidth: 20 }
            }
        });

        // Signatures
        const tableEndY = doc.lastAutoTable.finalY + 20;
        doc.text("Signatures:", 10, tableEndY);
        doc.text(`Conducted By: ${assessmentDetails.conductorSignature}`, 10, tableEndY + 8);
        doc.text(`Date: ${assessmentDetails.conductorDate}`, 10, tableEndY + 16);
        doc.text(`On Behalf Of: ${assessmentDetails.companySignature}`, 10, tableEndY + 24);
        doc.text(`Date: ${assessmentDetails.companyDate}`, 10, tableEndY + 32);

        // Footer
        doc.setFontSize(8);
        const footerText = "© 2025 SafetyFirst.help | Powered by Safety First Book Series: The Essentials of OHS Plans, Risk Management for Safer Sites, Contact: salatiso@safetyfirst.help | All rights reserved.";
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(footerText, 105, 287, { align: "center", maxWidth: 190 });
            doc.text(`Page ${i} of ${pageCount}`, 190, 287, { align: "right" });
        }

        doc.save(`Risk_Assessment_${assessmentDetails.siteName.replace(/\s+/g, "_")}.pdf`);
        console.log("PDF generated");
    }

    // Step 5: Guidance
    document.getElementById("download-again").addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Download again clicked");
        generatePDF();
    });

    document.getElementById("start-new").addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Start new assessment");
        selectedActivities = [];
        ratings = {};
        assessmentDetails = {};
        assessmentTypeForm.reset();
        activitiesForm.reset();
        ratingsForm.reset();
        reviewForm.reset();
        activitySearch.value = "";
        activityGroups.innerHTML = "";
        ratingsTableBody.innerHTML = "";
        reviewTableBody.innerHTML = "";
        complianceNote.classList.add("hidden");
        showStep("step-1");
    });

    // Chatbot Logic
    // Note: The chatbot logic here is a duplicate of what's in chatbot.js.
    // For a production environment, it's recommended to centralize chatbot logic
    // in one file (e.g., chatbot.js) and import/call its functions from other pages.
    document.getElementById('chat-toggle').addEventListener('click', () => {
        console.log("Toggling chatbot");
        document.getElementById('chat-window').classList.toggle('chat-hidden');
    });

    document.getElementById('chat-send').addEventListener('click', async () => {
        console.log("Chat send clicked");
        const input = document.getElementById('chat-input').value.trim();
        const output = document.getElementById('chat-output');
        if (!input) return;

        output.innerHTML += `<p><strong>You:</strong> ${input}</p>`;
        const query = input.toLowerCase();

        // Ensure db is initialized before querying Firestore
        if (!db) {
            output.innerHTML += `<p><strong>Chatbot:</strong> Oops, chatbot database not available. Please try again later.</p>`;
            output.scrollTop = output.scrollHeight;
            return;
        }

        try {
            // Firestore query for OHS knowledge
            const snapshot = await getDocs(collection(db, 'ohs-knowledge'));
            let response = "Sorry, I couldn’t find an exact match. Try rephrasing!";
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.content && data.content.toLowerCase().includes(query)) {
                    response = `<strong>From ${data.book}, Chapter ${data.chapter}:</strong><br>${data.content.substring(0, 200)}... (See <a href="/safety-plans/resources/${data.file}">full chapter</a>)`;
                }
            });
            output.innerHTML += `<p><strong>Chatbot:</strong> ${response}</p>`;
        } catch (error) {
            console.error("Firestore query failed:", error);
            output.innerHTML += `<p><strong>Chatbot:</strong> Oops, something went wrong. Please try again!</p>`;
        }

        document.getElementById('chat-input').value = '';
        output.scrollTop = output.scrollHeight;
    });

    // Layout Adjustment
    function adjustLayout() {
        console.log("Adjusting layout");
        const headerHeight = document.querySelector("header").offsetHeight || 0;
        const sidebar = document.querySelector(".sidebar");
        const mainContent = document.querySelector(".main-content");
        if (sidebar && mainContent) {
            sidebar.style.top = `${headerHeight}px`;
            sidebar.style.height = `calc(100vh - ${headerHeight}px)`;
            mainContent.style.marginLeft = `${sidebar.offsetWidth}px`;
            mainContent.style.paddingTop = `${headerHeight}px`;
            mainContent.style.minHeight = `calc(100vh - ${headerHeight}px)`;
        }
    }
    window.addEventListener("load", adjustLayout);
    window.addEventListener("resize", adjustLayout);

    // Initial layout adjustment
    adjustLayout();
});
