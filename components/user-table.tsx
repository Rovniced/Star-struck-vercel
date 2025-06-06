"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, MapPin, Building, Calendar, Star, Users, GitFork } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface User {
  login: string
  name: string
  avatar_url: string
  html_url: string
  followers: number
  following: number
  public_repos: number
  created_at: string
  location?: string
  company?: string
  blog?: string
  bio?: string
  total_stars: number
  starred_at?: string
}

interface UserTableProps {
  users: User[]
}

type SortField = "total_stars" | "followers" | "public_repos" | "created_at"
type SortOrder = "asc" | "desc"

export default function UserTable({ users }: UserTableProps) {
  const { t } = useLanguage()
  const [sortField, setSortField] = useState<SortField>("total_stars")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const sortedUsers = [...users].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]

    if (sortField === "created_at") {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return "↕️"
    return sortOrder === "asc" ? "↑" : "↓"
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={sortField === "total_stars" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSort("total_stars")}
        >
          {t("totalStars")} {getSortIcon("total_stars")}
        </Button>
        <Button
          variant={sortField === "followers" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSort("followers")}
        >
          {t("followers")} {getSortIcon("followers")}
        </Button>
        <Button
          variant={sortField === "public_repos" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSort("public_repos")}
        >
          {t("publicRepos")} {getSortIcon("public_repos")}
        </Button>
        <Button
          variant={sortField === "created_at" ? "default" : "outline"}
          size="sm"
          onClick={() => handleSort("created_at")}
        >
          {t("joinDate")} {getSortIcon("created_at")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedUsers.map((user, index) => (
          <Card key={user.login} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{user.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">@{user.login}</p>
                </div>
                <Badge variant="secondary">#{index + 1}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.bio && <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>}

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="font-semibold">{user.total_stars.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("totalStars")}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="font-semibold">{user.followers.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("followers")}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <GitFork className="h-4 w-4 text-green-500 mr-1" />
                    <span className="font-semibold">{user.public_repos}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("repos")}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {user.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate">{user.location}</span>
                  </div>
                )}
                {user.company && (
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="truncate">{user.company}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {t("joined")} {formatDate(user.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(user.html_url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t("profile")}
                </Button>
                {user.blog && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(user.blog.startsWith("http") ? user.blog : `https://${user.blog}`, "_blank")
                    }
                  >
                    {t("blog")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
