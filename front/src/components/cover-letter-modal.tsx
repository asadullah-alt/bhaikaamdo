"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useResumeStore } from '@/store/resume-store'
import { getCfAuthCookie } from '@/utils/cookie'
import { QuillEditor, type QuillEditorHandle } from './quill-editor'
import { FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'

interface CoverLetterModalProps {
    isOpen: boolean
    onClose: () => void
    jobId: string
}

export function CoverLetterModal({ isOpen, onClose, jobId }: CoverLetterModalProps) {
    const { selectedResumeId } = useResumeStore()
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const editorRef = React.useRef<QuillEditorHandle>(null)

    const generateCoverLetter = useCallback(async () => {
        if (!selectedResumeId) {
            toast.error("Please select a resume first")
            return
        }

        try {
            setLoading(true)
            const token = getCfAuthCookie()

            const response = await fetch('https://resume.bhaikaamdo.com/api/v1/cover-letters/getCoverletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    job_id: jobId,
                    resume_id: selectedResumeId,
                    token: token
                })
            })

            const data = await response.json()

            if (data.cover_letter) {
                setContent(data.cover_letter)
            } else {
                toast.error("Failed to generate cover letter")
            }
        } catch (error) {
            console.error("Error generating cover letter:", error)
            toast.error("An error occurred while generating the cover letter")
        } finally {
            setLoading(false)
        }
    }, [jobId, selectedResumeId])

    useEffect(() => {
        if (isOpen && selectedResumeId) {
            generateCoverLetter()
        }
    }, [isOpen, selectedResumeId, generateCoverLetter])

    const handleDownloadPdf = async () => {
        try {
            const { pdfExporter } = await import('quill-to-pdf')
            const quill = editorRef.current?.getQuill()

            if (!quill) {
                toast.error("Editor not ready")
                return
            }

            const delta = quill.getContents()
            const blob = await pdfExporter.generatePdf(delta)
            saveAs(blob, 'cover-letter.pdf')

            toast.success("Downloaded as PDF")
        } catch (error) {
            console.error("Error downloading PDF:", error)
            toast.error("Failed to download PDF")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 glass-panel border-white/20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
                <DialogHeader className="px-8 pt-8 pb-6 border-b border-white/10 shrink-0 bg-white/5">
                    <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <DialogTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <FileDown className="text-primary" size={24} />
                                </div>
                                Career Narrative
                            </DialogTitle>
                            <DialogDescription className="text-sm text-muted-foreground font-medium">
                                Reviewing and refining your <span className="text-foreground font-bold italic underline decoration-primary">AI-synthesized</span> introduction.
                            </DialogDescription>
                         </div>
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="premium"
                                onClick={handleDownloadPdf} 
                                disabled={loading || !content}
                                className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                Export as PDF
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white/5">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center flex-col gap-6 py-24">
                            <div className="relative size-16">
                                <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                <div className="absolute inset-2 rounded-full border border-primary/10 border-b-primary animate-spin [animation-duration:1s] [animation-direction:reverse]" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-lg font-bold">Synthesizing Narrative</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Scanning background for optimal fit…</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col bg-white overflow-hidden m-4 rounded-2xl border border-white/20 shadow-inner">
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <QuillEditor
                                    ref={editorRef}
                                    value={content}
                                    onChange={setContent}
                                    className="h-full min-h-[500px]"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                        Luminous Engine v3.1 | Core Sync Ready
                    </p>
                    <Button variant="ghost" onClick={onClose} className="rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-white/10">
                        Cancel Transmission
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
