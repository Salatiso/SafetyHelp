document.addEventListener('DOMContentLoaded', () => {
    // Initialize i18next for translations (assuming it's already set up globally)
    const i18n = window.i18next;

    // Wizard state
    let currentStep = 0;
    let mode = null; // 'automated', 'semi-automated', or 'manual'
    let selectedDocuments = [];
    let cartItems = [];
    let industryData = {};

    // DOM elements
    const wizardContainer = document.getElementById('wizard-container');
    const steps = document.querySelectorAll('.step');
    const progressFill = document.getElementById('progress-fill');
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const cartContainer = document.getElementById('cart-container');
    const cartItemsTable = document.getElementById('cart-items');
    const checkoutBtn = document.getElementById('checkout-btn');
    const sidebarLegislation = document.getElementById('sidebar-legislation');
    const sidebarFunFact = document.getElementById('sidebar-fun-fact');

    // Fetch industry data
    fetch('/safety-plans/assets/templates/ohs-system/industry-data.json')
        .then(response => response.json())
        .then(data => {
            industryData = data;
        })
        .catch(error => console.error('Error loading industry data:', error));

    // Start the wizard
    window.startWizard = (selectedMode) => {
        mode = selectedMode;
        currentStep = 0;
        selectedDocuments = [];
        wizardContainer.classList.remove('hidden');
        cartContainer.classList.add('hidden');
        updateStep();
    };

    // Update the current step
    function updateStep() {
        steps.forEach(step => step.classList.add('hidden'));
        let stepId = `step-${currentStep}-${mode === 'automated' ? 'automated' : mode === 'semi-automated' ? 'semi-automated' : 'manual'}`;
        const currentStepElement = document.getElementById(stepId);
        if (currentStepElement) {
            currentStepElement.classList.remove('hidden');
        }

        // Update progress bar
        const totalSteps = mode === 'automated' ? 5 : 4;
        progressFill.style.width = `${(currentStep / totalSteps) * 100}%`;

        // Update buttons
        backBtn.disabled = currentStep === 0;
        nextBtn.disabled = false;

        // Update sidebar
        updateSidebar();
    }

    // Update the sidebar with legal facts and tips
    function updateSidebar() {
        const facts = {
            '0-automated': 'The OHS Act requires all industries to have a documented safety policy.',
            '1-automated': 'ISO 45001 emphasizes tailoring OHS processes to your industry’s specific risks.',
            '2-automated': 'Section 7 of the OHS Act requires a CEO-signed policy.',
            '3-automated': 'ISO 9000 requires document control, including revision history.',
            '4-automated': 'SACPCMP registration is mandatory for construction OHS professionals.',
            '5-automated': 'Regular audits, as per ISO 45001 Clause 9.2, ensure compliance.',
            '0-semi-automated': 'Start by selecting categories that match your compliance needs.',
            '1-semi-automated': 'Choose documents relevant to your operations for effective OHS management.',
            '2-semi-automated': 'Ensure your company details are accurate for legal compliance.',
            '3-semi-automated': 'Customize procedures to reflect your specific workplace hazards.',
            '0-manual': 'Manually select documents to build a tailored OHS system.',
            '1-manual': 'COIDA Section 24 requires incident reports to be retained for audits.',
            '2-manual': 'Accurate company details ensure your documents are legally compliant.',
            '3-manual': 'Customize content to address your unique safety objectives.'
        };

        const stepKey = `${currentStep}-${mode}`;
        sidebarLegislation.innerHTML = `<p><strong>Legal Reference:</strong> ${facts[stepKey] || 'Ensure all documents comply with local OHS regulations.'}</p>`;
        sidebarFunFact.innerHTML = `<p><strong>Tip:</strong> Regularly review your OHS documents to stay compliant with evolving regulations.</p>`;
    }

    // Validate form inputs
    function validateForm(stepId) {
        let isValid = true;
        const stepElement = document.getElementById(stepId);
        const inputs = stepElement.querySelectorAll('input[required], select[required], textarea[required]');

        inputs.forEach(input => {
            const errorElement = document.getElementById(`${input.id}-error`);
            if (!input.value.trim()) {
                errorElement.classList.remove('hidden');
                isValid = false;
            } else {
                errorElement.classList.add('hidden');
            }

            // Additional validation for specific fields
            if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                errorElement.classList.remove('hidden');
                isValid = false;
            }
            if (input.type === 'tel' && !/^\+[0-9]{10,}$/.test(input.value)) {
                errorElement.classList.remove('hidden');
                isValid = false;
            }
        });

        return isValid;
    }

    // Handle document selection
    function handleDocumentSelection(stepId) {
        const stepElement = document.getElementById(stepId);
        const checkboxes = stepElement.querySelectorAll('input[name="documents"]:checked');
        const errorElement = stepElement.querySelector('.error');
        selectedDocuments = Array.from(checkboxes).map(checkbox => checkbox.value);

        if (selectedDocuments.length === 0) {
            errorElement.classList.remove('hidden');
            return false;
        }
        errorElement.classList.add('hidden');
        return true;
    }

    // Handle category selection (Semi-Automated)
    function handleCategorySelection(stepId) {
        const stepElement = document.getElementById(stepId);
        const checkboxes = stepElement.querySelectorAll('input[name="categories"]:checked');
        const errorElement = stepElement.querySelector('.error');
        const selectedCategories = Array.from(checkboxes).map(checkbox => checkbox.value);

        if (selectedCategories.length === 0) {
            errorElement.classList.remove('hidden');
            return false;
        }
        errorElement.classList.add('hidden');

        // Populate documents for selected categories
        const categoryDocuments = document.getElementById('category-documents');
        categoryDocuments.innerHTML = '';
        const allDocuments = {
            policies: [
                { id: 'ohs-policy', name: 'Occupational Health and Safety (OHS) Policy', emoji: '📜' },
                { id: 'environmental-policy', name: 'Environmental Policy', emoji: '🌍' },
                { id: 'quality-policy', name: 'Quality Policy', emoji: '📊' },
                { id: 'substance-abuse-policy', name: 'Substance Abuse Policy', emoji: '🚭' },
                { id: 'smoking-policy', name: 'Smoking Policy', emoji: '🚬' },
                { id: 'workplace-violence-policy', name: 'Workplace Violence and Harassment Policy', emoji: '🛡️' },
                { id: 'mental-health-policy', name: 'Mental Health and Wellbeing Policy', emoji: '🧠' },
                { id: 'disability-policy', name: 'Disability and Return-to-Work Policy', emoji: '♿' },
                { id: 'contractor-policy', name: 'Contractor and Service Provider Policy', emoji: '🤝' },
                { id: 'ppe-policy', name: 'PPE Policy', emoji: '🧤' },
                { id: 'fit-for-duty-policy', name: 'Fit-for-Duty Policy', emoji: '💪' },
                { id: 'infectious-disease-policy', name: 'COVID-19 or Infectious Disease Response Policy', emoji: '🦠' }
            ],
            procedures: [
                { id: 'incident-reporting-procedure', name: 'Incident and Accident Reporting Procedure', emoji: '🚑' },
                { id: 'emergency-response-procedure', name: 'Emergency Response Procedure', emoji: '🚨' },
                { id: 'fire-evacuation-procedure', name: 'Fire Evacuation Procedure', emoji: '🔥' },
                { id: 'permit-to-work-procedure', name: 'Permit-to-Work Procedure', emoji: '📜' },
                { id: 'hira-procedure', name: 'Hazard Identification and Risk Assessment (HIRA) Procedure', emoji: '⚠️' },
                { id: 'ppe-issuance-procedure', name: 'PPE Issuance and Use Procedure', emoji: '🧤' },
                { id: 'lockout-tagout-procedure', name: 'Lockout/Tagout Procedure', emoji: '🔒' },
                { id: 'confined-space-entry-procedure', name: 'Confined Space Entry Procedure', emoji: '🏪' },
                { id: 'working-at-heights-procedure', name: 'Working at Heights Procedure', emoji: '🪜' },
                { id: 'contractor-management-procedure', name: 'Contractor Management Procedure', emoji: '🤝' },
                { id: 'hot-work-procedure', name: 'Hot Work Procedure', emoji: '🔥' },
                { id: 'first-aid-procedure', name: 'First Aid and Medical Emergency Procedure', emoji: '🩺' },
                { id: 'ergonomics-assessment-procedure', name: 'Ergonomics Assessment Procedure', emoji: '🧘' },
                { id: 'incident-investigation-procedure', name: 'Incident Investigation Procedure', emoji: '🔍' },
                { id: 'induction-training-procedure', name: 'Induction and Training Procedure', emoji: '🎓' },
                { id: 'toolbox-talk-procedure', name: 'Toolbox Talk Procedure', emoji: '📢' },
                { id: 'document-control-procedure', name: 'Document and Records Control Procedure', emoji: '📄' },
                { id: 'non-conformance-procedure', name: 'Non-Conformance and Corrective Action Procedure', emoji: '⚖️' },
                { id: 'internal-audit-procedure', name: 'Internal OHS Audit Procedure', emoji: '🔍' },
                { id: 'return-to-work-procedure', name: 'Return-to-Work Procedure', emoji: '🏥' }
            ],
            standards: [
                { id: 'ohs-management-standard', name: 'OHS Management System Standard (ISO 45001 aligned)', emoji: '📋' },
                { id: 'risk-rating-matrix', name: 'Risk Rating Matrix', emoji: '📊' },
                { id: 'emergency-preparedness-standard', name: 'Standard for Emergency Preparedness and Response', emoji: '🚨' },
                { id: 'housekeeping-standard', name: 'Housekeeping and Waste Management Standard', emoji: '🧹' },
                { id: 'incident-classification-matrix', name: 'Incident Classification Matrix', emoji: '📉' },
                { id: 'ohs-training-standard', name: 'OHS Training and Competency Standard', emoji: '🎓' },
                { id: 'safe-driving-standard', name: 'Safe Driving / Fleet Management Standard', emoji: '🚗' },
                { id: 'noise-ventilation-standard', name: 'Standard for Noise, Ventilation, and Lighting', emoji: '💡' },
                { id: 'fire-protection-standard', name: 'Fire Protection System Standard', emoji: '🔥' },
                { id: 'ergonomics-standard', name: 'Workplace Ergonomics Standard', emoji: '🧘' },
                { id: 'health-surveillance-standard', name: 'Occupational Health Surveillance Standard', emoji: '🏥' },
                { id: 'fall-protection-standard', name: 'Fall Protection Plan Standard', emoji: '🪜' },
                { id: 'hazardous-substance-standard', name: 'Hazardous Substance Handling Standard', emoji: '☣️' },
                { id: 'construction-safety-standard', name: 'Construction Site Safety Standard', emoji: '🏗️' },
                { id: 'hygiene-facility-standard', name: 'Hygiene Facility Standard (toilets, water, rest areas)', emoji: '🚻' }
            ],
            'registers-logs': [
                { id: 'legal-requirements-register', name: 'Legal Requirements Register', emoji: '📜' },
                { id: 'risk-register', name: 'Risk Register / HIRA Register', emoji: '⚠️' },
                { id: 'training-competency-log', name: 'Training and Competency Log', emoji: '🎓' },
                { id: 'ppe-issuance-register', name: 'PPE Issuance Register', emoji: '🧤' },
                { id: 'contractor-register', name: 'Contractor Register', emoji: '🤝' },
                { id: 'incident-injury-register', name: 'Incident and Injury Register', emoji: '🚑' },
                { id: 'corrective-action-register', name: 'Corrective Action Register (CAR/PAR)', emoji: '⚖️' },
                { id: 'first-aid-register', name: 'First Aid Register', emoji: '🩺' },
                { id: 'equipment-inspection-log', name: 'Equipment/Machinery Inspection Log', emoji: '🔧' },
                { id: 'fire-equipment-inspection-register', name: 'Fire Equipment Inspection Register', emoji: '🔥' },
                { id: 'chemical-register', name: 'Chemical Register / MSDS Register', emoji: '☣️' },
                { id: 'emergency-drill-register', name: 'Emergency Drill Register', emoji: '🚨' },
                { id: 'visitor-induction-register', name: 'Visitor and Induction Register', emoji: '👤' },
                { id: 'medical-examination-register', name: 'Occupational Medical Examination Register', emoji: '🏥' },
                { id: 'asbestos-lead-exposure-register', name: 'Asbestos or Lead Exposure Register', emoji: '☢️' }
            ],
            'templates-forms': [
                { id: 'hira-template', name: 'HIRA Template', emoji: '⚠️' },
                { id: 'incident-report-form', name: 'Incident Report Form', emoji: '🚑' },
                { id: 'root-cause-analysis-form', name: 'Root Cause Analysis Form', emoji: '🔍' },
                { id: 'toolbox-talk-attendance-sheet', name: 'Toolbox Talk Attendance Sheet', emoji: '📢' },
                { id: 'emergency-contact-list', name: 'Emergency Contact List', emoji: '📞' },
                { id: 'training-attendance-register', name: 'Training Attendance Register', emoji: '🎓' },
                { id: 'safety-meeting-minutes-template', name: 'Safety Meeting Minutes Template', emoji: '📝' },
                { id: 'audit-checklist-template', name: 'Audit Checklist Template', emoji: '🔍' },
                { id: 'daily-site-inspection-form', name: 'Daily Site Inspection Form', emoji: '📋' },
                { id: 'permit-request-forms', name: 'Permit Request Forms', emoji: '📜' },
                { id: 'risk-control-action-plan-template', name: 'Risk Control Action Plan Template', emoji: '⚠️' },
                { id: 'contractor-evaluation-checklist', name: 'Contractor Evaluation Checklist', emoji: '🤝' },
                { id: 'ohs-induction-checklist', name: 'OHS Induction Checklist', emoji: '✅' },
                { id: 'health-surveillance-consent-form', name: 'Health Surveillance Consent Form', emoji: '📝' },
                { id: 'hazard-report-card', name: 'Hazard Report Card / Near-Miss Form', emoji: '⚠️' },
                { id: 'fit-for-duty-form', name: 'Fit-for-Duty / Return-to-Work Assessment Form', emoji: '🏥' },
                { id: 'jsa-template', name: 'Job Safety Analysis (JSA) Template', emoji: '📋' },
                { id: 'ergonomic-risk-assessment-form', name: 'Ergonomic Risk Assessment Form', emoji: '🧘' }
            ],
            permits: [
                { id: 'permit-to-work-general', name: 'Permit to Work (General)', emoji: '📜' },
                { id: 'hot-work-permit', name: 'Hot Work Permit', emoji: '🔥' },
                { id: 'confined-space-entry-permit', name: 'Confined Space Entry Permit', emoji: '🏪' },
                { id: 'working-at-heights-permit', name: 'Working at Heights Permit', emoji: '🪜' },
                { id: 'electrical-isolation-permit', name: 'Electrical Isolation / Lockout Permit', emoji: '⚡' },
                { id: 'excavation-permit', name: 'Excavation and Trenching Permit', emoji: '⛏️' },
                { id: 'crane-lifting-permit', name: 'Crane / Lifting Operation Permit', emoji: '🏗️' },
                { id: 'demolition-work-permit', name: 'Demolition Work Permit', emoji: '💥' },
                { id: 'hazardous-substance-handling-permit', name: 'Hazardous Substance Handling Permit', emoji: '☣️' },
                { id: 'vehicle-equipment-access-permit', name: 'Vehicle and Equipment Access Permit', emoji: '🚗' },
                { id: 'radiation-work-permit', name: 'Radiation Work Permit', emoji: '☢️' },
                { id: 'asbestos-disturbance-permit', name: 'Asbestos Disturbance Permit', emoji: '☢️' }
            ],
            records: [
                { id: 'signed-policies', name: 'Signed Policies', emoji: '📜' },
                { id: 'completed-risk-assessments', name: 'Completed Risk Assessments', emoji: '⚠️' },
                { id: 'incident-investigation-reports', name: 'Incident Investigation Reports', emoji: '🚑' },
                { id: 'signed-meeting-minutes', name: 'Signed Meeting Minutes', emoji: '📝' },
                { id: 'completed-permits', name: 'Completed Permits', emoji: '📜' },
                { id: 'attendance-records', name: 'Attendance Records (Training/Inductions/Toolbox Talks)', emoji: '🎓' },
                { id: 'certificates-of-compliance', name: 'Certificates of Compliance (e.g., fire, electrical)', emoji: '✅' },
                { id: 'equipment-maintenance-reports', name: 'Equipment Maintenance and Calibration Reports', emoji: '🔧' },
                { id: 'medical-surveillance-reports', name: 'Medical Surveillance Reports', emoji: '🏥' },
                { id: 'coida-claims-reports', name: 'COIDA Claims and Reports', emoji: '📜' },
                { id: 'audit-reports', name: 'Audit Reports', emoji: '🔍' },
                { id: 'contractor-safety-files', name: 'Contractor Safety Files', emoji: '🤝' },
                { id: 'waste-disposal-certificates', name: 'Waste Disposal Certificates', emoji: '🗑️' }
            ]
        };

        selectedCategories.forEach(category => {
            const docs = allDocuments[category] || [];
            docs.forEach(doc => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-200 p-2">
                        <input type="checkbox" id="${doc.id}" name="documents" value="${doc.id}" class="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500">
                    </td>
                    <td class="border border-gray-200 p-2 document-name"><span class="emoji">${doc.emoji}</span> ${doc.name}</td>
                `;
                categoryDocuments.appendChild(row);
            });
        });

        return true;
    }

    // Load suggested documents (Automated mode)
    function loadSuggestedDocuments() {
        const industry = document.getElementById('industry').value;
        const companySize = document.getElementById('company-size').value;
        const riskProfile = document.getElementById('risk-profile').value;

        if (!industry || !companySize || !riskProfile) return;

        const suggestions = industryData[industry]?.[companySize]?.[riskProfile] || [];
        const suggestedDocuments = document.getElementById('suggested-documents');
        suggestedDocuments.innerHTML = '';

        const allDocuments = [
            { id: 'ohs-policy', name: 'Occupational Health and Safety (OHS) Policy', emoji: '📜' },
            { id: 'hira-procedure', name: 'Hazard Identification and Risk Assessment (HIRA) Procedure', emoji: '⚠️' },
            { id: 'emergency-response-procedure', name: 'Emergency Response Procedure', emoji: '🚨' },
            { id: 'working-at-heights-procedure', name: 'Working at Heights Procedure', emoji: '🪜' },
            { id: 'confined-space-entry-procedure', name: 'Confined Space Entry Procedure', emoji: '🏪' },
            { id: 'permit-to-work-procedure', name: 'Permit-to-Work Procedure', emoji: '📜' },
            { id: 'training-competency-log', name: 'Training and Competency Log', emoji: '🎓' },
            { id: 'ohs-management-standard', name: 'OHS Management System Standard (ISO 45001 aligned)', emoji: '📋' },
            { id: 'incident-injury-register', name: 'Incident and Injury Register', emoji: '🚑' },
            { id: 'incident-investigation-procedure', name: 'Incident Investigation Procedure', emoji: '🔍' },
            { id: 'lockout-tagout-procedure', name: 'Lockout/Tagout Procedure', emoji: '🔒' },
            { id: 'hazardous-substance-standard', name: 'Hazardous Substance Handling Standard', emoji: '☣️' },
            { id: 'incident-reporting-procedure', name: 'Incident and Accident Reporting Procedure', emoji: '🚑' },
            { id: 'hazardous-substance-handling-permit', name: 'Hazardous Substance Handling Permit', emoji: '☣️' },
            { id: 'chemical-register', name: 'Chemical Register / MSDS Register', emoji: '☣️' },
            { id: 'fire-evacuation-procedure', name: 'Fire Evacuation Procedure', emoji: '🔥' },
            { id: 'ergonomics-assessment-procedure', name: 'Ergonomics Assessment Procedure', emoji: '🧘' },
            { id: 'first-aid-procedure', name: 'First Aid and Medical Emergency Procedure', emoji: '🩺' },
            { id: 'infectious-disease-policy', name: 'COVID-19 or Infectious Disease Response Policy', emoji: '🦠' },
            { id: 'manual-handling-procedure', name: 'Manual Handling Procedure', emoji: '🏋️' },
            { id: 'medical-examination-register', name: 'Occupational Medical Examination Register', emoji: '🏥' },
            { id: 'induction-training-procedure', name: 'Induction and Training Procedure', emoji: '🎓' },
            { id: 'safe-driving-standard', name: 'Safe Driving / Fleet Management Standard', emoji: '🚗' }
        ];

        suggestions.forEach(docId => {
            const doc = allDocuments.find(d => d.id === docId);
            if (doc) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-200 p-2">
                        <input type="checkbox" id="${doc.id}" name="documents" value="${doc.id}" class="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500">
                    </td>
                    <td class="border border-gray-200 p-2 document-name"><span class="emoji">${doc.emoji}</span> ${doc.name}</td>
                `;
                suggestedDocuments.appendChild(row);
            }
        });
    }

    // Handle role selection for SACPCMP fields
    const compiledByRole = document.getElementById('compiled-by-role');
    compiledByRole?.addEventListener('change', () => {
        const sacpcmpRegGroup = document.getElementById('sacpcmp-reg-group');
        const specifyRoleGroup = document.getElementById('specify-role-group');
        sacpcmpRegGroup.classList.add('hidden');
        specifyRoleGroup.classList.add('hidden');

        if (['sacpcmp-officer', 'sacpcmp-agent'].includes(compiledByRole.value)) {
            sacpcmpRegGroup.classList.remove('hidden');
            document.getElementById('sacpcmp-reg').required = true;
        } else if (compiledByRole.value === 'other') {
            specifyRoleGroup.classList.remove('hidden');
            document.getElementById('specify-role').required = true;
        }
    });

    // Back button handler
    backBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            currentStep--;
            updateStep();
        }
    });

    // Next button handler
    nextBtn.addEventListener('click', () => {
        const stepId = `step-${currentStep}-${mode === 'automated' ? 'automated' : mode === 'semi-automated' ? 'semi-automated' : 'manual'}`;
        let canProceed = validateForm(stepId);

        if (canProceed) {
            if (mode === 'automated' && currentStep === 1) {
                loadSuggestedDocuments();
            } else if (mode === 'automated' && currentStep === 2) {
                canProceed = handleDocumentSelection(stepId);
            } else if (mode === 'semi-automated' && currentStep === 0) {
                canProceed = handleCategorySelection(stepId);
            } else if (mode === 'semi-automated' && currentStep === 1) {
                canProceed = handleDocumentSelection(stepId);
            } else if (mode === 'manual' && currentStep === 0) {
                canProceed = handleDocumentSelection(stepId);
            }
        }

        if (canProceed) {
            const totalSteps = mode === 'automated' ? 5 : 4;
            if (currentStep < totalSteps) {
                currentStep++;
                updateStep();
            }
        }
    });

    // Add to cart handler
    addToCartBtn.addEventListener('click', () => {
        const selectedDocsList = document.getElementById('selected-documents');
        selectedDocsList.innerHTML = selectedDocuments.map(doc => `<li>${doc.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</li>`).join('');

        cartItems = selectedDocuments.map(doc => ({ id: doc, name: doc.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), price: 'Free' }));
        updateCart();

        wizardContainer.classList.add('hidden');
        cartContainer.classList.remove('hidden');
    });

    // Update cart display
    function updateCart() {
        cartItemsTable.innerHTML = cartItems.map(item => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price}</td>
            </tr>
        `).join('');

        // Generate invoice reference (simplified for demo)
        const invoiceRef = 'INV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        document.getElementById('invoice-ref-number').textContent = invoiceRef;
        document.getElementById('invoice-reference').classList.remove('hidden');
    }

    // Checkout handler (server-side PDF generation with ZIP)
checkoutBtn.addEventListener('click', async () => {
    try {
        const companyDetails = {
            name: document.getElementById('company-name').value,
            address: document.getElementById('company-address').value,
            contactNumber: document.getElementById('company-contact-number').value,
            email: document.getElementById('company-email').value,
            ceoName: document.getElementById('ceo-name').value,
            coidaReg: document.getElementById('coida-registration').value
        };

        const compiledBy = {
            name: document.getElementById('compiled-by-name').value,
            contactNumber: document.getElementById('compiled-by-number').value,
            email: document.getElementById('compiled-by-email').value,
            role: document.getElementById('compiled-by-role').value
        };

        const customContent = document.getElementById('custom-content').value;

        const response = await fetch('http://localhost:3000/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                documents: selectedDocuments,
                companyDetails,
                customContent,
                compiledBy
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate ZIP file');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ohs-documents.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        alert('Documents downloaded successfully as a ZIP file!');
    } catch (error) {
        console.error('Error generating ZIP file:', error);
        alert('Failed to generate ZIP file. Please try again.');
    }
});
