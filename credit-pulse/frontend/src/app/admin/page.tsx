"use client";

import axios from "axios";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

type AdminSection = "users" | "teams" | "products";

type AdminUser = {
  userId: string;
  roleType: string;
  name: string;
  userEmail: string;
  phone: string | null;
  isLoggedIn: boolean;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
};

type UploadUsersResponse = {
  message: string;
  totalRows: number;
  successCount: number;
  failureCount: number;
  successes: Array<{
    rowNumber: number;
    email: string;
    userId: string;
  }>;
  failures: Array<{
    rowNumber: number;
    email?: string;
    errors: string[];
  }>;
};

export default function AdminPage() {
  const router = useRouter();
  const { token, user, isAdmin, isLoading } = useAuth();

  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadUsersResponse | null>(
    null
  );

  useEffect(() => {
    // Waits until login state is fully ready
    if (isLoading) return;

    // Sends logged out users to sign in page
    if (!token) {
      router.replace("/signin");
      return;
    }

    // Sends non-admin users away from admin page
    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [token, isAdmin, isLoading, router]);

  const fetchAllUsers = useCallback(async () => {
    // Loads all users from backend for the user management tab
    try {
      setIsUsersLoading(true);
      setUsersError("");
      setActionMessage("");

      const response = await axios.get("/api/users/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response.data;

      const usersList = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.data)
        ? responseData.data
        : [];

      setUsers(usersList);
    } catch (error) {
      // Shows backend or fallback error message
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;

        setUsersError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to load users from backend."
        );
      } else {
        setUsersError("Unable to load users from backend.");
      }
    } finally {
      setIsUsersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Loads users only when the user management tab is open
    if (!token || !isAdmin || activeSection !== "users") return;

    fetchAllUsers();
  }, [token, isAdmin, activeSection, fetchAllUsers]);

  const handleStatusUpdate = async (
    userId: string,
    status: "active" | "inactive" | "block" | "unblock"
  ) => {
    // Updates active, inactive, block, or unblock state
    try {
      setActionError("");
      setActionMessage("");

      const response = await axios.patch(
        "/api/user/update-status",
        {
          userId,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = response.data;
      const message =
        responseData?.message || "User status updated successfully.";

      setActionMessage(message);

      // Reloads user list after update
      await fetchAllUsers();
    } catch (error) {
      // Shows backend or fallback error message
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;

        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to update user status."
        );
      } else {
        setActionError("Unable to update user status.");
      }
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    // Stores the selected Excel file before upload
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setUploadResult(null);
    setActionError("");
    setActionMessage("");
  };

  const handleExcelUpload = async () => {
    // Stops upload when no file is selected
    if (!selectedFile) {
      setActionError("Please select an Excel file first.");
      return;
    }

    // Uploads the selected Excel file to backend
    try {
      setIsUploading(true);
      setActionError("");
      setActionMessage("");
      setUploadResult(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await axios.post("/api/users/upload-excel", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response.data as UploadUsersResponse;

      setUploadResult(responseData);
      setActionMessage(responseData?.message || "Users uploaded successfully.");

      // Reloads user list after successful upload
      await fetchAllUsers();
    } catch (error) {
      // Shows backend or fallback error message
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;

        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to upload Excel file."
        );
      } else {
        setActionError("Unable to upload Excel file.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    // Applies search and filter values on the loaded user list
    let result = [...users];

    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();

      result = result.filter((item) => {
        return (
          item.name.toLowerCase().includes(keyword) ||
          item.userEmail.toLowerCase().includes(keyword) ||
          item.roleType.toLowerCase().includes(keyword) ||
          (item.phone || "").toLowerCase().includes(keyword)
        );
      });
    }

    if (statusFilter === "Active") {
      result = result.filter((item) => item.isActive);
    }

    if (statusFilter === "Inactive") {
      result = result.filter((item) => !item.isActive);
    }

    if (statusFilter === "Blocked") {
      result = result.filter((item) => item.isBlocked);
    }

    if (statusFilter === "Logged In") {
      result = result.filter((item) => item.isLoggedIn);
    }

    return result;
  }, [users, searchText, statusFilter]);

  // Builds summary values from the real backend data
  const totalUsers = users.length;
  const totalLoggedInUsers = users.filter((item) => item.isLoggedIn).length;
  const totalActiveUsers = users.filter((item) => item.isActive).length;
  const totalBlockedUsers = users.filter((item) => item.isBlocked).length;

  // Creates a clean welcome name for the admin header
  const displayName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Admin User";

  const formatDate = (value: string) => {
    // Converts backend date into readable local date and time
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  const renderUserManagementContent = () => {
    // Shows the fully connected user management tab
    return (
      <div className="cp-admin-panel">
        <div className="cp-admin-panel-header">
          <div>
            <p className="cp-admin-eyebrow">Admin Panel</p>
            <h1 className="cp-admin-title">User Management</h1>
            <p className="cp-admin-subtitle">
              Manage users, update account state, and upload multiple users
              through Excel from one place.
            </p>
          </div>
        </div>

        {(actionMessage || actionError || usersError) && (
          <div
            className={`cp-admin-alert ${
              actionError || usersError
                ? "cp-admin-alert-error"
                : "cp-admin-alert-success"
            }`}
          >
            {actionError || usersError || actionMessage}
          </div>
        )}

        <div className="cp-admin-summary-grid">
          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Total Users</p>
            <h3 className="cp-admin-summary-value">{totalUsers}</h3>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Logged-In Users</p>
            <h3 className="cp-admin-summary-value">{totalLoggedInUsers}</h3>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Active Users</p>
            <h3 className="cp-admin-summary-value">{totalActiveUsers}</h3>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Blocked Users</p>
            <h3 className="cp-admin-summary-value">{totalBlockedUsers}</h3>
          </div>
        </div>

        <div className="cp-admin-upload-row">
          <div className="cp-admin-upload-card">
            <label htmlFor="adminExcelFile" className="cp-admin-upload-label">
              Upload users Excel file
            </label>

            <input
              id="adminExcelFile"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="cp-admin-hidden-file-input"
            />

            <label
              htmlFor="adminExcelFile"
              className={`cp-loan-upload-box ${
                actionError && !selectedFile ? "cp-loan-upload-error" : ""
              }`}
            >
              <svg
                className="cp-loan-upload-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M12 16V4m0 0-4 4m4-4 4 4M4 16.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <p className="cp-loan-upload-text">
                {selectedFile
                  ? selectedFile.name
                  : "Click to choose Excel file"}
              </p>

              <p className="cp-loan-upload-helper">
                Supported file types: .xlsx, .xls, .csv
              </p>
            </label>
          </div>

          <div className="cp-admin-upload-action">
            <button
              type="button"
              className="btn btn-primary cp-loan-btn-next"
              onClick={handleExcelUpload}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Excel"}
            </button>
          </div>
        </div>

        {uploadResult && (
          <div className="cp-admin-upload-result">
            <h3 className="cp-admin-section-subtitle">Upload Summary</h3>
            <p className="cp-admin-note">
              Total Rows: {uploadResult.totalRows}
            </p>
            <p className="cp-admin-note">
              Success Count: {uploadResult.successCount}
            </p>
            <p className="cp-admin-note">
              Failure Count: {uploadResult.failureCount}
            </p>

            {uploadResult.failures.length > 0 && (
              <div className="cp-admin-failure-list">
                {uploadResult.failures.map((failure, index) => (
                  <div key={index} className="cp-admin-failure-item">
                    <strong>Row {failure.rowNumber}</strong>
                    {failure.email ? ` - ${failure.email}` : ""}
                    <div>{failure.errors.join(", ")}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="cp-admin-toolbar">
          <input
            type="text"
            className="cp-admin-field"
            placeholder="Search by name, email, role, or phone"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <select
            className="cp-admin-field cp-admin-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="All">All Users</option>
            <option value="Active">Active Users</option>
            <option value="Inactive">Inactive Users</option>
            <option value="Blocked">Blocked Users</option>
            <option value="Logged In">Logged-In Users</option>
          </select>
        </div>

        <div className="cp-admin-table-wrap">
          <table className="cp-admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Logged In</th>
                <th>Active</th>
                <th>Blocked</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isUsersLoading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="cp-admin-empty-state">Loading users...</div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((item) => (
                  <tr key={item.userId}>
                    <td>{item.name}</td>
                    <td>{item.roleType}</td>
                    <td>{item.userEmail}</td>
                    <td>{item.phone || "-"}</td>
                    <td>
                      <span
                        className={`cp-admin-status-pill ${
                          item.isLoggedIn
                            ? "cp-admin-status-pill-success"
                            : "cp-admin-status-pill-muted"
                        }`}
                      >
                        {item.isLoggedIn ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`cp-admin-status-pill ${
                          item.isActive
                            ? "cp-admin-status-pill-success"
                            : "cp-admin-status-pill-warning"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`cp-admin-status-pill ${
                          item.isBlocked
                            ? "cp-admin-status-pill-danger"
                            : "cp-admin-status-pill-muted"
                        }`}
                      >
                        {item.isBlocked ? "Blocked" : "No"}
                      </span>
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="cp-admin-action-group">
                        <button
                          type="button"
                          className="cp-admin-action-btn"
                          onClick={() =>
                            handleStatusUpdate(
                              item.userId,
                              item.isActive ? "inactive" : "active"
                            )
                          }
                        >
                          {item.isActive ? "Make Inactive" : "Make Active"}
                        </button>

                        <button
                          type="button"
                          className="cp-admin-action-btn cp-admin-action-btn-danger"
                          onClick={() =>
                            handleStatusUpdate(
                              item.userId,
                              item.isBlocked ? "unblock" : "block"
                            )
                          }
                        >
                          {item.isBlocked ? "Unblock" : "Block"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>
                    <div className="cp-admin-empty-state">
                      No users found for the current filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTeamManagementContent = () => {
    // Keeps the team tab ready for later backend integration
    return (
      <div className="cp-admin-panel">
        <div className="cp-admin-panel-header">
          <div>
            <p className="cp-admin-eyebrow">Admin Panel</p>
            <h1 className="cp-admin-title">Team Management</h1>
            <p className="cp-admin-subtitle">
              This section is ready for team APIs when they are available.
            </p>
          </div>
        </div>

        <div className="cp-admin-placeholder-card cp-admin-placeholder-single">
          <h3>Team Management</h3>
          <p>
            Team list, team details, and team actions will be added after the
            matching backend API is shared.
          </p>
        </div>
      </div>
    );
  };

  const renderProductManagementContent = () => {
    // Keeps the product tab ready for later backend integration
    return (
      <div className="cp-admin-panel">
        <div className="cp-admin-panel-header">
          <div>
            <p className="cp-admin-eyebrow">Admin Panel</p>
            <h1 className="cp-admin-title">Product Management</h1>
            <p className="cp-admin-subtitle">
              This section is ready for product APIs when they are available.
            </p>
          </div>
        </div>

        <div className="cp-admin-placeholder-card cp-admin-placeholder-single">
          <h3>Product Management</h3>
          <p>
            Product list, product settings, and product actions will be added
            after the matching backend API is shared.
          </p>
        </div>
      </div>
    );
  };

  const renderSectionContent = () => {
    // Switches the visible content based on the active top tab
    if (activeSection === "users") {
      return renderUserManagementContent();
    }

    if (activeSection === "teams") {
      return renderTeamManagementContent();
    }

    return renderProductManagementContent();
  };

  if (isLoading) {
    // Shows a waiting message while login state is loading
    return (
      <main className="page cp-admin-page">
        <div className="cp-admin-container">
          <div className="panel cp-admin-status-box">
            Checking admin access...
          </div>
        </div>
      </main>
    );
  }

  if (!token || !isAdmin) {
    // Shows a short message while redirecting away
    return (
      <main className="page cp-admin-page">
        <div className="cp-admin-container">
          <div className="panel cp-admin-status-box">Redirecting...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="page cp-admin-page">
      <div className="cp-admin-container">
        <div className="cp-admin-topnav panel">
          <div className="cp-admin-topnav-head">
            <div>
              <p className="cp-admin-eyebrow">Admin Workspace</p>
              <h2 className="cp-admin-topnav-title">Welcome, {displayName}</h2>
            </div>
          </div>

          <div className="cp-admin-tabbar">
            <button
              type="button"
              className={`cp-admin-tab-btn ${
                activeSection === "users" ? "cp-admin-tab-btn-active" : ""
              }`}
              onClick={() => setActiveSection("users")}
            >
              User Management
            </button>

            <button
              type="button"
              className={`cp-admin-tab-btn ${
                activeSection === "teams" ? "cp-admin-tab-btn-active" : ""
              }`}
              onClick={() => setActiveSection("teams")}
            >
              Team Management
            </button>

            <button
              type="button"
              className={`cp-admin-tab-btn ${
                activeSection === "products" ? "cp-admin-tab-btn-active" : ""
              }`}
              onClick={() => setActiveSection("products")}
            >
              Product Management
            </button>
          </div>
        </div>

        <section className="cp-admin-content">{renderSectionContent()}</section>
      </div>
    </main>
  );
}