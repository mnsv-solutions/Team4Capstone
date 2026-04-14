"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  UserRound,
  MapPin,
  GraduationCap,
  BriefcaseBusiness,
  FileText,
  Upload,
  Plus,
  Trash2,
  Landmark,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  sanitizeDigits,
  sanitizeAlphaNumericUpper,
  sanitizeName,
  sanitizeAddressText,
  sanitizeLettersSpaces,
  sanitizeAlphaNumericBasic,
  validateLoanStep,
  createEmptyBankAccount,
  type Address,
  type LoanApplicationForm,
  type FormErrors,
} from "../utils/loanValidation";

type StepKey =
  | "personal"
  | "contact"
  | "education"
  | "financial"
  | "documents";

type LoanProduct = {
  productId: string;
  productCode: string;
  productName: string;
  minAmount: string;
  maxAmount: string;
  minTenureMonths: number;
  maxTenureMonths: number;
  minInterestRate: string;
  maxInterestRate: string;
  processingFeePercent: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type ExtendedLoanApplicationForm = LoanApplicationForm & {
  loanTypeId: string;
};

const steps: { key: StepKey; label: string }[] = [
  { key: "personal", label: "Personal Details" },
  { key: "contact", label: "Communication Details" },
  { key: "education", label: "Education Details" },
  { key: "financial", label: "Financial Details" },
  { key: "documents", label: "Document Upload" },
];

const initialAddress: Address = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

const initialForm: ExtendedLoanApplicationForm = {
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
  residentialAddress: { ...initialAddress },
  mailingSameAsResidential: false,
  mailingAddress: { ...initialAddress },

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
  loanAmount: "",
  loanTypeId: "",

  bankAccounts: [{ ...createEmptyBankAccount(), isRepaymentAccount: true }],

  governmentIdProof: null,
  incomeProof: null,
  bankStatement: null,

  creditReportConsent: false,
  declarationAccepted: false,
};

export default function LoanApplicationPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<ExtendedLoanApplicationForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  const activeProducts = useMemo(() => {
    return products.filter(
      (product) => String(product.status).toLowerCase() === "active"
    );
  }, [products]);

  const selectedLoanProduct = useMemo(() => {
    return activeProducts.find(
      (product) => product.productId === form.loanTypeId
    );
  }, [activeProducts, form.loanTypeId]);

  const progressPercent = useMemo(() => {
    return ((currentStep + 1) / steps.length) * 100;
  }, [currentStep]);

  useEffect(() => {
    if (authLoading) return;

    if (!token || !isAuthenticated) {
      router.push("/signin");
    }
  }, [authLoading, token, isAuthenticated, router]);

  useEffect(() => {
    if (form.mailingSameAsResidential) {
      setForm((prev) => ({
        ...prev,
        mailingAddress: { ...prev.residentialAddress },
      }));
    }
  }, [form.mailingSameAsResidential, form.residentialAddress]);

  useEffect(() => {
    async function fetchProducts() {
      if (!token) return;

      try {
        setProductsLoading(true);
        setProductsError("");

        const response = await axios.get(process.env.NEXT_PUBLIC_API_URL + "/products/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const fetchedProducts = Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
        setProductsError("Unable to load loan products.");
      } finally {
        setProductsLoading(false);
      }
    }

    fetchProducts();
  }, [token]);

  useEffect(() => {
    if (!selectedLoanProduct) return;

    setErrors((prev) => {
      const next = { ...prev };
      delete next.loanAmount;
      delete next.tenureMonths;
      delete next.loanTypeId;
      return next;
    });

    setForm((prev) => ({
      ...prev,
      loanAmount:
        prev.loanAmount &&
        Number(prev.loanAmount) >= Number(selectedLoanProduct.minAmount) &&
        Number(prev.loanAmount) <= Number(selectedLoanProduct.maxAmount)
          ? prev.loanAmount
          : "",
      tenureMonths:
        prev.tenureMonths &&
        Number(prev.tenureMonths) >= selectedLoanProduct.minTenureMonths &&
        Number(prev.tenureMonths) <= selectedLoanProduct.maxTenureMonths
          ? prev.tenureMonths
          : "",
    }));
  }, [selectedLoanProduct]);

  function setField<K extends keyof ExtendedLoanApplicationForm>(
    key: K,
    value: ExtendedLoanApplicationForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  }

  function setAddressField(
    section: "residentialAddress" | "mailingAddress",
    key: keyof Address,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  }

  function setBankField(
    index: number,
    key: keyof ExtendedLoanApplicationForm["bankAccounts"][number],
    value: string | boolean
  ) {
    setForm((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((account, accountIndex) =>
        accountIndex === index ? { ...account, [key]: value } : account
      ),
    }));

    const errorKey = `bankAccounts.${index}.${String(key)}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  }

  function setRepaymentAccount(index: number) {
    setForm((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((account, accountIndex) => ({
        ...account,
        isRepaymentAccount: accountIndex === index,
      })),
    }));

    if (errors.repaymentAccount) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.repaymentAccount;
        return next;
      });
    }
  }

  function addBankAccount() {
    setForm((prev) => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, createEmptyBankAccount()],
    }));
  }

  function removeBankAccount(index: number) {
    setForm((prev) => {
      if (prev.bankAccounts.length === 1) return prev;

      const removedAccount = prev.bankAccounts[index];
      const remainingAccounts = prev.bankAccounts.filter(
        (_, accountIndex) => accountIndex !== index
      );

      if (removedAccount.isRepaymentAccount && remainingAccounts.length > 0) {
        remainingAccounts[0] = {
          ...remainingAccounts[0],
          isRepaymentAccount: true,
        };
      }

      return {
        ...prev,
        bankAccounts: remainingAccounts,
      };
    });

    setErrors((prev) => {
      const next: FormErrors = {};

      Object.entries(prev).forEach(([key, value]) => {
        if (!key.startsWith(`bankAccounts.${index}.`)) {
          next[key] = value;
        }
      });

      delete next.bankAccounts;
      delete next.repaymentAccount;

      return next;
    });
  }
    function handleNext() {
    setSuccessMsg("");
    setApiError("");

    const stepErrors = validateLoanStep(form as LoanApplicationForm, currentStep);

    if (currentStep === 3) {
      if (!form.loanTypeId) {
        stepErrors.loanTypeId = "Loan type is required.";
      }

      if (selectedLoanProduct) {
        const loanAmountNumber = Number(form.loanAmount);
        const minAmount = Number(selectedLoanProduct.minAmount);
        const maxAmount = Number(selectedLoanProduct.maxAmount);

        if (!form.loanAmount.trim()) {
          stepErrors.loanAmount = "Requested loan amount is required.";
        } else if (Number.isNaN(loanAmountNumber)) {
          stepErrors.loanAmount = "Requested loan amount must be a valid number.";
        } else if (loanAmountNumber < minAmount || loanAmountNumber > maxAmount) {
          stepErrors.loanAmount = `Requested loan amount must be between ${selectedLoanProduct.minAmount} and ${selectedLoanProduct.maxAmount}.`;
        }

        const tenureNumber = Number(form.tenureMonths);
        const minTenure = selectedLoanProduct.minTenureMonths;
        const maxTenure = selectedLoanProduct.maxTenureMonths;

        if (!form.tenureMonths.trim()) {
          stepErrors.tenureMonths = "Requested loan tenure is required.";
        } else if (Number.isNaN(tenureNumber)) {
          stepErrors.tenureMonths = "Requested loan tenure must be a valid number.";
        } else if (tenureNumber < minTenure || tenureNumber > maxTenure) {
          stepErrors.tenureMonths = `Requested loan tenure must be between ${minTenure} and ${maxTenure} months.`;
        }
      }
    }

    setErrors(stepErrors);

    if (Object.keys(stepErrors).length > 0) return;

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleBack() {
    setSuccessMsg("");
    setApiError("");
    setErrors({});

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function buildLoanApplicationPayload(formDataInput: ExtendedLoanApplicationForm) {
    return {
      firstName: formDataInput.firstName,
      lastName: formDataInput.lastName,
      dob: formDataInput.dob,
      gender: formDataInput.gender,
      maritalStatus: formDataInput.maritalStatus,
      nationality: formDataInput.nationality,
      governmentIdType: formDataInput.governmentIdType,
      governmentIdNumber: formDataInput.governmentIdNumber,
      sinTaxId: formDataInput.sinTaxId,

      email: formDataInput.email,
      mobile: formDataInput.mobile,
      alternatePhone: formDataInput.alternatePhone || "",

      mailingSameAsResidential: formDataInput.mailingSameAsResidential,

      residentialAddress: {
        line1: formDataInput.residentialAddress.line1,
        line2: formDataInput.residentialAddress.line2 || "",
        city: formDataInput.residentialAddress.city,
        state: formDataInput.residentialAddress.state,
        postalCode: formDataInput.residentialAddress.postalCode,
        country: formDataInput.residentialAddress.country,
      },

      mailingAddress: {
        line1: formDataInput.mailingAddress.line1,
        line2: formDataInput.mailingAddress.line2 || "",
        city: formDataInput.mailingAddress.city,
        state: formDataInput.mailingAddress.state,
        postalCode: formDataInput.mailingAddress.postalCode,
        country: formDataInput.mailingAddress.country,
      },

      highestEducation: formDataInput.highestEducation,
      fieldOfStudy: formDataInput.fieldOfStudy || "N/A",
      institutionName: formDataInput.institutionName || "N/A",
      graduationYear: formDataInput.graduationYear || "",

      employmentStatus: formDataInput.employmentStatus,
      employerName: formDataInput.employerName || "",
      jobTitle: formDataInput.jobTitle || "",
      workExperience: formDataInput.workExperience || "",
      monthlyIncome: formDataInput.monthlyIncome || "",
      otherIncomeSources: formDataInput.otherIncomeSources || "",
      existingLoans: formDataInput.existingLoans || "",
      totalMonthlyLoanPayments: formDataInput.totalMonthlyLoanPayments || "",
      tenureMonths: formDataInput.tenureMonths || "",
      loanAmount: formDataInput.loanAmount || "",
      loanTypeId: formDataInput.loanTypeId || "",

      bankAccounts: formDataInput.bankAccounts.map((account) => ({
        bankName: account.bankName,
        institutionNumber: account.institutionNumber,
        transitNumber: account.transitNumber,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        swiftBic: account.swiftBic || "",
        isRepaymentAccount: account.isRepaymentAccount,
      })),

      creditReportConsent: formDataInput.creditReportConsent,
      declarationAccepted: formDataInput.declarationAccepted,
    };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    setSuccessMsg("");
    setApiError("");

    const finalErrors = validateLoanStep(form as LoanApplicationForm, currentStep);

    if (currentStep === 3) {
      if (!form.loanTypeId) {
        finalErrors.loanTypeId = "Loan type is required.";
      }

      if (selectedLoanProduct) {
        const loanAmountNumber = Number(form.loanAmount);
        const minAmount = Number(selectedLoanProduct.minAmount);
        const maxAmount = Number(selectedLoanProduct.maxAmount);

        if (!form.loanAmount.trim()) {
          finalErrors.loanAmount = "Requested loan amount is required.";
        } else if (Number.isNaN(loanAmountNumber)) {
          finalErrors.loanAmount =
            "Requested loan amount must be a valid number.";
        } else if (loanAmountNumber < minAmount || loanAmountNumber > maxAmount) {
          finalErrors.loanAmount = `Requested loan amount must be between ${selectedLoanProduct.minAmount} and ${selectedLoanProduct.maxAmount}.`;
        }

        const tenureNumber = Number(form.tenureMonths);
        const minTenure = selectedLoanProduct.minTenureMonths;
        const maxTenure = selectedLoanProduct.maxTenureMonths;

        if (!form.tenureMonths.trim()) {
          finalErrors.tenureMonths = "Requested loan tenure is required.";
        } else if (Number.isNaN(tenureNumber)) {
          finalErrors.tenureMonths =
            "Requested loan tenure must be a valid number.";
        } else if (tenureNumber < minTenure || tenureNumber > maxTenure) {
          finalErrors.tenureMonths = `Requested loan tenure must be between ${minTenure} and ${maxTenure} months.`;
        }
      }
    }

    setErrors(finalErrors);

    if (Object.keys(finalErrors).length > 0) return;

    if (!token) {
      setApiError("User not authenticated.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = buildLoanApplicationPayload(form);

      const createResponse = await axios.post(process.env.NEXT_PUBLIC_API_URL + "/application/create", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const applicationId = createResponse.data.application_id;

      const multipartData = new FormData();
      multipartData.append("application_id", applicationId);

      if (form.governmentIdProof) {
        multipartData.append("governmentIdProof", form.governmentIdProof);
      }
      if (form.incomeProof) {
        multipartData.append("incomeProof", form.incomeProof);
      }
      if (form.bankStatement) {
        multipartData.append("bankStatement", form.bankStatement);
      }

      await axios.post(process.env.NEXT_PUBLIC_API_URL + "/application/files", multipartData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccessMsg("Loan application submitted successfully.");
      setApiError("");
      setErrors({});
      setSubmitted(false);
      setForm(initialForm);
      setCurrentStep(0);

      setTimeout(() => {
        router.push("/dashboard");
      }, 900);

    } catch (error) {
      let message = "Failed to submit loan application.";

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const responseData = error.response?.data;
        const apiMessage = responseData?.message;

        console.log("Loan submit error status:", statusCode);
        console.log("Loan submit error data:", responseData);

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
        } else if (typeof responseData === "string") {
          message = responseData;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      setApiError(message);
      setSuccessMsg("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getStepIcon() {
    const iconClassName = "cp-loan-step-heading-icon";

    switch (currentStep) {
      case 0:
        return <UserRound className={iconClassName} />;
      case 1:
        return <MapPin className={iconClassName} />;
      case 2:
        return <GraduationCap className={iconClassName} />;
      case 3:
        return <BriefcaseBusiness className={iconClassName} />;
      case 4:
        return <FileText className={iconClassName} />;
      default:
        return <UserRound className={iconClassName} />;
    }
  }

  function renderStepHeading() {
    const headingMap = [
      { step: "Step 1 of 5", title: "Personal Details" },
      { step: "Step 2 of 5", title: "Communication Details" },
      { step: "Step 3 of 5", title: "Education Details" },
      { step: "Step 4 of 5", title: "Financial Details" },
      { step: "Step 5 of 5", title: "Document Upload" },
    ];

    const current = headingMap[currentStep];

    return (
      <div className="cp-loan-step-header">
        <div className="cp-loan-step-icon">{getStepIcon()}</div>
        <div>
          <div className="cp-loan-step-count">{current.step}</div>
          <h2 className="cp-loan-section-title mb-0">{current.title}</h2>
        </div>
      </div>
    );
  }

  function renderInputError(key: string) {
    return errors[key] ? (
      <div className="invalid-feedback d-block">{errors[key]}</div>
    ) : null;
  }

  function renderUploadField(
    id: "governmentIdProof" | "incomeProof" | "bankStatement",
    label: string,
    helper: string,
    file: File | null
  ) {
    return (
      <div className="mb-4">
        <label className="form-label fw-semibold">{label} *</label>

        <label
          htmlFor={id}
          className={`cp-loan-upload-box ${
            errors[id] ? "cp-loan-upload-error" : ""
          }`}
        >
          <Upload className="cp-loan-upload-svg" />
          <div className="cp-loan-upload-text">
            {file ? file.name : "Click to upload"}
          </div>
          <div className="cp-loan-upload-helper">{helper}</div>
        </label>

        <input
          id={id}
          type="file"
          className="d-none"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0] || null;
            setField(id, selectedFile);
          }}
        />

        {renderInputError(id)}
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
        <div className="cp-loan-top">
          <h1 className="cp-loan-title">Loan Application</h1>
          <p className="cp-loan-description">
            Complete all steps to submit your loan application
          </p>
        </div>

        <div className="cp-loan-progress-wrap">
          <div className="cp-loan-steps-row">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;

              return (
                <div className="cp-loan-step-item" key={step.key}>
                  <div
                    className={[
                      "cp-loan-step-circle",
                      isCompleted ? "completed" : "",
                      isActive ? "active" : "",
                    ].join(" ")}
                  >
                    {isCompleted ? "✓" : index + 1}
                  </div>
                  <span
                    className={[
                      "cp-loan-step-label",
                      isCompleted || isActive ? "active" : "",
                    ].join(" ")}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="cp-loan-progress-bar">
            <div
              className="cp-loan-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {renderStepHeading()}

        {successMsg && (
          <div
            className="alert alert-success mt-4"
            role="status"
            aria-live="polite"
          >
            {successMsg}
          </div>
        )}

        {apiError && (
          <div className="alert alert-danger mt-4" role="alert">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="cp-loan-form mt-4">
          {currentStep === 0 && (
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">First Name *</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.firstName ? "is-invalid" : ""
                  }`}
                  value={form.firstName}
                  onChange={(e) =>
                    setField("firstName", sanitizeName(e.target.value).slice(0, 50))
                  }
                  placeholder="Enter first name"
                  maxLength={50}
                />
                {renderInputError("firstName")}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Last Name *</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.lastName ? "is-invalid" : ""
                  }`}
                  value={form.lastName}
                  onChange={(e) =>
                    setField("lastName", sanitizeName(e.target.value).slice(0, 50))
                  }
                  placeholder="Enter last name"
                  maxLength={50}
                />
                {renderInputError("lastName")}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Date of Birth *</label>
                <input
                  type="date"
                  className={`form-control ${errors.dob ? "is-invalid" : ""}`}
                  value={form.dob}
                  onChange={(e) => setField("dob", e.target.value)}
                />
                {renderInputError("dob")}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Gender *</label>
                <select
                  className={`form-select ${
                    errors.gender ? "is-invalid" : ""
                  }`}
                  value={form.gender}
                  onChange={(e) => setField("gender", e.target.value)}
                >
                  <option value="">Select gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {renderInputError("gender")}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Marital Status *</label>
                <select
                  className={`form-select ${
                    errors.maritalStatus ? "is-invalid" : ""
                  }`}
                  value={form.maritalStatus}
                  onChange={(e) => setField("maritalStatus", e.target.value)}
                >
                  <option value="">Select marital status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
                {renderInputError("maritalStatus")}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Nationality *</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.nationality ? "is-invalid" : ""
                  }`}
                  value={form.nationality}
                  onChange={(e) =>
                    setField(
                      "nationality",
                      sanitizeLettersSpaces(e.target.value).slice(0, 40)
                    )
                  }
                  placeholder="Enter nationality"
                  maxLength={40}
                />
                {renderInputError("nationality")}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">
                  Government ID Type *
                </label>
                <select
                  className={`form-select ${
                    errors.governmentIdType ? "is-invalid" : ""
                  }`}
                  value={form.governmentIdType}
                  onChange={(e) => setField("governmentIdType", e.target.value)}
                >
                  <option value="">Select ID type</option>
                  <option value="Passport">Passport</option>
                  <option value="Driver License">Driver License</option>
                  <option value="PR Card">PR Card</option>
                  <option value="National ID">National ID</option>
                </select>
                {renderInputError("governmentIdType")}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">
                  Government ID Number *
                </label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.governmentIdNumber ? "is-invalid" : ""
                  }`}
                  value={form.governmentIdNumber}
                  onChange={(e) =>
                    setField(
                      "governmentIdNumber",
                      e.target.value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 20)
                    )
                  }
                  placeholder="Enter ID number"
                  maxLength={20}
                />
                {renderInputError("governmentIdNumber")}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">SIN / Tax ID *</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.sinTaxId ? "is-invalid" : ""
                  }`}
                  value={form.sinTaxId}
                  onChange={(e) =>
                    setField(
                      "sinTaxId",
                      sanitizeDigits(e.target.value).slice(0, 9)
                    )
                  }
                  placeholder="Enter SIN (9 digits)"
                  maxLength={9}
                  required
                />
                {renderInputError("sinTaxId")}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Email Address *</label>
                <input
                  type="email"
                  className={`form-control ${
                    errors.email ? "is-invalid" : ""
                  }`}
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="Enter email address"
                />
                {renderInputError("email")}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Mobile Number *</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.mobile ? "is-invalid" : ""
                  }`}
                  value={form.mobile}
                  onChange={(e) =>
                    setField("mobile", sanitizeDigits(e.target.value).slice(0, 10))
                  }
                  placeholder="Enter mobile number"
                  maxLength={10}
                />
                {renderInputError("mobile")}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Alternate Phone</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.alternatePhone ? "is-invalid" : ""
                  }`}
                  value={form.alternatePhone}
                  onChange={(e) =>
                    setField(
                      "alternatePhone",
                      sanitizeDigits(e.target.value).slice(0, 10)
                    )
                  }
                  placeholder="Enter alternate phone"
                  maxLength={10}
                />
                {renderInputError("alternatePhone")}
              </div>

              <div className="col-12">
                <h5 className="cp-loan-subtitle mt-2">Residential Address</h5>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Address Line 1 *</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.residentialLine1 ? "is-invalid" : ""
                  }`}
                  value={form.residentialAddress.line1}
                  onChange={(e) =>
                    setAddressField(
                      "residentialAddress",
                      "line1",
                      sanitizeAddressText(e.target.value).slice(0, 100)
                    )
                  }
                  placeholder="Enter address line 1"
                  maxLength={100}
                />
                {renderInputError("residentialLine1")}
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">Address Line 2</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.residentialAddress.line2}
                  onChange={(e) =>
                    setAddressField(
                      "residentialAddress",
                      "line2",
                      sanitizeAddressText(e.target.value).slice(0, 100)
                    )
                  }
                  placeholder="Enter address line 2"
                  maxLength={100}
                />
              </div>
                            <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">City *</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.residentialCity ? "is-invalid" : ""
                  }`}
                  value={form.residentialAddress.city}
                  onChange={(e) =>
                    setAddressField(
                      "residentialAddress",
                      "city",
                      sanitizeLettersSpaces(e.target.value).slice(0, 50)
                    )
                  }
                  placeholder="Enter city"
                  maxLength={50}
                />
                {renderInputError("residentialCity")}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Province / State *</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.residentialState ? "is-invalid" : ""
                  }`}
                  value={form.residentialAddress.state}
                  onChange={(e) =>
                    setAddressField(
                      "residentialAddress",
                      "state",
                      sanitizeLettersSpaces(e.target.value).slice(0, 50)
                    )
                  }
                  placeholder="Enter province / state"
                  maxLength={50}
                />
                {renderInputError("residentialState")}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Postal Code *</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.residentialPostalCode ? "is-invalid" : ""
                  }`}
                  value={form.residentialAddress.postalCode}
                  onChange={(e) =>
                    setAddressField(
                      "residentialAddress",
                      "postalCode",
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9\s-]/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="Enter postal code"
                  maxLength={10}
                />
                {renderInputError("residentialPostalCode")}
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-semibold">Country *</label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.residentialCountry ? "is-invalid" : ""
                  }`}
                  value={form.residentialAddress.country}
                  onChange={(e) =>
                    setAddressField(
                      "residentialAddress",
                      "country",
                      sanitizeLettersSpaces(e.target.value).slice(0, 50)
                    )
                  }
                  placeholder="Enter country"
                  maxLength={50}
                />
                {renderInputError("residentialCountry")}
              </div>

              <div className="col-12 mt-3">
                <div className="form-check">
                  <input
                    id="mailingSameAsResidential"
                    type="checkbox"
                    className="form-check-input"
                    checked={form.mailingSameAsResidential}
                    onChange={(e) =>
                      setField("mailingSameAsResidential", e.target.checked)
                    }
                  />
                  <label
                    htmlFor="mailingSameAsResidential"
                    className="form-check-label"
                  >
                    Mailing address same as residential address
                  </label>
                </div>
              </div>

              {!form.mailingSameAsResidential && (
                <>
                  <div className="col-12">
                    <h5 className="cp-loan-subtitle mt-2">Mailing Address</h5>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.mailingLine1 ? "is-invalid" : ""
                      }`}
                      value={form.mailingAddress.line1}
                      onChange={(e) =>
                        setAddressField(
                          "mailingAddress",
                          "line1",
                          sanitizeAddressText(e.target.value).slice(0, 100)
                        )
                      }
                      placeholder="Enter address line 1"
                      maxLength={100}
                    />
                    {renderInputError("mailingLine1")}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.mailingAddress.line2}
                      onChange={(e) =>
                        setAddressField(
                          "mailingAddress",
                          "line2",
                          sanitizeAddressText(e.target.value).slice(0, 100)
                        )
                      }
                      placeholder="Enter address line 2"
                      maxLength={100}
                    />
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">City *</label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.mailingCity ? "is-invalid" : ""
                      }`}
                      value={form.mailingAddress.city}
                      onChange={(e) =>
                        setAddressField(
                          "mailingAddress",
                          "city",
                          sanitizeLettersSpaces(e.target.value).slice(0, 50)
                        )
                      }
                      placeholder="Enter city"
                      maxLength={50}
                    />
                    {renderInputError("mailingCity")}
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">
                      Province / State *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.mailingState ? "is-invalid" : ""
                      }`}
                      value={form.mailingAddress.state}
                      onChange={(e) =>
                        setAddressField(
                          "mailingAddress",
                          "state",
                          sanitizeLettersSpaces(e.target.value).slice(0, 50)
                        )
                      }
                      placeholder="Enter province / state"
                      maxLength={50}
                    />
                    {renderInputError("mailingState")}
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Postal Code *</label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.mailingPostalCode ? "is-invalid" : ""
                      }`}
                      value={form.mailingAddress.postalCode}
                      onChange={(e) =>
                        setAddressField(
                          "mailingAddress",
                          "postalCode",
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9\s-]/g, "")
                            .slice(0, 10)
                        )
                      }
                      placeholder="Enter postal code"
                      maxLength={10}
                    />
                    {renderInputError("mailingPostalCode")}
                  </div>

                  <div className="col-12 col-md-3">
                    <label className="form-label fw-semibold">Country *</label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.mailingCountry ? "is-invalid" : ""
                      }`}
                      value={form.mailingAddress.country}
                      onChange={(e) =>
                        setAddressField(
                          "mailingAddress",
                          "country",
                          sanitizeLettersSpaces(e.target.value).slice(0, 50)
                        )
                      }
                      placeholder="Enter country"
                      maxLength={50}
                    />
                    {renderInputError("mailingCountry")}
                  </div>
                </>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">
                  Highest Education *
                </label>
                <select
                  className={`form-select ${
                    errors.highestEducation ? "is-invalid" : ""
                  }`}
                  value={form.highestEducation}
                  onChange={(e) => setField("highestEducation", e.target.value)}
                >
                  <option value="">Select education level</option>
                  <option value="Illiterate">Illiterate</option>
                  <option value="High School">High School</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                  <option value="Doctorate">Doctorate</option>
                </select>
                {renderInputError("highestEducation")}
              </div>

              {form.highestEducation !== "Illiterate" && (
                <>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">
                      Field of Study *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.fieldOfStudy ? "is-invalid" : ""
                      }`}
                      value={form.fieldOfStudy}
                      onChange={(e) =>
                        setField(
                          "fieldOfStudy",
                          sanitizeLettersSpaces(e.target.value).slice(0, 60)
                        )
                      }
                      placeholder="Enter field of study"
                      maxLength={60}
                    />
                    {renderInputError("fieldOfStudy")}
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">
                      Institution / University Name *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.institutionName ? "is-invalid" : ""
                      }`}
                      value={form.institutionName}
                      onChange={(e) =>
                        setField(
                          "institutionName",
                          sanitizeAlphaNumericBasic(e.target.value).slice(0, 80)
                        )
                      }
                      placeholder="Enter institution name"
                      maxLength={80}
                    />
                    {renderInputError("institutionName")}
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">
                      Graduation Year *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.graduationYear ? "is-invalid" : ""
                      }`}
                      value={form.graduationYear}
                      onChange={(e) =>
                        setField(
                          "graduationYear",
                          sanitizeDigits(e.target.value).slice(0, 4)
                        )
                      }
                      placeholder="Enter graduation year"
                      maxLength={4}
                    />
                    {renderInputError("graduationYear")}
                  </div>
                </>
              )}
            </div>
          )}
                    {currentStep === 3 && (
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Employment Status *</label>
                <select
                  className={`form-select ${
                    errors.employmentStatus ? "is-invalid" : ""
                  }`}
                  value={form.employmentStatus}
                  onChange={(e) => setField("employmentStatus", e.target.value)}
                >
                  <option value="">Select employment status</option>
                  <option value="Employed">Employed</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Student">Student</option>
                  <option value="Retired">Retired</option>
                </select>
                {renderInputError("employmentStatus")}
              </div>

              {form.employmentStatus === "Employed" && (
                <>
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Employer Name *</label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.employerName ? "is-invalid" : ""
                      }`}
                      value={form.employerName}
                      onChange={(e) =>
                        setField(
                          "employerName",
                          sanitizeAlphaNumericBasic(e.target.value).slice(0, 80)
                        )
                      }
                      placeholder="Enter employer name"
                      maxLength={80}
                    />
                    {renderInputError("employerName")}
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">
                      Job Title / Occupation *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.jobTitle ? "is-invalid" : ""
                      }`}
                      value={form.jobTitle}
                      onChange={(e) =>
                        setField(
                          "jobTitle",
                          sanitizeLettersSpaces(e.target.value).slice(0, 60)
                        )
                      }
                      placeholder="Enter job title / occupation"
                      maxLength={60}
                    />
                    {renderInputError("jobTitle")}
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Work Experience *</label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.workExperience ? "is-invalid" : ""
                      }`}
                      value={form.workExperience}
                      onChange={(e) =>
                        setField(
                          "workExperience",
                          sanitizeDigits(e.target.value).slice(0, 2)
                        )
                      }
                      placeholder="Enter work experience in years"
                      maxLength={2}
                    />
                    {renderInputError("workExperience")}
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Monthly Income *</label>
                    <input
                      type="text"
                      className={`form-control ${
                        errors.monthlyIncome ? "is-invalid" : ""
                      }`}
                      value={form.monthlyIncome}
                      onChange={(e) =>
                        setField("monthlyIncome", sanitizeDigits(e.target.value))
                      }
                      placeholder="Enter monthly income"
                    />
                    {renderInputError("monthlyIncome")}
                  </div>
                </>
              )}

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Other Income Sources</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.otherIncomeSources}
                  onChange={(e) =>
                    setField(
                      "otherIncomeSources",
                      sanitizeAlphaNumericBasic(e.target.value).slice(0, 100)
                    )
                  }
                  placeholder="Enter other income sources"
                  maxLength={100}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Existing Loans *</label>
                <select
                  className={`form-select ${
                    errors.existingLoans ? "is-invalid" : ""
                  }`}
                  value={form.existingLoans}
                  onChange={(e) => setField("existingLoans", e.target.value)}
                >
                  <option value="">Select option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {renderInputError("existingLoans")}
              </div>

              {form.existingLoans === "Yes" && (
                <div className="col-12 col-md-4">
                  <label className="form-label fw-semibold">
                    Total Monthly Loan Payments *
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      errors.totalMonthlyLoanPayments ? "is-invalid" : ""
                    }`}
                    value={form.totalMonthlyLoanPayments}
                    onChange={(e) =>
                      setField(
                        "totalMonthlyLoanPayments",
                        sanitizeDigits(e.target.value)
                      )
                    }
                    placeholder="Enter total monthly loan payments"
                  />
                  {renderInputError("totalMonthlyLoanPayments")}
                </div>
              )}

              <div className="col-12 mt-3">
                <h5 className="cp-loan-subtitle">Loan Information</h5>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">Loan Product *</label>
                <select
                  className={`form-select ${
                    errors.loanTypeId ? "is-invalid" : ""
                  }`}
                  value={form.loanTypeId}
                  onChange={(e) => setField("loanTypeId", e.target.value)}
                  disabled={productsLoading}
                >
                  <option value="">
                    {productsLoading ? "Loading products..." : "Select loan product"}
                  </option>
                  {activeProducts.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.productName}
                    </option>
                  ))}
                </select>
                {renderInputError("loanTypeId")}
                {productsError && (
                  <div className="invalid-feedback d-block">{productsError}</div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">
                  Requested Loan Amount *
                </label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.loanAmount ? "is-invalid" : ""
                  }`}
                  value={form.loanAmount}
                  onChange={(e) =>
                    setField("loanAmount", sanitizeDigits(e.target.value))
                  }
                  placeholder={
                    selectedLoanProduct
                      ? `Enter amount (${selectedLoanProduct.minAmount} - ${selectedLoanProduct.maxAmount})`
                      : "Enter requested loan amount"
                  }
                />
                {renderInputError("loanAmount")}
                {selectedLoanProduct && (
                  <div className="form-text">
                    Allowed range: {selectedLoanProduct.minAmount} to{" "}
                    {selectedLoanProduct.maxAmount}
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">
                  Requested Loan Tenure (Months) *
                </label>
                <input
                  type="text"
                  className={`form-control ${
                    errors.tenureMonths ? "is-invalid" : ""
                  }`}
                  value={form.tenureMonths}
                  onChange={(e) =>
                    setField(
                      "tenureMonths",
                      sanitizeDigits(e.target.value).slice(0, 3)
                    )
                  }
                  placeholder={
                    selectedLoanProduct
                      ? `Enter tenure (${selectedLoanProduct.minTenureMonths} - ${selectedLoanProduct.maxTenureMonths})`
                      : "Enter requested loan tenure"
                  }
                  maxLength={3}
                />
                {renderInputError("tenureMonths")}
                {selectedLoanProduct && (
                  <div className="form-text">
                    Allowed range: {selectedLoanProduct.minTenureMonths} to{" "}
                    {selectedLoanProduct.maxTenureMonths} months
                  </div>
                )}
              </div>

              <div className="col-12 mt-4">
                <div className="cp-loan-bank-topbar">
                  <div className="cp-loan-bank-topbar-left">
                    <Landmark className="cp-loan-bank-icon" />
                    <h5 className="cp-loan-subtitle mb-0">Bank Details</h5>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm cp-loan-add-btn"
                    onClick={addBankAccount}
                  >
                    <Plus size={16} />
                    Add Bank Account
                  </button>
                </div>

                {errors.bankAccounts && (
                  <div className="alert alert-danger py-2 cp-loan-alert-inline">
                    {errors.bankAccounts}
                  </div>
                )}

                {errors.repaymentAccount && (
                  <div className="alert alert-danger py-2 cp-loan-alert-inline">
                    {errors.repaymentAccount}
                  </div>
                )}

                {form.bankAccounts.map((account, index) => (
                  <div key={index} className="cp-loan-bank-card">
                    <div className="cp-loan-bank-card-header">
                      <h6 className="cp-loan-bank-card-title">
                        Bank Account {index + 1}
                      </h6>

                      {form.bankAccounts.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm cp-loan-delete-btn"
                          onClick={() => removeBankAccount(index)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      )}
                    </div>

                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">Bank Name *</label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors[`bankAccounts.${index}.bankName`]
                              ? "is-invalid"
                              : ""
                          }`}
                          value={account.bankName}
                          onChange={(e) =>
                            setBankField(
                              index,
                              "bankName",
                              sanitizeAlphaNumericBasic(e.target.value).slice(0, 80)
                            )
                          }
                          placeholder="Enter bank name"
                          maxLength={80}
                        />
                        {renderInputError(`bankAccounts.${index}.bankName`)}
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">
                          Institution Number *
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors[`bankAccounts.${index}.institutionNumber`]
                              ? "is-invalid"
                              : ""
                          }`}
                          value={account.institutionNumber}
                          onChange={(e) =>
                            setBankField(
                              index,
                              "institutionNumber",
                              sanitizeDigits(e.target.value).slice(0, 3)
                            )
                          }
                          placeholder="3 digits"
                          maxLength={3}
                        />
                        {renderInputError(`bankAccounts.${index}.institutionNumber`)}
                      </div>
                                            <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">
                          Transit / Branch Number *
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors[`bankAccounts.${index}.transitNumber`]
                              ? "is-invalid"
                              : ""
                          }`}
                          value={account.transitNumber}
                          onChange={(e) =>
                            setBankField(
                              index,
                              "transitNumber",
                              sanitizeDigits(e.target.value).slice(0, 5)
                            )
                          }
                          placeholder="5 digits"
                          maxLength={5}
                        />
                        {renderInputError(`bankAccounts.${index}.transitNumber`)}
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors[`bankAccounts.${index}.accountNumber`]
                              ? "is-invalid"
                              : ""
                          }`}
                          value={account.accountNumber}
                          onChange={(e) =>
                            setBankField(
                              index,
                              "accountNumber",
                              sanitizeDigits(e.target.value).slice(0, 17)
                            )
                          }
                          placeholder="Enter full account number"
                          maxLength={17}
                        />
                        {renderInputError(`bankAccounts.${index}.accountNumber`)}
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">
                          Account Type *
                        </label>
                        <select
                          className={`form-select ${
                            errors[`bankAccounts.${index}.accountType`]
                              ? "is-invalid"
                              : ""
                          }`}
                          value={account.accountType}
                          onChange={(e) =>
                            setBankField(index, "accountType", e.target.value)
                          }
                        >
                          <option value="">Select account type</option>
                          <option value="Savings">Savings</option>
                          <option value="Chequing">Chequing</option>
                        </select>
                        {renderInputError(`bankAccounts.${index}.accountType`)}
                      </div>

                      <div className="col-12 col-md-4">
                        <label className="form-label fw-semibold">
                          SWIFT / BIC Code
                        </label>
                        <input
                          type="text"
                          className={`form-control ${
                            errors[`bankAccounts.${index}.swiftBic`]
                              ? "is-invalid"
                              : ""
                          }`}
                          value={account.swiftBic}
                          onChange={(e) =>
                            setBankField(
                              index,
                              "swiftBic",
                              sanitizeAlphaNumericUpper(e.target.value).slice(0, 11)
                            )
                          }
                          placeholder="Optional"
                          maxLength={11}
                        />
                        {renderInputError(`bankAccounts.${index}.swiftBic`)}
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold d-block mb-2">
                          Is Repayment Account? *
                        </label>

                        <div className="cp-loan-radio-wrap">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="repaymentAccount"
                              id={`repaymentAccount-${index}`}
                              checked={account.isRepaymentAccount}
                              onChange={() => setRepaymentAccount(index)}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`repaymentAccount-${index}`}
                            >
                              Use this bank account for repayment
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <>
              {renderUploadField(
                "governmentIdProof",
                "Government ID Proof",
                "Passport / Driver License / National ID",
                form.governmentIdProof
              )}

              {renderUploadField(
                "incomeProof",
                "Income Proof",
                "Pay slip (last 3 months)",
                form.incomeProof
              )}

              {renderUploadField(
                "bankStatement",
                "Bank Statement",
                "Last 6 months bank statement",
                form.bankStatement
              )}

              <p className="cp-loan-note mb-0">
                * Accepted formats: PDF, JPG, PNG (Max size: 5MB)
              </p>

              <div className="cp-loan-consent-box">
                <div className="form-check mb-3">
                  <input
                    id="creditReportConsent"
                    type="checkbox"
                    className={`form-check-input ${
                      errors.creditReportConsent ? "is-invalid" : ""
                    }`}
                    checked={form.creditReportConsent}
                    onChange={(e) =>
                      setField("creditReportConsent", e.target.checked)
                    }
                  />
                  <label
                    htmlFor="creditReportConsent"
                    className="form-check-label"
                  >
                    I authorize CreditPulse to obtain my credit report on my
                    behalf.
                  </label>
                  {renderInputError("creditReportConsent")}
                </div>

                <div className="form-check mb-3">
                  <input
                    id="declarationAccepted"
                    type="checkbox"
                    className={`form-check-input ${
                      errors.declarationAccepted ? "is-invalid" : ""
                    }`}
                    checked={form.declarationAccepted}
                    onChange={(e) =>
                      setField("declarationAccepted", e.target.checked)
                    }
                  />
                  <label
                    htmlFor="declarationAccepted"
                    className="form-check-label"
                  >
                    I confirm that the information and documents provided are
                    accurate and complete.
                  </label>
                  {renderInputError("declarationAccepted")}
                </div>
              </div>
            </>
          )}

          <div className="cp-loan-footer">
            <button
              type="button"
              className="btn btn-outline-secondary cp-loan-btn-back"
              onClick={handleBack}
              disabled={currentStep === 0 || isSubmitting}
            >
              ← Back
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary cp-loan-btn-next"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary cp-loan-btn-next"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>

          {submitted && !successMsg && Object.keys(errors).length > 0 && (
            <div className="alert alert-danger mt-3" role="alert">
              Please fix the highlighted fields before continuing.
            </div>
          )}
        </form>
      </section>
    </main>
  );
}