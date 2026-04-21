"use client"

import React, { useState } from "react"
import dynamic from "next/dynamic"
import { FileText, Sparkles, AlertCircle } from "lucide-react"
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

    const handleOpenChange = (open: boolean) => {
        if (!open && analyzing) return
        if (!open) onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col p-0 glass-panel border-white/20 shadow-2xl backdrop-blur-3xl">
                <DialogHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-white/10 shrink-0 bg-white/5">
                    <div className="flex items-center justify-between">
                         <div className="space-y-1">
                            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl font-black uppercase tracking-tight">
                                <div className="p-1.5 sm:p-2 bg-primary/20 rounded-lg sm:rounded-xl shrink-0">
                                    <IconChartBar className="text-primary size-5 sm:size-6" />
                                </div>
                                <span className="truncate">Vector Analysis</span>
                            </DialogTitle>
                            {jobTitle && (
                                <DialogDescription className="text-[10px] sm:text-sm text-muted-foreground font-medium line-clamp-1">
                                    Strategic alignment with <span className="text-foreground font-bold">{jobTitle}</span>
                                </DialogDescription>
                            )}
                         </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* ... (loading/error sections same as before) */}
                    {analyzing ? (
                        <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-4 sm:gap-6">
                            <div className="relative size-16 sm:size-20">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                <div className="absolute inset-4 rounded-full border-2 border-primary/10 border-b-primary animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                            </div>
                            <div className="text-center space-y-1 sm:space-y-2 px-4">
                                <p className="text-base sm:text-lg font-bold">Resyncing Neurals</p>
                                <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mx-auto">
                                   Recalculating alignment matrices and generating improvement vectors…
                                </p>
                            </div>
                        </div>

                    ) : analysisError ? (
                        /* ── Error ──────── */
                        <div className="flex flex-col items-center justify-center py-12 sm:py-20 gap-4 sm:gap-6 text-center px-6 sm:px-8">
                            <div className="size-12 sm:size-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <AlertCircle size={24} className="text-amber-500 sm:size-[32px]" />
                            </div>
                            <div className="space-y-1 sm:space-y-2">
                                <p className="text-base sm:text-lg font-bold">Sync Interrupted</p>
                                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">{analysisError}</p>
                            </div>
                            <Button onClick={onAnalyzeAgain} className="rounded-xl h-10 sm:h-12 px-6 sm:px-8 font-bold text-xs sm:text-sm">
                                <IconChartBar className="mr-2 h-4 w-4" />
                                Retry Diagnostic
                            </Button>
                        </div>
                    ) : analysisResult ? (
                        <Tabs defaultValue="analysis" className="flex flex-col h-full">
                            <div className="px-5 sm:px-8 pt-4 sm:pt-6">
                                <TabsList className="w-full h-10 sm:h-12 bg-white/5 border border-white/10 rounded-xl p-1">
                                    <TabsTrigger value="analysis" className="flex-1 h-full rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-primary">
                                        Alignment
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="enhanced"
                                        className="flex-1 h-full rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-widest data-[state=active]:bg-white/10 data-[state=active]:text-primary gap-1.5 sm:gap-2"
                                        disabled={!hasEnhancedResume}
                                    >
                                        <Sparkles size={12} className="sm:size-[14px]" />
                                        Optimized
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="analysis" className="px-5 sm:px-8 pb-10 mt-4 sm:mt-6 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
                                <div className="glass bg-white/5 rounded-3xl p-6 sm:p-8 border-white/10 flex flex-col items-center sm:flex-row gap-6 sm:gap-10">
                                    <div className="w-full sm:w-64 shrink-0 flex flex-col items-center">
                                        <div className="w-48 sm:w-full">
                                            <GaugeComponent
                                                type="semicircle"
                                                arc={{
                                                    colorArray: ["#FF2121", "#FFA500", "#00FF15"],
                                                    padding: 0.02,
                                                    width: 0.15,
                                                    subArcs: [
                                                        { limit: 40 },
                                                        { limit: 60 },
                                                        { limit: 100 },
                                                    ],
                                                }}
                                                pointer={{ type: "blob", animationDelay: 0 }}
                                                value={Math.round(analysisResult.original_score * 100)}
                                            />
                                        </div>
                                        <div className="text-center -mt-2 sm:-mt-4 space-y-0.5 sm:space-y-1">
                                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Alignment Score</span>
                                            <h4 className="text-3xl sm:text-4xl font-black text-primary">{Math.round(analysisResult.original_score * 100)}%</h4>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 w-full">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 text-center sm:text-left">Vector Highlights</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                                            <div className="glass bg-green-500/5 border-green-500/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left">
                                                <span className="text-[10px] sm:text-sm font-bold text-green-500">Matched</span>
                                                <span className="text-lg sm:text-xl font-black text-green-500">{matchedSkills.length}</span>
                                            </div>
                                            <div className="glass bg-red-500/5 border-red-500/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-center sm:justify-between text-center sm:text-left">
                                                <span className="text-[10px] sm:text-sm font-bold text-red-500">Gap Logic</span>
                                                <span className="text-lg sm:text-xl font-black text-red-500">{missingSkills.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-2">Matched Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {matchedSkills.map((skill, i) => (
                                                <Badge key={i} className="bg-primary/10 text-primary border-primary/20 rounded-lg px-3 py-1 font-bold text-xs">
                                                    {skill.skill}
                                                </Badge>
                                            ))}
                                        </div>
                                     </div>
                                     <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-2">Skill Gaps</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {missingSkills.map((skill, i) => (
                                                <Badge key={i} variant="outline" className="border-white/10 text-muted-foreground rounded-lg px-3 py-1 font-medium text-xs">
                                                    {skill.skill}
                                                </Badge>
                                            ))}
                                        </div>
                                     </div>
                                </div>

                                {/* Improvements */}
                                {improvements.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground px-2">Improvement Vectors</h4>
                                        <div className="glass bg-white/5 rounded-2xl border-white/10 p-2">
                                            {visibleImprovements.map((imp, i) => (
                                                <div key={i} className="flex gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors group">
                                                    <span className="size-6 shrink-0 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold mt-0.5 group-hover:scale-110 transition-transform">
                                                        {i + 1}
                                                    </span>
                                                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">{imp.suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                        {improvements.length > 4 && (
                                            <button
                                                onClick={() => setShowAllImprovements(v => !v)}
                                                className="w-full text-center py-2 text-[10px] uppercase font-black tracking-widest text-primary hover:underline"
                                            >
                                                {showAllImprovements ? "Collapse Vectors" : `Expand ${improvements.length - 4} More Vectors`}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="enhanced" className="px-8 pb-10 mt-6 animate-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between glass bg-primary/5 border-primary/20 p-6 rounded-2xl">
                                        <div className="space-y-1">
                                            <p className="text-lg font-bold flex items-center gap-3">
                                                <Sparkles size={20} className="text-primary" />
                                                The Optimized Identity
                                            </p>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                                                Injected with missing market logic
                                            </p>
                                        </div>
                                        <Button size="sm" onClick={handleCopyResume} className="rounded-xl h-10 px-6 font-bold shadow-lg shadow-primary/20">
                                            <FileText className="mr-2 h-4 w-4" />
                                            {copied ? "Copied" : "Copy Source"}
                                        </Button>
                                    </div>

                                    <div className="glass bg-white/5 rounded-3xl border-white/20 overflow-hidden shadow-2xl">
                                        <div className="p-8 overflow-y-auto max-h-[450px] custom-scrollbar selection:bg-primary/30">
                                            <MarkdownResumeViewer markdown={analysisResult.updated_resume_markdown!} />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                    ) : (
                        /* ── Empty ────────────────────── */
                        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                            <div className="size-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center rotate-6">
                                <IconChartBar size={40} className="text-primary/40" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-bold">Diagnostic Ready</p>
                                <p className="text-muted-foreground max-w-xs mx-auto">
                                    Initialize neural analysis to calculate your strategic market fit.
                                </p>
                            </div>
                            <Button onClick={onAnalyzeAgain} className="rounded-xl h-12 px-10 font-black uppercase tracking-widest shadow-xl shadow-primary/10">
                                Initialize Analysis
                            </Button>
                        </div>
                    )}
                </div>
                
                <div className="px-8 py-4 bg-white/5 border-t border-white/10 flex justify-end">
                    <Button variant="ghost" onClick={onClose} className="rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-white/10">
                        Close Terminal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
