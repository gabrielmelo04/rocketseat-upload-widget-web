import * as Progress from '@radix-ui/react-progress'
import { motion } from 'motion/react'
import { Download, ImageUp, Link2, RefreshCcw, X } from "lucide-react";
import { Button } from "./ui/button";
import { Upload, useUploads } from '../store/uploads';
import { formatBytes } from '../utils/format-bytes';
import { downloadUrl } from '../utils/download-url';

interface UploadWidgetUploadItemProps {
  upload: Upload
  uploadId: string
}

export function UploadWidgetUploadItem({ upload, uploadId }: UploadWidgetUploadItemProps) {
  const cancelUpload = useUploads(store => store.cancelUpload)
  const retryUpload = useUploads(store => store.retryUpload)

  const progress = Math.min(
    upload.compressedSizeInBytes
      ? Math.round((upload.uploadSizeInBytes * 100) / upload.compressedSizeInBytes)
      : 0,
    100,
  )

  return (
    <motion.div
      className="p-3 rounded-lg flex flex-col gap-3 shadow-shape-content bg-white/5 relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.6
      }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium flex items-center gap-1">
          <ImageUp className="size-3 text-zinc-300" strokeWidth={1.5} />
          <span className='max-w-[180px] truncate'>{upload.name}</span>
        </span>

        <span className="text-xxs text-zinc-400 flex gap-1.5 items-center">
          <span className="line-through">{formatBytes(upload.originalSizeInBytes)}</span>
          <div className="size-1 rounded-full bz-zinc-700" />
          <span>
            {formatBytes(upload.compressedSizeInBytes ?? 0)}
            {
              upload.compressedSizeInBytes &&
              <span className="text-green-400 ml-1">
                -{Math.round((upload.originalSizeInBytes - upload.compressedSizeInBytes) * 100 / upload.originalSizeInBytes)}%
              </span>
            }
            <div className="size-1 rounded-full bz-zinc-700" />

            {upload.status === 'progress' && <span>{progress}%</span>}
            {upload.status === 'error' && <span className='text-red-400'>Error</span>}
            {upload.status === 'canceled' && <span className='text-amber-400'>Canceled</span>}
            {upload.status === 'success' && <span className='text-green-400'>Success (100%)</span>}

          </span>
        </span>
      </div>

      <Progress.Root
        data-status={upload.status}
        className='group bg-zinc-800 rounded-full h-1 overflow-hidden'
      >
        <Progress.Indicator
          className='bg-indigo-500 h-1 group-data-[status=success]:bg-green-400 group-data-[status=error]:bg-red-400 group-data-[status=canceled]:bg-amber-400 transition-all'
          style={{ width: upload.status === 'progress' ? `${progress}%` : '100%' }}
        />
      </Progress.Root>

      <div className="absolute top-2 right-2 flex items-center gap-1">
        <Button size="icon-sm" aria-disabled={!upload.remoteUrl} onClick={() => {
          if (upload.remoteUrl) {
            downloadUrl(upload.remoteUrl)
          }
        }}>
          <Download className="size-4" strokeWidth={1.5} />
          <span className="sr-only">Download compressed image</span>
        </Button>

        <Button
          size="icon-sm"
          disabled={!upload.remoteUrl}
          onClick={() => upload.remoteUrl && navigator.clipboard.writeText(upload.remoteUrl)}
        >
          <Link2 className="size-4" strokeWidth={1.5} />
          <span className="sr-only">Copy remote URL</span>
        </Button>

        <Button
          disabled={!['error', 'canceled'].includes(upload.status)}
          onClick={() => retryUpload(uploadId)}
          size="icon-sm"
        >
          <RefreshCcw className="size-4" strokeWidth={1.5} />
          <span className="sr-only">Retry upload</span>
        </Button>

        <Button disabled={upload.status !== 'progress'} size="icon-sm" onClick={() => cancelUpload(uploadId)}>
          <X className="size-4" strokeWidth={1.5} />
          <span className="sr-only">Cancel upload</span>
        </Button>
      </div>
    </motion.div>
  )
}