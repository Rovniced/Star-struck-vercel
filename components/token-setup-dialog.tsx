"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ExternalLink, HelpCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function TokenSetupDialog() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title={t("tokenRequired")}>
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("tokenRequired")}</DialogTitle>
          <DialogDescription>{t("tokenDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm">{t("tokenPrivacy")}</p>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-sm mb-2">{t("tokenSteps.step1")}</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                >
                  {t("tokenSteps.step1")} <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>{t("tokenSteps.step2")}</li>
              <li>{t("tokenSteps.step3")}</li>
              <li>{t("tokenSteps.step4")}</li>
              <li>{t("tokenSteps.step5")}</li>
            </ol>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>💡 {t("tip")}:</strong> {t("tokenAutoSave")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
