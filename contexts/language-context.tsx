"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "zh"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Header
    title: "GitHub Stargazers Analyzer",
    subtitle:
      "Analyze and explore users who starred any GitHub repository. Get detailed insights about contributors, their activity, and sort them by various metrics.",

    // Token Info
    tokenRequired: "GitHub Token Required",
    tokenDescription: "This application requires a GitHub Personal Access Token to fetch data from the GitHub API.",
    tokenPrivacy: "Your token is used only for API requests and is never stored on our servers.",
    tokenSteps: {
      step1: "Go to GitHub Token Settings",
      step2: 'Click "Generate new token" → "Generate new token (classic)"',
      step3: 'Give your token a name (e.g., "Stargazers Analyzer")',
      step4: 'Select the "repo" and "read:user" scopes',
      step5: 'Click "Generate token" and copy the token value',
    },

    // Form
    repositoryAnalysis: "Repository Analysis",
    repositoryDescription: "Enter the GitHub repository details to analyze its stargazers",
    githubToken: "GitHub Token",
    tokenPlaceholder: "Enter your GitHub personal access token",
    tokenHelp: "Required for API access. Create a token with 'repo' and 'user' scopes.",
    repositoryUrl: "GitHub Repository URL",
    urlPlaceholder: "https://github.com/owner/repository",
    repository: "Repository",
    maxUsers: "Maximum Users to Analyze",
    maxUsersHelp: "Specify how many users to analyze. Higher values may take longer to process.",
    analyzeStargazers: "Analyze Stargazers",
    analyzingStargazers: "Analyzing Stargazers...",
    validUserCount: "Please enter a valid number of users to analyze",

    // Results
    foundStargazers: "Found {count} Stargazers for {repo}",
    sortingHelp: "Click on any sorting button to reorder the results",
    fetchingData: "Fetching stargazers and analyzing their profiles...",
    analyzingUsers: "Analyzed {count} of {total} users",

    // Sorting
    totalStars: "Total Stars",
    followers: "Followers",
    publicRepos: "Public Repos",
    joinDate: "Join Date",

    // User Card
    repos: "Repos",
    joined: "Joined",
    profile: "Profile",
    blog: "Blog",

    // Errors
    validGithubUrl: "Please enter a valid GitHub URL",
    ownerRepoRequired: "URL must contain owner and repository name",
    validUrl: "Please enter a valid URL",
    validRepoUrl: "Please enter a valid GitHub repository URL",
    tokenRequired: "Please enter a GitHub token",

    // Theme
    lightMode: "Light Mode",
    darkMode: "Dark Mode",

    // Language
    language: "Language",
    english: "English",
    chinese: "中文",

    // Tip
    tip: "Tip",
    tokenAutoSave: "Your token will be automatically saved in your browser for future visits.",

    // Analysis
    startingAnalysis: "Starting analysis...",
    usersProcessed: "users processed",
    analyzingProgress: "Analyzing {count} Stargazers for {repo}",
    analysisStopped: "Analysis stopped by user",
    stopAnalysis: "Stop Analysis",
    warnings: "Warnings & Retries",
    andMoreWarnings: "... and {count} more warnings",
    analysisCompleted: "Analysis completed successfully!",
  },
  zh: {
    // Header
    title: "GitHub 点赞用户分析器",
    subtitle: "分析和探索为任何 GitHub 仓库点赞的用户。获取贡献者的详细见解、他们的活动，并按各种指标排序。",

    // Token Info
    tokenRequired: "需要 GitHub 令牌",
    tokenDescription: "此应用程序需要 GitHub 个人访问令牌来从 GitHub API 获取数据。",
    tokenPrivacy: "您的令牌仅用于 API 请求，绝不会存储在我们的服务器上。",
    tokenSteps: {
      step1: "前往 GitHub 令牌设置",
      step2: '点击 "Generate new token" → "Generate new token (classic)"',
      step3: '为您的令牌命名（例如 "点赞分析器"）',
      step4: '选择 "repo" 和 "read:user" 权限范围',
      step5: '点击 "Generate token" 并复制令牌值',
    },

    // Form
    repositoryAnalysis: "仓库分析",
    repositoryDescription: "输入 GitHub 仓库详细信息以分析其点赞用户",
    githubToken: "GitHub 令牌",
    tokenPlaceholder: "输入您的 GitHub 个人访问令牌",
    tokenHelp: "API 访问必需。创建具有 'repo' 和 'user' 权限范围的令牌。",
    repositoryUrl: "GitHub 仓库链接",
    urlPlaceholder: "https://github.com/用户名/仓库名",
    repository: "仓库",
    maxUsers: "要分析的最大用户数",
    maxUsersHelp: "指定要分析的用户数量。数值越大，处理时间可能越长。",
    analyzeStargazers: "分析点赞用户",
    analyzingStargazers: "正在分析点赞用户...",
    validUserCount: "请输入有效的用户分析数量",

    // Results
    foundStargazers: "为 {repo} 找到 {count} 个点赞用户",
    sortingHelp: "点击任何排序按钮重新排列结果",
    fetchingData: "正在获取点赞用户并分析他们的资料...",
    analyzingUsers: "已分析 {count}/{total} 个用户",

    // Sorting
    totalStars: "总点赞数",
    followers: "关注者",
    publicRepos: "公开仓库",
    joinDate: "加入日期",

    // User Card
    repos: "仓库",
    joined: "加入于",
    profile: "资料",
    blog: "博客",

    // Errors
    validGithubUrl: "请输入有效的 GitHub 链接",
    ownerRepoRequired: "链接必须包含用户名和仓库名",
    validUrl: "请输入有效的链接",
    validRepoUrl: "请输入有效的 GitHub 仓库链接",
    tokenRequired: "请输入 GitHub 令牌",

    // Theme
    lightMode: "浅色模式",
    darkMode: "深色模式",

    // Language
    language: "语言",
    english: "English",
    chinese: "中文",

    // Tip
    tip: "提示",
    tokenAutoSave: "令牌将自动保存在您的浏览器中，下次访问时无需重新输入。",

    // Analysis
    startingAnalysis: "开始分析...",
    usersProcessed: "个用户已处理",
    analyzingProgress: "正在分析 {repo} 的 {count} 个点赞用户",
    analysisStopped: "用户停止了分析",
    stopAnalysis: "停止分析",
    warnings: "警告和重试",
    andMoreWarnings: "... 还有 {count} 个警告",
    analysisCompleted: "分析成功完成！",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("preferred-language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "zh")) {
      setLanguage(savedLanguage)
    } else {
      // Detect browser language
      const browserLang = navigator.language.toLowerCase()
      if (browserLang.startsWith("zh")) {
        setLanguage("zh")
      }
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("preferred-language", lang)
  }

  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
