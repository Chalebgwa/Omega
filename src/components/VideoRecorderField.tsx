import { useEffect, useRef, useState } from 'react'

interface VideoRecorderFieldProps {
  id: string
  label: string
  onChange: (file: File | null) => void
  existingVideoUrl?: string | null
  helperText?: string
}

const RECORDING_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
]

function formatRecordingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined
  }

  return RECORDING_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType))
}

function fileExtensionForMimeType(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4'
  if (mimeType.includes('ogg')) return 'ogv'
  return 'webm'
}

export function VideoRecorderField({
  id,
  label,
  onChange,
  existingVideoUrl = null,
  helperText = 'Record directly from your camera. You can re-record before saving.',
}: VideoRecorderFieldProps) {
  const liveVideoRef = useRef<HTMLVideoElement | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const objectUrlRef = useRef<string | null>(null)

  const [liveStream, setLiveStream] = useState<MediaStream | null>(null)
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setLiveStream(null)

    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null
    }
  }

  const clearRecordedPreview = (notifyChange = false) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setRecordedPreviewUrl(null)
    if (notifyChange) {
      onChange(null)
    }
  }

  const enableCamera = async (): Promise<boolean> => {
    if (streamRef.current) {
      return true
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Video recording is not supported in this browser.')
      return false
    }

    setIsCameraStarting(true)
    setError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      streamRef.current = stream
      setLiveStream(stream)
      return true
    } catch (cameraError) {
      console.error('Failed to access camera/microphone:', cameraError)
      setError('Could not access camera/microphone. Check browser permissions and try again.')
      stopStream()
      return false
    } finally {
      setIsCameraStarting(false)
    }
  }

  const stopRecording = () => {
    const recorder = recorderRef.current
    if (!recorder || recorder.state === 'inactive') {
      return
    }

    recorder.stop()
  }

  const startRecording = async () => {
    const cameraReady = await enableCamera()
    if (!cameraReady || !streamRef.current) {
      return
    }

    setError('')
    clearRecordedPreview(true)

    try {
      const mimeType = getSupportedMimeType()
      const recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current)

      chunksRef.current = []
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blobType = recorder.mimeType || mimeType || 'video/webm'
        const blob = new Blob(chunksRef.current, { type: blobType })
        if (blob.size === 0) {
          setError('Recording failed. Try recording again.')
          setIsRecording(false)
          stopStream()
          return
        }

        const extension = fileExtensionForMimeType(blobType)
        const file = new File([blob], `recording-${Date.now()}.${extension}`, { type: blobType })

        clearRecordedPreview()
        const objectUrl = URL.createObjectURL(blob)
        objectUrlRef.current = objectUrl
        setRecordedPreviewUrl(objectUrl)
        onChange(file)
        setIsRecording(false)
        stopStream()
      }

      recorder.start()
      setRecordingSeconds(0)
      setIsRecording(true)
    } catch (recordingError) {
      console.error('Failed to start video recording:', recordingError)
      setError('Unable to start recording. Please try again.')
    }
  }

  useEffect(() => {
    if (!liveVideoRef.current) {
      return
    }

    if (!liveStream) {
      liveVideoRef.current.srcObject = null
      return
    }

    liveVideoRef.current.srcObject = liveStream
    void liveVideoRef.current.play().catch(() => {
      // Playback can be blocked by browser policy until user gesture; safe to ignore.
    })
  }, [liveStream])

  useEffect(() => {
    if (!isRecording) {
      return
    }

    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 250)

    return () => {
      window.clearInterval(interval)
    }
  }, [isRecording])

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.ondataavailable = null
        recorder.onstop = null
        recorder.stop()
      }
      stopStream()
      clearRecordedPreview()
    }
  }, [])

  const previewUrl = recordedPreviewUrl || existingVideoUrl
  const statusClassName = isRecording ? 'recording' : liveStream ? 'ready' : previewUrl ? 'saved' : 'idle'
  const statusLabel = isRecording ? 'Recording' : liveStream ? 'Camera Ready' : previewUrl ? 'Recording Saved' : 'Camera Off'

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>

      <div className="video-recorder-shell">
        <div className="video-recorder-head">
          <span className={`video-status ${statusClassName}`}>{statusLabel}</span>
          {isRecording ? <span className="video-recorder-time">{formatRecordingTime(recordingSeconds)}</span> : null}
        </div>

        <div className="video-preview-wrap">
          {liveStream ? (
            <video id={id} ref={liveVideoRef} className="video-preview" muted playsInline autoPlay />
          ) : previewUrl ? (
            <video id={id} className="video-preview" controls src={previewUrl} />
          ) : (
            <div id={id} className="video-preview video-preview-empty">
              Camera preview appears here
            </div>
          )}
        </div>

        <div className="video-recorder-actions">
          {!liveStream && !isRecording ? (
            <button type="button" className="btn btn-ghost" disabled={isCameraStarting} onClick={() => void enableCamera()}>
              {isCameraStarting ? 'Starting Camera...' : 'Enable Camera'}
            </button>
          ) : null}

          {liveStream && !isRecording ? (
            <button type="button" className="btn btn-secondary" onClick={() => void startRecording()}>
              {previewUrl ? 'Record New Video' : 'Start Recording'}
            </button>
          ) : null}

          {isRecording ? (
            <button type="button" className="btn btn-primary" onClick={stopRecording}>
              Stop Recording
            </button>
          ) : null}

          {liveStream && !isRecording ? (
            <button type="button" className="btn btn-ghost" onClick={stopStream}>
              Turn Off Camera
            </button>
          ) : null}

          {recordedPreviewUrl && !isRecording ? (
            <button type="button" className="btn btn-ghost" onClick={() => clearRecordedPreview(true)}>
              Discard Recording
            </button>
          ) : null}
        </div>
      </div>

      <p className="field-help">{helperText}</p>
      {error ? <div className="notice-error">{error}</div> : null}
    </div>
  )
}
