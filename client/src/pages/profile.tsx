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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [editForm, setEditForm] = useState({
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
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
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

  // Check authentication and redirect if needed
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
    mutationFn: async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64 = reader.result as string
            const result = await api.upload.uploadImage(base64, file.name)
            const imageUrl = (result as any).imageUrl || ""
            resolve(imageUrl)
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

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm)
  }

  const handleCancelEdit = () => {
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
    setIsEditing(false)
    setError("")
    setSuccess("")
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Memuat profil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userPosts = posts.filter(post => post.idUsers === user.idUsers)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex">
        <div className="hidden lg:block">
          <ImprovedSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-80 h-full" onClick={(e) => e.stopPropagation()}>
              <ImprovedSidebar
                isOpen={true}
                onClose={() => setSidebarOpen(false)}
                isCollapsed={false}
                onToggleCollapse={() => {}}
              />
            </div>
          </div>
        )}

        <main
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-80"
          )}
        >
          {/* Mobile Header */}
          <div className="lg:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-gray-600 dark:text-gray-300"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profil Saya
            </h1>
            <div className="w-10" />
          </div>

          <div
            className={cn(
              "container mx-auto px-4 py-6 transition-all duration-700",
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            )}
          >
            {/* Profile Header */}
            <Card className="mb-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Profil Saya
                  </CardTitle>
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "secondary" : "default"}
                    className="transition-all duration-200"
                  >
                    {isEditing ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        Batal
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profil
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Profile Image */}
                  <div className="md:col-span-1">
                    <div className="text-center">
                      <div className="relative inline-block mb-4">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-1">
                          <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt="Profile"
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <User className="w-12 h-12 text-gray-400" />
                            )}
                          </div>
                        </div>
                        {isEditing && (
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute -bottom-2 -right-2 rounded-full shadow-lg"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploadingImage}
                          >
                            {isUploadingImage ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {user.username}
                        </h3>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          <Crown className="w-3 h-3 mr-1" />
                          {user.role === 'admin' ? 'Administrator' : 'Mahasiswa'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="md:col-span-2">
                    <div className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <User className="w-4 h-4 inline mr-2" />
                            Username
                          </label>
                          {isEditing ? (
                            <Input
                              value={editForm.username}
                              onChange={(e) => setEditForm(prev => ({...prev, username: e.target.value}))}
                              placeholder="Username"
                              className="transition-all duration-200"
                            />
                          ) : (
                            <p className="text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              {user.username || "-"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                          </label>
                          {isEditing ? (
                            <Input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm(prev => ({...prev, email: e.target.value}))}
                              placeholder="Email"
                              className="transition-all duration-200"
                            />
                          ) : (
                            <p className="text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              {user.email || "-"}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <GraduationCap className="w-4 h-4 inline mr-2" />
                            NIM
                          </label>
                          {isEditing ? (
                            <Input
                              value={editForm.nim}
                              onChange={(e) => setEditForm(prev => ({...prev, nim: e.target.value}))}
                              placeholder="NIM"
                              className="transition-all duration-200"
                            />
                          ) : (
                            <p className="text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              {user.nim || "-"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Gender
                          </label>
                          {isEditing ? (
                            <Select
                              value={editForm.gender}
                              onValueChange={(value) => setEditForm(prev => ({...prev, gender: value}))}
                            >
                              <SelectTrigger className="transition-all duration-200">
                                <SelectValue placeholder="Pilih gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                                <SelectItem value="Perempuan">Perempuan</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              {user.gender || "-"}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <BookOpen className="w-4 h-4 inline mr-2" />
                          Jurusan
                        </label>
                        {isEditing ? (
                          <Input
                            value={editForm.jurusan}
                            onChange={(e) => setEditForm(prev => ({...prev, jurusan: e.target.value}))}
                            placeholder="Jurusan"
                            className="transition-all duration-200"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                            {user.jurusan || "-"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Bio
                        </label>
                        {isEditing ? (
                          <Textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm(prev => ({...prev, bio: e.target.value}))}
                            placeholder="Ceritakan tentang diri Anda..."
                            className="transition-all duration-200 min-h-[80px]"
                          />
                        ) : (
                          <p className="text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md min-h-[80px]">
                            {user.bio || "Belum ada bio"}
                          </p>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <MapPin className="w-4 h-4 inline mr-2" />
                            Lokasi
                          </label>
                          {isEditing ? (
                            <Input
                              value={editForm.location}
                              onChange={(e) => setEditForm(prev => ({...prev, location: e.target.value}))}
                              placeholder="Lokasi"
                              className="transition-all duration-200"
                            />
                          ) : (
                            <p className="text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              {user.location || "-"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Globe className="w-4 h-4 inline mr-2" />
                            Website
                          </label>
                          {isEditing ? (
                            <Input
                              value={editForm.website}
                              onChange={(e) => setEditForm(prev => ({...prev, website: e.target.value}))}
                              placeholder="https://website.com"
                              className="transition-all duration-200"
                            />
                          ) : (
                            <p className="text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              {user.website ? (
                                <a
                                  href={user.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {user.website}
                                </a>
                              ) : (
                                "-"
                              )}
                            </p>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Menyimpan...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan Perubahan
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Batal
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Posts Section */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  Postingan Saya ({userPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Anda belum membuat postingan apapun
                    </p>
                    <Button
                      onClick={() => setLocation("/dashboard")}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Buat Postingan Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <PostCard
                        key={post.idPostingan}
                        post={post}
                        onLike={(postId, type) => {}}
                        onDelete={(postId) => {}}
                        onUpdate={() => {}}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}