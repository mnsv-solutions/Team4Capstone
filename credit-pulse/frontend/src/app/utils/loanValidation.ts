export type Address = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type BankAccount = {
  bankName: string;
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
  accountType: string;
  swiftBic: string;
  isRepaymentAccount: boolean;
};

export type LoanApplicationForm = {
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
  residentialAddress: Address;
  mailingSameAsResidential: boolean;
  mailingAddress: Address;

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
  loanAmount: string;
  loanTypeId?: string;

  bankAccounts: BankAccount[];

  governmentIdProof: File | null;
  incomeProof: File | null;
  bankStatement: File | null;

  creditReportConsent: boolean;
  declarationAccepted: boolean;
};

export type FormErrors = Partial<Record<string, string>>;

export function sanitizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function sanitizeAlphaNumericUpper(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function sanitizeName(value: string) {
  return value.replace(/[^a-zA-Z\s'-]/g, "").replace(/\s{2,}/g, " ");
}

export function sanitizeAddressText(value: string) {
  return value.replace(/[^a-zA-Z0-9\s,./#'-]/g, "").replace(/\s{2,}/g, " ");
}

export function sanitizeLettersSpaces(value: string) {
  return value.replace(/[^a-zA-Z\s'-]/g, "").replace(/\s{2,}/g, " ");
}

export function sanitizeAlphaNumericBasic(value: string) {
  return value.replace(/[^a-zA-Z0-9\s./&-]/g, "").replace(/\s{2,}/g, " ");
}

export function trimAndCollapseSpaces(value: string) {
  return value.trim().replace(/\s{2,}/g, " ");
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizePostalCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function normalizeGovernmentId(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeLoanApplicationForm(
  form: LoanApplicationForm
): LoanApplicationForm {
  const normalizeAddress = (address: Address): Address => ({
    line1: trimAndCollapseSpaces(address.line1),
    line2: trimAndCollapseSpaces(address.line2),
    city: trimAndCollapseSpaces(address.city),
    state: trimAndCollapseSpaces(address.state),
    postalCode: normalizePostalCode(address.postalCode),
    country: trimAndCollapseSpaces(address.country),
  });

  return {
    ...form,
    firstName: trimAndCollapseSpaces(form.firstName),
    lastName: trimAndCollapseSpaces(form.lastName),
    nationality: trimAndCollapseSpaces(form.nationality),
    governmentIdNumber: normalizeGovernmentId(form.governmentIdNumber),
    sinTaxId: sanitizeDigits(form.sinTaxId).slice(0, 9),
    email: normalizeEmail(form.email),
    mobile: sanitizeDigits(form.mobile).slice(0, 10),
    alternatePhone: sanitizeDigits(form.alternatePhone).slice(0, 10),
    residentialAddress: normalizeAddress(form.residentialAddress),
    mailingAddress: form.mailingSameAsResidential
      ? normalizeAddress(form.residentialAddress)
      : normalizeAddress(form.mailingAddress),
    fieldOfStudy: trimAndCollapseSpaces(form.fieldOfStudy),
    institutionName: trimAndCollapseSpaces(form.institutionName),
    graduationYear: sanitizeDigits(form.graduationYear).slice(0, 4),
    employerName: trimAndCollapseSpaces(form.employerName),
    jobTitle: trimAndCollapseSpaces(form.jobTitle),
    workExperience: sanitizeDigits(form.workExperience).slice(0, 2),
    monthlyIncome: sanitizeDigits(form.monthlyIncome).slice(0, 9),
    otherIncomeSources: trimAndCollapseSpaces(form.otherIncomeSources),
    existingLoans: form.existingLoans,
    totalMonthlyLoanPayments: sanitizeDigits(
      form.totalMonthlyLoanPayments
    ).slice(0, 9),
    tenureMonths: sanitizeDigits(form.tenureMonths).slice(0, 3),
    loanAmount: sanitizeDigits(form.loanAmount).slice(0, 9),
    loanTypeId: form.loanTypeId?.trim() || "",
    bankAccounts: form.bankAccounts.map((account) => ({
      ...account,
      bankName: trimAndCollapseSpaces(account.bankName),
      institutionNumber: sanitizeDigits(account.institutionNumber).slice(0, 3),
      transitNumber: sanitizeDigits(account.transitNumber).slice(0, 5),
      accountNumber: sanitizeDigits(account.accountNumber).slice(0, 17),
      accountType: account.accountType,
      swiftBic: sanitizeAlphaNumericUpper(account.swiftBic).slice(0, 11),
      isRepaymentAccount: account.isRepaymentAccount,
    })),
  };
}

export function createEmptyBankAccount(): BankAccount {
  return {
    bankName: "",
    institutionNumber: "",
    transitNumber: "",
    accountNumber: "",
    accountType: "",
    swiftBic: "",
    isRepaymentAccount: false,
  };
}

export function isAdult(dateString: string) {
  if (!dateString) return false;

  const today = new Date();
  const dob = new Date(dateString);

  if (Number.isNaN(dob.getTime())) return false;
  if (dob > today) return false;

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 18;
}

const EMPLOYMENT_STATUSES = new Set([
  "Employed",
  "Self-employed",
  "Student",
  "Retired",
]);

const GENDERS = new Set(["Female", "Male"]);

const EDUCATION_LEVELS = new Set([
  "Illiterate",
  "High School",
  "Diploma",
  "Bachelor",
  "Master",
  "Doctorate",
]);

function hasRepeatedDigits(value: string) {
  return /^(\d)\1+$/.test(value);
}

function hasOnlyLettersSpaces(value: string) {
  return /^[A-Za-z][A-Za-z\s'-]*$/.test(value);
}

function isValidName(value: string, min = 2, max = 50) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length < min || trimmed.length > max) return false;
  return hasOnlyLettersSpaces(trimmed);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function isValidPhone10(value: string) {
  return /^\d{10}$/.test(value);
}

function isValidPostalCode(value: string) {
  const trimmed = value.trim().toUpperCase();
  const canada = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/;
  const us = /^\d{5}(-\d{4})?$/;
  return canada.test(trimmed) || us.test(trimmed);
}

function isValidGovernmentId(value: string, idType?: string) {
  const trimmed = value.trim().toUpperCase();

  if (!/^[A-Z0-9-]{5,20}$/.test(trimmed)) return false;

  switch (idType) {
    case "Passport":
      return /^[A-Z0-9]{6,9}$/.test(trimmed);
    case "Driver License":
      return /^[A-Z0-9-]{6,20}$/.test(trimmed);
    case "PR Card":
      return /^[A-Z]{2}\d{6}$|^\d{8,10}$/.test(trimmed);
    case "National ID":
      return /^[A-Z0-9-]{5,20}$/.test(trimmed);
    default:
      return /^[A-Z0-9-]{5,20}$/.test(trimmed);
  }
}

function isValidYear(value: string) {
  if (!/^\d{4}$/.test(value)) return false;
  const year = Number(value);
  const currentYear = new Date().getFullYear();
  return year >= 1950 && year <= currentYear;
}

function isPositiveNumberString(value: string) {
  return /^\d+$/.test(value) && Number(value) > 0;
}

function hasValidMoneyLength(value: string, maxDigits = 9) {
  return /^\d+$/.test(value) && value.length <= maxDigits;
}

function isValidAddressLine(value: string, min = 5, max = 100) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length < min || trimmed.length > max) return false;
  return /[A-Za-z0-9]/.test(trimmed);
}

function isValidAlphaNumericSentence(value: string, min = 2, max = 100) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length < min || trimmed.length > max) return false;
  return /^[A-Za-z0-9][A-Za-z0-9\s./&-]*$/.test(trimmed);
}

export function validateFile(file: File | null, label: string) {
  if (!file) return `${label} is required.`;

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (!allowedTypes.includes(file.type)) {
    return `${label} must be PDF, JPG, or PNG.`;
  }

  const maxSizeBytes = 5 * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return `${label} must be 5MB or smaller.`;
  }

  return "";
}

export function validateLoanStep(
  form: LoanApplicationForm,
  stepIndex: number
): FormErrors {
  const normalizedForm = normalizeLoanApplicationForm(form);
  const data = normalizedForm;
  const nextErrors: FormErrors = {};

  if (stepIndex === 0) {
    if (!data.firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    } else if (!isValidName(data.firstName)) {
      nextErrors.firstName = "First name must be 2 to 50 letters only.";
    }

    if (!data.lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    } else if (!isValidName(data.lastName)) {
      nextErrors.lastName = "Last name must be 2 to 50 letters only.";
    }

    if (!data.dob) {
      nextErrors.dob = "Date of birth is required.";
    } else if (!isAdult(data.dob)) {
      nextErrors.dob =
        "Date of birth must be in the past and applicant must be at least 18 years old.";
    }

    if (!data.gender) {
      nextErrors.gender = "Gender is required.";
    } else if (!GENDERS.has(data.gender)) {
      nextErrors.gender = "Select a valid gender.";
    }

    if (!data.maritalStatus) {
      nextErrors.maritalStatus = "Marital status is required.";
    }

    if (!data.nationality.trim()) {
      nextErrors.nationality = "Nationality is required.";
    } else if (!isValidName(data.nationality, 2, 40)) {
      nextErrors.nationality = "Nationality must contain letters only.";
    }

    if (!data.governmentIdType) {
      nextErrors.governmentIdType = "Government ID type is required.";
    }

    if (!data.governmentIdNumber.trim()) {
      nextErrors.governmentIdNumber = "Government ID number is required.";
    } else if (
      !isValidGovernmentId(data.governmentIdNumber, data.governmentIdType)
    ) {
      nextErrors.governmentIdNumber =
        "Government ID number must be 5 to 20 letters, numbers, or hyphens.";
    }

    if (!data.sinTaxId.trim()) {
      nextErrors.sinTaxId = "SIN is required.";
    } else if (!/^\d{9}$/.test(data.sinTaxId)) {
      nextErrors.sinTaxId = "SIN must be exactly 9 digits.";
    } else if (hasRepeatedDigits(data.sinTaxId)) {
      nextErrors.sinTaxId = "Enter a valid SIN.";
    }
  }

  if (stepIndex === 1) {
    if (!data.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!isValidEmail(data.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!data.mobile.trim()) {
      nextErrors.mobile = "Mobile number is required.";
    } else if (!isValidPhone10(data.mobile)) {
      nextErrors.mobile = "Mobile number must be exactly 10 digits.";
    }

    if (data.alternatePhone.trim() && !isValidPhone10(data.alternatePhone)) {
      nextErrors.alternatePhone = "Alternate phone must be exactly 10 digits.";
    } else if (data.alternatePhone && data.alternatePhone === data.mobile) {
      nextErrors.alternatePhone =
        "Alternate phone must be different from the mobile number.";
    }

    if (!data.residentialAddress.line1.trim()) {
      nextErrors.residentialLine1 = "Residential address line 1 is required.";
    } else if (!isValidAddressLine(data.residentialAddress.line1)) {
      nextErrors.residentialLine1 =
        "Residential address line 1 must be 5 to 100 characters.";
    }

    if (!data.residentialAddress.city.trim()) {
      nextErrors.residentialCity = "City is required.";
    } else if (!isValidName(data.residentialAddress.city, 2, 50)) {
      nextErrors.residentialCity = "City must contain letters only.";
    }

    if (!data.residentialAddress.state.trim()) {
      nextErrors.residentialState = "Province / State is required.";
    } else if (!isValidName(data.residentialAddress.state, 2, 50)) {
      nextErrors.residentialState =
        "Province / State must contain letters only.";
    }

    if (!data.residentialAddress.postalCode.trim()) {
      nextErrors.residentialPostalCode = "Postal code is required.";
    } else if (!isValidPostalCode(data.residentialAddress.postalCode)) {
      nextErrors.residentialPostalCode = "Enter a valid postal code.";
    }

    if (!data.residentialAddress.country.trim()) {
      nextErrors.residentialCountry = "Country is required.";
    } else if (!isValidName(data.residentialAddress.country, 2, 50)) {
      nextErrors.residentialCountry = "Country must contain letters only.";
    }

    if (!data.mailingSameAsResidential) {
      if (!data.mailingAddress.line1.trim()) {
        nextErrors.mailingLine1 = "Mailing address line 1 is required.";
      } else if (!isValidAddressLine(data.mailingAddress.line1)) {
        nextErrors.mailingLine1 =
          "Mailing address line 1 must be 5 to 100 characters.";
      }

      if (!data.mailingAddress.city.trim()) {
        nextErrors.mailingCity = "City is required.";
      } else if (!isValidName(data.mailingAddress.city, 2, 50)) {
        nextErrors.mailingCity = "City must contain letters only.";
      }

      if (!data.mailingAddress.state.trim()) {
        nextErrors.mailingState = "Province / State is required.";
      } else if (!isValidName(data.mailingAddress.state, 2, 50)) {
        nextErrors.mailingState = "Province / State must contain letters only.";
      }

      if (!data.mailingAddress.postalCode.trim()) {
        nextErrors.mailingPostalCode = "Postal code is required.";
      } else if (!isValidPostalCode(data.mailingAddress.postalCode)) {
        nextErrors.mailingPostalCode = "Enter a valid postal code.";
      }

      if (!data.mailingAddress.country.trim()) {
        nextErrors.mailingCountry = "Country is required.";
      } else if (!isValidName(data.mailingAddress.country, 2, 50)) {
        nextErrors.mailingCountry = "Country must contain letters only.";
      }
    }
  }

  if (stepIndex === 2) {
    if (!data.highestEducation) {
      nextErrors.highestEducation = "Highest education level is required.";
    } else if (!EDUCATION_LEVELS.has(data.highestEducation)) {
      nextErrors.highestEducation = "Select a valid education level.";
    }

    if (data.highestEducation !== "Illiterate") {
      if (!data.fieldOfStudy.trim()) {
        nextErrors.fieldOfStudy = "Field of study is required.";
      } else if (!isValidName(data.fieldOfStudy, 2, 60)) {
        nextErrors.fieldOfStudy =
          "Field of study must be 2 to 60 letters only.";
      }

      if (!data.institutionName.trim()) {
        nextErrors.institutionName =
          "Institution / University name is required.";
      } else if (!isValidName(data.institutionName, 2, 80)) {
        nextErrors.institutionName =
          "Institution / University name must be 2 to 80 letters only.";
      }

      if (!data.graduationYear.trim()) {
        nextErrors.graduationYear = "Graduation year is required.";
      } else if (!isValidYear(data.graduationYear)) {
        nextErrors.graduationYear = "Enter a valid graduation year.";
      }
    }
  }

  if (stepIndex === 3) {
    if (!data.employmentStatus) {
      nextErrors.employmentStatus = "Employment status is required.";
    } else if (!EMPLOYMENT_STATUSES.has(data.employmentStatus)) {
      nextErrors.employmentStatus = "Select a valid employment status.";
    }

    if (
      data.employmentStatus === "Employed" ||
      data.employmentStatus === "Self-employed"
    ) {
      if (data.employmentStatus === "Employed" && !data.employerName.trim()) {
        nextErrors.employerName = "Employer name is required.";
      } else if (
        data.employmentStatus === "Employed" &&
        !isValidAlphaNumericSentence(data.employerName, 2, 80)
      ) {
        nextErrors.employerName =
          "Employer name must be 2 to 80 valid characters.";
      }

      if (!data.jobTitle.trim()) {
        nextErrors.jobTitle = "Job title / occupation is required.";
      } else if (!isValidName(data.jobTitle, 2, 60)) {
        nextErrors.jobTitle =
          "Job title / occupation must be 2 to 60 letters only.";
      }

      if (!data.workExperience.trim()) {
        nextErrors.workExperience = "Work experience is required.";
      } else if (!/^\d{1,2}$/.test(data.workExperience)) {
        nextErrors.workExperience =
          "Work experience must be a valid number of years.";
      } else if (Number(data.workExperience) > 60) {
        nextErrors.workExperience =
          "Work experience cannot be more than 60 years.";
      }

      if (!data.monthlyIncome.trim()) {
        nextErrors.monthlyIncome = "Monthly income is required.";
      } else if (!isPositiveNumberString(data.monthlyIncome)) {
        nextErrors.monthlyIncome = "Monthly income must be a valid number.";
      } else if (!hasValidMoneyLength(data.monthlyIncome, 9)) {
        nextErrors.monthlyIncome = "Monthly income cannot exceed 9 digits.";
      }
    }

    if (!data.loanTypeId?.trim()) {
      nextErrors.loanTypeId = "Loan product is required.";
    }

    if (!data.loanAmount.trim()) {
      nextErrors.loanAmount = "Requested loan amount is required.";
    } else if (!isPositiveNumberString(data.loanAmount)) {
      nextErrors.loanAmount = "Requested loan amount must be a valid number.";
    } else if (!hasValidMoneyLength(data.loanAmount, 9)) {
      nextErrors.loanAmount = "Requested loan amount cannot exceed 9 digits.";
    }

    if (!data.tenureMonths.trim()) {
      nextErrors.tenureMonths = "Requested loan tenure is required.";
    } else if (!/^\d+$/.test(data.tenureMonths)) {
      nextErrors.tenureMonths = "Requested loan tenure must be a number.";
    } else if (Number(data.tenureMonths) > 480) {
      nextErrors.tenureMonths =
        "Requested loan tenure cannot be more than 480 months.";
    }

    if (!data.existingLoans) {
      nextErrors.existingLoans =
        "Please select whether you have existing loans.";
    }

    if (data.existingLoans === "Yes") {
      if (!data.totalMonthlyLoanPayments.trim()) {
        nextErrors.totalMonthlyLoanPayments =
          "Total monthly loan payments are required.";
      } else if (!isPositiveNumberString(data.totalMonthlyLoanPayments)) {
        nextErrors.totalMonthlyLoanPayments =
          "Total monthly loan payments must be a valid number.";
      } else if (!hasValidMoneyLength(data.totalMonthlyLoanPayments, 9)) {
        nextErrors.totalMonthlyLoanPayments =
          "Total monthly loan payments cannot exceed 9 digits.";
      } else if (
        data.monthlyIncome &&
        Number(data.totalMonthlyLoanPayments) >= Number(data.monthlyIncome)
      ) {
        nextErrors.totalMonthlyLoanPayments =
          "Total monthly loan payments must be less than monthly income.";
      }
    }

    if (!data.bankAccounts.length) {
      nextErrors.bankAccounts = "At least one bank account is required.";
    }

    const bankAccountSignatures = new Set<string>();

    data.bankAccounts.forEach((account, index) => {
      const prefix = `bankAccounts.${index}`;

      if (!account.bankName.trim()) {
        nextErrors[`${prefix}.bankName`] = "Bank name is required.";
      } else if (account.bankName.trim().length < 2) {
        nextErrors[`${prefix}.bankName`] =
          "Bank name must be at least 2 characters.";
      }

      if (!account.institutionNumber.trim()) {
        nextErrors[`${prefix}.institutionNumber`] =
          "Institution number is required.";
      } else if (!/^\d{3}$/.test(account.institutionNumber)) {
        nextErrors[`${prefix}.institutionNumber`] =
          "Institution number must be exactly 3 digits.";
      }

      if (!account.transitNumber.trim()) {
        nextErrors[`${prefix}.transitNumber`] = "Transit number is required.";
      } else if (!/^\d{5}$/.test(account.transitNumber)) {
        nextErrors[`${prefix}.transitNumber`] =
          "Transit number must be exactly 5 digits.";
      }

      if (!account.accountNumber.trim()) {
        nextErrors[`${prefix}.accountNumber`] = "Account number is required.";
      } else if (!/^\d{7,17}$/.test(account.accountNumber)) {
        nextErrors[`${prefix}.accountNumber`] =
          "Account number must be 7 to 17 digits.";
      }

      if (!account.accountType) {
        nextErrors[`${prefix}.accountType`] = "Account type is required.";
      }

      if (
        account.swiftBic.trim() &&
        !/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(account.swiftBic)
      ) {
        nextErrors[`${prefix}.swiftBic`] =
          "SWIFT / BIC must be 8 or 11 uppercase letters/numbers.";
      }

      const signature = [
        account.institutionNumber,
        account.transitNumber,
        account.accountNumber,
      ].join("-");

      if (
        account.institutionNumber &&
        account.transitNumber &&
        account.accountNumber
      ) {
        if (bankAccountSignatures.has(signature)) {
          nextErrors[`${prefix}.accountNumber`] =
            "Duplicate bank account details are not allowed.";
        }

        bankAccountSignatures.add(signature);
      }
    });

    const repaymentAccountsCount = data.bankAccounts.filter(
      (account) => account.isRepaymentAccount
    ).length;

    if (repaymentAccountsCount === 0) {
      nextErrors.repaymentAccount = "Please select one repayment account.";
    }

    if (repaymentAccountsCount > 1) {
      nextErrors.repaymentAccount =
        "Only one repayment account can be selected.";
    }
  }

  if (stepIndex === 4) {
    const governmentIdProofError = validateFile(
      data.governmentIdProof,
      "Government ID proof"
    );
    if (governmentIdProofError) {
      nextErrors.governmentIdProof = governmentIdProofError;
    }

    const incomeProofError = validateFile(data.incomeProof, "Income proof");
    if (incomeProofError) {
      nextErrors.incomeProof = incomeProofError;
    }

    const bankStatementError = validateFile(
      data.bankStatement,
      "Bank statement"
    );
    if (bankStatementError) {
      nextErrors.bankStatement = bankStatementError;
    }

    if (!data.creditReportConsent) {
      nextErrors.creditReportConsent =
        "You must provide credit report consent.";
    }

    if (!data.declarationAccepted) {
      nextErrors.declarationAccepted =
        "You must accept the declaration before submitting.";
    }
  }

  return nextErrors;
}
