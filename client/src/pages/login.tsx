"use client";

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Trophy,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Users,
  MessageSquare,
  Globe,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setError("");

      console.log("Attempting login with:", data.email);
      const userData = await login(data.email, data.password);
      console.log("Login successful, checking role for redirect");

      if (
        userData.role &&
        (typeof userData.role === "string"
          ? userData.role.toLowerCase()
          : userData.role) === "admin"
      ) {
        console.log("Redirecting admin to admin panel");
        window.location.href = "/admin";
      } else {
        console.log("Redirecting user to dashboard");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat login",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b-4 border-black relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/">
              <div className="flex items-center space-x-4 group cursor-pointer">
                <div className="bg-cyan-400 p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 group-hover:scale-105">
                  <Trophy className="text-black text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-black">SARPUS</h1>
                  <p className="text-sm text-gray-600 font-bold">
                    PLATFORM MAHASISWA
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/register">
              <Button className="bg-yellow-400 text-black px-6 py-3 rounded-2xl font-black hover:bg-yellow-500 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                DAFTAR
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Welcome Content */}
          <div
            className={`transform transition-all duration-1000 ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-10 opacity-0"
            }`}
          >
            <div className="inline-flex items-center space-x-3 bg-cyan-400 text-black px-6 py-3 rounded-full mb-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Sparkles className="w-5 h-5" />
              <span className="font-black text-lg uppercase tracking-wide">
                WELCOME BACK
              </span>
            </div>

            <h2 className="text-7xl font-black text-black mb-4 leading-tight">
              MASUK KE
            </h2>
            <h2 className="text-7xl font-black text-yellow-400 mb-8 leading-tight stroke-text">
              SARPUS
            </h2>
            <div className="w-32 h-2 bg-pink-400 mb-8 rounded-full border-2 border-black"></div>

            <p className="text-2xl text-black mb-12 leading-relaxed font-bold">
              Bergabunglah kembali dengan{" "}
              <span className="bg-cyan-400 text-black px-3 py-2 rounded-xl border-4 border-black font-black">
                KOMUNITAS MAHASISWA
              </span>{" "}
              terbesar Indonesia dan lanjutkan perjalanan Anda dalam menyuarakan
              aspirasi.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-yellow-400 p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 text-center">
                <Users className="w-8 h-8 text-black mb-3 mx-auto" />
                <div className="text-3xl font-black text-black">10K+</div>
                <div className="text-sm text-black font-bold uppercase">
                  Mahasiswa
                </div>
              </div>
              <div className="bg-green-400 p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 text-center">
                <MessageSquare className="w-8 h-8 text-black mb-3 mx-auto" />
                <div className="text-3xl font-black text-black">25K+</div>
                <div className="text-sm text-black font-bold uppercase">
                  Postingan
                </div>
              </div>
              <div className="bg-pink-400 p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 text-center">
                <Globe className="w-8 h-8 text-black mb-3 mx-auto" />
                <div className="text-3xl font-black text-black">50+</div>
                <div className="text-sm text-black font-bold uppercase">
                  Universitas
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div
            className={`transform transition-all duration-1000 ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "translate-x-10 opacity-0"
            }`}
            style={{ transitionDelay: "300ms" }}
          >
            <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
              <CardContent className="p-10">
                <div className="text-center mb-10">
                  <div className="bg-yellow-400 p-6 rounded-2xl inline-flex mb-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Trophy className="text-black text-4xl" />
                  </div>
                  <h3 className="text-4xl font-black text-black mb-4">
                    MASUK KE AKUN
                  </h3>
                  <p className="text-black font-bold text-lg">
                    Masukkan email dan password untuk melanjutkan
                  </p>
                </div>

                {error && (
                  <Alert className="mb-8 border-4 border-red-500 bg-red-100 rounded-xl">
                    <AlertDescription className="text-red-700 font-bold text-lg">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Email Field */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="email"
                      className="text-lg font-black text-black flex items-center space-x-2"
                    >
                      <Mail className="w-5 h-5 text-cyan-500" />
                      <span>EMAIL</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="nama@example.com"
                        {...register("email")}
                        className="pl-14 py-4 border-4 border-black rounded-xl focus:border-cyan-400 text-lg font-bold"
                      />
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-lg font-bold">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="password"
                      className="text-lg font-black text-black flex items-center space-x-2"
                    >
                      <Lock className="w-5 h-5 text-pink-500" />
                      <span>PASSWORD</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        placeholder="Password Anda"
                        type={showPassword ? "text" : "password"}
                        {...register("password")}
                        className="pl-14 pr-14 py-4 border-4 border-black rounded-xl focus:border-pink-400 text-lg font-bold"
                      />
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        {showPassword ? (
                          <EyeOff className="w-6 h-6" />
                        ) : (
                          <Eye className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-lg font-bold">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-yellow-400 text-black py-6 rounded-2xl font-black text-xl hover:bg-yellow-500 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-3 group"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                        <span>SEDANG MASUK...</span>
                      </>
                    ) : (
                      <>
                        <span>MASUK</span>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Register Link */}
                <div className="text-center mt-8 pt-8 border-t-4 border-black">
                  <p className="text-lg text-black font-bold">
                    Belum punya akun?{" "}
                    <Link
                      href="/register"
                      className="text-yellow-600 font-black hover:text-yellow-700 hover:underline text-xl"
                    >
                      DAFTAR SEKARANG
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style>{`
        .stroke-text {
          -webkit-text-stroke: 4px black;
          text-stroke: 4px black;
        }
      `}</style>
    </div>
  );
}
