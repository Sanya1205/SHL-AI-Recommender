import { useRef, useState, type DragEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { UploadCloud, ClipboardType, Loader2, Sparkles } from "lucide-react";
import { parseJobDescriptionFile, sendChatMessage } from "../services/api";
import type { LayoutContext } from "./Layout";
import type { ChatMessage } from "../types";

export default function UploadJD() {
  const { createConversation, updateConversation } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPaste, setShowPaste] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const runThroughChat = async (jdMessage: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const convId = createConversation();
      const messages: ChatMessage[] = [{ role: "user", content: jdMessage }];
      const response = await sendChatMessage(messages);
      const finalMessages: ChatMessage[] = [...messages, { role: "assistant", content: response.reply }];
      updateConversation(convId, finalMessages, response.recommendations);
      navigate("/");
    } catch {
      setError("Couldn't reach the assessment service. Please check the API is running and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    try {
      const { message } = await parseJobDescriptionFile(file);
      await runThroughChat(message);
    } catch {
      setError("Couldn't parse that file. Try PDF, DOCX, or paste the text instead.");
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    runThroughChat(`Here is a job description, please recommend matching SHL assessments:\n\n${pastedText}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold text-primary-hover">New Role Assessment</h2>
        <p className="text-text-secondary">
          Upload a job description to get AI-powered assessment recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {!showPaste ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`glass-panel flex min-h-[380px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-outline"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={40} className="mb-4 animate-spin text-primary-hover" />
                  <p className="text-text-secondary">Analyzing job description…</p>
                </>
              ) : (
                <>
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-variant">
                    <UploadCloud size={40} className="text-primary-hover" />
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-text-primary">Drag &amp; Drop Job Description</h4>
                  <p className="mb-6 max-w-sm text-sm text-text-secondary">
                    Supports PDF, DOCX, and TXT files. Max file size 10MB.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-xl bg-primary/20 px-5 py-3 text-sm font-medium text-primary-hover transition-all hover:brightness-110"
                    >
                      <UploadCloud size={16} /> Choose File
                    </button>
                    <button
                      onClick={() => setShowPaste(true)}
                      className="flex items-center gap-2 rounded-xl bg-surface-variant px-5 py-3 text-sm font-medium text-text-primary transition-all hover:bg-surface"
                    >
                      <ClipboardType size={16} /> Paste Text
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-outline p-6">
              <div className="mb-4 flex items-center justify-between">
                <h5 className="text-lg font-bold text-text-primary">Paste JD Content</h5>
                <button onClick={() => setShowPaste(false)} className="text-text-secondary hover:text-text-primary">
                  Cancel
                </button>
              </div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={12}
                placeholder="Paste the job description text here…"
                className="w-full resize-none rounded-xl border border-outline bg-surface p-4 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-primary focus:outline-none"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handlePasteSubmit}
                  disabled={isProcessing || !pastedText.trim()}
                  className="flex items-center gap-2 rounded-xl primary-gradient px-6 py-3 text-sm font-bold text-white shadow-glow-sm disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Analyze Text
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="glass-panel rounded-2xl border border-outline p-6">
            <h5 className="mb-4 flex items-center gap-2 font-bold text-primary-hover">
              <Sparkles size={18} /> AI Extraction
            </h5>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li>
                <p className="font-medium text-text-primary">Automatic Skill Mapping</p>
                <p className="text-xs">Identifies must-have vs nice-to-have skills instantly.</p>
              </li>
              <li>
                <p className="font-medium text-text-primary">Cognitive Profile</p>
                <p className="text-xs">Determines required logic and reasoning levels for the role.</p>
              </li>
              <li>
                <p className="font-medium text-text-primary">Assessment Tailoring</p>
                <p className="text-xs">Recommends SHL assessments straight from the live catalog.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
