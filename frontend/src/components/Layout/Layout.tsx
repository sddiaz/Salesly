import {
  BarChart3,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Sparkle,
  User,
  Users,
  X
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../firebase/AuthContext";
import { auth } from "../../firebase/config";
import { useConnectionStatus } from "../../hooks/useConnectionStatus";
import GeneralGrokModal from "../GeneralGrokModal/GeneralGrokModal";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isGrokModalOpen, setIsGrokModalOpen] = useState(false);
  const location = useLocation();
  const { isConnected, isChecking } = useConnectionStatus();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Leads", href: "/leads", icon: Users },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="logo">
            {!sidebarCollapsed && <span className="logo-grok">Salesly</span>}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <Icon size={18} />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator">
            <div
              className={`status-dot ${
                isConnected ? "connected" : "disconnected"
              }`}
            ></div>
            {!sidebarCollapsed && (
              <span className="status-text">
                <span
                  className={`tag ${
                    isConnected ? "status-qualified" : "status-lost"
                  }`}
                >
                  {isChecking
                    ? "[CHECKING...]"
                    : isConnected
                    ? "[CONNECTED]"
                    : "[DISCONNECTED]"}
                </span>
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`main-content ${
          sidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <header className="header">
          <div className="header-content">
            <div className="breadcrumb">
              <b>
                <span className="text-mono text-xs text-muted">
                  {location.pathname
                    .split("/")
                    .filter(Boolean)
                    .join(" / ")
                    .toUpperCase() || "DASHBOARD"}
                </span>
              </b>
            </div>
            <div className="header-actions">
              <button
                className="btn btn-sm"
                onClick={() => setIsGrokModalOpen(true)}
              >
                <Sparkle color="orange" size={14} />
                Ask Salesly
              </button>
              <UserProfileDropdown />
            </div>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>

      {/* General Grok Modal */}
      <GeneralGrokModal
        isOpen={isGrokModalOpen}
        onClose={() => setIsGrokModalOpen(false)}
      />
    </div>
  );
};

// User Profile Dropdown Component
const UserProfileDropdown: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const { currentUser, signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keep Firebase user updated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      setImageLoadError(false); // Reset image error when user changes
    });

    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Get the actual photo URL from Firebase auth user directly
  const getActualPhotoURL = () => {
    // Use Firebase auth.currentUser for the most up-to-date photoURL
    const authUser = firebaseUser || auth.currentUser;
    if (!authUser) return null;

    // First, check if we have provider data with Google (most reliable)
    const googleProvider = authUser.providerData?.find(
      (provider) => provider.providerId === "google.com"
    );

    if (googleProvider?.photoURL) {
      // Use the provider's photo URL (more reliable)
      let photoURL = googleProvider.photoURL;

      // For Gmail photos, ensure we get a properly sized version
      if (photoURL.includes("googleusercontent.com")) {
        const baseUrl = photoURL.split("=")[0];
        return `${baseUrl}=s96-c`; // s96 = 96px size, c = crop to square
      }

      return photoURL;
    }

    // Fallback to regular photoURL from Firebase auth user
    if (authUser.photoURL) {
      if (authUser.photoURL.includes("googleusercontent.com")) {
        const baseUrl = authUser.photoURL.split("=")[0];
        return `${baseUrl}=s96-c`;
      }
      return authUser.photoURL;
    }

    return null;
  };

  const processedPhotoURL = getActualPhotoURL();

  // Debug: Log the photoURL to console
  const authUser = firebaseUser || auth.currentUser;
  console.log("Firebase auth user:", authUser);
  console.log("Auth user photoURL:", authUser?.photoURL);
  console.log("Auth user provider data:", authUser?.providerData);
  console.log("Context user photoURL:", currentUser?.photoURL);
  console.log("Processed photoURL:", processedPhotoURL);

  return (
    <div className="user-profile-dropdown" ref={dropdownRef}>
      <button
        className="user-profile-trigger"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-label="User profile menu"
      >
        {processedPhotoURL && !imageLoadError ? (
          <img
            src={processedPhotoURL}
            alt="User avatar"
            className="user-avatar-image"
            onError={(e) => {
              console.error("Failed to load profile image:", e);
              console.error("Image src was:", processedPhotoURL);
              setImageLoadError(true);
            }}
            onLoad={() => console.log("Profile image loaded successfully")}
          />
        ) : (
          <User className="user-avatar-icon" />
        )}
        <ChevronDown
          className={`dropdown-chevron ${isDropdownOpen ? "open" : ""}`}
        />
      </button>

      {isDropdownOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            <div className="user-info">
              {processedPhotoURL && !imageLoadError ? (
                <img
                  src={processedPhotoURL}
                  alt="User avatar"
                  className="dropdown-avatar-image"
                  onError={(e) => {
                    console.error("Failed to load dropdown profile image:", e);
                    setImageLoadError(true);
                  }}
                />
              ) : (
                <User className="dropdown-avatar-icon" />
              )}
              <div className="user-details">
                <div className="user-name">
                  {currentUser?.displayName || "User"}
                </div>
                <div className="user-email">{currentUser?.email}</div>
              </div>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <button
            className="dropdown-item sign-out-item"
            onClick={handleSignOut}
          >
            <LogOut className="dropdown-item-icon" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default Layout;
