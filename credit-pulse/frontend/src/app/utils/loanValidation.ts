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

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 18;
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

function isValidGovernmentId(value: string) {
  return /^[A-Za-z0-9-]{5,20}$/.test(value.trim());
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
  const nextErrors: FormErrors = {};

  if (stepIndex === 0) {
    if (!form.firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    } else if (!isValidName(form.firstName)) {
      nextErrors.firstName = "First name must be 2 to 50 letters only.";
    }

    if (!form.lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    } else if (!isValidName(form.lastName)) {
      nextErrors.lastName = "Last name must be 2 to 50 letters only.";
    }

    if (!form.dob) {
      nextErrors.dob = "Date of birth is required.";
    } else if (!isAdult(form.dob)) {
      nextErrors.dob = "Applicant must be at least 18 years old.";
    }

    if (!form.gender) {
      nextErrors.gender = "Gender is required.";
    }

    if (!form.maritalStatus) {
      nextErrors.maritalStatus = "Marital status is required.";
    }

    if (!form.nationality.trim()) {
      nextErrors.nationality = "Nationality is required.";
    } else if (!isValidName(form.nationality, 2, 40)) {
      nextErrors.nationality = "Nationality must contain letters only.";
    }

    if (!form.governmentIdType) {
      nextErrors.governmentIdType = "Government ID type is required.";
    }

    if (!form.governmentIdNumber.trim()) {
      nextErrors.governmentIdNumber = "Government ID number is required.";
    } else if (!isValidGovernmentId(form.governmentIdNumber)) {
      nextErrors.governmentIdNumber =
        "Government ID number must be 5 to 20 letters, numbers, or hyphens.";
    }

    if (!form.sinTaxId.trim()) {
      nextErrors.sinTaxId = "SIN is required.";
    } else if (!/^\d{9}$/.test(form.sinTaxId)) {
      nextErrors.sinTaxId = "SIN must be exactly 9 digits.";
    }
  }

  if (stepIndex === 1) {
    if (!form.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.mobile.trim()) {
      nextErrors.mobile = "Mobile number is required.";
    } else if (!isValidPhone10(form.mobile)) {
      nextErrors.mobile = "Mobile number must be exactly 10 digits.";
    }

    if (form.alternatePhone.trim() && !isValidPhone10(form.alternatePhone)) {
      nextErrors.alternatePhone = "Alternate phone must be exactly 10 digits.";
    }

    if (!form.residentialAddress.line1.trim()) {
      nextErrors.residentialLine1 = "Residential address line 1 is required.";
    } else if (form.residentialAddress.line1.trim().length < 5) {
      nextErrors.residentialLine1 =
        "Residential address line 1 must be at least 5 characters.";
    }

    if (!form.residentialAddress.city.trim()) {
      nextErrors.residentialCity = "City is required.";
    } else if (!isValidName(form.residentialAddress.city, 2, 50)) {
      nextErrors.residentialCity = "City must contain letters only.";
    }

    if (!form.residentialAddress.state.trim()) {
      nextErrors.residentialState = "Province / State is required.";
    } else if (!isValidName(form.residentialAddress.state, 2, 50)) {
      nextErrors.residentialState =
        "Province / State must contain letters only.";
    }

    if (!form.residentialAddress.postalCode.trim()) {
      nextErrors.residentialPostalCode = "Postal code is required.";
    } else if (!isValidPostalCode(form.residentialAddress.postalCode)) {
      nextErrors.residentialPostalCode = "Enter a valid postal code.";
    }

    if (!form.residentialAddress.country.trim()) {
      nextErrors.residentialCountry = "Country is required.";
    } else if (!isValidName(form.residentialAddress.country, 2, 50)) {
      nextErrors.residentialCountry = "Country must contain letters only.";
    }

    if (!form.mailingSameAsResidential) {
      if (!form.mailingAddress.line1.trim()) {
        nextErrors.mailingLine1 = "Mailing address line 1 is required.";
      } else if (form.mailingAddress.line1.trim().length < 5) {
        nextErrors.mailingLine1 =
          "Mailing address line 1 must be at least 5 characters.";
      }

      if (!form.mailingAddress.city.trim()) {
        nextErrors.mailingCity = "City is required.";
      } else if (!isValidName(form.mailingAddress.city, 2, 50)) {
        nextErrors.mailingCity = "City must contain letters only.";
      }

      if (!form.mailingAddress.state.trim()) {
        nextErrors.mailingState = "Province / State is required.";
      } else if (!isValidName(form.mailingAddress.state, 2, 50)) {
        nextErrors.mailingState = "Province / State must contain letters only.";
      }

      if (!form.mailingAddress.postalCode.trim()) {
        nextErrors.mailingPostalCode = "Postal code is required.";
      } else if (!isValidPostalCode(form.mailingAddress.postalCode)) {
        nextErrors.mailingPostalCode = "Enter a valid postal code.";
      }

      if (!form.mailingAddress.country.trim()) {
        nextErrors.mailingCountry = "Country is required.";
      } else if (!isValidName(form.mailingAddress.country, 2, 50)) {
        nextErrors.mailingCountry = "Country must contain letters only.";
      }
    }
  }

  if (stepIndex === 2) {
    if (!form.highestEducation) {
      nextErrors.highestEducation = "Highest education level is required.";
    }

    if (form.highestEducation !== "Illiterate") {
      if (!form.fieldOfStudy.trim()) {
        nextErrors.fieldOfStudy = "Field of study is required.";
      } else if (form.fieldOfStudy.trim().length < 2) {
        nextErrors.fieldOfStudy =
          "Field of study must be at least 2 characters.";
      }

      if (!form.institutionName.trim()) {
        nextErrors.institutionName =
          "Institution / University name is required.";
      } else if (form.institutionName.trim().length < 2) {
        nextErrors.institutionName =
          "Institution / University name must be at least 2 characters.";
      }

      if (!form.graduationYear.trim()) {
        nextErrors.graduationYear = "Graduation year is required.";
      } else if (!isValidYear(form.graduationYear)) {
        nextErrors.graduationYear = "Enter a valid graduation year.";
      }
    }
  }

  if (stepIndex === 3) {
    if (!form.employmentStatus) {
      nextErrors.employmentStatus = "Employment status is required.";
    }

    if (
      form.employmentStatus === "Employed" ||
      form.employmentStatus === "Self-employed"
    ) {
      if (!form.monthlyIncome.trim()) {
        nextErrors.monthlyIncome = "Monthly income is required.";
      } else if (!isPositiveNumberString(form.monthlyIncome)) {
        nextErrors.monthlyIncome = "Monthly income must be a valid number.";
      }

      if (!form.employerName.trim()) {
        nextErrors.employerName = "Employer name is required.";
      } else if (form.employerName.trim().length < 2) {
        nextErrors.employerName =
          "Employer name must be at least 2 characters.";
      }

      if (!form.jobTitle.trim()) {
        nextErrors.jobTitle = "Job title / occupation is required.";
      } else if (form.jobTitle.trim().length < 2) {
        nextErrors.jobTitle =
          "Job title / occupation must be at least 2 characters.";
      }

      if (!form.workExperience.trim()) {
        nextErrors.workExperience = "Work experience is required.";
      } else if (!/^\d{1,2}$/.test(form.workExperience)) {
        nextErrors.workExperience =
          "Work experience must be a valid number of years.";
      }
    }

    if (!form.loanAmount.trim()) {
      nextErrors.loanAmount = "Loan amount is required.";
    } else if (!isPositiveNumberString(form.loanAmount)) {
      nextErrors.loanAmount = "Loan amount must be a valid number.";
    }

    if (!form.tenureMonths.trim()) {
      nextErrors.tenureMonths = "Loan tenure is required.";
    } else if (!/^\d+$/.test(form.tenureMonths)) {
      nextErrors.tenureMonths = "Tenure must be a number.";
    } else if (Number(form.tenureMonths) <= 0) {
      nextErrors.tenureMonths = "Tenure must be greater than 0.";
    } else if (Number(form.tenureMonths) > 360) {
      nextErrors.tenureMonths = "Tenure cannot exceed 360 months.";
    }

    if (!form.existingLoans) {
      nextErrors.existingLoans =
        "Please select whether you have existing loans.";
    }

    if (form.existingLoans === "Yes") {
      if (!form.totalMonthlyLoanPayments.trim()) {
        nextErrors.totalMonthlyLoanPayments =
          "Total monthly loan payments are required.";
      } else if (!isPositiveNumberString(form.totalMonthlyLoanPayments)) {
        nextErrors.totalMonthlyLoanPayments =
          "Total monthly loan payments must be a valid number.";
      }
    }

    if (!form.bankAccounts.length) {
      nextErrors.bankAccounts = "At least one bank account is required.";
    }

    form.bankAccounts.forEach((account, index) => {
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
      } else if (!/^\d{5,17}$/.test(account.accountNumber)) {
        nextErrors[`${prefix}.accountNumber`] =
          "Account number must be 5 to 17 digits.";
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
    });

    const repaymentAccountsCount = form.bankAccounts.filter(
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
      form.governmentIdProof,
      "Government ID proof"
    );
    if (governmentIdProofError) {
      nextErrors.governmentIdProof = governmentIdProofError;
    }

    const incomeProofError = validateFile(form.incomeProof, "Income proof");
    if (incomeProofError) {
      nextErrors.incomeProof = incomeProofError;
    }

    const bankStatementError = validateFile(
      form.bankStatement,
      "Bank statement"
    );
    if (bankStatementError) {
      nextErrors.bankStatement = bankStatementError;
    }

    if (!form.creditReportConsent) {
      nextErrors.creditReportConsent =
        "You must provide credit report consent.";
    }

    if (!form.declarationAccepted) {
      nextErrors.declarationAccepted =
        "You must accept the declaration before submitting.";
    }
  }

  return nextErrors;
}