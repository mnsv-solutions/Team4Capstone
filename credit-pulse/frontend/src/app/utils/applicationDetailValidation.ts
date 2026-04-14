export type UnderwriterDecisionOption = "" | "APPROVED" | "REJECTED";
export type DisbursalDecisionOption = "" | "DISBURSED" | "REJECTED";

export type UnderwriterValidationInput = {
  applicationNumber: string;
  underwriterDecisionStatus: UnderwriterDecisionOption;
  underwriterComments: string;
  approvedLoanAmount: number;
  approvedInterestRate: number;
  approvedTenureMonths: number;
  approvedEmi: number;
};

export type DisbursalValidationInput = {
  applicationNumber: string;
  disbursalDecisionStatus: DisbursalDecisionOption;
  disbursalComments: string;
  disbursedAmount: number;
  approvedLoanAmount: number;
  approvedInterestRate: number;
  approvedTenureMonths: number;
  approvedEmi: number;
};

export type CommunicationValidationInput = {
  applicationNumber: string;
  senderType: string;
  recipientType: string;
  recipientUserId: string;
  messageCategory: string;
  messageText: string;
};

export type ValidationResult = {
  isValid: boolean;
  errorMessage: string;
};

export function isValidApplicationNumber(value: string): boolean {
  return /^APPL\d{10}$/.test(String(value || "").trim());
}

export function parseNumberValue(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value || "").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function validateUnderwriterDecision(
  input: UnderwriterValidationInput
): ValidationResult {
  if (!isValidApplicationNumber(input.applicationNumber)) {
    return {
      isValid: false,
      errorMessage: "Invalid application number.",
    };
  }

  if (!input.underwriterDecisionStatus) {
    return {
      isValid: false,
      errorMessage: "Please select underwriter decision.",
    };
  }

  if (!input.underwriterComments.trim()) {
    return {
      isValid: false,
      errorMessage: "Please enter comments.",
    };
  }

  if (input.approvedLoanAmount <= 0) {
    return {
      isValid: false,
      errorMessage: "Approved loan amount must be greater than 0.",
    };
  }

  if (input.approvedInterestRate <= 0) {
    return {
      isValid: false,
      errorMessage: "Approved interest rate must be greater than 0.",
    };
  }

  if (input.approvedTenureMonths <= 0) {
    return {
      isValid: false,
      errorMessage: "Approved tenure months must be greater than 0.",
    };
  }

  if (input.approvedEmi <= 0) {
    return {
      isValid: false,
      errorMessage: "Approved EMI must be greater than 0.",
    };
  }

  return {
    isValid: true,
    errorMessage: "",
  };
}

export function validateDisbursalDecision(
  input: DisbursalValidationInput
): ValidationResult {
  if (!isValidApplicationNumber(input.applicationNumber)) {
    return {
      isValid: false,
      errorMessage: "Invalid application number.",
    };
  }

  if (!input.disbursalDecisionStatus) {
    return {
      isValid: false,
      errorMessage: "Please select disbursal decision.",
    };
  }

  if (!input.disbursalComments.trim()) {
    return {
      isValid: false,
      errorMessage: "Please enter comments.",
    };
  }

  if (input.approvedLoanAmount <= 0) {
    return {
      isValid: false,
      errorMessage: "Approved loan amount must be greater than 0.",
    };
  }

  if (input.approvedInterestRate <= 0) {
    return {
      isValid: false,
      errorMessage: "Approved interest rate must be greater than 0.",
    };
  }

  if (input.approvedTenureMonths <= 0) {
    return {
      isValid: false,
      errorMessage: "Approved tenure months must be greater than 0.",
    };
  }

  if (input.approvedEmi <= 0) {
    return {
      isValid: false,
      errorMessage: "Approved EMI must be greater than 0.",
    };
  }

  if (
    input.disbursalDecisionStatus === "DISBURSED" &&
    input.disbursedAmount <= 0
  ) {
    return {
      isValid: false,
      errorMessage: "Please enter disbursed amount.",
    };
  }

  return {
    isValid: true,
    errorMessage: "",
  };
}

export function validateCommunicationForm(
  input: CommunicationValidationInput
): ValidationResult {
  if (!isValidApplicationNumber(input.applicationNumber)) {
    return {
      isValid: false,
      errorMessage:
        "Application Number must start with APPL followed by exactly 10 digits.",
    };
  }

  if (!input.messageText.trim()) {
    return {
      isValid: false,
      errorMessage: "Message Text is required.",
    };
  }

  if (!input.messageCategory.trim()) {
    return {
      isValid: false,
      errorMessage: "Message Category is required.",
    };
  }

  if (!input.recipientType.trim()) {
    return {
      isValid: false,
      errorMessage: "Recipient Type is required.",
    };
  }

  if (input.recipientType === input.senderType) {
    return {
      isValid: false,
      errorMessage: "Recipient Type cannot be the same as Sender Type.",
    };
  }

  if (
    input.recipientType !== "CUSTOMER" &&
    !input.recipientUserId.trim()
  ) {
    return {
      isValid: false,
      errorMessage:
        "Recipient User ID is required for internal recipient types.",
    };
  }

  return {
    isValid: true,
    errorMessage: "",
  };
}