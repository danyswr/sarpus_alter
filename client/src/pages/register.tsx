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
  User,
  GraduationCap,
  BookOpen,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  MessageSquare,
  Award,
  Shield,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  username: z.string().min(2, "Username minimal 2 karakter"),
  nim: z.string().min(8, "NIM minimal 8 karakter"),
  jurusan: z.string().min(1, "Jurusan wajib dipilih"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const watchedFields = watch();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const benefits = [
    {
      icon: Users,
      title: "Komunitas Aktif",
      description: "Bergabung dengan 10,000+ mahasiswa dari seluruh Indonesia",
      color: "bg-yellow-400",
    },
    {
      icon: MessageSquare,
      title: "Suara Didengar",
      description:
        "Platform untuk menyuarakan aspirasi dan keluh kesah mahasiswa",
      color: "bg-green-400",
    },
    {
      icon: Award,
      title: "Sistem Reward",
      description: "Dapatkan poin dan badge untuk setiap kontribusi positif",
      color: "bg-purple-400",
    },
    {
      icon: Shield,
      title: "Aman & Terpercaya",
      description: "Data pribadi dilindungi dengan enkripsi tingkat enterprise",
      color: "bg-pink-400",
    },
  ];

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setError("");

      await registerUser(data);
      setLocation("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat registrasi",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStepProgress = () => {
    let completedFields = 0;
    if (watchedFields.email) completedFields++;
    if (watchedFields.username) completedFields++;
    if (watchedFields.nim) completedFields++;
    if (watchedFields.jurusan) completedFields++;
    if (watchedFields.password) completedFields++;
    return (completedFields / 5) * 100;
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
            <Link href="/login">
              <Button className="border-4 border-black text-black bg-white px-6 py-3 rounded-2xl font-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                MASUK
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div
            className={`text-center mb-12 transform transition-all duration-1000 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="inline-flex items-center space-x-3 bg-cyan-400 text-black px-6 py-3 rounded-full mb-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Star className="w-5 h-5" />
              <span className="font-black text-lg uppercase tracking-wide">
                JOIN COMMUNITY
              </span>
            </div>
            <h2 className="text-7xl font-black text-black mb-4 leading-tight">
              BERGABUNG DENGAN
            </h2>
            <h2 className="text-7xl font-black text-yellow-400 mb-8 leading-tight stroke-text">
              SARPUS
            </h2>
            <div className="w-32 h-2 bg-pink-400 mx-auto mb-8 rounded-full border-2 border-black"></div>
            <p className="text-2xl text-black max-w-4xl mx-auto leading-relaxed font-bold">
              Bergabunglah dengan{" "}
              <span className="bg-cyan-400 text-black px-3 py-2 rounded-xl border-4 border-black font-black">
                REVOLUSI DIGITAL
              </span>{" "}
              dalam dunia pendidikan dan raih{" "}
              <span className="bg-pink-400 text-black px-3 py-2 rounded-xl border-4 border-black font-black">
                PRESTASI TERBAIK
              </span>
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Side - Benefits */}
            <div
              className={`transform transition-all duration-1000 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-10 opacity-0"
              }`}
              style={{ transitionDelay: "300ms" }}
            >
              <h3 className="text-4xl font-black text-black mb-8">
                MENGAPA BERGABUNG DENGAN SARPUS?
              </h3>

              <div className="space-y-6 mb-8">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className={`${benefit.color} p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="bg-white p-3 rounded-xl border-2 border-black">
                        <benefit.icon className="w-8 h-8 text-black" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-black text-black mb-3 uppercase">
                          {benefit.title}
                        </h4>
                        <p className="text-black font-bold leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-cyan-400 p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                  <div className="text-4xl font-black text-black mb-2">
                    10K+
                  </div>
                  <div className="text-lg text-black font-bold uppercase">
                    Mahasiswa Aktif
                  </div>
                </div>
                <div className="bg-green-400 p-6 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
                  <div className="text-4xl font-black text-black mb-2">98%</div>
                  <div className="text-lg text-black font-bold uppercase">
                    Kepuasan User
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Register Form */}
            <div
              className={`transform transition-all duration-1000 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-10 opacity-0"
              }`}
              style={{ transitionDelay: "600ms" }}
            >
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="bg-yellow-400 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-black text-black uppercase">
                      Progress Pendaftaran
                    </span>
                    <span className="text-lg font-black text-black">
                      {Math.round(getStepProgress())}%
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3 border-2 border-black">
                    <div
                      className="bg-black h-full rounded-full transition-all duration-500"
                      style={{ width: `${getStepProgress()}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Register Card */}
              <Card className="border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white rounded-2xl">
                <CardContent className="p-10">
                  <div className="text-center mb-10">
                    <div className="bg-yellow-400 p-6 rounded-2xl inline-flex mb-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <GraduationCap className="text-black text-4xl" />
                    </div>
                    <h3 className="text-4xl font-black text-black mb-4">
                      DAFTAR AKUN BARU
                    </h3>
                    <p className="text-black font-bold text-lg">
                      Buat akun untuk bergabung dengan komunitas mahasiswa
                    </p>
                  </div>

                  {error && (
                    <Alert className="mb-8 border-4 border-red-500 bg-red-100 rounded-xl">
                      <AlertDescription className="text-red-700 font-bold text-lg">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Email Field */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="email"
                        className="text-lg font-black text-black flex items-center space-x-2"
                      >
                        <Mail className="w-5 h-5 text-cyan-500" />
                        <span>EMAIL KAMPUS</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="nama@student.university.ac.id"
                          {...register("email")}
                          className="pl-14 py-4 border-4 border-black rounded-xl focus:border-cyan-400 text-lg font-bold"
                        />
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                        {watchedFields.email && !errors.email && (
                          <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-green-500" />
                        )}
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-lg font-bold">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Username Field */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="username"
                        className="text-lg font-black text-black flex items-center space-x-2"
                      >
                        <User className="w-5 h-5 text-purple-500" />
                        <span>USERNAME</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="username"
                          type="text"
                          placeholder="Username unik Anda"
                          {...register("username")}
                          className="pl-14 py-4 border-4 border-black rounded-xl focus:border-purple-400 text-lg font-bold"
                        />
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                        {watchedFields.username && !errors.username && (
                          <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-green-500" />
                        )}
                      </div>
                      {errors.username && (
                        <p className="text-red-500 text-lg font-bold">
                          {errors.username.message}
                        </p>
                      )}
                    </div>

                    {/* NIM Field */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="nim"
                        className="text-lg font-black text-black flex items-center space-x-2"
                      >
                        <GraduationCap className="w-5 h-5 text-blue-500" />
                        <span>NIM</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="nim"
                          type="text"
                          placeholder="Nomor Induk Mahasiswa"
                          {...register("nim")}
                          className="pl-14 py-4 border-4 border-black rounded-xl focus:border-blue-400 text-lg font-bold"
                        />
                        <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                        {watchedFields.nim && !errors.nim && (
                          <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-green-500" />
                        )}
                      </div>
                      {errors.nim && (
                        <p className="text-red-500 text-lg font-bold">
                          {errors.nim.message}
                        </p>
                      )}
                    </div>

                    {/* Jurusan Field */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="jurusan"
                        className="text-lg font-black text-black flex items-center space-x-2"
                      >
                        <BookOpen className="w-5 h-5 text-green-500" />
                        <span>JURUSAN</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="jurusan"
                          type="text"
                          placeholder="Contoh: Teknik Informatika, Manajemen, Kedokteran"
                          {...register("jurusan")}
                          className="pl-14 py-4 border-4 border-black rounded-xl focus:border-green-400 text-lg font-bold"
                        />
                        <BookOpen className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                        {watchedFields.jurusan && !errors.jurusan && (
                          <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-green-500" />
                        )}
                      </div>
                      {errors.jurusan && (
                        <p className="text-red-500 text-lg font-bold">
                          {errors.jurusan.message}
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
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
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
                      {watchedFields.password &&
                        watchedFields.password.length >= 6 && (
                          <p className="text-green-500 text-lg font-bold flex items-center space-x-2">
                            <CheckCircle className="w-5 h-5" />
                            <span>PASSWORD KUAT!</span>
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
                          <span>SEDANG MENDAFTAR...</span>
                        </>
                      ) : (
                        <>
                          <span>DAFTAR SEKARANG</span>
                          <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Login Link */}
                  <div className="text-center mt-8 pt-8 border-t-4 border-black">
                    <p className="text-lg text-black font-bold">
                      Sudah punya akun?{" "}
                      <Link
                        href="/login"
                        className="text-yellow-600 font-black hover:text-yellow-700 hover:underline text-xl"
                      >
                        MASUK DI SINI
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stroke-text {
          -webkit-text-stroke: 4px black;
          text-stroke: 4px black;
        }
      `}</style>
    </div>
  );
}
