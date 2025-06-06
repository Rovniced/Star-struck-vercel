"use client"

import { Github, Heart } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          {/* Open Source Link */}
          <div className="flex items-center space-x-2">
            <Github className="h-5 w-5 text-muted-foreground" />
            <a
              href="https://github.com/Rovniced/Star-struck-vercel/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              {t("openSourceOnGitHub")}
            </a>
          </div>

          {/* v0.dev Attribution */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>{t("builtWith")}</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>{t("by")}</span>
            <a
              href="https://v0.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:underline"
            >
              v0.dev
            </a>
          </div>

          {/* Additional Info */}
          <p className="text-xs text-muted-foreground max-w-md">{t("footerDescription")}</p>
        </div>
      </div>
    </footer>
  )
}
