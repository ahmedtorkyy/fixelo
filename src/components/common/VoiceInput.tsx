import { useState, useRef, useEffect } from "react"
import { Mic, MicOff } from "lucide-react"
import { showToast } from "@/components/common/Toast"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

type SRResult = { results: { 0: { 0: { transcript: string } } } }
type SRErrorEvent = { error: string }

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<{ stop: () => void } | null>(null)

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    )
  }, [])

  if (!supported) return null

  const startListening = () => {
    const w = window as unknown as Record<string, unknown>
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (typeof SR !== "function") return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SR as any)()
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SRResult) => {
      const transcript = event.results[0][0].transcript
      if (transcript && transcript.trim()) onTranscript(transcript.trim())
      setListening(false)
    }

    recognition.onerror = (event: SRErrorEvent) => {
      setListening(false)
      const messages: Record<string, string> = {
        "not-allowed": "Microphone access is blocked. Allow microphone access in your browser settings, then try again.",
        "service-not-allowed": "Microphone access is blocked. Allow microphone access in your browser settings, then try again.",
        "no-speech": "I didn't hear anything. Tap the mic and speak clearly.",
        "audio-capture": "No microphone was found. Check that one is connected.",
        "network": "Voice input needs an internet connection. Check your connection and try again.",
        "aborted": "",
      }
      const msg = messages[event.error] ?? "Voice input failed. Please try again, or type your problem instead."
      if (msg) showToast(msg, "error")
    }

    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      setListening(false)
      showToast("Voice input could not start. Please type your problem instead.", "error")
    }
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return (
    <button
      type="button"
      onClick={listening ? stopListening : startListening}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={listening ? "Stop voice input" : "Start voice input — speak your problem"}
      title={listening ? "Stop listening" : "Speak your problem"}
      className={`p-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${
        listening
          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse"
          : "bg-surface-800 text-surface-400 hover:text-white hover:bg-surface-700"
      }`}
    >
      {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  )
}