import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle } from "lucide-react";
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

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setError("");
      
      console.log("Attempting login with:", data.email);
      await login(data.email, data.password);
      console.log("Login successful, redirecting to dashboard");
      
      // Force redirect setelah login berhasil
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary p-3 rounded-lg inline-flex mb-3 mx-auto">
            <MessageCircle className="text-primary-foreground text-2xl" />
          </div>
          <CardTitle className="text-2xl font-bold">Masuk ke Akun</CardTitle>
          <p className="text-gray-600">Masukkan email dan password untuk melanjutkan</p>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@example.com"
                {...register("email")}
                className="mt-1"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                className="mt-1"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? "Sedang masuk..." : "Masuk"}
            </Button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link href="/register" className="text-secondary font-semibold hover:underline">
                Daftar sekarang
              </Link>
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 font-medium">Akun Demo (saat Google Apps Script belum di-setup):</p>
              <p className="text-xs text-blue-600">Admin: admin@admin.admin / admin123</p>
              <p className="text-xs text-blue-600">User: user@student.com / user123</p>
              <p className="text-xs text-gray-500 mt-1">Untuk setup lengkap, lihat file SETUP_LENGKAP.md</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
