import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MessageCircle, Menu, Plus } from "lucide-react";

interface NavbarProps {
  onCreatePost?: () => void;
  onToggleSidebar?: () => void;
}

export function Navbar({ onCreatePost, onToggleSidebar }: NavbarProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Mobile menu button */}
          <div className="flex items-center space-x-3">
            {onToggleSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <MessageCircle className="text-primary-foreground text-xl" />
              </div>
              <h1 className="text-2xl font-bold text-dark hidden sm:block">FeedbackU</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-primary font-medium">
              Beranda
            </Link>
            <Link href="/explore" className="text-gray-600 hover:text-primary font-medium">
              Jelajahi
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-primary font-medium">
              Tentang
            </Link>
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {onCreatePost && (
                  <Button
                    onClick={onCreatePost}
                    className="btn-primary"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Buat Post</span>
                  </Button>
                )}
                <Link href="/profile">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button className="btn-secondary" size="sm">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="btn-primary" size="sm">
                    Daftar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
