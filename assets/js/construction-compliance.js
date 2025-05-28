/**
 * Construction Compliance JavaScript
 * Manages the safety compliance wizard, cart, PDF generation, and chatbot UI.
 */

import { addHeaderFooter as commonAddHeaderFooter } from '/safety-plans/assets/js/common.js';

// Check for jsPDF
const jsPDF = window.jspdf?.jsPDF;
if (!jsPDF) {
    console.error("jsPDF not loaded. Please check script inclusion.");
    alert("PDF generation library (jsPDF) not loaded. Please contact support.");
}

// Simulated User Authentication
let currentUser = null; // { id: string, email: string, clients: [], contractors: [] }
const loggedIn = () => !!currentUser;

// Storage Keys and Expiry
const CLIENT_STORAGE_KEY = "safetyHelpClients";
const CONTRACTOR_STORAGE_KEY = "safetyHelpContractors";
const PROJECT_STORAGE_KEY = "safetyHelpProjects";
const CART_STORAGE_KEY = "cart";
const INVOICE_STORAGE_KEY = "safetyHelpInvoice";
const EXPIRY_DAYS = 7;

// Utility Functions
const generateReferenceNumber = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const saveWithExpiry = (key, data, expiryDays = EXPIRY_DAYS) => {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + expiryDays);
    const storedData = {
        referenceNumber: generateReferenceNumber(),
        data,
        expiry: expiry.getTime(),
        created: new Date().getTime()
    };
    localStorage.setItem(key, JSON.stringify(storedData));
    return storedData.referenceNumber;
};

const getWithExpiry = (key, referenceNumber) => {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const storedData = JSON.parse(stored);
    if (storedData.referenceNumber !== referenceNumber) return null;
    const now = new Date().getTime();
    if (now > storedData.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return storedData.data;
};

// Cart Management
let cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];

const addToCart = (documentName, price, type, data) => {
    cart.push({ documentName, price, type, data });
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartDisplay();
};

  updateCartDisplay();
};

const updateCartDisplay = () => {
    const cartItems = document.getElementById('cart-items');
    const cartContainer = document.getElementById('cart-container');
    const invoiceRef = document.getElementById('invoice-reference');
    const invoiceRefNumber = document.getElementById('invoice-ref-number');
    if (!cartItems || !cartContainer || !invoiceRef || !invoiceRefNumber) {
        console.error("Cart elements not found.");
        return;
    }
    
    cartItems.innerHTML = '';
    cart.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.documentName}</td>
            <td>R ${item.price.toFixed(2)}</td>
        `;
        cartItems.appendChild(row);
    });
    cartContainer.classList.toggle('hidden', cart.length === 0);
    invoiceRef.classList.toggle('hidden', cart.length === 0);
    if (cart.length > 0) {
        const invoiceData = JSON.parse(localStorage.getItem(INVOICE_STORAGE_KEY)) || {};
        invoiceRefNumber.textContent = invoiceData.referenceNumber || "N/A";
    }
};

// Wizard State
let currentStep = 0;
let formData = {
    documentTypes: [],
    client: {},
    contractorAppointed: '',
    contractor: {},
    project: {},
    scope: {},
    compiledBy: {},
    compiledFor: {},
    additionalSignatories: []
};

// High-Risk Activities
const highRiskActivities = [
    "Working from Heights",
    "Asbestos Removal",
    "Confined Space Entry",
    "Demolition",
    "Working with Live Voltage",
    "Crane Operations",
    "Excavation",
    "Working Near Water",
    "Working in Tunnels"
];

// PDF Utility Functions
function addHeaderFooter(doc, title, pageNumber, totalPages) {
    commonAddHeaderFooter(doc, pageNumber, title);
    doc.setFontSize(10);
    doc.setTextColor(26, 37, 38);
    doc.text(`Reference: ${formData.project.referenceNumber || 'N/A'}`, 10, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 10, 35);
}

function addCoverPage(doc, documentName, compiledBy, compiledFor) {
    doc.addPage();
    addHeaderFooter(doc, documentName, 1, 1);
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    let y = 50;
    doc.text("Compiled By:", 10, y); y += 10;
    doc.text(`Name: ${compiledBy.name}`, 10, y); y += 10;
    doc.text(`Role: ${compiledBy.role}${compiledBy.sacpcmpReg && compiledBy.sacpcmpReg !== "N/A" ? ` (SACPCMP Reg: ${compiledBy.sacpcmpReg})` : ''}`, 10, y); y += 10;
    doc.text(`Contact: ${compiledBy.number}, ${compiledBy.email}`, 10, y); y += 20;
    doc.text("Compiled For:", 10, y); y += 10;
    doc.text(`Name: ${compiledFor.name}`, 10, y); y += 10;
    doc.text(`Role: ${compiledFor.role}${compiledFor.specify && compiledFor.specify !== "N/A" ? ` (${compiledFor.specify})` : ''}`, 10, y); y += 10;
    doc.text(`Contact: ${compiledFor.number}, ${compiledFor.email}`, 10, y); y += 20;
    doc.text("Project Details:", 10, y); y += 10;
    doc.text(`Project Name: ${formData.project.projectName}`, 10, y); y += 10;
    doc.text(`Site Address: ${formData.project.siteAddress}`, 10, y); y += 10;
    doc.text(`Client Ref: ${formData.client.referenceNumber || 'N/A'}`, 10, y); y += 10;
    doc.text(`Project Ref: ${formData.project.referenceNumber || 'N/A'}`, 10, y);
}

function addMetadataAndDisclaimer(doc) {
    doc.addPage();
    addHeaderFooter(doc, "Metadata and Disclaimer", 1, 1);
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    let y = 50;
    doc.text("Document Version:", 10, y); y += 10;
    doc.text("Version 1.0", 10, y); y += 20;
    doc.text("Disclaimer:", 10, y); y += 10;
    doc.setFontSize(10);
    doc.text("While SafetyHelp provides tools to assist in creating this document, the completeness and accuracy of the final document are the responsibility of the document owner. It is the owner’s duty to ensure compliance with all applicable laws and regulations, including the Occupational Health and Safety Act and Construction Regulations. Where a project scope requires a SACPCMP-accredited professional (e.g., PrCHSA or CHSO), SafetyHelp recommends engaging such a professional to ensure compliance.", 10, y, { maxWidth: 190 });
    y += 40;
    const hasHighRisk = formData.scope.activities ? formData.scope.activities.some(activity => highRiskActivities.includes(activity)) : false;
    if (hasHighRisk) {
        doc.setTextColor(255, 215, 0);
        doc.text("Recommendation:", 10, y); y += 10;
        doc.setTextColor(51, 51, 51);
        doc.text("This project involves high-risk activities. SafetyHelp recommends engaging a SACPCMP-accredited professional (PrCHSA or CHSO) to oversee compliance.", 10, y, { maxWidth: 190 });
    }
}

function addSignaturePage(doc, compiledBy, compiledFor, additionalSignatories = []) {
    doc.addPage();
    addHeaderFooter(doc, "Signatures", 1, 1);
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    let y = 50;
    doc.text("Signatures", 10, y); y += 10;
    const tableData = [
        ["Compiled By", compiledBy.name, "[Signature Placeholder]", new Date().toLocaleDateString()],
        ["Compiled For", compiledFor.name, "[Signature Placeholder]", new Date().toLocaleDateString()]
    ];
    additionalSignatories.forEach(sig => {
        tableData.push(["Additional Signatory", sig.name, "[Signature Placeholder]", new Date().toLocaleDateString()]);
    });
    doc.autoTable({
        startY: y,
        head: [['Role', 'Name', 'Signature', 'Date']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40 }, 2: { cellWidth: 60 }, 3: { cellWidth: 40 } }
    });
}

function addServicesPage(doc) {
    doc.addPage();
    addHeaderFooter(doc, "Explore More with SafetyHelp", 1, 1);
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    let y = 50;
    doc.text("Explore More with SafetyHelp", 10, y); y += 10;
    const services = [
        "Health and Safety Specifications",
        "Health and Safety Plans",
        "Risk Assessments",
        "Training and Induction",
        "Legal Appointments",
        "Inspections and Audits",
        "Incident Management",
        "Compliance Reports",
        "Health and Safety File Compilation"
    ];
    services.forEach(service => {
        doc.text(`- ${service}`, 10, y); y += 10;
    });
    y += 10;
    doc.text("Visit safetyhelp.com to learn more and register for permanent document storage!", 10, y);
}

// PDF Generation Functions
function generateInvoicePDF() {
    if (!jsPDF) return;
    try {
        const doc = new jsPDF();
        addHeaderFooter(doc, "Invoice", 1, 1);
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51);
        let y = 50;
        doc.text("Client Details:", 10, y); y += 10;
        doc.text(`Name: ${formData.client.clientName}`, 10, y); y += 10;
        doc.text(`Contact: ${formData.client.clientContactNumber}, ${formData.client.clientEmail}`, 10, y); y += 20;
        doc.text("Invoice Details:", 10, y); y += 10;
        const tableData = cart.map(item => [item.documentName, `R ${item.price.toFixed(2)}`]);
        doc.autoTable({
            startY: y,
            head: [['Document', 'Price']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 10 },
            columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 60 } }
        });
        y = doc.lastAutoTable.finalY + 20;
        const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
        const discount = document.getElementById("promo-code").value === "SAFETYFIRST25" ? 0.25 : 0;
        const finalPrice = totalPrice * (1 - discount);
        doc.text(`Total Price: R ${totalPrice.toFixed(2)}`, 10, y);
        if (discount > 0) {
            y += 10;
            doc.text(`Discount (25%): R ${(totalPrice * discount).toFixed(2)}`, 10, y);
            y += 10;
            doc.text(`Final Price: R ${finalPrice.toFixed(2)}`, 10, y);
        }
        y += 20;
        doc.setFontSize(10);
        doc.text("Note: Your invoice reference number allows you to retrieve documents for 7 days. Register at safetyhelp.com to store them indefinitely.", 10, y, { maxWidth: 190 });
        doc.save("Invoice.pdf");
    } catch (error) {
        console.error("Invoice PDF generation error:", error);
        alert("Failed to generate invoice PDF. Please try again.");
    }
}

function generateOHSSpecPDF(data) {
    if (!jsPDF) return;
    try {
        const doc = new jsPDF();
        addCoverPage(doc, "Health and Safety Specification", data.compiledBy, data.compiledFor);
        addMetadataAndDisclaimer(doc);
        doc.addPage();
        addHeaderFooter(doc, "Health and Safety Specification", 1, 1);
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51);
        let y = 50;
        doc.text("Client Details:", 10, y); y += 10;
        doc.text(`Name: ${data.client.clientName}`, 10, y); y += 10;
        doc.text(`Address: ${data.client.clientAddress}`, 10, y); y += 10;
        doc.text(`Contact: ${data.client.clientContactPerson} (${data.client.clientContactRole})`, 10, y); y += 10;
        doc.text(`Phone: ${data.client.clientContactNumber}, Email: ${data.client.clientEmail}`, 10, y); y += 10;
        doc.text(`COIDA Registration: ${data.client.clientCoida}`, 10, y); y += 20;
        doc.text("Contractor Details:", 10, y); y += 10;
        if (data.contractorAppointed === "yes") {
            doc.text(`Name: ${data.contractor.contractorName}`, 10, y); y += 10;
            doc.text(`Address: ${data.contractor.contractorAddress}`, 10, y); y += 10;
            doc.text(`Contact: ${data.contractor.contractorContactPerson} (${data.contractor.contractorContactRole})`, 10, y); y += 10;
            doc.text(`Phone: ${data.contractor.contractorContactNumber}, Email: ${data.contractor.contractorEmail}`, 10, y); y += 10;
            doc.text(`COIDA Registration: ${data.contractor.contractorCoida}`, 10, y);
        } else {
            doc.text(`Contractor: ${data.contractorAppointed === "no" ? "Not Appointed" : "Not Applicable"}`, 10, y);
        }
        y += 20;
        doc.text("Project Scope:", 10, y); y += 10;
        doc.text(`Type of Work: ${data.scope.typeOfWork}`, 10, y); y += 10;
        doc.text(`CIDB Grading: ${data.scope.cidbGrade}`, 10, y); y += 10;
        doc.text(`Cost: R ${data.scope.cost}`, 10, y); y += 10;
        doc.text(`Duration: ${data.scope.duration} days`, 10, y); y += 10;
        const activities = data.scope.activities ? (Array.isArray(data.scope.activities) ? data.scope.activities.join(", ") : data.scope.activities) : "None";
        doc.text(`Activities: ${activities}`, 10, y); y += 20;
        doc.text("Scope Details:", 10, y); y += 10;
        doc.text(data.scope.scopeDetails, 10, y, { maxWidth: 190 });
        addSignaturePage(doc, data.compiledBy, data.compiledFor, data.additionalSignatories);
        addServicesPage(doc);
        doc.save("Health_and_Safety_Specification.pdf");
    } catch (error) {
        console.error("PDF generation error:", error);
        alert("Failed to generate PDF. Please try again.");
    }
}

function generateHSPlanPDF(data) {
    if (!jsPDF) return;
    try {
        const doc = new jsPDF();
        addCoverPage(doc, "Health and Safety Plan", data.compiledBy, data.compiledFor);
        addMetadataAndDisclaimer(doc);
        doc.addPage();
        addHeaderFooter(doc, "Health and Safety Plan", 1, 1);
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51);
        let y = 50;
        doc.text("Client Details:", 10, y); y += 10;
        doc.text(`Name: ${data.client.clientName}`, 10, y); y += 10;
        doc.text(`Address: ${data.client.clientAddress}`, 10, y); y += 10;
        doc.text(`Contact: ${data.client.clientContactPerson} (${data.client.clientContactRole})`, 10, y); y += 10;
        doc.text(`Phone: ${data.client.clientContactNumber}, Email: ${data.client.clientEmail}`, 10, y); y += 10;
        doc.text(`COIDA Registration: ${data.client.clientCoida}`, 10, y); y += 20;
        doc.text("Contractor Details:", 10, y); y += 10;
        if (data.contractorAppointed === "yes") {
            doc.text(`Name: ${data.contractor.contractorName}`, 10, y); y += 10;
            doc.text(`Address: ${data.contractor.contractorAddress}`, 10, y); y += 10;
            doc.text(`Contact: ${data.contractor.contractorContactPerson} (${data.contractor.contractorContactRole})`, 10, y); y += 10;
            doc.text(`Phone: ${data.contractor.contractorContactNumber}, Email: ${data.contractor.contractorEmail}`, 10, y); y += 10;
            doc.text(`COIDA Registration: ${data.contractor.contractorCoida}`, 10, y);
        } else {
            doc.text(`Contractor: ${data.contractorAppointed === "no" ? "Not Appointed" : "Not Applicable"}`, 10, y);
        }
        y += 20;
        doc.text("Project Scope:", 10, y); y += 10;
        doc.text(`Type of Work: ${data.scope.typeOfWork}`, 10, y); y += 10;
        doc.text(`CIDB Grading: ${data.scope.cidbGrade}`, 10, y); y += 10;
        doc.text(`Cost: R ${data.scope.cost}`, 10, y); y += 10;
        doc.text(`Duration: ${data.scope.duration} days`, 10, y); y += 10;
        const activities = data.scope.activities ? (Array.isArray(data.scope.activities) ? data.scope.activities.join(", ") : data.scope.activities) : "None";
        doc.text(`Activities: ${activities}`, 10, y); y += 20;
        doc.text("Scope Details:", 10, y); y += 10;
        doc.text(data.scope.scopeDetails, 10, y, { maxWidth: 190 });
        doc.addPage();
        addHeaderFooter(doc, "Safety Policies and Procedures", 1, 1);
        y = 50;
        doc.text("Safety Policies:", 10, y); y += 10;
        doc.text("[Placeholder for Safety Policies]", 10, y); y += 20;
        doc.text("Emergency Procedures:", 10, y); y += 10;
        doc.text("[Placeholder for Emergency Procedures]", 10, y);
        addSignaturePage(doc, data.compiledBy, data.compiledFor, data.additionalSignatories);
        addServicesPage(doc);
        doc.save("Health_and_Safety_Plan.pdf");
    } catch (error) {
        console.error("PDF generation error:", error);
        alert("Failed to generate PDF. Please try again.");
    }
}

function generateHSFilePDF(data) {
    if (!jsPDF) return;
    try {
        const doc = new jsPDF();
        addCoverPage(doc, "Health and Safety File", data.compiledBy, data.compiledFor);
        addMetadataAndDisclaimer(doc);
        doc.addPage();
        addHeaderFooter(doc, "Health and Safety File", 1, 1);
        doc.setFontSize(12);
        doc.setTextColor(51, 51, 51);
        let y = 50;
        doc.text("This Health and Safety File includes all selected documents for the project.", 10, y); y += 20;
        doc.text("Documents Included:", 10, y); y += 10;
        const documents = cart.filter(item => item.type !== "hs-file").map(item => item.documentName);
        documents.forEach(docName => {
            doc.text(`- ${docName}`, 10, y); y += 10;
        });
        addSignaturePage(doc, data.compiledBy, data.compiledFor, data.additionalSignatories);
        addServicesPage(doc);
        doc.save("Health_and_Safety_File.pdf");
    } catch (error) {
        console.error("PDF generation error:", error);
        alert("Failed to generate PDF. Please try again.");
    }
}

// Initialize on Page Load
document.addEventListener("DOMContentLoaded", () => {
    console.log("construction-compliance.js loaded");

    const sidebar = document.querySelector(".sidebar");
    const mainContent = document.querySelector(".main-content");
    if (!sidebar || !mainContent) {
        console.error("Critical layout elements missing: .sidebar or .main-content not found.");
        return;
    }

    const loginLink = document.getElementById("login-link");
    if (loginLink) {
        loginLink.addEventListener("click", (e) => {
            e.preventDefault();
            if (loggedIn()) {
                currentUser = null;
                alert("Logged out");
                loginLink.textContent = i18next.t("header.nav.login");
            } else {
                const email = prompt("Enter your email to login (for demo purposes):");
                if (email) {
                    currentUser = { id: "user1", email, clients: [], contractors: [] };
                    alert(`Logged in as ${email}`);
                    loginLink.textContent = "Logout";
                }
            }
        });
    }

    const wizardContainer = document.getElementById('wizard-content');
    const wizardSidebar = document.getElementById('wizard-sidebar');

    const sidebarContent = [
        `
            <h3 data-i18n="sidebar.step_0.title">📜 Welcome to SafetyHelp</h3>
            <p data-i18n="sidebar.step_0.description">Explore our comprehensive tools and resources to enhance occupational health and safety in your workplace.</p>
            <p class="fun-fact" data-i18n="sidebar.step_0.fun_fact">⚡ Did you know using reputable ethical suppliers can reduce workplace hazards by ensuring work is done on time and to the highest quality and safety standards?</p>
        `,
        `
            <h3 data-i18n="sidebar.step_1.title">📋 Legislation</h3>
            <p data-i18n="sidebar.step_1.description">Construction Regulation 5(1)(b) requires a Health and Safety Specification for all projects, while 7(1)(b) mandates an H&S File.</p>
            <p class="fun-fact" data-i18n="sidebar.step_1.fun_fact">🛡️ Fun Fact: A solid H&S Spec can reduce accidents by 30%! It’s like a safety shield for your project.</p>
        `,
        `
            <h3 data-i18n="sidebar.step_1.title">📋 Legislation</h3>
            <p data-i18n="sidebar.step_2.description">Construction Regulation 5: Clients must provide a Health & Safety Specification and ensure contractors comply.</p>
            <p class="fun-fact" data-i18n="sidebar.step_2.fun_fact">💼 Fun Fact: Clients who stay on top of COIDA registration can avoid hefty fines—keep that number handy!</p>
        `,
        `
            <h3 data-i18n="sidebar.step_3.title">📜 Legislation</h3>
            <p data-i18n="sidebar.step_3.description">Construction Regulation 7(1)(a): Contractors must develop a Health & Safety Plan based on the client’s specification.</p>
            <p class="fun-fact" data-i18n="sidebar.step_3.fun_fact">🤝 Fun Fact: Appointing a contractor early can speed up compliance—teamwork makes the safety dream work!</p>
        `,
        `
            <h3 data-i18n="sidebar.step_4.title">📋 Legislation</h3>
            <p data-i18n="sidebar.step_4.description">Construction Regulation 7(1)(b): Contractors must maintain an on-site Health & Safety File with all required documents.</p>
            <p class="fun-fact" data-i18n="sidebar.step_4.fun_fact">📞 Fun Fact: Having a contractor’s contact details ready can save the day during an emergency—stay connected!</p>
        `,
        `
            <h3 data-i18n="sidebar.step_5.title">📜 Legislation</h3>
            <p data-i18n="sidebar.step_5.description">Construction Regulation 3(1): A permit is required for projects over R40,000 or lasting more than 180 days.</p>
            <p class="fun-fact" data-i18n="sidebar.step_5.fun_fact">🚧 Fun Fact: Clear site addresses help emergency crews find you faster—don’t let a typo slow down help!</p>
        `,
        `
            <h3 data-i18n="sidebar.step_6.title">📋 Legislation</h3>
            <p data-i18n="sidebar.step_6.description">Construction Regulation 9: Task-specific Hazard Identification and Risk Assessments (HIRAs) are mandatory for all activities.</p>
            <p class="fun-fact" data-i18n="sidebar.step_6.fun_fact">🔍 Fun Fact: Spotting high-risk activities early can cut risks by 25%—it’s like giving your project a safety superpower!</p>
        `,
        `
            <h3 data-i18n="sidebar.step_7.title">📜 Legislation</h3>
            <p data-i18n="sidebar.step_7.description">SACPCMP Guidelines: CHSOs and PrCHSAs must maintain registration and CPD to ensure compliance.</p>
            <p class="fun-fact" data-i18n="sidebar.step_7.fun_fact">🧑‍💼 Fun Fact: A registered SACPCMP pro can slash legal risks—your project’s safety MVP!</p>
        `,
        `
            <h3 data-i18n="sidebar.step_8.title">📋 Legislation</h3>
            <p data-i18n="sidebar.step_8.description">Construction Regulation 5(1)(l): Clients must approve the contractor’s H&S Plan before work begins.</p>
            <p class="fun-fact" data-i18n="sidebar.step_8.fun_fact">📝 Fun Fact: Clear accountability in docs can boost project transparency—everyone knows their role!</p>
        `,
        `
            <h3 data-i18n="sidebar.step_9.title">📜 Legislation</h3>
            <p data-i18n="sidebar.step_9.description">Occupational Health and Safety Act: Proper documentation ensures compliance and protects all stakeholders.</p>
            <p class="fun-fact" data-i18n="sidebar.step_9.fun_fact">🛒 Fun Fact: Your cart is your safety toolkit—each doc you add makes your project safer!</p>
        `
    ];

    // Wizard Steps
    const steps = [
        () => `
            <p data-i18n="wizard.step_0">Please select an action to begin the process.</p>
        `,
        () => `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 11%;"></div>
            </div>
            <h3 data-i18n="wizard.step_1.title">Step 1 of 9: What Would You Like to Do?</h3>
            <div class="form-group">
                <label data-i18n="wizard.step_1.label">Select Documents to Compile (Select all that apply):</label>
                <table class="document-table">
                    <thead>
                        <tr>
                            <th data-i18n="wizard.step_1.table.number">#</th>
                            <th data-i18n="wizard.step_1.table.document">Document</th>
                            <th data-i18n="wizard.step_1.table.select">Select</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td class="document-name"><span class="emoji">📋</span> <span data-i18n="wizard.step_1.documents.hs_spec">Health and Safety Specification</span></td>
                            <td><input type="checkbox" id="hs-spec" name="documentTypes" value="hs-spec" ${formData.documentTypes.includes('hs-spec') ? 'checked' : ''}></td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td class="document-name"><span class="emoji">🛡️</span> <span data-i18n="wizard.step_1.documents.hs_plan">Health and Safety Plan</span></td>
                            <td><input type="checkbox" id="hs-plan" name="documentTypes" value="hs-plan" ${formData.documentTypes.includes('hs-plan') ? 'checked' : ''}></td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td class="document-name"><span class="emoji">⚠️</span> <span data-i18n="wizard.step_1.documents.risk_assessment">Risk Assessment</span></td>
                            <td><input type="checkbox" id="risk-assessment" name="documentTypes" value="risk-assessment" ${formData.documentTypes.includes('risk-assessment') ? 'checked' : ''}></td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td class="document-name"><span class="emoji">🎓</span> <span data-i18n="wizard.step_1.documents.training">Conduct Training</span></td>
                            <td><input type="checkbox" id="training" name="documentTypes" value="training" ${formData.documentTypes.includes('training') ? 'checked' : ''}></td>
                        </tr>
                        <tr>
                            <td>5</td>
                            <td class="document-name"><span class="emoji">📜</span> <span data-i18n="wizard.step_1.documents.appointments">Make Legal Appointments</span></td>
                            <td><input type="checkbox" id="appointments" name="documentTypes" value="appointments" ${formData.documentTypes.includes('appointments') ? 'checked' : ''}></td>
                        </tr>
                        <tr>
                            <td>6</td>
                            <td class="document-name"><span class="emoji">🔍</span> <span data-i18n="wizard.step_1.documents.inspections">Conduct Inspections/Audits</span></td>
                            <td><input type="checkbox" id="inspections" name="documentTypes" value="inspections" ${formData.documentTypes.includes('inspections') ? 'checked' : ''}></td>
                        </tr>
                        <tr>
                            <td>7</td>
                            <td class="document-name"><span class="emoji">🚑</span> <span data-i18n="wizard.step_1.documents.incidents">Manage Incidents</span></td>
                            <td><input type="checkbox" id="incidents" name="documentTypes" value="incidents" ${formData.documentTypes.includes('incidents') ? 'checked' : ''}></td>
                        </tr>
                        <tr>
                            <td>8</td>
                            <td class="document-name"><span class="emoji">📊</span> <span data-i18n="wizard.step_1.documents.reports">Compile Reports</span></td>
                            <td><input type="checkbox" id="reports" name="documentTypes" value="reports" ${formData.documentTypes.includes('reports') ? 'checked' : ''}></td>
                        </tr>
                        <tr>
                            <td>9</td>
                            <td class="document-name"><span class="emoji">📁</span> <span data-i18n="wizard.step_1.documents.hs_file">Health and Safety File</span></td>
                            <td><input type="checkbox" id="hs-file" name="documentTypes" value="hs-file" ${formData.documentTypes.includes('hs-file') ? 'checked' : ''}></td>
                        </tr>
                    </tbody>
                </table>
                <p id="document-types-error" class="error hidden" data-i18n="wizard.step_1.error">Please select at least one document to compile.</p>
            </div>
            <div class="nav-buttons">
                <button id="back-btn" disabled data-i18n="wizard.back">Back</button>
                <button id="next-btn" data-i18n="wizard.next">Next</button>
            </div>
        `,
        () => `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 22%;"></div>
            </div>
            <h3 data-i18n="wizard.step_2.title">Step 2 of 9: Client Details</h3>
            <div class="form-group">
                <label for="client-name" data-i18n="wizard.step_2.client_name">Client Company Name:</label>
                <input type="text" id="client-name" name="clientName" value="${formData.client.clientName || ''}" required aria-label="Client Company Name" aria-describedby="client-name-error">
                <p id="client-name-error" class="error hidden" data-i18n="wizard.step_2.errors.client_name">Please enter a client company name.</p>
            </div>
            <div class="form-group">
                <label for="client-address" data-i18n="wizard.step_2.client_address">Client Address:</label>
                <input type="text" id="client-address" name="clientAddress" value="${formData.client.clientAddress || ''}" required aria-label="Client Address" aria-describedby="client-address-error">
                <p id="client-address-error" class="error hidden" data-i18n="wizard.step_2.errors.client_address">Please enter a client address.</p>
            </div>
            <div class="form-group">
                <label for="client-contact-person" data-i18n="wizard.step_2.client_contact_person">Client Contact Person:</label>
                <input type="text" id="client-contact-person" name="clientContactPerson" value="${formData.client.clientContactPerson || ''}" required aria-label="Client Contact Person" aria-describedby="client-contact-person-error">
                <p id="client-contact-person-error" class="error hidden" data-i18n="wizard.step_2.errors.client_contact_person">Please enter a client contact person.</p>
            </div>
            <div class="form-group">
                <label for="client-contact-role" data-i18n="wizard.step_2.client_contact_role">Client Contact Role:</label>
                <input type="text" id="client-contact-role" name="clientContactRole" value="${formData.client.clientContactRole || ''}" required aria-label="Client Contact Role" aria-describedby="client-contact-role-error">
                <p id="client-contact-role-error" class="error hidden" data-i18n="wizard.step_2.errors.client_contact_role">Please enter a client contact role.</p>
            </div>
            <div class="form-group">
                <label for="client-contact-number" data-i18n="wizard.step_2.client_contact_number">Client Contact Number:</label>
                <input type="tel" id="client-contact-number" name="clientContactNumber" value="${formData.client.clientContactNumber || ''}" required pattern="\\+?[0-9\\s\\-()]{10,}" aria-label="Client Contact Number" aria-describedby="client-contact-number-error">
                <p id="client-contact-number-error" class="error hidden" data-i18n="wizard.step_2.errors.client_contact_number">Please enter a valid phone number (e.g., +27123456789).</p>
            </div>
            <div class="form-group">
                <label for="client-email" data-i18n="wizard.step_2.client_email">Client Email:</label>
                <input type="email" id="client-email" name="clientEmail" value="${formData.client.clientEmail || ''}" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" aria-label="Client Email" aria-describedby="client-email-error">
                <p id="client-email-error" class="error hidden" data-i18n="wizard.step_2.errors.client_email">Please enter a valid email address.</p>
            </div>
            <div class="form-group">
                <label for="client-coida" data-i18n="wizard.step_2.client_coida">COIDA Registration Number:</label>
                <input type="text" id="client-coida" name="clientCoida" value="${formData.client.clientCoida || ''}" required aria-label="COIDA Registration Number" aria-describedby="client-coida-error">
                <p id="client-coida-error" class="error hidden" data-i18n="wizard.step_2.errors.client_coida">Please enter a COIDA registration number.</p>
            </div>
            <div class="nav-buttons">
                <button id="back-btn" data-i18n="wizard.back">Back</button>
                <button id="next-btn" data-i18n="wizard.next">Next</button>
            </div>
        `,
        () => `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 33%;"></div>
            </div>
            <h3 data-i18n="wizard.step_3.title">Step 3 of 9: Has a Contractor Been Appointed?</h3>
            <div class="form-group">
                <label for="contractor-appointed" data-i18n="wizard.step_3.label">Contractor Appointed:</label>
                <select id="contractor-appointed" name="contractorAppointed" required aria-label="Contractor Appointed" aria-describedby="contractor-appointed-error">
                    <option value="yes" ${formData.contractorAppointed === "yes" ? "selected" : ""} data-i18n="wizard.step_3.options.yes">Yes</option>
                    <option value="no" ${formData.contractorAppointed === "no" ? "selected" : ""} data-i18n="wizard.step_3.options.no">No</option>
                    <option value="not-applicable" ${formData.contractorAppointed === "not-applicable" ? "selected" : ""} data-i18n="wizard.step_3.options.not_applicable">Not Applicable</option>
                </select>
                <p id="contractor-appointed-error" class="error hidden" data-i18n="wizard.step_3.error">Please select an option.</p>
            </div>
            <div class="nav-buttons">
                <button id="back-btn" data-i18n="wizard.back">Back</button>
                <button id="next-btn" data-i18n="wizard.next">Next</button>
            </div>
        `,
        () => `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 44%;"></div>
            </div>
            <h3 data-i18n="wizard.step_4.title">Step 4 of 9: Contractor Details</h3>
            <div class="form-group">
                <label for="contractor-name" data-i18n="wizard.step_4.contractor_name">Contractor Company Name:</label>
                <input type="text" id="contractor-name" name="contractorName" value="${formData.contractor.contractorName || ''}" required aria-label="Contractor Company Name" aria-describedby="contractor-name-error">
                <p id="contractor-name-error" class="error hidden" data-i18n="wizard.step_4.errors.contractor_name">Please enter a contractor company name.</p>
            </div>
            <div class="form-group">
                <label for="contractor-address" data-i18n="wizard.step_4.contractor_address">Contractor Address:</label>
                <input type="text" id="contractor-address" name="contractorAddress" value="${formData.contractor.contractorAddress || ''}" required aria-label="Contractor Address" aria-describedby="contractor-address-error">
                <p id="contractor-address-error" class="error hidden" data-i18n="wizard.step_4.errors.contractor_address">Please enter a contractor address.</p>
            </div>
            <div class="form-group">
                <label for="contractor-contact-person" data-i18n="wizard.step_4.contractor_contact_person">Contractor Contact Person:</label>
                <input type="text" id="contractor-contact-person" name="contractorContactPerson" value="${formData.contractor.contractorContactPerson || ''}" required aria-label="Contractor Contact Person" aria-describedby="contractor-contact-person-error">
                <p id="contractor-contact-person-error" class="error hidden" data-i18n="wizard.step_4.errors.contractor_contact_person">Please enter a contractor contact person.</p>
            </div>
            <div class="form-group">
                <label for="contractor-contact-role" data-i18n="wizard.step_4.contractor_contact_role">Contractor Contact Role:</label>
                <input type="text" id="contractor-contact-role" name="contractorContactRole" value="${formData.contractor.contractorContactRole || ''}" required aria-label="Contractor Contact Role" aria-describedby="contractor-contact-role-error">
                <p id="contractor-contact-role-error" class="error hidden" data-i18n="wizard.step_4.errors.contractor_contact_role">Please enter a contractor contact role.</p>
            </div>
            <div class="form-group">
                <label for="contractor-contact-number" data-i18n="wizard.step_4.contractor_contact_number">Contractor Contact Number:</label>
                <input type="tel" id="contractor-contact-number" name="contractorContactNumber" value="${formData.contractor.contractorContactNumber || ''}" required pattern="\\+?[0-9\\s\\-()]{10,}" aria-label="Contractor Contact Number" aria-describedby="contractor-contact-number-error">
                <p id="contractor-contact-number-error" class="error hidden" data-i18n="wizard.step_4.errors.contractor_contact_number">Please enter a valid phone number (e.g., +27123456789).</p>
            </div>
            <div class="form-group">
                <label for="contractor-email" data-i18n="wizard.step_4.contractor_email">Contractor Email:</label>
                <input type="email" id="contractor-email" name="contractorEmail" value="${formData.contractor.contractorEmail || ''}" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" aria-label="Contractor Email" aria-describedby="contractor-email-error">
                <p id="contractor-email-error" class="error hidden" data-i18n="wizard.step_4.errors.contractor_email">Please enter a valid email address.</p>
            </div>
            <div class="form-group">
                <label for="contractor-coida" data-i18n="wizard.step_4.contractor_coida">COIDA Registration Number:</label>
                <input type="text" id="contractor-coida" name="contractorCoida" value="${formData.contractor.contractorCoida || ''}" required aria-label="COIDA Registration Number" aria-describedby="contractor-coida-error">
                <p id="contractor-coida-error" class="error hidden" data-i18n="wizard.step_4.errors.contractor_coida">Please enter a COIDA registration number.</p>
            </div>
            <div class="nav-buttons">
                <button id="back-btn" data-i18n="wizard.back">Back</button>
                <button id="next-btn" data-i18n="wizard.next">Next</button>
            </div>
        `,
        () => {
            const now = new Date();
            const date = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = String(now.getFullYear()).slice(-2);
            const clientName = (formData.client.clientName || '').replace(/[^a-zA-Z0-9]/g, '');
            const projectName = (formData.project.projectName || '').replace(/[^a-zA-Z0-9]/g, '');
            formData.project.referenceNumber = `${clientName}/${projectName}/${date}date/${month}month/${year}year/`;

            return `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 55%;"></div>
                </div>
                <h3 data-i18n="wizard.step_5.title">Step 5 of 9: Project Details</h3>
                <div class="form-group">
                    <label for="project-reference" data-i18n="wizard.step_5.project_reference">Project Reference Number:</label>
                    <input type="text" id="project-reference" name="projectReference" value="${formData.project.referenceNumber}" readonly aria-label="Project Reference Number">
                </div>
                <div class="form-group">
                    <label for="project-name" data-i18n="wizard.step_5.project_name">Project Name:</label>
                    <input type="text" id="project-name" name="projectName" value="${formData.project.projectName || ''}" required aria-label="Project Name" aria-describedby="project-name-error">
                    <p id="project-name-error" class="error hidden" data-i18n="wizard.step_5.errors.project_name">Please enter a project name.</p>
                </div>
                <div class="form-group">
                    <label for="site-address" data-i18n="wizard.step_5.site_address">Site Address:</label>
                    <input type="text" id="site-address" name="siteAddress" value="${formData.project.siteAddress || ''}" required aria-label="Site Address" aria-describedby="site-address-error">
                    <p id="site-address-error" class="error hidden" data-i18n="wizard.step_5.errors.site_address">Please enter a site address.</p>
                </div>
                <div class="form-group">
                    <label for="site-supervisor-name" data-i18n="wizard.step_5.site_supervisor_name">Site Supervisor Name:</label>
                    <input type="text" id="site-supervisor-name" name="siteSupervisorName" value="${formData.project.siteSupervisorName || ''}" required aria-label="Site Supervisor Name" aria-describedby="site-supervisor-name-error">
                    <p id="site-supervisor-name-error" class="error hidden" data-i18n="wizard.step_5.errors.site_supervisor_name">Please enter a site supervisor name.</p>
                </div>
                <div class="form-group">
                    <label for="site-supervisor-number" data-i18n="wizard.step_5.site_supervisor_number">Site Supervisor Contact Number:</label>
                    <input type="tel" id="site-supervisor-number" name="siteSupervisorNumber" value="${formData.project.siteSupervisorNumber || ''}" required pattern="\\+?[0-9\\s\\-()]{10,}" aria-label="Site Supervisor Contact Number" aria-describedby="site-supervisor-number-error">
                    <p id="site-supervisor-number-error" class="error hidden" data-i18n="wizard.step_5.errors.site_supervisor_number">Please enter a valid phone number (e.g., +27123456789).</p>
                </div>
                <div class="form-group">
                    <label for="site-supervisor-email" data-i18n="wizard.step_5.site_supervisor_email">Site Supervisor Email:</label>
                    <input type="email" id="site-supervisor-email" name="siteSupervisorEmail" value="${formData.project.siteSupervisorEmail || ''}" required Corrrection: The provided code appears to be incomplete, as it ends abruptly in the middle of defining the HTML for Step 5 of the wizard. The code should continue to define the remaining wizard steps (6 through 9), the navigation and validation logic, and the chatbot UI logic. Below, I'll complete the code starting from where it left off, ensuring all wizard steps are included, along with the remaining functionality, while maintaining consistency with the existing structure and style.

### Continuation of `construction-compliance.js`

```javascript
                <input type="email" id="site-supervisor-email" name="siteSupervisorEmail" value="${formData.project.siteSupervisorEmail || ''}" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" aria-label="Site Supervisor Email" aria-describedby="site-supervisor-email-error">
                <p id="site-supervisor-email-error" class="error hidden" data-i18n="wizard.step_5.errors.site_supervisor_email">Please enter a valid email address.</p>
            </div>
            <div class="nav-buttons">
                <button id="back-btn" data-i18n="wizard.back">Back</button>
                <button id="next-btn" data-i18n="wizard.next">Next</button>
            </div>
        `,
        () => `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 66%;"></div>
            </div>
            <h3 data-i18n="wizard.step_6.title">Step 6 of 9: Scope of the Project</h3>
            <div class="form-group">
                <label for="type-of-work" data-i18n="wizard.step_6.type_of_work">Type of Work to be Done:</label>
                <input type="text" id="type-of-work" name="typeOfWork" value="${formData.scope.typeOfWork || ''}" required aria-label="Type of Work" aria-describedby="type-of-work-error">
                <p id="type-of-work-error" class="error hidden" data-i18n="wizard.step_6.errors.type_of_work">Please enter the type of work.</p>
            </div>
            <div class="form-group">
                <label for="cidb-grade" data-i18n="wizard.step_6.cidb_grade">CIDB Grading:</label>
                <select id="cidb-grade" name="cidbGrade" required aria-label="CIDB Grading" aria-describedby="cidb-grade-error">
                    <option value="Not Applicable" ${formData.scope.cidbGrade === "Not Applicable" ? "selected" : ""} data-i18n="wizard.step_6.options.not_applicable">Not Applicable</option>
                    <option value="1" ${formData.scope.cidbGrade === "1" ? "selected" : ""} data-i18n="wizard.step_6.options.grade_1">Grade 1</option>
                    <option value="2" ${formData.scope.cidbGrade === "2" ? "selected" : ""} data-i18n="wizard.step_6.options.grade_2">Grade 2</option>
                    <option value="3" ${formData.scope.cidbGrade === "3" ? "selected" : ""} data-i18n="wizard.step_6.options.grade_3">Grade 3</option>
                    <option value="4" ${formData.scope.cidbGrade === "4" ? "selected" : ""} data-i18n="wizard.step_6.options.grade_4">Grade 4</option>
                    <option value="5" ${formData.scope.cidbGrade === "5" ? "selected" : ""} data-i18n="wizard.step_6.options.grade_5">Grade 5</option>
                    <option value="6" ${formData.scope.cidbGrade === "6" ? "selected" : ""} data-i18n="wizard.step_6.options.grade_6">Grade 6</option>
                    <option value="7" ${formData.scope.cidbGrade === "7" ? "selected" : ""} data-i18n="wizard.step_6.options.grade_7">Grade 7</option>
                    <option value="8" ${formData.scope.cidbGrade === "8" ? "selected" : ""} data-i18n="wizard.step_6.options.grade_8">Grade 8</option>
                    <option value="9" ${formData.scope.cidbGrade === "9" ? "selected" : ""} data-i18n="wizard.step_6.options.grade_9">Grade 9</option>
                </select>
                <p id="cidb-grade-error" class="error hidden" data-i18n="wizard.step_6.errors.cidb_grade">Please select a CIDB grading.</p>
            </div>
            <div class="form-group">
                <label for="cost" data-i18n="wizard.step_6.cost">Cost (R):</label>
                <input type="number" id="cost" name="cost" value="${formData.scope.cost || ''}" min="0" step="1" required aria-label="Project Cost" aria-describedby="cost-error">
                <p id="cost-error" class="error hidden" data-i18n="wizard.step_6.errors.cost">Please enter a valid project cost (R).</p>
            </div>
            <div class="form-group">
                <label for="duration" data-i18n="wizard.step_6.duration">Duration (Days):</label>
                <input type="number" id="duration" name="duration" value="${formData.scope.duration || ''}" min="1" step="1" required aria-label="Project Duration" aria-describedby="duration-error">
                <p id="duration-error" class="error hidden" data-i18n="wizard.step_6.errors.duration">Please enter a valid duration (days).</p>
            </div>
            <div class="form-group">
                <label data-i18n="wizard.step_6.activities">Activities Involved (Select all that apply):</label>
                <div class="activities-categories">
                    <details>
                        <summary data-i18n="wizard.step_6.categories.security_guards">Security Guards</summary>
                        <div class="category-content">
                            <div class="checkbox-item">
                                <input type="checkbox" id="night-work" name="activities" value="Night Work" ${formData.scope.activities && formData.scope.activities.includes('Night Work') ? 'checked' : ''}>
                                <label for="night-work" data-i18n="wizard.step_6.activities.night_work">Night Work</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="moving-traffic" name="activities" value="Working in Moving Traffic" ${formData.scope.activities && formData.scope.activities.includes('Working in Moving Traffic') ? 'checked' : ''}>
                                <label for="moving-traffic" data-i18n="wizard.step_6.activities.moving_traffic">Working in Moving Traffic</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="vibration-exposure" name="activities" value="Vibration Exposure" ${formData.scope.activities && formData.scope.activities.includes('Vibration Exposure') ? 'checked' : ''}>
                                <label for="vibration-exposure" data-i18n="wizard.step_6.activities.vibration_exposure">Vibration Exposure</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="noise-exposure" name="activities" value="Noise Exposure" ${formData.scope.activities && formData.scope.activities.includes('Noise Exposure') ? 'checked' : ''}>
                                <label for="noise-exposure" data-i18n="wizard.step_6.activities.noise_exposure">Noise Exposure</label>
                            </div>
                        </div>
                    </details>
                    <details>
                        <summary data-i18n="wizard.step_6.categories.welders">Welders</summary>
                        <div class="category-content">
                            <div class="checkbox-item">
                                <input type="checkbox" id="welding" name="activities" value="Welding" ${formData.scope.activities && formData.scope.activities.includes('Welding') ? 'checked' : ''}>
                                <label for="welding" data-i18n="wizard.step_6.activities.welding">Welding</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="hot-work" name="activities" value="Hot Work (e.g., Cutting, Grinding)" ${formData.scope.activities && formData.scope.activities.includes('Hot Work (e.g., Cutting, Grinding)') ? 'checked' : ''}>
                                <label for="hot-work" data-i18n="wizard.step_6.activities.hot_work">Hot Work (e.g., Cutting, Grinding)</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="combustible-materials" name="activities" value="Combustible Materials" ${formData.scope.activities && formData.scope.activities.includes('Combustible Materials') ? 'checked' : ''}>
                                <label for="combustible-materials" data-i18n="wizard.step_6.activities.combustible_materials">Combustible Materials</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="hazardous-substances" name="activities" value="Handling Hazardous Substances" ${formData.scope.activities && formData.scope.activities.includes('Handling Hazardous Substances') ? 'checked' : ''}>
                                <label for="hazardous-substances" data-i18n="wizard.step_6.activities.hazardous_substances">Handling Hazardous Substances</label>
                            </div>
                        </div>
                    </details>
                    <details>
                        <summary data-i18n="wizard.step_6.categories.office_fit_out">Office Fit-Out</summary>
                        <div class="category-content">
                            <div class="checkbox-item">
                                <input type="checkbox" id="sensitive-it-equipment" name="activities" value="Sensitive IT Equipment" ${formData.scope.activities && formData.scope.activities.includes('Sensitive IT Equipment') ? 'checked' : ''}>
                                <label for="sensitive-it-equipment" data-i18n="wizard.step_6.activities.sensitive_it_equipment">Sensitive IT Equipment</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="manual-handling" name="activities" value="Manual Handling" ${formData.scope.activities && formData.scope.activities.includes('Manual Handling') ? 'checked' : ''}>
                                <label for="manual-handling" data-i18n="wizard.step_6.activities.manual_handling">Manual Handling</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="working-electricity" name="activities" value="Working with Electricity" ${formData.scope.activities && formData.scope.activities.includes('Working with Electricity') ? 'checked' : ''}>
                                <label for="working-electricity" data-i18n="wizard.step_6.activities.working_electricity">Working with Electricity</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="dust-exposure" name="activities" value="Dust Exposure" ${formData.scope.activities && formData.scope.activities.includes('Dust Exposure') ? 'checked' : ''}>
                                <label for="dust-exposure" data-i18n="wizard.step_6.activities.dust_exposure">Dust Exposure</label>
                            </div>
                        </div>
                    </details>
                    <details>
                        <summary data-i18n="wizard.step_6.categories.civil_contractors">Civil Contractors</summary>
                        <div class="category-content">
                            <div class="checkbox-item">
                                <input type="checkbox" id="excavation" name="activities" value="Excavation" ${formData.scope.activities && formData.scope.activities.includes('Excavation') ? 'checked' : ''}>
                                <label for="excavation" data-i18n="wizard.step_6.activities.excavation">Excavation</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="crane-operations" name="activities" value="Crane Operations" ${formData.scope.activities && formData.scope.activities.includes('Crane Operations') ? 'checked' : ''}>
                                <label for="crane-operations" data-i18n="wizard.step_6.activities.crane_operations">Crane Operations</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="working-near-water" name="activities" value="Working Near Water" ${formData.scope.activities && formData.scope.activities.includes('Working Near Water') ? 'checked' : ''}>
                                <label for="working-near-water" data-i18n="wizard.step_6.activities.working_near_water">Working Near Water</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="pile-driving" name="activities" value="Pile Driving" ${formData.scope.activities && formData.scope.activities.includes('Pile Driving') ? 'checked' : ''}>
                                <label for="pile-driving" data-i18n="wizard.step_6.activities.pile_driving">Pile Driving</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="working-tunnels" name="activities" value="Working in Tunnels" ${formData.scope.activities && formData.scope.activities.includes('Working in Tunnels') ? 'checked' : ''}>
                                <label for="working-tunnels" data-i18n="wizard.step_6.activities.working_tunnels">Working in Tunnels</label>
                            </div>
                        </div>
                    </details>
                    <details>
                        <summary data-i18n="wizard.step_6.categories.general_construction">General Construction</summary>
                        <div class="category-content">
                            <div class="checkbox-item">
                                <input type="checkbox" id="working-from-heights" name="activities" value="Working from Heights" ${formData.scope.activities && formData.scope.activities.includes('Working from Heights') ? 'checked' : ''}>
                                <label for="working-from-heights" data-i18n="wizard.step_6.activities.working_from_heights">Working from Heights</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="scaffolding" name="activities" value="Scaffolding" ${formData.scope.activities && formData.scope.activities.includes('Scaffolding') ? 'checked' : ''}>
                                <label for="scaffolding" data-i18n="wizard.step_6.activities.scaffolding">Scaffolding</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="multi-storey" name="activities" value="Multi-Storey Construction" ${formData.scope.activities && formData.scope.activities.includes('Multi-Storey Construction') ? 'checked' : ''}>
                                <label for="multi-storey" data-i18n="wizard.step_6.activities.multi_storey">Multi-Storey Construction</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="asbestos" name="activities" value="Asbestos Removal" ${formData.scope.activities && formData.scope.activities.includes('Asbestos Removal') ? 'checked' : ''}>
                                <label for="asbestos" data-i18n="wizard.step_6.activities.asbestos">Asbestos Removal</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="confined-space" name="activities" value="Confined Space Entry" ${formData.scope.activities && formData.scope.activities.includes('Confined Space Entry') ? 'checked' : ''}>
                                <label for="confined-space" data-i18n="wizard.step_6.activities.confined_space">Confined Space Entry</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="demolition" name="activities" value="Demolition" ${formData.scope.activities && formData.scope.activities.includes('Demolition') ? 'checked' : ''}>
                                <label for="demolition" data-i18n="wizard.step_6.activities.demolition">Demolition</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="roof-work" name="activities" value="Roof Work" ${formData.scope.activities && formData.scope.activities.includes('Roof Work') ? 'checked' : ''}>
                                <label for="roof-work" data-i18n="wizard.step_6.activities.roof_work">Roof Work</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="temporary-works" name="activities" value="Temporary Works" ${formData.scope.activities && formData.scope.activities.includes('Temporary Works') ? 'checked' : ''}>
                                <label for="temporary-works" data-i18n="wizard.step_6.activities.temporary_works">Temporary Works</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="live-voltage" name="activities" value="Working with Live Voltage" ${formData.scope.activities && formData.scope.activities.includes('Working with Live Voltage') ? 'checked' : ''}>
                                <label for="live-voltage" data-i18n="wizard.step_6.activities.live_voltage">Working with Live Voltage</label>
                            </div>
                        </div>
                    </details>
                </div>
            </div>
            <div class="form-group">
                <label for="scope-details" data-i18n="wizard.step_6.scope_details">Scope Details:</label>
                <textarea id="scope-details" name="scopeDetails" rows="4" required aria-label="Scope Details" aria-describedby="scope-details-error">${formData.scope.scopeDetails || ''}</textarea>
                <p id="scope-details-error" class="error hidden" data-i18n="wizard.step_6.errors.scope_details">Please enter scope details.</p>
            </div>
            <div class="nav-buttons">
                <button id="back-btn" data-i18n="wizard.back">Back</button>
                <button id="next-btn" data-i18n="wizard.next">Next</button>
            </div>
        `,
        () => `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 77%;"></div>
            </div>
            <h3 data-i18n="wizard.step_7.title">Step 7 of 9: Compiled By</h3>
            <div class="form-group">
                <label for="compiled-by-name" data-i18n="wizard.step_7.compiled_by_name">Name:</label>
                <input type="text" id="compiled-by-name" name="compiledByName" value="${formData.compiledBy.name || ''}" required aria-label="Compiled By Name" aria-describedby="compiled-by-name-error">
                <p id="compiled-by-name-error" class="error hidden" data-i18n="wizard.step_7.errors.compiled_by_name">Please enter your name.</p>
            </div>
            <div class="form-group">
                <label for="compiled-by-number" data-i18n="wizard.step_7.compiled_by_number">Contact Number:</label>
                <input type="tel" id="compiled-by-number" name="compiledByNumber" value="${formData.compiledBy.number || ''}" required pattern="\\+?[0-9\\s\\-()]{10,}" aria-label="Compiled By Contact Number" aria-describedby="compiled-by-number-error">
                <p id="compiled-by-number-error" class="error hidden" data-i18n="wizard.step_7.errors.compiled_by_number">Please enter a valid phone number (e.g., +27123456789).</p>
            </div>
            <div class="form-group">
                <label for="compiled-by-email" data-i18n="wizard.step_7.compiled_by_email">Email:</label>
                <input type="email" id="compiled-by-email" name="compiledByEmail" value="${formData.compiledBy.email || ''}" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" aria-label="Compiled By Email" aria-describedby="compiled-by-email-error">
                <p id="compiled-by-email-error" class="error hidden" data-i18n="wizard.step_7.errors.compiled_by_email">Please enter a valid email address.</p>
            </div>
            <div class="form-group">
                <label for="compiled-by-role" data-i18n="wizard.step_7.compiled_by_role">Role:</label>
                <select id="compiled-by-role" name="compiledByRole" required aria-label="Compiled By Role" aria-describedby="compiled-by-role-error">
                    <option value="trainee" ${formData.compiledBy.role === "trainee" ? "selected" : ""} data-i18n="wizard.step_7.options.trainee">OHS Trainee</option>
                    <option value="ohs-rep" ${formData.compiledBy.role === "ohs-rep" ? "selected" : ""} data-i18n="wizard.step_7.options.ohs_rep">OHS Representative</option>
                    <option value="sacpcmp-officer" ${formData.compiledBy.role === "sacpcmp-officer" ? "selected" : ""} data-i18n="wizard.step_7.options.sacpcmp_officer">SACPCMP Officer (CHSO)</option>
                    <option value="sacpcmp-agent" ${formData.compiledBy.role === "sacpcmp-agent" ? "selected" : ""} data-i18n="wizard.step_7.options.sacpcmp_agent">SACPCMP Agent (PrCHSA)</option>
                    <option value="other" ${formData.compiledBy.role && !["trainee", "ohs-rep", "sacpcmp-officer", "sacpcmp-agent"].includes(formData.compiledBy.role) ? "selected" : ""} data-i18n="wizard.step_7.options.other">Other</option>
                </select>
                <p id="compiled-by-role-error" class="error hidden" data-i18n="wizard.step_7.errors.compiled_by_role">Please select a role.</p>
            </div>
            <div class="form-group" id="sacpcmp-reg-container">
                <label for="sacpcmp-reg" data-i18n="wizard.step_7.sacpcmp_reg">SACPCMP Registration Number:</label>
                <input type="text" id="sacpcmp-reg" name="sacpcmpReg" value="${formData.compiledBy.sacpcmpReg || 'N/A'}" aria-label="SACPCMP Registration Number" aria-describedby="sacpcmp-reg-error">
                <p id="sacpcmp-reg-error" class="error hidden" data-i18n="wizard.step_7.errors.sacpcmp_reg">Please enter a SACPCMP registration number.</p>
            </div>
            <div class="form-group" id="compiled-by-role-other-container">
                <label for="compiled-by-role-other" data-i18n="wizard.step_7.compiled_by_role_other">Specify Role:</label>
                <input type="text" id="compiled-by-role-other" name="compiledByRoleOther" value="${formData.compiledBy.specifiedRole || 'N/A'}" aria-label="Specify Role" aria-describedby="compiled-by-role-other-error">
                <p id="compiled-by-role-other-error" class="error hidden" data-i18n="wizard.step_7.errors.compiled_by_role_other">Please specify your role.</p>
            </div>
            <div class="nav-buttons">
                <button id="back-btn" data-i18n="wizard.back">Back</button>
                <button id="next-btn" data-i18n="wizard.next">Next</button>
            </div>
        `,
        () => `
            <div class="progress-bar">
            <div class="progress-fill" style="width: 88%;"></div>
        </div>
        <h3 data-i18n="wizard.step_8.title">Step 8 of 9: Compiled For</h3>
        <div class="form-group">
            <label for="compiled-for" data-i18n="wizard.step_8.compiled_for">Compiled For:</label>
            <select id="compiled-for" name="compiledFor" required aria-label="Compiled For" aria-describedby="compiled-for-error">
                <option value="client" ${formData.compiledFor.role === "client" ? "selected" : ""} data-i18n="wizard.step_8.options.client">Client</option>
                <option value="contractor" ${formData.compiledFor.role === "contractor" ? "selected" : ""} data-i18n="wizard.step_8.options.contractor">Contractor</option>
                <option value="other" ${formData.compiledFor.role && !["client", "contractor"].includes(formData.compiledFor.role) ? "selected" : ""} data-i18n="wizard.step_8.options.other">Other</option>
            </select>
            <p id="compiled-for-error" class="error hidden" data-i18n="wizard.step_8.errors.compiled_for">Please select an option.</p>
        </div>
        <div class="form-group">
            <label for="compiled-for-name" data-i18n="wizard.step_8.compiled_for_name">Name:</label>
            <input type="text" id="compiled-for-name" name="compiledForName" value="${formData.compiledFor.name || ''}" required aria-label="Compiled For Name" aria-describedby="compiled-for-name-error">
            <p id="compiled-for-name-error" class="error hidden" data-i18n="wizard.step_8.errors.compiled_for_name">Please enter a name.</p>
        </div>
        <div class="form-group">
            <label for="compiled-for-number" data-i18n="wizard.step_8.compiled_for_number">Contact Number:</label>
            <input type="tel" id="compiled-for-number" name="compiledForNumber" value="${formData.compiledFor.number || ''}" required pattern="\\+?[0-9\\s\\-()]{10,}" aria-label="Compiled For Contact Number" aria-describedby="compiled-for-number-error">
            <p id="compiled-for-number-error" class="error hidden" data-i18n="wizard.step_8.errors.compiled_for_number">Please enter a valid phone number (e.g., +27123456789).</p>
        </div>
        <div class="form-group">
            <label for="compiled-for-email" data-i18n="wizard.step_8.compiled_for_email">Email:</label>
            <input type="email" id="compiled-for-email" name="compiledForEmail" value="${formData.compiledFor.email || ''}" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" aria-label="Compiled For Email" aria-describedby="compiled-for-email-error">
            <p id="compiled-for-email-error" class="error hidden" data-i18n="wizard.step_8.errors.compiled_for_email">Please enter a valid email address.</p>
        </div>
        <div class="form-group" id="compiled-for-other-container">
            <label for="compiled-for-other" data-i18n="wizard.step_8.compiled_for_other">Specify Role:</label>
            <input type="text" id="compiled-for-other" name="compiledForOther" value="${formData.compiledFor.specify || ''}" aria-label="Specify Role" aria-describedby="compiled-for-other-error">
            <p id="compiled-for-other-error" class="error hidden" data-i18n="wizard.step_8.errors.compiled_for_other">Please specify the role.</p>
        </div>
        <div class="form-group">
            <label for="additional-signatories" data-i18n="wizard.step_8.additional_signatories">Additional Signatories (Optional):</label>
            <textarea id="additional-signatories" name="additionalSignatories" rows="4" aria-label="Additional Signatories">${formData.additionalSignatories.map(sig => sig.name).join('\n') || ''}</textarea>
            <p class="hint" data-i18n="wizard.step_8.hint">Enter one name per line.</p>
        </div>
        <div class="nav-buttons">
            <button id="back-btn" data-i18n="wizard.back">Back</button>
            <button id="next-btn" data-i18n="wizard.next">Next</button>
        </div>
    `,
    () => `
        <div class="progress-bar">
            <div class="progress-fill" style="width: 100%;"></div>
        </div>
        <h3 data-i18n="wizard.step_9.title">Step 9 of 9: Review and Checkout</h3>
        <div class="form-group">
            <label data-i18n="wizard.step_9.cart">Your Cart:</label>
            <table class="cart-table">
                <thead>
                    <tr>
                        <th data-i18n="wizard.step_9.table.document">Document</th>
                        <th data-i18n="wizard.step_9.table.price">Price</th>
                    </tr>
                </thead>
                <tbody id="cart-items">
                    ${cart.length === 0 ? '<tr><td colspan="2" data-i18n="wizard.step_9.empty_cart">Your cart is empty.</td></tr>' : cart.map(item => `
                        <tr>
                            <td>${item.documentName}</td>
                            <td>R ${item.price.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <p id="cart-error" class="error hidden" data-i18n="wizard.step_9.errors.cart_empty">Please add at least one document to the cart.</p>
        </div>
        <div class="form-group">
            <label for="promo-code" data-i18n="wizard.step_9.promo_code">Promo Code (Optional):</label>
            <input type="text" id="promo-code" name="promoCode" aria-label="Promo Code">
            <button id="apply-promo" data-i18n="wizard.step_9.apply_promo">Apply</button>
            <p id="promo-code-error" class="error hidden" data-i18n="wizard.step_9.errors.promo_code">Invalid promo code.</p>
            <p id="promo-code-success" class="success hidden" data-i18n="wizard.step_9.promo_success">Promo code applied! 25% discount.</p>
        </div>
        <div class="form-group">
            <label data-i18n="wizard.step_9.total">Total Price:</label>
            <p id="total-price">R ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</p>
        </div>
        <div class="form-group">
            <label for="payment-method" data-i18n="wizard.step_9.payment_method">Payment Method:</label>
            <select id="payment-method" name="paymentMethod" required aria-label="Payment Method" aria-describedby="payment-method-error">
                <option value="credit-card" data-i18n="wizard.step_9.options.credit_card">Credit Card</option>
                <option value="bank-transfer" data-i18n="wizard.step_9.options.bank_transfer">Bank Transfer</option>
                <option value="paypal" data-i18n="wizard.step_9.options.paypal">PayPal</option>
            </select>
            <p id="payment-method-error" class="error hidden" data-i18n="wizard.step_9.errors.payment_method">Please select a payment method.</p>
        </div>
        <div class="nav-buttons">
            <button id="back-btn" data-i18n="wizard.back">Back</button>
            <button id="checkout-btn" data-i18n="wizard.checkout">Checkout</button>
        </div>
    `
];

// Wizard Navigation and Validation
function renderStep(step) {
    const wizardContainer = document.getElementById('wizard-content');
    const wizardSidebar = document.getElementById('wizard-sidebar');
    if (!wizardContainer || !wizardSidebar) {
        console.error("Wizard elements not found.");
        return;
    }
    wizardContainer.innerHTML = steps[step]();
    wizardSidebar.innerHTML = sidebarContent[step];
    i18next.changeLanguage(navigator.language.split('-')[0], () => {
        document.querySelectorAll('[data-i18n]').forEach(elem => {
            const key = elem.getAttribute('data-i18n');
            elem.textContent = i18next.t(key);
        });
    });

    // Dynamic field visibility
    if (step === 7) {
        const roleSelect = document.getElementById('compiled-by-role');
        const sacpcmpContainer = document.getElementById('sacpcmp-reg-container');
        const otherContainer = document.getElementById('compiled-by-role-other-container');
        if (roleSelect && sacpcmpContainer && otherContainer) {
            const updateVisibility = () => {
                const role = roleSelect.value;
                sacpcmpContainer.classList.toggle('hidden', !['sacpcmp-officer', 'sacpcmp-agent'].includes(role));
                otherContainer.classList.toggle('hidden', role !== 'other');
            };
            roleSelect.addEventListener('change', updateVisibility);
            updateVisibility();
        }
    } else if (step === 8) {
        const compiledForSelect = document.getElementById('compiled-for');
        const otherContainer = document.getElementById('compiled-for-other-container');
        if (compiledForSelect && otherContainer) {
            const updateVisibility = () => {
                otherContainer.classList.toggle('hidden', compiledForSelect.value !== 'other');
            };
            compiledForSelect.addEventListener('change', updateVisibility);
            updateVisibility();
        }
    } else if (step === 9) {
        const applyPromoBtn = document.getElementById('apply-promo');
        if (applyPromoBtn) {
            applyPromoBtn.addEventListener('click', () => {
                const promoCode = document.getElementById('promo-code').value;
                const error = document.getElementById('promo-code-error');
                const success = document.getElementById('promo-code-success');
                const totalPrice = document.getElementById('total-price');
                if (promoCode === 'SAFETYFIRST25') {
                    error.classList.add('hidden');
                    success.classList.remove('hidden');
                    const originalPrice = cart.reduce((sum, item) => sum + item.price, 0);
                    totalPrice.textContent = `R ${(originalPrice * 0.75).toFixed(2)}`;
                } else {
                    error.classList.remove('hidden');
                    success.classList.add('hidden');
                    totalPrice.textContent = `R ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}`;
                }
            });
        }
    }

    // Navigation buttons
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn') || document.getElementById('checkout-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => handleBack());
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => step === steps.length - 1 ? handleCheckout() : handleNext());
    }
}

function validateStep(step) {
    let isValid = true;
    const showError = (id, show) => {
        const error = document.getElementById(id);
        if (error) error.classList.toggle('hidden', !show);
        if (show) isValid = false;
    };

    if (step === 1) {
        const checkboxes = document.querySelectorAll('input[name="documentTypes"]:checked');
        formData.documentTypes = Array.from(checkboxes).map(cb => cb.value);
        showError('document-types-error', checkboxes.length === 0);
    } else if (step === 2) {
        const fields = [
            { id: 'client-name', key: 'clientName', error: 'client-name-error', check: v => v.trim() },
            { id: 'client-address', key: 'clientAddress', error: 'client-address-error', check: v => v.trim() },
            { id: 'client-contact-person', key: 'clientContactPerson', error: 'client-contact-person-error', check: v => v.trim() },
            { id: 'client-contact-role', key: 'clientContactRole', error: 'client-contact-role-error', check: v => v.trim() },
            { id: 'client-contact-number', key: 'clientContactNumber', error: 'client-contact-number-error', check: v => /^\+?[0-9\s\-()]{10,}$/.test(v) },
            { id: 'client-email', key: 'clientEmail', error: 'client-email-error', check: v => /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(v) },
            { id: 'client-coida', key: 'clientCoida', error: 'client-coida-error', check: v => v.trim() }
        ];
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                const value = input.value;
                formData.client[field.key] = value;
                showError(field.error, !field.check(value));
            }
        });
    } else if (step === 3) {
        const select = document.getElementById('contractor-appointed');
        if (select) {
            formData.contractorAppointed = select.value;
            showError('contractor-appointed-error', !select.value);
        }
    } else if (step === 4 && formData.contractorAppointed === 'yes') {
        const fields = [
            { id: 'contractor-name', key: 'contractorName', error: 'contractor-name-error', check: v => v.trim() },
            { id: 'contractor-address', key: 'contractorAddress', error: 'contractor-address-error', check: v => v.trim() },
            { id: 'contractor-contact-person', key: 'contractorContactPerson', error: 'contractor-contact-person-error', check: v => v.trim() },
            { id: 'contractor-contact-role', key: 'contractorContactRole', error: 'contractor-contact-role-error', check: v => v.trim() },
            { id: 'contractor-contact-number', key: 'contractorContactNumber', error: 'contractor-contact-number-error', check: v => /^\+?[0-9\s\-()]{10,}$/.test(v) },
            { id: 'contractor-email', key: 'contractorEmail', error: 'contractor-email-error', check: v => /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(v) },
            { id: 'contractor-coida', key: 'contractorCoida', error: 'contractor-coida-error', check: v => v.trim() }
        ];
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                const value = input.value;
                formData.contractor[field.key] = value;
                showError(field.error, !field.check(value));
            }
        });
    } else if (step === 5) {
        const fields = [
            { id: 'project-name', key: 'projectName', error: 'project-name-error', check: v => v.trim() },
            { id: 'site-address', key: 'siteAddress', error: 'site-address-error', check: v => v.trim() },
            { id: 'site-supervisor-name', key: 'siteSupervisorName', error: 'site-supervisor-name-error', check: v => v.trim() },
            { id: 'site-supervisor-number', key: 'siteSupervisorNumber', error: 'site-supervisor-number-error', check: v => /^\+?[0-9\s\-()]{10,}$/.test(v) },
            { id: 'site-supervisor-email', key: 'siteSupervisorEmail', error: 'site-supervisor-email-error', check: v => /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(v) }
        ];
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                const value = input.value;
                formData.project[field.key] = value;
                showError(field.error, !field.check(value));
            }
        });
    } else if (step === 6) {
        const fields = [
            { id: 'type-of-work', key: 'typeOfWork', error: 'type-of-work-error', check: v => v.trim() },
            { id: 'cidb-grade', key: 'cidbGrade', error: 'cidb-grade-error', check: v => v },
            { id: 'cost', key: 'cost', error: 'cost-error', check: v => parseFloat(v) >= 0 },
            { id: 'duration', key: 'duration', error: 'duration-error', check: v => parseInt(v) >= 1 },
            { id: 'scope-details', key: 'scopeDetails', error: 'scope-details-error', check: v => v.trim() }
        ];
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                const value = input.value;
                formData.scope[field.key] = value;
                showError(field.error, !field.check(value));
            }
        });
        const checkboxes = document.querySelectorAll('input[name="activities"]:checked');
        formData.scope.activities = Array.from(checkboxes).map(cb => cb.value);
    } else if (step === 7) {
        const fields = [
            { id: 'compiled-by-name', key: 'name', error: 'compiled-by-name-error', check: v => v.trim() },
            { id: 'compiled-by-number', key: 'number', error: 'compiled-by-number-error', check: v => /^\+?[0-9\s\-()]{10,}$/.test(v) },
            { id: 'compiled-by-email', key: 'email', error: 'compiled-by-email-error', check: v => /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(v) },
            { id: 'compiled-by-role', key: 'role', error: 'compiled-by-role-error', check: v => v }
        ];
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                const value = input.value;
                formData.compiledBy[field.key] = value;
                showError(field.error, !field.check(value));
            }
        });
        const role = document.getElementById('compiled-by-role')?.value;
        if (['sacpcmp-officer', 'sacpcmp-agent'].includes(role)) {
            const sacpcmpReg = document.getElementById('sacpcmp-reg');
            if (sacpcmpReg) {
                formData.compiledBy.sacpcmpReg = sacpcmpReg.value;
                showError('sacpcmp-reg-error', !sacpcmpReg.value.trim() || sacpcmpReg.value === 'N/A');
            }
        } else {
            formData.compiledBy.sacpcmpReg = 'N/A';
        }
        if (role === 'other') {
            const otherRole = document.getElementById('compiled-by-role-other');
            if (otherRole) {
                formData.compiledBy.specifiedRole = otherRole.value;
                showError('compiled-by-role-other-error', !otherRole.value.trim() || otherRole.value === 'N/A');
            }
        } else {
            formData.compiledBy.specifiedRole = 'N/A';
        }
    } else if (step === 8) {
        const fields = [
            { id: 'compiled-for', key: 'role', error: 'compiled-for-error', check: v => v },
            { id: 'compiled-for-name', key: 'name', error: 'compiled-for-name-error', check: v => v.trim() },
            { id: 'compiled-for-number', key: 'number', error: 'compiled-for-number-error', check: v => /^\+?[0-9\s\-()]{10,}$/.test(v) },
            { id: 'compiled-for-email', key: 'email', error: 'compiled-for-email-error', check: v => /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(v) }
        ];
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (input) {
                const value = input.value;
                formData.compiledFor[field.key] = value;
                showError(field.error, !field.check(value));
            }
        });
        const compiledFor = document.getElementById('compiled-for')?.value;
        if (compiledFor === 'other') {
            const otherRole = document.getElementById('compiled-for-other');
            if (otherRole) {
                formData.compiledFor.specify = otherRole.value;
                showError('compiled-for-other-error', !otherRole.value.trim());
            }
        } else {
            formData.compiledFor.specify = 'N/A';
        }
        const signatories = document.getElementById('additional-signatories')?.value;
        formData.additionalSignatories = signatories ? signatories.split('\n').filter(name => name.trim()).map(name => ({ name })) : [];
    } else if (step === 9) {
        showError('cart-error', cart.length === 0);
        const paymentMethod = document.getElementById('payment-method');
        if (paymentMethod) {
            showError('payment-method-error', !paymentMethod.value);
        }
    }
    return isValid;
}

function handleNext() {
    if (validateStep(currentStep)) {
        if (currentStep === 3 && formData.contractorAppointed !== 'yes') {
            currentStep = 5; // Skip contractor details
        } else {
            currentStep++;
        }
        renderStep(currentStep);
    }
}

function handleBack() {
    if (currentStep === 5 && formData.contractorAppointed !== 'yes') {
        currentStep = 3; // Skip contractor details
    } else {
        currentStep--;
    }
    renderStep(currentStep);
}

function handleCheckout() {
    if (validateStep(currentStep)) {
        const documentPrices = {
            'hs-spec': 500,
            'hs-plan': 600,
            'risk-assessment': 300,
            'training': 400,
            'appointments': 200,
            'inspections': 350,
            'incidents': 250,
            'reports': 300,
            'hs-file': 700
        };
        cart = [];
        formData.documentTypes.forEach(type => {
            const price = documentPrices[type];
            const documentName = i18next.t(`wizard.step_1.documents.${type}`);
            addToCart(documentName, price, type, formData);
            if (type === 'hs-spec') generateOHSSpecPDF(formData);
            if (type === 'hs-plan') generateHSPlanPDF(formData);
            if (type === 'hs-file') generateHSFilePDF(formData);
        });
        generateInvoicePDF();
        const invoiceRef = saveWithExpiry(INVOICE_STORAGE_KEY, cart);
        alert(`Checkout complete! Invoice Reference: ${invoiceRef}`);
        cart = [];
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        updateCartDisplay();
        currentStep = 0;
        renderStep(currentStep);
    }
}

// Chatbot UI Logic
function initializeChatbot() {
    const chatbotWindow = document.querySelector('.chatbot-window');
    const chatCloseBtn = document.querySelector('.chat-close-btn');
    const chatToggleBtn = document.querySelector('.chatbot-toggle');
    let inactivityTimer;

    if (!chatbotWindow || !chatCloseBtn || !chatToggleBtn) {
        console.error("Chatbot elements not found.");
        return;
    }

    const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            chatbotWindow.classList.add('minimized');
        }, 30000);
    };

    chatToggleBtn.addEventListener('click', () => {
        chatbotWindow.classList.toggle('minimized');
        if (!chatbotWindow.classList.contains('minimized')) {
            resetInactivityTimer();
        }
    });

    chatCloseBtn.addEventListener('click', () => {
        chatbotWindow.classList.add('minimized');
        clearTimeout(inactivityTimer);
    });

    chatbotWindow.addEventListener('click', resetInactivityTimer);
    chatbotWindow.addEventListener('keydown', resetInactivityTimer);

    // Initial state
    chatbotWindow.classList.add('minimized');
}

// Initialize Wizard and Chatbot
renderStep(currentStep);
initializeChatbot();
