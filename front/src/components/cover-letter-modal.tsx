"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useResumeStore } from '@/store/resume-store'
import { getCfAuthCookie } from '@/utils/cookie'
import { QuillEditor, type QuillEditorHandle } from './quill-editor'
import { FileDown, Loader2 } from 'lucide-react'
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
            <DialogContent className="max-w-4xl h-[100vh] flex flex-col">
                <div className="flex items-start justify-between">
                    <DialogHeader>
                        <DialogTitle>Cover Letter Generator</DialogTitle>
                        <DialogDescription>
                            Review and edit your AI-generated cover letter below.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex shrink-0 mr-8">
                        <Button onClick={handleDownloadPdf} disabled={loading || !content}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center flex-col gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">Generating your cover letter...</p>
                        </div>
                    ) : (
                        <div className="h-screen max-h-[500px] flex-1 border rounded-md">
                            <QuillEditor
                                ref={editorRef}
                                value={content}
                                onChange={setContent}
                                className="h-[400px] mb-12"
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
