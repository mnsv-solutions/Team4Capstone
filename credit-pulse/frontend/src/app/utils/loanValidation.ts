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
    if (!form.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) nextErrors.lastName = "Last name is required.";

    if (!form.dob) {
      nextErrors.dob = "Date of birth is required.";
    } else if (!isAdult(form.dob)) {
      nextErrors.dob = "Applicant must be at least 18 years old.";
    }

    if (!form.gender) nextErrors.gender = "Gender is required.";

    if (!form.maritalStatus) {
      nextErrors.maritalStatus = "Marital status is required.";
    }

    if (!form.nationality.trim()) {
      nextErrors.nationality = "Nationality is required.";
    }

    if (!form.governmentIdType) {
      nextErrors.governmentIdType = "Government ID type is required.";
    }

    if (!form.governmentIdNumber.trim()) {
      nextErrors.governmentIdNumber = "Government ID number is required.";
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.mobile.trim()) {
      nextErrors.mobile = "Mobile number is required.";
    } else if (form.mobile.length < 10) {
      nextErrors.mobile = "Mobile number must be at least 10 digits.";
    }

    if (!form.residentialAddress.line1.trim()) {
      nextErrors.residentialLine1 = "Residential address line 1 is required.";
    }
    if (!form.residentialAddress.city.trim()) {
      nextErrors.residentialCity = "City is required.";
    }
    if (!form.residentialAddress.state.trim()) {
      nextErrors.residentialState = "Province / State is required.";
    }
    if (!form.residentialAddress.postalCode.trim()) {
      nextErrors.residentialPostalCode = "Postal code is required.";
    }
    if (!form.residentialAddress.country.trim()) {
      nextErrors.residentialCountry = "Country is required.";
    }

    if (!form.mailingSameAsResidential) {
      if (!form.mailingAddress.line1.trim()) {
        nextErrors.mailingLine1 = "Mailing address line 1 is required.";
      }
      if (!form.mailingAddress.city.trim()) {
        nextErrors.mailingCity = "City is required.";
      }
      if (!form.mailingAddress.state.trim()) {
        nextErrors.mailingState = "Province / State is required.";
      }
      if (!form.mailingAddress.postalCode.trim()) {
        nextErrors.mailingPostalCode = "Postal code is required.";
      }
      if (!form.mailingAddress.country.trim()) {
        nextErrors.mailingCountry = "Country is required.";
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
      }
      if (!form.institutionName.trim()) {
        nextErrors.institutionName = "Institution / University name is required.";
      }
      if (!form.graduationYear.trim()) {
        nextErrors.graduationYear = "Graduation year is required.";
      } else if (!/^\d{4}$/.test(form.graduationYear)) {
        nextErrors.graduationYear = "Enter a valid 4-digit year.";
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
      if (!form.employerName.trim()) {
        nextErrors.employerName = "Employer name is required.";
      }
      if (!form.jobTitle.trim()) {
        nextErrors.jobTitle = "Job title / occupation is required.";
      }
      if (!form.workExperience.trim()) {
        nextErrors.workExperience = "Work experience is required.";
      }
    }

    if (!form.monthlyIncome.trim()) {
      nextErrors.monthlyIncome = "Monthly income is required.";
    }

    if (!form.existingLoans) {
      nextErrors.existingLoans =
        "Please select whether you have existing loans.";
    }

    if (form.existingLoans === "Yes" && !form.totalMonthlyLoanPayments.trim()) {
      nextErrors.totalMonthlyLoanPayments =
        "Total monthly loan payments are required.";
    }

    if (!form.bankAccounts.length) {
      nextErrors.bankAccounts = "At least one bank account is required.";
    }

    form.bankAccounts.forEach((account, index) => {
      const prefix = `bankAccounts.${index}`;

      if (!account.bankName.trim()) {
        nextErrors[`${prefix}.bankName`] = "Bank name is required.";
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

    const bankStatementError = validateFile(form.bankStatement, "Bank statement");
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