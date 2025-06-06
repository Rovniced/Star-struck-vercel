"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Star, Github, Key, Link, Users, AlertTriangle, CheckCircle } from "lucide-react"
import UserTable from "@/components/user-table"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useLanguage } from "@/contexts/language-context"
import { TokenSetupDialog } from "@/components/token-setup-dialog"
import { Progress } from "@/components/ui/progress"
import { GitHubService, type StreamProgress } from "@/services/github-service"

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

interface StreamMessage {
  type: "progress" | "complete" | "error"
  message: string
  total?: number
  processed?: number
  users?: User[]
}

export default function GitHubStargazersAnalyzer() {
  const { t } = useLanguage()
  const [githubUrl, setGithubUrl] = useState("")
  const [githubToken, setGithubToken] = useState("")
  const [maxUsers, setMaxUsers] = useState("100")
  const [owner, setOwner] = useState("")
  const [repo, setRepo] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [urlParseError, setUrlParseError] = useState("")
  const [progress, setProgress] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [warnings, setWarnings] = useState<string[]>([])
  const [isCompleted, setIsCompleted] = useState(false)

  // Load token from localStorage on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem("github-token")
    if (savedToken) {
      setGithubToken(savedToken)
    }
  }, [])

  // Save token to localStorage whenever it changes
  useEffect(() => {
    if (githubToken) {
      localStorage.setItem("github-token", githubToken)
    }
  }, [githubToken])

  useEffect(() => {
    if (!githubUrl) {
      setOwner("")
      setRepo("")
      setUrlParseError("")
      return
    }

    try {
      const url = new URL(githubUrl)
      if (url.hostname !== "github.com") {
        setUrlParseError(t("validGithubUrl"))
        return
      }

      const pathParts = url.pathname.split("/").filter(Boolean)
      if (pathParts.length < 2) {
        setUrlParseError(t("ownerRepoRequired"))
        return
      }

      setOwner(pathParts[0])
      setRepo(pathParts[1])
      setUrlParseError("")
    } catch (err) {
      setUrlParseError(t("validUrl"))
    }
  }, [githubUrl, t])

  const githubServiceRef = useRef<GitHubService | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!owner || !repo) {
      setError(t("validRepoUrl"))
      return
    }

    if (!githubToken.trim()) {
      setError(t("tokenRequired"))
      return
    }

    const userCount = Number.parseInt(maxUsers)
    if (isNaN(userCount) || userCount < 1) {
      setError(t("validUserCount"))
      return
    }

    setLoading(true)
    setError("")
    setUsers([])
    setProgress(0)
    setTotalUsers(0)
    setStatusMessage(t("startingAnalysis"))
    setWarnings([])
    setIsCompleted(false)

    try {
      // Create a new GitHub service instance
      githubServiceRef.current = new GitHubService(githubToken.trim())

      // Start the analysis with progress callback
      githubServiceRef.current.getStargazers(owner.trim(), repo.trim(), userCount, (message: StreamProgress) => {
        switch (message.type) {
          case "progress":
            setStatusMessage(message.message)

            // Check if this is a warning message
            if (
              message.message.includes("Error") ||
              message.message.includes("Retrying") ||
              message.message.includes("Skipping")
            ) {
              setWarnings((prev) => [...prev, message.message])
            }

            if (message.total) {
              setTotalUsers(message.total)
            }
            if (message.processed && message.total) {
              setProgress((message.processed / message.total) * 100)
            }
            if (message.users) {
              setUsers((prev) => [...prev, ...message.users!])
            }
            break

          case "complete":
            setStatusMessage(message.message)
            setProgress(100)
            setIsCompleted(true)
            if (message.users) {
              setUsers(message.users)
            }
            setLoading(false)
            break

          case "error":
            throw new Error(message.message)
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  const handleStopAnalysis = () => {
    if (githubServiceRef.current) {
      githubServiceRef.current.cancelRequests()
    }
    setLoading(false)
    setStatusMessage(t("analysisStopped"))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div className="text-center flex-1 space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Github className="h-8 w-8 text-gray-800 dark:text-gray-200" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">{t("subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span>{t("repositoryAnalysis")}</span>
            </CardTitle>
            <CardDescription>{t("repositoryDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="githubToken" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {t("githubToken")}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="githubToken"
                    type="password"
                    placeholder={t("tokenPlaceholder")}
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    disabled={loading}
                    className="flex-1"
                  />
                  <TokenSetupDialog />
                </div>
                <p className="text-xs text-muted-foreground">{t("tokenHelp")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubUrl" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  {t("repositoryUrl")}
                </Label>
                <Input
                  id="githubUrl"
                  placeholder={t("urlPlaceholder")}
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  disabled={loading}
                />
                {urlParseError && <p className="text-xs text-red-500">{urlParseError}</p>}
                {owner && repo && !urlParseError && (
                  <p className="text-xs text-green-600">
                    {t("repository")}:{" "}
                    <span className="font-semibold">
                      {owner}/{repo}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("maxUsers")}
                </Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min="1"
                  max="1000"
                  placeholder="100"
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">{t("maxUsersHelp")}</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading || !!urlParseError}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("analyzingStargazers")}
                    </>
                  ) : (
                    <>
                      <Star className="mr-2 h-4 w-4" />
                      {t("analyzeStargazers")}
                    </>
                  )}
                </Button>
                {loading && (
                  <Button type="button" variant="outline" onClick={handleStopAnalysis}>
                    {t("stopAnalysis")}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {loading && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600 dark:text-gray-300">{statusMessage}</p>
            {totalUsers > 0 && (
              <div className="max-w-md mx-auto w-full space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(progress)}% - {users.length} / {totalUsers} {t("usersProcessed")}
                </p>
              </div>
            )}
          </div>
        )}

        {warnings.length > 0 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-600">
                <AlertTriangle className="h-5 w-5" />
                <span>{t("warnings")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {warnings.slice(-5).map((warning, index) => (
                  <p key={index} className="text-sm text-yellow-700 dark:text-yellow-300">
                    {warning}
                  </p>
                ))}
                {warnings.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    {t("andMoreWarnings").replace("{count}", (warnings.length - 5).toString())}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isCompleted && (
          <Alert className="max-w-2xl mx-auto">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-700 dark:text-green-300">{t("analysisCompleted")}</AlertDescription>
          </Alert>
        )}

        {users.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {loading
                  ? t("analyzingProgress")
                      .replace("{count}", users.length.toString())
                      .replace("{repo}", `${owner}/${repo}`)
                  : t("foundStargazers")
                      .replace("{count}", users.length.toString())
                      .replace("{repo}", `${owner}/${repo}`)}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{t("sortingHelp")}</p>
            </div>
            <UserTable users={users} />
          </div>
        )}
      </div>
    </div>
  )
}
