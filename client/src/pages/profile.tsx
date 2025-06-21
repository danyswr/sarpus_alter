import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { useLocation } from "wouter"
import { ImprovedSidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, type Post } from "@/lib/api"
import { Edit, User, Menu, MessageSquare, Plus } from 'lucide-react'
import { cn } from "@/lib/utils"

interface EditFormData {
  username: string
  email: string
  nim: string
  gender: string
  jurusan: string
  bio: string
  location: string
  website: string
}

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth()
  const [, setLocation] = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isVisible, setIsVisible] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const queryClient = useQueryClient()

  const [editForm, setEditForm] = useState<EditFormData>({
    username: "",
    email: "",
    nim: "",
    gender: "",
    jurusan: "",
    bio: "",
    location: "",
    website: "",
  })

  useEffect(() => {
    setIsVisible(true)
  }, [])

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed")
    if (savedCollapsed !== null) {
      setSidebarCollapsed(JSON.parse(savedCollapsed))
    }
  }, [])

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
      })
    }
  }, [user, authLoading, setLocation])

  const { data: posts = [] } = useQuery({
    queryKey: ["/api/posts"],
    enabled: !!user,
  }) as { data: Post[] }

  const updateProfileMutation = useMutation({
    mutationFn: (data: EditFormData) => api.user.updateProfile(user!.idUsers, data),
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

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editForm)
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Memuat profil...</p>
        </div>
      </div>
    )
  }

  const userPosts = posts.filter((post: Post) => post.idUsers === user.idUsers)

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
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
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
                    <Edit className="w-4 h-4 mr-2" />
                    {isEditing ? "Batal" : "Edit Profil"}
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
                  <div className="md:col-span-1">
                    <div className="text-center">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-1 mx-auto mb-4">
                        <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                          <User className="w-12 h-12 text-gray-400" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {user.username}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user.role === 'admin' ? 'Administrator' : 'Mahasiswa'}
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="grid gap-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Username
                          </label>
                          {isEditing ? (
                            <Input
                              value={editForm.username}
                              onChange={(e) => setEditForm(prev => ({...prev, username: e.target.value}))}
                              placeholder="Username"
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
                            NIM
                          </label>
                          {isEditing ? (
                            <Input
                              value={editForm.nim}
                              onChange={(e) => setEditForm(prev => ({...prev, nim: e.target.value}))}
                              placeholder="NIM"
                            />
                          ) : (
                            <p className="text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              {user.nim || "-"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Jurusan
                          </label>
                          {isEditing ? (
                            <Input
                              value={editForm.jurusan}
                              onChange={(e) => setEditForm(prev => ({...prev, jurusan: e.target.value}))}
                              placeholder="Jurusan"
                            />
                          ) : (
                            <p className="text-gray-900 dark:text-white py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                              {user.jurusan || "-"}
                            </p>
                          )}
                        </div>
                      </div>

                      {isEditing && (
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          >
                            {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                          </Button>
                          <Button
                            onClick={() => setIsEditing(false)}
                            variant="outline"
                            className="flex-1"
                          >
                            Batal
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  Postingan Saya ({userPosts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userPosts.length === 0 ? (
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
                      <div key={post.idPostingan} className="p-4 border rounded-lg">
                        <h3 className="font-semibold">{post.judul}</h3>
                        <p className="text-gray-600 dark:text-gray-400">{post.deskripsi}</p>
                      </div>
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