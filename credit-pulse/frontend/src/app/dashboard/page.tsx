"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./dashboard-tabs.module.css";

import { useAuth } from "../../context/AuthContext";

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

type PullApplication = DashboardApplication & {
  assignedTo: string | null;
};

type UserRoleResponse = {
  data?: {
    userId?: string;
    firstName?: string;
    lastName?: string;
    teamId?: string | null;
    roleCode?: string;
  };
};

type DashboardTab = "applications" | "pull";

export default function DashboardPage() {
  const router = useRouter();
  const { token, isAdmin, isLoading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<DashboardTab>("applications");
  const [applications, setApplications] = useState<DashboardApplication[]>([]);
  const [pullApplications, setPullApplications] = useState<PullApplication[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isPullLoading, setIsPullLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [pullErrorMsg, setPullErrorMsg] = useState("");
  const [applicationPage, setApplicationPage] = useState(1);
  const [pullPage, setPullPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [currentRoleCode, setCurrentRoleCode] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [assigningApplicationNumber, setAssigningApplicationNumber] = useState<
    string | null
  >(null);

  const itemsPerPage = 3;

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.push("/signin");
      return;
    }

    if (isAdmin) {
      router.replace("/admin");
      return;
    }

    async function loadDashboardData() {
      try {
        setIsLoading(true);
        setIsPullLoading(true);
        setErrorMsg("");
        setPullErrorMsg("");

        const authHeaders = {
          Authorization: `Bearer ${token}`,
        };

        const [applicationsResponse, roleResponse] = await Promise.all([
          axios.get("/api/dashboard/applications", {
            headers: authHeaders,
          }),
          axios.get<UserRoleResponse>("/api/auth/fetch-user-role", {
            headers: authHeaders,
          }),
        ]);

        setApplications(
          Array.isArray(applicationsResponse.data)
            ? applicationsResponse.data
            : [],
        );

        const userData = roleResponse.data?.data;

        setCurrentUserId(userData?.userId ?? null);
        setCurrentRoleCode(userData?.roleCode ?? null);
        setCurrentUserName(
          `${userData?.firstName ?? ""} ${userData?.lastName ?? ""}`.trim(),
        );

        const teamId = userData?.teamId;
        setCurrentTeamId(teamId ?? null);

        if (!teamId) {
          setPullApplications([]);
          setPullErrorMsg(
            "No active team assignment found for pool applications.",
          );
          return;
        }

        const pullResponse = await axios.post(
          "/api/applications/fetch-by-team",
          { teamId },
          {
            headers: authHeaders,
          },
        );

        setPullApplications(
          Array.isArray(pullResponse.data) ? pullResponse.data : [],
        );
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const backendMessage = error.response?.data?.message;
          const statusCode = error.response?.status;

          if (
            statusCode === 401 ||
            backendMessage === "No token provided" ||
            backendMessage === "Invalid token" ||
            backendMessage === "User not authenticated"
          ) {
            logout();
            router.push("/signin");
            return;
          }

          const message =
            typeof backendMessage === "string"
              ? backendMessage
              : "Unable to load dashboard applications.";

          setErrorMsg(message);
          setPullErrorMsg(message);
        } else {
          setErrorMsg("Unable to load dashboard applications.");
          setPullErrorMsg("Unable to load pool applications.");
        }
      } finally {
        setIsLoading(false);
        setIsPullLoading(false);
      }
    }

    loadDashboardData();
  }, [token, isAdmin, authLoading, logout, router]);

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

  const filteredPullApplications = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedStatus = statusFilter.trim().toLowerCase();

    return pullApplications.filter((item) => {
      const applicationNumber = (item.applicationNumber || "").toLowerCase();
      const customerName = (item.customerName || "").toLowerCase();
      const type = (item.type || "").toLowerCase();
      const status = (item.status || "").toLowerCase();
      const assignedTo = (item.assignedTo || "").toLowerCase();

      const matchesSearch =
        normalizedSearch === "" ||
        applicationNumber.includes(normalizedSearch) ||
        customerName.includes(normalizedSearch) ||
        type.includes(normalizedSearch) ||
        status.includes(normalizedSearch) ||
        assignedTo.includes(normalizedSearch);

      const matchesStatus =
        normalizedStatus === "all" || status === normalizedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [pullApplications, searchTerm, statusFilter]);

  const applicationTotalPages = Math.max(
    1,
    Math.ceil(filteredApplications.length / itemsPerPage),
  );

  const pullTotalPages = Math.max(
    1,
    Math.ceil(filteredPullApplications.length / itemsPerPage),
  );

  const paginatedApplications = useMemo(() => {
    const startIndex = (applicationPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  }, [filteredApplications, applicationPage]);

  const paginatedPullApplications = useMemo(() => {
    const startIndex = (pullPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPullApplications.slice(startIndex, endIndex);
  }, [filteredPullApplications, pullPage]);

  const activeRecords =
    activeTab === "applications"
      ? filteredApplications
      : filteredPullApplications;
  const currentPage = activeTab === "applications" ? applicationPage : pullPage;
  const totalPages =
    activeTab === "applications" ? applicationTotalPages : pullTotalPages;

  const startItem =
    activeRecords.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, activeRecords.length);

  useEffect(() => {
    setApplicationPage(1);
    setPullPage(1);
  }, [searchTerm, statusFilter, applications, pullApplications]);

  const summary = useMemo(() => {
    const normalizeStatus = (value: string | null) =>
      (value || "").trim().toLowerCase();

    return {
      all: applications.length,
      underReview: applications.filter(
        (item) => normalizeStatus(item.status) === "under review",
      ).length,
      approved: applications.filter(
        (item) => normalizeStatus(item.status) === "approved",
      ).length,
      disbursed: applications.filter(
        (item) => normalizeStatus(item.status) === "disbursed",
      ).length,
      closed: applications.filter(
        (item) => normalizeStatus(item.status) === "closed",
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

    return `${rate} | ${tenure}`;
  }

  function handleViewApplication(item: DashboardApplication) {
    router.push(
      `/application-detail?applicationNumber=${item.applicationNumber}`,
    );
  }

  async function reloadApplications(authToken: string) {
    const response = await axios.get("/api/dashboard/applications", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    setApplications(Array.isArray(response.data) ? response.data : []);
  }

  async function reloadPullApplications(teamId: string, authToken: string) {
    const pullResponse = await axios.post(
      "/api/applications/fetch-by-team",
      { teamId },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    setPullApplications(
      Array.isArray(pullResponse.data) ? pullResponse.data : [],
    );
  }

  function formatRoleLabel(roleCode: string | null) {
    if (!roleCode) return "Team Member";

    return roleCode
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function canCreateApplication(roleCode: string | null) {
    return roleCode === "CUSTOMER" || roleCode === "SOURCING_OFFICER";
  }

  function isAssignedToCurrentUser(item: PullApplication) {
    if (!currentUserName) {
      return false;
    }

    return (
      (item.assignedTo || "").trim().toLowerCase() ===
      currentUserName.trim().toLowerCase()
    );
  }

  async function handleAssignToMe(item: PullApplication) {
    if (!token || !currentUserId) {
      setPullErrorMsg("Unable to assign the application to you right now.");
      return;
    }

    try {
      setAssigningApplicationNumber(item.applicationNumber);
      setPullErrorMsg("");

      await axios.post(
        "/api/application/assign",
        {
          applicationNumber: item.applicationNumber,
          assignedUserId: currentUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await reloadApplications(token);

      if (currentTeamId) {
        await reloadPullApplications(currentTeamId, token);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        setPullErrorMsg(
          typeof backendMessage === "string"
            ? backendMessage
            : "Unable to assign the application to you.",
        );
      } else {
        setPullErrorMsg("Unable to assign the application to you.");
      }
    } finally {
      setAssigningApplicationNumber(null);
    }
  }

  async function handleUnassignMe(item: PullApplication) {
    if (!token || !currentTeamId) {
      setPullErrorMsg("Unable to unassign the application right now.");
      return;
    }

    try {
      setAssigningApplicationNumber(item.applicationNumber);
      setPullErrorMsg("");

      await axios.post(
        "/api/application/assign",
        {
          applicationNumber: item.applicationNumber,
          assignedTeamId: currentTeamId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await reloadApplications(token);
      await reloadPullApplications(currentTeamId, token);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage = error.response?.data?.message;
        setPullErrorMsg(
          typeof backendMessage === "string"
            ? backendMessage
            : "Unable to unassign the application from you.",
        );
      } else {
        setPullErrorMsg("Unable to unassign the application from you.");
      }
    } finally {
      setAssigningApplicationNumber(null);
    }
  }

  if (authLoading) {
    return (
      <main className="cp-dashboard-page">
        <section className="cp-dashboard-shell">
          <div className="cp-dashboard-empty-state">Checking session...</div>
        </section>
      </main>
    );
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
            <p className={styles.welcomeText}>
              Welcome {currentUserName || "there"} (
              {formatRoleLabel(currentRoleCode)})
            </p>
          </div>

          {canCreateApplication(currentRoleCode) && (
            <button
              type="button"
              className="cp-dashboard-primary-button"
              onClick={() => router.push("/loan-application")}
              disabled={authLoading}
            >
              New Application
            </button>
          )}
        </div>

        {errorMsg && activeTab === "applications" && (
          <div className="cp-dashboard-alert" role="alert">
            {errorMsg}
          </div>
        )}

        {pullErrorMsg && activeTab === "pull" && (
          <div className="cp-dashboard-alert" role="alert">
            {pullErrorMsg}
          </div>
        )}

        <div className="cp-dashboard-summary-grid">
          <article className="cp-dashboard-summary-card">
            <p className="cp-dashboard-summary-label">All Applications</p>
            <h2 className="cp-dashboard-summary-value">{summary.all}</h2>
          </article>

          <article className="cp-dashboard-summary-card cp-dashboard-summary-card--info">
            <p className="cp-dashboard-summary-label">Under Review</p>
            <h2 className="cp-dashboard-summary-value">
              {summary.underReview}
            </h2>
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
          />

          <select
            className="cp-dashboard-field cp-dashboard-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Status</option>
            <option value="under review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="disbursed">Disbursed</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <section className="cp-dashboard-table-card">
          <div className={styles.tabHeader}>
            <div>
              <h2 className="cp-dashboard-section-title">
                {activeTab === "applications"
                  ? "Assigned Applications"
                  : "Applications in Team Pool"}
              </h2>
              <p className={styles.tabSubtitle}>
                {activeTab === "applications"
                  ? "Review the applications directly assigned to your dashboard."
                  : "View team pool records fetched from the team applications API."}
              </p>
            </div>

            <div
              className={styles.tabSwitch}
              role="tablist"
              aria-label="Dashboard sections"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "applications"}
                className={`${styles.tabButton} ${
                  activeTab === "applications" ? styles.tabButtonActive : ""
                }`}
                onClick={() => setActiveTab("applications")}
              >
                Assigned
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "pull"}
                className={`${styles.tabButton} ${
                  activeTab === "pull" ? styles.tabButtonActive : ""
                }`}
                onClick={() => setActiveTab("pull")}
              >
                Pool
              </button>
            </div>
          </div>

          {activeTab === "applications" ? (
            <>
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
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="cp-dashboard-empty-state">
                            Loading applications...
                          </div>
                        </td>
                      </tr>
                    ) : filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="cp-dashboard-empty-state">
                            No applications found for the current search or
                            filter.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedApplications.map((item) => (
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
                                item.status,
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

                          <td>
                            <button
                              type="button"
                              className="cp-dashboard-view-btn"
                              onClick={() => handleViewApplication(item)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className={styles.pullPanel}>
              <div
                className={`${styles.pullTableWrap} cp-dashboard-table-wrap`}
              >
                <table className="cp-dashboard-table">
                  <thead>
                    <tr>
                      <th>Application No</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isPullLoading ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="cp-dashboard-empty-state">
                            Loading pool applications...
                          </div>
                        </td>
                      </tr>
                    ) : filteredPullApplications.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="cp-dashboard-empty-state">
                            No pool applications found for the current search or
                            filter.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedPullApplications.map((item) => (
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
                            <div className={styles.assignedToValue}>
                              {item.assignedTo || "Unassigned"}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`cp-dashboard-status-pill cp-dashboard-status-pill--${getStatusClass(
                                item.status,
                              )}`}
                            >
                              {item.status || "N/A"}
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
                            <div className="cp-dashboard-secondary-text">
                              {formatDate(item.applicationCreationDate)}
                            </div>
                          </td>
                          <td>
                            {isAssignedToCurrentUser(item) ? (
                              <button
                                type="button"
                                className={`cp-dashboard-view-btn ${styles.unassignButton}`}
                                onClick={() => handleUnassignMe(item)}
                                disabled={
                                  assigningApplicationNumber ===
                                  item.applicationNumber
                                }
                              >
                                {assigningApplicationNumber ===
                                item.applicationNumber
                                  ? "Deallocating..."
                                  : "De-Allocate"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="cp-dashboard-view-btn"
                                onClick={() => handleAssignToMe(item)}
                                disabled={
                                  assigningApplicationNumber ===
                                  item.applicationNumber
                                }
                              >
                                {assigningApplicationNumber ===
                                item.applicationNumber
                                  ? "Allocating..."
                                  : "Allocate"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {((activeTab === "applications" &&
            !isLoading &&
            filteredApplications.length > 0) ||
            (activeTab === "pull" &&
              !isPullLoading &&
              filteredPullApplications.length > 0)) && (
            <div className="cp-dashboard-pagination">
              <div className="cp-dashboard-pagination-info">
                Showing {startItem} to {endItem} of {activeRecords.length}{" "}
                records
              </div>

              <div className="cp-dashboard-pagination-actions">
                <button
                  type="button"
                  className="cp-dashboard-page-btn"
                  onClick={() =>
                    activeTab === "applications"
                      ? setApplicationPage((prev) => Math.max(prev - 1, 1))
                      : setPullPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`cp-dashboard-page-btn ${
                      currentPage === page
                        ? "cp-dashboard-page-btn--active"
                        : ""
                    }`}
                    onClick={() =>
                      activeTab === "applications"
                        ? setApplicationPage(page)
                        : setPullPage(page)
                    }
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="cp-dashboard-page-btn"
                  onClick={() =>
                    activeTab === "applications"
                      ? setApplicationPage((prev) =>
                          Math.min(prev + 1, applicationTotalPages),
                        )
                      : setPullPage((prev) =>
                          Math.min(prev + 1, pullTotalPages),
                        )
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
