import { motion } from 'motion/react'
import { useDropzone } from 'react-dropzone'
import CircularProgressBar from './ui/circular-progress-bar'
import { usePendingUploads, useUploads } from '../store/uploads'

export function UploadWidgetDropzone() {
  const amountOfUploads = useUploads(store => store.uploads.size)
  const addUploads = useUploads(store => store.addUploads)

  const { isThereAnyPendingUploads, globalPercentage } = usePendingUploads()

  const { getInputProps, getRootProps, isDragActive } = useDropzone({ // isDragActive verifica se o usuário está arrastando algo
    multiple: true, //Permite vários arquivos
    accept: {
      'image/jpeg': [],
      'image/png': []
    },  // Quais arquivos queremos aceitar
    onDrop(acceptedFiles) { //Função que executa quando o usuário arrastar algo (acceptedFiles, fileRejections, event)
      addUploads(acceptedFiles)
    }
  })
  return (
    <motion.div
      className='px-3 flex flex-col gap-3'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.6
      }}
    >
      <div
        data-active={isDragActive}
        className='cursor-pointer text-zinc-400 bg-black/20 p-5 rounded-lg border border-zinc-700 border-dashed h-32 flex flex-col items-center justify-center gap-1    hover:border-zinc-600 transition-colors data-[active=true]:bg-indigo-500/10 data-[active=true]:border-indigo-500 data-[active=true]:text-indigo-400'
        {...getRootProps()}
      >
        <input type='file' {...getInputProps()} />

        {
          isThereAnyPendingUploads ? (
            <div className='flex flex-col gap-2 items-center'>
              <CircularProgressBar progress={globalPercentage} size={56} strokeWidth={4} />
              <span className='text-xs' >Uploading {amountOfUploads} files...</span>
            </div>
          ) :
            (
              <>
                <span className='text-xs'>Drop your files here or</span>
                <span className='text-xs underline'>Click to open picker</span>
              </>
            )
        }
      </div >

      <span className='text-xxs text-zinc-400'>Only PNG and JPG files are supported.</span>
    </motion.div >
  )
}