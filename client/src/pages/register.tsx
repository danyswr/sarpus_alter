import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus } from "lucide-react";
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
  const [selectedJurusan, setSelectedJurusan] = useState("");

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const jurusanOptions = [
    "Teknik Informatika",
    "Sistem Informasi", 
    "Teknik Elektro",
    "Teknik Sipil",
    "Manajemen",
    "Akuntansi",
    "Hukum",
    "Kedokteran"
  ];

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsLoading(true);
      setError("");
      
      await registerUser(data);
      setLocation("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat registrasi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary p-3 rounded-lg inline-flex mb-3 mx-auto">
            <UserPlus className="text-primary-foreground text-2xl" />
          </div>
          <CardTitle className="text-2xl font-bold">Daftar Akun Baru</CardTitle>
          <p className="text-gray-600">Buat akun untuk bergabung dengan komunitas</p>
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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                {...register("username")}
                className="mt-1"
              />
              {errors.username && (
                <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="nim">NIM</Label>
              <Input
                id="nim"
                type="text"
                placeholder="Nomor Induk Mahasiswa"
                {...register("nim")}
                className="mt-1"
              />
              {errors.nim && (
                <p className="text-red-500 text-sm mt-1">{errors.nim.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="jurusan">Jurusan</Label>
              <Select 
                value={selectedJurusan} 
                onValueChange={(value) => {
                  setSelectedJurusan(value);
                  setValue("jurusan", value);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Jurusan" />
                </SelectTrigger>
                <SelectContent>
                  {jurusanOptions.map((jurusan) => (
                    <SelectItem key={jurusan} value={jurusan}>
                      {jurusan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.jurusan && (
                <p className="text-red-500 text-sm mt-1">{errors.jurusan.message}</p>
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
              {isLoading ? "Sedang mendaftar..." : "Daftar Sekarang"}
            </Button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-secondary font-semibold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
