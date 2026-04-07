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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type VerificationStatus = "VERIFIED" | "NOT_VERIFIED" | "";

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
  bankAccounts: FinancialBankAccount[];
};

type FinancialDetailsApiResponse =
  | {
      success?: boolean;
      message?: string;
      data?: FinancialDetailsResponseDto;
    }
  | FinancialDetailsResponseDto;

/* DOCUMENT TYPES */
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

type UserRole =
  | "CUSTOMER"
  | "SOURCING_OFFICER"
  | "UNDERWRITER"
  | "DISBURSAL_OFFICER"
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

const accordionSections: {
  key: AccordionKey;
  title: string;
  icon: React.ReactNode;
}[] = [
  { key: "personal", title: "Personal Details", icon: <UserRound size={18} /> },
  { key: "communication", title: "Communication Details", icon: <MessageSquare size={18} /> },
  { key: "education", title: "Education Details", icon: <GraduationCap size={18} /> },
  { key: "financial", title: "Financial Details", icon: <BriefcaseBusiness size={18} /> },
  { key: "bank", title: "Bank Details", icon: <Landmark size={18} /> },
  { key: "documents", title: "Document Details", icon: <FileText size={18} /> },
  { key: "cibil", title: "CIBIL Details", icon: <ShieldCheck size={18} /> },
  { key: "repayment", title: "Repayment Schedule Details", icon: <Calculator size={18} /> },
  { key: "ratios", title: "Ratios", icon: <Calculator size={18} /> },
  { key: "eligibility", title: "Eligibility", icon: <ShieldCheck size={18} /> },
  { key: "underwriterReview", title: "Underwriter Review API", icon: <FileText size={18} /> },
  { key: "underwriterDecision", title: "Underwriter Decision API", icon: <FileText size={18} /> },
  {
    key: "communicationHistory",
    title: "Communication History",
    icon: <MessageSquare size={18} />,
  },
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

function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");

    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getCurrentUserRole(token: string | null): UserRole {
  const payload = decodeJwtPayload(token);

  const candidates = [
    payload?.userType,
    payload?.role,
    payload?.user_role,
    payload?.userRole,
  ];

  const normalized = String(candidates.find(Boolean) ?? "")
    .trim()
    .toUpperCase();

  if (normalized === "CUSTOMER") return "CUSTOMER";
  if (normalized === "SOURCING_OFFICER") return "SOURCING_OFFICER";
  if (normalized === "UNDERWRITER") return "UNDERWRITER";
  if (normalized === "DISBURSAL_OFFICER") return "DISBURSAL_OFFICER";

  return "UNKNOWN";
}

function getSenderTypeForRole(role: UserRole): string {
  if (role === "CUSTOMER") return "CUSTOMER";
  if (role === "SOURCING_OFFICER") return "SOURCING_OFFICER";
  if (role === "UNDERWRITER") return "UNDERWRITER";
  if (role === "DISBURSAL_OFFICER") return "DISBURSAL_OFFICER";
  return "SOURCING_OFFICER";
}

function getRecipientOptionsForSender(senderType: string): string[] {
  if (senderType === "CUSTOMER") {
    return ["SOURCING_OFFICER"];
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
export default function ApplicationDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationNumberFromUrl = searchParams.get("applicationNumber") || "";

  const { token, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [details, setDetails] = useState<ApplicationDetailsState>({
    ...initialDetails,
    applicationNumber: applicationNumberFromUrl,
  });

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

      console.log("RAW DOCUMENT RESPONSE:", response.data);

      const data = extractDocumentDetailsResponse(response.data);

      console.log("EXTRACTED DOCUMENTS:", data);

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
      console.error("Document fetch error:", error);
      setDocumentError("Failed to fetch documents.");
    } finally {
      setDocumentLoading(false);
    }
  }

 
  async function saveDocumentVerification() {
    if (!token) return;

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

      console.log("VERIFY PAYLOAD:", payload);

      await axios.post("/api/application/document-verify", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDocumentSuccess("Documents verified successfully.");

      // 🔁 Refresh after save
      fetchDocumentDetails();
    } catch (error) {
      console.error("Verification error:", error);
      setDocumentError("Failed to verify documents.");
    }
  }

  
  function updateVerificationStatus(id: string, status: VerificationStatus) {
    setDetails((prev) => ({
      ...prev,
      documentRows: prev.documentRows.map((doc) =>
        doc.id === id ? { ...doc, verificationStatus: status } : doc
      ),
    }));
  }

 
  useEffect(() => {
    if (!token) return;
    if (!isValidApplicationNumber(details.applicationNumber)) return;

    fetchDocumentDetails();
  }, [token, details.applicationNumber]);

  const [communicationHistory, setCommunicationHistory] = useState<CommunicationHistoryItem[]>([]);
  const [communicationLoading, setCommunicationLoading] = useState(false);
  const [communicationError, setCommunicationError] = useState("");
  const [communicationSuccess, setCommunicationSuccess] = useState("");
  const [communicationForm, setCommunicationForm] =
    useState<CommunicationFormState>(initialCommunicationForm());
  const [sendingCommunication, setSendingCommunication] = useState(false);

  const [localAttachmentLinks, setLocalAttachmentLinks] = useState<Record<string, LocalAttachmentLink>>({});
  const createdBlobUrlsRef = useRef<string[]>([]);

  const currentUserRole = useMemo(() => getCurrentUserRole(token), [token]);
  const historyScope = useMemo(() => getHistoryScopeForRole(currentUserRole), [currentUserRole]);

  const senderTypeFromLogin = useMemo(
    () => getSenderTypeForRole(currentUserRole),
    [currentUserRole]
  );

  const recipientOptions = useMemo(
    () => getRecipientOptionsForSender(senderTypeFromLogin),
    [senderTypeFromLogin]
  );

  const headerSummary = useMemo(() => {
    const fullName = `${details.firstName} ${details.lastName}`.trim();
    return [
      fullName || "Applicant Details",
      details.loanProduct || "Loan Product",
      details.applicationStatus || "Status Pending",
    ].join(" • ");
  }, [details.firstName, details.lastName, details.loanProduct, details.applicationStatus]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, details.applicationNumber]);

  function toggleSection(section: AccordionKey) {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }

  function updateDetail<K extends keyof ApplicationDetailsState>(
    key: K,
    value: ApplicationDetailsState[K]
  ) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const isOpen = openSections[section.key];

    return (
      <div className="cp-loan-bank-card mb-3">
        <div className="cp-loan-bank-card-header">{renderAccordionHeader(section)}</div>
        {isOpen ? <div className="pt-3">{children}</div> : null}
      </div>
    );
  }

  function renderStaticField(label: string, value: string | number | boolean | null | undefined) {
    return (
      <div className="col-12 col-md-4">
        <label className="form-label fw-semibold">{label}</label>
        <input className="form-control" value={value ?? ""} readOnly />
      </div>
    );
  }

  if (authLoading) {
    return (
      <main className="cp-loan-page">
        <section className="cp-loan-card">
          <div className="cp-dashboard-empty-state">Checking session...</div>
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
                  {details.applicationStatus || "-"}
                </span>
              </div>

              <div className="cp-loan-top-pill">
                <span className="cp-loan-top-pill-label">Product</span>
                <span className="cp-loan-top-pill-value">{details.loanProduct || "-"}</span>
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

        {communicationSuccess ? (
          <div className="alert alert-success mt-3">{communicationSuccess}</div>
        ) : null}

        {communicationError ? (
          <div className="alert alert-danger mt-3">{communicationError}</div>
        ) : null}

        {documentSuccess ? (
          <div className="alert alert-success mt-3">{documentSuccess}</div>
        ) : null}

        {documentError ? (
          <div className="alert alert-danger mt-3">{documentError}</div>
        ) : null}

        <div className="cp-loan-form">
          {renderSectionShell(
            accordionSections[0],
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">First Name</label>
                <input
                  className="form-control"
                  value={details.firstName}
                  onChange={(e) => updateDetail("firstName", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Last Name</label>
                <input
                  className="form-control"
                  value={details.lastName}
                  onChange={(e) => updateDetail("lastName", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Date of Birth</label>
                <input
                  type="date"
                  className="form-control"
                  value={details.dob}
                  onChange={(e) => updateDetail("dob", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Gender</label>
                <input
                  className="form-control"
                  value={details.gender}
                  onChange={(e) => updateDetail("gender", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Marital Status</label>
                <input
                  className="form-control"
                  value={details.maritalStatus}
                  onChange={(e) => updateDetail("maritalStatus", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Nationality</label>
                <input
                  className="form-control"
                  value={details.nationality}
                  onChange={(e) => updateDetail("nationality", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Government ID Type</label>
                <input
                  className="form-control"
                  value={details.governmentIdType}
                  onChange={(e) => updateDetail("governmentIdType", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Government ID Number</label>
                <input
                  className="form-control"
                  value={details.governmentIdNumber}
                  onChange={(e) => updateDetail("governmentIdNumber", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">SIN / Tax ID</label>
                <input
                  className="form-control"
                  value={details.sinTaxId}
                  onChange={(e) => updateDetail("sinTaxId", e.target.value)}
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
                />
              </div>

              <div className="col-12 col-lg-4">
                <label className="form-label fw-semibold">Mobile Number</label>
                <input
                  className="form-control"
                  value={details.mobile}
                  onChange={(e) => updateDetail("mobile", sanitizeDigits(e.target.value))}
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
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Residential Address Line 1</label>
                <input
                  className="form-control"
                  value={details.residentialLine1}
                  onChange={(e) => updateDetail("residentialLine1", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Residential Address Line 2</label>
                <input
                  className="form-control"
                  value={details.residentialLine2}
                  onChange={(e) => updateDetail("residentialLine2", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential City</label>
                <input
                  className="form-control"
                  value={details.residentialCity}
                  onChange={(e) => updateDetail("residentialCity", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential Province / State</label>
                <input
                  className="form-control"
                  value={details.residentialState}
                  onChange={(e) => updateDetail("residentialState", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential Postal Code</label>
                <input
                  className="form-control"
                  value={details.residentialPostalCode}
                  onChange={(e) => updateDetail("residentialPostalCode", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Residential Country</label>
                <input
                  className="form-control"
                  value={details.residentialCountry}
                  onChange={(e) => updateDetail("residentialCountry", e.target.value)}
                />
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    id="mailingSameAsResidential"
                    className="form-check-input"
                    type="checkbox"
                    checked={details.mailingSameAsResidential}
                    onChange={(e) => updateDetail("mailingSameAsResidential", e.target.checked)}
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
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Mailing Address Line 2</label>
                    <input
                      className="form-control"
                      value={details.mailingLine2}
                      onChange={(e) => updateDetail("mailingLine2", e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing City</label>
                    <input
                      className="form-control"
                      value={details.mailingCity}
                      onChange={(e) => updateDetail("mailingCity", e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing Province / State</label>
                    <input
                      className="form-control"
                      value={details.mailingState}
                      onChange={(e) => updateDetail("mailingState", e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing Postal Code</label>
                    <input
                      className="form-control"
                      value={details.mailingPostalCode}
                      onChange={(e) => updateDetail("mailingPostalCode", e.target.value)}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Mailing Country</label>
                    <input
                      className="form-control"
                      value={details.mailingCountry}
                      onChange={(e) => updateDetail("mailingCountry", e.target.value)}
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
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Field of Study</label>
                <input
                  className="form-control"
                  value={details.fieldOfStudy}
                  onChange={(e) => updateDetail("fieldOfStudy", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Institution Name</label>
                <input
                  className="form-control"
                  value={details.institutionName}
                  onChange={(e) => updateDetail("institutionName", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Graduation Year</label>
                <input
                  className="form-control"
                  value={details.graduationYear}
                  onChange={(e) => updateDetail("graduationYear", e.target.value)}
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
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Employer Name</label>
                <input
                  className="form-control"
                  value={details.employerName}
                  onChange={(e) => updateDetail("employerName", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Job Title</label>
                <input
                  className="form-control"
                  value={details.jobTitle}
                  onChange={(e) => updateDetail("jobTitle", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Work Experience</label>
                <input
                  className="form-control"
                  value={details.workExperience}
                  onChange={(e) => updateDetail("workExperience", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Monthly Income</label>
                <input
                  className="form-control"
                  value={details.monthlyIncome}
                  onChange={(e) => updateDetail("monthlyIncome", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Other Income Sources</label>
                <input
                  className="form-control"
                  value={details.otherIncomeSources}
                  onChange={(e) => updateDetail("otherIncomeSources", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Existing Loans</label>
                <input
                  className="form-control"
                  value={details.existingLoans}
                  onChange={(e) => updateDetail("existingLoans", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Total Monthly Loan Payments</label>
                <input
                  className="form-control"
                  value={details.totalMonthlyLoanPayments}
                  onChange={(e) => updateDetail("totalMonthlyLoanPayments", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Tenure (Months)</label>
                <input
                  className="form-control"
                  value={details.tenureMonths}
                  onChange={(e) => updateDetail("tenureMonths", e.target.value)}
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

                  {details.documentRows.length > 0 ? (
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
                <textarea className="form-control" rows={4} value={details.cibilRemarks} readOnly />
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

          {renderSectionShell(
            accordionSections[10],
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Underwriter Review</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={details.underwriterReview}
                  readOnly
                />
              </div>
            </div>
          )}

          {renderSectionShell(
            accordionSections[11],
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Underwriter Decision</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={details.underwriterDecision}
                  readOnly
                />
              </div>
            </div>
          )}

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
                    <label htmlFor="communicationAttachmentInput" className="cp-loan-upload-box">
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
                                              download={downloadInfo.isLocal ? downloadInfo.fileName : undefined}
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