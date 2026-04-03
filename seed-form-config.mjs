// seed-form-config.mjs
// Run with: node seed-form-config.mjs
// Sets FIRESTORE_EMULATOR_HOST so it connects to the local emulator.

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, connectFirestoreEmulator } from "firebase/firestore";

// Use any dummy config — the emulator doesn't validate it.
const app = initializeApp({
  projectId: "cir-portal-demo",
  apiKey: "fake-key",
  authDomain: "localhost",
});

const db = getFirestore(app);

// Connect to emulator if FIRESTORE_EMULATOR_HOST is set or default to localhost:8080
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080";
const [host, port] = emulatorHost.split(":");
try {
  connectFirestoreEmulator(db, host, parseInt(port));
} catch (e) {
  // Already connected
}

const sections = [
  {
    sectionId: "A",
    sectionLabel: "Part Identification",
    isVisible: true,
    displayOrder: 1,
    fields: [
      { fieldId: "cirNumber", fieldLabel: "CIR Number", fieldType: "text", isMandatory: true, isActive: true, isRestricted: false, isSystemLocked: true, helpText: "Auto-generated (CIR-YYYY-XXXX)", displayOrder: 1 },
      { fieldId: "partDescription", fieldLabel: "Part Description", fieldType: "text", isMandatory: true, isActive: true, isRestricted: false, isSystemLocked: true, helpText: "", displayOrder: 2 },
      { fieldId: "customerName", fieldLabel: "Customer Name", fieldType: "dropdown", isMandatory: true, isActive: true, isRestricted: false, isSystemLocked: true, helpText: "Select from Master Data", displayOrder: 3 },
      { fieldId: "customerPartNo", fieldLabel: "Customer Part No. / Drawing No.", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 4 },
      { fieldId: "customerSample", fieldLabel: "Customer Sample", fieldType: "toggle", isMandatory: true, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Yes / No", displayOrder: 5 },
      { fieldId: "customerDrawing", fieldLabel: "Customer Drawing", fieldType: "toggle", isMandatory: true, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Yes / No", displayOrder: 6 },
      { fieldId: "revisionLevel", fieldLabel: "Revision Level", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "e.g. A, B, 01", displayOrder: 7 },
      { fieldId: "sampleNumber", fieldLabel: "Sample Number", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 8 },
      { fieldId: "internalPartNumber", fieldLabel: "Internal Part Number", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 9 },
      { fieldId: "partCategory", fieldLabel: "Part Family / Category", fieldType: "dropdown", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Select from Master Data", displayOrder: 10 },
      { fieldId: "partWeightNet", fieldLabel: "Part Weight — Net (kg)", fieldType: "decimal", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "kg", displayOrder: 11 },
      { fieldId: "materialSpecification", fieldLabel: "Material Specification", fieldType: "dropdown", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Select from Master Data", displayOrder: 12 },
      { fieldId: "bomReferenceNumber", fieldLabel: "BOM Reference Number", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 13 },
      { fieldId: "anyOtherReqA", fieldLabel: "Any other specific requirement", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 14 },
    ]
  },
  {
    sectionId: "B",
    sectionLabel: "Commercial Requirements",
    isVisible: true,
    displayOrder: 2,
    fields: [
      { fieldId: "moq", fieldLabel: "MOQ (Minimum Order Qty.)", fieldType: "number", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Units", displayOrder: 1 },
      { fieldId: "eau", fieldLabel: "EAU (Estimated Annual Usage)", fieldType: "number", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Units/year", displayOrder: 2 },
      { fieldId: "targetSampleDate", fieldLabel: "Target Sample Date", fieldType: "date", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 3 },
      { fieldId: "sampleQtyRequired", fieldLabel: "Sample Qty Required", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 4 },
      { fieldId: "sopDate", fieldLabel: "SOP Date (Start of Production)", fieldType: "date", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 5 },
      { fieldId: "targetPrice", fieldLabel: "Target Price / Cost Target", fieldType: "decimal", isMandatory: false, isActive: true, isRestricted: true, isSystemLocked: false, helpText: "Hidden from Engineering (INR/USD)", displayOrder: 6 },
      { fieldId: "prodLeadTime", fieldLabel: "Prod. Lead Time Requirement", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Days / Weeks", displayOrder: 7 },
      { fieldId: "paymentTerms", fieldLabel: "Payment Terms", fieldType: "dropdown", isMandatory: false, isActive: true, isRestricted: true, isSystemLocked: false, helpText: "", displayOrder: 8, options: ["Advance", "Net 30", "Net 45", "Net 60", "Net 90", "LC at Sight", "LC 30 Days", "LC 60 Days"] },
      { fieldId: "incoterms", fieldLabel: "Incoterms", fieldType: "dropdown", isMandatory: false, isActive: true, isRestricted: true, isSystemLocked: false, helpText: "", displayOrder: 9, options: ["EXW", "FOB", "CIF", "DDP", "DAP"] },
    ]
  },
  {
    sectionId: "C",
    sectionLabel: "Design & Engineering Inputs",
    isVisible: true,
    displayOrder: 3,
    fields: [
      { fieldId: "designInputs", fieldLabel: "Design Inputs", fieldType: "rich-text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 1 },
      { fieldId: "criticalCharacteristics", fieldLabel: "Critical / Safety Characteristics (SC/CC)", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 2 },
      { fieldId: "rmGrade", fieldLabel: "RM Grade", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 3 },
      { fieldId: "surfaceTreatment", fieldLabel: "Surface Treatment / Finish", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 4 },
      { fieldId: "heatTreatment", fieldLabel: "Heat Treatment Requirements", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 5 },
      { fieldId: "similarPartExisting", fieldLabel: "Similar part - existing (if any)", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 6 },
      { fieldId: "specialNotesEngineering", fieldLabel: "Special Notes for Engineering", fieldType: "textarea", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 7 },
    ]
  },
  {
    sectionId: "D",
    sectionLabel: "Quality & Compliance",
    isVisible: true,
    displayOrder: 4,
    fields: [
      { fieldId: "ppapRequirement", fieldLabel: "PPAP Requirement", fieldType: "dropdown", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 1, options: ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Not Required"] },
      { fieldId: "apqpTimingPlan", fieldLabel: "APQP Timing Plan Required", fieldType: "toggle", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Yes / No", displayOrder: 2 },
      { fieldId: "csrRequirements", fieldLabel: "Customer Specific Requirements (CSR)", fieldType: "textarea", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Text Area + File Upload", displayOrder: 3 },
      { fieldId: "eolTestingRequirements", fieldLabel: "End of Line (EOL) Testing Requirements", fieldType: "rich-text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 4 },
      { fieldId: "additionalTestingReq", fieldLabel: "Additional Testing Requirements", fieldType: "rich-text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "NVH / fatigue / dynamometer / salt spray", displayOrder: 5 },
      { fieldId: "anyOtherReqD", fieldLabel: "Any other specific requirement", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 6 },
    ]
  },
  {
    sectionId: "E",
    sectionLabel: "Tooling & Manufacturing",
    isVisible: true,
    displayOrder: 5,
    fields: [
      { fieldId: "commonSharedTooling", fieldLabel: "Common / Shared Tooling", fieldType: "toggle", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Yes / No", displayOrder: 1 },
      { fieldId: "toolingOwnership", fieldLabel: "Tooling Ownership", fieldType: "dropdown", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 2, options: ["Customer", "Emmforce"] },
      { fieldId: "toolingCost", fieldLabel: "Tooling Cost (if cust.)", fieldType: "decimal", isMandatory: false, isActive: true, isRestricted: true, isSystemLocked: false, helpText: "", displayOrder: 3 },
      { fieldId: "manufacturingSiteConstraints", fieldLabel: "Manufacturing Site Constraints", fieldType: "textarea", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 4 },
      { fieldId: "anyOtherReqE", fieldLabel: "Any other specific requirement", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 5 },
    ]
  },
  {
    sectionId: "F",
    sectionLabel: "Packaging, Marking & Traceability",
    isVisible: true,
    displayOrder: 6,
    fields: [
      { fieldId: "packingRequirements", fieldLabel: "Packing Requirements", fieldType: "rich-text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Material, inner/outer, stacking rules", displayOrder: 1 },
      { fieldId: "markingRequirements", fieldLabel: "Marking Requirements", fieldType: "rich-text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Placement, font, date code, logo, language", displayOrder: 2 },
      { fieldId: "labelingStandard", fieldLabel: "Labeling Standard", fieldType: "rich-text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Placement, font, date code, logo, language", displayOrder: 3 },
      { fieldId: "trackingCodeRequirement", fieldLabel: "Tracking Code Requirement (cust.)", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 4 },
      { fieldId: "anyOtherReqF", fieldLabel: "Any other specific requirement", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 5 },
    ]
  },
  {
    sectionId: "G",
    sectionLabel: "Attachments & Final Declaration",
    isVisible: true,
    displayOrder: 7,
    fields: [
      { fieldId: "additionalNotes", fieldLabel: "Additional Notes / Special Instructions", fieldType: "rich-text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 1 },
      { fieldId: "competitiveOemRef", fieldLabel: "Competitive / OEM Reference Part Info", fieldType: "text", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "", displayOrder: 2 },
      { fieldId: "primaryAttachments", fieldLabel: "Primary Attachments", fieldType: "file", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "PDF/DWG/DXF/STEP/IGES/SolidWorks/CATIA/Word/Excel/JPG/PNG — Max 50MB/file, Max 10 files", displayOrder: 3 },
      { fieldId: "additionalRefDocs", fieldLabel: "Additional Reference Documents", fieldType: "file", isMandatory: false, isActive: true, isRestricted: false, isSystemLocked: false, helpText: "Multi-file Upload", displayOrder: 4 },
      { fieldId: "submissionDeclaration", fieldLabel: "Submission Declaration", fieldType: "checkbox", isMandatory: true, isActive: true, isRestricted: false, isSystemLocked: true, helpText: "I confirm all information is accurate and complete", displayOrder: 5 },
    ]
  }
];

async function seed() {
  console.log("Seeding form config with all 51 fields across 7 sections...");
  for (const section of sections) {
    const ref = doc(db, "form_config", "section_" + section.sectionId);
    await setDoc(ref, section);
    console.log("  ✅ Section " + section.sectionId + ": " + section.sectionLabel + " (" + section.fields.length + " fields)");
  }
  console.log("Done! All sections seeded.");
}

seed().catch(console.error);
