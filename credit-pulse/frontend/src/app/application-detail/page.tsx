"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Landmark,
  FileText,
  MessageSquare,
  Calculator,
  ShieldCheck,
  UserRound,
  MapPin,
  GraduationCap,
  BriefcaseBusiness,
  Send,
  Paperclip,
  CheckCircle2,
  XCircle,
  Circle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { COMMUNICATION_PROPERTIES } from "./communication-properties";

type VerificationStatus = "VERIFIED" | "NOT_VERIFIED" | "";
type UnderwriterDecisionOption = "" | "APPROVED" | "REJECTED";
type DisbursalDecisionOption = "" | "DISBURSED" | "REJECTED";

type ContactAddressDto = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type GetContactDetailsResponseDto = {
  email: string;
  mobile: string;
  alternatePhone: string;
  residentialAddress: ContactAddressDto;
  mailingSameAsResidential: boolean;
  mailingAddress: ContactAddressDto;
};

type ContactDetailsApiResponse =
  | {
      success?: boolean;
      message?: string;
      data?: GetContactDetailsResponseDto;
    }
  | GetContactDetailsResponseDto;

type PersonalDetailsResponseDto = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  governmentIdType: string;
  governmentIdNumber: string;
  sinTaxId: string;
};

type PersonalDetailsApiResponse =
  | {
      success?: boolean;
      message?: string;
      data?: PersonalDetailsResponseDto;
    }
  | PersonalDetailsResponseDto;

type EducationDetailsResponseDto = {
  highestEducation: string;
  fieldOfStudy: string;
  institutionName: string;
  graduationYear: string;
};

type EducationDetailsApiResponse =
  | {
      success?: boolean;
      message?: string;
      data?: EducationDetailsResponseDto;
    }
  | EducationDetailsResponseDto;

type FinancialBankAccount = {
  bankName: string;
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
  accountType: string;
  swiftBic: string;
  isRepaymentAccount: boolean;
};

type FinancialDetailsResponseDto = {
  employmentStatus: string;
  employerName: string;
  jobTitle: string;
  workExperience: string;
  monthlyIncome: string;
  otherIncomeSources: string;
  existingLoans: string;
  totalMonthlyLoanPayments: string;
  tenureMonths?: string;
  bankAccounts: FinancialBankAccount[];
};

type FinancialDetailsApiResponse =
  | {
      success?: boolean;
      message?: string;
      data?: FinancialDetailsResponseDto;
    }
  | FinancialDetailsResponseDto;

type DocumentDetailItemDto = {
  documentType?: string;
  fileName?: string;
  file_name?: string;
  url?: string;
  path?: string;
  isVerified?: boolean;
  verificationStatus?: VerificationStatus;
};

type GetDocumentDetailsResponseDto = {
  documents: DocumentDetailItemDto[];
};

type DocumentDetailsApiResponse =
  | GetDocumentDetailsResponseDto
  | {
      success?: boolean;
      message?: string;
      data?: GetDocumentDetailsResponseDto | DocumentDetailItemDto[];
      documents?: DocumentDetailItemDto[];
    }
  | DocumentDetailItemDto[];

type ApplicationStatusResponseDto = {
  success?: boolean;
  applicationNumber?: string;
  statusCode?: string;
  statusName?: string;
  reasonCode?: string;
  message?: string;
};

type CreditScoreCheckResponseDto = {
  application_id?: string;
  cibil_report_id?: string | null;
  request_id?: string | null;
  bureau_name?: string;
  bureau_reference_id?: string | null;
  bureau_status?: string;
  credit_score?: number | string | null;
  score_band?: string | null;
  risk_level?: string | null;
  remarks?: string | null;
  raw_response?: {
    header?: {
      reportDate?: string;
      status?: string;
    };
  } | null;
};

type CalculateRatiosResponseDto = {
  message: string;
  applicationNumber: string;
  customerId: string;
  monthlyIncome: number;
  annualIncome: number;
  totalMonthlyDebtPayments: number;
  proposedEmi: number;
  requestedLoanAmount: number;
  dbr: number;
  emiToIncome: number;
  creditUtilization: number;
  loanToIncome: number;
};

type FetchUserRoleApiResponse = {
  message: string;
  data: {
    userId: string;
    roleId: string;
    roleCode: string;
  };
};

type CommunicationAttachment = {
  documentName: string;
  originalFileName: string;
  documentPath: string;
  mimeType?: string;
  fileSizeBytes?: number;
};

type CommunicationHistoryAttachment = {
  attachmentId: string;
  documentName: string;
  originalFileName: string;
  documentPath: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  uploadedBy: string;
  createdAt: string;
};

type CommunicationHistoryItem = {
  messageId: string;
  senderUserId: string | null;
  senderType: string;
  recipientUserId: string | null;
  recipientType: string;
  messageText: string;
  messageCategory: string;
  is_internal: boolean;
  sendEmail: boolean;
  sendSms: boolean;
  emailStatus: string;
  smsStatus: string;
  hasAttachment: boolean;
  createdAt: string;
  attachments: CommunicationHistoryAttachment[];
};

type CommunicationFetchResponse = {
  success: boolean;
  message: string;
  data: {
    applicationNumber: string;
    is_internal?: boolean;
    totalRecords: number;
    communications: CommunicationHistoryItem[];
  };
};

type DocumentRow = {
  id: string;
  documentType: string;
  fileName: string;
  downloadUrl: string;
  verificationStatus: VerificationStatus;
};

type BankAccount = {
  bankName: string;
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
  accountType: string;
  swiftBic: string;
  isRepaymentAccount: boolean;
};

type AccordionKey =
  | "personal"
  | "communication"
  | "education"
  | "financial"
  | "bank"
  | "documents"
  | "cibil"
  | "repayment"
  | "ratios"
  | "eligibility"
  | "underwriterReview"
  | "underwriterDecision"
  | "communicationHistory";

type ApplicationDetailsState = {
  applicationNumber: string;
  applicationStatus: string;
  loanProduct: string;

  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  governmentIdType: string;
  governmentIdNumber: string;
  sinTaxId: string;

  email: string;
  mobile: string;
  alternatePhone: string;
  residentialLine1: string;
  residentialLine2: string;
  residentialCity: string;
  residentialState: string;
  residentialPostalCode: string;
  residentialCountry: string;
  mailingSameAsResidential: boolean;
  mailingLine1: string;
  mailingLine2: string;
  mailingCity: string;
  mailingState: string;
  mailingPostalCode: string;
  mailingCountry: string;

  highestEducation: string;
  fieldOfStudy: string;
  institutionName: string;
  graduationYear: string;

  employmentStatus: string;
  employerName: string;
  jobTitle: string;
  workExperience: string;
  monthlyIncome: string;
  otherIncomeSources: string;
  existingLoans: string;
  totalMonthlyLoanPayments: string;
  tenureMonths: string;

  bankAccounts: BankAccount[];
  documentRows: DocumentRow[];

  cibilScore: string;
  cibilStatus: string;
  cibilRemarks: string;
  cibilLastUpdated: string;

  emiAmount: string;
  totalRepayment: string;
  interestAmount: string;
  scheduleStartDate: string;
  scheduleEndDate: string;

  foirRatio: string;
  dtiRatio: string;
  ltvRatio: string;
  dscrRatio: string;

  eligibilityStatus: string;
  eligibilityMessage: string;

  underwriterReview: string;
  underwriterDecision: string;
};

type CommunicationFormState = {
  senderType: string;
  recipientType: string;
  recipientUserId: string;
  messageCategory: string;
  messageText: string;
  sendEmail: boolean;
  sendSms: boolean;
  attachments: CommunicationAttachment[];
};

type DecisionFormState = {
  underwriterDecisionStatus: UnderwriterDecisionOption;
  underwriterComments: string;
  disbursalDecisionStatus: DisbursalDecisionOption;
  disbursalComments: string;
};

type UserRole =
  | "CUSTOMER"
  | "SOURCING_OFFICER"
  | "LOAN_OFFICER"
  | "UNDERWRITER"
  | "DISBURSAL_OFFICER"
  | "ADMIN"
  | "UNKNOWN";

type HistoryScope = "external" | "all";

type LocalAttachmentLink = {
  url: string;
  originalFileName: string;
};

type AttachmentDownloadInfo = {
  href: string;
  fileName: string;
  downloadable: boolean;
  isLocal: boolean;
  unavailableAfterRefresh: boolean;
};

type StatusStepKey =
  | "SUBMITTED"
  | "CREDIT_CHECK_COMPLETED"
  | "UNDER_REVIEW"
  | "UNDERWRITER_DECISION"
  | "DISBURSAL_DECISION";

type StatusStep = {
  key: StatusStepKey;
  label: string;
  activeLabel?: string;
};

type PushStageRequestDto = {
  applicationNumber: string;
  actionType:
    | "UNDERWRITER_APPROVED"
    | "UNDERWRITER_REJECTED"
    | "DISBURSAL_COMPLETED"
    | "DISBURSAL_REJECTED";
  remarks: string;
  approvedLoanAmount?: number;
  approvedInterestRate?: number;
  approvedTenureMonths?: number;
  approvedEmi?: number;
  metadataJson?: Record<string, unknown>;
};

type StageHistoryItem = {
  actionType?: string;
  remarks?: string;
  createdAt?: string;
  metadataJson?: Record<string, unknown> | null;
};

type FetchStageHistoryResponse =
  | {
      success?: boolean;
      message?: string;
      data?: StageHistoryItem[];
    }
  | StageHistoryItem[];

const APPLICATION_STATUS_STEPS: StatusStep[] = [
  { key: "SUBMITTED", label: "Submitted" },
  { key: "CREDIT_CHECK_COMPLETED", label: "Credit Check Completed" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  {
    key: "UNDERWRITER_DECISION",
    label: "Underwriter Decision",
    activeLabel: "Approved / Rejected",
  },
  {
    key: "DISBURSAL_DECISION",
    label: "Disbursal Decision",
    activeLabel: "Completed / Rejected",
  },
];

const accordionSections: {
  key: AccordionKey;
  title: string;
  icon: React.ReactNode;
}[] = [
  { key: "personal", title: "Personal Details", icon: <UserRound size={18} /> },
  {
    key: "communication",
    title: "Communication Details",
    icon: <MessageSquare size={18} />,
  },
  { key: "education", title: "Education Details", icon: <GraduationCap size={18} /> },
  {
    key: "financial",
    title: "Financial Details",
    icon: <BriefcaseBusiness size={18} />,
  },
  { key: "bank", title: "Bank Details", icon: <Landmark size={18} /> },
  { key: "documents", title: "Document Details", icon: <FileText size={18} /> },
  { key: "cibil", title: "CIBIL Details", icon: <ShieldCheck size={18} /> },
  { key: "repayment", title: "Repayment Schedule Details", icon: <Calculator size={18} /> },
  { key: "ratios", title: "Ratios", icon: <Calculator size={18} /> },
  { key: "eligibility", title: "Eligibility", icon: <ShieldCheck size={18} /> },
  {
    key: "underwriterReview",
    title: "Underwriter Decision",
    icon: <FileText size={18} />,
  },
  {
    key: "underwriterDecision",
    title: "Disbursal Decision",
    icon: <FileText size={18} />,
  },
  {
    key: "communicationHistory",
    title: "Communication History",
    icon: <MessageSquare size={18} />,
  },
];

const CUSTOMER_VISIBLE_SECTIONS: AccordionKey[] = [
  "personal",
  "communication",
  "education",
  "financial",
  "bank",
  "documents",
  "cibil",
  "repayment",
  "communicationHistory",
];

const UNDERWRITER_VISIBLE_SECTIONS: AccordionKey[] = [
  "personal",
  "communication",
  "education",
  "financial",
  "bank",
  "documents",
  "cibil",
  "repayment",
  "ratios",
  "eligibility",
  "underwriterReview",
  "communicationHistory",
];

const DISBURSAL_VISIBLE_SECTIONS: AccordionKey[] = [
  "personal",
  "communication",
  "education",
  "financial",
  "bank",
  "documents",
  "cibil",
  "repayment",
  "ratios",
  "eligibility",
  "underwriterReview",
  "underwriterDecision",
  "communicationHistory",
];

const OFFICER_READONLY_VISIBLE_SECTIONS: AccordionKey[] = [
  "personal",
  "communication",
  "education",
  "financial",
  "bank",
  "documents",
  "cibil",
  "repayment",
  "communicationHistory",
];

const initialDetails: ApplicationDetailsState = {
  applicationNumber: "",
  applicationStatus: "",
  loanProduct: "",

  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  nationality: "",
  governmentIdType: "",
  governmentIdNumber: "",
  sinTaxId: "",

  email: "",
  mobile: "",
  alternatePhone: "",
  residentialLine1: "",
  residentialLine2: "",
  residentialCity: "",
  residentialState: "",
  residentialPostalCode: "",
  residentialCountry: "",
  mailingSameAsResidential: true,
  mailingLine1: "",
  mailingLine2: "",
  mailingCity: "",
  mailingState: "",
  mailingPostalCode: "",
  mailingCountry: "",

  highestEducation: "",
  fieldOfStudy: "",
  institutionName: "",
  graduationYear: "",

  employmentStatus: "",
  employerName: "",
  jobTitle: "",
  workExperience: "",
  monthlyIncome: "",
  otherIncomeSources: "",
  existingLoans: "",
  totalMonthlyLoanPayments: "",
  tenureMonths: "",

  bankAccounts: [],
  documentRows: [],

  cibilScore: "",
  cibilStatus: "",
  cibilRemarks: "",
  cibilLastUpdated: "",

  emiAmount: "",
  totalRepayment: "",
  interestAmount: "",
  scheduleStartDate: "",
  scheduleEndDate: "",

  foirRatio: "",
  dtiRatio: "",
  ltvRatio: "",
  dscrRatio: "",

  eligibilityStatus: "",
  eligibilityMessage: "",

  underwriterReview: "",
  underwriterDecision: "",
};

const initialDecisionForm: DecisionFormState = {
  underwriterDecisionStatus: "",
  underwriterComments: "",
  disbursalDecisionStatus: "",
  disbursalComments: "",
};

function getRecipientUserId(recipientType: string): string {
  return recipientType.trim().toUpperCase() === "CUSTOMER" ? "" : "";
}

const initialCommunicationForm = (): CommunicationFormState => ({
  senderType: "SOURCING_OFFICER",
  recipientType: "CUSTOMER",
  recipientUserId: "",
  messageCategory: "QUERY",
  messageText: "",
  sendEmail: false,
  sendSms: false,
  attachments: [],
});

function isValidApplicationNumber(value: string) {
  return /^APPL\d{10}$/.test(value.trim());
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function sanitizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

function parseNumberValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildAttachmentFromFile(file: File): CommunicationAttachment {
  const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  return {
    documentName: safeName,
    originalFileName: file.name,
    documentPath: `mock-uploads/${safeName}`,
    mimeType: file.type || undefined,
    fileSizeBytes: file.size,
  };
}

function normalizeBackendRole(roleCode: string | null | undefined): UserRole {
  const normalized = String(roleCode || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (normalized === "CUSTOMER") return "CUSTOMER";
  if (normalized === "SOURCING_OFFICER") return "SOURCING_OFFICER";
  if (normalized === "LOAN_OFFICER") return "LOAN_OFFICER";
  if (normalized === "UNDERWRITER") return "UNDERWRITER";
  if (normalized === "DISBURSAL_OFFICER") return "DISBURSAL_OFFICER";
  if (normalized === "ADMIN") return "ADMIN";

  return "UNKNOWN";
}

function getSenderTypeForRole(role: UserRole): string {
  if (role === "CUSTOMER") return "CUSTOMER";
  if (role === "SOURCING_OFFICER") return "SOURCING_OFFICER";
  if (role === "LOAN_OFFICER") return "LOAN_OFFICER";
  if (role === "UNDERWRITER") return "UNDERWRITER";
  if (role === "DISBURSAL_OFFICER") return "DISBURSAL_OFFICER";
  if (role === "ADMIN") return "ADMIN";
  return "SOURCING_OFFICER";
}

function getRecipientOptionsForSender(senderType: string): string[] {
  if (senderType === "CUSTOMER") {
    return ["SOURCING_OFFICER", "LOAN_OFFICER", "ADMIN"];
  }

  return ["CUSTOMER"];
}

function getDefaultRecipientTypeForSender(senderType: string): string {
  const options = getRecipientOptionsForSender(senderType);
  return options[0] || "CUSTOMER";
}

function dedupeAndSortCommunication(items: CommunicationHistoryItem[]) {
  const map = new Map<string, CommunicationHistoryItem>();

  for (const item of items) {
    map.set(item.messageId, item);
  }

  return Array.from(map.values()).sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

function getHistoryScopeForRole(role: UserRole): HistoryScope {
  return role === "CUSTOMER" ? "external" : "all";
}

function getIsInternalFromRecipient(recipientType: string) {
  return recipientType.trim().toUpperCase() !== "CUSTOMER";
}

function isPermanentAttachmentLink(path: string) {
  if (!path) return false;

  return (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("/")
  );
}

function isTemporaryLocalPath(path: string) {
  return path.startsWith("mock-uploads/");
}

function makeAttachmentLookupKeys(attachment: {
  attachmentId?: string;
  documentName?: string;
  documentPath?: string;
  originalFileName?: string;
}) {
  return [
    attachment.attachmentId || "",
    attachment.documentName || "",
    attachment.documentPath || "",
    attachment.originalFileName || "",
  ].filter(Boolean);
}

function getSafeAddress(address?: ContactAddressDto): ContactAddressDto {
  return {
    line1: address?.line1 || "",
    line2: address?.line2 || "",
    city: address?.city || "",
    state: address?.state || "",
    postalCode: address?.postalCode || "",
    country: address?.country || "",
  };
}

function extractContactDetailsResponse(
  response: ContactDetailsApiResponse
): GetContactDetailsResponseDto | null {
  if (!response) return null;

  if ("data" in response && response.data) {
    return response.data;
  }

  if ("email" in response) {
    return response as GetContactDetailsResponseDto;
  }

  return null;
}

function extractPersonalDetailsResponse(
  response: PersonalDetailsApiResponse
): PersonalDetailsResponseDto | null {
  if (!response) return null;

  if ("data" in response && response.data) {
    return response.data;
  }

  if ("firstName" in response) {
    return response as PersonalDetailsResponseDto;
  }

  return null;
}

function extractEducationDetailsResponse(
  response: EducationDetailsApiResponse
): EducationDetailsResponseDto | null {
  if (!response) return null;

  if ("data" in response && response.data) {
    return response.data;
  }

  if ("highestEducation" in response) {
    return response as EducationDetailsResponseDto;
  }

  return null;
}

function extractFinancialDetailsResponse(
  response: FinancialDetailsApiResponse
): FinancialDetailsResponseDto | null {
  if (!response) return null;

  if ("data" in response && response.data) {
    return response.data;
  }

  if ("employmentStatus" in response) {
    return response as FinancialDetailsResponseDto;
  }

  return null;
}

function extractDocumentDetailsResponse(
  response: DocumentDetailsApiResponse
): DocumentDetailItemDto[] {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response;
  }

  if ("data" in response && Array.isArray(response.data)) {
    return response.data;
  }

  if ("data" in response && response.data && "documents" in response.data) {
    return response.data.documents || [];
  }

  if ("documents" in response && Array.isArray(response.documents)) {
    return response.documents;
  }

  return [];
}

function extractStageHistoryResponse(
  response: FetchStageHistoryResponse
): StageHistoryItem[] {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response;
  }

  if ("data" in response && Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function normalizeApplicationStatus(
  statusCode?: string,
  statusName?: string,
  fallback?: string
): string {
  const raw = String(statusCode || statusName || fallback || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  if (!raw) return "";

  if (raw.includes("SUBMITTED")) return "SUBMITTED";
  if (raw.includes("CREDIT_CHECK_COMPLETED")) return "CREDIT_CHECK_COMPLETED";
  if (raw.includes("UNDER_REVIEW")) return "UNDER_REVIEW";

  if (raw.includes("UNDERWRITER_APPROVED") || raw === "APPROVED") {
    return "UNDERWRITER_APPROVED";
  }

  if (raw.includes("UNDERWRITER_REJECTED")) {
    return "UNDERWRITER_REJECTED";
  }

  if (
    raw.includes("DISBURSAL_COMPLETED") ||
    raw.includes("DISBURSED")
  ) {
    return "DISBURSAL_COMPLETED";
  }

  if (raw.includes("DISBURSAL_REJECTED")) {
    return "DISBURSAL_REJECTED";
  }

  if (raw === "REJECTED") {
    return "UNDERWRITER_REJECTED";
  }

  return raw;
}

function getStatusStepIndex(normalizedStatus: string): number {
  switch (normalizedStatus) {
    case "SUBMITTED":
      return 0;
    case "CREDIT_CHECK_COMPLETED":
      return 1;
    case "UNDER_REVIEW":
      return 2;
    case "UNDERWRITER_APPROVED":
    case "UNDERWRITER_REJECTED":
      return 3;
    case "DISBURSAL_COMPLETED":
    case "DISBURSAL_REJECTED":
      return 4;
    default:
      return -1;
  }
}

function getDisplayStatusLabel(normalizedStatus: string): string {
  switch (normalizedStatus) {
    case "UNDERWRITER_APPROVED":
      return "Approved";
    case "UNDERWRITER_REJECTED":
      return "Rejected";
    case "DISBURSAL_COMPLETED":
      return "Disbursed";
    case "DISBURSAL_REJECTED":
      return "Rejected";
    case "SUBMITTED":
      return "Submitted";
    case "CREDIT_CHECK_COMPLETED":
      return "Credit Check Completed";
    case "UNDER_REVIEW":
      return "Under Review";
    default:
      return normalizedStatus
        ? normalizedStatus.replace(/_/g, " ")
        : "Status Pending";
  }
}

function getStepLabel(step: StatusStep, normalizedStatus: string): string {
  if (step.key === "UNDERWRITER_DECISION") {
    if (normalizedStatus === "UNDERWRITER_APPROVED") return "Approved";
    if (normalizedStatus === "UNDERWRITER_REJECTED") return "Rejected";
  }

  if (step.key === "DISBURSAL_DECISION") {
    if (normalizedStatus === "DISBURSAL_COMPLETED") return "Disbursed";
    if (normalizedStatus === "DISBURSAL_REJECTED") return "Rejected";
  }

  return step.label;
}

function getVisibleSectionsForRole(role: UserRole): AccordionKey[] {
  if (role === "CUSTOMER") return CUSTOMER_VISIBLE_SECTIONS;
  if (role === "UNDERWRITER") return UNDERWRITER_VISIBLE_SECTIONS;
  if (role === "DISBURSAL_OFFICER") return DISBURSAL_VISIBLE_SECTIONS;
  if (role === "ADMIN") return DISBURSAL_VISIBLE_SECTIONS;

  if (role === "SOURCING_OFFICER" || role === "LOAN_OFFICER") {
    return OFFICER_READONLY_VISIBLE_SECTIONS;
  }

  return OFFICER_READONLY_VISIBLE_SECTIONS;
}

function canEditMainFields(role: UserRole): boolean {
  return (
    role === "UNDERWRITER" ||
    role === "DISBURSAL_OFFICER" ||
    role === "ADMIN"
  );
}

function canEditDocuments(role: UserRole): boolean {
  return (
    role === "UNDERWRITER" ||
    role === "DISBURSAL_OFFICER" ||
    role === "ADMIN"
  );
}

function canSaveDocumentVerification(role: UserRole): boolean {
  return (
    role === "UNDERWRITER" ||
    role === "DISBURSAL_OFFICER" ||
    role === "ADMIN"
  );
}

function canSeeUnderwriterDecision(role: UserRole): boolean {
  return (
    role === "UNDERWRITER" ||
    role === "DISBURSAL_OFFICER" ||
    role === "ADMIN"
  );
}

function canEditUnderwriterDecision(role: UserRole): boolean {
  return role === "UNDERWRITER" || role === "ADMIN";
}

function canSeeDisbursalDecision(role: UserRole): boolean {
  return role === "DISBURSAL_OFFICER" || role === "ADMIN";
}

function canEditDisbursalDecision(role: UserRole): boolean {
  return role === "DISBURSAL_OFFICER" || role === "ADMIN";
}
export default function ApplicationDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationNumberFromUrl = searchParams.get("applicationNumber") || "";

  const { token, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [details, setDetails] = useState<ApplicationDetailsState>({
    ...initialDetails,
    applicationNumber: applicationNumberFromUrl,
  });

  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("UNKNOWN");
  const [roleLoading, setRoleLoading] = useState(false);

  const [decisionForm, setDecisionForm] =
    useState<DecisionFormState>(initialDecisionForm);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState("");
  const [decisionSuccess, setDecisionSuccess] = useState("");
  const [underwriterSavedMessage, setUnderwriterSavedMessage] = useState("");
  const [disbursalSavedMessage, setDisbursalSavedMessage] = useState("");

  const [openSections, setOpenSections] = useState<Record<AccordionKey, boolean>>({
    personal: true,
    communication: true,
    education: false,
    financial: false,
    bank: false,
    documents: true,
    cibil: false,
    repayment: false,
    ratios: false,
    eligibility: false,
    underwriterReview: false,
    underwriterDecision: false,
    communicationHistory: true,
  });

  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [documentSuccess, setDocumentSuccess] = useState("");

  const [communicationHistory, setCommunicationHistory] = useState<
    CommunicationHistoryItem[]
  >([]);
  const [communicationLoading, setCommunicationLoading] = useState(false);
  const [communicationError, setCommunicationError] = useState("");
  const [communicationSuccess, setCommunicationSuccess] = useState("");
  const [communicationForm, setCommunicationForm] =
    useState<CommunicationFormState>(initialCommunicationForm());
  const [sendingCommunication, setSendingCommunication] = useState(false);

  const [localAttachmentLinks, setLocalAttachmentLinks] = useState<
    Record<string, LocalAttachmentLink>
  >({});
  const createdBlobUrlsRef = useRef<string[]>([]);

  const visibleSections = useMemo(
    () => getVisibleSectionsForRole(currentUserRole),
    [currentUserRole]
  );

  const isMainFieldsEditable = useMemo(
    () => canEditMainFields(currentUserRole),
    [currentUserRole]
  );

  const isDocumentsEditable = useMemo(
    () => canEditDocuments(currentUserRole),
    [currentUserRole]
  );

  const isDocumentVerificationSavable = useMemo(
    () => canSaveDocumentVerification(currentUserRole),
    [currentUserRole]
  );

  const showUnderwriterDecisionSection = useMemo(
    () => canSeeUnderwriterDecision(currentUserRole),
    [currentUserRole]
  );

  const canEditUnderwriterDecisionSection = useMemo(
    () => canEditUnderwriterDecision(currentUserRole),
    [currentUserRole]
  );

  const showDisbursalDecisionSection = useMemo(
    () => canSeeDisbursalDecision(currentUserRole),
    [currentUserRole]
  );

  const canEditDisbursalDecisionSection = useMemo(
    () => canEditDisbursalDecision(currentUserRole),
    [currentUserRole]
  );

  const historyScope = useMemo(
    () => getHistoryScopeForRole(currentUserRole),
    [currentUserRole]
  );

  const senderTypeFromLogin = useMemo(
    () => getSenderTypeForRole(currentUserRole),
    [currentUserRole]
  );

  const recipientOptions = useMemo(
    () => getRecipientOptionsForSender(senderTypeFromLogin),
    [senderTypeFromLogin]
  );

  const normalizedApplicationStatus = useMemo(
    () =>
      normalizeApplicationStatus(
        details.applicationStatus,
        details.applicationStatus,
        details.applicationStatus
      ),
    [details.applicationStatus]
  );

  const activeStatusIndex = useMemo(
    () => getStatusStepIndex(normalizedApplicationStatus),
    [normalizedApplicationStatus]
  );

  const statusProgressPercent = useMemo(() => {
    if (activeStatusIndex < 0) return 0;
    if (APPLICATION_STATUS_STEPS.length <= 1) return 100;
    return (activeStatusIndex / (APPLICATION_STATUS_STEPS.length - 1)) * 100;
  }, [activeStatusIndex]);

  const headerSummary = useMemo(() => {
    const fullName = `${details.firstName} ${details.lastName}`.trim();
    return [
      fullName || "Applicant Details",
      details.loanProduct || "Loan Product",
      getDisplayStatusLabel(normalizedApplicationStatus) || "Status Pending",
    ].join(" • ");
  }, [
    details.firstName,
    details.lastName,
    details.loanProduct,
    normalizedApplicationStatus,
  ]);

  useEffect(() => {
    if (applicationNumberFromUrl) {
      setDetails((prev) => ({
        ...prev,
        applicationNumber: applicationNumberFromUrl,
      }));
    }
  }, [applicationNumberFromUrl]);

  useEffect(() => {
    return () => {
      createdBlobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!token || !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, token, isAuthenticated, router]);

  async function fetchCurrentUserRole() {
    if (!token) return;

    try {
      setRoleLoading(true);

      const response = await axios.get<FetchUserRoleApiResponse>(
        "/api/auth/fetch-user-role",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const roleCode = response.data?.data?.roleCode;
      const normalizedRole = normalizeBackendRole(roleCode);

      setCurrentUserRole(normalizedRole);
    } catch (error) {
      console.error("Failed to fetch user role:", error);
      setCurrentUserRole("UNKNOWN");
    } finally {
      setRoleLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    fetchCurrentUserRole();
  }, [token]);

  useEffect(() => {
    const senderType = getSenderTypeForRole(currentUserRole);
    const allowedRecipients = getRecipientOptionsForSender(senderType);

    setCommunicationForm((prev) => {
      const validRecipient = allowedRecipients.includes(prev.recipientType)
        ? prev.recipientType
        : getDefaultRecipientTypeForSender(senderType);

      return {
        ...prev,
        senderType,
        recipientType: validRecipient,
        recipientUserId: getRecipientUserId(validRecipient),
        messageCategory: prev.messageCategory || "QUERY",
      };
    });
  }, [currentUserRole]);

  useEffect(() => {
    setOpenSections((prev) => {
      const next = { ...prev };

      (Object.keys(next) as AccordionKey[]).forEach((key) => {
        if (!visibleSections.includes(key)) {
          next[key] = false;
        }
      });

      return next;
    });
  }, [visibleSections]);

  async function fetchApplicationStatus() {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;
    if (!details.dob) return;

    try {
      const response = await axios.post<ApplicationStatusResponseDto>(
        "/api/application-status",
        {
          applicationNumber: details.applicationNumber.trim(),
          dob: details.dob,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const normalizedStatus = normalizeApplicationStatus(
        response.data?.statusCode,
        response.data?.statusName,
        details.applicationStatus
      );

      setDetails((prev) => ({
        ...prev,
        applicationStatus: normalizedStatus || prev.applicationStatus,
      }));
    } catch (error) {
      console.error("Failed to fetch application status:", error);

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const apiMessage = error.response?.data?.message;

        if (
          statusCode === 401 ||
          apiMessage === "Invalid token" ||
          apiMessage === "No token provided" ||
          apiMessage === "User not authenticated"
        ) {
          logout();
          router.push("/signin");
        }
      }
    }
  }

  async function fetchDocumentDetails() {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    try {
      setDocumentLoading(true);
      setDocumentError("");

      const response = await axios.get<DocumentDetailsApiResponse>(
        "/api/application/document-details",
        {
          params: {
            applicationNumber: details.applicationNumber.trim(),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = extractDocumentDetailsResponse(response.data);

      const rows: DocumentRow[] = data.map((doc, index) => ({
        id: `${doc.documentType || "doc"}-${index}`,
        documentType: doc.documentType || "Unknown Document",
        fileName: doc.fileName || doc.file_name || "",
        downloadUrl: doc.url || doc.path || "",
        verificationStatus:
          doc.verificationStatus ||
          (doc.isVerified === true
            ? "VERIFIED"
            : doc.isVerified === false
            ? "NOT_VERIFIED"
            : ""),
      }));

      setDetails((prev) => ({
        ...prev,
        documentRows: rows,
      }));

      setDocumentSuccess("Documents loaded successfully.");
    } catch (error) {
      setDocumentError("Failed to fetch documents.");
    } finally {
      setDocumentLoading(false);
    }
  }

  async function pushDecisionMessage(messageText: string) {
    if (!token) return;

    await axios.post(
      "/api/push-communication",
      {
        applicationNumber: details.applicationNumber.trim(),
        senderType: senderTypeFromLogin,
        recipientType: "CUSTOMER",
        messageText,
        messageCategory: "STATUS_UPDATE",
        isInternal: false,
        sendEmail: false,
        sendSms: false,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  async function pushApplicationStage(payload: PushStageRequestDto) {
    if (!token) return;

    await axios.post("/api/application/push-stage", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function fetchStageHistory() {
    if (!token) return [];
    if (!isValidApplicationNumber(details.applicationNumber)) return [];

    try {
      const response = await axios.post<FetchStageHistoryResponse>(
        "/api/application/fetch-stage-history",
        {
          applicationNumber: details.applicationNumber.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return extractStageHistoryResponse(response.data);
    } catch (error) {
      console.error("Failed to fetch stage history:", error);
      return [];
    }
  }

  async function hydrateDecisionStateFromStageHistory() {
    const history = await fetchStageHistory();

    if (!history.length) return;

    const sortedHistory = [...history].sort((a, b) => {
      const aTime = new Date(a.createdAt || "").getTime();
      const bTime = new Date(b.createdAt || "").getTime();
      return bTime - aTime;
    });

    const latestUnderwriter = sortedHistory.find(
      (item) =>
        item.actionType === "UNDERWRITER_APPROVED" ||
        item.actionType === "UNDERWRITER_REJECTED"
    );

    const latestDisbursal = sortedHistory.find(
      (item) =>
        item.actionType === "DISBURSAL_COMPLETED" ||
        item.actionType === "DISBURSAL_REJECTED"
    );

    setDecisionForm((prev) => ({
      ...prev,
      underwriterDecisionStatus:
        latestUnderwriter?.actionType === "UNDERWRITER_APPROVED"
          ? "APPROVED"
          : latestUnderwriter?.actionType === "UNDERWRITER_REJECTED"
          ? "REJECTED"
          : prev.underwriterDecisionStatus,
      underwriterComments:
        latestUnderwriter?.remarks || prev.underwriterComments,
      disbursalDecisionStatus:
        latestDisbursal?.actionType === "DISBURSAL_COMPLETED"
          ? "DISBURSED"
          : latestDisbursal?.actionType === "DISBURSAL_REJECTED"
          ? "REJECTED"
          : prev.disbursalDecisionStatus,
      disbursalComments: latestDisbursal?.remarks || prev.disbursalComments,
    }));
  }

  async function handleSaveUnderwriterDecision() {
  if (!canEditUnderwriterDecisionSection) return;

  if (!decisionForm.underwriterDecisionStatus) {
    setDecisionError("Please select underwriter decision.");
    return;
  }

  if (!decisionForm.underwriterComments.trim()) {
    setDecisionError("Please enter comments.");
    return;
  }

  try {
    setDecisionLoading(true);
    setDecisionError("");
    setDecisionSuccess("");
    setUnderwriterSavedMessage("");
    setDisbursalSavedMessage("");

    const approvedTenureMonths = Math.max(1, parseNumberValue(details.tenureMonths));
    const approvedEmi = Math.max(1, parseNumberValue(details.emiAmount));
    const approvedLoanAmount = 1;
    const approvedInterestRate = 9.25;

    await pushApplicationStage({
      applicationNumber: details.applicationNumber.trim(),
      actionType:
        decisionForm.underwriterDecisionStatus === "APPROVED"
          ? "UNDERWRITER_APPROVED"
          : "UNDERWRITER_REJECTED",
      remarks: decisionForm.underwriterComments.trim(),
      approvedLoanAmount,
      approvedInterestRate,
      approvedTenureMonths,
      approvedEmi,
      metadataJson: {
        riskLevel: "LOW",
        bureauStatus: "SUCCESS",
        scoreBand: "700-749",
        note: decisionForm.underwriterComments.trim(),
      },
    });

    const message =
      `${COMMUNICATION_PROPERTIES.CONSTANT1 || ""}${
        COMMUNICATION_PROPERTIES.CONSTANT1 ? " " : ""
      }${decisionForm.underwriterComments.trim()}`;

    await pushDecisionMessage(message);
    await fetchApplicationStatus();
    await hydrateDecisionStateFromStageHistory();
    await fetchCommunicationHistory();

    setDecisionSuccess("Underwriter decision saved successfully.");
    setUnderwriterSavedMessage("Underwriter decision saved successfully.");
  } catch (error: any) {
    setDecisionError(
      error?.response?.data?.message ||
        "Failed to save underwriter decision."
    );
  } finally {
    setDecisionLoading(false);
  }
}

  async function handleSaveDisbursalDecision() {
  if (!canEditDisbursalDecisionSection) return;

  if (!decisionForm.disbursalDecisionStatus) {
    setDecisionError("Please select disbursal decision.");
    return;
  }

  if (!decisionForm.disbursalComments.trim()) {
    setDecisionError("Please enter comments.");
    return;
  }

  try {
    setDecisionLoading(true);
    setDecisionError("");
    setDecisionSuccess("");
    setUnderwriterSavedMessage("");
    setDisbursalSavedMessage("");

    const approvedTenureMonths = Math.max(1, parseNumberValue(details.tenureMonths));
    const approvedEmi = Math.max(1, parseNumberValue(details.emiAmount));
    const approvedLoanAmount = 1;
    const approvedInterestRate = 9.25;

    await pushApplicationStage({
      applicationNumber: details.applicationNumber.trim(),
      actionType:
        decisionForm.disbursalDecisionStatus === "DISBURSED"
          ? "DISBURSAL_COMPLETED"
          : "DISBURSAL_REJECTED",
      remarks: decisionForm.disbursalComments.trim(),
      approvedLoanAmount,
      approvedInterestRate,
      approvedTenureMonths,
      approvedEmi,
      metadataJson: {
        decision: decisionForm.disbursalDecisionStatus,
        note: decisionForm.disbursalComments.trim(),
      },
    });

    const message =
      `${COMMUNICATION_PROPERTIES.CONSTANT2 || ""}${
        COMMUNICATION_PROPERTIES.CONSTANT2 ? " " : ""
      }${decisionForm.disbursalComments.trim()}`;

    await pushDecisionMessage(message);
    await fetchApplicationStatus();
    await hydrateDecisionStateFromStageHistory();
    await fetchCommunicationHistory();

    setDecisionSuccess("Disbursal decision saved successfully.");
    setDisbursalSavedMessage("Disbursal decision saved successfully.");
  } catch (error: any) {
    setDecisionError(
      error?.response?.data?.message ||
        "Failed to save disbursal decision."
    );
  } finally {
    setDecisionLoading(false);
  }
}

  useEffect(() => {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    fetchDocumentDetails();
    hydrateDecisionStateFromStageHistory();
  }, [token, details.applicationNumber]);

  async function saveDocumentVerification() {
    if (!token || !isDocumentVerificationSavable) return;

    try {
      setDocumentError("");
      setDocumentSuccess("");

      const verifiedDocs = details.documentRows
        .filter((doc) => doc.verificationStatus === "VERIFIED")
        .map((doc) => ({
          documentType: doc.documentType,
          fileName: doc.fileName,
        }));

      const payload = {
        applicationNumber: details.applicationNumber.trim(),
        documents: verifiedDocs,
      };

      await axios.post("/api/application/document-verify", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDocumentSuccess("Documents verified successfully.");
      fetchDocumentDetails();
    } catch (error) {
      console.error("Verification error:", error);
      setDocumentError("Failed to verify documents.");
    }
  }

  function updateVerificationStatus(id: string, status: VerificationStatus) {
    if (!isDocumentsEditable) return;

    setDetails((prev) => ({
      ...prev,
      documentRows: prev.documentRows.map((doc) =>
        doc.id === id ? { ...doc, verificationStatus: status } : doc
      ),
    }));
  }

  async function fetchPersonalDetails() {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    try {
      const response = await axios.get<PersonalDetailsApiResponse>(
        "/api/application/personal-information",
        {
          params: {
            applicationNumber: details.applicationNumber.trim(),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const personalData = extractPersonalDetailsResponse(response.data);

      if (!personalData) return;

      setDetails((prev) => ({
        ...prev,
        firstName: personalData.firstName || "",
        lastName: personalData.lastName || "",
        dob: personalData.dob || "",
        gender: personalData.gender || "",
        maritalStatus: personalData.maritalStatus || "",
        nationality: personalData.nationality || "",
        governmentIdType: personalData.governmentIdType || "",
        governmentIdNumber: personalData.governmentIdNumber || "",
        sinTaxId: personalData.sinTaxId || "",
      }));
    } catch (error) {
      console.error("Failed to fetch personal details:", error);

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const apiMessage = error.response?.data?.message;

        if (
          statusCode === 401 ||
          apiMessage === "Invalid token" ||
          apiMessage === "No token provided" ||
          apiMessage === "User not authenticated"
        ) {
          logout();
          router.push("/signin");
        }
      }
    }
  }

  async function fetchContactDetails() {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    try {
      const response = await axios.get<ContactDetailsApiResponse>(
        "/api/application/contact-details",
        {
          params: {
            applicationNumber: details.applicationNumber.trim(),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const contactData = extractContactDetailsResponse(response.data);

      if (!contactData) return;

      const residentialAddress = getSafeAddress(contactData.residentialAddress);
      const mailingAddress = getSafeAddress(contactData.mailingAddress);

      setDetails((prev) => ({
        ...prev,
        email: contactData.email || "",
        mobile: contactData.mobile || "",
        alternatePhone: contactData.alternatePhone || "",
        residentialLine1: residentialAddress.line1,
        residentialLine2: residentialAddress.line2 || "",
        residentialCity: residentialAddress.city,
        residentialState: residentialAddress.state,
        residentialPostalCode: residentialAddress.postalCode,
        residentialCountry: residentialAddress.country,
        mailingSameAsResidential: Boolean(contactData.mailingSameAsResidential),
        mailingLine1: mailingAddress.line1,
        mailingLine2: mailingAddress.line2 || "",
        mailingCity: mailingAddress.city,
        mailingState: mailingAddress.state,
        mailingPostalCode: mailingAddress.postalCode,
        mailingCountry: mailingAddress.country,
      }));
    } catch (error) {
      console.error("Failed to fetch contact details:", error);

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const apiMessage = error.response?.data?.message;

        if (
          statusCode === 401 ||
          apiMessage === "Invalid token" ||
          apiMessage === "No token provided" ||
          apiMessage === "User not authenticated"
        ) {
          logout();
          router.push("/signin");
        }
      }
    }
  }

  async function fetchEducationDetails() {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    try {
      const response = await axios.get<EducationDetailsApiResponse>(
        "/api/application/education-details",
        {
          params: {
            applicationNumber: details.applicationNumber.trim(),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const educationData = extractEducationDetailsResponse(response.data);

      if (!educationData) return;

      setDetails((prev) => ({
        ...prev,
        highestEducation: educationData.highestEducation || "",
        fieldOfStudy: educationData.fieldOfStudy || "",
        institutionName: educationData.institutionName || "",
        graduationYear: educationData.graduationYear || "",
      }));
    } catch (error) {
      console.error("Failed to fetch education details:", error);

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const apiMessage = error.response?.data?.message;

        if (
          statusCode === 401 ||
          apiMessage === "Invalid token" ||
          apiMessage === "No token provided" ||
          apiMessage === "User not authenticated"
        ) {
          logout();
          router.push("/signin");
        }
      }
    }
  }

  async function fetchFinancialDetails() {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    try {
      const response = await axios.get<FinancialDetailsApiResponse>(
        "/api/application/financial-details",
        {
          params: {
            applicationNumber: details.applicationNumber.trim(),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const financialData = extractFinancialDetailsResponse(response.data);

      if (!financialData) return;

      setDetails((prev) => ({
        ...prev,
        employmentStatus: financialData.employmentStatus || "",
        employerName: financialData.employerName || "",
        jobTitle: financialData.jobTitle || "",
        workExperience: financialData.workExperience || "",
        monthlyIncome: financialData.monthlyIncome || "",
        otherIncomeSources: financialData.otherIncomeSources || "",
        existingLoans: financialData.existingLoans || "",
        totalMonthlyLoanPayments: financialData.totalMonthlyLoanPayments || "",
        tenureMonths: financialData.tenureMonths || "",
        bankAccounts: financialData.bankAccounts || [],
      }));
    } catch (error) {
      console.error("Failed to fetch financial details:", error);

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const apiMessage = error.response?.data?.message;

        if (
          statusCode === 401 ||
          apiMessage === "Invalid token" ||
          apiMessage === "No token provided" ||
          apiMessage === "User not authenticated"
        ) {
          logout();
          router.push("/signin");
        }
      }
    }
  }
    useEffect(() => {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    fetchPersonalDetails();
    fetchContactDetails();
    fetchEducationDetails();
    fetchFinancialDetails();
  }, [token, details.applicationNumber]);

  useEffect(() => {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;
    if (!details.dob) return;

    fetchApplicationStatus();
  }, [token, details.applicationNumber, details.dob]);

  function toggleSection(section: AccordionKey) {
    if (!visibleSections.includes(section)) return;

    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function updateDetail<K extends keyof ApplicationDetailsState>(
    key: K,
    value: ApplicationDetailsState[K]
  ) {
    if (!isMainFieldsEditable) return;

    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function registerSelectedFiles(files: File[]) {
    const nextMap: Record<string, LocalAttachmentLink> = {};

    const attachments = files.map((file) => {
      const dto = buildAttachmentFromFile(file);
      const blobUrl = URL.createObjectURL(file);

      createdBlobUrlsRef.current.push(blobUrl);

      const linkValue = {
        url: blobUrl,
        originalFileName: file.name,
      };

      nextMap[dto.documentName] = linkValue;
      nextMap[dto.documentPath] = linkValue;
      nextMap[dto.originalFileName] = linkValue;

      return dto;
    });

    setLocalAttachmentLinks((prev) => ({
      ...prev,
      ...nextMap,
    }));

    setCommunicationForm((prev) => ({
      ...prev,
      attachments,
    }));
  }

  function removeSelectedAttachment(index: number) {
    setCommunicationForm((prev) => {
      const attachmentToRemove = prev.attachments[index];
      const remainingAttachments = prev.attachments.filter((_, i) => i !== index);

      if (attachmentToRemove) {
        setLocalAttachmentLinks((current) => {
          const next = { ...current };
          delete next[attachmentToRemove.documentName];
          delete next[attachmentToRemove.documentPath];
          delete next[attachmentToRemove.originalFileName];
          return next;
        });
      }

      return {
        ...prev,
        attachments: remainingAttachments,
      };
    });
  }

  function getAttachmentDownloadInfo(
    attachment: CommunicationHistoryAttachment | CommunicationAttachment
  ): AttachmentDownloadInfo {
    const keys = makeAttachmentLookupKeys(attachment);
    const localMatch = keys.find((key) => localAttachmentLinks[key]);

    if (localMatch) {
      return {
        href: localAttachmentLinks[localMatch].url,
        fileName:
          attachment.originalFileName ||
          localAttachmentLinks[localMatch].originalFileName ||
          "attachment",
        downloadable: true,
        isLocal: true,
        unavailableAfterRefresh: false,
      };
    }

    if (attachment.documentPath && isPermanentAttachmentLink(attachment.documentPath)) {
      return {
        href: attachment.documentPath,
        fileName: attachment.originalFileName || "attachment",
        downloadable: true,
        isLocal: false,
        unavailableAfterRefresh: false,
      };
    }

    if (attachment.documentPath && isTemporaryLocalPath(attachment.documentPath)) {
      return {
        href: "",
        fileName: attachment.originalFileName || "attachment",
        downloadable: false,
        isLocal: false,
        unavailableAfterRefresh: true,
      };
    }

    return {
      href: "",
      fileName: attachment.originalFileName || "attachment",
      downloadable: false,
      isLocal: false,
      unavailableAfterRefresh: false,
    };
  }

  async function fetchSingleCommunicationHistory(isInternal: boolean) {
    const response = await axios.post<CommunicationFetchResponse>(
      "/api/fetch-communication-history",
      {
        applicationNumber: details.applicationNumber.trim(),
        isInternal,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data?.data?.communications ?? [];
  }

  async function fetchCommunicationHistory() {
    setCommunicationLoading(true);
    setCommunicationError("");
    setCommunicationSuccess("");

    if (!isValidApplicationNumber(details.applicationNumber)) {
      setCommunicationError(
        "Application Number must start with APPL followed by exactly 10 digits."
      );
      setCommunicationLoading(false);
      return;
    }

    if (!token) {
      setCommunicationError("User not authenticated.");
      setCommunicationLoading(false);
      return;
    }

    try {
      let fetched: CommunicationHistoryItem[] = [];

      if (historyScope === "external") {
        fetched = await fetchSingleCommunicationHistory(false);
      } else {
        const [externalRows, internalRows] = await Promise.all([
          fetchSingleCommunicationHistory(false),
          fetchSingleCommunicationHistory(true),
        ]);

        fetched = dedupeAndSortCommunication([...externalRows, ...internalRows]);
      }

      setCommunicationHistory(dedupeAndSortCommunication(fetched));
      setCommunicationSuccess("Communication history loaded successfully.");
    } catch (error) {
      let message = "Failed to fetch communication history.";

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const apiMessage = error.response?.data?.message;

        if (
          statusCode === 401 ||
          apiMessage === "Invalid token" ||
          apiMessage === "No token provided" ||
          apiMessage === "User not authenticated"
        ) {
          logout();
          router.push("/signin");
          return;
        }

        if (Array.isArray(apiMessage)) {
          message = apiMessage.join(", ");
        } else if (typeof apiMessage === "string") {
          message = apiMessage;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      setCommunicationError(message);
    } finally {
      setCommunicationLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    fetchCommunicationHistory();
  }, [token, details.applicationNumber, historyScope]);

  async function handleSendCommunication(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCommunicationError("");
    setCommunicationSuccess("");

    if (!isValidApplicationNumber(details.applicationNumber)) {
      setCommunicationError(
        "Application Number must start with APPL followed by exactly 10 digits."
      );
      return;
    }

    if (!communicationForm.messageText.trim()) {
      setCommunicationError("Message Text is required.");
      return;
    }

    if (!communicationForm.messageCategory) {
      setCommunicationError("Message Category is required.");
      return;
    }

    if (!communicationForm.recipientType) {
      setCommunicationError("Recipient Type is required.");
      return;
    }

    if (communicationForm.recipientType === senderTypeFromLogin) {
      setCommunicationError("Recipient Type cannot be the same as Sender Type.");
      return;
    }

    if (
      communicationForm.recipientType !== "CUSTOMER" &&
      !communicationForm.recipientUserId.trim()
    ) {
      setCommunicationError(
        "Recipient User ID is required for internal recipient types."
      );
      return;
    }

    if (!token) {
      setCommunicationError("User not authenticated.");
      return;
    }

    try {
      setSendingCommunication(true);

      const isInternal = getIsInternalFromRecipient(communicationForm.recipientType);

      const payload: Record<string, unknown> = {
        applicationNumber: details.applicationNumber.trim(),
        senderType: senderTypeFromLogin,
        recipientType: communicationForm.recipientType,
        messageText: communicationForm.messageText.trim(),
        messageCategory: communicationForm.messageCategory,
        isInternal,
        sendEmail: communicationForm.sendEmail,
        sendSms: communicationForm.sendSms,
        attachments: communicationForm.attachments.length
          ? communicationForm.attachments
          : undefined,
      };

      if (
        communicationForm.recipientType !== "CUSTOMER" &&
        communicationForm.recipientUserId.trim()
      ) {
        payload.recipientUserId = communicationForm.recipientUserId.trim();
      }

      await axios.post("/api/push-communication", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setCommunicationSuccess("Communication sent successfully.");

      setCommunicationForm({
        ...initialCommunicationForm(),
        senderType: senderTypeFromLogin,
        recipientType: getDefaultRecipientTypeForSender(senderTypeFromLogin),
        recipientUserId: getRecipientUserId(
          getDefaultRecipientTypeForSender(senderTypeFromLogin)
        ),
        messageCategory: "QUERY",
      });

      await fetchCommunicationHistory();
    } catch (error) {
      let message = "Failed to save communication.";

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const apiMessage = error.response?.data?.message;

        if (
          statusCode === 401 ||
          apiMessage === "Invalid token" ||
          apiMessage === "No token provided" ||
          apiMessage === "User not authenticated"
        ) {
          logout();
          router.push("/signin");
          return;
        }

        if (Array.isArray(apiMessage)) {
          message = apiMessage.join(", ");
        } else if (typeof apiMessage === "string") {
          message = apiMessage;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      setCommunicationError(message);
    } finally {
      setSendingCommunication(false);
    }
  }

  function renderAccordionHeader(section: {
    key: AccordionKey;
    title: string;
    icon: React.ReactNode;
  }) {
    const isOpen = openSections[section.key];

    return (
      <button
        type="button"
        className="w-100 d-flex justify-content-between align-items-center text-start btn btn-link text-decoration-none p-0"
        onClick={() => toggleSection(section.key)}
        aria-expanded={isOpen}
      >
        <span className="cp-loan-accordion-title">
          {section.icon}
          {section.title}
        </span>
        <span className="cp-loan-accordion-chevron">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
    );
  }

  function renderSectionShell(
    section: { key: AccordionKey; title: string; icon: React.ReactNode },
    children: React.ReactNode
  ) {
    if (!visibleSections.includes(section.key)) return null;

    const isOpen = openSections[section.key];

    return (
      <div className="cp-loan-bank-card mb-3">
        <div className="cp-loan-bank-card-header">{renderAccordionHeader(section)}</div>
        {isOpen ? <div className="pt-3">{children}</div> : null}
      </div>
    );
  }

  function renderStaticField(
    label: string,
    value: string | number | boolean | null | undefined
  ) {
    return (
      <div className="col-12 col-md-4">
        <label className="form-label fw-semibold">{label}</label>
        <input className="form-control" value={value ?? ""} readOnly />
      </div>
    );
  }

  if (authLoading || roleLoading) {
    return (
      <main className="cp-loan-page">
        <section className="cp-loan-card">
          <div className="cp-dashboard-empty-state">Loading application details...</div>
        </section>
      </main>
    );
  }

  return (
    <main className="cp-loan-page">
      <section className="cp-loan-card">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
          <div>
            <h1 className="cp-loan-title mb-1">Application Details</h1>
            <p className="cp-loan-description mb-2">{headerSummary}</p>

            <div className="cp-loan-top-summary">
              <div className="cp-loan-top-pill">
                <span className="cp-loan-top-pill-label">Application Number</span>
                <span className="cp-loan-top-pill-value">
                  {details.applicationNumber || "-"}
                </span>
              </div>

              <div className="cp-loan-top-pill">
                <span className="cp-loan-top-pill-label">Status</span>
                <span className="cp-loan-top-pill-value">
                  {getDisplayStatusLabel(normalizedApplicationStatus)}
                </span>
              </div>

              <div className="cp-loan-top-pill">
                <span className="cp-loan-top-pill-label">Product</span>
                <span className="cp-loan-top-pill-value">{details.loanProduct || "-"}</span>
              </div>

              <div className="cp-loan-top-pill">
                <span className="cp-loan-top-pill-label">Role</span>
                <span className="cp-loan-top-pill-value">{currentUserRole}</span>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-outline-secondary cp-loan-btn-back"
              onClick={() => router.back()}
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="cp-app-status-card">
          <div className="cp-app-status-title">Application Status</div>

          <div className="cp-app-status-subtitle">
            Current Status: {getDisplayStatusLabel(normalizedApplicationStatus)}
          </div>

          <div className="cp-app-status-steps">
            {APPLICATION_STATUS_STEPS.map((step, index) => {
              const isCompleted = activeStatusIndex > index;
              const isCurrent = activeStatusIndex === index;
              const isReached = activeStatusIndex >= index;

              const isRejectedStep =
                (normalizedApplicationStatus === "UNDERWRITER_REJECTED" &&
                  step.key === "UNDERWRITER_DECISION") ||
                (normalizedApplicationStatus === "DISBURSAL_REJECTED" &&
                  step.key === "DISBURSAL_DECISION");

              return (
                <div key={step.key} className="cp-app-status-step">
                  <div
                    className={`cp-app-status-circle ${
                      isCompleted
                        ? "completed"
                        : isRejectedStep && isCurrent
                        ? "rejected"
                        : isCurrent
                        ? "active"
                        : "pending"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="cp-app-status-icon" />
                    ) : isRejectedStep && isCurrent ? (
                      <XCircle className="cp-app-status-icon" />
                    ) : isCurrent ? (
                      <Circle className="cp-app-status-icon" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div
                    className={`cp-app-status-label ${
                      isReached ? "active" : ""
                    }`}
                  >
                    {getStepLabel(step, normalizedApplicationStatus)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cp-app-status-progress">
            <div
              className={`cp-app-status-progress-fill ${
                normalizedApplicationStatus === "UNDERWRITER_REJECTED" ||
                normalizedApplicationStatus === "DISBURSAL_REJECTED"
                  ? "rejected"
                  : ""
              }`}
              style={{
                width: `${statusProgressPercent}%`,
              }}
            />
          </div>
        </div>

        <div className="cp-loan-form">
          {decisionError ? (
            <div className="alert alert-danger mb-3">{decisionError}</div>
          ) : null}

          {decisionSuccess ? (
            <div className="alert alert-success mb-3">{decisionSuccess}</div>
          ) : null}

          {renderSectionShell(
            accordionSections[0],
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">First Name</label>
                <input
                  className="form-control"
                  value={details.firstName}
                  onChange={(e) => updateDetail("firstName", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Last Name</label>
                <input
                  className="form-control"
                  value={details.lastName}
                  onChange={(e) => updateDetail("lastName", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={details.dob}
                  onChange={(e) => updateDetail("dob", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Gender</label>
                <input
                  className="form-control"
                  value={details.gender}
                  onChange={(e) => updateDetail("gender", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Marital Status</label>
                <input
                  className="form-control"
                  value={details.maritalStatus}
                  onChange={(e) => updateDetail("maritalStatus", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Nationality</label>
                <input
                  className="form-control"
                  value={details.nationality}
                  onChange={(e) => updateDetail("nationality", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Government ID Type</label>
                <input
                  className="form-control"
                  value={details.governmentIdType}
                  onChange={(e) => updateDetail("governmentIdType", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Government ID Number</label>
                <input
                  className="form-control"
                  value={details.governmentIdNumber}
                  onChange={(e) => updateDetail("governmentIdNumber", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">SIN / Tax ID</label>
                <input
                  className="form-control"
                  value={details.sinTaxId}
                  onChange={(e) => updateDetail("sinTaxId", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>
            </div>
          )}

          {renderSectionShell(
            accordionSections[1],
            <div className="row g-3">
              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Email Address</label>
                <input
                  className="form-control"
                  value={details.email}
                  onChange={(e) => updateDetail("email", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Mobile Number</label>
                <input
                  className="form-control"
                  value={details.mobile}
                  onChange={(e) => updateDetail("mobile", sanitizeDigits(e.target.value))}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Alternate Phone</label>
                <input
                  className="form-control"
                  value={details.alternatePhone}
                  onChange={(e) =>
                    updateDetail("alternatePhone", sanitizeDigits(e.target.value))
                  }
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Residential Address Line 1</label>
                <input
                  className="form-control"
                  value={details.residentialLine1}
                  onChange={(e) => updateDetail("residentialLine1", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Residential Address Line 2</label>
                <input
                  className="form-control"
                  value={details.residentialLine2}
                  onChange={(e) => updateDetail("residentialLine2", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential City</label>
                <input
                  className="form-control"
                  value={details.residentialCity}
                  onChange={(e) => updateDetail("residentialCity", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential Province / State</label>
                <input
                  className="form-control"
                  value={details.residentialState}
                  onChange={(e) => updateDetail("residentialState", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential Postal Code</label>
                <input
                  className="form-control"
                  value={details.residentialPostalCode}
                  onChange={(e) => updateDetail("residentialPostalCode", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential Country</label>
                <input
                  className="form-control"
                  value={details.residentialCountry}
                  onChange={(e) => updateDetail("residentialCountry", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    id="mailingSameAsResidential"
                    className="form-check-input"
                    type="checkbox"
                    checked={details.mailingSameAsResidential}
                    onChange={(e) =>
                      updateDetail("mailingSameAsResidential", e.target.checked)
                    }
                    disabled={!isMainFieldsEditable}
                  />
                  <label htmlFor="mailingSameAsResidential" className="form-check-label">
                    Mailing address same as residential
                  </label>
                </div>
              </div>

              {!details.mailingSameAsResidential ? (
                <>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Mailing Address Line 1</label>
                    <input
                      className="form-control"
                      value={details.mailingLine1}
                      onChange={(e) => updateDetail("mailingLine1", e.target.value)}
                      disabled={!isMainFieldsEditable}
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Mailing Address Line 2</label>
                    <input
                      className="form-control"
                      value={details.mailingLine2}
                      onChange={(e) => updateDetail("mailingLine2", e.target.value)}
                      disabled={!isMainFieldsEditable}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing City</label>
                    <input
                      className="form-control"
                      value={details.mailingCity}
                      onChange={(e) => updateDetail("mailingCity", e.target.value)}
                      disabled={!isMainFieldsEditable}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing Province / State</label>
                    <input
                      className="form-control"
                      value={details.mailingState}
                      onChange={(e) => updateDetail("mailingState", e.target.value)}
                      disabled={!isMainFieldsEditable}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing Postal Code</label>
                    <input
                      className="form-control"
                      value={details.mailingPostalCode}
                      onChange={(e) => updateDetail("mailingPostalCode", e.target.value)}
                      disabled={!isMainFieldsEditable}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing Country</label>
                    <input
                      className="form-control"
                      value={details.mailingCountry}
                      onChange={(e) => updateDetail("mailingCountry", e.target.value)}
                      disabled={!isMainFieldsEditable}
                    />
                  </div>
                </>
              ) : null}
            </div>
          )}

          {renderSectionShell(
            accordionSections[2],
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Highest Education</label>
                <input
                  className="form-control"
                  value={details.highestEducation}
                  onChange={(e) => updateDetail("highestEducation", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Field of Study</label>
                <input
                  className="form-control"
                  value={details.fieldOfStudy}
                  onChange={(e) => updateDetail("fieldOfStudy", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Institution Name</label>
                <input
                  className="form-control"
                  value={details.institutionName}
                  onChange={(e) => updateDetail("institutionName", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Graduation Year</label>
                <input
                  className="form-control"
                  value={details.graduationYear}
                  onChange={(e) => updateDetail("graduationYear", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>
            </div>
          )}

          {renderSectionShell(
            accordionSections[3],
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Employment Status</label>
                <input
                  className="form-control"
                  value={details.employmentStatus}
                  onChange={(e) => updateDetail("employmentStatus", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Employer Name</label>
                <input
                  className="form-control"
                  value={details.employerName}
                  onChange={(e) => updateDetail("employerName", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Job Title</label>
                <input
                  className="form-control"
                  value={details.jobTitle}
                  onChange={(e) => updateDetail("jobTitle", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Work Experience</label>
                <input
                  className="form-control"
                  value={details.workExperience}
                  onChange={(e) => updateDetail("workExperience", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Monthly Income</label>
                <input
                  className="form-control"
                  value={details.monthlyIncome}
                  onChange={(e) => updateDetail("monthlyIncome", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Other Income Sources</label>
                <input
                  className="form-control"
                  value={details.otherIncomeSources}
                  onChange={(e) => updateDetail("otherIncomeSources", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Existing Loans</label>
                <input
                  className="form-control"
                  value={details.existingLoans}
                  onChange={(e) => updateDetail("existingLoans", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Total Monthly Loan Payments</label>
                <input
                  className="form-control"
                  value={details.totalMonthlyLoanPayments}
                  onChange={(e) =>
                    updateDetail("totalMonthlyLoanPayments", e.target.value)
                  }
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Tenure (Months)</label>
                <input
                  className="form-control"
                  value={details.tenureMonths}
                  onChange={(e) => updateDetail("tenureMonths", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>
            </div>
          )}
                    {renderSectionShell(
            accordionSections[4],
            <div className="row g-3">
              {details.bankAccounts.length === 0 ? (
                <>
                  {renderStaticField("Bank Name", "")}
                  {renderStaticField("Institution Number", "")}
                  {renderStaticField("Transit Number", "")}
                  {renderStaticField("Account Number", "")}
                  {renderStaticField("Account Type", "")}
                  {renderStaticField("SWIFT / BIC", "")}
                </>
              ) : (
                details.bankAccounts.map((account, index) => (
                  <React.Fragment key={`${account.accountNumber}-${index}`}>
                    {renderStaticField("Bank Name", account.bankName)}
                    {renderStaticField("Institution Number", account.institutionNumber)}
                    {renderStaticField("Transit Number", account.transitNumber)}
                    {renderStaticField("Account Number", account.accountNumber)}
                    {renderStaticField("Account Type", account.accountType)}
                    {renderStaticField("SWIFT / BIC", account.swiftBic)}
                  </React.Fragment>
                ))
              )}
            </div>
          )}

          {renderSectionShell(
            accordionSections[5],
            <div className="cp-loan-table-wrap">
              {documentLoading ? (
                <div className="cp-loan-note">Loading document details...</div>
              ) : (
                <div className="table-responsive">
                  <table className="table cp-loan-doc-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Document Type</th>
                        <th>File Name</th>
                        <th>Verification Status</th>
                        <th>Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.documentRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="cp-loan-table-empty">
                            No documents available.
                          </td>
                        </tr>
                      ) : (
                        details.documentRows.map((doc) => (
                          <tr key={doc.id}>
                            <td>{doc.documentType || "-"}</td>
                            <td>{doc.fileName || "-"}</td>
                            <td>
                              <div className="d-flex flex-column gap-2">
                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name={`verification-${doc.id}`}
                                    id={`verified-${doc.id}`}
                                    checked={doc.verificationStatus === "VERIFIED"}
                                    onChange={() =>
                                      updateVerificationStatus(doc.id, "VERIFIED")
                                    }
                                    disabled={!isDocumentsEditable}
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor={`verified-${doc.id}`}
                                  >
                                    Verified
                                  </label>
                                </div>

                                <div className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name={`verification-${doc.id}`}
                                    id={`not-verified-${doc.id}`}
                                    checked={doc.verificationStatus === "NOT_VERIFIED"}
                                    onChange={() =>
                                      updateVerificationStatus(doc.id, "NOT_VERIFIED")
                                    }
                                    disabled={!isDocumentsEditable}
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor={`not-verified-${doc.id}`}
                                  >
                                    Not Verified
                                  </label>
                                </div>
                              </div>
                            </td>
                            <td>
                              {doc.downloadUrl ? (
                                <a
                                  href={doc.downloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="cp-loan-attachment-link"
                                >
                                  <Download size={14} />
                                  <span>Open</span>
                                </a>
                              ) : (
                                <span className="cp-loan-note">No file</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {details.documentRows.length > 0 && isDocumentVerificationSavable ? (
                    <div className="mt-3 d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-primary cp-loan-btn-next"
                        onClick={saveDocumentVerification}
                      >
                        Save Verification
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {renderSectionShell(
            accordionSections[6],
            <div className="row g-3">
              {renderStaticField("CIBIL Score", details.cibilScore)}
              {renderStaticField("CIBIL Status", details.cibilStatus)}
              {renderStaticField("Last Updated", details.cibilLastUpdated)}
              <div className="col-12">
                <label className="form-label fw-semibold">Remarks</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={details.cibilRemarks}
                  readOnly
                />
              </div>
            </div>
          )}

          {renderSectionShell(
            accordionSections[7],
            <div className="row g-3">
              {renderStaticField("EMI Amount", details.emiAmount)}
              {renderStaticField("Total Repayment", details.totalRepayment)}
              {renderStaticField("Interest Amount", details.interestAmount)}
              {renderStaticField("Schedule Start Date", details.scheduleStartDate)}
              {renderStaticField("Schedule End Date", details.scheduleEndDate)}
            </div>
          )}

          {renderSectionShell(
            accordionSections[8],
            <div className="row g-3">
              {renderStaticField("FOIR Ratio", details.foirRatio)}
              {renderStaticField("DTI Ratio", details.dtiRatio)}
              {renderStaticField("LTV Ratio", details.ltvRatio)}
              {renderStaticField("DSCR Ratio", details.dscrRatio)}
            </div>
          )}

          {renderSectionShell(
            accordionSections[9],
            <div className="row g-3">
              {renderStaticField("Eligibility Status", details.eligibilityStatus)}
              <div className="col-12">
                <label className="form-label fw-semibold">Eligibility Message</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={details.eligibilityMessage}
                  readOnly
                />
              </div>
            </div>
          )}

          {showUnderwriterDecisionSection ? (
            <>
              {underwriterSavedMessage ? (
                <div className="alert alert-success mb-3">
                  {underwriterSavedMessage}
                </div>
              ) : null}

              {renderSectionShell(
                accordionSections[10],
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Underwriter Decision</label>
                    <select
                      className="form-select"
                      value={decisionForm.underwriterDecisionStatus}
                      onChange={(e) =>
                        setDecisionForm((prev) => ({
                          ...prev,
                          underwriterDecisionStatus:
                            e.target.value as UnderwriterDecisionOption,
                        }))
                      }
                      disabled={!canEditUnderwriterDecisionSection || decisionLoading}
                    >
                      <option value="">Select decision</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Comment Box</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={decisionForm.underwriterComments}
                      onChange={(e) =>
                        setDecisionForm((prev) => ({
                          ...prev,
                          underwriterComments: e.target.value,
                        }))
                      }
                      placeholder="Enter underwriter comments"
                      disabled={!canEditUnderwriterDecisionSection || decisionLoading}
                    />
                  </div>

                  {canEditUnderwriterDecisionSection ? (
                    <div className="col-12 d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-primary cp-loan-btn-next"
                        onClick={handleSaveUnderwriterDecision}
                        disabled={decisionLoading}
                      >
                        {decisionLoading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          ) : null}

          {showDisbursalDecisionSection ? (
            <>
              {disbursalSavedMessage ? (
                <div className="alert alert-success mb-3">
                  {disbursalSavedMessage}
                </div>
              ) : null}

              {renderSectionShell(
                accordionSections[11],
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Disbursal Decision</label>
                    <select
                      className="form-select"
                      value={decisionForm.disbursalDecisionStatus}
                      onChange={(e) =>
                        setDecisionForm((prev) => ({
                          ...prev,
                          disbursalDecisionStatus:
                            e.target.value as DisbursalDecisionOption,
                        }))
                      }
                      disabled={!canEditDisbursalDecisionSection || decisionLoading}
                    >
                      <option value="">Select decision</option>
                      <option value="DISBURSED">Disbursed</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Comment Box</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={decisionForm.disbursalComments}
                      onChange={(e) =>
                        setDecisionForm((prev) => ({
                          ...prev,
                          disbursalComments: e.target.value,
                        }))
                      }
                      placeholder="Enter disbursal officer comments"
                      disabled={!canEditDisbursalDecisionSection || decisionLoading}
                    />
                  </div>

                  {canEditDisbursalDecisionSection ? (
                    <div className="col-12 d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-primary cp-loan-btn-next"
                        onClick={handleSaveDisbursalDecision}
                        disabled={decisionLoading}
                      >
                        {decisionLoading ? "Saving..." : "Save"}
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          ) : null}

          {renderSectionShell(
            accordionSections[12],
            <div className="cp-loan-communication-stack">
              <div className="cp-loan-bank-card cp-loan-communication-form-card mb-0">
                <div className="cp-loan-bank-card-header">
                  <h6 className="cp-loan-bank-card-title mb-0">Push Communication</h6>
                </div>

                <form onSubmit={handleSendCommunication} className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Recipient Type</label>
                    <select
                      className="form-select"
                      value={communicationForm.recipientType}
                      onChange={(e) =>
                        setCommunicationForm((prev) => ({
                          ...prev,
                          recipientType: e.target.value,
                          recipientUserId: getRecipientUserId(e.target.value),
                        }))
                      }
                    >
                      {recipientOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Message Category</label>
                    <select
                      className="form-select"
                      value={communicationForm.messageCategory}
                      onChange={(e) =>
                        setCommunicationForm((prev) => ({
                          ...prev,
                          messageCategory: e.target.value,
                        }))
                      }
                    >
                      <option value="QUERY">QUERY</option>
                      <option value="DOCUMENT_REQUEST">DOCUMENT_REQUEST</option>
                      <option value="STATUS_UPDATE">STATUS_UPDATE</option>
                      <option value="INTERNAL_NOTE">INTERNAL_NOTE</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Message Text</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={communicationForm.messageText}
                      onChange={(e) =>
                        setCommunicationForm((prev) => ({
                          ...prev,
                          messageText: e.target.value,
                        }))
                      }
                      placeholder="Type your communication message"
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Attachments</label>
                    <label
                      htmlFor="communicationAttachmentInput"
                      className="cp-loan-upload-box"
                    >
                      <Paperclip className="cp-loan-upload-svg" />
                      <div className="cp-loan-upload-text">
                        Click to attach communication files
                      </div>
                    </label>

                    <input
                      id="communicationAttachmentInput"
                      className="d-none"
                      type="file"
                      multiple
                      onChange={(e) => {
                        const selectedFiles = Array.from(e.target.files || []).slice(0, 10);
                        registerSelectedFiles(selectedFiles);
                        e.currentTarget.value = "";
                      }}
                    />

                    {communicationForm.attachments.length > 0 ? (
                      <div className="cp-loan-selected-files mt-3">
                        {communicationForm.attachments.map((attachment, index) => (
                          <div
                            key={`${attachment.documentName}-${index}`}
                            className="cp-loan-selected-file"
                          >
                            <span className="cp-loan-selected-file-name">
                              {attachment.originalFileName}
                            </span>
                            <button
                              type="button"
                              className="cp-loan-selected-file-remove"
                              onClick={() => removeSelectedAttachment(index)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="col-12">
                    <button
                      type="submit"
                      className="btn btn-primary cp-loan-btn-next"
                      disabled={sendingCommunication}
                    >
                      <Send size={16} className="me-2" />
                      {sendingCommunication ? "Saving..." : "Push Communication"}
                    </button>
                  </div>
                </form>
              </div>
                            <div className="cp-loan-bank-card cp-loan-communication-history-card mb-0">
                <div className="cp-loan-bank-card-header cp-loan-history-header">
                  <h6 className="cp-loan-bank-card-title mb-0">
                    Communication History
                    {communicationLoading ? " (Loading...)" : ""}
                  </h6>

                  <button
                    type="button"
                    className="btn btn-outline-secondary cp-loan-history-refresh-btn"
                    onClick={fetchCommunicationHistory}
                    disabled={communicationLoading}
                  >
                    {communicationLoading ? "Loading..." : "Fetch Communication"}
                  </button>
                </div>

                <div className="cp-loan-table-wrap">
                  <div className="table-responsive">
                    <table className="table cp-loan-history-table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Sender</th>
                          <th>Recipient</th>
                          <th>Message Category</th>
                          <th>Message Text</th>
                          <th>Attachment Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {communicationHistory.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="cp-loan-table-empty">
                              No communication history loaded.
                            </td>
                          </tr>
                        ) : (
                          communicationHistory.map((item) => (
                            <tr key={item.messageId}>
                              <td>{formatDate(item.createdAt)}</td>
                              <td>{formatTime(item.createdAt)}</td>
                              <td>{item.senderType || "-"}</td>
                              <td>{item.recipientType || "-"}</td>
                              <td>{item.messageCategory || "-"}</td>
                              <td>{item.messageText || "-"}</td>
                              <td>
                                {item.attachments.length === 0 ? (
                                  <span className="cp-loan-note">No attachment</span>
                                ) : (
                                  <div className="d-flex flex-column gap-2">
                                    {item.attachments.map((attachment) => {
                                      const downloadInfo = getAttachmentDownloadInfo(attachment);

                                      if (downloadInfo.downloadable) {
                                        return (
                                          <div
                                            key={attachment.attachmentId}
                                            className="cp-loan-attachment-chip"
                                          >
                                            <a
                                              href={downloadInfo.href}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="cp-loan-attachment-link"
                                              download={
                                                downloadInfo.isLocal
                                                  ? downloadInfo.fileName
                                                  : undefined
                                              }
                                            >
                                              <Download size={14} />
                                              <span>{attachment.originalFileName || "-"}</span>
                                            </a>
                                          </div>
                                        );
                                      }

                                      if (downloadInfo.unavailableAfterRefresh) {
                                        return (
                                          <div
                                            key={attachment.attachmentId}
                                            className="cp-loan-attachment-chip"
                                          >
                                            <span className="cp-loan-note">
                                              {attachment.originalFileName || "-"} — Unavailable after refresh
                                            </span>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div
                                          key={attachment.attachmentId}
                                          className="cp-loan-attachment-chip"
                                        >
                                          <span>{attachment.originalFileName || "-"}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="cp-loan-footer">
            <div className="cp-loan-note d-flex align-items-center gap-2">
              <MapPin size={16} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}