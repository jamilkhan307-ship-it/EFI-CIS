export type Role = "SUPER_ADMIN" | "ADMIN" | "INITIATOR" | "CHECKER" | "APPROVER" | "ENGINEERING";

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: Role;
  department: string;
  isActive: boolean;
  lastLogin?: string;
}

export type CirStatus = 
  | "DRAFT" 
  | "SUBMITTED" 
  | "UNDER_REVIEW" 
  | "RETURNED" 
  | "CHECKED" 
  | "APPROVED" 
  | "REJECTED" 
  | "DEVELOPMENT_STARTED" 
  | "DEVELOPMENT_COMPLETED";

export interface CirRecord {
  id: string;
  cirNumber: string; // CIR-YYYY-XXXX
  status: CirStatus;
  initiatorId: string;
  initiatorName: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  
  // Support for dynamic data fields from the form builder
  formData: Record<string, any>;
  
  // Attachments are handled separately
  attachments: {
    id: string;
    url: string;
    filename: string;
    label: string; // e.g. "Customer Drawing"
  }[];
}

export type FieldType = 
  | "text" 
  | "number" 
  | "decimal" 
  | "date" 
  | "toggle" 
  | "dropdown" 
  | "multi-select" 
  | "textarea" 
  | "rich-text"
  | "file"
  | "checkbox";

export interface FormFieldConfig {
  fieldId: string; // The key used in the formData object (e.g. "partDescription")
  fieldLabel: string;
  fieldType: FieldType;
  isMandatory: boolean;
  isActive: boolean;
  isRestricted: boolean; // Hidden from Engineering
  isSystemLocked: boolean; // Cannot be deactivated/made optional (e.g., cirNumber, customerName)
  helpText: string;
  displayOrder: number;
  options?: string[]; // For dropdown/multi-select
}

export interface FormSectionConfig {
  sectionId: string; // Fixed: "A", "B", "C", "D", "E", "F", "G"
  sectionLabel: string;
  isVisible: boolean;
  displayOrder: number;
  fields: FormFieldConfig[];
}

export interface FormChangeLog {
  id: string;
  timestamp: string;
  changedBy: string; // User Name
  action: string;
  previousValue: any;
  newValue: any;
}

export type SectionAccessLevel = "full_access" | "view_only" | "no_access" | "role_default";

export interface UserSectionAccessOverrides {
  userId: string;
  userName: string;
  userRole: Role;
  overrides: Record<string, SectionAccessLevel>;
  lastUpdatedBy: string; // email or name 
  lastUpdatedAt: string; // ISO timestamp
}
