"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ExternalLink } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function TokenInfoAlert() {
  const { t } = useLanguage()

  return (
    <Alert className="mb-6">
      <AlertTitle className="font-medium">{t("tokenRequired")}</AlertTitle>
      <AlertDescription className="text-sm">
        <p className="mb-2">{t("tokenDescription")}</p>
        <p className="mb-2">{t("tokenPrivacy")}</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>
            <a
              href="https://github.com/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center"
            >
              {t("tokenSteps.step1")} <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </li>
          <li>{t("tokenSteps.step2")}</li>
          <li>{t("tokenSteps.step3")}</li>
          <li>{t("tokenSteps.step4")}</li>
          <li>{t("tokenSteps.step5")}</li>
        </ol>
      </AlertDescription>
    </Alert>
  )
}
