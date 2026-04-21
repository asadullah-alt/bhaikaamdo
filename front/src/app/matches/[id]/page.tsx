"use client"

import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    IconArrowLeft, 
    IconMapPin, 
    IconBuilding, 
    IconCalendar, 
    IconRosette, 
    IconChartBar, 
    IconWorld, 
    IconTerminal2,
    IconSparkles
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separatorInteractive'
import { Badge } from '@/components/ui/badgeTable'
import { getAuthToken, jobsApi } from '@/lib/api'
import { EnrichedMatch } from '@/lib/types'
import { getCfAuthCookie } from '@/utils/cookie'
import { FileText, AlertCircle } from 'lucide-react'
import { OpenJobCoverLetterModal } from '@/components/open-job-cover-letter-modal'



export default function MatchDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise)
    const router = useRouter()
    const [matchData, setMatchData] = useState<EnrichedMatch | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Resume analysis state
    const [analyzing, setAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState<{
        original_score: number;
        new_score: number;
        skill_comparison: Array<{
            skill: string;
            resume_mentions: number;
            job_mentions: number;
        }>;
        improvements: Array<{
            suggestion: string;
            lineNumber: string;
        }>;
        updated_resume_markdown?: string;
    } | null>(null)
    const [resumeId, setResumeId] = useState<string | null>(null)
    const [isCoverLetterModalOpen, setIsCoverLetterModalOpen] = useState(false)

    // Fetch resumes on mount to determine resumeId
    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const token = getCfAuthCookie()
                const resumesResponse = await fetch(
                    `https://resume.bhaikaamdo.com/api/v1/resumes/getAllUserResumes?token=${token}`
                )
                const resumesData = await resumesResponse.json()

                if (
                    !resumesData.data ||
                    !resumesData.data.resumes ||
                    !Array.isArray(resumesData.data.resumes) ||
                    resumesData.data.resumes.length === 0
                ) {
                    console.error('No resumes found')
                    return
                }

                const defaultResumeId = resumesData.data.default_resume
                const userResumes = resumesData.data.resumes
                let targetResumeId = userResumes[0].id

                if (defaultResumeId) {
                    const defaultResumeExists = userResumes.find((r: { id: string }) => r.id === defaultResumeId)
                    if (defaultResumeExists) {
                        targetResumeId = defaultResumeId
                    }
                }

                setResumeId(targetResumeId)
            } catch (error) {
                console.error('Error fetching resumes:', error)
            }
        }

        fetchResumes()
    }, [])

    const analyzeResume = async () => {
        const token = getCfAuthCookie()
        if (!resumeId) {
            console.error('Resume ID not available')
            return
        }

        try {
            setAnalyzing(true)

            const payload: Record<string, unknown> = {
                match_id: params.id,
                resume_id: resumeId,
                token: token
            }

            if (analysisResult) {
                payload.analysis_again = true
            }

            const analysisResponse = await fetch('https://resume.bhaikaamdo.com/api/v1/resumes/improveOpenJob', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            })

            const analysisData = await analysisResponse.json()
            setAnalysisResult(analysisData.data)
        } catch (error) {
            console.error('Error analyzing resume:', error)
        } finally {
            setAnalyzing(false)
        }
    }

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const token = getAuthToken()
                if (!token) {
                    setError("Session expired")
                    setLoading(false)
                    return
                }

                const data = await jobsApi.getEnrichedMatches(token) as EnrichedMatch[]
                const found = data.find(m => m.match._id === params.id)

                if (found) {
                    setMatchData(found)
                    if (found.match.new_matched_job) {
                        jobsApi.markMatchSeen(params.id, token).catch(console.error);
                    }
                } else {
                    setError("Job match not found.")
                }
            } catch (err: unknown) {
                console.error("Error fetching job details:", err)
                setError("Failed to load job details.")
            } finally {
                setLoading(false)
            }
        }
        fetchDetail()
    }, [params.id])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-8">
                     <div className="relative size-24">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                        <div className="absolute inset-4 rounded-full border-2 border-primary/10 border-b-primary animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-xl font-black uppercase tracking-widest text-primary animate-pulse">Synchronizing Neural Data</p>
                        <p className="text-sm text-muted-foreground">Pulling opportunity vectors from the cloud…</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !matchData) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="max-w-md w-full text-center p-12 glass-panel border-red-500/20 bg-red-500/5">
                    <div className="size-20 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={40} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Access Restricted</h2>
                    <p className="text-muted-foreground mb-8">{error || "The requested neural match could not be retrieved from the cluster."}</p>
                    <Button onClick={() => router.push('/matches')} className="w-full h-12 rounded-xl font-bold">
                        Return to Cluster
                    </Button>
                </div>
            </div>
        )
    }

    const { job_details, match } = matchData
    const percentage = Math.round(match.percentage_match)

    return (
        <div className="min-h-screen pt-12 pb-24">
            <div className="container mx-auto px-4 max-w-6xl">
                {/* Back Link */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-8"
                >
                    <Button
                        variant="ghost"
                        className="hover:bg-white/10 rounded-xl px-4 -ml-4 font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                        onClick={() => router.back()}
                    >
                        <IconArrowLeft className="mr-2 h-4 w-4" />
                        Back to Cluster
                    </Button>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Main Sidebar (Score & Quick Actions) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-4 space-y-6 lg:sticky lg:top-8"
                    >
                        <div className="glass-panel p-8 border-white/20 relative overflow-hidden group">
                             {/* Score Arc Visualization */}
                             <div className="relative flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Alignment Logic</span>
                                <div className="relative size-48 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="96" cy="96" r="88"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="12"
                                            className="text-white/5"
                                        />
                                        <motion.circle
                                            cx="96" cy="96" r="88"
                                            fill="none"
                                            stroke="url(#matchGradient)"
                                            strokeWidth="12"
                                            strokeDasharray={2 * Math.PI * 88}
                                            initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                                            animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - percentage / 100) }}
                                            transition={{ duration: 2, ease: "easeOut" }}
                                            strokeLinecap="round"
                                        />
                                        <defs>
                                            <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="oklch(var(--primary))" />
                                                <stop offset="100%" stopColor="oklch(var(--secondary))" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-6 text-center">
                                    <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-4 py-1 text-[10px] font-black uppercase">
                                        High Fit Confidence
                                    </Badge>
                                </div>
                             </div>

                             <Separator className="my-8 bg-white/10" />

                             <div className="space-y-4">
                                <Button
                                    className="w-full h-14 text-lg font-black uppercase tracking-tight rounded-2xl shadow-xl shadow-primary/20 group animate-pulse hover:animate-none"
                                    onClick={async () => {
                                        const token = getAuthToken();
                                        if (token && params.id) {
                                            jobsApi.markMatchApplied(params.id, token).catch(console.error);
                                        }
                                    }}
                                    asChild
                                >
                                    <a href={job_details.job_url} target="_blank" rel="noopener noreferrer">
                                        Initialize Application
                                        <IconSparkles className="ml-2 size-5" />
                                    </a>
                                </Button>
                                {(() => {
                                    try {
                                        if (!job_details.applicationInfo?.applyLink) return null;
                                        const hostname = new URL(job_details.applicationInfo.applyLink).hostname;
                                        return <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Redirecting to {hostname} cluster</p>;
                                    } catch { return null; }
                                })()}
                             </div>
                        </div>

                        {/* Analysis Card */}
                        <div className="glass-panel p-6 border-white/10 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <IconTerminal2 className="text-primary" size={20} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest">Neural Diagnostic</h3>
                            </div>
                            
                            <AnimatePresence mode="wait">
                                {analyzing ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex flex-col items-center py-8 gap-4"
                                    >
                                        <div className="animate-spin rounded-full size-10 border-2 border-primary border-t-transparent" />
                                        <p className="text-xs text-muted-foreground text-center">Simulating market alignment vectors…</p>
                                    </motion.div>
                                ) : analysisResult ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                            <span className="text-xs font-bold text-muted-foreground">Strategic Score</span>
                                            <span className="text-xl font-black text-primary">{Math.round(analysisResult.original_score * 100)}%</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                                                <div className="text-lg font-black text-green-500">
                                                    {analysisResult.skill_comparison.filter(s => s.resume_mentions > 0).length}
                                                </div>
                                                <div className="text-[8px] font-black uppercase tracking-wider text-green-500/70">Matches</div>
                                            </div>
                                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-center">
                                                <div className="text-lg font-black text-red-500">
                                                    {analysisResult.skill_comparison.filter(s => s.resume_mentions === 0).length}
                                                </div>
                                                <div className="text-[8px] font-black uppercase tracking-wider text-red-500/70">Gaps</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                                        Run a deep diagnostic to identify skill gaps and generate a tailored cover letter based on this specific job DNA.
                                    </p>
                                )}
                            </AnimatePresence>

                            <div className="space-y-3 pt-2">
                                <Button 
                                    className="w-full group font-bold bg-white/5 border-white/10 hover:bg-white/10 rounded-xl" 
                                    variant="outline" 
                                    onClick={analyzeResume}
                                    disabled={analyzing}
                                >
                                    <IconChartBar className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                    {analysisResult ? 'Re-Sync Diagnostic' : 'Initialize Diagnostic'}
                                </Button>
                                <Button 
                                    className="w-full group font-bold bg-white/5 border-white/10 hover:bg-white/10 rounded-xl" 
                                    variant="outline"
                                    onClick={() => setIsCoverLetterModalOpen(true)}
                                >
                                    <FileText className="mr-2 h-4 w-4 text-secondary group-hover:scale-110 transition-transform" />
                                    Tailor Cover Letter
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Main Content Column */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Header Panel */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="glass-panel p-8 sm:p-12 border-white/20 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                                <IconSparkles size={80} className="text-primary" />
                            </div>

                            <div className="relative space-y-6">
                                <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-primary/20 text-primary border-primary/20 rounded-lg px-3 py-1 text-[10px] font-black uppercase">
                                        {job_details.employmentType || "Remote"}
                                    </Badge>
                                    {job_details.isRemote && (
                                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 rounded-lg px-3 py-1 text-[10px] font-black uppercase">
                                            Remote Friendly
                                        </Badge>
                                    )}
                                    {job_details.isVisaSponsored && (
                                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-lg px-3 py-1 text-[10px] font-black uppercase flex items-center gap-1.5">
                                            <IconWorld size={12} />
                                            Relocation Vector
                                        </Badge>
                                    )}
                                </div>

                                <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight uppercase italic decoration-primary underline-offset-8">
                                    {job_details.jobTitle}
                                </h1>

                                <div className="flex flex-wrap items-center gap-y-4 gap-x-8">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <IconBuilding size={20} className="text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entity</span>
                                            <span className="font-bold text-lg">{job_details.companyProfile?.companyName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                            <IconMapPin size={20} className="text-secondary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registry</span>
                                            <span className="font-bold">
                                                {[job_details.location?.city, job_details.location?.country].filter(Boolean).join(", ") || "Distributed"}
                                            </span>
                                        </div>
                                    </div>
                                    {job_details.datePosted && (
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                <IconCalendar size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</span>
                                                <span className="font-bold">Active {job_details.datePosted}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Knowledge Vectors (Keywords) */}
                        {job_details.extractedKeywords && job_details.extractedKeywords.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                                className="flex flex-wrap gap-2"
                            >
                                {job_details.extractedKeywords.map((keyword: string, index: number) => (
                                    <div key={index} className="glass bg-white/5 border-white/10 rounded-full px-4 py-1.5 text-xs font-bold text-foreground/80 hover:bg-white/10 hover:text-white transition-all">
                                        {keyword}
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* Job Summary */}
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                            className="space-y-4"
                        >
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-primary px-2">Core Objective</h3>
                            <div className="glass-panel p-8 border-white/10 bg-primary/5">
                                <p className="text-xl font-medium leading-relaxed italic text-foreground/90">
                                    &quot;{job_details.jobSummary || "Market positioning data unavailable for this node."}&quot;
                                </p>
                            </div>
                        </motion.section>

                        {/* Responsibilities */}
                        {job_details.keyResponsibilities && job_details.keyResponsibilities.length > 0 && (
                            <motion.section 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                                className="space-y-6"
                            >
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Operational Vectors</h3>
                                <div className="grid gap-4">
                                    {job_details.keyResponsibilities.map((item, i) => (
                                        <div key={i} className="glass bg-white/5 border-white/10 p-6 rounded-2xl flex gap-6 hover:bg-white/10 transition-colors">
                                            <span className="size-8 shrink-0 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-xs font-black text-primary">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <span className="text-lg font-medium text-foreground/80 leading-relaxed">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.section>
                        )}

                        {/* Qualifications */}
                        {job_details.qualifications && (
                            <motion.section 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                                className="space-y-8"
                            >
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Skill Requirements</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass-panel p-8 border-white/10 space-y-6">
                                        <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                            <IconRosette className="text-primary" />
                                            Target Logic
                                        </h4>
                                        <ul className="space-y-4">
                                            {job_details.qualifications.required.map((q, i) => (
                                                <li key={i} className="flex gap-3 text-sm font-medium text-foreground/70">
                                                    <span className="text-primary mt-1">•</span>
                                                    {q}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {job_details.qualifications.preferred && job_details.qualifications.preferred.length > 0 && (
                                        <div className="glass-panel p-8 border-white/5 bg-white/5 space-y-6">
                                            <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Bonus Vectors</h4>
                                            <ul className="space-y-4">
                                                {job_details.qualifications.preferred.map((q, i) => (
                                                    <li key={i} className="flex gap-3 text-sm font-medium text-muted-foreground">
                                                        <span className="text-muted-foreground/30 mt-1">•</span>
                                                        {q}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </motion.section>
                        )}

                        {/* About Company */}
                        {job_details.companyProfile?.description && (
                            <motion.section 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                                className="glass bg-white/5 border-white/10 p-10 rounded-3xl space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Entity Profile</h3>
                                    {job_details.companyProfile.website && (
                                        <Button variant="link" className="px-0 h-auto text-primary font-black uppercase tracking-widest text-[10px]" asChild>
                                            <a href={job_details.companyProfile.website} target="_blank" rel="noopener noreferrer">
                                                Access Registry
                                            </a>
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                                    {job_details.companyProfile.description}
                                </p>
                            </motion.section>
                        )}
                    </div>
                </div>
            </div>

            <OpenJobCoverLetterModal
                isOpen={isCoverLetterModalOpen}
                onClose={() => setIsCoverLetterModalOpen(false)}
                matchId={params.id}
            />
        </div>
    )
}
