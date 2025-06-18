import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Search, 
  User, 
  BarChart3, 
  Settings, 
  MessageCircle,
  LogOut,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onCreatePost?: () => void;
}

export function Sidebar({ isOpen, onCreatePost }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Beranda", href: "/dashboard", icon: Home },
    { name: "Jelajahi", href: "/explore", icon: Search },
    { name: "Profil", href: "/profile", icon: User },
    ...(user?.role === "admin" ? [{ name: "Admin", href: "/admin", icon: BarChart3 }] : []),
    { name: "Pengaturan", href: "/settings", icon: Settings },
  ];

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0 md:static md:inset-0"
      )}
    >
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-primary p-2 rounded-lg">
            <MessageCircle className="text-primary-foreground text-xl" />
          </div>
          <h1 className="text-xl font-bold text-dark">FeedbackU</h1>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Create Post Button */}
        {onCreatePost && (
          <Button
            onClick={onCreatePost}
            className="btn-primary w-full py-3 rounded-xl mt-6 font-bold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Buat Postingan
          </Button>
        )}
      </div>

      {/* User Info at Bottom */}
      {user && (
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.username ? user.username.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.username || user.email || 'User'}</p>
              <p className="text-gray-500 text-xs truncate">{user.email}</p>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
