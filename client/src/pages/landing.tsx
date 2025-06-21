"use client";

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Trophy,
  Edit,
  Heart,
  BarChart3,
  Play,
  Users,
  MessageSquare,
  ArrowRight,
  Globe,
  Shield,
  Menu,
  X,
  Star,
  Quote,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Sparkles,
  ArrowUp,
  Target,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Landing() {
  const [isVisible, setIsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [counters, setCounters] = useState({
    users: 0,
    posts: 0,
    universities: 0,
    satisfaction: 0,
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setIsVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll effects
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / maxScroll) * 100;
      setScrollProgress(progress);
      setShowScrollTop(scrolled > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => {
      clearInterval(testimonialInterval);
    };
  }, []);

  // Animated counters
  useEffect(() => {
    if (isVisible) {
      const targets = {
        users: 10000,
        posts: 25000,
        universities: 50,
        satisfaction: 98,
      };
      const duration = 2000;
      const steps = 60;

      Object.keys(targets).forEach((key) => {
        const target = targets[key as keyof typeof targets];
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setCounters((prev) => ({ ...prev, [key]: Math.floor(current) }));
        }, duration / steps);
      });
    }
  }, [isVisible]);

  const testimonials = [
    {
      name: "Ahmad Rizki",
      role: "Mahasiswa Teknik Informatika",
      content:
        "Platform SARPUS benar-benar revolusioner! Interface yang clean dan fitur yang powerful membuat saya bisa menyuarakan aspirasi dengan mudah.",
      avatar: "/placeholder.svg?height=60&width=60",
      rating: 5,
      university: "Institut Teknologi Bandung",
      badge: "Top Contributor",
    },
    {
      name: "Sari Dewi",
      role: "Mahasiswa Psikologi",
      content:
        "Akhirnya ada platform yang benar-benar memahami kebutuhan mahasiswa. Community yang supportive dan fitur yang lengkap!",
      avatar: "/placeholder.svg?height=60&width=60",
      rating: 5,
      university: "Universitas Indonesia",
      badge: "Active Member",
    },
    {
      name: "Budi Santoso",
      role: "Mahasiswa Ekonomi",
      content:
        "Dashboard analytics yang detail dan real-time notifications membuat saya selalu update dengan perkembangan terbaru di kampus.",
      avatar: "/placeholder.svg?height=60&width=60",
      rating: 5,
      university: "Universitas Gadjah Mada",
      badge: "Power User",
    },
  ];

  const quickStats = [
    {
      number: counters.users,
      label: "Mahasiswa Aktif",
      icon: Users,
      color: "bg-yellow-400",
      suffix: "+",
    },
    {
      number: counters.posts,
      label: "Postingan",
      icon: MessageSquare,
      color: "bg-cyan-400",
      suffix: "+",
    },
    {
      number: counters.universities,
      label: "Universitas",
      icon: Globe,
      color: "bg-pink-400",
      suffix: "+",
    },
    {
      number: counters.satisfaction,
      label: "Kepuasan",
      icon: Heart,
      color: "bg-green-400",
      suffix: "%",
    },
  ];

  const features = [
    {
      icon: Edit,
      title: "Smart Posting",
      description:
        "Buat postingan dengan AI-powered editor, auto-tagging, dan smart categorization",
      color: "bg-yellow-400",
      stats: "2.5K posts/day",
    },
    {
      icon: Heart,
      title: "Social Engagement",
      description:
        "Sistem reward gamification dengan poin, badge, dan leaderboard untuk motivasi",
      color: "bg-pink-400",
      stats: "95% engagement rate",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Real-time analytics dengan AI insights dan predictive trends untuk admin",
      color: "bg-cyan-400",
      stats: "Real-time data",
    },
    {
      icon: Shield,
      title: "Smart Moderation",
      description:
        "AI-powered content moderation dengan auto-detection dan smart filtering",
      color: "bg-green-400",
      stats: "99.9% accuracy",
    },
    {
      icon: Bell,
      title: "Intelligent Notifications",
      description:
        "Smart notifications dengan personalized timing dan priority-based delivery",
      color: "bg-purple-400",
      stats: "85% open rate",
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description:
        "Personal goal setting dengan progress tracking dan achievement system",
      color: "bg-orange-400",
      stats: "78% completion rate",
    },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="bg-cyan-400 p-8 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 animate-bounce">
            <Trophy className="text-black text-8xl mx-auto" />
          </div>
          <h1 className="text-6xl font-black text-black mb-4">SARPUS</h1>
          <p className="text-gray-600 mb-6 font-bold text-xl">
            PLATFORM MAHASISWA
          </p>
          <div className="w-80 h-4 bg-gray-200 rounded-full mx-auto border-4 border-black">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-300"
              style={{ width: "75%" }}
            ></div>
          </div>
          <p className="text-gray-500 mt-6 animate-pulse font-bold">
            Loading amazing experience...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-2 bg-gray-200 z-50 border-b-4 border-black">
        <div
          className="h-full bg-yellow-400 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-16 h-16 rounded-full bg-cyan-400 text-black hover:bg-cyan-500 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-110"
        >
          <ArrowUp className="w-6 h-6" />
        </Button>
      )}

      {/* Header */}
      <header className="bg-white border-b-4 border-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
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

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {["BERANDA", "POSTINGAN", "TENTANG", "KONTAK"].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-black hover:text-gray-600 font-black text-lg uppercase tracking-wide transition-all duration-300 relative group px-4 py-2 rounded-xl hover:bg-yellow-400 border-2 border-transparent hover:border-black"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* Buttons */}
            <div className="hidden md:flex space-x-4">
              <Link href="/login">
                <Button className="border-4 border-black text-black bg-white px-6 py-3 rounded-2xl font-black hover:bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                  MASUK
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-yellow-400 text-black px-6 py-3 rounded-2xl font-black hover:bg-yellow-500 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                  DAFTAR
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button
              className="md:hidden bg-pink-400 border-4 border-black rounded-xl p-3"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-6 border-t-4 border-black bg-gray-50">
              <nav className="flex flex-col space-y-4">
                {["BERANDA", "POSTINGAN", "TENTANG", "KONTAK"].map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="text-black font-black text-lg uppercase tracking-wide px-4 py-3 rounded-xl hover:bg-yellow-400 border-2 border-transparent hover:border-black transition-all duration-300"
                  >
                    {item}
                  </a>
                ))}
                <div className="flex space-x-4 pt-4">
                  <Link href="/login">
                    <Button className="flex-1 border-4 border-black bg-white text-black font-black rounded-xl py-3">
                      MASUK
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="flex-1 bg-yellow-400 text-black font-black border-4 border-black rounded-xl py-3">
                      DAFTAR
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-white relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div
            className={`inline-flex items-center space-x-3 bg-cyan-400 text-black px-8 py-4 rounded-full mb-12 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform transition-all duration-1000 hover:scale-105 cursor-pointer ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <Sparkles className="w-6 h-6" />
            <span className="font-black text-lg uppercase tracking-wider">
              PLATFORM MAHASISWA VOICE
            </span>
            <Sparkles className="w-6 h-6" />
          </div>

          {/* Main Heading */}
          <div
            className={`mb-12 transform transition-all duration-1000 delay-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <h2 className="text-8xl md:text-9xl font-black text-black mb-4 leading-tight">
              SUARA
            </h2>
            <h2 className="text-8xl md:text-9xl font-black text-yellow-400 mb-6 leading-tight stroke-text">
              MAHASISWA
            </h2>
            <div className="w-40 h-4 bg-pink-400 mx-auto mb-8 rounded-full border-4 border-black"></div>
            <h3 className="text-6xl md:text-7xl font-black text-black">
              NO LIMITS
            </h3>
          </div>

          {/* Description */}
          <div
            className={`mb-16 transform transition-all duration-1000 delay-500 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <p className="text-2xl text-black mb-12 max-w-4xl mx-auto leading-relaxed font-bold">
              Bergabunglah dengan{" "}
              <span className="bg-cyan-400 text-black px-4 py-2 rounded-xl border-4 border-black font-black">
                REVOLUSI DIGITAL
              </span>{" "}
              dalam dunia pendidikan dan raih{" "}
              <span className="bg-pink-400 text-black px-4 py-2 rounded-xl border-4 border-black font-black">
                PRESTASI TERBAIK
              </span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-6 justify-center mb-20 transform transition-all duration-1000 delay-700 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <Link href="/register">
              <Button className="bg-yellow-400 text-black px-12 py-6 rounded-2xl font-black text-2xl hover:bg-yellow-500 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 flex items-center space-x-3 group">
                <span>MULAI SEKARANG</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
            </Link>
            <Link href="/explore">
              <Button className="border-4 border-black text-black bg-white px-12 py-6 rounded-2xl font-black text-2xl hover:bg-gray-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 flex items-center space-x-3 group">
                <Play className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                <span>LIHAT POSTINGAN</span>
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-6 transform transition-all duration-1000 delay-900 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className={`${stat.color} p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 cursor-pointer group`}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-black group-hover:scale-110 transition-transform duration-300" />
                <div className="text-3xl font-black text-black mb-2">
                  {stat.number.toLocaleString()}
                  {stat.suffix}
                </div>
                <div className="text-sm text-black font-bold uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 border-t-4 border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-6xl font-black text-black mb-6">
              FITUR UNGGULAN
            </h3>
            <p className="text-xl text-black font-bold max-w-3xl mx-auto">
              Teknologi terdepan yang dirancang khusus untuk kebutuhan mahasiswa
              modern
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${feature.color} p-8 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105 cursor-pointer group`}
              >
                <feature.icon className="text-black text-4xl mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h4 className="text-2xl font-black mb-4 text-black uppercase">
                  {feature.title}
                </h4>
                <p className="text-black font-bold leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="text-sm font-black text-black bg-white px-3 py-2 rounded-xl border-2 border-black inline-block">
                  {feature.stats}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white border-t-4 border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-6xl font-black text-black mb-8">
              APA KATA MEREKA
            </h3>
            <p className="text-xl text-black font-bold">
              Testimoni dari mahasiswa yang telah merasakan manfaatnya
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-yellow-400 border-4 border-black rounded-2xl p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <Quote className="w-16 h-16 mx-auto mb-8 text-black" />
              <p className="text-2xl mb-12 leading-relaxed font-bold text-black">
                "{testimonials[currentTestimonial].content}"
              </p>
              <div className="flex items-center justify-center space-x-6 mb-8">
                <img
                  src={
                    testimonials[currentTestimonial].avatar ||
                    "/placeholder.svg"
                  }
                  alt={testimonials[currentTestimonial].name}
                  className="w-20 h-20 rounded-full border-4 border-black"
                />
                <div className="text-left">
                  <h4 className="font-black text-xl text-black">
                    {testimonials[currentTestimonial].name}
                  </h4>
                  <p className="text-black font-bold">
                    {testimonials[currentTestimonial].role}
                  </p>
                  <p className="text-sm text-black font-bold">
                    {testimonials[currentTestimonial].university}
                  </p>
                  <Badge className="bg-pink-400 text-black border-2 border-black font-black mt-2">
                    {testimonials[currentTestimonial].badge}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-center space-x-2 mb-8">
                {[...Array(testimonials[currentTestimonial].rating)].map(
                  (_, i) => (
                    <Star key={i} className="w-6 h-6 text-black fill-current" />
                  ),
                )}
              </div>
            </div>

            <div className="flex justify-center space-x-3 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-4 h-4 rounded-full border-2 border-black transition-all duration-300 ${
                    index === currentTestimonial
                      ? "bg-yellow-400 scale-125"
                      : "bg-white hover:bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-cyan-400 text-black border-t-4 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white p-4 rounded-full border-4 border-black inline-block mb-8">
            <Mail className="w-16 h-16 text-black" />
          </div>
          <h3 className="text-6xl font-black mb-8">STAY CONNECTED</h3>
          <p className="text-2xl mb-12 font-bold">
            Dapatkan update terbaru tentang fitur dan perkembangan platform
            langsung di inbox Anda
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto mb-8">
            <Input
              type="email"
              placeholder="Masukkan email kampus Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-8 py-6 rounded-2xl border-4 border-black text-black font-bold text-lg"
            />
            <Button className="bg-black text-white px-8 py-6 rounded-2xl font-black text-lg hover:bg-gray-800 border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105">
              SUBSCRIBE
            </Button>
          </div>
          <p className="text-lg font-bold">
            Join 10,000+ mahasiswa yang sudah mendapatkan update mingguan dari
            kami
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 border-t-4 border-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-cyan-400 p-4 rounded-2xl border-4 border-white">
                  <Trophy className="text-black text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-black">SARPUS</h1>
                  <p className="text-sm font-bold text-gray-300">
                    PLATFORM MAHASISWA
                  </p>
                </div>
              </div>
              <p className="text-white font-bold leading-relaxed mb-6">
                Platform terdepan untuk menyuarakan aspirasi mahasiswa Indonesia
                dengan teknologi modern dan fitur-fitur inovatif.
              </p>
              <div className="flex space-x-4">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-500 border-2 border-white transition-all duration-300 hover:scale-110"
                  >
                    <Icon className="w-6 h-6 text-black" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-2xl font-black mb-6 text-yellow-400">
                PLATFORM
              </h4>
              <ul className="space-y-3">
                {["Beranda", "Postingan", "Dashboard", "Analytics"].map(
                  (item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-white hover:text-yellow-400 transition-colors duration-300 font-bold text-lg"
                      >
                        {item}
                      </a>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div>
              <h4 className="text-2xl font-black mb-6 text-pink-400">FITUR</h4>
              <ul className="space-y-3">
                {[
                  "Smart Posting",
                  "Social Engagement",
                  "Real-time Analytics",
                  "AI Moderation",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-white hover:text-pink-400 transition-colors duration-300 font-bold text-lg"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-2xl font-black mb-6 text-green-400">
                CONTACT
              </h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-6 h-6 text-green-400" />
                  <span className="text-white font-bold">hello@sarpus.id</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-6 h-6 text-green-400" />
                  <span className="text-white font-bold">
                    +62 812-3456-7890
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-6 h-6 text-green-400" />
                  <span className="text-white font-bold">
                    Jakarta, Indonesia
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t-4 border-white pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white font-bold mb-4 md:mb-0 text-lg">
              © 2024 SARPUS. All rights reserved.
            </p>
            <div className="flex items-center space-x-8">
              <a
                href="#"
                className="text-white hover:text-yellow-400 font-bold transition-colors duration-300"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-white hover:text-yellow-400 font-bold transition-colors duration-300"
              >
                Terms of Service
              </a>
              <span className="text-white font-bold">
                Made with ❤️ for Indonesian Students
              </span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .stroke-text {
          -webkit-text-stroke: 4px black;
          text-stroke: 4px black;
        }
      `}</style>
    </div>
  );
}
