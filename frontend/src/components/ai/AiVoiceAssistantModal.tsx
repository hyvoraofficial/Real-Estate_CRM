'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Phone,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Calendar,
  RotateCcw,
  Building2,
  Clipboard,
  Car,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatBudgetRange, formatPrice } from '../../lib/utils';

interface AiVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated?: () => void;
}

export function AiVoiceAssistantModal({
  isOpen,
  onClose,
  onLeadCreated,
}: AiVoiceAssistantModalProps) {
  // State
  const [inputText, setInputText] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 5-second silence auto-proceed countdown
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestDataRef = useRef({
    inputText: '',
    transcript: '',
    phoneNumber: '',
    selectedImage: null as string | null,
    isProcessing: false,
  });

  // Image upload
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Result state
  const [aiResult, setAiResult] = useState<any | null>(null);

  // Speech Recognition Reference
  const recognitionRef = useRef<any>(null);

  // Sync latest data ref
  useEffect(() => {
    latestDataRef.current = {
      inputText,
      transcript,
      phoneNumber,
      selectedImage,
      isProcessing,
    };
  }, [inputText, transcript, phoneNumber, selectedImage, isProcessing]);

  // Clear silence countdown
  const clearSilenceCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownSeconds(null);
  };

  // Start 5-second silence auto-proceed timer
  const startSilenceCountdown = (overrideText?: string) => {
    clearSilenceCountdown();
    if (latestDataRef.current.isProcessing) return;

    const textToCheck =
      overrideText !== undefined
        ? overrideText
        : latestDataRef.current.inputText || latestDataRef.current.transcript;

    if (!textToCheck || textToCheck.trim().length < 4) return;

    let remaining = 5;
    setCountdownSeconds(remaining);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearSilenceCountdown();
        // Automatically proceed
        handleProcess(overrideText);
      } else {
        setCountdownSeconds(remaining);
      }
    }, 1000);
  };

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }
          setTranscript(fullTranscript);
          setInputText(fullTranscript);

          // Update ref immediately
          latestDataRef.current.transcript = fullTranscript;
          latestDataRef.current.inputText = fullTranscript;

          // Restart 5-second auto-proceed countdown
          startSilenceCountdown(fullTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      clearSilenceCountdown();
    };
  }, []);

  // Cleanup on modal open/close
  useEffect(() => {
    if (!isOpen) {
      clearSilenceCountdown();
      stopSpeaking();
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      }
    }
  }, [isOpen]);

  // Text-To-Speech Function
  const speakText = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle Mic / Voice Recording
  const toggleListening = () => {
    clearSilenceCountdown();
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      setError(null);
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Could not start recognition', err);
        setIsListening(true);
      }
    }
  };

  // Handle Clipboard Paste for Phone
  const handlePastePhone = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        const clean = text.replace(/[^0-9]/g, '');
        if (clean) {
          setPhoneNumber(clean);
          latestDataRef.current.phoneNumber = clean;
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // Handle Image File Select
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        latestDataRef.current.selectedImage = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Process AI Lead Ingestion
  const handleProcess = async (presetText?: string) => {
    clearSilenceCountdown();

    const textToProcess =
      presetText ||
      latestDataRef.current.inputText ||
      latestDataRef.current.transcript ||
      inputText ||
      transcript;
    const phoneToProcess = latestDataRef.current.phoneNumber || phoneNumber;
    const imageToProcess = latestDataRef.current.selectedImage || selectedImage;

    if (!textToProcess.trim() && !imageToProcess && !phoneToProcess.trim()) {
      setError('Please speak into the mic, paste a number, or enter inquiry details.');
      return;
    }

    // Stop listening if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setIsProcessing(true);
    latestDataRef.current.isProcessing = true;
    setError(null);
    setAiResult(null);
    stopSpeaking();

    try {
      let res;
      if (imageToProcess) {
        res = await api.aiProcessImage({
          imageData: imageToProcess,
          notes: textToProcess,
        });
      } else {
        res = await api.aiProcessVoiceText({
          text: textToProcess,
          phoneNumber: phoneToProcess.trim() || undefined,
        });
      }

      setAiResult(res);

      // Trigger text-to-speech audio feedback
      if (res.speechText && speechEnabled) {
        speakText(res.speechText);
      }

      if (onLeadCreated) {
        onLeadCreated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process AI voice input. Please try again.');
    } finally {
      setIsProcessing(false);
      latestDataRef.current.isProcessing = false;
    }
  };

  // Reset for next inquiry
  const handleReset = () => {
    clearSilenceCountdown();
    stopSpeaking();
    setInputText('');
    setPhoneNumber('');
    setTranscript('');
    setSelectedImage(null);
    setAiResult(null);
    setError(null);
    setIsListening(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] luxury-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-secondary/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-md border border-accent/30">
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-foreground tracking-tight">
                  HYVORA AI Voice Assistant
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/25">
                  <Car className="w-3 h-3" />
                  <span>Hands-Free Mode</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Speak or paste inquiry — automatically parses and creates lead records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Speech Toggle */}
            <button
              type="button"
              onClick={() => {
                if (speechEnabled) stopSpeaking();
                setSpeechEnabled(!speechEnabled);
              }}
              title={speechEnabled ? 'Voice output enabled' : 'Voice output muted'}
              className={`p-2 rounded-xl transition-colors ${
                speechEnabled
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                clearSilenceCountdown();
                stopSpeaking();
                onClose();
              }}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-urgent/15 border border-urgent/30 text-urgent text-xs font-semibold animate-in fade-in">
              {error}
            </div>
          )}

          {/* AI Result Card (Shown after processing) */}
          {aiResult && (
            <div className="p-5 rounded-3xl bg-secondary/50 border border-border luxury-card space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">
                      Lead &apos;{aiResult.lead?.customer?.name || aiResult.extracted?.customerName || 'Lead'}&apos; Created Successfully
                    </h3>
                    <p className="text-xs text-success font-medium">
                      Stored in digital repository &amp; assigned to pipeline
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl bg-card hover:bg-secondary text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-accent" />
                  <span>New Lead</span>
                </button>
              </div>

              {/* Extracted Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-card border border-border text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Customer</span>
                  <p className="font-bold text-foreground truncate">
                    {aiResult.lead?.customer?.name || aiResult.extracted?.customerName}
                  </p>
                  <p className="text-[11px] font-mono text-success">
                    {aiResult.lead?.customer?.phone || aiResult.extracted?.phone}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Requirement</span>
                  <p className="font-bold text-primary dark:text-accent truncate">
                    {aiResult.extracted?.bhk || ''} {aiResult.extracted?.propertyType}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-accent" />
                    <span>{aiResult.extracted?.preferredLocation}</span>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Budget Range</span>
                  <p className="font-bold font-mono text-foreground">
                    {formatBudgetRange(aiResult.extracted?.minBudget, aiResult.extracted?.maxBudget)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{aiResult.extracted?.purpose || 'Buying'}</p>
                </div>

                {aiResult.extracted?.followUpDate && (
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-border flex items-center gap-2 text-xs text-foreground bg-warning/10 px-2.5 py-1.5 rounded-xl border border-warning/20">
                    <Calendar className="w-3.5 h-3.5 text-warning" />
                    <span>
                      Scheduled Follow-up: <strong>{aiResult.extracted.followUpDate} at {aiResult.extracted.followUpTime || '16:00'}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Voice Speech Audio Output Status & Replay */}
              {aiResult.speechText && (
                <div className="p-3 rounded-2xl bg-secondary/70 border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-foreground">
                    <div className="w-7 h-7 rounded-xl bg-primary/15 text-primary dark:text-accent flex items-center justify-center shrink-0">
                      <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-bounce text-accent' : ''}`} />
                    </div>
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-foreground block">
                        {isSpeaking ? 'Speaking Audio Confirmation...' : 'Voice Output:'}
                      </span>
                      <span className="text-muted-foreground line-clamp-1 italic">
                        &quot;{aiResult.speechText}&quot;
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {isSpeaking ? (
                      <button
                        type="button"
                        onClick={stopSpeaking}
                        className="px-2.5 py-1 rounded-lg bg-urgent/15 hover:bg-urgent/25 text-urgent font-semibold text-[11px] border border-urgent/30 transition-colors"
                      >
                        Stop Audio
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => speakText(aiResult.speechText)}
                        className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-[11px] shadow transition-colors flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3 text-accent" />
                        <span>Replay Audio</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons for the newly created lead */}
              <div className="flex items-center gap-2 flex-wrap pt-2">
                {aiResult.lead?.customer?.phone && (
                  <a
                    href={`tel:${aiResult.lead.customer.phone}`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-success hover:bg-success/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </a>
                )}

                {aiResult.lead?.customer?.phone && (
                  <a
                    href={`https://api.whatsapp.com/send?phone=91${aiResult.lead.customer.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {aiResult.lead?.id && (
                  <Link
                    href={`/leads/${aiResult.lead.id}`}
                    onClick={onClose}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 shadow transition-all text-center"
                  >
                    <span>Open Lead Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Matching Properties Snapshot */}
              {aiResult.matchedProperties?.length > 0 && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-accent" />
                      <span>{aiResult.matchedProperties.length} Matching Inventory Units Found</span>
                    </span>
                    <Link
                      href="/properties"
                      onClick={onClose}
                      className="text-[11px] text-primary dark:text-accent hover:underline"
                    >
                      View Catalog
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {aiResult.matchedProperties.map((prop: any) => (
                      <div
                        key={prop.id}
                        className="p-2.5 rounded-2xl bg-card border border-border flex items-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border">
                          <img
                            src={
                              prop.images?.[0]?.imageUrl ||
                              'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={prop.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-foreground truncate">{prop.title}</h4>
                          <div className="text-[11px] font-mono text-foreground font-bold">
                            {formatPrice(prop.price)}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {prop.bhk} • {prop.location}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hands-Free Voice Capture Hub */}
          {!aiResult && (
            <div className="space-y-4">
              {/* Giant Mic Button with Waveform */}
              <div className="p-6 rounded-3xl bg-secondary/40 border border-border flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  {/* Pulsing ring when active */}
                  {isListening && (
                    <div className="absolute inset-0 -m-3 rounded-full bg-accent/30 animate-ping" />
                  )}

                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-xl relative z-10 ${
                      isListening
                        ? 'bg-urgent text-white shadow-urgent/50 scale-110'
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-accent/40 hover:scale-105'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-8 h-8 animate-pulse text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-accent" />
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-foreground">
                    {isListening ? 'Listening to your voice...' : 'Tap to Speak (Hands-Free Mode)'}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isListening
                      ? 'Speak naturally — when you pause for 5 seconds, AI automatically proceeds'
                      : 'While on call or driving, tap and speak. AI auto-processes after 5s silence.'}
                  </p>
                </div>

                {/* Animated voice wave indicators */}
                {isListening && (
                  <div className="flex items-center gap-1.5 h-6">
                    <span className="w-1.5 h-3 bg-accent rounded-full animate-bounce" />
                    <span className="w-1.5 h-6 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-4 bg-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="w-1.5 h-7 bg-accent rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1.5 h-3 bg-accent rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                )}

                {/* 5-Second Silence Auto-Proceed Banner */}
                {countdownSeconds !== null && countdownSeconds > 0 && (
                  <div className="w-full p-3.5 rounded-2xl bg-secondary border border-accent/50 shadow-lg flex items-center justify-between gap-3 animate-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-2xl bg-accent text-accent-foreground font-black text-sm flex items-center justify-center shrink-0 shadow-md animate-pulse">
                        {countdownSeconds}s
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-accent animate-spin" />
                          <span>Silence detected — Auto-proceeding in {countdownSeconds}s...</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Creating lead automatically with AI
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={clearSilenceCountdown}
                        className="px-2.5 py-1.5 rounded-xl bg-card hover:bg-secondary text-foreground text-xs font-semibold border border-border transition-colors"
                      >
                        Keep Talking
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProcess()}
                        className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md transition-all flex items-center gap-1"
                      >
                        <span>Proceed Now</span>
                        <ArrowRight className="w-3.5 h-3.5 text-accent" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Live Transcript Preview */}
                {(transcript || isListening) && (
                  <div className="w-full p-3.5 rounded-2xl bg-card border border-border text-foreground text-xs font-medium text-left leading-relaxed">
                    <span className="text-[10px] text-muted-foreground block uppercase font-bold mb-1">
                      Live Voice Transcript:
                    </span>
                    {transcript || 'Start speaking...'}
                  </div>
                )}
              </div>

              {/* Fast Phone Number Paste Box & Image Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Phone number paste box */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1 flex items-center justify-between">
                    <span>Phone Number (Optional Paste)</span>
                    <button
                      type="button"
                      onClick={handlePastePhone}
                      className="text-[10px] text-primary dark:text-accent hover:underline font-semibold flex items-center gap-1"
                    >
                      <Clipboard className="w-3 h-3" />
                      <span>Paste Clipboard</span>
                    </button>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      latestDataRef.current.phoneNumber = e.target.value;
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Image / Screenshot Upload */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    WhatsApp Chat / Screenshot (Optional)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 hover:border-accent transition-colors"
                  >
                    <ImageIcon className="w-4 h-4 text-accent" />
                    <span>{selectedImage ? 'Image Attached ✓' : 'Upload Screenshot / Photo'}</span>
                  </button>
                </div>
              </div>

              {/* Text note / conversation box */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Or Type / Paste Raw Conversation Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Spoke to Rajesh Kumar on 9876543210. Wants 3 BHK in Whitefield under 1.5 Cr, ready to move in 3 months. Schedule follow-up tomorrow at 4 PM."
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    latestDataRef.current.inputText = e.target.value;
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!aiResult && (
          <div className="p-4 border-t border-border bg-secondary/60 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                clearSilenceCountdown();
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleProcess()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-md transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>AI Processing Lead...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Process & Create Lead</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
