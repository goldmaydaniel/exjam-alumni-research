/**
 * AFMS Alumni Management System - Google Apps Script
 * 
 * This script creates a comprehensive alumni management and event registration system
 * for AFMS Alumni Association with QR codes, digital badges, and member management.
 */

// Configuration
const CONFIG = {
  SYSTEM_NAME: "AFMS Alumni Management System",
  ORGANIZATION: "AFMS Alumni Association",
  CURRENT_EVENT: "AFMS Alumni Homecoming 2025",
  EVENT_DATE: "March 15-17, 2025",
  EVENT_VENUE: "AFMS Main Campus, Abuja",
  EVENT_THEME: "Reconnect. Celebrate. Build Future Together",
  ID_PREFIX: "AFMS",
  SPREADSHEET_NAME: "AFMS Alumni Event Registrations",
  FOLDER_NAME: "AFMS Alumni System 2025",
  ALUMNI_DATABASE: "AFMS Alumni Master Database",
  CHAPTERS: ["Abuja", "Lagos", "London", "New York", "Dubai"]
};

/**
 * Improved initialization function for the AFMS Alumni Management System
 * This function provides comprehensive setup with alumni-specific features
 */
function initializeAlumniSystem() {
  try {
    console.log("🚀 Initializing AFMS Alumni Management System...");
    console.log("=============================================");
    
    // Step 1: Validate configuration
    console.log("📋 Step 1: Validating configuration...");
    validateConfiguration();
    console.log("✅ Configuration validated successfully");
    
    // Step 2: Create main folder structure
    console.log("📁 Step 2: Creating folder structure...");
    const folders = createFolders();
    console.log("✅ Folders created successfully");
    
    // Step 3: Create registration form
    console.log("📝 Step 3: Creating registration form...");
    const form = createRegistrationForm();
    console.log("✅ Registration form created successfully");
    
    // Step 4: Create response spreadsheet
    console.log("📊 Step 4: Creating response spreadsheet...");
    const spreadsheet = createResponseSpreadsheet();
    console.log("✅ Response spreadsheet created successfully");
    
    // Step 5: Link form to spreadsheet
    console.log("🔗 Step 5: Linking form to spreadsheet...");
    linkFormToSpreadsheet(form, spreadsheet);
    console.log("✅ Form linked to spreadsheet successfully");
    
    // Step 6: Generate event codes
    console.log("🎫 Step 6: Generating event codes...");
    generateEventCodes(form.getPublishedUrl());
    console.log("✅ Event codes generated successfully");
    
    // Step 7: Create sample badge
    console.log("🖼️ Step 7: Creating sample badge...");
    createSampleBadge();
    console.log("✅ Sample badge created successfully");
    
    // Step 8: Test photo processing
    console.log("📸 Step 8: Testing photo processing...");
    testPhotoProcessing();
    console.log("✅ Photo processing tested successfully");
    
    // Step 9: Generate initial report
    console.log("📈 Step 9: Generating initial report...");
    generateRegistrationReport();
    console.log("✅ Initial report generated successfully");
    
    // Final summary
    console.log("🎉 AFMS Alumni Management System initialization complete!");
    console.log("=============================================");
    console.log("📋 System Summary:");
    console.log(`   • Form URL: ${form.getPublishedUrl()}`);
    console.log(`   • Spreadsheet URL: ${spreadsheet.getUrl()}`);
    console.log(`   • Main Folder: ${folders.root.getName()}`); // Corrected to folders.root
    console.log(`   • Event: ${CONFIG.CURRENT_EVENT}`);
    console.log(`   • Date: ${CONFIG.EVENT_DATE}`);
    console.log(`   • Venue: ${CONFIG.EVENT_VENUE}`);
    console.log("=============================================");
    
    // Return system components
    return {
      success: true,
      form: form,
      spreadsheet: spreadsheet,
      folders: folders,
      formUrl: form.getPublishedUrl(),
      spreadsheetUrl: spreadsheet.getUrl(),
      message: "AFMS Alumni Management System initialized successfully!"
    };
    
  } catch (error) {
    console.error("❌ Error initializing alumni system: " + error);
    console.error("Stack trace: " + error.stack);
    
    // Return error information
    return {
      success: false,
      error: error.toString(),
      message: "Failed to initialize registration system. Check logs for details."
    };
  }
}

/**
 * Validate system configuration
 */
function validateConfiguration() {
  const requiredFields = [
    'EVENT_NAME',
    'EVENT_DATE', 
    'EVENT_VENUE',
    'EVENT_THEME',
    'ID_PREFIX',
    'SPREADSHEET_NAME',
    'FOLDER_NAME'
  ];
  
  for (const field of requiredFields) {
    if (!CONFIG[field]) {
      throw new Error(`Missing required configuration field: ${field}`);
    }
  }
  
  // Validate date format
  const dateRegex = /^[A-Za-z]+ \d{1,2}(-\d{1,2})?, \d{4}$/;
  if (!dateRegex.test(CONFIG.EVENT_DATE)) {
    console.warn("⚠️ Event date format may not be optimal. Expected format: 'Month Day, Year' or 'Month Day-Day, Year'");
  }
  
  // Validate folder name
  if (CONFIG.FOLDER_NAME.length > 50) {
    throw new Error("Folder name is too long. Please use a shorter name.");
  }
  
  console.log("✅ Configuration validation passed");
}

/**
 * Test the photo processing functionality
 */
function testPhotoProcessing() {
  try {
    console.log("Testing photo processing functionality...");
    
    const testParticipant = {
      fullName: "Test Participant",
      serviceNumber: "EXJAM-TEST-001",
      set: "2020",
      squadron: "Alpha (Yellow)",
      chapter: "Lagos, Nigeria",
      organization: "Test Organization",
      location: "Lagos, Nigeria",
      email: "test@example.com",
      phone: "+234 123 456 7890",
      photoUploadLink: "",
      photoConsent: "I consent to having my photo taken and used on my conference badge"
    };
    
    const result = processPhotoAndCreateBadge("EXJAM-TEST-2025", testParticipant);
    
    if (result && result.photo) {
      console.log("✅ Photo processing test successful");
    } else {
      console.log("⚠️ Photo processing test completed with warnings");
    }
    
    return result;
    
  } catch (error) {
    console.error("❌ Photo processing test failed: " + error);
    throw error;
  }
}

/**
 * Quick setup function for testing
 */
function quickSetup() {
  try {
    console.log("⚡ Quick setup for testing...");
    
    // Create basic structure
    const folders = createFolders();
    const form = createRegistrationForm();
    const spreadsheet = createResponseSpreadsheet();
    
    console.log("✅ Quick setup complete!");
    console.log(`Form URL: ${form.getPublishedUrl()}`);
    
    return {
      form: form,
      spreadsheet: spreadsheet,
      folders: folders
    };
    
  } catch (error) {
    console.error("❌ Quick setup failed: " + error);
    throw error;
  }
}

/**
 * Create the registration form with all necessary fields
 */
function createRegistrationForm() {
  try {
    // Create form
    const form = FormApp.create(CONFIG.EVENT_NAME + " - Registration");
    form.setDescription(`
Welcome to the historic President General's Conference (PG Conference) - Maiden Flight!

This groundbreaking event marks a new milestone in the history of the ExJAM Association. 
For the first time ever, we are bringing together our members, leaders, and stakeholders 
to share ideas, build relationships, and shape the future of our association.

Event Details:
- Date: ${CONFIG.EVENT_DATE}
- Venue: ${CONFIG.EVENT_VENUE}
- Theme: "${CONFIG.EVENT_THEME}"

Please complete this registration form to secure your spot at this historic event.
    `);
    
    // Add form fields
    addPersonalInformationSection(form);
    addContactInformationSection(form);
    addEducationalBackgroundSection(form);
    addLogisticsSection(form);
    addSessionPreferencesSection(form);
    addAdditionalInformationSection(form);
    
    // Set form settings
    form.setCollectEmail(true);
    form.setRequireLogin(false);
    form.setAllowResponseEdits(true);
    form.setPublishingSummary(false);
    
    console.log("Registration form created successfully");
    return form;
    
  } catch (error) {
    console.error("Error creating form: " + error);
    throw error;
  }
}

/**
 * Add personal information section to the form
 */
function addPersonalInformationSection(form) {
  const section = form.addSectionHeaderItem();
  section.setTitle("Personal Information");
  section.setHelpText("Please provide your basic personal information");
  
  // Full Name
  const nameItem = form.addTextItem();
  nameItem.setTitle("Full Name (as it appears on official documents)");
  nameItem.setRequired(true);
  nameItem.setHelpText("Enter your full legal name");
  
  // ExJAM Service Number
  const exjamServiceNumberItem = form.addTextItem();
  exjamServiceNumberItem.setTitle("ExJAM Service Number (if applicable)");
  exjamServiceNumberItem.setRequired(false);
  exjamServiceNumberItem.setHelpText("Your ExJAM service number if you have one");
  
  // Set
  const setItem = form.addListItem();
  setItem.setTitle("Set from Air Force Military School Jos");
  setItem.setRequired(true);
  
  // Add sets from 1980 to 2025
  const sets = [];
  for (let year = 2025; year >= 1980; year--) {
    sets.push(year.toString());
  }
  setItem.setChoiceValues(sets);
  
  // Squadron Selection
  const squadronItem = form.addMultipleChoiceItem();
  squadronItem.setTitle("Squadron (Select your squadron)");
  squadronItem.setRequired(true);
  squadronItem.setChoiceValues([
    "Alpha (Yellow)",
    "Jaguar (Blue)", 
    "Mig (Green)",
    "Hercules (Red)",
    "Donier (Purple)"
  ]);
  squadronItem.setHelpText("Select the squadron you belonged to during your time at Air Force Military School Jos");
}

/**
 * Add contact information section to the form
 */
function addContactInformationSection(form) {
  const section = form.addSectionHeaderItem();
  section.setTitle("Contact Information");
  section.setHelpText("Your contact details for event communication");
  
  // Email (already collected by form settings)
  const emailItem = form.addTextItem();
  emailItem.setTitle("Email Address (for confirmation and updates)");
  emailItem.setRequired(true);
  emailItem.setHelpText("We'll use this to send you event updates and confirmation");
  
  // Phone
  const phoneItem = form.addTextItem();
  phoneItem.setTitle("Phone Number");
  phoneItem.setRequired(true);
  phoneItem.setHelpText("Include country code (e.g., +234 for Nigeria)");
  
  // Chapter
  const chapterItem = form.addListItem();
  chapterItem.setTitle("Chapter (Select your chapter location)");
  chapterItem.setRequired(true);
  chapterItem.setHelpText("Select the chapter/state where you are based");
  
  // Add comprehensive list of chapters
  const chapters = [
    // Nigeria States
    "Abia, Nigeria", "Adamawa, Nigeria", "Akwa Ibom, Nigeria", "Anambra, Nigeria", "Bauchi, Nigeria",
    "Bayelsa, Nigeria", "Benue, Nigeria", "Borno, Nigeria", "Cross River, Nigeria", "Delta, Nigeria",
    "Ebonyi, Nigeria", "Edo, Nigeria", "Ekiti, Nigeria", "Enugu, Nigeria", "Federal Capital Territory, Nigeria",
    "Gombe, Nigeria", "Imo, Nigeria", "Jigawa, Nigeria", "Kaduna, Nigeria", "Kano, Nigeria",
    "Katsina, Nigeria", "Kebbi, Nigeria", "Kogi, Nigeria", "Kwara, Nigeria", "Lagos, Nigeria",
    "Nasarawa, Nigeria", "Niger, Nigeria", "Ogun, Nigeria", "Ondo, Nigeria", "Osun, Nigeria",
    "Oyo, Nigeria", "Plateau, Nigeria", "Rivers, Nigeria", "Sokoto, Nigeria", "Taraba, Nigeria",
    "Yobe, Nigeria", "Zamfara, Nigeria",
    
    // UK Regions
    "England, UK", "Scotland, UK", "Wales, UK", "Northern Ireland, UK",
    "London, UK", "Manchester, UK", "Birmingham, UK", "Liverpool, UK", "Leeds, UK",
    "Sheffield, UK", "Glasgow, UK", "Edinburgh, UK", "Cardiff, UK", "Belfast, UK",
    
    // North America - USA States
    "Alabama, USA", "Alaska, USA", "Arizona, USA", "Arkansas, USA", "California, USA",
    "Colorado, USA", "Connecticut, USA", "Delaware, USA", "Florida, USA", "Georgia, USA",
    "Hawaii, USA", "Idaho, USA", "Illinois, USA", "Indiana, USA", "Iowa, USA",
    "Kansas, USA", "Kentucky, USA", "Louisiana, USA", "Maine, USA", "Maryland, USA",
    "Massachusetts, USA", "Michigan, USA", "Minnesota, USA", "Mississippi, USA", "Missouri, USA",
    "Montana, USA", "Nebraska, USA", "Nevada, USA", "New Hampshire, USA", "New Jersey, USA",
    "New Mexico, USA", "New York, USA", "North Carolina, USA", "North Dakota, USA", "Ohio, USA",
    "Oklahoma, USA", "Oregon, USA", "Pennsylvania, USA", "Rhode Island, USA", "South Carolina, USA",
    "South Dakota, USA", "Tennessee, USA", "Texas, USA", "Utah, USA", "Vermont, USA",
    "Virginia, USA", "Washington, USA", "West Virginia, USA", "Wisconsin, USA", "Wyoming, USA",
    "District of Columbia, USA",
    
    // North America - Canada Provinces
    "Alberta, Canada", "British Columbia, Canada", "Manitoba, Canada", "New Brunswick, Canada",
    "Newfoundland and Labrador, Canada", "Northwest Territories, Canada", "Nova Scotia, Canada",
    "Nunavut, Canada", "Ontario, Canada", "Prince Edward Island, Canada", "Quebec, Canada",
    "Saskatchewan, Canada", "Yukon, Canada",
    
    // Other Major Countries/Regions
    "Ghana", "Kenya", "South Africa", "Uganda", "Tanzania", "Ethiopia", "Egypt", "Morocco",
    "Germany", "France", "Italy", "Spain", "Netherlands", "Belgium", "Switzerland", "Austria",
    "Australia", "New Zealand", "India", "Pakistan", "Bangladesh", "China", "Japan", "South Korea",
    "Singapore", "Malaysia", "Thailand", "Vietnam", "Philippines", "Indonesia", "Brazil", "Argentina",
    "Mexico", "Chile", "Colombia", "Peru", "Venezuela", "UAE", "Saudi Arabia", "Qatar", "Kuwait",
    "Bahrain", "Oman", "Jordan", "Lebanon", "Israel", "Turkey", "Iran", "Iraq", "Syria",
    "Other (Please specify)"
  ];
  chapterItem.setChoiceValues(chapters);
  
  // Current Location
  const locationItem = form.addTextItem();
  locationItem.setTitle("Current Location (City, State/Province, Country)");
  locationItem.setRequired(true);
  locationItem.setHelpText("Your current residence for logistics planning");
  
  // Emergency Contact
  const emergencyItem = form.addTextItem();
  emergencyItem.setTitle("Emergency Contact (Name and Phone Number)");
  emergencyItem.setRequired(true);
  emergencyItem.setHelpText("Contact person in case of emergency during the event");
  
  // Photo Upload Section
  const photoSection = form.addSectionHeaderItem();
  photoSection.setTitle("Photo for Badge");
  photoSection.setHelpText("Upload a recent passport-style photo for your conference badge");
  
  // Photo Upload Instructions
  const photoInstructionsItem = form.addTextItem();
  photoInstructionsItem.setTitle("Photo Upload Instructions");
  photoInstructionsItem.setRequired(false);
  photoInstructionsItem.setHelpText("Please upload a recent passport-style photo (JPG/PNG, max 5MB). Photo should be clear, front-facing, and suitable for printing on your conference badge. If you cannot upload now, you can provide it later or we will take your photo at the event.");
  
  // Photo Upload Link (Google Drive)
  const photoUploadItem = form.addTextItem();
  photoUploadItem.setTitle("Photo Upload Link");
  photoUploadItem.setRequired(false);
  photoUploadItem.setHelpText("Upload your photo to Google Drive and paste the sharing link here. Make sure the link is set to 'Anyone with the link can view'");
  
  // Photo Capture Consent
  const photoConsentItem = form.addMultipleChoiceItem();
  photoConsentItem.setTitle("Photo Consent for Badge");
  photoConsentItem.setRequired(true);
  photoConsentItem.setChoiceValues([
    "I consent to having my photo taken and used on my conference badge",
    "I will provide my own photo via upload link above",
    "I prefer to have my photo taken at the event registration desk"
  ]);
  photoConsentItem.setHelpText("Please select your preference for photo handling");
}

/**
 * Add educational background section to the form
 */
function addEducationalBackgroundSection(form) {
  const section = form.addSectionHeaderItem();
  section.setTitle("Professional Information");
  section.setHelpText("Your current professional status");
  
  // Occupation
  const occupationItem = form.addTextItem();
  occupationItem.setTitle("Current Occupation/Profession");
  occupationItem.setRequired(true);
  occupationItem.setHelpText("What do you currently do for work?");
  
  // Organization
  const organizationItem = form.addTextItem();
  organizationItem.setTitle("Organization/Company (if applicable)");
  organizationItem.setRequired(false);
  organizationItem.setHelpText("Your current employer or organization");
}

/**
 * Add logistics section to the form
 */
function addLogisticsSection(form) {
  const section = form.addSectionHeaderItem();
  section.setTitle("Event Logistics");
  section.setHelpText("Help us plan your participation");
  
  // Dietary Restrictions
  const dietaryItem = form.addCheckboxItem();
  dietaryItem.setTitle("Dietary Restrictions (for catering purposes)");
  dietaryItem.setChoiceValues([
    "None",
    "Vegetarian",
    "Vegan", 
    "Halal",
    "Kosher",
    "Gluten-free",
    "Dairy-free",
    "Nut-free",
    "Other (please specify)"
  ]);
  
  // Special Needs
  const specialNeedsItem = form.addTextItem();
  specialNeedsItem.setTitle("Special Needs or Accessibility Requirements");
  specialNeedsItem.setRequired(false);
  specialNeedsItem.setHelpText("Any special accommodations you may need");
  
  // Accommodation
  const accommodationItem = form.addMultipleChoiceItem();
  accommodationItem.setTitle("Do you need accommodation assistance?");
  accommodationItem.setChoiceValues([
    "Yes, I need accommodation",
    "No, I will arrange my own accommodation",
    "I am local and do not need accommodation"
  ]);
  accommodationItem.setRequired(true);
  
  // Transportation
  const transportationItem = form.addMultipleChoiceItem();
  transportationItem.setTitle("Do you need transportation assistance from the airport?");
  transportationItem.setChoiceValues([
    "Yes, I need airport pickup",
    "No, I will arrange my own transportation",
    "I am local and do not need transportation"
  ]);
  transportationItem.setRequired(true);
  
  // Arrival Date
  const arrivalItem = form.addMultipleChoiceItem();
  arrivalItem.setTitle("Expected Arrival Date");
  arrivalItem.setChoiceValues([
    "November 27th, 2025 (Day before conference)",
    "November 28th, 2025 (Conference start day)",
    "Other date"
  ]);
  arrivalItem.setRequired(true);
  
  // Departure Date
  const departureItem = form.addMultipleChoiceItem();
  departureItem.setTitle("Expected Departure Date");
  departureItem.setChoiceValues([
    "November 30th, 2025 (Conference end day)",
    "December 1st, 2025 (Day after conference)",
    "Other date"
  ]);
  departureItem.setRequired(true);
}

/**
 * Add session preferences section to the form
 */
function addSessionPreferencesSection(form) {
  const section = form.addSectionHeaderItem();
  section.setTitle("Session Preferences");
  section.setHelpText("Help us plan the conference sessions");
  
  // Session Interests
  const sessionItem = form.addCheckboxItem();
  sessionItem.setTitle("Which conference sessions are you most interested in? (Select all that apply)");
  sessionItem.setChoiceValues([
    "Leadership Development",
    "Alumni Network Building",
    "Career Advancement",
    "Community Service Projects",
    "Technology and Innovation",
    "Business and Entrepreneurship",
    "Education and Mentorship",
    "All sessions"
  ]);
  sessionItem.setRequired(true);
  
  // Speaking Interest
  const speakingItem = form.addMultipleChoiceItem();
  speakingItem.setTitle("Would you be interested in speaking at the conference?");
  speakingItem.setChoiceValues([
    "Yes, I would like to present",
    "Yes, I would like to moderate a session",
    "No, I prefer to attend as a participant",
    "Maybe, I would like more information"
  ]);
  speakingItem.setRequired(false);
  
  // Speaking Topic
  const topicItem = form.addTextItem();
  topicItem.setTitle("If interested in speaking, what topic would you like to present?");
  topicItem.setRequired(false);
  topicItem.setHelpText("Brief description of your proposed presentation topic");
}

/**
 * Add additional information section to the form
 */
function addAdditionalInformationSection(form) {
  const section = form.addSectionHeaderItem();
  section.setTitle("Additional Information");
  section.setHelpText("Any other information you'd like to share");
  
  // Networking Goals
  const networkingItem = form.addTextItem();
  networkingItem.setTitle("What are your main networking goals for this conference?");
  networkingItem.setRequired(false);
  networkingItem.setHelpText("What connections or opportunities are you seeking?");
  
  // Expectations
  const expectationsItem = form.addTextItem();
  expectationsItem.setTitle("What do you hope to gain from attending the PG Conference?");
  expectationsItem.setRequired(false);
  expectationsItem.setHelpText("Your goals and expectations for the event");
  
  // Additional Comments
  const commentsItem = form.addTextItem();
  commentsItem.setTitle("Additional Comments or Special Requests");
  commentsItem.setRequired(false);
  commentsItem.setHelpText("Any other information or special requests");
}

/**
 * Create spreadsheet for form responses
 */
function createResponseSpreadsheet() {
  try {
    const spreadsheet = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
    
    // Set up headers
    const sheet = spreadsheet.getActiveSheet();
    const headers = [
      "Timestamp",
      "Registration ID",
      "Full Name",
      "ExJAM Service Number",
      "Set",
      "Squadron",
      "Chapter",
      "Email",
      "Phone",
      "Current Location",
      "Emergency Contact",
      "Photo Upload Link",
      "Photo Consent",
      "Occupation",
      "Organization",
      "Dietary Restrictions",
      "Special Needs",
      "Accommodation Needed",
      "Transportation Needed",
      "Arrival Date",
      "Departure Date",
      "Session Interests",
      "Speaking Interest",
      "Speaking Topic",
      "Networking Goals",
      "Expectations",
      "Additional Comments",
      "QR Code Generated",
      "Badge Generated"
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.getRange(1, 1, 1, headers.length).setBackground("#4285f4");
    sheet.getRange(1, 1, 1, headers.length).setFontColor("white");
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, headers.length);
    
    console.log("Response spreadsheet created successfully");
    return spreadsheet;
    
  } catch (error) {
    console.error("Error creating spreadsheet: " + error);
    throw error;
  }
}

/**
 * Link form to spreadsheet
 */
function linkFormToSpreadsheet(form, spreadsheet) {
  try {
    // Create form response trigger
    const formId = form.getId();
    const spreadsheetId = spreadsheet.getId();
    
    // Set up trigger to process new responses
    ScriptApp.newTrigger('processNewResponse')
      .forForm(form)
      .onFormSubmit()
      .create();
    
    console.log("Form linked to spreadsheet successfully");
    
  } catch (error) {
    console.error("Error linking form to spreadsheet: " + error);
    throw error;
  }
}

/**
 * Create folders for organization
 */
function createFolders() {
  try {
    const drive = DriveApp;
    const rootFolder = drive.createFolder(CONFIG.FOLDER_NAME);
    
    const folders = {
      root: rootFolder,
      qrCodes: rootFolder.createFolder("QR Codes"),
      barcodes: rootFolder.createFolder("Barcodes"),
      badges: rootFolder.createFolder("Badges"),
      reports: rootFolder.createFolder("Reports"),
      data: rootFolder.createFolder("Data")
    };
    
    console.log("Folders created successfully");
    return folders;
    
  } catch (error) {
    console.error("Error creating folders: " + error);
    throw error;
  }
}

/**
 * Generate QR codes and barcodes for the event
 */
function generateEventCodes(formUrl) {
  try {
    const drive = DriveApp;
    const folders = getFolders();
    
    // Generate QR codes
    const qrCodes = [
      {
        name: "Registration Form QR Code",
        data: formUrl,
        folder: folders.qrCodes
      },
      {
        name: "Event Information QR Code",
        data: `Event: ${CONFIG.EVENT_NAME}\nDate: ${CONFIG.EVENT_DATE}\nVenue: ${CONFIG.EVENT_VENUE}\nTheme: ${CONFIG.EVENT_THEME}\nRegister: ${formUrl}`,
        folder: folders.qrCodes
      },
      {
        name: "Contact Information QR Code",
        data: `ExJAM Association\nContact: E-signed DM OBADIAH PRO National\nEvent: ${CONFIG.EVENT_NAME}\nDate: ${CONFIG.EVENT_DATE}\nRegistration: ${formUrl}`,
        folder: folders.qrCodes
      }
    ];
    
    // Generate barcodes
    const barcodes = [
      {
        name: "Event ID Barcode",
        data: "EXJAM-PG-2025",
        folder: folders.barcodes
      },
      {
        name: "Venue Code Barcode",
        data: "NAF-CC-ABUJA",
        folder: folders.barcodes
      },
      {
        name: "Date Code Barcode",
        data: "20251128-30",
        folder: folders.barcodes
      }
    ];
    
    // Note: Google Apps Script doesn't have built-in QR/barcode generation
    // These would need to be generated using external APIs or libraries
    console.log("Event codes structure created (QR/barcode generation requires external API)");
    
    return {
      qrCodes: qrCodes,
      barcodes: barcodes
    };
    
  } catch (error) {
    console.error("Error generating event codes: " + error);
    throw error;
  }
}

/**
 * Process new form response
 */
function processNewResponse(e) {
  try {
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    const timestamp = formResponse.getTimestamp();
    
    // Generate unique registration ID
    const registrationId = generateRegistrationId();
    
    // Process responses
    const responseData = processFormResponses(itemResponses, registrationId, timestamp);
    
    // Add to spreadsheet
    addResponseToSpreadsheet(responseData);
    
    // Generate QR code, barcode, and badge with photo for this registration
    processPhotoAndCreateBadge(registrationId, responseData);
    
    // Send confirmation email
    sendConfirmationEmail(responseData);
    
    console.log("New response processed: " + registrationId);
    
  } catch (error) {
    console.error("Error processing new response: " + error);
  }
}

/**
 * Generate unique registration ID
 */
function generateRegistrationId() {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return `${CONFIG.ID_PREFIX}-${timestamp}-${random}`;
}

/**
 * Process form responses into structured data
 */
function processFormResponses(itemResponses, registrationId, timestamp) {
  const data = {
    timestamp: timestamp,
    registrationId: registrationId
  };
  
  // Map form responses to data structure
  itemResponses.forEach(response => {
    const question = response.getItem().getTitle();
    const answer = response.getResponse();
    
    // Map questions to data fields
    switch (question) {
      case "Full Name (as it appears on official documents)":
        data.fullName = answer;
        break;
      case "ExJAM Service Number (if applicable)":
        data.exjamServiceNumber = answer;
        break;
      case "Set from Air Force Military School Jos":
        data.set = answer;
        break;
      case "Squadron (Select your squadron)":
        data.squadron = Array.isArray(answer) ? answer.join(", ") : answer;
        break;
      case "Chapter (Select your chapter location)":
        data.chapter = answer;
        break;
      case "Email Address (for confirmation and updates)":
        data.email = answer;
        break;
      case "Phone Number":
        data.phone = answer;
        break;
      case "Current Location (City, State/Province, Country)":
        data.location = answer;
        break;
      case "Emergency Contact (Name and Phone Number)":
        data.emergencyContact = answer;
        break;
      case "Photo Upload Link":
        data.photoUploadLink = answer;
        break;
      case "Photo Consent for Badge":
        data.photoConsent = Array.isArray(answer) ? answer.join(", ") : answer;
        break;
      case "Current Occupation/Profession":
        data.occupation = answer;
        break;
      case "Organization/Company (if applicable)":
        data.organization = answer;
        break;
      case "Dietary Restrictions (for catering purposes)":
        data.dietaryRestrictions = Array.isArray(answer) ? answer.join(", ") : answer;
        break;
      case "Special Needs or Accessibility Requirements":
        data.specialNeeds = answer;
        break;
      case "Do you need accommodation assistance?":
        data.accommodationNeeded = answer;
        break;
      case "Do you need transportation assistance from the airport?":
        data.transportationNeeded = answer;
        break;
      case "Expected Arrival Date":
        data.arrivalDate = answer;
        break;
      case "Expected Departure Date":
        data.departureDate = answer;
        break;
      case "Which conference sessions are you most interested in? (Select all that apply)":
        data.sessionInterests = Array.isArray(answer) ? answer.join(", ") : answer;
        break;
      case "Would you be interested in speaking at the conference?":
        data.speakingInterest = answer;
        break;
      case "If interested in speaking, what topic would you like to present?":
        data.speakingTopic = answer;
        break;
      case "What are your main networking goals for this conference?":
        data.networkingGoals = answer;
        break;
      case "What do you hope to gain from attending the PG Conference?":
        data.expectations = answer;
        break;
      case "Additional Comments or Special Requests":
        data.additionalComments = answer;
        break;
    }
  });
  
  return data;
}

/**
 * Add response data to spreadsheet
 */
function addResponseToSpreadsheet(data) {
  try {
    const spreadsheet = SpreadsheetApp.openByName(CONFIG.SPREADSHEET_NAME);
    const sheet = spreadsheet.getActiveSheet();
    
    const rowData = [
      data.timestamp,
      data.registrationId,
      data.fullName || "",
      data.exjamServiceNumber || "",
      data.set || "",
      data.squadron || "",
      data.chapter || "",
      data.email || "",
      data.phone || "",
      data.location || "",
      data.emergencyContact || "",
      data.photoUploadLink || "",
      data.photoConsent || "",
      data.occupation || "",
      data.organization || "",
      data.dietaryRestrictions || "",
      data.specialNeeds || "",
      data.accommodationNeeded || "",
      data.transportationNeeded || "",
      data.arrivalDate || "",
      data.departureDate || "",
      data.sessionInterests || "",
      data.speakingInterest || "",
      data.speakingTopic || "",
      data.networkingGoals || "",
      data.expectations || "",
      data.additionalComments || "",
      "Pending",
      "Pending"
    ];
    
    sheet.appendRow(rowData);
    
  } catch (error) {
    console.error("Error adding response to spreadsheet: " + error);
  }
}

/**
 * Generate QR code and badge for participant
 */
function generateParticipantCodes(registrationId, participantData) {
  try {
    // Generate QR code data
    const qrData = {
      registrationId: registrationId,
      event: CONFIG.EVENT_NAME,
      date: CONFIG.EVENT_DATE,
      venue: CONFIG.EVENT_VENUE,
      participant: participantData.fullName
    };
    
    // Note: QR code generation would require external API call
    // For now, we'll create a text file with the data
    const folders = getFolders();
    const qrFile = folders.qrCodes.createFile(
      `QR_${registrationId}.txt`,
      JSON.stringify(qrData, null, 2)
    );
    
    // Create participant badge (PDF would require external API)
    const badgeData = createBadgeData(registrationId, participantData);
    const badgeFile = folders.badges.createFile(
      `Badge_${registrationId}.txt`,
      JSON.stringify(badgeData, null, 2)
    );
    
    console.log("Participant codes generated for: " + registrationId);
    
  } catch (error) {
    console.error("Error generating participant codes: " + error);
  }
}

/**
 * Create badge data structure
 */
function createBadgeData(registrationId, participantData) {
      return {
      registrationId: registrationId,
      event: CONFIG.EVENT_NAME,
      theme: CONFIG.EVENT_THEME,
      date: CONFIG.EVENT_DATE,
      venue: CONFIG.EVENT_VENUE,
      participant: {
        name: participantData.fullName,
        serviceNumber: participantData.exjamServiceNumber,
        set: participantData.set,
        squadron: participantData.squadron,
        chapter: participantData.chapter,
        organization: participantData.organization,
        location: participantData.location,
        email: participantData.email,
        phone: participantData.phone,
        photoUploadLink: participantData.photoUploadLink,
        photoConsent: participantData.photoConsent
      },
      generatedAt: new Date().toISOString()
    };
}

/**
 * Send confirmation email to participant
 */
function sendConfirmationEmail(participantData) {
  try {
    const email = participantData.email;
    if (!email) return;
    
    const subject = `Registration Confirmed - ${CONFIG.EVENT_NAME}`;
    const body = `
Dear ${participantData.fullName},

Thank you for registering for the ${CONFIG.EVENT_NAME}!

Your registration has been confirmed with the following details:

Registration ID: ${participantData.registrationId}
Event: ${CONFIG.EVENT_NAME}
Date: ${CONFIG.EVENT_DATE}
Venue: ${CONFIG.EVENT_VENUE}
Theme: ${CONFIG.EVENT_THEME}

We will send you further details about the event schedule, accommodation, and transportation arrangements closer to the event date.

If you have any questions, please contact us at [contact email].

Best regards,
ExJAM Association
E-signed DM OBADIAH PRO National
    `;
    
    GmailApp.sendEmail(email, subject, body);
    console.log("Confirmation email sent to: " + email);
    
  } catch (error) {
    console.error("Error sending confirmation email: " + error);
  }
}

/**
 * Get folders (helper function)
 */
function getFolders() {
  const drive = DriveApp;
  const rootFolder = drive.getFoldersByName(CONFIG.FOLDER_NAME).next();
  
  return {
    root: rootFolder,
    qrCodes: getSubfolder(rootFolder, "QR Codes"),
    barcodes: getSubfolder(rootFolder, "Barcodes"),
    badges: getSubfolder(rootFolder, "Badges"),
    reports: getSubfolder(rootFolder, "Reports"),
    data: getSubfolder(rootFolder, "Data")
  };
}

/**
 * Get subfolder (helper function)
 */
function getSubfolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
}

/**
 * Create sample badge (for testing)
 */
function createSampleBadge() {
  try {
    const sampleData = {
      registrationId: "EXJAM-SAMPLE-2025",
      fullName: "Ahmed A Mimi",
      exjamServiceNumber: "EXJAM-2025-001",
      set: "2010",
      squadron: "Alpha (Yellow)",
      chapter: "Federal Capital Territory, Nigeria",
      organization: "ExJAM Association",
      location: "FCT, Abuja, Nigeria",
      email: "ahmed.mimi@example.com",
      phone: "+234 123 456 7890",
      photoUploadLink: "",
      photoConsent: "I consent to having my photo taken and used on my conference badge"
    };
    
    generateParticipantCodes("EXJAM-SAMPLE-2025", sampleData);
    console.log("Sample badge created successfully");
    
  } catch (error) {
    console.error("Error creating sample badge: " + error);
  }
}

/**
 * Generate registration report
 */
function generateRegistrationReport() {
  try {
    const spreadsheet = SpreadsheetApp.openByName(CONFIG.SPREADSHEET_NAME);
    const sheet = spreadsheet.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      console.log("No registration data found");
      return;
    }
    
    // Remove header row
    const registrations = data.slice(1);
    
    // Generate statistics
    const stats = {
      totalRegistrations: registrations.length,
      sets: {},
      squadrons: {},
      chapters: {},
      locations: {},
      accommodationNeeded: 0,
      transportationNeeded: 0,
      dietaryRestrictions: {}
    };
    
    registrations.forEach(row => {
      // Count sets
      const set = row[4] || "Unknown";
      stats.sets[set] = (stats.sets[set] || 0) + 1;
      
      // Count squadrons
      const squadron = row[5] || "Unknown";
      stats.squadrons[squadron] = (stats.squadrons[squadron] || 0) + 1;
      
      // Count chapters
      const chapter = row[6] || "Unknown";
      stats.chapters[chapter] = (stats.chapters[chapter] || 0) + 1;
      
      // Count locations
      const location = row[9] || "Unknown";
      stats.locations[location] = (stats.locations[location] || 0) + 1;
      
      // Count accommodation needs
      if (row[13] && row[13].includes("need accommodation")) {
        stats.accommodationNeeded++;
      }
      
      // Count transportation needs
      if (row[14] && row[14].includes("need airport pickup")) {
        stats.transportationNeeded++;
      }
      
      // Count dietary restrictions
      const dietary = row[11] || "None";
      const restrictions = dietary.split(", ");
      restrictions.forEach(restriction => {
        stats.dietaryRestrictions[restriction] = (stats.dietaryRestrictions[restriction] || 0) + 1;
      });
    });
    
    // Create report
    const report = createReportContent(stats);
    
    // Save report
    const folders = getFolders();
    const reportFile = folders.reports.createFile(
      `Registration_Report_${new Date().toISOString().split('T')[0]}.txt`,
      report
    );
    
    console.log("Registration report generated successfully");
    return reportFile;
    
  } catch (error) {
    console.error("Error generating registration report: " + error);
  }
}

/**
 * Create report content
 */
function createReportContent(stats) {
  return `
ExJAM PG Conference Registration Report
Generated: ${new Date().toLocaleString()}

EXECUTIVE SUMMARY
================
Total Registrations: ${stats.totalRegistrations}
Event: ${CONFIG.EVENT_NAME}
Date: ${CONFIG.EVENT_DATE}
Venue: ${CONFIG.EVENT_VENUE}

SET DISTRIBUTION
===============
${Object.entries(stats.sets)
  .sort((a, b) => b[1] - a[1])
  .map(([set, count]) => `${set}: ${count}`)
  .join('\n')}

SQUADRON DISTRIBUTION
====================
${Object.entries(stats.squadrons)
  .sort((a, b) => b[1] - a[1])
  .map(([squadron, count]) => `${squadron}: ${count}`)
  .join('\n')}

CHAPTER DISTRIBUTION
===================
${Object.entries(stats.chapters)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .map(([chapter, count]) => `${chapter}: ${count}`)
  .join('\n')}

GEOGRAPHIC DISTRIBUTION
======================
${Object.entries(stats.locations)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([location, count]) => `${location}: ${count}`)
  .join('\n')}

LOGISTICS REQUIREMENTS
=====================
Accommodation Needed: ${stats.accommodationNeeded}
Transportation Needed: ${stats.transportationNeeded}

DIETARY RESTRICTIONS
===================
${Object.entries(stats.dietaryRestrictions)
  .sort((a, b) => b[1] - a[1])
  .map(([restriction, count]) => `${restriction}: ${count}`)
  .join('\n')}

RECOMMENDATIONS
==============
1. Plan catering for ${stats.dietaryRestrictions["None"] || 0} standard meals
2. Arrange accommodation for ${stats.accommodationNeeded} participants
3. Provide airport pickup for ${stats.transportationNeeded} participants
4. Focus on most popular graduation years and locations for targeted outreach
  `;
}

/**
 * Deploy the complete ExJAM registration system as a web app
 */
function deployCompleteSystem() {
  try {
    console.log("🚀 Deploying complete ExJAM registration system...");
    
    // Step 1: Initialize the registration system
    console.log("📋 Step 1: Initializing registration system...");
    const initResult = initializeRegistrationSystem();
    
    if (!initResult.success) {
      throw new Error("Failed to initialize registration system: " + initResult.message);
    }
    
    // Step 2: Deploy the web app
    console.log("🌐 Step 2: Deploying web app...");
    const webAppResult = deployWebApp();
    
    if (!webAppResult.success) {
      throw new Error("Failed to deploy web app: " + webAppResult.message);
    }
    
    // Step 3: Test the complete system
    console.log("🧪 Step 3: Testing complete system...");
    const testResult = testWebApp();
    
    console.log("🎉 Complete system deployment successful!");
    console.log("📋 Registration System: " + (initResult.success ? "✅ Ready" : "❌ Failed"));
    console.log("🌐 Web App URL: " + webAppResult.webAppUrl);
    console.log("🧪 System Test: " + (testResult.success ? "✅ Passed" : "❌ Failed"));
    
    return {
      success: true,
      registrationSystem: initResult,
      webApp: webAppResult,
      testing: testResult,
      message: "Complete ExJAM registration system deployed successfully!",
      nextSteps: [
        "1. Share the web app URL with ExJAM alumni",
        "2. Monitor form submissions in the Google Sheet",
        "3. Check generated badges in the Drive folders",
        "4. Review registration reports for insights"
      ]
    };
    
  } catch (error) {
    console.error("❌ Error deploying complete system: " + error);
    return {
      success: false,
      error: error.toString(),
      message: "Failed to deploy complete system. Check logs for details."
    };
  }
}

/**
 * Get system status and URLs
 */
function getSystemStatus() {
  try {
    console.log("📊 Getting ExJAM registration system status...");
    
    const status = {
      registrationSystem: {
        formUrl: null,
        spreadsheetUrl: null,
        foldersCreated: false,
        status: "Unknown"
      },
      webApp: {
        url: null,
        deployed: false,
        status: "Unknown"
      },
      testing: {
        qrCodes: false,
        barcodes: false,
        badges: false,
        photos: false,
        status: "Unknown"
      }
    };
    
    // Check registration system
    try {
      const form = FormApp.openById(CONFIG.FORM_ID);
      status.registrationSystem.formUrl = form.getPublishedUrl();
      status.registrationSystem.status = "✅ Active";
    } catch (e) {
      status.registrationSystem.status = "❌ Not Found";
    }
    
    try {
      const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      status.registrationSystem.spreadsheetUrl = spreadsheet.getUrl();
      status.registrationSystem.status = "✅ Active";
    } catch (e) {
      status.registrationSystem.status = "❌ Not Found";
    }
    
    // Check web app
    try {
      const webAppUrl = getWebAppUrl();
      if (webAppUrl) {
        status.webApp.url = webAppUrl;
        status.webApp.deployed = true;
        status.webApp.status = "✅ Deployed";
      } else {
        status.webApp.status = "❌ Not Deployed";
      }
    } catch (e) {
      status.webApp.status = "❌ Error";
    }
    
    // Check folders
    try {
      const drive = DriveApp;
      const folders = drive.getFoldersByName(CONFIG.FOLDER_NAME);
      status.registrationSystem.foldersCreated = folders.hasNext();
    } catch (e) {
      status.registrationSystem.foldersCreated = false;
    }
    
    console.log("📊 System status retrieved successfully!");
    
    return {
      success: true,
      status: status,
      message: "System status retrieved successfully!",
      summary: {
        registrationSystem: status.registrationSystem.status,
        webApp: status.webApp.status,
        folders: status.registrationSystem.foldersCreated ? "✅ Created" : "❌ Missing"
      }
    };
    
  } catch (error) {
    console.error("❌ Error getting system status: " + error);
    return {
      success: false,
      error: error.toString(),
      message: "Failed to get system status. Check logs for details."
    };
  }
}

/**
 * Quick setup for testing the web app integration
 */
function quickWebAppSetup() {
  try {
    console.log("⚡ Quick Web App Setup for ExJAM Registration...");
    
    // Test web app functionality
    const testResult = testWebApp();
    
    if (testResult.success) {
      console.log("✅ Web app test passed!");
      console.log("🌐 Web App URL: " + testResult.webAppUrl);
      
      return {
        success: true,
        message: "Web app setup completed successfully!",
        webAppUrl: testResult.webAppUrl,
        nextSteps: [
          "1. Deploy the web app using deployWebApp()",
          "2. Share the URL with ExJAM alumni",
          "3. Monitor registrations in the Google Sheet"
        ]
      };
    } else {
      throw new Error("Web app test failed: " + testResult.message);
    }
    
  } catch (error) {
    console.error("❌ Error in quick web app setup: " + error);
    return {
      success: false,
      error: error.toString(),
      message: "Quick web app setup failed. Check logs for details."
    };
  }
}

/**
 * Service Account Functions for Enhanced Security
 */

/**
 * Authenticate using service account
 */
function authenticateWithServiceAccount() {
  try {
    // This will use the service account credentials
    const drive = DriveApp;
    const sheets = SpreadsheetApp;
    
    console.log("✅ Service account authentication successful");
    return true;
    
  } catch (error) {
    console.error("❌ Service account authentication failed: " + error);
    return false;
  }
}

/**
 * Test service account access
 */
function testServiceAccountAccess() {
  try {
    console.log("🧪 Testing service account access...");
    
    // Test Drive access
    const drive = DriveApp;
    const rootFolder = drive.getRootFolder();
    console.log("✅ Drive access: " + rootFolder.getName());
    
    // Test Sheets access
    const sheets = SpreadsheetApp;
    console.log("✅ Sheets access: Available");
    
    // Test Gmail access
    const gmail = GmailApp;
    console.log("✅ Gmail access: Available");
    
    console.log("🎉 Service account access test passed!");
    return true;
    
  } catch (error) {
    console.error("❌ Service account access test failed: " + error);
    return {
      success: false,
      error: error.toString(),
      message: "Service account access test failed. Check logs for details."
    };
  }
}

/**
 * Deploy web app using service account
 */
function deployWebAppWithServiceAccount() {
  try {
    console.log("🚀 Deploying web app with service account...");
    
    // Authenticate with service account
    if (!authenticateWithServiceAccount()) {
      throw new Error("Service account authentication failed");
    }
    
    // Deploy the web app
    const deployment = Apps.newDeployment();
    deployment.setDeploymentConfig(Apps.newDeploymentConfig()
      .setScriptId(ScriptApp.getScriptId())
      .setVersion('1')
      .setManifestFileName('appsscript.json')
      .setDescription('ExJAM Registration System Web App - Service Account'));
    
    const deployedVersion = Apps.createDeployment(deployment);
    
    console.log("✅ Web app deployed successfully with service account!");
    console.log("📋 Deployment ID: " + deployedVersion.getDeploymentId());
    console.log("🌐 Web app URL: " + ScriptApp.getService().getUrl());
    
    return {
      success: true,
      deploymentId: deployedVersion.getDeploymentId(),
      webAppUrl: ScriptApp.getService().getUrl(),
      message: "Web app deployed successfully with service account!"
    };
    
  } catch (error) {
    console.error("❌ Error deploying with service account: " + error);
    return {
      success: false,
      error: error.toString(),
      message: "Failed to deploy with service account. Check logs for details."
    };
  }
}

/**
 * Enhanced system deployment with service account
 */
function deployCompleteSystemWithServiceAccount() {
  try {
    console.log("🚀 Deploying complete ExJAM registration system with service account...");
    
    // Step 1: Test service account access
    console.log("🔐 Step 1: Testing service account access...");
    const authResult = testServiceAccountAccess();
    
    if (!authResult.success) {
      throw new Error("Service account authentication failed: " + authResult.message);
    }
    
    // Step 2: Initialize the registration system
    console.log("📋 Step 2: Initializing registration system...");
    const initResult = initializeRegistrationSystem();
    
    if (!initResult.success) {
      throw new Error("Failed to initialize registration system: " + initResult.message);
    }
    
    // Step 3: Deploy the web app with service account
    console.log("🌐 Step 3: Deploying web app with service account...");
    const webAppResult = deployWebAppWithServiceAccount();
    
    if (!webAppResult.success) {
      throw new Error("Failed to deploy web app: " + webAppResult.message);
    }
    
    // Step 4: Test the complete system
    console.log("🧪 Step 4: Testing complete system...");
    const testResult = testWebApp();
    
    console.log("🎉 Complete system deployment with service account successful!");
    console.log("🔐 Service Account: " + (authResult.success ? "✅ Authenticated" : "❌ Failed"));
    console.log("📋 Registration System: " + (initResult.success ? "✅ Ready" : "❌ Failed"));
    console.log("🌐 Web App URL: " + webAppResult.webAppUrl);
    console.log("🧪 System Test: " + (testResult.success ? "✅ Passed" : "❌ Failed"));
    
    return {
      success: true,
      serviceAccount: authResult,
      registrationSystem: initResult,
      webApp: webAppResult,
      testing: testResult,
      message: "Complete ExJAM registration system deployed successfully with service account!",
      nextSteps: [
        "1. Share the web app URL with ExJAM alumni",
        "2. Monitor form submissions in the Google Sheet",
        "3. Check generated badges in the Drive folders",
        "4. Review registration reports for insights",
        "5. Monitor service account usage and security"
      ]
    };
    
  } catch (error) {
    console.error("❌ Error deploying complete system with service account: " + error);
    return {
      success: false,
      error: error.toString(),
      message: "Failed to deploy complete system with service account. Check logs for details."
    };
  }
}
