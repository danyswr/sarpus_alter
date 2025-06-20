import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { authApi, type User } from "./api";
import { wsClient } from "./websocket";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
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
        const userData = JSON.parse(savedUser);
        // Only set the user data, not the token
        setUser({
          idUsers: userData.idUsers,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          nim: userData.nim,
          jurusan: userData.jurusan
        });
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        localStorage.removeItem("feedbacku_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
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
        idUsers: result.user.idUsers,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
        nim: result.user.nim || "",
        jurusan: result.user.jurusan || ""
      };

      console.log("Setting user data:", userData);
      setUser(userData);
      
      // Store user data and token separately
      localStorage.setItem("feedbacku_user", JSON.stringify({
        ...userData,
        token: result.token
      }));
      
      // Authenticate WebSocket connection for real-time features
      if (result.token) {
        wsClient.authenticate(result.token);
      }
      
      return userData;
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
        idUsers: result.user.idUsers,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
        nim: result.user.nim || "",
        jurusan: result.user.jurusan || ""
      };

      setUser(newUser);
      localStorage.setItem("feedbacku_user", JSON.stringify({
        ...newUser,
        token: result.token
      }));
      
      // Authenticate WebSocket connection for real-time features
      if (result.token) {
        wsClient.authenticate(result.token);
      }
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
    console.error("AuthContext is undefined. Check if AuthProvider is properly wrapping the component tree.");
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
