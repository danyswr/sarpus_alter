import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi } from "./api";

interface User {
  idUsers: string;
  username: string;
  email: string;
  role: string;
  nim?: string;
  jurusan?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  email: string;
  username: string;
  password: string;
  nim?: string;
  jurusan?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem("feedbacku_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem("feedbacku_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("API login attempt for:", email);
      const result = await authApi.login(email, password);
      console.log("API login result:", result);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.user) {
        throw new Error("Data login tidak lengkap dari server");
      }

      const userData: User = {
        idUsers: result.user.idUsers || result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
        nim: result.user.nim || "",
        jurusan: result.user.jurusan || ""
      };

      console.log("Setting user data:", userData);
      setUser(userData);
      localStorage.setItem("feedbacku_user", JSON.stringify(userData));
    } catch (error) {
      console.error("Auth login error:", error);
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const result = await authApi.register(userData);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.user) {
        throw new Error("Data registrasi tidak lengkap dari server");
      }

      const newUser: User = {
        idUsers: result.user.idUsers || result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
        nim: result.user.nim || "",
        jurusan: result.user.jurusan || ""
      };

      setUser(newUser);
      localStorage.setItem("feedbacku_user", JSON.stringify(newUser));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("feedbacku_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
