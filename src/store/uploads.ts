import { create } from 'zustand';
import { enableMapSet } from "immer"; // Ativar o Map
import { immer } from "zustand/middleware/immer";
import { useShallow } from 'zustand/shallow'
import { uploadFileToStorage } from '../http/upload-file-to-storage';
import { CanceledError } from 'axios';
import { compressImage } from '../utils/compress-image';

export type Upload = {
  name: string
  file: File
  abortController?: AbortController
  status: 'progress' | 'success' | 'error' | 'canceled'
  uploadSizeInBytes: number
  compressedSizeInBytes?: number
  originalSizeInBytes: number,
  remoteUrl?: string
}

type UploadState = {
  uploads: Map<string, Upload>
  addUploads: (files: File[]) => void
  cancelUpload: (uploadID: string) => void
  retryUpload: (uploadID: string) => void
}

enableMapSet();

export const useUploads = create<UploadState, [['zustand/immer', never]]>(immer((set, get) => {

  function updatedUpload(uploadId: string, partialUpload: Partial<Upload>) {
    const upload = get().uploads.get(uploadId)

    if (!upload) {
      return
    }

    set(state => {
      state.uploads.set(uploadId, { ...upload, ...partialUpload })
    })
  }

  async function processUpload(uploadId: string) {

    const upload = get().uploads.get(uploadId)

    if (!upload) {
      return
    }

    const abortController = new AbortController()

    updatedUpload(uploadId, {
      uploadSizeInBytes: 0,
      remoteUrl: undefined,
      compressedSizeInBytes: undefined,
      abortController,
      status: 'progress'
    })

    try {
      const compressedFile = await compressImage({
        file: upload.file,
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.8
      })

      updatedUpload(uploadId, { compressedSizeInBytes: compressedFile.size })

      const { url } = await uploadFileToStorage(
        {
          file: compressedFile,
          onProgress(sizeInBytes) {
            updatedUpload(uploadId, {
              uploadSizeInBytes: sizeInBytes
            })
          }

        }, { signal: abortController.signal }
      )

      updatedUpload(uploadId, {
        status: 'success',
        remoteUrl: url
      })
    } catch (error) {
      console.log(error)

      if (error instanceof CanceledError) {
        updatedUpload(uploadId, {
          status: 'canceled'
        })

        return
      }

      updatedUpload(uploadId, {
        status: 'error'
      })
    }
  }

  function retryUpload(uploadId: string) {
    processUpload(uploadId)

  }

  //Para cancelar o upload
  function cancelUpload(uploadId: string) {
    const upload = get().uploads.get(uploadId)

    if (!upload) {
      return
    }

    upload.abortController?.abort()
  }

  function addUploads(files: File[]) {
    // console.log(files)
    for (const file of files) {
      const uploadId = crypto.randomUUID()


      const upload: Upload = {
        name: file.name,
        file,
        status: 'progress',
        originalSizeInBytes: file.size,
        uploadSizeInBytes: 0
      }

      set(state => {
        state.uploads.set(uploadId, upload)
      })

      processUpload(uploadId)
    }
  }

  return {
    uploads: new Map(),
    addUploads,
    cancelUpload,
    retryUpload
  }
})
)


/* export const useUploads = create<UploadState>((set, get) => {

  function addUploads(files: File[]) {
    // console.log(files)
    for (const file of files) {
      const uploadId = crypto.randomUUID()

      const upload: Upload = {
        name: file.name,
        file
      }

      set(state => {
        return {
          uploads: state.uploads.set(uploadId, upload)
        }
      })
    }
  }

  return {
    uploads: new Map(),
    addUploads
  }
})
  */


export const usePendingUploads = () => {
  return useUploads(useShallow(store => {
    const isThereAnyPendingUploads = Array
      .from(store.uploads.values())
      .some(upload => upload.status === 'progress')

    if (!isThereAnyPendingUploads) {
      return { isThereAnyPendingUploads, globalPercentage: 100 }
    }

    const { total, upload } = Array.from(store.uploads.values())
      .reduce((acc, upload) => {
        if (upload.compressedSizeInBytes) {
          acc.upload += upload.uploadSizeInBytes
        }

        acc.total += upload.compressedSizeInBytes || upload.originalSizeInBytes

        return acc
      },
        {
          total: 0, upload: 0
        }
      )

    const globalPercentage = Math.min(
      Math.round((upload * 100) / total),
      100
    )

    return {
      isThereAnyPendingUploads,
      globalPercentage
    }
  }))
}
