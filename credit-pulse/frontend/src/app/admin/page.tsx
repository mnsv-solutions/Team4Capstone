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

type Team = {
  teamId: string;
  teamCode: string;
  teamName: string;
  description: string | null;
  userCount: number;
  isActive: boolean;
};

type TeamUser = {
  userId: string;
  name: string;
  userEmail: string;
  roleType: string;
};

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
  
  // User state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadUsersResponse | null>(
    null
  );
  const [userSearchText, setUserSearchText] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("All");

  // Team state
  const [teams, setTeams] = useState<Team[]>([]);
  const [isTeamsLoading, setIsTeamsLoading] = useState(false);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isShowingTeamUsers, setIsShowingTeamUsers] = useState(false);
  const [teamSearchText, setTeamSearchText] = useState("");
  const [showTeamUserModal, setShowTeamUserModal] = useState(false);
  const [selectedTeamForAddUser, setSelectedTeamForAddUser] = useState<string>("");
  const [selectedUserForTeam, setSelectedUserForTeam] = useState<string>("");
  const [isAddingUserToTeam, setIsAddingUserToTeam] = useState(false);

  // Product state
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
  const [productFormErrors, setProductFormErrors] = useState<Record<string, string>>({});
  const [teamUserFormErrors, setTeamUserFormErrors] = useState<{
    team?: string;
    user?: string;
  }>({});
  const [uploadFormError, setUploadFormError] = useState("");

  // Pagination state
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(10);
  const [teamCurrentPage, setTeamCurrentPage] = useState(1);
  const [teamItemsPerPage, setTeamItemsPerPage] = useState(10);
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productItemsPerPage, setProductItemsPerPage] = useState(10);

  // General state
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

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

  // ==================== TEAMS FUNCTIONS ====================

  const fetchAllTeams = useCallback(async () => {
    try {
      setIsTeamsLoading(true);
      setActionError("");
      setActionMessage("");

      const response = await axios.get("/api/teams/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = response.data;
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
            : "Unable to load teams from backend."
        );
      } else {
        setActionError("Unable to load teams from backend.");
      }
    } finally {
      setIsTeamsLoading(false);
    }
  }, [token]);

  const fetchTeamUsers = async (teamId: string) => {
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
        }
      );

      const responseData = response.data;
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
            : "Unable to fetch team users."
        );
      } else {
        setActionError("Unable to fetch team users.");
      }
    }
  };

  const handleAddUserToTeam = async () => {
    if (!validateTeamUserForm()) {
      return;
    }

    try {
      setIsAddingUserToTeam(true);
      setActionError("");
      setActionMessage("");

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
        }
      );

      const message =
        response.data?.message || "User added to team successfully.";
      setActionMessage(message);
      setShowTeamUserModal(false);
      setSelectedTeamForAddUser("");
      setSelectedUserForTeam("");
      await fetchAllTeams();

      if (selectedTeamId === selectedTeamForAddUser) {
        await fetchTeamUsers(selectedTeamForAddUser);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to add user to team."
        );
      } else {
        setActionError("Unable to add user to team.");
      }
    } finally {
      setIsAddingUserToTeam(false);
    }
  };

  const validateTeamUserForm = () => {
    const errors: { team?: string; user?: string } = {};

    if (!selectedTeamForAddUser) {
      errors.team = "Choose a team.";
    }
    if (!selectedUserForTeam) {
      errors.user = "Choose a user.";
    }

    setTeamUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleRemoveUserFromTeam = async (teamId: string, userId: string) => {
    if (!window.confirm("Are you sure you want to remove this user from the team?")) return;

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
        }
      );

      const message =
        response.data?.message || "User removed from team successfully.";
      setActionMessage(message);
      await fetchAllTeams();

      if (selectedTeamId === teamId) {
        await fetchTeamUsers(teamId);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to remove user from team."
        );
      } else {
        setActionError("Unable to remove user from team.");
      }
    }
  };

  // ==================== PRODUCTS FUNCTIONS ====================

  const fetchAllProducts = useCallback(async () => {
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
            : "Unable to load products from backend."
        );
      } else {
        setActionError("Unable to load products from backend.");
      }
    } finally {
      setIsProductsLoading(false);
    }
  }, [token]);

  const validateProductForm = () => {
    const errors: Record<string, string> = {};
    const trimmedCode = productFormData.productCode.trim();
    const trimmedName = productFormData.productName.trim();
    const minAmount = Number(productFormData.minAmount);
    const maxAmount = Number(productFormData.maxAmount);
    const minTenure = Number(productFormData.minTenureMonths);
    const maxTenure = Number(productFormData.maxTenureMonths);
    const minRate = Number(productFormData.minInterestRate);
    const maxRate = Number(productFormData.maxInterestRate);
    const feePercent = Number(productFormData.processingFeePercent);

    if (!trimmedCode) {
      errors.productCode = "Product code is required.";
    } else if (!/^[A-Z0-9_]+$/.test(trimmedCode)) {
      errors.productCode = "Product code should use uppercase letters, numbers, and underscores only.";
    }
    if (!trimmedName) {
      errors.productName = "Product name is required.";
    }
    if (Number.isNaN(minAmount) || minAmount <= 0) {
      errors.minAmount = "Min amount must be a positive number.";
    }
    if (Number.isNaN(maxAmount) || maxAmount <= 0) {
      errors.maxAmount = "Max amount must be a positive number.";
    }
    if (!errors.minAmount && !errors.maxAmount && minAmount > maxAmount) {
      errors.maxAmount = "Max amount must be greater than or equal to min amount.";
    }
    if (Number.isNaN(minTenure) || minTenure <= 0 || !Number.isInteger(minTenure)) {
      errors.minTenureMonths = "Min tenure must be a whole number of months.";
    }
    if (Number.isNaN(maxTenure) || maxTenure <= 0 || !Number.isInteger(maxTenure)) {
      errors.maxTenureMonths = "Max tenure must be a whole number of months.";
    }
    if (!errors.minTenureMonths && !errors.maxTenureMonths && minTenure > maxTenure) {
      errors.maxTenureMonths = "Max tenure must be greater than or equal to min tenure.";
    }
    if (Number.isNaN(minRate) || minRate < 0) {
      errors.minInterestRate = "Min interest rate must be a number.";
    }
    if (Number.isNaN(maxRate) || maxRate < 0) {
      errors.maxInterestRate = "Max interest rate must be a number.";
    }
    if (!errors.minInterestRate && !errors.maxInterestRate && minRate > maxRate) {
      errors.maxInterestRate = "Max rate must be greater than or equal to min rate.";
    }
    if (Number.isNaN(feePercent) || feePercent < 0 || feePercent > 100) {
      errors.processingFeePercent = "Processing fee must be between 0 and 100.";
    }

    if (Object.keys(errors).length > 0) {
      setProductFormErrors(errors);
      return false;
    }

    setProductFormErrors({});
    return true;
  };

  const handleSaveProduct = async () => {
    if (!validateProductForm()) {
      setActionError("Please fix the highlighted product fields.");
      return;
    }

    try {
      setIsCreatingProduct(true);
      setActionError("");
      setActionMessage("");

      if (editingProductId) {
        // Update existing product
        const response = await axios.patch(
          "/api/products/update-product",
          {
            productId: editingProductId,
            ...productFormData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const message = response.data?.message || "Product updated successfully.";
        setActionMessage(message);
      } else {
        // Create new product
        const response = await axios.post(
          "/api/products/add",
          productFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const message = response.data?.message || "Product created successfully.";
        setActionMessage(message);
      }

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
      setEditingProductId(null);
      setShowProductForm(false);
      await fetchAllProducts();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to save product."
        );
      } else {
        setActionError("Unable to save product.");
      }
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleUpdateProductStatus = async (
    productId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

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
        }
      );

      const message = response.data?.message || "Product status updated successfully.";
      setActionMessage(message);
      await fetchAllProducts();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        setActionError(
          typeof apiMessage === "string"
            ? apiMessage
            : "Unable to update product status."
        );
      } else {
        setActionError("Unable to update product status.");
      }
    }
  };

  const handleEditProduct = (product: Product) => {
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
    setEditingProductId(null);
    setShowProductForm(false);
  };

  useEffect(() => {
    // Reset to page 1 when search or filter changes
    setUserCurrentPage(1);
  }, [userSearchText, userStatusFilter]);

  useEffect(() => {
    // Reset to page 1 when team search changes
    setTeamCurrentPage(1);
  }, [teamSearchText]);

  useEffect(() => {
    // Reset to page 1 when product search or filter changes
    setProductCurrentPage(1);
  }, [productSearchText, productStatusFilter]);

  useEffect(() => {
    // Loads users only when the user management tab is open
    if (!token || !isAdmin || activeSection !== "users") return;

    fetchAllUsers();
  }, [token, isAdmin, activeSection, fetchAllUsers]);

  useEffect(() => {
    // Loads teams only when the team management tab is open
    if (!token || !isAdmin || activeSection !== "teams") return;

    fetchAllTeams();
  }, [token, isAdmin, activeSection, fetchAllTeams]);

  useEffect(() => {
    // Loads products only when the product management tab is open
    if (!token || !isAdmin || activeSection !== "products") return;

    fetchAllProducts();
  }, [token, isAdmin, activeSection, fetchAllProducts]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    // Stores the selected Excel file before upload
    const file = event.target.files?.[0] || null;

    setSelectedFile(file);
    setUploadResult(null);
    setUploadFormError("");
    setActionError("");
    setActionMessage("");
  };

  const handleExcelUpload = async () => {
    // Stops upload when no file is selected
    if (!selectedFile) {
      setUploadFormError("Please select an Excel file first.");
      return;
    }
    setUploadFormError("");

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

    if (userSearchText.trim()) {
      const keyword = userSearchText.trim().toLowerCase();

      result = result.filter((item) => {
        return (
          item.name.toLowerCase().includes(keyword) ||
          item.userEmail.toLowerCase().includes(keyword) ||
          item.roleType.toLowerCase().includes(keyword) ||
          (item.phone || "").toLowerCase().includes(keyword)
        );
      });
    }

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

  // Pagination for users
  const userTotalPages = Math.ceil(filteredUsers.length / userItemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (userCurrentPage - 1) * userItemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + userItemsPerPage);
  }, [filteredUsers, userCurrentPage, userItemsPerPage]);

  const filteredTeams = useMemo(() => {
    let result = [...teams];

    if (teamSearchText.trim()) {
      const keyword = teamSearchText.trim().toLowerCase();
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

  // Pagination for teams
  const teamTotalPages = Math.ceil(filteredTeams.length / teamItemsPerPage);
  const paginatedTeams = useMemo(() => {
    const startIndex = (teamCurrentPage - 1) * teamItemsPerPage;
    return filteredTeams.slice(startIndex, startIndex + teamItemsPerPage);
  }, [filteredTeams, teamCurrentPage, teamItemsPerPage]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (productSearchText.trim()) {
      const keyword = productSearchText.trim().toLowerCase();
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
      result = result.filter((item) => item.status.toLowerCase() === "inactive");
    }

    return result;
  }, [products, productSearchText, productStatusFilter]);

  // Pagination for products
  const productTotalPages = Math.ceil(filteredProducts.length / productItemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (productCurrentPage - 1) * productItemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productItemsPerPage);
  }, [filteredProducts, productCurrentPage, productItemsPerPage]);

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
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-4 pt-3 border-top border-secondary">
        <div className="small text-muted">
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> items
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(parseInt(e.target.value));
              onPageChange(1);
            }}
            className="form-select form-select-sm cp-admin-pagination-select"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-outline-secondary btn-sm"
            >
              Previous
            </button>

            <div className="px-3 py-2 rounded border border-primary text-primary small text-center">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-outline-secondary btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
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
            value={userSearchText}
            onChange={(event) => setUserSearchText(event.target.value)}
          />

          <select
            className="cp-admin-field cp-admin-select"
            value={userStatusFilter}
            onChange={(event) => setUserStatusFilter(event.target.value)}
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
    // Team summary values
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
          <div className="cp-admin-upload-result">
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
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
                                  teamUser.userId
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
              <div className="cp-admin-empty-state">No members in this team.</div>
            )}
          </div>
        ) : (
          <>
            <div className="cp-admin-upload-row">
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
              <div className="cp-admin-upload-result">
                <h3 className="cp-admin-section-subtitle">Add User to Team</h3>

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

                <div className="d-flex flex-wrap gap-3">
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
                    <tr>
                      <td colSpan={6}>
                        <div className="cp-admin-empty-state">Loading teams...</div>
                      </td>
                    </tr>
                  ) : filteredTeams.length > 0 ? (
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
    // Product summary values
    const totalProducts = products.length;
    const activeProducts = products.filter(
      (item) => item.status.toLowerCase() === "active"
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
                      0
                    ) / products.length
                  ).toFixed(2)
                : "0.00"}
              %
            </h3>
          </div>
        </div>

        <div className="cp-admin-upload-row">
          <input
            type="text"
            className="cp-admin-field"
            placeholder="Search by product name or code"
            value={productSearchText}
            onChange={(event) => setProductSearchText(event.target.value)}
          />

          <div className="d-flex flex-wrap gap-2 align-items-end">
            <select
              className="form-select form-select-sm cp-admin-pagination-select cp-admin-fixed-width"
              value={productStatusFilter}
              onChange={(event) => setProductStatusFilter(event.target.value)}
            >
              <option value="All">All Products</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <button
              type="button"
              className="btn btn-primary cp-loan-btn-next cp-admin-fixed-width"
              onClick={() => {
                setShowProductForm(true);
                setEditingProductId(null);
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
              }}
            >
              New Product
            </button>
          </div>
        </div>

        {showProductForm && (
          <div className="cp-admin-upload-result">
            <h3 className="cp-admin-section-subtitle">
              {editingProductId ? "Edit Product" : "Create New Product"}
            </h3>

            <div className="cp-admin-toolbar mb-3">
                <div className="d-grid gap-2">
                <input
                  type="text"
                  className={`cp-admin-field ${productFormErrors.productCode ? "cp-admin-field-invalid" : ""}`}
                  placeholder="Product Code (e.g., PERSONAL_LOAN)"
                  value={productFormData.productCode}
                  onChange={(e) =>
                    setProductFormData({
                      ...productFormData,
                      productCode: e.target.value,
                    })
                  }
                  disabled={!!editingProductId}
                />
                {productFormErrors.productCode && (
                  <p className="cp-admin-field-error">
                    {productFormErrors.productCode}
                  </p>
                )}
              </div>
              <div className="d-grid gap-2">
                <input
                  type="text"
                  className={`cp-admin-field ${productFormErrors.productName ? "cp-admin-field-invalid" : ""}`}
                  placeholder="Product Name"
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

<div className="cp-admin-toolbar mb-3">
              <div className="d-grid gap-2">
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.minAmount ? "cp-admin-field-invalid" : ""}`}
                  placeholder="Min Amount"
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
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.maxAmount ? "cp-admin-field-invalid" : ""}`}
                  placeholder="Max Amount"
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

            <div className="cp-admin-toolbar mb-3">
              <div className="d-grid gap-2">
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.minTenureMonths ? "cp-admin-field-invalid" : ""}`}
                  placeholder="Min Tenure (months)"
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
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.maxTenureMonths ? "cp-admin-field-invalid" : ""}`}
                  placeholder="Max Tenure (months)"
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

            <div className="cp-admin-toolbar mb-3">
              <div className="d-grid gap-2">
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.minInterestRate ? "cp-admin-field-invalid" : ""}`}
                  placeholder="Min Interest Rate (%)"
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
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.maxInterestRate ? "cp-admin-field-invalid" : ""}`}
                  placeholder="Max Interest Rate (%)"
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

            <div className="cp-admin-toolbar mb-3">
              <div className="d-grid gap-2">
                <input
                  type="number"
                  className={`cp-admin-field ${productFormErrors.processingFeePercent ? "cp-admin-field-invalid" : ""}`}
                  placeholder="Processing Fee Percent (%)"
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

            <div className="d-flex flex-wrap gap-3">
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
                <tr>
                  <td colSpan={8}>
                    <div className="cp-admin-empty-state">
                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length > 0 ? (
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
                              product.status
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
