"use client";

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Menu,
  X,
  Plus,
  Home,
  Search,
  Info,
  User,
  LogOut,
  Settings,
  Bell,
  ChevronDown,
} from "lucide-react";
import { RealTimeNotifications } from "@/components/RealTimeNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onCreatePost?: () => void;
  onToggleSidebar?: () => void;
}

export function Navbar({ onCreatePost, onToggleSidebar }: NavbarProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show/hide navbar based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      // Add background blur when scrolled
      setScrolled(currentScrollY > 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navigationItems = [
    { href: "/", label: "BERANDA", icon: Home },
    { href: "/explore", label: "JELAJAHI", icon: Search },
    { href: "/about", label: "TENTANG", icon: Info },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"} ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
          : "bg-white shadow-sm border-b border-gray-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left Side - Logo + Desktop Navigation */}
          <div className="flex items-center space-x-8">
            {/* Mobile Sidebar Toggle (only for dashboard pages) */}
            {onToggleSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </Button>
            )}

            {/* Logo */}
            <Link href="/">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="bg-yellow-400 p-2.5 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
                  <Trophy className="text-black text-xl" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-black group-hover:text-gray-700 transition-colors duration-300">
                    SARPUS
                  </h1>
                  <p className="text-xs text-gray-600 -mt-1 font-medium">
                    NEXT-GEN PLATFORM
                  </p>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation - Horizontal */}
            <nav className="hidden lg:flex space-x-8">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className="group flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300">
                    <item.icon className="w-4 h-4 text-gray-500 group-hover:text-yellow-600 transition-colors duration-300" />
                    <span className="text-gray-700 hover:text-black font-bold text-sm uppercase tracking-wide transition-all duration-300 relative">
                      {item.label}
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Notifications - Desktop Only */}
                <div className="hidden sm:block">
                  <RealTimeNotifications />
                </div>

                {/* Create Post Button */}
                {onCreatePost && (
                  <Button
                    onClick={onCreatePost}
                    className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold rounded-full px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Buat Post</span>
                  </Button>
                )}

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-2 hover:bg-gray-100 rounded-full p-2 transition-all duration-300"
                    >
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">
                          {user.username
                            ? user.username.charAt(0).toUpperCase()
                            : user.email
                              ? user.email.charAt(0).toUpperCase()
                              : "U"}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 mt-2 bg-white border border-gray-200 shadow-xl rounded-xl"
                  >
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.username || user.email}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <User className="h-4 w-4 text-gray-500" />
                        <span>Profil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span>Pengaturan</span>
                      </Link>
                    </DropdownMenuItem>
                    <div className="sm:hidden">
                      <DropdownMenuItem className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <Bell className="h-4 w-4 text-gray-500" />
                        <span>Notifikasi</span>
                      </DropdownMenuItem>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-3 py-2 hover:bg-red-50 cursor-pointer text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Keluar</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-full font-bold hover:border-gray-400 hover:shadow-md transition-all duration-300"
                    size="sm"
                  >
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    className="bg-yellow-400 text-black px-4 py-2 rounded-full font-bold hover:bg-yellow-500 hover:shadow-lg transition-all duration-300 hover:scale-105"
                    size="sm"
                  >
                    Daftar
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 animate-slide-down">
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                      {item.label}
                    </span>
                  </div>
                </Link>
              ))}

              {/* Mobile-only items */}
              {user && (
                <>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <Link href="/profile">
                      <div
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                          PROFIL
                        </span>
                      </div>
                    </Link>
                    <Link href="/settings">
                      <div
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-700 font-bold text-sm uppercase tracking-wide">
                          PENGATURAN
                        </span>
                      </div>
                    </Link>
                    <div className="px-4 py-3">
                      <RealTimeNotifications />
                    </div>
                    <div
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-lg transition-all duration-300 cursor-pointer text-red-600"
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-bold text-sm uppercase tracking-wide">
                        KELUAR
                      </span>
                    </div>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </header>
  );
}
