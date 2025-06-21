"use client";

import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Home,
  Search,
  User,
  BarChart3,
  LogOut,
  Plus,
  X,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface SidebarProps {
  isOpen: boolean;
  onCreatePost?: () => void;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onCreatePost, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    {
      name: "BERANDA",
      href: "/dashboard",
      icon: Home,
      badge: null,
    },
    {
      name: "JELAJAHI",
      href: "/explore",
      icon: Search,
      badge: "Hot",
    },
    {
      name: "PROFIL",
      href: "/profile",
      icon: User,
      badge: null,
    },
    ...(user?.role === "admin"
      ? [
          {
            name: "ADMIN",
            href: "/admin",
            icon: BarChart3,
            badge: "3",
          },
        ]
      : []),
  ];

  // Auto-collapse behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen bg-gray-100 z-50 transition-all duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-20" : "w-80 lg:w-80",
          "shadow-[4px_0px_0px_0px_rgba(0,0,0,1)]",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-cyan-400 border-b-4 border-black flex-shrink-0">
            <div
              className={cn(
                "flex items-center",
                isCollapsed ? "justify-center p-4" : "justify-between p-6",
              )}
            >
              {/* Logo */}
              <Link href="/" onClick={handleNavClick}>
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <div className="bg-white p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group-hover:scale-105">
                    <Trophy className="text-black text-2xl" />
                  </div>
                  {!isCollapsed && (
                    <div>
                      <h1 className="text-2xl font-black text-black">SARPUS</h1>
                      <p className="text-sm text-black font-bold -mt-1">
                        PLATFORM
                      </p>
                    </div>
                  )}
                </div>
              </Link>

              {/* Collapse Button - Only show when expanded */}
              {!isCollapsed && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex bg-white border-4 border-black rounded-2xl p-3 hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                    title="Collapse Sidebar"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  {/* Close Button - Mobile Only */}
                  {onClose && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                      className="lg:hidden bg-white border-4 border-black rounded-2xl p-3 hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <X className="h-5 w-5 text-black" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Expand Button - Show when collapsed */}
            {isCollapsed && (
              <div className="px-4 pb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(false)}
                  className="w-full bg-white border-4 border-black rounded-2xl p-3 hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                  title="Expand Sidebar"
                >
                  <ChevronLeft className="h-5 w-5 rotate-180" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto bg-gray-100">
            <div className={cn("p-4", isCollapsed ? "px-2" : "p-6")}>
              <nav
                className={cn(
                  "space-y-3",
                  isCollapsed ? "space-y-4" : "space-y-4",
                )}
              >
                {navigation.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;

                  return (
                    <Link key={item.name} href={item.href}>
                      <div
                        onClick={handleNavClick}
                        className={cn(
                          "relative flex items-center font-bold transition-all duration-300 cursor-pointer group border-4 border-black",
                          isActive
                            ? "bg-white text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] scale-[1.02]"
                            : "bg-white text-black hover:bg-gray-50 hover:scale-[1.02] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]",
                          isCollapsed
                            ? "justify-center p-4 rounded-2xl w-12 h-12 mx-auto"
                            : "space-x-4 px-6 py-4 rounded-2xl",
                        )}
                      >
                        <Icon
                          className={cn(
                            "transition-all duration-300 flex-shrink-0",
                            isCollapsed ? "w-5 h-5" : "w-6 h-6",
                            "text-black group-hover:scale-110",
                          )}
                        />

                        {!isCollapsed && (
                          <>
                            <span className="font-black text-lg tracking-wide flex-1 uppercase">
                              {item.name}
                            </span>

                            {/* Badge */}
                            {item.badge && (
                              <Badge
                                className={cn(
                                  "text-sm font-black border-2 border-black px-3 py-1 flex-shrink-0 rounded-full",
                                  item.badge === "Hot"
                                    ? "bg-red-400 text-black"
                                    : item.badge === "3"
                                      ? "bg-green-400 text-black"
                                      : "bg-yellow-400 text-black",
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-sm rounded-xl shadow-lg z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold">
                            {item.name}
                            {item.badge && (
                              <span
                                className={cn(
                                  "ml-2 px-2 py-0.5 rounded-full text-xs",
                                  item.badge === "Hot"
                                    ? "bg-red-400 text-black"
                                    : item.badge === "3"
                                      ? "bg-green-400 text-black"
                                      : "bg-yellow-400 text-black",
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-3 h-3 bg-black rotate-45" />
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Create Post Button */}
              {onCreatePost && (
                <div className={cn("mt-6", isCollapsed ? "mt-8" : "mt-8")}>
                  <Button
                    onClick={() => {
                      onCreatePost();
                      handleNavClick();
                    }}
                    className={cn(
                      "bg-yellow-400 text-black font-black hover:bg-yellow-500 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 flex items-center justify-center group rounded-2xl",
                      isCollapsed
                        ? "w-12 h-12 p-0 mx-auto"
                        : "w-full py-4 space-x-3",
                    )}
                  >
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    {!isCollapsed && (
                      <span className="text-lg uppercase tracking-wide">
                        Buat Post
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* User Section */}
          {user && (
            <div
              className={cn(
                "border-t-4 border-black bg-gray-200 flex-shrink-0",
                isCollapsed ? "p-4" : "p-6",
              )}
            >
              <div
                className={cn(
                  "flex items-center",
                  isCollapsed ? "flex-col space-y-4" : "space-x-4 mb-6",
                )}
              >
                <div className="relative">
                  <div
                    className={cn(
                      "bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-110 transition-all duration-300",
                      isCollapsed ? "w-12 h-12" : "w-14 h-14",
                    )}
                  >
                    <span
                      className={cn(
                        "text-white font-black",
                        isCollapsed ? "text-lg" : "text-xl",
                      )}
                    >
                      {user.username
                        ? user.username.charAt(0).toUpperCase()
                        : user.email
                          ? user.email.charAt(0).toUpperCase()
                          : "U"}
                    </span>
                  </div>
                  {/* Online indicator */}
                  <div
                    className={cn(
                      "absolute bg-green-400 rounded-full border-2 border-black animate-pulse",
                      isCollapsed
                        ? "-bottom-0.5 -right-0.5 w-3 h-3"
                        : "-bottom-1 -right-1 w-4 h-4",
                    )}
                  />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-lg text-black truncate">
                      {user.username || "User"}
                    </p>
                    <p className="text-black text-sm truncate font-bold">
                      {user.email}
                    </p>
                    {user.role === "admin" && (
                      <Badge className="bg-red-400 text-black border-2 border-black text-xs font-black mt-2 rounded-full">
                        Admin
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={cn(
                  "border-4 border-black text-black bg-white hover:bg-red-100 hover:text-red-600 transition-all duration-300 flex items-center justify-center group font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-105 rounded-2xl",
                  isCollapsed
                    ? "w-12 h-12 p-0 mx-auto"
                    : "w-full py-4 space-x-3",
                )}
              >
                {isLoggingOut ? (
                  <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    {!isCollapsed && (
                      <span className="text-lg uppercase tracking-wide">
                        Keluar
                      </span>
                    )}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
