"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

type AdminSection = "users" | "teams" | "products";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Loan Officer" | "Auditor";
  status: "Active" | "Inactive";
  isLoggedIn: boolean;
  totalLogins: number;
  lastLogin: string;
};

type ActivityItem = {
  id: number;
  actor: string;
  action: string;
  time: string;
  ipAddress: string;
};

export default function AdminPage() {
  const router = useRouter();
  const { token, user, isAdmin, isLoading } = useAuth();

  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number>(1);

  // Stores demo users for user management
  const [users] = useState<AdminUser[]>([
    {
      id: 1,
      name: "Admin User",
      email: "admin@creditpulse.com",
      role: "Admin",
      status: "Active",
      isLoggedIn: true,
      totalLogins: 245,
      lastLogin: "10/10/2024, 9:35 AM",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@creditpulse.com",
      role: "Loan Officer",
      status: "Active",
      isLoggedIn: true,
      totalLogins: 189,
      lastLogin: "10/10/2024, 8:15 AM",
    },
    {
      id: 3,
      name: "Michael Chen",
      email: "michael.c@creditpulse.com",
      role: "Manager",
      status: "Active",
      isLoggedIn: false,
      totalLogins: 156,
      lastLogin: "10/10/2024, 7:45 AM",
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.d@creditpulse.com",
      role: "Auditor",
      status: "Active",
      isLoggedIn: true,
      totalLogins: 98,
      lastLogin: "10/9/2024, 4:35 PM",
    },
    {
      id: 5,
      name: "James Wilson",
      email: "james.w@creditpulse.com",
      role: "Loan Officer",
      status: "Inactive",
      isLoggedIn: false,
      totalLogins: 67,
      lastLogin: "10/8/2024, 10:20 PM",
    },
  ]);

  // Stores demo activity records
  const [recentActivities] = useState<ActivityItem[]>([
    {
      id: 1,
      actor: "Admin User",
      action: "Approved loan LN004",
      time: "10/10/2024, 9:35:00 AM",
      ipAddress: "192.168.1.100",
    },
    {
      id: 2,
      actor: "Sarah Johnson",
      action: "Created customer CUS005",
      time: "10/10/2024, 8:20:00 AM",
      ipAddress: "192.168.1.102",
    },
    {
      id: 3,
      actor: "Michael Chen",
      action: "Updated loan LN002",
      time: "10/10/2024, 7:50:00 AM",
      ipAddress: "192.168.1.105",
    },
    {
      id: 4,
      actor: "Emily Davis",
      action: "Exported financial report",
      time: "10/9/2024, 4:35:00 PM",
      ipAddress: "192.168.1.108",
    },
    {
      id: 5,
      actor: "Sarah Johnson",
      action: "Recorded repayment REP005",
      time: "10/9/2024, 3:15:00 PM",
      ipAddress: "192.168.1.102",
    },
  ]);

  useEffect(() => {
    // Waits for auth state to load
    if (isLoading) return;

    // Redirects logged out user
    if (!token) {
      router.replace("/signin");
      return;
    }

    // Redirects non-admin user
    if (!isAdmin) {
      router.replace("/dashboard");
    }
  }, [token, isAdmin, isLoading, router]);

  // Filters user list by search and status
  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();

      result = result.filter((item) => {
        return (
          item.name.toLowerCase().includes(keyword) ||
          item.email.toLowerCase().includes(keyword) ||
          item.role.toLowerCase().includes(keyword)
        );
      });
    }

    if (statusFilter !== "All") {
      result = result.filter((item) => item.status === statusFilter);
    }

    return result;
  }, [users, searchText, statusFilter]);

  // Finds selected user for view action
  const selectedUser =
    users.find((item) => item.id === selectedUserId) ?? users[0] ?? null;

  // Counts summary values
  const totalUsers = users.length;
  const totalLoggedInUsers = users.filter((item) => item.isLoggedIn).length;
  const totalActiveUsers = users.filter((item) => item.status === "Active").length;
  const totalInactiveUsers = users.filter((item) => item.status === "Inactive").length;

  // Counts users by role
  const roleSummary = useMemo(() => {
    return [
      {
        role: "Admin",
        count: users.filter((item) => item.role === "Admin").length,
      },
      {
        role: "Manager",
        count: users.filter((item) => item.role === "Manager").length,
      },
      {
        role: "Loan Officer",
        count: users.filter((item) => item.role === "Loan Officer").length,
      },
      {
        role: "Auditor",
        count: users.filter((item) => item.role === "Auditor").length,
      },
    ];
  }, [users]);

  // Builds admin name for heading
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Admin User";

  const handleExcelUpload = (event: ChangeEvent<HTMLInputElement>) => {
    // Reads selected excel file
    const selectedFile = event.target.files?.[0];

    // Saves selected file name
    if (selectedFile) {
      setSelectedFileName(selectedFile.name);
      return;
    }

    setSelectedFileName("");
  };

  const renderUserManagementContent = () => {
    return (
      <>
        <section className="cp-admin-content-header">
          <div>
            <p className="cp-admin-eyebrow">Admin Panel</p>
            <h1 className="cp-admin-title">User Management</h1>
            <p className="cp-admin-subtitle">
              Manage users, search records, upload Excel files, monitor logins,
              and review recent user activity.
            </p>
          </div>
        </section>

        <section className="cp-admin-summary-grid">
          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Total Users</p>
            <h2 className="cp-admin-summary-value">{totalUsers}</h2>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Logged-In Users</p>
            <h2 className="cp-admin-summary-value">{totalLoggedInUsers}</h2>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Active Users</p>
            <h2 className="cp-admin-summary-value">{totalActiveUsers}</h2>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Inactive Users</p>
            <h2 className="cp-admin-summary-value">{totalInactiveUsers}</h2>
          </div>
        </section>

        <section className="cp-admin-panel">
          <div className="cp-admin-panel-head">
            <div>
              <h2 className="cp-admin-panel-title">Create Users by Excel Upload</h2>
              <p className="cp-admin-panel-text">
                Upload an Excel file to create multiple users at one time.
              </p>
            </div>
          </div>

          <div className="cp-admin-upload-box">
            <label htmlFor="userExcelFile" className="cp-admin-upload-label">
              Select Excel File
            </label>

            <input
              id="userExcelFile"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelUpload}
              className="cp-admin-upload-input"
            />

            <p className="cp-admin-upload-note">
              Accepted file types: .xlsx, .xls, .csv
            </p>

            {selectedFileName && (
              <p className="cp-admin-upload-file">
                Selected File: {selectedFileName}
              </p>
            )}
          </div>
        </section>

        <section className="cp-admin-panel">
          <div className="cp-admin-panel-head">
            <div>
              <h2 className="cp-admin-panel-title">User List</h2>
              <p className="cp-admin-panel-text">
                Search users, filter by status, and review login details.
              </p>
            </div>
          </div>

          <div className="cp-admin-toolbar">
            <input
              type="text"
              className="cp-admin-field"
              placeholder="Search by name, email, or role"
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
            </select>
          </div>

          <div className="cp-admin-table-wrap">
            <table className="cp-admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Total Logins</th>
                  <th>Last Login</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.role}</td>
                      <td>
                        <span
                          className={
                            item.status === "Active"
                              ? "cp-admin-status-pill cp-admin-status-pill--active"
                              : "cp-admin-status-pill cp-admin-status-pill--inactive"
                          }
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>{item.totalLogins}</td>
                      <td>{item.lastLogin}</td>
                      <td>
                        <button
                          type="button"
                          className="cp-admin-view-btn"
                          onClick={() => setSelectedUserId(item.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7}>
                      <div className="cp-admin-empty-state">
                        No users found for the selected filters.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedUser && (
            <div className="cp-admin-user-preview">
              <h3 className="cp-admin-user-preview-title">Selected User Details</h3>

              <div className="cp-admin-user-preview-grid">
                <div className="cp-admin-user-preview-item">
                  <span className="cp-admin-user-preview-label">Name</span>
                  <span className="cp-admin-user-preview-value">
                    {selectedUser.name}
                  </span>
                </div>

                <div className="cp-admin-user-preview-item">
                  <span className="cp-admin-user-preview-label">Email</span>
                  <span className="cp-admin-user-preview-value">
                    {selectedUser.email}
                  </span>
                </div>

                <div className="cp-admin-user-preview-item">
                  <span className="cp-admin-user-preview-label">Role</span>
                  <span className="cp-admin-user-preview-value">
                    {selectedUser.role}
                  </span>
                </div>

                <div className="cp-admin-user-preview-item">
                  <span className="cp-admin-user-preview-label">Status</span>
                  <span className="cp-admin-user-preview-value">
                    {selectedUser.status}
                  </span>
                </div>

                <div className="cp-admin-user-preview-item">
                  <span className="cp-admin-user-preview-label">Total Logins</span>
                  <span className="cp-admin-user-preview-value">
                    {selectedUser.totalLogins}
                  </span>
                </div>

                <div className="cp-admin-user-preview-item">
                  <span className="cp-admin-user-preview-label">Last Login</span>
                  <span className="cp-admin-user-preview-value">
                    {selectedUser.lastLogin}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="cp-admin-panel">
          <div className="cp-admin-panel-head">
            <div>
              <h2 className="cp-admin-panel-title">Role Management</h2>
              <p className="cp-admin-panel-text">
                View user count by role in the system.
              </p>
            </div>
          </div>

          <div className="cp-admin-role-grid">
            {roleSummary.map((item) => (
              <div key={item.role} className="cp-admin-role-card">
                <h3 className="cp-admin-role-name">{item.role}</h3>
                <p className="cp-admin-role-count">{item.count} users</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cp-admin-panel">
          <div className="cp-admin-panel-head cp-admin-panel-head--space">
            <div>
              <h2 className="cp-admin-panel-title">Recent Activity Log</h2>
              <p className="cp-admin-panel-text">
                Review the latest admin and user actions performed in the system.
              </p>
            </div>

            <button type="button" className="cp-admin-view-btn">
              View All
            </button>
          </div>

          <div className="cp-admin-activity-list">
            {recentActivities.map((item) => (
              <div key={item.id} className="cp-admin-activity-item">
                <p className="cp-admin-activity-title">
                  <strong>{item.actor}</strong>
                  <span className="cp-admin-activity-dot">•</span>
                  <span>{item.action}</span>
                </p>

                <p className="cp-admin-activity-meta">
                  {item.time}
                  <span className="cp-admin-activity-dot">•</span>
                  IP: {item.ipAddress}
                </p>
              </div>
            ))}
          </div>
        </section>
      </>
    );
  };

  const renderTeamManagementContent = () => {
    return (
      <>
        <section className="cp-admin-content-header">
          <div>
            <p className="cp-admin-eyebrow">Admin Panel</p>
            <h1 className="cp-admin-title">Team Management</h1>
            <p className="cp-admin-subtitle">
              Team management content will be added in the next step.
            </p>
          </div>
        </section>

        <section className="cp-admin-panel">
          <h2 className="cp-admin-panel-title">Team Management Content</h2>
          <p className="cp-admin-panel-text">
            This area is ready for team list, team roles, team assignments, and
            team actions.
          </p>
        </section>
      </>
    );
  };

  const renderProductManagementContent = () => {
    return (
      <>
        <section className="cp-admin-content-header">
          <div>
            <p className="cp-admin-eyebrow">Admin Panel</p>
            <h1 className="cp-admin-title">Product Management</h1>
            <p className="cp-admin-subtitle">
              Product management content will be added in the next step.
            </p>
          </div>
        </section>

        <section className="cp-admin-panel">
          <h2 className="cp-admin-panel-title">Product Management Content</h2>
          <p className="cp-admin-panel-text">
            This area is ready for product list, product status, categories, and
            product actions.
          </p>
        </section>
      </>
    );
  };

  const renderActiveSection = () => {
    if (activeSection === "users") {
      return renderUserManagementContent();
    }

    if (activeSection === "teams") {
      return renderTeamManagementContent();
    }

    return renderProductManagementContent();
  };

  if (isLoading) {
    return (
      <main className="cp-admin-page">
        <div className="container">
          <div className="cp-card cp-admin-empty-state">
            Checking admin access...
          </div>
        </div>
      </main>
    );
  }

  if (!token || !isAdmin) {
    return (
      <main className="cp-admin-page">
        <div className="container">
          <div className="cp-card cp-admin-empty-state">Redirecting...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="cp-admin-page">
      <div className="cp-admin-layout">
        <aside className="cp-admin-sidebar">
          <div className="cp-admin-sidebar-brand">
            <div className="cp-admin-sidebar-logo">C</div>
            <div>
              <h2 className="cp-admin-sidebar-title">CreditPulse</h2>
              <p className="cp-admin-sidebar-text">Admin Workspace</p>
            </div>
          </div>

          <div className="cp-admin-sidebar-user">
            <p className="cp-admin-sidebar-user-name">{displayName}</p>
            <p className="cp-admin-sidebar-user-role">Administrator</p>
          </div>

          <nav className="cp-admin-sidebar-nav">
            <button
              type="button"
              className={`cp-admin-sidebar-link ${
                activeSection === "users" ? "cp-admin-sidebar-link--active" : ""
              }`}
              onClick={() => setActiveSection("users")}
            >
              User Management
            </button>

            <button
              type="button"
              className={`cp-admin-sidebar-link ${
                activeSection === "teams" ? "cp-admin-sidebar-link--active" : ""
              }`}
              onClick={() => setActiveSection("teams")}
            >
              Team Management
            </button>

            <button
              type="button"
              className={`cp-admin-sidebar-link ${
                activeSection === "products" ? "cp-admin-sidebar-link--active" : ""
              }`}
              onClick={() => setActiveSection("products")}
            >
              Product Management
            </button>
          </nav>
        </aside>

        <section className="cp-admin-main">{renderActiveSection()}</section>
      </div>
    </main>
  );
}