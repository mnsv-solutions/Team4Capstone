"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";

const TEST_ACCESS_TOKEN ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZDI2NWU5Yy0zNzdmLTRiNjMtYWIzNi0zNDBkZWRiZjRmMDAiLCJlbWFpbCI6InN1a2hAY3JlZGl0cHVsc2UuY29tIiwicm9sZV9pZCI6ImNlNDY4YmYzLWZjZmQtNGUzOC04ZGQ1LTUyOTFjYTcyMDNjMyIsImlhdCI6MTc3NDU1NjkxMywiZXhwIjoxNzc0NTYwNTEzfQ.hDoKQoyNBCjX06WhSULJITHDhQzwH0l4ojyxTjMOT8g";
  
type DashboardApplication = {
  applicationId: string;
  applicationNumber: string;
  customerName: string | null;
  type: string | null;
  principalAmount: number | null;
  tenure: number | null;
  interestRate: number | null;
  totalAmount: number;
  balance: number;
  nextPayment: number;
  nextPaymentDate: string | null;
  status: string | null;
  applicationCreationDate: string;
};

export default function DashboardPage() {
  const [applications, setApplications] = useState<DashboardApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [authMissing, setAuthMissing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadApplications() {
      const token = TEST_ACCESS_TOKEN;

      if (!token) {
        setAuthMissing(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setAuthMissing(false);
        setErrorMsg("");

        const response = await axios.get("/api/dashboard/applications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setApplications(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const backendMessage = error.response?.data?.message;

          if (
            backendMessage === "No token provided" ||
            backendMessage === "Invalid token" ||
            backendMessage === "User not authenticated"
          ) {
            setAuthMissing(true);
            setErrorMsg("");
          } else {
            setErrorMsg(
              typeof backendMessage === "string"
                ? backendMessage
                : "Unable to load dashboard applications."
            );
          }
        } else {
          setErrorMsg("Unable to load dashboard applications.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedStatus = statusFilter.trim().toLowerCase();

    return applications.filter((item) => {
      const applicationNumber = (item.applicationNumber || "").toLowerCase();
      const customerName = (item.customerName || "").toLowerCase();
      const type = (item.type || "").toLowerCase();
      const status = (item.status || "").toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        applicationNumber.includes(normalizedSearch) ||
        customerName.includes(normalizedSearch) ||
        type.includes(normalizedSearch) ||
        status.includes(normalizedSearch);

      const matchesStatus =
        normalizedStatus === "all" || status === normalizedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const normalizeStatus = (value: string | null) =>
      (value || "").trim().toLowerCase();

    return {
      all: applications.length,
      underReview: applications.filter(
        (item) => normalizeStatus(item.status) === "under review"
      ).length,
      approved: applications.filter(
        (item) => normalizeStatus(item.status) === "approved"
      ).length,
      disbursed: applications.filter(
        (item) => normalizeStatus(item.status) === "disbursed"
      ).length,
      closed: applications.filter(
        (item) => normalizeStatus(item.status) === "closed"
      ).length,
    };
  }, [applications]);

  function formatCurrency(value: number | null) {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  function formatDate(value: string | null) {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusClass(status: string | null) {
    const normalized = (status || "").trim().toLowerCase();

    if (normalized === "under review") return "review";
    if (normalized === "approved") return "approved";
    if (normalized === "disbursed") return "disbursed";
    if (normalized === "closed") return "closed";

    return "default";
  }

  function getAmountMeta(item: DashboardApplication) {
    const rate =
      item.interestRate !== null && item.interestRate !== undefined
        ? `${item.interestRate}%`
        : "N/A";

    const tenure =
      item.tenure !== null && item.tenure !== undefined
        ? `${item.tenure}mo`
        : "N/A";

    return `${rate} • ${tenure}`;
  }

  return (
    <main className="cp-dashboard-page">
      <section className="cp-dashboard-shell">
        <div className="cp-dashboard-header">
          <div>
            <h1 className="cp-dashboard-title">Loan Applications</h1>
            <p className="cp-dashboard-subtitle">
              Manage and track loan applications
            </p>
          </div>

          <button type="button" className="cp-dashboard-primary-button">
            New Application
          </button>
        </div>

        {authMissing && (
          <div className="cp-dashboard-alert" role="alert">
            Sign in token is not available yet. The dashboard UI is ready, but
            real data will load only after the login flow stores the access
            token.
          </div>
        )}

        {!authMissing && errorMsg && (
          <div className="cp-dashboard-alert" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="cp-dashboard-summary-grid">
          <article className="cp-dashboard-summary-card">
            <p className="cp-dashboard-summary-label">All Applications</p>
            <h2 className="cp-dashboard-summary-value">{summary.all}</h2>
          </article>

          <article className="cp-dashboard-summary-card cp-dashboard-summary-card--info">
            <p className="cp-dashboard-summary-label">Under Review</p>
            <h2 className="cp-dashboard-summary-value">{summary.underReview}</h2>
          </article>

          <article className="cp-dashboard-summary-card cp-dashboard-summary-card--success">
            <p className="cp-dashboard-summary-label">Approved</p>
            <h2 className="cp-dashboard-summary-value">{summary.approved}</h2>
          </article>

          <article className="cp-dashboard-summary-card cp-dashboard-summary-card--accent">
            <p className="cp-dashboard-summary-label">Disbursed</p>
            <h2 className="cp-dashboard-summary-value">{summary.disbursed}</h2>
          </article>

          <article className="cp-dashboard-summary-card cp-dashboard-summary-card--muted">
            <p className="cp-dashboard-summary-label">Closed</p>
            <h2 className="cp-dashboard-summary-value">{summary.closed}</h2>
          </article>
        </div>

        <div className="cp-dashboard-filter-bar">
          <input
            type="text"
            className="cp-dashboard-field"
            placeholder="Search by application number, customer, type..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            disabled={authMissing}
          />

          <select
            className="cp-dashboard-field cp-dashboard-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            disabled={authMissing}
          >
            <option value="all">All Status</option>
            <option value="under review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="disbursed">Disbursed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <section className="cp-dashboard-table-card">
          <h2 className="cp-dashboard-section-title">Application List</h2>

          <div className="cp-dashboard-table-wrap">
            <table className="cp-dashboard-table">
              <thead>
                <tr>
                  <th>Application No</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Balance</th>
                  <th>Next Payment</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="cp-dashboard-empty-state">
                        Loading applications...
                      </div>
                    </td>
                  </tr>
                ) : authMissing ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="cp-dashboard-empty-state">
                        Dashboard data will appear here after the access token is
                        available.
                      </div>
                    </td>
                  </tr>
                ) : filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="cp-dashboard-empty-state">
                        No applications found for the current search or filter.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredApplications.map((item) => (
                    <tr key={item.applicationId}>
                      <td>
                        <div className="cp-dashboard-primary-text">
                          {item.applicationNumber || "N/A"}
                        </div>
                      </td>

                      <td>
                        <div className="cp-dashboard-primary-text">
                          {item.customerName || "N/A"}
                        </div>
                      </td>

                      <td>
                        <span className="cp-dashboard-type-pill">
                          {item.type || "N/A"}
                        </span>
                      </td>

                      <td>
                        <div className="cp-dashboard-primary-text">
                          {formatCurrency(item.principalAmount)}
                        </div>
                        <div className="cp-dashboard-secondary-text">
                          {getAmountMeta(item)}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`cp-dashboard-status-pill cp-dashboard-status-pill--${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status || "N/A"}
                        </span>
                      </td>

                      <td>
                        <div className="cp-dashboard-primary-text">
                          {formatCurrency(item.balance)}
                        </div>
                      </td>

                      <td>
                        <div className="cp-dashboard-primary-text">
                          {formatCurrency(item.nextPayment)}
                        </div>
                        <div className="cp-dashboard-secondary-text">
                          {formatDate(item.nextPaymentDate)}
                        </div>
                      </td>

                      <td>
                        <div className="cp-dashboard-secondary-text">
                          {formatDate(item.applicationCreationDate)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}