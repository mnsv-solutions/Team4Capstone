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

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

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
  | ApiEnvelope<GetContactDetailsResponseDto>
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
  | ApiEnvelope<PersonalDetailsResponseDto>
  | PersonalDetailsResponseDto;

type EducationDetailsResponseDto = {
  highestEducation: string;
  fieldOfStudy: string;
  institutionName: string;
  graduationYear: string;
};

type EducationDetailsApiResponse =
  | ApiEnvelope<EducationDetailsResponseDto>
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
  bankAccounts?: FinancialBankAccount[];
  requestedLoanAmount?: string;
  requestedInterestRate?: string;
  requestedTenureMonths?: string;
  loanAmount?: string | number;
  interestRate?: string | number;
  tenure?: string | number;
};
type FinancialDetailsApiResponse =
  | ApiEnvelope<FinancialDetailsResponseDto>
  | FinancialDetailsResponseDto
  | ApiEnvelope<Record<string, unknown>>
  | Record<string, unknown>;

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
  | ApiEnvelope<GetDocumentDetailsResponseDto | DocumentDetailItemDto[]>
  | (DocumentDetailItemDto[] & unknown[]);

type ApplicationStatusResponseDto = {
  success?: boolean;
  applicationNumber?: string;
  statusCode?: string;
  statusName?: string;
  reasonCode?: string;
  message?: string;
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
  attachments?: CommunicationHistoryAttachment[];
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
  cibilRiskLevel: string;
  cibilDebtToIncomeEstimate: string;
  cibilCreditUtilizationRatio: string;
  cibilAverageAccountAgeYears: string;
  cibilTotalOutstandingBalance: string;
  cibilTotalAccounts: string;
  cibilActiveAccounts: string;
  cibilClosedAccounts: string;
  cibilReportDate: string;
  cibilReportTime: string;
  cibilReferenceId: string;

  requestedLoanAmount: string;
  requestedInterestRate: string;
  requestedTenureMonths: string;

  approvedLoanAmount: string;
  approvedInterestRate: string;
  approvedTenureMonths: string;

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
  disbursedAmount: string;
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
  disbursedAmount?: number;
  metadataJson?: Record<string, unknown>;
};

type AssignApplicationRequestDto = {
  applicationNumber: string;
  assignedTeamId: string;
  remarks: string;
};

type StageHistoryItem = {
  actionType?: string;
  remarks?: string;
  createdAt?: string;
  metadataJson?: Record<string, unknown> | null;
};

type FetchStageHistoryResponse =
  | ApiEnvelope<StageHistoryItem[]>
  | StageHistoryItem[];

const DISBURSAL_TEAM_ID = "3fa68ab1-df8e-4977-b7bb-837fe72e443f";

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
    label: "Completed / Rejected",
    activeLabel: "Completed / Rejected",
  },
];

const accordionSections = [
  { key: "personal", title: "Personal Details", icon: <UserRound size={18} /> },
  { key: "communication", title: "Communication Details", icon: <MessageSquare size={18} /> },
  { key: "education", title: "Education Details", icon: <GraduationCap size={18} /> },
  { key: "financial", title: "Financial Details", icon: <BriefcaseBusiness size={18} /> },
  { key: "bank", title: "Bank Details", icon: <Landmark size={18} /> },
  { key: "documents", title: "Document Details", icon: <FileText size={18} /> },
  { key: "cibil", title: "CIBIL Details", icon: <ShieldCheck size={18} /> },
  { key: "repayment", title: "Repayment Schedule Details", icon: <Calculator size={18} /> },
  { key: "ratios", title: "Loan Parameters", icon: <Calculator size={18} /> },
  { key: "eligibility", title: "Eligibility", icon: <ShieldCheck size={18} /> },
  { key: "underwriterReview", title: "Underwriter Decision", icon: <FileText size={18} /> },
  { key: "underwriterDecision", title: "Disbursal Decision", icon: <FileText size={18} /> },
  { key: "communicationHistory", title: "Communication History", icon: <MessageSquare size={18} /> },
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
  cibilRiskLevel: "",
  cibilDebtToIncomeEstimate: "",
  cibilCreditUtilizationRatio: "",
  cibilAverageAccountAgeYears: "",
  cibilTotalOutstandingBalance: "",
  cibilTotalAccounts: "",
  cibilActiveAccounts: "",
  cibilClosedAccounts: "",
  cibilReportDate: "",
  cibilReportTime: "",
  cibilReferenceId: "",

  requestedLoanAmount: "",
  requestedInterestRate: "",
  requestedTenureMonths: "",

  approvedLoanAmount: "",
  approvedInterestRate: "",
  approvedTenureMonths: "",

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
  disbursedAmount: "",
};

function createEmptyCibilFields(): Pick<
  ApplicationDetailsState,
  | "cibilScore"
  | "cibilRiskLevel"
  | "cibilDebtToIncomeEstimate"
  | "cibilCreditUtilizationRatio"
  | "cibilAverageAccountAgeYears"
  | "cibilTotalOutstandingBalance"
  | "cibilTotalAccounts"
  | "cibilActiveAccounts"
  | "cibilClosedAccounts"
  | "cibilReportDate"
  | "cibilReportTime"
  | "cibilReferenceId"
> {
  return {
    cibilScore: "",
    cibilRiskLevel: "",
    cibilDebtToIncomeEstimate: "",
    cibilCreditUtilizationRatio: "",
    cibilAverageAccountAgeYears: "",
    cibilTotalOutstandingBalance: "",
    cibilTotalAccounts: "",
    cibilActiveAccounts: "",
    cibilClosedAccounts: "",
    cibilReportDate: "",
    cibilReportTime: "",
    cibilReferenceId: "",
  };
}
function createEmptyLoanParameterFields(): Pick<
  ApplicationDetailsState,
  | "emiAmount"
  | "totalRepayment"
  | "interestAmount"
  | "scheduleStartDate"
  | "scheduleEndDate"
  | "foirRatio"
  | "dtiRatio"
  | "ltvRatio"
  | "dscrRatio"
  | "eligibilityStatus"
  | "eligibilityMessage"
> {
  return {
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
  };
}

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

function parseNumberValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value ?? "").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: string | number | null | undefined) {
  const parsed = parseNumberValue(value);
  return parsed.toFixed(2);
}

function formatPercentLikeValue(value: string | number | null | undefined) {
  const parsed = parseNumberValue(value);
  if (!Number.isFinite(parsed)) return "";
  return String(parsed);
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDateTime(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
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
  return path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/");
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

function extractApiData<T>(response: ApiEnvelope<T> | T | null | undefined): T | null {
  if (!response) return null;

  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    typeof (response as ApiEnvelope<T>).data !== "undefined"
  ) {
    return ((response as ApiEnvelope<T>).data ?? null) as T | null;
  }

  return response as T;
}

function extractContactDetailsResponse(
  response: ContactDetailsApiResponse
): GetContactDetailsResponseDto | null {
  const data = extractApiData<GetContactDetailsResponseDto>(response);
  return data && "email" in data ? data : null;
}

function extractPersonalDetailsResponse(
  response: PersonalDetailsApiResponse
): PersonalDetailsResponseDto | null {
  const data = extractApiData<PersonalDetailsResponseDto>(response);
  return data && "firstName" in data ? data : null;
}

function extractEducationDetailsResponse(
  response: EducationDetailsApiResponse
): EducationDetailsResponseDto | null {
  const data = extractApiData<EducationDetailsResponseDto>(response);
  return data && "highestEducation" in data ? data : null;
}
function extractFinancialDetailsResponse(
  response: FinancialDetailsApiResponse
): FinancialDetailsResponseDto | null {
  const data = extractApiData<Record<string, unknown> | FinancialDetailsResponseDto>(response);

  if (!data || typeof data !== "object") return null;

  const source = data as Record<string, unknown>;

  return {
    employmentStatus: String(source.employmentStatus ?? source.employment_status ?? ""),
    employerName: String(source.employerName ?? source.employer_name ?? ""),
    jobTitle: String(source.jobTitle ?? source.job_title ?? ""),
    workExperience: String(source.workExperience ?? source.work_experience ?? ""),
    monthlyIncome: String(source.monthlyIncome ?? source.monthly_income ?? ""),
    otherIncomeSources: String(
      source.otherIncomeSources ?? source.other_income_sources ?? ""
    ),
    existingLoans: String(source.existingLoans ?? source.existing_loans ?? ""),
    totalMonthlyLoanPayments: String(
      source.totalMonthlyLoanPayments ?? source.total_monthly_loan_payments ?? ""
    ),
    tenureMonths: String(
      source.tenureMonths ??
        source.tenure_months ??
        source.requestedTenureMonths ??
        source.requested_tenure_months ??
        source.tenure ??
        ""
    ),
    requestedLoanAmount: String(
      source.requestedLoanAmount ??
        source.requestedAmount ??
        source.requested_loan_amount ??
        source.requested_amount ??
        source.loanAmount ??
        source.loan_amount ??
        ""
    ),
    requestedInterestRate: String(
      source.requestedInterestRate ??
        source.interestRate ??
        source.requested_interest_rate ??
        source.interest_rate ??
        ""
    ),
    requestedTenureMonths: String(
      source.requestedTenureMonths ??
        source.requested_tenure_months ??
        source.tenureMonths ??
        source.tenure_months ??
        source.tenure ??
        ""
    ),
    bankAccounts: Array.isArray(source.bankAccounts)
      ? (source.bankAccounts as FinancialBankAccount[])
      : Array.isArray(source.bank_accounts)
        ? (source.bank_accounts as FinancialBankAccount[])
        : [],
    loanAmount:
      (source.approvedLoanAmount as string | number | undefined) ??
      (source.loanAmount as string | number | undefined),
    interestRate:
      (source.approvedInterestRate as string | number | undefined) ??
      (source.interestRate as string | number | undefined),
    tenure:
      (source.approvedTenureMonths as string | number | undefined) ??
      (source.tenure as string | number | undefined),
  };
}

function extractDocumentDetailsResponse(
  response: DocumentDetailsApiResponse
): DocumentDetailItemDto[] {
  if (!response) return [];

  if (Array.isArray(response)) {
    return response;
  }

  const extracted = extractApiData<GetDocumentDetailsResponseDto | DocumentDetailItemDto[]>(
    response as ApiEnvelope<GetDocumentDetailsResponseDto | DocumentDetailItemDto[]>
  );

  if (!extracted) return [];

  if (Array.isArray(extracted)) {
    return extracted;
  }

  if ("documents" in extracted && Array.isArray(extracted.documents)) {
    return extracted.documents;
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

  const extracted = extractApiData<StageHistoryItem[]>(response);
  return Array.isArray(extracted) ? extracted : [];
}

function extractCreditDetailsResponse(
  response: FetchCreditDetailsApiResponse
): FetchCreditDetailsResponseDto | null {
  const data = extractApiData<FetchCreditDetailsResponseDto>(response);
  return data && typeof data === "object" ? data : null;
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

  if (raw.includes("DISBURSAL_COMPLETED") || raw.includes("DISBURSED")) {
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
      return normalizedStatus ? normalizedStatus.replace(/_/g, " ") : "Status Pending";
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
  return role === "UNDERWRITER" || role === "DISBURSAL_OFFICER" || role === "ADMIN";
}

function canEditDocuments(role: UserRole): boolean {
  return role === "UNDERWRITER" || role === "DISBURSAL_OFFICER" || role === "ADMIN";
}

function canSaveDocumentVerification(role: UserRole): boolean {
  return role === "UNDERWRITER" || role === "DISBURSAL_OFFICER" || role === "ADMIN";
}

function canSeeUnderwriterDecision(role: UserRole): boolean {
  return role === "UNDERWRITER" || role === "DISBURSAL_OFFICER" || role === "ADMIN";
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

function getResolvedLoanParameterRequest(
  details: ApplicationDetailsState
): FetchLoanParametersRequestDto | null {
  const approvedLoanAmount = parseNumberValue(details.approvedLoanAmount);
  const approvedInterestRate = parseNumberValue(details.approvedInterestRate);
  const approvedTenureMonths = parseNumberValue(details.approvedTenureMonths);

  const requestedLoanAmount = parseNumberValue(details.requestedLoanAmount);
  const requestedInterestRate = parseNumberValue(details.requestedInterestRate);
  const requestedTenureMonths = parseNumberValue(
    details.requestedTenureMonths || details.tenureMonths
  );

  const hasAnyApprovedValue =
    approvedLoanAmount > 0 || approvedInterestRate > 0 || approvedTenureMonths > 0;

  const loanAmount = hasAnyApprovedValue
    ? approvedLoanAmount || requestedLoanAmount
    : requestedLoanAmount;

  const interestRate = hasAnyApprovedValue
    ? approvedInterestRate || requestedInterestRate
    : requestedInterestRate;

  const tenureMonths = hasAnyApprovedValue
    ? approvedTenureMonths || requestedTenureMonths
    : requestedTenureMonths;

  if (
    !details.applicationNumber.trim() ||
    loanAmount <= 0 ||
    interestRate <= 0 ||
    tenureMonths <= 0
  ) {
    return null;
  }

  return {
    applicationNumber: details.applicationNumber.trim(),
    loanAmount,
    interestRate,
    tenureMonths,
  };
}

function escapeCsvValue(value: string | number | null | undefined) {
  const safe = String(value ?? "");
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function downloadRepaymentScheduleCsv(
  applicationNumber: string,
  installments: LoanInstallmentDto[]
) {
  if (!installments.length) return;

  const headers = [
    "Installment Number",
    "Due Date",
    "Opening Balance",
    "Principal Component",
    "Interest Component",
    "Installment Amount",
    "Closing Balance",
    "Paid Amount",
    "Payment Status",
    "Paid Date",
  ];

  const rows = installments.map((item) => [
    item.installmentNumber ?? "",
    item.dueDate ? formatDate(item.dueDate) : "",
    formatMoney(item.openingBalance),
    formatMoney(item.principalComponent),
    formatMoney(item.interestComponent),
    formatMoney(item.installmentAmount),
    formatMoney(item.closingBalance),
    formatMoney(item.paidAmount),
    item.paymentStatus ?? "",
    item.paidDate ? formatDate(item.paidDate) : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${applicationNumber || "repayment-schedule"}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
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

  const [repaymentSchedule, setRepaymentSchedule] = useState<LoanInstallmentDto[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>("UNKNOWN");
  const [roleLoading, setRoleLoading] = useState(false);

  const [decisionForm, setDecisionForm] = useState<DecisionFormState>(initialDecisionForm);
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
    cibil: true,
    repayment: true,
    ratios: true,
    eligibility: true,
    underwriterReview: false,
    underwriterDecision: false,
    communicationHistory: true,
  });

  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [documentSuccess, setDocumentSuccess] = useState("");

  const [creditLoading, setCreditLoading] = useState(false);
  const [creditError, setCreditError] = useState("");

  const [loanParametersLoading, setLoanParametersLoading] = useState(false);
  const [loanParametersError, setLoanParametersError] = useState("");

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

  const resolvedLoanRequest = useMemo(
    () => getResolvedLoanParameterRequest(details),
    [
      details.applicationNumber,
      details.approvedLoanAmount,
      details.approvedInterestRate,
      details.approvedTenureMonths,
      details.requestedLoanAmount,
      details.requestedInterestRate,
      details.requestedTenureMonths,
      details.tenureMonths,
    ]
  );
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
    }
  }

  async function fetchDocumentDetails() {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    try {
      setDocumentLoading(true);
      setDocumentError("");
      setDocumentSuccess("");

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
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setDocumentError("Failed to fetch document details.");
    } finally {
      setDocumentLoading(false);
    }
  }

  async function fetchCreditDetails() {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    try {
      setCreditLoading(true);
      setCreditError("");

      setDetails((prev) => ({
        ...prev,
        ...createEmptyCibilFields(),
      }));

      const response = await axios.post<FetchCreditDetailsApiResponse>(
        "/api/application/fetch-credit-details",
        {
          applicationNumber: details.applicationNumber.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const creditData = extractCreditDetailsResponse(response.data);

      if (!creditData) {
        setCreditError("Credit details were not returned for this application.");
        return;
      }

      setDetails((prev) => ({
        ...prev,
        cibilScore:
          typeof creditData.score !== "undefined" ? String(creditData.score) : "",
        cibilRiskLevel: creditData.risk_level || "",
        cibilDebtToIncomeEstimate: creditData.debt_to_income_estimate || "",
        cibilCreditUtilizationRatio: creditData.credit_utilization_ratio || "",
        cibilAverageAccountAgeYears: creditData.average_account_age_years || "",
        cibilTotalOutstandingBalance:
          typeof creditData.total_outstanding_balance !== "undefined"
            ? String(creditData.total_outstanding_balance)
            : "",
        cibilTotalAccounts:
          typeof creditData.total_accounts !== "undefined"
            ? String(creditData.total_accounts)
            : "",
        cibilActiveAccounts:
          typeof creditData.active_accounts !== "undefined"
            ? String(creditData.active_accounts)
            : "",
        cibilClosedAccounts:
          typeof creditData.closed_accounts !== "undefined"
            ? String(creditData.closed_accounts)
            : "",
        cibilReportDate: creditData.report_date || "",
        cibilReportTime: creditData.report_time || "",
        cibilReferenceId: creditData.reference_id || "",
      }));
    } catch (error) {
      console.error("Failed to fetch credit details:", error);

      setDetails((prev) => ({
        ...prev,
        ...createEmptyCibilFields(),
      }));

      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setCreditError("Credit check record not found for this application.");
      } else {
        setCreditError("Failed to fetch CIBIL details.");
      }
    } finally {
      setCreditLoading(false);
    }
  }

  async function fetchLoanParameters() {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    const payload = getResolvedLoanParameterRequest(details);

    if (!payload) {
      setRepaymentSchedule([]);
      setDetails((prev) => ({
        ...prev,
        ...createEmptyLoanParameterFields(),
      }));
      setLoanParametersError("Loan parameters request was not sent.");
      return;
    }

    try {
      setLoanParametersLoading(true);
      setLoanParametersError("");

      const response = await axios.post<FetchLoanParametersResponseDto>(
        "/api/application/fetch-loan-parameters",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const loanData = response.data;

      const schedule = loanData?.repaymentSchedule;
      const installments = Array.isArray(schedule?.installments)
        ? schedule.installments
        : [];

      setRepaymentSchedule(installments);

      const firstInstallment = installments[0];
      const lastInstallment = installments[installments.length - 1];

      const emiAmount = schedule?.emi || 0;
      const totalInstallments = schedule?.totalInstallments || installments.length || 0;
      const totalRepayment = emiAmount * totalInstallments;
      const interestAmount =
        totalRepayment > 0 && payload.loanAmount > 0
          ? totalRepayment - payload.loanAmount
          : 0;

      const eligibilityReasons = Array.isArray(loanData?.eligibility?.reasons)
        ? loanData.eligibility.reasons.join("\n")
        : loanData?.eligibility?.message || "";

      setDetails((prev) => ({
        ...prev,
        emiAmount: emiAmount ? emiAmount.toFixed(2) : "",
        totalRepayment: totalRepayment ? totalRepayment.toFixed(2) : "",
        interestAmount: interestAmount ? interestAmount.toFixed(2) : "",
        scheduleStartDate: firstInstallment?.dueDate || "",
        scheduleEndDate: lastInstallment?.dueDate || "",
        foirRatio:
          typeof loanData?.ratios?.dbr !== "undefined"
            ? String(loanData.ratios.dbr)
            : "",
        dtiRatio:
          typeof loanData?.ratios?.emiToIncome !== "undefined"
            ? String(loanData.ratios.emiToIncome)
            : "",
        ltvRatio:
          typeof loanData?.ratios?.creditUtilization !== "undefined"
            ? String(loanData.ratios.creditUtilization)
            : "",
        dscrRatio:
          typeof loanData?.ratios?.loanToIncome !== "undefined"
            ? String(loanData.ratios.loanToIncome)
            : "",
        eligibilityStatus: loanData?.eligibility?.eligibilityStatus || "",
        eligibilityMessage: eligibilityReasons,
      }));
    } catch (error) {
      console.error("Failed to fetch loan parameters:", error);

      setRepaymentSchedule([]);
      setDetails((prev) => ({
        ...prev,
        ...createEmptyLoanParameterFields(),
      }));

      setLoanParametersError("Failed to fetch loan parameters.");
    } finally {
      setLoanParametersLoading(false);
    }
  }

  async function saveDocumentVerification() {
    if (!token || !isDocumentVerificationSavable) return;

    try {
      const verifiedDocs = details.documentRows
        .filter((doc) => doc.verificationStatus === "VERIFIED")
        .map((doc) => ({
          documentType: doc.documentType,
          fileName: doc.fileName,
        }));

      await axios.post(
        "/api/application/document-verify",
        {
          applicationNumber: details.applicationNumber.trim(),
          documents: verifiedDocs,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDocumentSuccess("Document verification saved successfully.");
      await fetchDocumentDetails();
    } catch (error) {
      console.error("Verification error:", error);
      setDocumentError("Failed to save verification.");
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

      console.log("financial-details raw response", response.data);
      console.log("financial-details mapped response", financialData);

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
        tenureMonths:
          financialData.tenureMonths || String(financialData.tenure ?? "") || "",

        requestedLoanAmount:
          financialData.requestedLoanAmount ||
          String(financialData.loanAmount ?? "") ||
          "",

        requestedInterestRate:
          financialData.requestedInterestRate ||
          String(financialData.interestRate ?? "") ||
          "",

        approvedLoanAmount:
          String((response.data as any)?.approvedLoanAmount ?? ""),

        approvedInterestRate:
          String((response.data as any)?.approvedInterestRate ?? ""),

        approvedTenureMonths:
          String((response.data as any)?.approvedTenureMonths ?? ""),

        requestedTenureMonths:
          financialData.requestedTenureMonths ||
          financialData.tenureMonths ||
          String(financialData.tenure ?? "") ||
          "",

        bankAccounts: Array.isArray(financialData.bankAccounts)
          ? financialData.bankAccounts
          : [],
      }));
    } catch (error) {
      console.error("Failed to fetch financial details:", error);
    }
  }
    useEffect(() => {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    fetchPersonalDetails();
    fetchContactDetails();
    fetchEducationDetails();
    fetchFinancialDetails();
    fetchDocumentDetails();
    fetchCreditDetails();
  }, [token, details.applicationNumber]);

  useEffect(() => {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;
    if (!details.dob) return;

    fetchApplicationStatus();
  }, [token, details.applicationNumber, details.dob]);

  useEffect(() => {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    fetchLoanParameters();
  }, [
    token,
    details.applicationNumber,
    details.approvedLoanAmount,
    details.approvedInterestRate,
    details.approvedTenureMonths,
    details.requestedLoanAmount,
    details.requestedInterestRate,
    details.requestedTenureMonths,
    details.tenureMonths,
  ]);

  function toggleSection(section: AccordionKey) {
    if (!visibleSections.includes(section)) return;

    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function expandAllSections() {
    setOpenSections((prev) => {
      const next = { ...prev };

      visibleSections.forEach((sectionKey) => {
        next[sectionKey] = true;
      });

      return next;
    });
  }

  function collapseAllSections() {
    setOpenSections((prev) => {
      const next = { ...prev };

      visibleSections.forEach((sectionKey) => {
        next[sectionKey] = false;
      });

      return next;
    });
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

    const rows = response.data?.data?.communications ?? [];

    return rows.map((item) => ({
      ...item,
      attachments: Array.isArray(item.attachments) ? item.attachments : [],
    }));
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
      underwriterComments: latestUnderwriter?.remarks || prev.underwriterComments,
      disbursalDecisionStatus:
        latestDisbursal?.actionType === "DISBURSAL_COMPLETED"
          ? "DISBURSED"
          : latestDisbursal?.actionType === "DISBURSAL_REJECTED"
            ? "REJECTED"
            : prev.disbursalDecisionStatus,
      disbursalComments: latestDisbursal?.remarks || prev.disbursalComments,
      disbursedAmount:
        latestDisbursal?.metadataJson &&
        typeof latestDisbursal.metadataJson["disbursedAmount"] !== "undefined"
          ? String(latestDisbursal.metadataJson["disbursedAmount"])
          : prev.disbursedAmount,
    }));
  }

  function getApprovedLoanAmountForStage(): number {
    const payload = getResolvedLoanParameterRequest(details);
    return payload?.loanAmount && payload.loanAmount > 0 ? payload.loanAmount : 1;
  }

  function getApprovedInterestRateForStage(): number {
    const payload = getResolvedLoanParameterRequest(details);
    return payload?.interestRate && payload.interestRate > 0 ? payload.interestRate : 1;
  }

  function getApprovedTenureMonthsForStage(): number {
    const payload = getResolvedLoanParameterRequest(details);
    return payload?.tenureMonths && payload.tenureMonths > 0 ? payload.tenureMonths : 1;
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

  async function assignToDisbursalTeam() {
    if (!token) return;

    const payload: AssignApplicationRequestDto = {
      applicationNumber: details.applicationNumber.trim(),
      assignedTeamId: DISBURSAL_TEAM_ID,
      remarks: "Assigned to Disbursal Team",
    };

    await axios.post("/api/application/assign", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function handleSaveUnderwriterDecision() {
    if (!canEditUnderwriterDecisionSection) {
      setDecisionError("Only underwriter can save underwriter decision.");
      return;
    }

    if (!decisionForm.underwriterDecisionStatus) {
      setDecisionError("Please select underwriter decision.");
      return;
    }

    if (!decisionForm.underwriterComments.trim()) {
      setDecisionError("Please enter comments.");
      return;
    }

    if (!isValidApplicationNumber(details.applicationNumber)) {
      setDecisionError("Invalid application number.");
      return;
    }

    const approvedTenureMonths = getApprovedTenureMonthsForStage();
    const approvedEmi = Math.max(1, parseNumberValue(details.emiAmount));
    const approvedLoanAmount = getApprovedLoanAmountForStage();
    const approvedInterestRate = getApprovedInterestRateForStage();

    if (approvedLoanAmount <= 0) {
      setDecisionError("Approved loan amount must be greater than 0.");
      return;
    }

    if (approvedInterestRate <= 0) {
      setDecisionError("Approved interest rate must be greater than 0.");
      return;
    }

    if (approvedTenureMonths <= 0) {
      setDecisionError("Approved tenure months must be greater than 0.");
      return;
    }

    if (approvedEmi <= 0) {
      setDecisionError("Approved EMI must be greater than 0.");
      return;
    }

    try {
      setDecisionLoading(true);
      setDecisionError("");
      setDecisionSuccess("");
      setUnderwriterSavedMessage("");
      setDisbursalSavedMessage("");

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
          riskLevel: details.cibilRiskLevel || "LOW",
          bureauStatus: "SUCCESS",
          scoreBand: details.cibilScore || "700-749",
          note: decisionForm.underwriterComments.trim(),
        },
      });

      if (decisionForm.underwriterDecisionStatus === "APPROVED") {
        await assignToDisbursalTeam();
      }

      const message = `${COMMUNICATION_PROPERTIES.UNDERWRITER_COMMENTS || ""}${
        COMMUNICATION_PROPERTIES.UNDERWRITER_COMMENTS ? " " : ""
      }${decisionForm.underwriterComments.trim()}`;

      await pushDecisionMessage(message);
      await fetchApplicationStatus();
      await hydrateDecisionStateFromStageHistory();
      await fetchCommunicationHistory();

      setDecisionSuccess("Underwriter decision saved successfully.");
      setUnderwriterSavedMessage("Underwriter decision saved successfully.");
    } catch (error: any) {
      setDecisionError(
        error?.response?.data?.message || "Failed to save underwriter decision."
      );
    } finally {
      setDecisionLoading(false);
    }
  }

  async function handleSaveDisbursalDecision() {
    if (!canEditDisbursalDecisionSection) {
      setDecisionError("Only disbursal officer can save disbursal decision.");
      return;
    }

    if (!decisionForm.disbursalDecisionStatus) {
      setDecisionError("Please select disbursal decision.");
      return;
    }

    if (!decisionForm.disbursalComments.trim()) {
      setDecisionError("Please enter comments.");
      return;
    }

    if (!isValidApplicationNumber(details.applicationNumber)) {
      setDecisionError("Invalid application number.");
      return;
    }

    const approvedTenureMonths = getApprovedTenureMonthsForStage();
    const approvedEmi = Math.max(1, parseNumberValue(details.emiAmount));
    const approvedLoanAmount = getApprovedLoanAmountForStage();
    const approvedInterestRate = getApprovedInterestRateForStage();
    const disbursedAmount = parseNumberValue(decisionForm.disbursedAmount);

    if (approvedLoanAmount <= 0) {
      setDecisionError("Approved loan amount must be greater than 0.");
      return;
    }

    if (approvedInterestRate <= 0) {
      setDecisionError("Approved interest rate must be greater than 0.");
      return;
    }

    if (approvedTenureMonths <= 0) {
      setDecisionError("Approved tenure months must be greater than 0.");
      return;
    }

    if (approvedEmi <= 0) {
      setDecisionError("Approved EMI must be greater than 0.");
      return;
    }

    if (
      decisionForm.disbursalDecisionStatus === "DISBURSED" &&
      disbursedAmount <= 0
    ) {
      setDecisionError("Please enter disbursed amount.");
      return;
    }

    try {
      setDecisionLoading(true);
      setDecisionError("");
      setDecisionSuccess("");
      setUnderwriterSavedMessage("");
      setDisbursalSavedMessage("");

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
        disbursedAmount:
          decisionForm.disbursalDecisionStatus === "DISBURSED"
            ? disbursedAmount
            : undefined,
        metadataJson: {
          decision: decisionForm.disbursalDecisionStatus,
          note: decisionForm.disbursalComments.trim(),
          disbursedAmount:
            decisionForm.disbursalDecisionStatus === "DISBURSED"
              ? disbursedAmount
              : undefined,
        },
      });

      const message = `${COMMUNICATION_PROPERTIES.DISBURSAL_COMMENTS || ""}${
        COMMUNICATION_PROPERTIES.DISBURSAL_COMMENTS ? " " : ""
      }${decisionForm.disbursalComments.trim()}`;

      await pushDecisionMessage(message);
      await fetchApplicationStatus();
      await hydrateDecisionStateFromStageHistory();
      await fetchCommunicationHistory();

      setDecisionSuccess("Disbursal decision saved successfully.");
      setDisbursalSavedMessage("Disbursal decision saved successfully.");
    } catch (error: any) {
      setDecisionError(
        error?.response?.data?.message || "Failed to save disbursal decision."
      );
    } finally {
      setDecisionLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    hydrateDecisionStateFromStageHistory();
  }, [token, details.applicationNumber]);

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
    value: string | number | boolean | null | undefined,
    colClassName = "col-12 col-md-4"
  ) {
    return (
      <div className={colClassName}>
        <label className="form-label fw-semibold">{label}</label>
        <input className="form-control" value={String(value ?? "")} readOnly />
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

        <div className="d-flex flex-column align-items-end gap-3">
          <button
            type="button"
            className="btn cp-loan-btn-back"
            onClick={() => router.back()}
          >
            ← Back
          </button>

          <button
            type="button"
            className="btn cp-loan-btn-back"
            onClick={expandAllSections}
          >
            Expand All
          </button>

          <button
            type="button"
            className="btn cp-loan-btn-back"
            onClick={collapseAllSections}
          >
            Collapse All
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
              const isCurrent = activeStatusIndex === index;
              const isReached = activeStatusIndex >= index;

              const isRejectedStep =
                (normalizedApplicationStatus === "UNDERWRITER_REJECTED" &&
                  step.key === "UNDERWRITER_DECISION") ||
                (normalizedApplicationStatus === "DISBURSAL_REJECTED" &&
                  step.key === "DISBURSAL_DECISION");

              const isCompleted =
                isReached &&
                !isRejectedStep &&
                normalizedApplicationStatus !== "UNDERWRITER_REJECTED" &&
                normalizedApplicationStatus !== "DISBURSAL_REJECTED";

              return (
                <div key={step.key} className="cp-app-status-step">
                  <div
                    className={`cp-app-status-circle ${
                      isRejectedStep
                        ? "rejected"
                        : isCompleted
                          ? "completed"
                          : "pending"
                    }`}
                  >
                    {isRejectedStep ? (
                      <XCircle className="cp-app-status-icon" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="cp-app-status-icon" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className={`cp-app-status-label ${isReached ? "active" : ""}`}>
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
          

          {renderSectionShell(
            accordionSections[0],
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">First Name</label>
                <input className="form-control" value={details.firstName} readOnly />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Last Name</label>
                <input className="form-control" value={details.lastName} readOnly />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Date of Birth</label>
                <input type="date" className="form-control" value={details.dob} readOnly />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Gender</label>
                <input className="form-control" value={details.gender} readOnly />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Marital Status</label>
                <input className="form-control" value={details.maritalStatus} readOnly />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Nationality</label>
                <input className="form-control" value={details.nationality} readOnly />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Government ID Type</label>
                <input className="form-control" value={details.governmentIdType} readOnly />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Government ID Number</label>
                <input className="form-control" value={details.governmentIdNumber} readOnly />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">SIN / Tax ID</label>
                <input className="form-control" value={details.sinTaxId} readOnly />
              </div>
            </div>
          )}

          {renderSectionShell(
            accordionSections[1],
            <div className="row g-3">
              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Email Address</label>
                <input className="form-control" value={details.email} readOnly />
              </div>

              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Mobile Number</label>
                <input className="form-control" value={details.mobile} readOnly />
              </div>

              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Alternate Phone</label>
                <input className="form-control" value={details.alternatePhone} readOnly />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Residential Address Line 1</label>
                <input className="form-control" value={details.residentialLine1} readOnly />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Residential Address Line 2</label>
                <input className="form-control" value={details.residentialLine2} readOnly />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential City</label>
                <input className="form-control" value={details.residentialCity} readOnly />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential Province / State</label>
                <input className="form-control" value={details.residentialState} readOnly />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential Postal Code</label>
                <input className="form-control" value={details.residentialPostalCode} readOnly />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential Country</label>
                <input className="form-control" value={details.residentialCountry} readOnly />
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    id="mailingSameAsResidential"
                    className="form-check-input"
                    type="checkbox"
                    checked={details.mailingSameAsResidential}
                    readOnly
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
                    <input className="form-control" value={details.mailingLine1} readOnly />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Mailing Address Line 2</label>
                    <input className="form-control" value={details.mailingLine2} readOnly />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing City</label>
                    <input className="form-control" value={details.mailingCity} readOnly />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing Province / State</label>
                    <input className="form-control" value={details.mailingState} readOnly />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing Postal Code</label>
                    <input className="form-control" value={details.mailingPostalCode} readOnly />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing Country</label>
                    <input className="form-control" value={details.mailingCountry} readOnly />
                  </div>
                </>
              ) : null}
            </div>
          )}

          {renderSectionShell(
            accordionSections[2],
            <div className="row g-3">
              {renderStaticField("Highest Education", details.highestEducation)}
              {renderStaticField("Field of Study", details.fieldOfStudy)}
              {renderStaticField("Institution Name", details.institutionName)}
              {renderStaticField("Graduation Year", details.graduationYear)}
            </div>
          )}

          {renderSectionShell(
            accordionSections[3],
            <div className="row g-3">
              {renderStaticField("Employment Status", details.employmentStatus)}
              {renderStaticField("Employer Name", details.employerName)}
              {renderStaticField("Job Title", details.jobTitle)}
              {renderStaticField("Work Experience", details.workExperience)}
              {renderStaticField("Monthly Income", details.monthlyIncome)}
              {renderStaticField("Other Income Sources", details.otherIncomeSources)}
              {renderStaticField("Existing Loans", details.existingLoans)}
              {renderStaticField(
                "Total Monthly Loan Payments",
                details.totalMonthlyLoanPayments
              )}
              {renderStaticField("Tenure (Months)", details.tenureMonths)}
              {renderStaticField("Loan Amount", details.requestedLoanAmount)}
              {renderStaticField("Interest Rate", details.requestedInterestRate)}
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
            creditLoading ? (
              <div className="cp-loan-note">Loading CIBIL details...</div>
            ) : !details.cibilScore && !details.cibilReferenceId ? (
              <div className="alert alert-warning mb-0">
                Credit check record not found for this application.
              </div>
            ) : (
              <div className="row g-3">
                {renderStaticField("Score", details.cibilScore, "col-12 col-md-6")}
                {renderStaticField("Risk Level", details.cibilRiskLevel, "col-12 col-md-6")}
                {renderStaticField(
                  "Debt To Income Estimate",
                  details.cibilDebtToIncomeEstimate,
                  "col-12 col-md-6"
                )}
                {renderStaticField(
                  "Credit Utilization Ratio",
                  details.cibilCreditUtilizationRatio,
                  "col-12 col-md-6"
                )}
                {renderStaticField(
                  "Average Account Age (Years)",
                  details.cibilAverageAccountAgeYears,
                  "col-12 col-md-6"
                )}
                {renderStaticField(
                  "Total Outstanding Balance",
                  details.cibilTotalOutstandingBalance,
                  "col-12 col-md-6"
                )}
                {renderStaticField(
                  "Total Accounts",
                  details.cibilTotalAccounts,
                  "col-12 col-md-4"
                )}
                {renderStaticField(
                  "Active Accounts",
                  details.cibilActiveAccounts,
                  "col-12 col-md-4"
                )}
                {renderStaticField(
                  "Closed Accounts",
                  details.cibilClosedAccounts,
                  "col-12 col-md-4"
                )}
                {renderStaticField(
                  "Report Date",
                  formatDate(details.cibilReportDate),
                  "col-12 col-md-4"
                )}
                {renderStaticField(
                  "Report Time",
                  details.cibilReportTime ? formatDateTime(details.cibilReportTime) : "",
                  "col-12 col-md-4"
                )}
                {renderStaticField(
                  "Reference ID",
                  details.cibilReferenceId,
                  "col-12 col-md-4"
                )}
              </div>
            )
          )}

          {renderSectionShell(
            accordionSections[7],
            <div className="d-flex flex-column gap-4">
              <div className="row g-3">
                {renderStaticField("EMI Amount", details.emiAmount)}
                {renderStaticField("Total Repayment", details.totalRepayment)}
                {renderStaticField("Interest Amount", details.interestAmount)}
                {renderStaticField(
                  "Schedule Start Date",
                  formatDate(details.scheduleStartDate)
                )}
                {renderStaticField("Schedule End Date", formatDate(details.scheduleEndDate))}
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-primary cp-loan-btn-next"
                  onClick={() =>
                    downloadRepaymentScheduleCsv(
                      details.applicationNumber,
                      repaymentSchedule
                    )
                  }
                  disabled={repaymentSchedule.length === 0}
                  style={{ color: "#ffffff" }}
                >
                  <Download size={16} className="me-2" />
                  Export Repayment Schedule
                </button>
              </div>

              {loanParametersLoading ? (
                <div className="cp-loan-note">Loading repayment schedule...</div>
              ) : (
                <div className="cp-loan-table-scroll-box">
                  <div className="cp-loan-table-wrap">
                    <table className="table cp-loan-history-table align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Installment #</th>
                          <th>Due Date</th>
                          <th>Opening Balance</th>
                          <th>Principal</th>
                          <th>Interest</th>
                          <th>Installment Amount</th>
                          <th>Closing Balance</th>
                          <th>Paid Amount</th>
                          <th>Status</th>
                          <th>Paid Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repaymentSchedule.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="cp-loan-table-empty">
                              No repayment schedule available.
                            </td>
                          </tr>
                        ) : (
                          repaymentSchedule.map((installment, index) => (
                            <tr
                              key={`${
                                installment.scheduleId ||
                                installment.installmentNumber ||
                                "installment"
                              }-${index}`}
                            >
                              <td>{installment.installmentNumber ?? "-"}</td>
                              <td>{installment.dueDate ? formatDate(installment.dueDate) : "-"}</td>
                              <td>{formatMoney(installment.openingBalance)}</td>
                              <td>{formatMoney(installment.principalComponent)}</td>
                              <td>{formatMoney(installment.interestComponent)}</td>
                              <td>{formatMoney(installment.installmentAmount)}</td>
                              <td>{formatMoney(installment.closingBalance)}</td>
                              <td>{formatMoney(installment.paidAmount)}</td>
                              <td>{installment.paymentStatus || "-"}</td>
                              <td>{installment.paidDate ? formatDate(installment.paidDate) : "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
                    {renderSectionShell(
            accordionSections[8],
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Approved Loan Amount</label>
                <input
                  className="form-control"
                  value={details.approvedLoanAmount}
                  onChange={(e) => updateDetail("approvedLoanAmount", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Approved Interest Rate</label>
                <input
                  className="form-control"
                  value={details.approvedInterestRate}
                  onChange={(e) => updateDetail("approvedInterestRate", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Approved Tenure Months</label>
                <input
                  className="form-control"
                  value={details.approvedTenureMonths}
                  onChange={(e) => updateDetail("approvedTenureMonths", e.target.value)}
                  disabled={!isMainFieldsEditable}
                />
              </div>

              {renderStaticField(
                "Requested Loan Amount",
                details.requestedLoanAmount || "-"
              )}
              {renderStaticField(
                "Requested Interest Rate",
                details.requestedInterestRate || "-"
              )}
              {renderStaticField(
                "Requested Tenure Months",
                details.requestedTenureMonths || details.tenureMonths || "-"
              )}

              {renderStaticField(
                "Loan Amount (Request Sent)",
                resolvedLoanRequest?.loanAmount ?? ""
              )}
              {renderStaticField(
                "Interest Rate (Request Sent)",
                resolvedLoanRequest?.interestRate ?? ""
              )}
              {renderStaticField(
                "Tenure Months (Request Sent)",
                resolvedLoanRequest?.tenureMonths ?? ""
              )}
              {renderStaticField("EMI", details.emiAmount)}
              {renderStaticField("DBR", formatPercentLikeValue(details.foirRatio))}
              {renderStaticField("EMI To Income", formatPercentLikeValue(details.dtiRatio))}
              {renderStaticField(
                "Credit Utilization",
                formatPercentLikeValue(details.ltvRatio)
              )}
              {renderStaticField("Loan To Income", formatPercentLikeValue(details.dscrRatio))}
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
                  rows={6}
                  value={details.eligibilityMessage}
                  readOnly
                />
              </div>
            </div>
          )}

          {showUnderwriterDecisionSection ? (
            <>
              {underwriterSavedMessage ? (
                <div className="alert alert-success mb-3">{underwriterSavedMessage}</div>
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
                        style={{ color: "#ffffff" }}
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
                <div className="alert alert-success mb-3">{disbursalSavedMessage}</div>
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
                          disbursedAmount:
                            e.target.value === "DISBURSED"
                              ? prev.disbursedAmount
                              : "",
                        }))
                      }
                      disabled={!canEditDisbursalDecisionSection || decisionLoading}
                    >
                      <option value="">Select decision</option>
                      <option value="DISBURSED">Disbursed</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  {decisionForm.disbursalDecisionStatus === "DISBURSED" ? (
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Disbursed Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        value={decisionForm.disbursedAmount}
                        onChange={(e) =>
                          setDecisionForm((prev) => ({
                            ...prev,
                            disbursedAmount: e.target.value,
                          }))
                        }
                        placeholder="Enter disbursed amount"
                        disabled={!canEditDisbursalDecisionSection || decisionLoading}
                      />
                    </div>
                  ) : null}

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
                        disabled={
                          decisionLoading ||
                          normalizedApplicationStatus === "DISBURSAL_COMPLETED" ||
                          normalizedApplicationStatus === "DISBURSAL_REJECTED"
                        }
                        style={{ color: "#ffffff" }}
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

                <form onSubmit={handleSendCommunication} className="row g-3 p-3">
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
                      style={{ color: "#ffffff" }}
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
                  <table className="table cp-loan-history-table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Date</th>
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
                          <td colSpan={6} className="cp-loan-table-empty">
                            No communication history loaded.
                          </td>
                        </tr>
                      ) : (
                        communicationHistory.map((item) => (
                          <tr key={item.messageId}>
                            <td>{formatDate(item.createdAt)}</td>
                            <td>{item.senderType || "-"}</td>
                            <td>{item.recipientType || "-"}</td>
                            <td>{item.messageCategory || "-"}</td>
                            <td>{item.messageText || "-"}</td>
                            <td>
                              {(item.attachments ?? []).length === 0 ? (
                                <span className="cp-loan-note">No attachment</span>
                              ) : (
                                <div className="d-flex flex-column gap-2">
                                  {(item.attachments ?? []).map((attachment) => {
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
                                            {attachment.originalFileName || "-"} — Unavailable after
                                            refresh
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