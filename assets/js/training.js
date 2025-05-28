document.addEventListener('DOMContentLoaded', () => {
  // Initialize i18next
  i18next
    .use(i18nextBrowserLanguageDetector)
    .init({
      fallbackLng: 'en',
      resources: {
        en: { translation: { /* English translations loaded dynamically */ } },
        xh: { translation: { /* Xhosa translations */ } },
        af: { translation: { /* Afrikaans translations */ } },
        nd: { translation: { /* Ndebele translations */ } },
        nso: { translation: { /* Northern Sotho translations */ } },
        st: { translation: { /* Sotho translations */ } },
        ss: { translation: { /* Swazi translations */ } },
        ts: { translation: { /* Tsonga translations */ } },
        tn: { translation: { /* Tswana translations */ } },
        ve: { translation: { /* Venda translations */ } },
        zu: { translation: { /* Zulu translations */ } },
        fr: { translation: { /* French translations */ } },
        zh: { translation: { /* Mandarin translations */ } },
        es: { translation: { /* Spanish translations */ } },
        sn: { translation: { /* Shona translations */ } },
        sw: { translation: { /* Swahili translations */ } }
      }
    }, (err, t) => {
      if (err) return console.error('i18next initialization error:', err);
      updateContent();
      initializeTrainingOptions();
    });

  // Function to update page content with translations
  function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.innerHTML = i18next.t(key);
    });
  }

  // Language switcher
  const languageSelect = document.createElement('select');
  languageSelect.id = 'language-switcher';
  const languages = ['en', 'xh', 'af', 'nd', 'nso', 'st', 'ss', 'ts', 'tn', 've', 'zu', 'fr', 'zh', 'es', 'sn', 'sw'];
  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.text = lang.toUpperCase();
    languageSelect.appendChild(option);
  });
  languageSelect.addEventListener('change', (e) => {
    i18next.changeLanguage(e.target.value, () => {
      updateContent();
      initializeTrainingOptions(); // Re-render training options with new language
    });
  });
  document.body.prepend(languageSelect);

  // Training options data
  const trainingOptions = [
    // Induction Training
    { id: 'general_site_induction', category: 'Induction Training', name: 'General Site Induction', price: 150 },
    { id: 'site_specific_induction', category: 'Induction Training', name: 'Site-Specific Induction', price: 150 },
    { id: 'job_specific_induction', category: 'Induction Training', name: 'Job-Specific Induction', price: 150 },
    // Awareness Training
    { id: 'manual_handling_awareness', category: 'Awareness Training', name: 'Manual Handling Awareness', price: 100 },
    { id: 'fire_safety_awareness', category: 'Awareness Training', name: 'Fire Safety Awareness', price: 100 },
    { id: 'dse_awareness', category: 'Awareness Training', name: 'DSE (Display Screen Equipment) Awareness', price: 100 },
    { id: 'general_hse_awareness', category: 'Awareness Training', name: 'General HSE Awareness', price: 100 },
    { id: 'ergonomics', category: 'Awareness Training', name: 'Ergonomics Training', price: 100 },
    { id: 'noise_induced_hearing', category: 'Awareness Training', name: 'Noise-Induced Hearing Loss (NIHL) Awareness', price: 100 },
    { id: 'asbestos_awareness', category: 'Awareness Training', name: 'Asbestos Awareness Training', price: 100 },
    { id: 'mental_health_fatigue', category: 'Awareness Training', name: 'Mental Health & Fatigue Management Awareness', price: 100 },
    // Statutory / Mandatory Training
    { id: 'fire_warden', category: 'Statutory / Mandatory Training', name: 'Fire Warden/Marshal', price: 200 },
    { id: 'first_aid', category: 'Statutory / Mandatory Training', name: 'First Aid (Levels 1, 2, 3)', price: 200 },
    { id: 'asbestos_awareness_statutory', category: 'Statutory / Mandatory Training', name: 'Asbestos Awareness (Statutory)', price: 200 },
    { id: 'working_at_heights', category: 'Statutory / Mandatory Training', name: 'Working at Heights', price: 200 },
    { id: 'confined_space_entry', category: 'Statutory / Mandatory Training', name: 'Confined Space Entry', price: 200 },
    { id: 'hazardous_chemicals', category: 'Statutory / Mandatory Training', name: 'COSHH (Hazardous Substances)', price: 200 },
    // Task- or Risk-Specific Training
    { id: 'permit_to_work', category: 'Task- or Risk-Specific Training', name: 'Permit to Work Training', price: 150 },
    { id: 'lockout_tagout', category: 'Task- or Risk-Specific Training', name: 'Lockout/Tagout (LOTO)', price: 150 },
    { id: 'machinery_operation', category: 'Task- or Risk-Specific Training', name: 'Machinery Operation (e.g., Forklift, Crane)', price: 150 },
    { id: 'ppe_use', category: 'Task- or Risk-Specific Training', name: 'PPE Use and Selection', price: 150 },
    { id: 'hot_work', category: 'Task- or Risk-Specific Training', name: 'Hot Work', price: 150 },
    { id: 'hira', category: 'Task- or Risk-Specific Training', name: 'Hazard Identification and Risk Assessment (HIRA)', price: 150 },
    // Role-Specific / Competency Training
    { id: 'safety_officer', category: 'Role-Specific / Competency Training', name: 'Safety Officer/Advisor Training', price: 250 },
    { id: 'line_manager_hse', category: 'Role-Specific / Competency Training', name: 'Line Manager HSE Responsibilities', price: 250 },
    { id: 'contractor_safety', category: 'Role-Specific / Competency Training', name: 'Contractor Safety Management', price: 250 },
    { id: 'hse_committee', category: 'Role-Specific / Competency Training', name: 'HSE Committee Member Training', price: 250 },
    { id: 'she_representative', category: 'Role-Specific / Competency Training', name: 'SHE Representative Training', price: 250 },
    { id: 'ceo_section_16', category: 'Role-Specific / Competency Training', name: 'CEO & Section 16 Appointee Legal Obligations', price: 250 },
    { id: 'general_management', category: 'Role-Specific / Competency Training', name: 'General Management & Supervisory OHS Responsibilities', price: 250 },
    { id: 'construction_manager', category: 'Role-Specific / Competency Training', name: 'Construction Manager', price: 250 },
    { id: 'construction_health_safety_officer', category: 'Role-Specific / Competency Training', name: 'Construction Health & Safety Officer (CHSO)', price: 250 },
    { id: 'construction_supervisor', category: 'Role-Specific / Competency Training', name: 'Construction Supervisor', price: 250 },
    { id: 'scaffold_personnel', category: 'Role-Specific / Competency Training', name: 'Scaffold Erector / Inspector / Supervisor', price: 250 },
    { id: 'explosives_handling', category: 'Role-Specific / Competency Training', name: 'Person Handling Explosives (Blasting)', price: 250 },
    { id: 'incident_investigation', category: 'Role-Specific / Competency Training', name: 'Incident Investigation Training', price: 250 },
    { id: 'gmr_2_1', category: 'Role-Specific / Competency Training', name: 'GMR 2.1 Appointee Role & Responsibilities', price: 250 },
    // Refresher Training
    { id: 'annual_hse_refresher', category: 'Refresher Training', name: 'Annual HSE Refresher', price: 100 },
    { id: 'first_aid_refresher', category: 'Refresher Training', name: 'First Aid Refresher', price: 100 },
    { id: 'fire_marshal_refresher', category: 'Refresher Training', name: 'Fire Marshal Refresher', price: 100 },
    { id: 'policy_updates', category: 'Refresher Training', name: 'Policy or Procedure Updates', price: 100 },
    // Toolbox Talks / Safety Briefings
    { id: 'weekly_toolbox_talk', category: 'Toolbox Talks / Safety Briefings', name: 'Weekly Toolbox Talk', price: 50 },
    { id: 'pre_task_briefing', category: 'Toolbox Talks / Safety Briefings', name: 'Pre-Task Briefing', price: 50 },
    { id: 'incident_learning', category: 'Toolbox Talks / Safety Briefings', name: 'Incident Learning Sessions', price: 50 }
  ];

  // Initialize training options for manual selection
  function initializeTrainingOptions() {
    const trainingOptionsDiv = document.getElementById('training-options');
    trainingOptionsDiv.innerHTML = '';
    trainingOptions.forEach(option => {
      const div = document.createElement('div');
      div.innerHTML = `<input type="checkbox" name="training" value="${option.id}"> <span>${option.name}</span>`;
      trainingOptionsDiv.appendChild(div);
    });
  }

  // Section toggling
  const sections = ['selection-method', 'training-wizard', 'category-selection', 'manual-selection', 'manual-purchase', 'training-cart', 'checkout-result'];
  function showSection(sectionId) {
    sections.forEach(id => {
      document.querySelector(`.${id}`).style.display = id === sectionId ? 'block' : 'none';
    });
  }

  // Selection method buttons
  document.getElementById('start-wizard').addEventListener('click', () => {
    showSection('training-wizard');
    showTrainingStep(1);
  });
  document.getElementById('select-by-category').addEventListener('click', () => {
    showSection('category-selection');
    initializeCategoryToggles();
  });
  document.getElementById('select-manually').addEventListener('click', () => {
    showSection('manual-selection');
    initializeSearch();
  });
  document.getElementById('purchase-manual').addEventListener('click', () => {
    showSection('manual-purchase');
  });

  // Category toggles
  function initializeCategoryToggles() {
    document.querySelectorAll('.category-toggle').forEach(button => {
      button.addEventListener('click', () => {
        const content = button.nextElementSibling;
        content.style.display = content.style.display === 'block' ? 'none' : 'block';
      });
    });
  }

  // Search functionality for manual selection
  function initializeSearch() {
    const searchInput = document.getElementById('training-search');
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase();
      const options = document.querySelectorAll('#training-options div');
      options.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(query) ? 'block' : 'none';
      });
    });
  }

  // Training wizard logic
  let currentTrainingStep = 0;
  const trainingSteps = document.querySelectorAll('.training-wizard .wizard-step');
  function showTrainingStep(stepIndex) {
    trainingSteps.forEach((step, index) => {
      step.style.display = index === stepIndex ? 'block' : 'none';
    });

    const backBtn = document.querySelector('#training-wizard-back');
    const nextBtn = document.querySelector('#training-wizard-next');
    const addToCartBtn = document.querySelector('#training-wizard-add-to-cart');

    backBtn.style.display = stepIndex === 0 ? 'none' : 'inline-block';
    nextBtn.style.display = stepIndex === trainingSteps.length - 1 ? 'none' : 'inline-block';
    addToCartBtn.style.display = stepIndex === trainingSteps.length - 1 ? 'inline-block' : 'none';

    if (stepIndex === 4) {
      recommendTraining();
    }
  }

  function validateTrainingStep(stepIndex) {
    const step = trainingSteps[stepIndex];
    const inputs = step.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
      const errorMessage = step.querySelector(`#${input.id}-error`);
      if (!input.value.trim()) {
        isValid = false;
        errorMessage.style.display = 'block';
        input.classList.add('error');
      } else {
        errorMessage.style.display = 'none';
        input.classList.remove('error');
      }

      if (input.type === 'tel' && input.value.trim()) {
        const phonePattern = /^\+\d{11}$/;
        if (!phonePattern.test(input.value)) {
          isValid = false;
          errorMessage.style.display = 'block';
          input.classList.add('error');
        }
      }

      if (input.type === 'email' && input.value.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(input.value)) {
          isValid = false;
          errorMessage.style.display = 'block';
          input.classList.add('error');
        }
      }
    });

    const checkboxes = step.querySelectorAll('input[type="checkbox"][required]');
    if (checkboxes.length > 0) {
      const checked = Array.from(checkboxes).some(checkbox => checkbox.checked);
      const errorMessage = step.querySelector('#target-audience-error');
      if (!checked) {
        isValid = false;
        errorMessage.style.display = 'block';
      } else {
        errorMessage.style.display = 'none';
      }
    }

    return isValid;
  }

  document.querySelector('#training-wizard-back').addEventListener('click', () => {
    if (currentTrainingStep > 0) {
      currentTrainingStep--;
      showTrainingStep(currentTrainingStep);
    }
  });

  document.querySelector('#training-wizard-next').addEventListener('click', () => {
    if (validateTrainingStep(currentTrainingStep) && currentTrainingStep < trainingSteps.length - 1) {
      currentTrainingStep++;
      showTrainingStep(currentTrainingStep);
    }
  });

  // Recommend training based on wizard inputs
  function recommendTraining() {
    const industry = document.getElementById('industry').value;
    const targetAudiences = Array.from(document.querySelectorAll('input[name="target-audience"]:checked')).map(cb => cb.value);
    const municipality = document.getElementById('municipality').value;
    const riskProfile = document.getElementById('risk-profile').value;

    const recommended = [];

    // Logic for recommending training
    if (targetAudiences.includes('all_employees')) {
      recommended.push('general_site_induction', 'general_hse_awareness', 'fire_safety_awareness', 'ergonomics', 'mental_health_fatigue');
    }
    if (targetAudiences.includes('new_employees')) {
      recommended.push('general_site_induction', 'site_specific_induction', 'job_specific_induction');
    }
    if (targetAudiences.includes('managers')) {
      recommended.push('line_manager_hse', 'safety_officer', 'ceo_section_16', 'general_management');
    }
    if (targetAudiences.includes('she_reps')) {
      recommended.push('she_representative', 'hse_committee');
    }
    if (targetAudiences.includes('emergency_team')) {
      recommended.push('fire_warden', 'first_aid');
    }
    if (targetAudiences.includes('hazard_workers')) {
      recommended.push('working_at_heights', 'confined_space_entry', 'hazardous_chemicals', 'noise_induced_hearing', 'asbestos_awareness_statutory', 'hira');
    }
    if (targetAudiences.includes('equipment_operators')) {
      recommended.push('machinery_operation', 'lockout_tagout', 'gmr_2_1');
    }
    if (targetAudiences.includes('construction_roles')) {
      recommended.push('construction_manager', 'construction_health_safety_officer', 'construction_supervisor', 'scaffold_personnel', 'explosives_handling');
    }
    if (riskProfile === 'high') {
      recommended.push('permit_to_work', 'hot_work', 'weekly_toolbox_talk', 'incident_investigation');
    }
    if (riskProfile === 'medium') {
      recommended.push('manual_handling_awareness', 'ppe_use');
    }
    if (riskProfile === 'low') {
      recommended.push('dse_awareness');
    }

    const uniqueRecommended = [...new Set(recommended)];
    const recommendedTrainingDiv = document.getElementById('recommended-training');
    recommendedTrainingDiv.innerHTML = '';
    uniqueRecommended.forEach(id => {
      const option = trainingOptions.find(opt => opt.id === id);
      if (option) {
        const div = document.createElement('div');
        div.innerHTML = `<input type="checkbox" name="recommended-training" value="${option.id}" checked> <span>${option.name}</span>`;
        recommendedTrainingDiv.appendChild(div);
      }
    });
  }

  // Add to cart from wizard
  document.querySelector('#training-wizard-add-to-cart').addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('input[name="recommended-training"]:checked'))
      .map(checkbox => trainingOptions.find(opt => opt.id === checkbox.value));
    updateCart(selected);
    showSection('training-cart');
  });

  // Add to cart from category selection
  document.getElementById('category-add-to-cart').addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('.category-selection input[name="training"]:checked'))
      .map(checkbox => trainingOptions.find(opt => opt.id === checkbox.value));
    updateCart(selected);
    showSection('training-cart');
  });

  // Add to cart from manual selection
  document.getElementById('manual-add-to-cart').addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('#training-options input[name="training"]:checked'))
      .map(checkbox => trainingOptions.find(opt => opt.id === checkbox.value));
    updateCart(selected);
    showSection('training-cart');
  });

  // Add training manual to cart
  document.getElementById('manual-purchase-add-to-cart').addEventListener('click', () => {
    const riskProfile = document.getElementById('manual-risk-profile').value;
    if (!riskProfile) {
      document.getElementById('manual-risk-profile-error').style.display = 'block';
      return;
    }
    const manual = { id: 'training_manual', category: 'Customizable Training Manual', name: 'Customizable Training Manual', price: 500, riskProfile };
    updateCart([manual]);
    showSection('training-cart');
  });

  // Update cart
  function updateCart(items) {
    const cartTableBody = document.querySelector('#training-cart-table tbody');
    cartTableBody.innerHTML = '';

    items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${item.name}</td><td>R${item.price}</td>`;
      cartTableBody.appendChild(row);
    });

    window.cartItems = items; // Store items for checkout
  }

  // Training type selection
  document.getElementById('training-type').addEventListener('change', (e) => {
    const onlineDetails = document.getElementById('online-training-details');
    onlineDetails.style.display = e.target.value === 'online' ? 'block' : 'none';
  });

  // Checkout
  document.getElementById('training-checkout').addEventListener('click', () => {
    const companyName = document.getElementById('company-name').value.trim();
    const companyLocation = document.getElementById('company-location').value.trim();
    const firstAider = document.getElementById('first-aider').value.trim();
    const fireFighter = document.getElementById('fire-fighter').value.trim();
    const ohsRep = document.getElementById('ohs-rep').value.trim();
    const supervisor = document.getElementById('supervisor').value.trim();
    const emergencyLine = document.getElementById('emergency-line').value.trim();
    const compiledByName = document.getElementById('compiled-by-name').value.trim();
    const compiledByRole = document.getElementById('compiled-by-role').value.trim();
    const compiledByContact = document.getElementById('compiled-by-contact').value.trim();
    const trainingType = document.getElementById('training-type').value;
    const numPeople = document.getElementById('num-people') ? document.getElementById('num-people').value.trim() : '';

    let isValid = true;

    // Validate inputs
    const validateField = (id, value, errorKey) => {
      const errorElement = document.getElementById(`${id}-error`);
      if (!value) {
        errorElement.style.display = 'block';
        isValid = false;
      } else {
        errorElement.style.display = 'none';
      }
    };

    validateField('company-name', companyName, 'training.cart.customization.company_name_error');
    validateField('company-location', companyLocation, 'training.cart.customization.location_error');
    validateField('first-aider', firstAider, 'training.cart.customization.first_aider_error');
    validateField('fire-fighter', fireFighter, 'training.cart.customization.fire_fighter_error');
    validateField('ohs-rep', ohsRep, 'training.cart.customization.ohs_rep_error');
    validateField('supervisor', supervisor, 'training.cart.customization.supervisor_error');
    validateField('emergency-line', emergencyLine, 'training.cart.customization.emergency_line_error');
    validateField('compiled-by-name', compiledByName, 'training.cart.compiled_by.name_error');
    validateField('compiled-by-role', compiledByRole, 'training.cart.compiled_by.role_error');
    validateField('compiled-by-contact', compiledByContact, 'training.cart.compiled_by.contact_error');
    validateField('training-type', trainingType, 'training.cart.training_type.error');

    if (trainingType === 'online' && (!numPeople || numPeople < 1)) {
      document.getElementById('num-people-error').style.display = 'block';
      isValid = false;
    }

    const phonePattern = /^\+\d{11}$/;
    if (emergencyLine && !phonePattern.test(emergencyLine)) {
      document.getElementById('emergency-line-error').style.display = 'block';
      isValid = false;
    }
    if (compiledByContact && !phonePattern.test(compiledByContact)) {
      document.getElementById('compiled-by-contact-error').style.display = 'block';
      isValid = false;
    }

    if (!isValid) return;

    // Generate PDF (simulated)
    const pdfContent = `
      Training Materials for ${companyName}
      Location: ${companyLocation}
      First Aider: ${firstAider}
      Fire Fighter: ${fireFighter}
      OHS Representative: ${ohsRep}
      Supervisor: ${supervisor}
      Emergency Contact: ${emergencyLine}
      Compiled By: ${compiledByName} (${compiledByRole}, ${compiledByContact})
      Training Programs:
      ${window.cartItems.map(item => `- ${item.name} (R${item.price})`).join('\n')}
    `;
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    document.getElementById('download-pdf').href = url;

    // Generate access codes for online training
    if (trainingType === 'online') {
      const num = parseInt(numPeople, 10);
      const codes = Array.from({ length: num }, () => 'CODE-' + Math.random().toString(36).substr(2, 9).toUpperCase());
      document.getElementById('access-codes').textContent = codes.join(', ');
      document.getElementById('online-codes-section').style.display = 'block';
    } else {
      document.getElementById('online-codes-section').style.display = 'none';
    }

    showSection('checkout-result');
  });

  // Firebase for Chatbot
  const firebaseConfig = {
    apiKey: "AIzaSyDlzylJ0WF_WMZQA2bJeqbzkEMhihYcZW0",
    authDomain: "safety-first-chatbot.firebaseapp.com",
    projectId: "safety-first-chatbot",
    storageBucket: "safety-first-chatbot.firebasestorage.app",
    messagingSenderId: "741489856541",
    appId: "1:741489856541:web:0833fa5deb60dd54c9b6f4",
    measurementId: "G-04Y1PQDYVD"
  };

  try {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    document.getElementById('chat-output').innerHTML = "<p><strong>Error:</strong> Chatbot unavailable. Please try again later.</p>";
  }

  // Toggle Chat Window
  document.getElementById('chat-toggle').addEventListener('click', () => {
    document.getElementById('chat-window').classList.toggle('chat-hidden');
  });

  // Send Question to Chatbot
  document.getElementById('chat-send').addEventListener('click', async () => {
    const input = document.getElementById('chat-input').value.trim();
    const output = document.getElementById('chat-output');
    if (!input) return;

    output.innerHTML += `<p><strong>You:</strong> ${input}</p>`;
    const query = input.toLowerCase();

    try {
      const snapshot = await db.collection('ohs-knowledge').get();
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

  // Adjust Layout
  window.addEventListener('load', adjustLayout);
  window.addEventListener('resize', adjustLayout);
  function adjustLayout() {
    const headerHeight = document.querySelector('header').offsetHeight || 0;
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    if (sidebar && mainContent) {
      sidebar.style.top = `${headerHeight}px`;
      sidebar.style.height = `calc(100vh - ${headerHeight}px)`;
      mainContent.style.marginLeft = `${sidebar.offsetWidth}px`;
      mainContent.style.paddingTop = `${headerHeight}px`;
      mainContent.style.minHeight = `calc(100vh - ${headerHeight}px)`;
    }
  }
});
