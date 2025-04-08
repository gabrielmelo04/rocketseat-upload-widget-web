import { UploadCloud } from "lucide-react";
import { usePendingUploads } from "../store/uploads";


export function UploadWidgetTitle() {
  const { isThereAnyPendingUploads, globalPercentage } = usePendingUploads()

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium">
      <UploadCloud className="size-4 text-zinc-400" strokeWidth={1.5} />
      {
        isThereAnyPendingUploads ? (
          <span className="flex items-baseline gap-1">
            <span className="text-xs text-zinc-400 tabular-nums">
              Uploading{' '}{globalPercentage}%
            </span>
          </span>
        ) : (
          <span>Faça upload dos seus arquivos</span>
        )
      }
    </div >
  )
}