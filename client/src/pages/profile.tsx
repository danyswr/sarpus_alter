"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { useLocation } from "wouter"
import { ImprovedSidebar } from "@/components/sidebar"
import { PostCard } from "@/components/post-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, type Post } from "@/lib/api"
import { Edit, Save, X, Camera, Trophy, User, GraduationCap, BookOpen, MapPin, Globe, Heart, MessageSquare, Target, Crown, Menu, Plus, TrendingUp } from 'lucide-react'
import { cn } from "@/lib/utils"

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth()
  const [, setLocation] = useLocation()
  const [sidebarOpen, setSidebarOpen = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed = useState(false)
  const [isEditing, setIsEditing = useState(false)
  const [isVisible, setIsVisible = useState(false)
  const [editForm, setEditForm = useState({
    username: "",
    email: "",
    nim: "",
    gender: "",
    jurusan: "",
    bio: "",
    location: "",
    website: "",
    profileImageUrl: "",
  })
  const [error, setError = useState("")
  const [success, setSuccess = useState("")
  const [profileImage, setProfileImage = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Animation on mount
  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed")
    if (savedCollapsed !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsed))
    }
  }, [])

  // Save sidebar state to localStorage
  const handleToggleCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed))
  }

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login")
    }
    if (user) {
      setEditForm({
        username: user.username || "",
        email: user.email || "",
        nim: user.nim || "",
        gender: user.gender || "",
        jurusan: user.jurusan || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        profileImageUrl: user.profileImageUrl || "",
      })
      setProfileImage(user.profileImageUrl || null)
    }
  }, [user, authLoading, setLocation])

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["/api/posts"],
    enabled: !!user,
  }) as { data: Post[]; isLoading: boolean }

  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof editForm) => api.user.updateProfile(user!.idUsers, data),
    onSuccess: () => {
      setSuccess("Profil berhasil diperbarui!")
      setIsEditing(false)
      setError("")
      setTimeout(() => setSuccess(""), 3000)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil")
      setTimeout(() => setError(""), 3000)
    },
  })

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64 = reader.result as string
            const base64Data = base64.split(",")[1]

            const response = await fetch("/api/upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                image: base64Data,
                fileName: file.name,
              }),
            })

            if (!response.ok) {
              throw new Error("Gagal mengupload gambar")
            }

            const result = await response.json()
            resolve(result.imageUrl)
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = () => reject(new Error("Gagal membaca file"))
        reader.readAsDataURL(file)
      })
    },
    onSuccess: (imageUrl: string) => {
      setProfileImage(imageUrl)
      setIsUploadingImage(false)
      setSuccess("Foto profil berhasil diupload!")
      setEditForm((prev) => ({ ...prev, profileImageUrl: imageUrl }))
      setTimeout(() => setSuccess(""), 3000)
    },
    onError: (err) => {
      setIsUploadingImage(false)
      setError(err instanceof Error ? err.message : "Gagal mengupload foto")
      setTimeout(() => setError(""), 3000)
    },
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran file maksimal 5MB")
        setTimeout(() => setError(""), 3000)
        return
      }

      if (!file.type.startsWith("image/")) {
        setError("File harus berupa gambar")
        setTimeout(() => setError(""), 3000)
        return
      }

      setIsUploadingImage(true)
      setError("")
      uploadImageMutation.mutate(file)
    }
  }

  const likePostMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: "like" | "dislike" }) => api.posts.likePost(postId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] })
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.posts.deletePost(postId, user!.idUsers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] })
    },
  })

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-cyan-400 p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mb-6 animate-bounce">
            <User className="text-black text-4xl mx-auto" />
          </div>
          <h1 className="text-3xl font-black text-black mb-4">LOADING PROFILE</h1>
          <p className="text-gray-600 mb-4 font-bold">Memuat data profil...</p>
          <div className="w-64 h-3 bg-gray-200 rounded-full mx-auto border-2 border-black">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-300 animate-pulse"
              style={{ width: "75%" }}
            />
          </div>
        </div>
      </div>
    )
  }

  const userPosts = posts.filter((post: Post) => post.idUsers === user.idUsers)
  const userStats = {
    posts: userPosts.length,
    likes: userPosts.reduce((sum: number, post: Post) => sum + (post.likes || 0), 0),
    totalPosts: posts.length,
  }

  const jurusanOptions = [
    "Teknik Informatika",
    "Sistem Informasi",
    "Teknik Elektro",
    "Teknik Sipil",
    "Manajemen",
    "Akuntansi",
    "Hukum",
    "Kedokteran",
  ]

  const genderOptions = [
    { value: "male", label: "Laki-laki" },
    { value: "female", label: "Perempuan" },
  ]

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Improved Sidebar */}
      <ImprovedSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onCreatePost={() => {
          setLocation("/dashboard")
        }}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        {/* Mobile Header */}
        <div className="lg:hidden bg-cyan-400 border-b-2 border-black px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-40 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]">
          <Button
            variant="ghost"
            onClick={() => setSidebarOpen(true)}
            className="bg-white border-2 border-black rounded-xl p-2 hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
          >
            <Menu className="w-4 h-4 text-black" />
          </Button>

          <div className="flex items-center space-x-2">
            <div className="bg-white p-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <User className="text-black text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-black text-black">PROFIL</h1>
              <p className="text-xs text-black font-bold -mt-0.5">USER PROFILE</p>
            </div>
          </div>

          <Button
            onClick={() => setLocation("/dashboard")}
            className="bg-white text-black border-2 border-black rounded-xl p-2 hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Container */}
        <div className="pt-16 lg:pt-6 px-4 lg:px-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Alerts */}
            {error && (
              <Alert
                className={cn(
                  "border-2 border-red-500 bg-red-100 rounded-xl shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] transform transition-all duration-500",
                  error ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
                )}
              >
                <AlertDescription className="text-red-700 font-bold flex items-center">
                  <X className="w-4 h-4 mr-2" />
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert
                className={cn(
                  "border-2 border-green-500 bg-green-100 rounded-xl shadow-[4px_4px_0px_0px_rgba(34,197,94,1)] transform transition-all duration-500",
                  success ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0",
                )}
              >
                <AlertDescription className="text-green-700 font-bold flex items-center">
                  <Trophy className="w-4 h-4 mr-2" />
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Profile Header Card */}
            <div
              className={`transform transition-all duration-1000 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl overflow-hidden">
                {/* Cover Photo */}
                <div className="h-24 md:h-32 bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-400 relative border-b-2 border-black">
                  <div className="absolute inset-0 bg-black bg-opacity-10" />

                  {/* Cover Content */}
                  <div className="absolute inset-0 flex items-end p-4 md:p-6">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white p-2 md:p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <Trophy className="w-5 h-5 md:w-6 md:h-6 text-black" />
                      </div>
                      <div className="hidden sm:block">
                        <h1 className="text-lg md:text-xl font-black text-white drop-shadow-lg">PROFIL MAHASISWA</h1>
                        <p className="text-sm md:text-base font-bold text-white drop-shadow-lg">
                          SARPUS Community Member
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="p-0">
                  {/* Main Profile Section */}
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-6 lg:space-y-0">
                      {/* Left Section - Profile Info */}
                      <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 flex-1">
                        {/* Profile Image */}
                        <div className="relative mx-auto sm:mx-0 -mt-8 md:-mt-12">
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full border-4 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative z-10 overflow-hidden">
                            {profileImage || user.profileImageUrl ? (
                              <img
                                src={profileImage || user.profileImageUrl || "/placeholder.svg"}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-xl md:text-2xl font-black">
                                {user.username
                                  ? user.username.charAt(0).toUpperCase()
                                  : user.email
                                    ? user.email.charAt(0).toUpperCase()
                                    : "U"}
                              </span>
                            )}
                          </div>

                          {/* Profile Image Upload Button */}
                          <Button
                            size="sm"
                            className="absolute -bottom-0.5 -right-0.5 w-6 h-6 md:w-7 md:h-7 rounded-full p-0 bg-yellow-400 border-2 border-black hover:bg-yellow-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 z-20"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                          >
                            {isUploadingImage ? (
                              <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Camera className="w-3 h-3 text-black" />
                            )}
                          </Button>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </div>

                        {/* User Info */}
                        <div className="text-center sm:text-left flex-1 pt-2">
                          {isEditing ? (
                            <div className="space-y-4">
                              <Input
                                value={editForm.username}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    username: e.target.value,
                                  }))
                                }
                                placeholder="Username"
                                className="text-xl font-black border-2 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                              />
                              <Input
                                value={editForm.email}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                                type="email"
                                placeholder="Email"
                                className="font-bold border-2 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                  value={editForm.nim}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      nim: e.target.value,
                                    }))
                                  }
                                  placeholder="NIM"
                                  className="font-bold border-2 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                                />
                                <Select
                                  value={editForm.gender}
                                  onValueChange={(value) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      gender: value,
                                    }))
                                  }
                                >
                                  <SelectTrigger className="font-bold border-2 border-black rounded-xl focus:border-cyan-400 px-4 py-3">
                                    <SelectValue placeholder="Pilih Gender" />
                                  </SelectTrigger>
                                  <SelectContent className="border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    {genderOptions.map((gender) => (
                                      <SelectItem key={gender.value} value={gender.value}>
                                        {gender.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Select
                                value={editForm.jurusan}
                                onValueChange={(value) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    jurusan: value,
                                  }))
                                }
                              >
                                <SelectTrigger className="font-bold border-2 border-black rounded-xl focus:border-cyan-400 px-4 py-3">
                                  <SelectValue placeholder="Pilih Jurusan" />
                                </SelectTrigger>
                                <SelectContent className="border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                  {jurusanOptions.map((jurusan) => (
                                    <SelectItem key={jurusan} value={jurusan}>
                                      {jurusan}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Textarea
                                value={editForm.bio}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    bio: e.target.value,
                                  }))
                                }
                                placeholder="Bio (ceritakan tentang diri Anda)"
                                className="font-bold border-2 border-black rounded-xl focus:border-cyan-400 px-4 py-3 resize-none"
                                rows={3}
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                  value={editForm.location}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      location: e.target.value,
                                    }))
                                  }
                                  placeholder="Lokasi"
                                  className="font-bold border-2 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                                />
                                <Input
                                  value={editForm.website}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      website: e.target.value,
                                    }))
                                  }
                                  placeholder="Website/Portfolio"
                                  type="url"
                                  className="font-bold border-2 border-black rounded-xl focus:border-cyan-400 px-4 py-3"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Name and Role */}
                              <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                                  <h2 className="text-2xl md:text-3xl font-black text-black">{user.username}</h2>
                                  {user.role === "admin" && (
                                    <Badge className="bg-red-400 text-black border-2 border-black font-black rounded-full mx-auto sm:mx-0 w-fit">
                                      <Crown className="w-3 h-3 mr-1" />
                                      ADMIN
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-lg font-bold text-gray-600">{user.email}</p>
                              </div>

                              {/* User Details */}
                              {(user.nim || user.gender || user.jurusan) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {user.nim && (
                                    <div className="bg-yellow-400 p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-3">
                                      <GraduationCap className="w-5 h-5 text-black flex-shrink-0" />
                                      <div className="min-w-0">
                                        <span className="font-black text-black uppercase text-xs block">NIM</span>
                                        <div className="font-bold text-black truncate">{user.nim}</div>
                                      </div>
                                    </div>
                                  )}

                                  {user.gender && (
                                    <div className="bg-pink-400 p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-3">
                                      <User className="w-5 h-5 text-black flex-shrink-0" />
                                      <div className="min-w-0">
                                        <span className="font-black text-black uppercase text-xs block">Gender</span>
                                        <div className="font-bold text-black capitalize truncate">
                                          {user.gender === "male" ? "Laki-laki" : "Perempuan"}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {user.jurusan && (
                                    <div className="bg-green-400 p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-3 sm:col-span-2">
                                      <BookOpen className="w-5 h-5 text-black flex-shrink-0" />
                                      <div className="min-w-0">
                                        <span className="font-black text-black uppercase text-xs block">Jurusan</span>
                                        <div className="font-bold text-black truncate">{user.jurusan}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Bio */}
                              {user.bio && (
                                <div className="bg-cyan-400 p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  <span className="font-black text-black uppercase text-xs block mb-2">Bio</span>
                                  <p className="text-black font-bold leading-relaxed">{user.bio}</p>
                                </div>
                              )}

                              {/* Location and Website */}
                              {(user.location || user.website) && (
                                <div className="flex flex-wrap gap-3">
                                  {user.location && (
                                    <div className="bg-purple-400 p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-2">
                                      <MapPin className="w-4 h-4 text-black" />
                                      <span className="font-bold text-black">{user.location}</span>
                                    </div>
                                  )}

                                  {user.website && (
                                    <div className="bg-orange-400 p-3 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center space-x-2">
                                      <Globe className="w-4 h-4 text-black" />
                                      <a
                                        href={
                                          user.website.startsWith("http") ? user.website : `https://${user.website}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-bold text-black hover:underline"
                                      >
                                        Website
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Section - Action Buttons */}
                      <div className="flex flex-col space-y-3 lg:ml-6">
                        {isEditing ? (
                          <>
                            <Button
                              onClick={handleSaveProfile}
                              className="bg-yellow-400 text-black hover:bg-yellow-500 border-2 border-black rounded-xl px-6 py-3 font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
                              disabled={updateProfileMutation.isPending}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {updateProfileMutation.isPending ? "MENYIMPAN..." : "SIMPAN"}
                            </Button>
                            <Button
                              onClick={() => {
                                setIsEditing(false)
                                setEditForm({
                                  username: user.username || "",
                                  email: user.email || "",
                                  nim: user.nim || "",
                                  gender: user.gender || "",
                                  jurusan: user.jurusan || "",
                                  bio: user.bio || "",
                                  location: user.location || "",
                                  website: user.website || "",
                                  profileImageUrl: user.profileImageUrl || "",
                                })
                              }}
                              className="border-2 border-black text-black bg-white hover:bg-gray-100 rounded-xl px-6 py-3 font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300"
                            >
                              <X className="w-4 h-4 mr-2" />
                              BATAL
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => setIsEditing(true)}
                            className="bg-yellow-400 text-black hover:bg-yellow-500 border-2 border-black rounded-xl px-6 py-3 font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            EDIT PROFIL
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="border-t-2 border-black bg-gray-50 p-4 md:p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-yellow-400 p-4 md:p-6 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                        <MessageSquare className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-black" />
                        <p className="text-2xl md:text-3xl font-black text-black">{userStats.posts}</p>
                        <p className="text-black font-bold text-xs md:text-sm uppercase">Postingan</p>
                      </div>
                      <div className="bg-pink-400 p-4 md:p-6 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                        <Heart className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-black" />
                        <p className="text-2xl md:text-3xl font-black text-black">{userStats.likes}</p>
                        <p className="text-black font-bold text-xs md:text-sm uppercase">Likes</p>
                      </div>
                      <div className="bg-green-400 p-4 md:p-6 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] text-center hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300">
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-black" />
                        <p className="text-2xl md:text-3xl font-black text-black">
                          {Math.round((userStats.posts / Math.max(userStats.totalPosts, 1)) * 100) || 0}%
                        </p>
                        <p className="text-black font-bold text-xs md:text-sm uppercase">Kontribusi</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Posts Section */}
            <div
              className={`transform transition-all duration-1000 delay-300 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
              }`}
            >
              <Card className="border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white rounded-xl">
                <CardHeader className="bg-pink-400 border-b-2 border-black rounded-t-xl p-4">
                  <CardTitle className="flex items-center space-x-3 text-xl font-black text-black uppercase">
                    <Target className="w-5 h-5" />
                    <span>Postingan Saya</span>
                    <Badge className="bg-white text-black border-2 border-black font-black rounded-full">
                      {userPosts.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="bg-cyan-400 p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 animate-bounce inline-block">
                        <MessageSquare className="text-black text-4xl" />
                      </div>
                      <h3 className="text-2xl font-black text-black mb-3">LOADING POSTS...</h3>
                      <p className="text-base font-bold text-gray-600">Mengambil postingan Anda</p>
                    </div>
                  ) : userPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-yellow-400 p-6 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 inline-block">
                        <MessageSquare className="text-black text-4xl" />
                      </div>
                      <h3 className="text-2xl font-black text-black mb-3 uppercase">Belum Ada Postingan</h3>
                      <p className="text-base font-bold text-gray-600 mb-6">
                        Mulai berbagi keluh kesah dan aspirasi Anda dengan komunitas!
                      </p>
                      <Button
                        onClick={() => setLocation("/dashboard")}
                        className="bg-yellow-400 text-black hover:bg-yellow-500 border-2 border-black rounded-xl px-6 py-3 font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        BUAT POSTINGAN PERTAMA
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userPosts
                        .sort((a, b) => {
                          const dateA = new Date(a.timestamp).getTime()
                          const dateB = new Date(b.timestamp).getTime()
                          return dateB - dateA
                        })
                        .map((post: Post) => (
                          <PostCard
                            key={post.idPostingan}
                            post={post}
                            onLike={(postId, type) => likePostMutation.mutate({ postId, type })}
                            onDelete={(postId) => deletePostMutation.mutate(postId)}
                          />
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
