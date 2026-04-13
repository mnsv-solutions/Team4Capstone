"use client";

// This page must run in the browser because it uses hooks, routing, token decoding,
// confirmation dialogs, file upload handling, and other interactive admin features.
import axios from "axios";
// React hooks used in this page:
// useState -> stores UI/data state
// useEffect -> runs side effects such as redirects and lazy loading
// useMemo -> avoids recalculating filtered/paginated data unnecessarily
// useCallback -> keeps fetch functions stable when passed into effects
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
// Client-side router is used to redirect users who are not allowed to access this page.
import { useRouter } from "next/navigation";
// Auth context gives us the logged-in user, token, and admin access flag.
import { useAuth } from "../../context/AuthContext";
// Global stylesheet for the admin page layout and components.
import "./admin.css";

// Union type for the three top navigation tabs in the admin workspace.
type AdminSection = "users" | "teams" | "products";

// Shape of a user record used in the user management table.
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

// Shape of a team record used in the team management table.
type Team = {
  teamId: string;
  teamCode: string;
  teamName: string;
  description: string | null;
  userCount: number;
  isActive: boolean;
};

// Shape of a user listed inside a selected team.
type TeamUser = {
  userId: string;
  name: string;
  userEmail: string;
  roleType: string;
};

// Shape of a product record used in the product management table.
type Product = {
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

// Expected response when the admin uploads an Excel sheet of users.
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

// Each team code expects a specific user role when assigning members.
const TEAM_ROLE_MAPPING: Record<string, string> = {
  SOURCING_TEAM: "SOURCING_OFFICER",
  UNDERWRITER_TEAM: "UNDERWRITER",
  DISBURSAL_TEAM: "DISBURSAL_OFFICER",
};

export default function AdminPage() {
  // Router helps us redirect unauthorized users away from this protected page.
  const router = useRouter();
  // Auth context is the source of truth for login state and admin permission.
  const { token, user, isAdmin, isLoading } = useAuth();

  // Controls which admin workspace tab is currently visible.
  const [activeSection, setActiveSection] = useState<AdminSection>("users");

  // User management state: loaded records, upload flow, and UI filters.
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadUsersResponse | null>(
    null,
  );
  const [userSearchText, setUserSearchText] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("All");

  // Team management state: teams list, members for the selected team, and add-user modal.
  const [teams, setTeams] = useState<Team[]>([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(false);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isShowingTeamUsers, setIsShowingTeamUsers] = useState(false);
  const [teamSearchText, setTeamSearchText] = useState("");
  const [showTeamUserModal, setShowTeamUserModal] = useState(false);
  const [selectedTeamForAddUser, setSelectedTeamForAddUser] =
    useState<string>("");
  const [selectedUserForTeam, setSelectedUserForTeam] = useState<string>("");
  const [isAddingUserToTeam, setIsAddingUserToTeam] = useState(false);

  // Product management state: list, filters, create/edit form, and inline validation messages.
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [productSearchText, setProductSearchText] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("All");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productFormData, setProductFormData] = useState({
    productCode: "",
    productName: "",
    minAmount: "",
    maxAmount: "",
    minTenureMonths: "",
    maxTenureMonths: "",
    minInterestRate: "",
    maxInterestRate: "",
    processingFeePercent: "",
  });
  const [productFormErrors, setProductFormErrors] = useState<
    Record<string, string>
  >({});
  const [productFormMessage, setProductFormMessage] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [teamUserFormErrors, setTeamUserFormErrors] = useState<{
    team?: string;
    user?: string;
  }>({});
  const [teamUserFormMessage, setTeamUserFormMessage] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [uploadFormError, setUploadFormError] = useState("");

  // Pagination state is tracked separately for each admin section.
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(10);
  const [teamCurrentPage, setTeamCurrentPage] = useState(1);
  const [teamItemsPerPage, setTeamItemsPerPage] = useState(10);
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productItemsPerPage, setProductItemsPerPage] = useState(10);

  // Shared success/error banner messages shown near the top of each section.
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  // Reusable confirmation modal state. Different actions plug in their own title/message/callbacks.
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
  });

  const getUserIdFromToken = () => {
    // Some API actions need the current user id. If it is not in context, decode it from the JWT payload.
    if (!token) {
      return "";
    }

    try {
      const [, payload] = token.split(".");

      if (!payload) {
        return "";
      }

      // Normalize the JWT payload so atob can decode it safely.
      const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
      const paddedPayload = normalizedPayload.padEnd(
        Math.ceil(normalizedPayload.length / 4) * 4,
        "=",
      );
      const decodedPayload = JSON.parse(atob(paddedPayload)) as {
        sub?: string;
        userId?: string;
      };

      return decodedPayload.sub ?? decodedPayload.userId ?? "";
    } catch {
      return "";
    }
  };

  // Prefer the user id coming from context, but fall back to the token payload if needed.
  const currentUserId = user?.userId ?? user?.id ?? getUserIdFromToken();

  useEffect(() => {
    // Guard the page on the client:
    // 1. Wait for auth state to finish loading
    // 2. Redirect guests to sign-in
    // 3. Redirect non-admin users away from the admin workspace
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
            : "Unable to load users from backend.",
        );
      } else {
        setUsersError("Unable to load users from backend.");
      }
    } finally {
      setIsUsersLoading(false);
    }
  }, [token]);

  const handleStatusUpdate = async (
    userId: string,
    status: "active" | "inactive" | "block" | "unblock",
  ) => {
    // Simple defensive checks before making the API call.
    if (!userId || !userId.trim()) {
      setActionError("Invalid user selected. Please try again.");
      return;
    }

    if (!["active", "inactive", "block", "unblock"].includes(status)) {
      setActionError("Invalid status operation. Please try again.");
      return;
    }

    // Calls the backend to change the selected user's state.
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
        },
      );

      const responseData = response.data;
      const message =
        responseData?.message || "User status updated successfully.";

      setActionMessage(message);

      // Refresh the table so the latest backend state is shown immediately.
      await fetchAllUsers();
    } catch (error) {
      // Show the backend message when available, otherwise fall back to a generic one.
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;

        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to update user status.",
        );
      } else {
        setActionError("Unable to update user status.");
      }
    }
  };

  const handleUserActiveStatusConfirmation = (userId: string, userName: string, currentActive: boolean) => {
    // Build a confirmation modal before toggling active/inactive status.
    const newStatus = currentActive ? "inactive" : "active";
    const action = currentActive ? "deactivate" : "activate";
    const title = currentActive ? "Deactivate User" : "Activate User";
    const message = currentActive 
      ? `Are you sure you want to deactivate ${userName}? They will not be able to access the system.`
      : `Are you sure you want to activate ${userName}? They will be able to access the system.`;

    const performUpdate = async () => {
      await handleStatusUpdate(userId, newStatus);
    };

    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: action === "deactivate" ? "Deactivate" : "Activate",
      cancelText: "Cancel",
      onConfirm: performUpdate,
      onCancel: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleUserBlockStatusConfirmation = (userId: string, userName: string, currentBlocked: boolean) => {
    // Block/unblock uses the same reusable confirmation modal pattern.
    const newStatus = currentBlocked ? "unblock" : "block";
    const action = currentBlocked ? "unblock" : "block";
    const title = currentBlocked ? "Unblock User" : "Block User";
    const message = currentBlocked
      ? `Are you sure you want to unblock ${userName}? They will be able to access the system again.`
      : `Are you sure you want to block ${userName}? They will not be able to access the system.`;

    const performUpdate = async () => {
      await handleStatusUpdate(userId, newStatus);
    };

    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: action === "block" ? "Block" : "Unblock",
      cancelText: "Cancel",
      onConfirm: performUpdate,
      onCancel: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ==================== TEAMS FUNCTIONS ====================

  const fetchAllTeams = useCallback(async () => {
    // Loads all teams for the team management tab.
    try {
      // Reset loading and banner state before the request starts.
      setIsTeamsLoading(true);
      setActionError("");
      setActionMessage("");

      const response = await axios.get("/api/teams/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response.data;
      // Support both wrapped and direct array responses from backend.
      const teamsList = Array.isArray(responseData?.data)
        ? responseData.data
        : Array.isArray(responseData)
          ? responseData
          : [];

      setTeams(teamsList);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to load teams from backend.",
        );
      } else {
        setActionError("Unable to load teams from backend.");
      }
    } finally {
      setIsTeamsLoading(false);
    }
  }, [token]);

  const fetchTeamUsers = async (teamId: string) => {
    // Loads members for a single team and switches the view into "team members" mode.
    try {
      setActionError("");
      setActionMessage("");

      const response = await axios.post(
        "/api/teams/fetch-users",
        { teamId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const responseData = response.data;
      // Different endpoints may wrap the users list differently, so we normalize it here.
      const usersData = Array.isArray(responseData?.data)
        ? responseData.data
        : Array.isArray(responseData?.users)
          ? responseData.users
          : [];

      setTeamUsers(usersData);
      setSelectedTeamId(teamId);
      setIsShowingTeamUsers(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to fetch team users.",
        );
      } else {
        setActionError("Unable to fetch team users.");
      }
    }
  };

  const getTeamUserFormErrors = () => {
    // Validates the add-user form before sending it to the backend.
    const errors: { team?: string; user?: string } = {};

    if (!selectedTeamForAddUser) {
      errors.team = "Please select a team";
    }
    if (!selectedUserForTeam) {
      errors.user = "Please select a user";
    }

    if (selectedTeamForAddUser && selectedUserForTeam) {
      const selectedTeam = teams.find(
        (team) => team.teamId === selectedTeamForAddUser,
      );
      const selectedUser = users.find(
        (user) => user.userId === selectedUserForTeam,
      );
      const expectedRole = selectedTeam
        ? TEAM_ROLE_MAPPING[selectedTeam.teamCode]
        : undefined;

      // This client-side check stops the admin from pairing a user with the wrong team role.
      if (
        selectedUser &&
        expectedRole &&
        selectedUser.roleType !== expectedRole
      ) {
        errors.user = "Please select the correct role";
      }
    }

    return errors;
  };

  const handleAddUserToTeam = async () => {
    // Stop early if the add-user form has missing or mismatched values.
    const errors = getTeamUserFormErrors();
    setTeamUserFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setTeamUserFormMessage({
        type: "error",
        message:
          errors.user === "Please select the correct role"
            ? "Please select the correct role"
            : "Please fill in all required fields correctly.",
      });
      return;
    }

    try {
      // Disable the modal button and clear old modal messages during submission.
      setIsAddingUserToTeam(true);
      setTeamUserFormMessage(null);

      // Resolve readable names so the success message feels clearer to the admin.
      const selectedUser = users.find((u) => u.userId === selectedUserForTeam);
      const selectedTeam = teams.find(
        (t) => t.teamId === selectedTeamForAddUser,
      );
      const userDisplay = selectedUser ? selectedUser.name : "user";
      const teamDisplay = selectedTeam ? selectedTeam.teamName : "team";

      const response = await axios.post(
        "/api/teams/add-user",
        {
          teamId: selectedTeamForAddUser,
          userId: selectedUserForTeam,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const message =
        response.data?.message ||
        `${userDisplay} added to ${teamDisplay} successfully.`;
      setTeamUserFormMessage({
        type: "success",
        message: message,
      });

      // Briefly show the success banner, then close and reset the modal form.
      setTimeout(() => {
        setShowTeamUserModal(false);
        setSelectedTeamForAddUser("");
        setSelectedUserForTeam("");
        setTeamUserFormMessage(null);
        setTeamUserFormErrors({});
      }, 1500);

      await fetchAllTeams();

      // If the team currently on screen was updated, refresh that member list too.
      if (selectedTeamId === selectedTeamForAddUser) {
        await fetchTeamUsers(selectedTeamForAddUser);
      }
    } catch (error) {
      let errorMessage = "Unable to add user to team. Please try again.";

      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        if (typeof apiMessage === "string") {
          errorMessage = apiMessage;
        }
      }

      setTeamUserFormMessage({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsAddingUserToTeam(false);
    }
  };

  const handleRemoveUserFromTeam = async (teamId: string, userId: string) => {
    // Removing a user is wrapped in a confirmation modal to avoid accidental changes.
    const user = teamUsers.find((u) => u.userId === userId);
    const userDisplay = user ? `${user.name} (${user.userEmail})` : "this user";

    const performRemove = async () => {
      try {
        setActionError("");
        setActionMessage("");

        const response = await axios.patch(
          "/api/teams/remove-user",
          {
            teamId,
            userId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const message =
          response.data?.message || "User removed from team successfully.";
        setActionMessage(message);
        await fetchAllTeams();

        // Refresh the member table if the removed user belongs to the team currently being viewed.
        if (selectedTeamId === teamId) {
          await fetchTeamUsers(teamId);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const apiMessage = error.response?.data?.message;
          setActionError(
            typeof apiMessage === "string"
              ? apiMessage
              : "Unable to remove user from team.",
          );
        } else {
          setActionError("Unable to remove user from team.");
        }
      }
    };

    setConfirmModal({
      isOpen: true,
      title: "Remove User from Team",
      message: `Are you sure you want to remove ${userDisplay} from this team? This action cannot be undone.`,
      confirmText: "Remove User",
      cancelText: "Keep User",
      onConfirm: performRemove,
      onCancel: () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ==================== PRODUCTS FUNCTIONS ====================

  const fetchAllProducts = useCallback(async () => {
    // Loads all loan products for the product management tab.
    try {
      setIsProductsLoading(true);
      setActionError("");
      setActionMessage("");

      const response = await axios.get("/api/products/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response.data;
      // Support both array response styles from backend.
      const productsList = Array.isArray(responseData?.data)
        ? responseData.data
        : Array.isArray(responseData)
          ? responseData
          : [];

      setProducts(productsList);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to load products from backend.",
        );
      } else {
        setActionError("Unable to load products from backend.");
      }
    } finally {
      setIsProductsLoading(false);
    }
  }, [token]);

  const validateProductForm = () => {
    // Centralized product form validation keeps the save handler smaller and easier to follow.
    const errors: Record<string, string> = {};
    const trimmedCode = productFormData.productCode.trim();
    const trimmedName = productFormData.productName.trim();
    const decimalPattern = /^\d+(\.\d{1,2})?$/;
    const minAmount = parseFloat(productFormData.minAmount);
    const maxAmount = parseFloat(productFormData.maxAmount);
    const minTenure = parseInt(productFormData.minTenureMonths, 10);
    const maxTenure = parseInt(productFormData.maxTenureMonths, 10);
    const minRate = parseFloat(productFormData.minInterestRate);
    const maxRate = parseFloat(productFormData.maxInterestRate);
    const feePercent = parseFloat(productFormData.processingFeePercent);
    const hasProcessingFee =
      productFormData.processingFeePercent.trim().length > 0;

    // Product code rules: required, minimum length, and uppercase underscore format.
    if (!trimmedCode) {
      errors.productCode = "Product code is required.";
    } else if (trimmedCode.length < 3) {
      errors.productCode = "Product code must be at least 3 characters.";
    } else if (!/^[A-Z_]+$/.test(trimmedCode)) {
      errors.productCode =
        "Product code must contain only uppercase letters and underscores.";
    }

    // Product name rules: required and reasonably descriptive.
    if (!trimmedName) {
      errors.productName = "Product name is required.";
    } else if (trimmedName.length < 3) {
      errors.productName = "Product name must be at least 3 characters.";
    }

    // Amount rules: both values must be positive and min cannot exceed max.
    if (Number.isNaN(minAmount) || minAmount <= 0) {
      errors.minAmount = "Min amount must be a positive number.";
    } else if (!decimalPattern.test(productFormData.minAmount.trim())) {
      errors.minAmount = "Min amount can have up to 2 decimal places.";
    }
    if (Number.isNaN(maxAmount) || maxAmount <= 0) {
      errors.maxAmount = "Max amount must be a positive number.";
    } else if (!decimalPattern.test(productFormData.maxAmount.trim())) {
      errors.maxAmount = "Max amount can have up to 2 decimal places.";
    }
    if (!errors.minAmount && !errors.maxAmount && minAmount > maxAmount) {
      errors.maxAmount =
        "Max amount must be greater than or equal to min amount.";
    }

    // Tenure rules: values are in months and capped to a realistic limit.
    if (Number.isNaN(minTenure) || minTenure <= 0) {
      errors.minTenureMonths = "Min tenure must be a positive integer.";
    } else if (minTenure > 360) {
      errors.minTenureMonths = "Min tenure cannot exceed 360 months.";
    }

    if (Number.isNaN(maxTenure) || maxTenure <= 0) {
      errors.maxTenureMonths = "Max tenure must be a positive integer.";
    } else if (maxTenure > 360) {
      errors.maxTenureMonths = "Max tenure cannot exceed 360 months.";
    }

    if (
      !errors.minTenureMonths &&
      !errors.maxTenureMonths &&
      minTenure > maxTenure
    ) {
      errors.maxTenureMonths =
        "Max tenure must be greater than or equal to min tenure.";
    }

    // Interest rate rules: percentages must stay between 0 and 100.
    if (Number.isNaN(minRate) || minRate < 0) {
      errors.minInterestRate =
        "Min interest rate must be a non-negative number.";
    } else if (!decimalPattern.test(productFormData.minInterestRate.trim())) {
      errors.minInterestRate =
        "Min interest rate can have up to 2 decimal places.";
    } else if (minRate > 100) {
      errors.minInterestRate = "Min interest rate cannot exceed 100%.";
    }

    if (Number.isNaN(maxRate) || maxRate < 0) {
      errors.maxInterestRate =
        "Max interest rate must be a non-negative number.";
    } else if (!decimalPattern.test(productFormData.maxInterestRate.trim())) {
      errors.maxInterestRate =
        "Max interest rate can have up to 2 decimal places.";
    } else if (maxRate > 100) {
      errors.maxInterestRate = "Max interest rate cannot exceed 100%.";
    }

    if (
      !errors.minInterestRate &&
      !errors.maxInterestRate &&
      minRate > maxRate
    ) {
      errors.maxInterestRate =
        "Max rate must be greater than or equal to min rate.";
    }

    // Processing fee is optional, but if entered it must still be valid.
    if (hasProcessingFee && (Number.isNaN(feePercent) || feePercent < 0)) {
      errors.processingFeePercent =
        "Processing fee must be a non-negative number.";
    } else if (
      hasProcessingFee &&
      !decimalPattern.test(productFormData.processingFeePercent.trim())
    ) {
      errors.processingFeePercent =
        "Processing fee can have up to 2 decimal places.";
    } else if (hasProcessingFee && feePercent > 100) {
      errors.processingFeePercent = "Processing fee cannot exceed 100%.";
    }

    // Only block duplicate product codes when creating a new product.
    if (!editingProductId && !errors.productCode) {
      const isDuplicate = products.some(
        (p) => p.productCode.toUpperCase() === trimmedCode.toUpperCase(),
      );
      if (isDuplicate) {
        errors.productCode = "A product with this code already exists.";
      }
    }

    if (!errors.productName) {
      const isDuplicateName = products.some(
        (p) =>
          p.productName.trim().toLowerCase() === trimmedName.toLowerCase() &&
          p.productId !== editingProductId,
      );
      if (isDuplicateName) {
        errors.productName = "A product with this name already exists.";
      }
    }

    if (Object.keys(errors).length > 0) {
      // Save all field errors so the form can show inline feedback.
      setProductFormErrors(errors);
      return false;
    }

    setProductFormErrors({});
    return true;
  };

  const resetProductForm = () => {
    // Restores the product form to its default "create new" state.
    setProductFormData({
      productCode: "",
      productName: "",
      minAmount: "",
      maxAmount: "",
      minTenureMonths: "",
      maxTenureMonths: "",
      minInterestRate: "",
      maxInterestRate: "",
      processingFeePercent: "",
    });
    setProductFormErrors({});
    setProductFormMessage(null);
    setEditingProductId(null);
    setShowProductForm(false);
  };

  const handleSaveProduct = async () => {
    // Save handles both create and update depending on whether editingProductId exists.
    if (!validateProductForm()) {
      setProductFormMessage({
        type: "error",
        message: "Please fix the highlighted product fields.",
      });
      return;
    }

    if (!currentUserId) {
      setProductFormMessage({
        type: "error",
        message: "Unable to identify the current user. Please sign in again.",
      });
      return;
    }

    try {
      // Disable repeated clicks and clear old banners while saving.
      setIsCreatingProduct(true);
      setActionError("");
      setActionMessage("");
      setProductFormMessage(null);

      if (editingProductId) {
        // Editing updates an existing product record.
        const response = await axios.patch(
          "/api/products/update-product",
          {
            productId: editingProductId,
            ...productFormData,
            updatedBy: currentUserId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const message =
          response.data?.message || "Product updated successfully.";
        setActionMessage(message);
      } else {
        // Creating sends a brand new product record to the backend.
        const response = await axios.post(
          "/api/products/add",
          {
            ...productFormData,
            createdBy: currentUserId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const message =
          response.data?.message || "Product created successfully.";
        setActionMessage(message);
      }

      resetProductForm();
      await fetchAllProducts();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        setProductFormMessage({
          type: "error",
          message:
            typeof apiMessage === "string"
              ? apiMessage
              : "Unable to save product.",
        });
      } else {
        setProductFormMessage({
          type: "error",
          message: "Unable to save product.",
        });
      }
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleUpdateProductStatus = async (
    productId: string,
    currentStatus: string,
    productName: string,
  ) => {
    // Toggle active/inactive product status. Deactivation asks for confirmation first.
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const performStatusUpdate = async () => {
      try {
        setActionError("");
        setActionMessage("");

        const response = await axios.patch(
          "/api/products/update-status",
          {
            productId,
            status: newStatus,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const message =
          response.data?.message || "Product status updated successfully.";
        setActionMessage(message);
        await fetchAllProducts();
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const apiMessage = error.response?.data?.message;
          setActionError(
            typeof apiMessage === "string"
              ? apiMessage
              : "Unable to update product status.",
          );
        } else {
          setActionError("Unable to update product status.");
        }
      }
    };

    if (newStatus === "inactive") {
      // Extra confirmation protects against accidental deactivation.
      setConfirmModal({
        isOpen: true,
        title: "Deactivate Product",
        message: `Are you sure you want to deactivate ${productName}?`,
        confirmText: "Deactivate",
        cancelText: "Cancel",
        onConfirm: performStatusUpdate,
        onCancel: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        },
      });
      return;
    }

    await performStatusUpdate();
  };

  const handleEditProduct = (product: Product) => {
    // Pre-fills the product form with the selected record and opens it in edit mode.
    setProductFormErrors({});
    setProductFormMessage(null);
    setActionError("");
    setProductFormData({
      productCode: product.productCode,
      productName: product.productName,
      minAmount: product.minAmount,
      maxAmount: product.maxAmount,
      minTenureMonths: product.minTenureMonths.toString(),
      maxTenureMonths: product.maxTenureMonths.toString(),
      minInterestRate: product.minInterestRate,
      maxInterestRate: product.maxInterestRate,
      processingFeePercent: product.processingFeePercent,
    });
    setEditingProductId(product.productId);
    setShowProductForm(true);
  };

  const handleCancelProductForm = () => {
    // Cancel simply resets the form back to its hidden default state.
    resetProductForm();
  };

  useEffect(() => {
    // Whenever filters change, go back to page 1 so pagination stays consistent with the filtered list.
    setUserCurrentPage(1);
  }, [userSearchText, userStatusFilter]);

  useEffect(() => {
    // Team search can shrink the result set, so we reset pagination back to page 1.
    setTeamCurrentPage(1);
  }, [teamSearchText]);

  useEffect(() => {
    // Product search/filter can change the result count, so reset pagination too.
    setProductCurrentPage(1);
  }, [productSearchText, productStatusFilter]);

  useEffect(() => {
    // Load users lazily only when their tab is active.
    if (!token || !isAdmin || activeSection !== "users") return;

    fetchAllUsers();
  }, [token, isAdmin, activeSection, fetchAllUsers]);

  useEffect(() => {
    // Load teams lazily only when their tab is active.
    if (!token || !isAdmin || activeSection !== "teams") return;

    fetchAllTeams();
  }, [token, isAdmin, activeSection, fetchAllTeams]);

  useEffect(() => {
    // Load products lazily only when their tab is active.
    if (!token || !isAdmin || activeSection !== "products") return;

    fetchAllProducts();
  }, [token, isAdmin, activeSection, fetchAllProducts]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    // Runs quick client-side checks before the upload button is even pressed.
    const file = event.target.files?.[0] || null;

    // Validate file type
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];

      if (!validTypes.includes(file.type)) {
        setUploadFormError(
          "Invalid file type. Please upload .xlsx, .xls, or .csv only.",
        );
        setSelectedFile(null);
        return;
      }

      // Validate file size (max 5MB)
      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setUploadFormError(
          "File size exceeds 5MB. Please select a smaller file.",
        );
        setSelectedFile(null);
        return;
      }
    }

    // A valid new selection clears the previous upload result and any old banner messages.
    setSelectedFile(file);
    setUploadResult(null);
    setUploadFormError("");
    setActionError("");
    setActionMessage("");
  };

  const handleExcelUpload = async () => {
    // Stops upload when no file is selected.
    if (!selectedFile) {
      setUploadFormError("Please select an Excel file first.");
      return;
    }

    // Re-validate before upload in case the selected file changed unexpectedly.
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setUploadFormError(
        "Invalid file type. Please upload .xlsx, .xls, or .csv only.",
      );
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (selectedFile.size > maxSizeInBytes) {
      setUploadFormError(
        "File size exceeds 5MB. Please select a smaller file.",
      );
      return;
    }

    setUploadFormError("");

    // Send the file as multipart/form-data so the backend can parse it as an uploaded file.
    try {
      setIsUploading(true);
      setActionError("");
      setActionMessage("");
      setUploadResult(null);

      const formData = new FormData();
      // Backend expects the uploaded file under the key named "file".
      formData.append("file", selectedFile);

      const response = await axios.post("/api/users/upload-excel", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response.data as UploadUsersResponse;

      setUploadResult(responseData);
      setActionMessage(responseData?.message || "Users uploaded successfully.");

      // Refresh the table so newly created users appear right away.
      await fetchAllUsers();
    } catch (error) {
      // Show the backend message when available, otherwise fall back to a generic one.
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;

        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to upload Excel file.",
        );
      } else {
        setActionError("Unable to upload Excel file.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    // Filtering is memoized so we only recompute when the source data or filter inputs change.
    let result = [...users];

    if (userSearchText.trim()) {
      const keyword = userSearchText.trim().toLowerCase();

      // Search across multiple visible columns so the admin can find users more easily.
      result = result.filter((item) => {
        return (
          item.name.toLowerCase().includes(keyword) ||
          item.userEmail.toLowerCase().includes(keyword) ||
          item.roleType.toLowerCase().includes(keyword) ||
          (item.phone || "").toLowerCase().includes(keyword)
        );
      });
    }

    // Apply one dropdown filter at a time on top of the search results.
    if (userStatusFilter === "Active") {
      result = result.filter((item) => item.isActive);
    }

    if (userStatusFilter === "Inactive") {
      result = result.filter((item) => !item.isActive);
    }

    if (userStatusFilter === "Blocked") {
      result = result.filter((item) => item.isBlocked);
    }

    if (userStatusFilter === "Logged In") {
      result = result.filter((item) => item.isLoggedIn);
    }

    return result;
  }, [users, userSearchText, userStatusFilter]);

  // Build the current page slice after filtering users.
  const userTotalPages = Math.ceil(filteredUsers.length / userItemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (userCurrentPage - 1) * userItemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + userItemsPerPage);
  }, [filteredUsers, userCurrentPage, userItemsPerPage]);

  const filteredTeams = useMemo(() => {
    let result = [...teams];

    if (teamSearchText.trim()) {
      const keyword = teamSearchText.trim().toLowerCase();
      // Team search matches code, name, and description.
      result = result.filter((item) => {
        return (
          item.teamName.toLowerCase().includes(keyword) ||
          item.teamCode.toLowerCase().includes(keyword) ||
          (item.description || "").toLowerCase().includes(keyword)
        );
      });
    }

    return result;
  }, [teams, teamSearchText]);

  // Build the current page slice after filtering teams.
  const teamTotalPages = Math.ceil(filteredTeams.length / teamItemsPerPage);
  const paginatedTeams = useMemo(() => {
    const startIndex = (teamCurrentPage - 1) * teamItemsPerPage;
    return filteredTeams.slice(startIndex, startIndex + teamItemsPerPage);
  }, [filteredTeams, teamCurrentPage, teamItemsPerPage]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (productSearchText.trim()) {
      const keyword = productSearchText.trim().toLowerCase();
      // Product search matches both business name and unique code.
      result = result.filter((item) => {
        return (
          item.productName.toLowerCase().includes(keyword) ||
          item.productCode.toLowerCase().includes(keyword)
        );
      });
    }

    if (productStatusFilter === "Active") {
      result = result.filter((item) => item.status.toLowerCase() === "active");
    }

    if (productStatusFilter === "Inactive") {
      result = result.filter(
        (item) => item.status.toLowerCase() === "inactive",
      );
    }

    return result;
  }, [products, productSearchText, productStatusFilter]);

  // Build the current page slice after filtering products.
  const productTotalPages = Math.ceil(
    filteredProducts.length / productItemsPerPage,
  );
  const paginatedProducts = useMemo(() => {
    const startIndex = (productCurrentPage - 1) * productItemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productItemsPerPage);
  }, [filteredProducts, productCurrentPage, productItemsPerPage]);

  // Summary cards are derived from the currently loaded user data.
  const totalUsers = users.length;
  const totalLoggedInUsers = users.filter((item) => item.isLoggedIn).length;
  const totalActiveUsers = users.filter((item) => item.isActive).length;
  const totalBlockedUsers = users.filter((item) => item.isBlocked).length;

  // Compose a friendly display name with sensible fallbacks.
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

  const PaginationControls = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
  }) => {
    // Shared pager used by all three sections to avoid duplicating the same JSX.
    if (totalItems === 0) return null;

    // Calculate the human-readable item range for the current page.
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="cp-admin-pagination">
        <div className="cp-admin-pagination-info">
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{" "}
          <strong>{totalItems}</strong> items
        </div>

        <div className="cp-admin-pagination-actions">
          <div className="cp-admin-pagination-nav">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="cp-admin-pagination-btn"
            >
              Previous
            </button>

            <span className="cp-admin-pagination-badge">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="cp-admin-pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUserManagementContent = () => {
    // Renders the full user management workspace: summary cards, upload, filters, table, and actions.
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
              {/* Inline SVG icon used instead of importing a separate icon component. */}
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
                {/* Show selected file name after choosing a file, otherwise show the empty prompt. */}
                {selectedFile
                  ? selectedFile.name
                  : "Click to choose Excel file"}
              </p>

              <p className="cp-loan-upload-helper">
                Supported file types: .xlsx, .xls, .csv
              </p>
            </label>
            {uploadFormError && (
              <p className="cp-admin-field-error">{uploadFormError}</p>
            )}
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
          // Upload result is shown only after the backend processes the Excel file.
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
              // Failed rows are listed one by one so the admin can see exactly what went wrong.
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
          {/* Free-text search filters the currently loaded user list on the client side. */}
          <input
            type="text"
            className="cp-admin-field"
            placeholder="Search by name, email, role, or phone"
            value={userSearchText}
            onChange={(event) => setUserSearchText(event.target.value)}
          />

          <select
            className="cp-admin-field cp-admin-select"
            value={userStatusFilter}
            onChange={(event) => setUserStatusFilter(event.target.value)}
          >
            {/* Status filter narrows the already-loaded user list without another API request. */}
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
                // Keep the table layout stable while data is loading.
                <tr>
                  <td colSpan={9}>
                    <div className="cp-admin-empty-state">Loading users...</div>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                // Only paginatedUsers are rendered here, not the full filtered array.
                paginatedUsers.map((item) => (
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
                            handleUserActiveStatusConfirmation(
                              item.userId,
                              item.name,
                              item.isActive,
                            )
                          }
                        >
                          {item.isActive ? "Make Inactive" : "Make Active"}
                        </button>

                        <button
                          type="button"
                          className="cp-admin-action-btn cp-admin-action-btn-danger"
                          onClick={() =>
                            handleUserBlockStatusConfirmation(
                              item.userId,
                              item.name,
                              item.isBlocked,
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

        {filteredUsers.length > 0 && (
          <PaginationControls
            currentPage={userCurrentPage}
            totalPages={userTotalPages}
            totalItems={filteredUsers.length}
            itemsPerPage={userItemsPerPage}
            onPageChange={setUserCurrentPage}
            onItemsPerPageChange={setUserItemsPerPage}
          />
        )}
      </div>
    );
  };

  const renderTeamManagementContent = () => {
    // Team summary values are computed locally from the fetched team list.
    const totalTeams = teams.length;
    const activeTeams = teams.filter((item) => item.isActive).length;
    const totalTeamUsers = teams.reduce((sum, team) => sum + team.userCount, 0);

    return (
      <div className="cp-admin-panel">
        <div className="cp-admin-panel-header">
          <div>
            <p className="cp-admin-eyebrow">Admin Panel</p>
            <h1 className="cp-admin-title">Team Management</h1>
            <p className="cp-admin-subtitle">
              Manage teams, add or remove team members, and view team details
              from one centralized dashboard.
            </p>
          </div>
        </div>

        {(actionMessage || actionError) && (
          <div
            className={`cp-admin-alert ${
              actionError ? "cp-admin-alert-error" : "cp-admin-alert-success"
            }`}
          >
            {actionError || actionMessage}
          </div>
        )}

        <div className="cp-admin-summary-grid">
          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Total Teams</p>
            <h3 className="cp-admin-summary-value">{totalTeams}</h3>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Active Teams</p>
            <h3 className="cp-admin-summary-value">{activeTeams}</h3>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Total Team Members</p>
            <h3 className="cp-admin-summary-value">{totalTeamUsers}</h3>
          </div>
        </div>

        {isShowingTeamUsers ? (
          // When a team is selected, the normal team list is replaced by this member view.
          <div className="cp-admin-upload-result">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="cp-admin-section-subtitle">Team Members</h3>
              <button
                type="button"
                className="cp-admin-action-btn"
                onClick={() => {
                  setIsShowingTeamUsers(false);
                  setSelectedTeamId(null);
                  setTeamUsers([]);
                }}
              >
                Back to Teams
              </button>
            </div>

            {teamUsers.length > 0 ? (
              // Team member table for the selected team.
              <div className="cp-admin-table-wrap">
                <table className="cp-admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamUsers.map((teamUser) => (
                      <tr key={teamUser.userId}>
                        <td>{teamUser.name}</td>
                        <td>{teamUser.userEmail}</td>
                        <td>{teamUser.roleType}</td>
                        <td>
                          <div className="cp-admin-action-group">
                            <button
                              type="button"
                              className="cp-admin-action-btn cp-admin-action-btn-danger"
                              onClick={() =>
                                handleRemoveUserFromTeam(
                                  selectedTeamId || "",
                                  teamUser.userId,
                                )
                              }
                            >
                              Remove User
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // Empty state makes it clear the request succeeded but no users belong to the team.
              <div className="cp-admin-empty-state">
                No members in this team.
              </div>
            )}
          </div>
        ) : (
          // Default team view: search teams, optionally open add-user panel, and list teams.
          <>
            <div className="cp-admin-upload-row mb-4">
              <input
                type="text"
                className="cp-admin-field"
                placeholder="Search by team name or code"
                value={teamSearchText}
                onChange={(event) => setTeamSearchText(event.target.value)}
              />
              <button
                type="button"
                className="btn btn-primary cp-loan-btn-next"
                onClick={() => {
                  setShowTeamUserModal(true);
                  setSelectedTeamForAddUser("");
                  setSelectedUserForTeam("");
                }}
              >
                Add User to Team
              </button>
            </div>

            {showTeamUserModal && (
              // Inline form panel for assigning one existing user to one selected team.
              <div className="cp-admin-upload-result">
                <h3 className="cp-admin-section-subtitle">Add User to Team</h3>

                {teamUserFormMessage && (
                  <div
                    className={`cp-admin-alert ${
                      teamUserFormMessage.type === "error"
                        ? "cp-admin-alert-error"
                        : "cp-admin-alert-success"
                    }`}
                  >
                    {teamUserFormMessage.message}
                  </div>
                )}

                <div className="mb-3">
                  <label className="cp-admin-upload-label">Select Team</label>
                  <div className="d-grid gap-2">
                    <select
                      className={`cp-admin-field ${teamUserFormErrors.team ? "cp-admin-field-invalid" : ""}`}
                      value={selectedTeamForAddUser}
                      onChange={(event) =>
                        setSelectedTeamForAddUser(event.target.value)
                      }
                    >
                      {/* Team dropdown is populated from the loaded teams array. */}
                      <option value="">-- Select Team --</option>
                      {teams.map((team) => (
                        <option key={team.teamId} value={team.teamId}>
                          {team.teamName} ({team.teamCode})
                        </option>
                      ))}
                    </select>
                    {teamUserFormErrors.team && (
                      <p className="cp-admin-field-error">
                        {teamUserFormErrors.team}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="cp-admin-upload-label">Select User</label>
                  <div className="d-grid gap-2">
                    <select
                      className={`cp-admin-field ${teamUserFormErrors.user ? "cp-admin-field-invalid" : ""}`}
                      value={selectedUserForTeam}
                      onChange={(event) =>
                        setSelectedUserForTeam(event.target.value)
                      }
                    >
                      {/* User dropdown is populated from the already-fetched users list. */}
                      <option value="">-- Select User --</option>
                      {users.map((u) => (
                        <option key={u.userId} value={u.userId}>
                          {u.name} ({u.userEmail})
                        </option>
                      ))}
                    </select>
                    {teamUserFormErrors.user && (
                      <p className="cp-admin-field-error">
                        {teamUserFormErrors.user}
                      </p>
                    )}
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddUserToTeam}
                    disabled={isAddingUserToTeam}
                  >
                    {isAddingUserToTeam ? "Adding..." : "Add User"}
                  </button>
                  <button
                    type="button"
                    className="cp-admin-action-btn"
                    onClick={() => {
                      setShowTeamUserModal(false);
                      setSelectedTeamForAddUser("");
                      setSelectedUserForTeam("");
                      setTeamUserFormMessage(null);
                      setTeamUserFormErrors({});
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="cp-admin-table-wrap">
              <table className="cp-admin-table">
                <thead>
                  <tr>
                    <th>Team Code</th>
                    <th>Team Name</th>
                    <th>Description</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {isTeamsLoading ? (
                    // Preserve the table shell while the teams request is in progress.
                    <tr>
                      <td colSpan={6}>
                        <div className="cp-admin-empty-state">
                          Loading teams...
                        </div>
                      </td>
                    </tr>
                  ) : filteredTeams.length > 0 ? (
                    // Render only the current team page after client-side search filtering.
                    paginatedTeams.map((team) => (
                      <tr key={team.teamId}>
                        <td>
                          <strong>{team.teamCode}</strong>
                        </td>
                        <td>{team.teamName}</td>
                        <td>{team.description || "-"}</td>
                        <td>
                          <span className="cp-admin-status-pill cp-admin-status-pill-success">
                            {team.userCount} members
                          </span>
                        </td>
                        <td>
                          <span
                            className={`cp-admin-status-pill ${
                              team.isActive
                                ? "cp-admin-status-pill-success"
                                : "cp-admin-status-pill-warning"
                            }`}
                          >
                            {team.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="cp-admin-action-group">
                            <button
                              type="button"
                              className="cp-admin-action-btn"
                              onClick={() => fetchTeamUsers(team.teamId)}
                            >
                              View Members
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="cp-admin-empty-state">
                          No teams found for the current search.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredTeams.length > 0 && (
              <PaginationControls
                currentPage={teamCurrentPage}
                totalPages={teamTotalPages}
                totalItems={filteredTeams.length}
                itemsPerPage={teamItemsPerPage}
                onPageChange={setTeamCurrentPage}
                onItemsPerPageChange={setTeamItemsPerPage}
              />
            )}
          </>
        )}
      </div>
    );
  };

  const renderProductManagementContent = () => {
    // Product summary values are computed locally from the fetched products list.
    const totalProducts = products.length;
    const activeProducts = products.filter(
      (item) => item.status.toLowerCase() === "active",
    ).length;

    return (
      <div className="cp-admin-panel">
        <div className="cp-admin-panel-header">
          <div>
            <p className="cp-admin-eyebrow">Admin Panel</p>
            <h1 className="cp-admin-title">Product Management</h1>
            <p className="cp-admin-subtitle">
              Create, edit, and manage loan products with configuration for
              amounts, tenures, interest rates, and fees.
            </p>
          </div>
        </div>

        {(actionMessage || actionError) && (
          <div
            className={`cp-admin-alert ${
              actionError ? "cp-admin-alert-error" : "cp-admin-alert-success"
            }`}
          >
            {actionError || actionMessage}
          </div>
        )}

        <div className="cp-admin-summary-grid">
          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Total Products</p>
            <h3 className="cp-admin-summary-value">{totalProducts}</h3>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Active Products</p>
            <h3 className="cp-admin-summary-value">{activeProducts}</h3>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Inactive Products</p>
            <h3 className="cp-admin-summary-value">
              {totalProducts - activeProducts}
            </h3>
          </div>

          <div className="cp-admin-summary-card">
            <p className="cp-admin-summary-label">Avg Interest Rate</p>
            <h3 className="cp-admin-summary-value">
              {products.length > 0
                ? (
                    products.reduce(
                      (sum, p) => sum + parseFloat(p.minInterestRate),
                      0,
                    ) / products.length
                  ).toFixed(2)
                : "0.00"}
              %
            </h3>
          </div>
        </div>

        <div className="cp-admin-product-toolbar mb-4">
          {/* Product search and status filter both work on the locally loaded product list. */}
          <input
            type="text"
            className="cp-admin-field"
            placeholder="Search by product name or code"
            value={productSearchText}
            onChange={(event) => setProductSearchText(event.target.value)}
          />
          <select
            className="cp-admin-field cp-admin-select"
            value={productStatusFilter}
            onChange={(event) => setProductStatusFilter(event.target.value)}
          >
            <option value="All">All Products</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            type="button"
            className="btn btn-primary cp-loan-btn-next cp-admin-product-create-btn"
            onClick={() => {
              setActionError("");
              resetProductForm();
              setShowProductForm(true);
            }}
          >
            {/* This opens the same form component used for both create and edit flows. */}
            New Product
          </button>
        </div>

        {showProductForm && (
          // Reusable product form panel. If editingProductId exists, the same form becomes edit mode.
          <div className="cp-admin-upload-result">
            {!editingProductId && (
              <h3 className="cp-admin-section-subtitle">
                Create New Product
              </h3>
            )}

            {productFormMessage && (
              <div
                className={`cp-admin-alert ${
                  productFormMessage.type === "error"
                    ? "cp-admin-alert-error"
                    : "cp-admin-alert-success"
                }`}
              >
                {productFormMessage.message}
              </div>
            )}

            <div className="cp-admin-product-form-grid mb-3">
              <div className="d-grid gap-2">
                <label className="cp-admin-upload-label">Product Code</label>
                <input
                  type="text"
                  className={`cp-admin-field ${productFormErrors.productCode ? "cp-admin-field-invalid" : ""}`}
                  placeholder={
                    editingProductId ? "" : "Product Code (e.g., PERSONAL_LOAN)"
                  }
                  value={productFormData.productCode}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      productCode: e.target.value,
                    })
                  }
                  disabled={!!editingProductId}
                />
                {/* Product code is editable only during creation; in edit mode it stays locked. */}
                {productFormErrors.productCode && (
                  <p className="cp-admin-field-error">
                    {productFormErrors.productCode}
                  </p>
                )}
              </div>
              <div className="d-grid gap-2">
                <label className="cp-admin-upload-label">Product Name</label>
                <input
                  type="text"
                  className={`cp-admin-field ${productFormErrors.productName ? "cp-admin-field-invalid" : ""}`}
                  placeholder={editingProductId ? "" : "Product Name"}
                  value={productFormData.productName}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      productName: e.target.value,
                    })
                  }
                />
                {productFormErrors.productName && (
                  <p className="cp-admin-field-error">
                    {productFormErrors.productName}
                  </p>
                )}
              </div>
            </div>

            <div className="cp-admin-product-form-grid mb-3">
              <div className="d-grid gap-2">
                <label className="cp-admin-upload-label">Min Amount</label>
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.minAmount ? "cp-admin-field-invalid" : ""}`}
                  placeholder={editingProductId ? "" : "Min Amount"}
                  value={productFormData.minAmount}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      minAmount: e.target.value,
                    })
                  }
                  step="0.01"
                />
                {productFormErrors.minAmount && (
                  <p className="cp-admin-field-error">
                    {productFormErrors.minAmount}
                  </p>
                )}
              </div>
              <div className="d-grid gap-2">
                <label className="cp-admin-upload-label">Max Amount</label>
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.maxAmount ? "cp-admin-field-invalid" : ""}`}
                  placeholder={editingProductId ? "" : "Max Amount"}
                  value={productFormData.maxAmount}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      maxAmount: e.target.value,
                    })
                  }
                  step="0.01"
                />
                {productFormErrors.maxAmount && (
                  <p className="cp-admin-field-error">
                    {productFormErrors.maxAmount}
                  </p>
                )}
              </div>
            </div>

            <div className="cp-admin-product-form-grid mb-3">
              <div className="d-grid gap-2">
                <label className="cp-admin-upload-label">
                  Min Tenure (months)
                </label>
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.minTenureMonths ? "cp-admin-field-invalid" : ""}`}
                  placeholder={editingProductId ? "" : "Min Tenure (months)"}
                  value={productFormData.minTenureMonths}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      minTenureMonths: e.target.value,
                    })
                  }
                />
                {productFormErrors.minTenureMonths && (
                  <p className="cp-admin-field-error">
                    {productFormErrors.minTenureMonths}
                  </p>
                )}
              </div>
              <div className="d-grid gap-2">
                <label className="cp-admin-upload-label">
                  Max Tenure (months)
                </label>
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.maxTenureMonths ? "cp-admin-field-invalid" : ""}`}
                  placeholder={editingProductId ? "" : "Max Tenure (months)"}
                  value={productFormData.maxTenureMonths}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      maxTenureMonths: e.target.value,
                    })
                  }
                />
                {productFormErrors.maxTenureMonths && (
                  <p className="cp-admin-field-error">
                    {productFormErrors.maxTenureMonths}
                  </p>
                )}
              </div>
            </div>

            <div className="cp-admin-product-form-grid mb-3">
              <div className="d-grid gap-2">
                <label className="cp-admin-upload-label">
                  Min Interest Rate (%)
                </label>
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.minInterestRate ? "cp-admin-field-invalid" : ""}`}
                  placeholder={
                    editingProductId ? "" : "Min Interest Rate (%)"
                  }
                  value={productFormData.minInterestRate}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      minInterestRate: e.target.value,
                    })
                  }
                  step="0.01"
                />
                {productFormErrors.minInterestRate && (
                  <p className="cp-admin-field-error">
                    {productFormErrors.minInterestRate}
                  </p>
                )}
              </div>
              <div className="d-grid gap-2">
                <label className="cp-admin-upload-label">
                  Max Interest Rate (%)
                </label>
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.maxInterestRate ? "cp-admin-field-invalid" : ""}`}
                  placeholder={
                    editingProductId ? "" : "Max Interest Rate (%)"
                  }
                  value={productFormData.maxInterestRate}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      maxInterestRate: e.target.value,
                    })
                  }
                  step="0.01"
                />
                {productFormErrors.maxInterestRate && (
                  <p className="cp-admin-field-error">
                    {productFormErrors.maxInterestRate}
                  </p>
                )}
              </div>
            </div>

            <div className="cp-admin-product-form-grid cp-admin-product-form-grid-single mb-3">
              <div className="d-grid gap-2">
                <label className="cp-admin-upload-label">
                  Processing Fee Percent (%)
                </label>
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.processingFeePercent ? "cp-admin-field-invalid" : ""}`}
                  placeholder={
                    editingProductId ? "" : "Processing Fee Percent (%)"
                  }
                  value={productFormData.processingFeePercent}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      processingFeePercent: e.target.value,
                    })
                  }
                  step="0.01"
                />
                {productFormErrors.processingFeePercent && (
                  <p className="cp-admin-field-error">
                    {productFormErrors.processingFeePercent}
                  </p>
                )}
              </div>
            </div>

            <div className="d-flex gap-2">
              {/* Primary button saves either a new product or changes to an existing one. */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveProduct}
                disabled={isCreatingProduct}
              >
                {isCreatingProduct
                  ? "Saving..."
                  : editingProductId
                    ? "Update Product"
                    : "Create Product"}
              </button>
              <button
                type="button"
                className="cp-admin-action-btn"
                onClick={handleCancelProductForm}
              >
                {/* Cancel closes the form and clears any draft values. */}
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="cp-admin-table-wrap">
          <table className="cp-admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Product Name</th>
                <th>Amount Range</th>
                <th>Tenure (months)</th>
                <th>Interest Rate Range</th>
                <th>Processing Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isProductsLoading ? (
                // Keep table shape visible while products are being fetched.
                <tr>
                  <td colSpan={8}>
                    <div className="cp-admin-empty-state">
                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
                // Render the current page of filtered products.
                paginatedProducts.map((product) => (
                  <tr key={product.productId}>
                    <td>
                      <strong>{product.productCode}</strong>
                    </td>
                    <td>{product.productName}</td>
                    <td>
                      ₹{parseFloat(product.minAmount).toLocaleString()} - ₹
                      {parseFloat(product.maxAmount).toLocaleString()}
                    </td>
                    <td>
                      {product.minTenureMonths} - {product.maxTenureMonths}{" "}
                      months
                    </td>
                    <td>
                      {product.minInterestRate}% - {product.maxInterestRate}%
                    </td>
                    <td>{product.processingFeePercent}%</td>
                    <td>
                      <span
                        className={`cp-admin-status-pill ${
                          product.status.toLowerCase() === "active"
                            ? "cp-admin-status-pill-success"
                            : "cp-admin-status-pill-warning"
                        }`}
                      >
                        {product.status.charAt(0).toUpperCase() +
                          product.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="cp-admin-action-group">
                        <button
                          type="button"
                          className="cp-admin-action-btn"
                          onClick={() => handleEditProduct(product)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className={`cp-admin-action-btn ${
                            product.status.toLowerCase() === "active"
                              ? "cp-admin-action-btn-danger"
                              : ""
                          }`}
                          onClick={() =>
                            handleUpdateProductStatus(
                              product.productId,
                              product.status,
                              product.productName,
                            )
                          }
                        >
                          {product.status.toLowerCase() === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="cp-admin-empty-state">
                      No products found for the current filter.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredProducts.length > 0 && (
          <PaginationControls
            currentPage={productCurrentPage}
            totalPages={productTotalPages}
            totalItems={filteredProducts.length}
            itemsPerPage={productItemsPerPage}
            onPageChange={setProductCurrentPage}
            onItemsPerPageChange={setProductItemsPerPage}
          />
        )}
      </div>
    );
  };

  const renderSectionContent = () => {
    // Simple section switcher for the top admin tabs.
    if (activeSection === "users") {
      return renderUserManagementContent();
    }

    if (activeSection === "teams") {
      return renderTeamManagementContent();
    }

    return renderProductManagementContent();
  };

  if (isLoading) {
    // Keep the UI simple while auth context is restoring the current session.
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
    // The redirect effect will run, but this fallback prevents the page from rendering protected content.
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
        {/* Top admin header with welcome text and tab buttons. */}
        <div className="cp-admin-topnav panel">
          <div className="cp-admin-topnav-head">
            <div>
              <p className="cp-admin-eyebrow">Admin Workspace</p>
              <h2 className="cp-admin-topnav-title">Welcome, {displayName}</h2>
            </div>
          </div>

          <div className="cp-admin-tabbar">
            {/* These buttons switch local section state rather than navigating to a new URL. */}
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

        {/* Confirmation Modal */}
        {confirmModal.isOpen && (
          // The overlay closes the modal on outside click, while the inner dialog stops propagation.
          <div
            className="cp-confirm-modal-overlay"
            onClick={confirmModal.onCancel}
          >
            <div
              className="cp-confirm-modal-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cp-confirm-modal-header">
                <h2 className="cp-confirm-modal-title">{confirmModal.title}</h2>
              </div>
              <div className="cp-confirm-modal-body">
                <p className="cp-confirm-modal-message">
                  {confirmModal.message}
                </p>
              </div>
              <div className="cp-confirm-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={confirmModal.onCancel}
                >
                  {confirmModal.cancelText || "Cancel"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  }}
                >
                  {confirmModal.confirmText || "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
