// ohs-data.js
const ohsData = {
    legalRequirements: [
        { id: 'ohsa', text: 'Occupational Health and Safety Act (OHSA) (Act 85 of 1993)', checked: false },
        { id: 'cr2014', text: 'Construction Regulations 2014', checked: false },
        { id: 'coida', text: 'COIDA (Act 130 of 1993)', checked: false },
        { id: 'electrical', text: 'Electrical Installation Regulations', checked: false },
        { id: 'driven-machinery', text: 'Driven Machinery Regulations', checked: false },
        { id: 'municipal-bylaws', text: 'Local Municipal Bylaws', checked: false, requiresDetails: true, detailsLabel: "Specify Bylaws:" },
    ],
    roles: [
        { value: 'Construction Manager', text: 'Construction Manager (CR 8(1))', responsibilities: 'Oversee site safety, ensure compliance, manage H&S plan' },
        { value: 'Construction Supervisor', text: 'Construction Supervisor (CR 8(7))', responsibilities: 'Supervise work, enforce safety procedures' },
        { value: 'H&S Officer', text: 'Health and Safety Officer (CR 8(5))', responsibilities: 'Conduct inspections, risk assessments, incident investigations' },
        { value: 'First Aider', text: 'First Aider', responsibilities: 'Provide first aid, maintain first aid kit' },
        { value: 'Fire Warden', text: 'Fire Warden', responsibilities: 'Manage fire safety, evacuation procedures' },
        { value: 'Other', text: 'Other (Specify)', responsibilities: '', requiresDetails: true, detailsLabel: "Specify Role:" }
    ],
    trainingTopics: [
        { id: 'site-induction', text: 'Site Induction', checked: false },
        { id: 'fall-protection', text: 'Fall Protection Training', checked: false },
        { id: 'excavation-safety', text: 'Excavation Safety Training', checked: false },
        { id: 'first-aid', text: 'First Aid Training', checked: false },
        { id: 'fire-safety', text: 'Fire Safety Training', checked: false },
        { id: 'hcs-training', text: 'Hazardous Chemical Substances Training', checked: false, requiresDetails: true, detailsLabel: "Specify Chemicals:" },
    ],
    ppeTypes: [
        { id: 'hard-hats', text: 'Hard Hats', checked: false },
        { id: 'safety-glasses', text: 'Safety Glasses', checked: false },
        { id: 'safety-footwear', text: 'Safety Footwear', checked: false },
        { id: 'high-vis', text: 'High-Visibility Vests', checked: false },
        { id: 'respirators', text: 'Respirators', checked: false, requiresDetails: true, detailsLabel: "Respirator Type:" },
        { id: 'gloves', text: 'Gloves', checked: false, requiresDetails: true, detailsLabel: "Glove Type:" },
    ],
    riskAssessmentActivities: [
        { value: 'Demolition', text: 'Demolition' },
        { value: 'Excavation', text: 'Excavation' },
        { value: 'Working at Heights', text: 'Working at Heights' },
        { value: 'Scaffolding Erection', text: 'Scaffolding Erection' },
        { value: 'Crane Operations', text: 'Crane Operations' },
        { value: 'Electrical Work', text: 'Electrical Work' },
        { value: 'Welding', text: 'Welding' },
        { value: 'Confined Space Entry', text: 'Confined Space Entry' },
        { value: 'Other', text: 'Other (Specify)', requiresDetails: true, detailsLabel: "Specify Activity:" }
    ],
    hazards: {
        'Demolition': [
            { name: 'Asbestos exposure', risk: 'Respiratory illness', control: 'Licensed removal, PPE' },
            { name: 'Falling debris', risk: 'Injury', control: 'Barricades, hard hats' },
            { name: 'Structural collapse', risk: 'Injury, fatality', control: 'Demolition plan, exclusion zone' },
            { name: 'Noise', risk: 'Hearing loss', control: 'Ear protection' }
        ],
        'Excavation': [
            { name: 'Trench collapse', risk: 'Burial/injury', control: 'Shoring, inspections' },
            { name: 'Underground utilities', risk: 'Electrocution/gas leaks', control: 'Utility mapping, lockout' },
            { name: 'Oxygen Deficiency', risk: 'Asphyxiation', control: 'Air monitoring, ventilation' },
            { name: 'Mobile Plant', risk: 'Injury', control: 'Pedestrian exclusion zones' }
        ],
        'Working at Heights': [
            { name: 'Falls', risk: 'Injury, fatality', control: 'Fall arrest systems, guardrails' },
            { name: 'Falling Objects', risk: 'Injury', control: 'Toe boards, debris netting' }
        ],
        'Scaffolding Erection': [
            { name: 'Scaffolding collapse', risk: 'Injury', control: 'Competent erectors, inspections' },
            { name: 'Falls', risk: 'Injury, fatality', control: 'Harnesses, guardrails' }
        ],
        'Crane Operations': [
            { name: 'Dropped loads', risk: 'Injury, fatality', control: 'Load limits, certified operators' },
            { name: 'Crane collapse', risk: 'Injury, fatality', control: 'Inspections, load charts' }
        ],
        'Electrical Work': [
            { name: 'Electrical shock', risk: 'Injury, fatality', control: 'Lockout/tagout, insulation' },
            { name: 'Arc flash', risk: 'Burns, blindness', control: 'PPE, safe work procedures' }
        ],
        'Welding': [
            { name: 'Fumes', risk: 'Respiratory illness', control: 'Ventilation, respirators' },
            { name: 'Burns', risk: 'Injury', control: 'PPE, fire prevention' },
            { name: 'UV radiation', risk: 'Eye damage', control: 'Welding helmets, screens' }
        ],
        'Confined Space Entry': [
            { name: 'Oxygen Deficiency', risk: 'Asphyxiation', control: 'Air monitoring, ventilation' },
            { name: 'Toxic gases', risk: 'Respiratory illness', control: 'Air monitoring, ventilation, PPE' }
        ],
    }
};

// Export for use in other scripts
window.ohsData = ohsData;
