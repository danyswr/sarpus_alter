import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Edit, Heart, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <MessageCircle className="text-primary-foreground text-xl" />
              </div>
              <h1 className="text-2xl font-bold text-dark">FeedbackU</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-primary font-medium">Beranda</a>
              <a href="#" className="text-gray-600 hover:text-primary font-medium">Postingan</a>
              <a href="#" className="text-gray-600 hover:text-primary font-medium">Tentang</a>
            </nav>
            <div className="flex space-x-3">
              <Link href="/login">
                <Button className="btn-secondary">Masuk</Button>
              </Link>
              <Link href="/register">
                <Button className="btn-primary">Daftar</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-black text-white mb-6">
            Platform Feedback Mahasiswa
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Suarakan keluh kesahmu, berbagi pengalaman, dan buat perubahan positif untuk komunitas mahasiswa yang lebih baik.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-white text-dark px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all">
                Mulai Sekarang
              </Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all">
                Lihat Postingan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center mb-12">Fitur Unggulan</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 card-shadow card-hover">
              <CardContent className="pt-6">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit className="text-primary text-2xl" />
                </div>
                <h4 className="text-xl font-bold mb-3">Buat Postingan</h4>
                <p className="text-gray-600">Bagikan keluh kesah dan saran dengan mudah, lengkap dengan gambar dan deskripsi.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 card-shadow card-hover">
              <CardContent className="pt-6">
                <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="text-secondary text-2xl" />
                </div>
                <h4 className="text-xl font-bold mb-3">Interaksi Sosial</h4>
                <p className="text-gray-600">Like, dislike, dan berikan dukungan pada postingan sesama mahasiswa.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 card-shadow card-hover">
              <CardContent className="pt-6">
                <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="text-accent text-2xl" />
                </div>
                <h4 className="text-xl font-bold mb-3">Dashboard Admin</h4>
                <p className="text-gray-600">Admin dapat memonitor postingan populer dan mengelola platform dengan mudah.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
