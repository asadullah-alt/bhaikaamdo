"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { FileText, ChevronDown, ChevronUp, Sparkles, AlertCircle } from "lucide-react"
import { IconChartBar } from "@tabler/icons-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badgeTable"
import { Button } from "@/components/ui/button"
import { MarkdownResumeViewer } from "@/components/markdown-resume-viewer"

const GaugeComponent = dynamic(() => import("react-gauge-component"), { ssr: false })

interface AnalysisResult {
    original_score: number
    new_score: number
    skill_comparison: Array<{
        skill: string
        resume_mentions: number
        job_mentions: number
    }>
    improvements: Array<{
        suggestion: string
        lineNumber: string
    }>
    updated_resume_markdown?: string
}

interface ResumeAnalysisModalProps {
    isOpen: boolean
    onClose: () => void
    analyzing: boolean
    analysisResult: AnalysisResult | null
    analysisError?: string | null
    onAnalyzeAgain: () => void
    jobTitle?: string
}

export function ResumeAnalysisModal({
    isOpen,
    onClose,
    analyzing,
    analysisResult,
    analysisError,
    onAnalyzeAgain,
    jobTitle,
}: ResumeAnalysisModalProps) {
    const [showAllImprovements, setShowAllImprovements] = useState(false)
    const [copied, setCopied] = useState(false)

    const matchedSkills = analysisResult?.skill_comparison.filter(s => s.resume_mentions > 0) ?? []
    const missingSkills = analysisResult?.skill_comparison.filter(s => s.resume_mentions === 0) ?? []
    const improvements = analysisResult?.improvements ?? []
    const visibleImprovements = showAllImprovements ? improvements : improvements.slice(0, 4)
    const hasEnhancedResume = !!analysisResult?.updated_resume_markdown

    const handleCopyResume = async () => {
        if (!analysisResult?.updated_resume_markdown) return
        await navigator.clipboard.writeText(analysisResult.updated_resume_markdown)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Don't allow closing while a request is in-flight
    const handleOpenChange = (open: boolean) => {
        if (!open && analyzing) return
        if (!open) onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <IconChartBar className="text-primary" size={22} />
                        Resume Analysis
                    </DialogTitle>
                    {jobTitle && (
                        <DialogDescription className="text-sm text-muted-foreground mt-1">
                            Against <span className="font-medium text-foreground">{jobTitle}</span>
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {/* ── Loading ─────────────────────────────────── */}
                    {analyzing ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-primary border-t-transparent" />
                            <p className="text-sm text-muted-foreground text-center max-w-xs">
                                Analyzing your resume against this job posting. This may take a moment…
                            </p>
                        </div>

                    ) : analysisError ? (
                        /* ── Error / server still processing ──────── */
                        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center px-8">
                            <AlertCircle size={36} className="text-amber-500" />
                            <p className="text-sm font-medium">{analysisError}</p>
                            <Button onClick={onAnalyzeAgain}>
                                <IconChartBar className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                        </div>

                    ) : analysisResult ? (
                        /* ── Results ────────────────────────────────── */
                        <Tabs defaultValue="analysis" className="flex flex-col h-full">
                            <div className="px-6 pt-4">
                                <TabsList className="w-full">
                                    <TabsTrigger value="analysis" className="flex-1">
                                        Analysis Results
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="enhanced"
                                        className="flex-1 gap-1.5"
                                        disabled={!hasEnhancedResume}
                                    >
                                        <Sparkles size={14} />
                                        Enhanced Resume
                                        {!hasEnhancedResume && (
                                            <span className="ml-1 text-[10px] opacity-60">(unavailable)</span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Analysis tab */}
                            <TabsContent value="analysis" className="px-6 pb-6 mt-0">
                                <div className="flex flex-col items-center py-4">
                                    <GaugeComponent
                                        type="semicircle"
                                        arc={{
                                            colorArray: ["#FF2121", "#FFA500", "#00FF15"],
                                            padding: 0.02,
                                            width: 0.2,
                                            subArcs: [
                                                { limit: 40 },
                                                { limit: 60 },
                                                { limit: 100 },
                                            ],
                                        }}
                                        pointer={{ type: "blob", animationDelay: 0 }}
                                        value={Math.round(analysisResult.original_score * 100)}
                                    />
                                    <p className="text-sm font-medium -mt-2">Resume Match Score</p>
                                    <p className="text-3xl font-black text-primary mt-1">
                                        {Math.round(analysisResult.original_score * 100)}%
                                    </p>
                                </div>

                                {/* Skills grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-4 border border-green-200 dark:border-green-900">
                                        <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                                            Matched Skills
                                            <span className="ml-auto text-xs font-normal opacity-70">{matchedSkills.length}</span>
                                        </h4>
                                        {matchedSkills.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {matchedSkills.map((skill, i) => (
                                                    <Badge key={i} variant="secondary"
                                                        className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
                                                        {skill.skill}
                                                        <span className="ml-1 opacity-60">{skill.resume_mentions}✓</span>
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">No matched skills found.</p>
                                        )}
                                    </div>

                                    <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-200 dark:border-red-900">
                                        <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                                            Missing Skills
                                            <span className="ml-auto text-xs font-normal opacity-70">{missingSkills.length}</span>
                                        </h4>
                                        {missingSkills.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {missingSkills.map((skill, i) => (
                                                    <Badge key={i} variant="outline"
                                                        className="border-red-300 text-red-600 dark:border-red-800 dark:text-red-400 text-xs">
                                                        {skill.skill}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">All required skills matched!</p>
                                        )}
                                    </div>
                                </div>

                                {/* Improvements */}
                                {improvements.length > 0 && (
                                    <div className="mt-4 rounded-xl border bg-muted/20 p-4">
                                        <h4 className="text-sm font-semibold mb-3">Suggested Improvements</h4>
                                        <ul className="space-y-2">
                                            {visibleImprovements.map((imp, i) => (
                                                <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5">
                                                        {i + 1}
                                                    </span>
                                                    {imp.suggestion}
                                                </li>
                                            ))}
                                        </ul>
                                        {improvements.length > 4 && (
                                            <button
                                                onClick={() => setShowAllImprovements(v => !v)}
                                                className="mt-3 text-xs text-primary flex items-center gap-1 hover:underline"
                                            >
                                                {showAllImprovements
                                                    ? <><ChevronUp size={12} /> Show less</>
                                                    : <><ChevronDown size={12} /> Show {improvements.length - 4} more</>
                                                }
                                            </button>
                                        )}
                                    </div>
                                )}

                                <Button className="w-full mt-5" variant="outline" onClick={onAnalyzeAgain}>
                                    <IconChartBar className="mr-2 h-4 w-4" />
                                    Analyze Again
                                </Button>
                            </TabsContent>

                            {/* Enhanced Resume tab */}
                            <TabsContent value="enhanced" className="px-6 pb-6 mt-0">
                                {hasEnhancedResume ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-semibold flex items-center gap-2">
                                                    <Sparkles size={14} className="text-primary" />
                                                    AI-Enhanced Resume
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Tailored to match this job&apos;s requirements
                                                </p>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={handleCopyResume}>
                                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                                {copied ? "Copied!" : "Copy"}
                                            </Button>
                                        </div>

                                        {/* Rendered with Classic CV template styling */}
                                        <div className="rounded-xl border overflow-y-auto max-h-[440px] bg-white shadow-inner">
                                            <div className="p-6">
                                                <MarkdownResumeViewer markdown={analysisResult.updated_resume_markdown!} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                        <Sparkles size={32} className="text-muted-foreground/40" />
                                        <p className="text-sm font-medium">Enhanced resume not available</p>
                                        <p className="text-xs text-muted-foreground max-w-xs">
                                            Run the analysis to generate an AI-enhanced version of your resume tailored for this job.
                                        </p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                    ) : (
                        /* ── Empty / not yet run ────────────────────── */
                        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                            <IconChartBar size={40} className="text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Click &quot;Analyze Resume&quot; to get an AI-powered match score and personalized improvement suggestions.
                            </p>
                            <Button onClick={onAnalyzeAgain}>
                                <IconChartBar className="mr-2 h-4 w-4" />
                                Analyze Resume
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
