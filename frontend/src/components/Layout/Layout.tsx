import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Users,
  MessageSquare,
  Settings,
  Menu,
  X,
  Home,
  Zap,
} from "lucide-react";
import GeneralGrokModal from "../GeneralGrokModal/GeneralGrokModal";
import { useConnectionStatus } from "../../hooks/useConnectionStatus";
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
            <Zap className="logo-icon" />
            {!sidebarCollapsed && (
              <span className="logo-text">
                <span className="logo-grok">GROK</span>
                <span className="logo-sdr">SDR</span>
              </span>
            )}
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
              <span className="text-mono text-xs text-muted">
                {location.pathname
                  .split("/")
                  .filter(Boolean)
                  .join(" / ")
                  .toUpperCase() || "DASHBOARD"}
              </span>
            </div>
            <div className="header-actions">
              <button
                className="btn btn-sm"
                onClick={() => setIsGrokModalOpen(true)}
              >
                <Zap color="orange" size={14} />
                ASK GROK
              </button>
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

export default Layout;
