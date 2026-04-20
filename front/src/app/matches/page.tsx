"use client"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import AuthGuard from "@/components/auth-guard"
import { getAuthToken, jobsApi, userApi, resumesApi } from "@/lib/api"
import { EnrichedMatch } from "@/lib/types"
import { JobMatchCard } from "@/components/job-match-card"
import {
    IconSearch,
    IconAdjustmentsHorizontal,
    IconTarget,
    IconBuilding,
    IconMapPin,
    IconCalendar,
    IconRosette,
    IconBriefcase,
    IconCloudUpload,
    IconChartBar
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badgeTable"
import { UserPreferences } from "@/lib/api/user"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from '@/components/ui/separatorInteractive'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet"
import FileUpload from "@/components/file-upload"
import { toast } from "sonner"
import { setCookie, getCfAuthCookie } from "@/utils/cookie"
import { useResumeStore } from "@/store/resume-store"
import { FileText } from "lucide-react"
import { OpenJobCoverLetterModal } from "@/components/open-job-cover-letter-modal"
import dynamic from "next/dynamic"

const GaugeComponent = dynamic(() => import('react-gauge-component'), { ssr: false })


export default function MatchesPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [matches, setMatches] = useState<EnrichedMatch[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [preferences, setPreferences] = useState<UserPreferences | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)
    const { selectedResumeId, setSelectedResumeId } = useResumeStore()
    const [weightedCount, setWeightedCount] = useState<number | string>("thousands of")
    const CACHE_KEY = 'enriched_matches_cache_v1'
    const CACHE_EXPIRY = 12 * 60 * 60 * 1000 // 12 hours
    const router = useRouter()

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

    const fetchMatches = async (forceRefresh = false) => {
        try {
            const token = getAuthToken()
            if (!token) {
                setError("Session expired. Please log in again.")
                setLoading(false)
                return
            }

            // Check cache
            if (!forceRefresh) {
                const cached = localStorage.getItem(CACHE_KEY)
                if (cached) {
                    try {
                        const { data: cachedData, timestamp } = JSON.parse(cached)
                        if (Date.now() - timestamp < CACHE_EXPIRY) {
                            setMatches(cachedData)
                            if (cachedData.length > 0 && !selectedId) {
                                setSelectedId(cachedData[0].match._id || null)
                            }
                            setLoading(false)
                            return
                        }
                    } catch (e) {
                        console.error("Error parsing cache:", e)
                        localStorage.removeItem(CACHE_KEY)
                    }
                }
            }

            const data = await jobsApi.getEnrichedMatches(token) as EnrichedMatch[]
            const now = new Date()

            // 1. Process dates: if posted in the future, move back 20 days
            const processedDates = data.map(m => {
                if (!m.job_details.datePosted) return m;

                try {
                    const postedDate = new Date(m.job_details.datePosted)

                    // Check if date is in the future
                    if (postedDate > now) {
                        const adjustedDate = new Date(postedDate);
                        adjustedDate.setDate(adjustedDate.getDate() - 20);

                        return {
                            ...m,
                            job_details: {
                                ...m.job_details,
                                // Format back to string (ISO or locale dependent on your API needs)
                                datePosted: adjustedDate.toISOString().split('T')[0]
                            }
                        };
                    }
                } catch (e) {
                    console.error("Error adjusting future date:", e)
                }
                return m;
            })

            // 2. Filter out matches older than one month
            const oneMonthAgo = new Date()
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

            const filtered = processedDates.filter(m => {
                if (!m.job_details.datePosted) return false

                try {
                    const postedDate = new Date(m.job_details.datePosted)
                    return postedDate >= oneMonthAgo
                } catch (e) {
                    return true
                }
            })

            // 3. Sanitize IDs
            const sanitized = filtered.map(m => {
                const matchId = m.match._id;
                return {
                    ...m,
                    job_details: {
                        ...m.job_details,
                        job_id: matchId || m.job_details.job_id
                    }
                };
            });

            // Save to cache and state
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: sanitized,
                timestamp: Date.now()
            }))

            setMatches(sanitized)
            if (sanitized.length > 0 && !selectedId) {
                setSelectedId(sanitized[0].match._id || null)
            }
        } catch (err: unknown) {
            console.error("Error fetching matches:", err)
            setError(err instanceof Error ? err.message : "Failed to load matches.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const token = getAuthToken()
                if (!token) return
                const data = await userApi.getUserPreferences(token)
                setPreferences(data)
            } catch (err) {
                console.error("Error fetching preferences:", err)
            }
        }

        const fetchWeightedCount = async () => {
            try {
                const data = await jobsApi.getWeightedVectorCount()
                if (data && data.weighted_count) {
                    setWeightedCount(data.weighted_count.toLocaleString())
                }
            } catch (err) {
                console.error("Error fetching weighted count:", err)
            }
        }

        const handlePrefsUpdated = () => {
            fetchPreferences()
        }

        const handleResumeUploaded = () => {
            console.log("Resume uploaded event received, refreshing matches...")
            setLoading(true)
            fetchMatches(true)
        }

        fetchMatches()
        fetchPreferences()
        fetchWeightedCount()

        window.addEventListener('preferences-updated', handlePrefsUpdated)
        window.addEventListener('resume-uploaded', handleResumeUploaded)
        return () => {
            window.removeEventListener('preferences-updated', handlePrefsUpdated)
            window.removeEventListener('resume-uploaded', handleResumeUploaded)
        }
    }, [])

    // Fetch resumes to determine resumeId
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

    // Reset analysis when selected match changes
    useEffect(() => {
        setAnalysisResult(null)
        setAnalyzing(false)
    }, [selectedId])

    const analyzeResume = async () => {
        const token = getCfAuthCookie()
        if (!resumeId || !selectedId) {
            console.error('Resume ID or Match ID not available')
            return
        }

        try {
            setAnalyzing(true)

            const payload: Record<string, unknown> = {
                match_id: selectedId,
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
            console.log('Analysis Result:', analysisData.data)
            setAnalysisResult(analysisData.data)
        } catch (error) {
            console.error('Error analyzing resume:', error)
        } finally {
            setAnalyzing(false)
        }
    }

    // Ref for smooth scrolling to analysis results
    const analysisRef = useRef<HTMLDivElement>(null)

    // Scroll to analysis section when analysis completes
    useEffect(() => {
        if (analysisResult && !analyzing && analysisRef.current) {
            analysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }, [analysisResult, analyzing])

    const handleUploadSuccess = async (resume_id: string) => {
        try {
            const token = getAuthToken()
            if (token) {
                await resumesApi.setDefaultResume(resume_id, token)
                setSelectedResumeId(resume_id)
                setCookie('bhaikaamdo_defaultresume', resume_id)
            }
        } catch (e) {
            console.error('Error setting default resume:', e)
        }
        toast.success("Resume uploaded successfully!", {
            description: "Your file has been processed. Refreshing matches…",
        })
        setSheetOpen(false)
        fetchMatches(true)
    }

    const filteredMatches = matches.filter(m => {
        const title = m.job_details.jobTitle?.toLowerCase() || ""
        const company = m.job_details.companyProfile?.companyName?.toLowerCase() || ""
        const query = searchQuery.toLowerCase()
        return title.includes(query) || company.includes(query)
    })

    const selectedMatch = matches.find(m => m.match._id === selectedId)

    return (
        <AuthGuard>
            <div className="h-[calc(100vh-4rem)] flex flex-col bg-background/50">
                <header className="px-4 py-4 md:px-6 border-b bg-background shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Recommended Matches
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative w-full md:w-80">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                <Input
                                    placeholder="Search jobs..."
                                    className="pl-10 h-10 w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-grow flex overflow-hidden">
                    <aside className="w-full md:w-[350px] lg:w-[380px] flex-shrink-0 md:border-r overflow-y-auto bg-muted/20 p-3 space-y-3">
                        {preferences && (
                            <div className="p-3 rounded-lg bg-background border shadow-sm space-y-2 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                                        <IconTarget size={12} />
                                        <span>Target Preferences</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => window.dispatchEvent(new CustomEvent('open-preferences'))}>
                                        <IconAdjustmentsHorizontal size={12} />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {preferences.country && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded h-4 bg-primary/10 text-primary border-none">
                                            {preferences.country}
                                        </Badge>
                                    )}
                                    {preferences.salary_min && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded h-4 bg-green-500/10 text-green-700 border-none">
                                            ${preferences.salary_min / 1000}k+
                                        </Badge>
                                    )}
                                    {preferences.remote_friendly && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded h-4 bg-blue-500/10 text-blue-700 border-none">
                                            Remote
                                        </Badge>
                                    )}
                                    {preferences.city && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded h-4 bg-purple-500/10 text-purple-700 border-none">
                                            {preferences.city}
                                        </Badge>
                                    )}
                                    {preferences.experience !== null && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded h-4 bg-yellow-500/10 text-yellow-700 border-none">
                                            {preferences.experience}y exp
                                        </Badge>
                                    )}
                                    {preferences.visa_sponsorship && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded h-4 bg-orange-500/10 text-orange-700 border-none">
                                            Visa
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {!loading && !error && filteredMatches.length > 0 && (
                            <div className="px-1 py-1 flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                <span>Matches Found</span>
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    {filteredMatches.length}
                                </span>
                            </div>
                        )}

                        {loading ? (
                            [...Array(8)].map((_, i) => (
                                <div key={i} className="h-20 rounded-lg border bg-card animate-pulse" />
                            ))
                        ) : error ? (
                            <div className="p-4 text-center text-destructive text-sm font-medium">{error}</div>
                        ) : filteredMatches.length === 0 ? (
                            selectedResumeId ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                                        <IconBriefcase size={32} className="text-primary" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-base font-semibold text-foreground">Matching in progress</p>
                                        <p className="text-sm text-muted-foreground max-w-[240px]">
                                            We&apos;re processing your resume against {weightedCount} jobs.
                                            Please hold on for 10 seconds. This page will display the closest matching jobs...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-5">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <IconCloudUpload size={32} className="text-primary" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-base font-semibold text-foreground">No matches yet</p>
                                        <p className="text-sm text-muted-foreground max-w-[220px]">
                                            Upload your CV so we can find the best job matches for you.
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="gap-2"
                                        onClick={() => setSheetOpen(true)}
                                    >
                                        <IconCloudUpload size={16} />
                                        Upload your CV
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="space-y-3">
                                {filteredMatches.map((match) => {
                                    const matchId = match.match._id;
                                    if (!matchId) return null;

                                    return (
                                        <JobMatchCard
                                            key={matchId}
                                            match={match}
                                            isActive={selectedId === matchId}
                                            onClick={async () => {
                                                setSelectedId(matchId)

                                                if (match.match.new_matched_job) {
                                                    const token = getAuthToken();
                                                    if (token) {
                                                        try {
                                                            await jobsApi.markMatchSeen(matchId, token);
                                                            setMatches(prev => prev.map(m =>
                                                                m.match._id === matchId
                                                                    ? { ...m, match: { ...m.match, new_matched_job: false } }
                                                                    : m
                                                            ));
                                                        } catch (err) {
                                                            console.error("Error marking match as seen:", err);
                                                        }
                                                    }
                                                }

                                                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                                    router.push(`/matches/${encodeURIComponent(matchId)}`)
                                                }
                                            }}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </aside>

                    <main className="hidden md:block flex-1 min-w-0 overflow-y-auto bg-background p-8">
                        {selectedMatch ? (
                            <div className="max-w-[95%] mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                <header className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className="px-3 py-1">
                                            {selectedMatch.job_details.employmentType}
                                        </Badge>
                                        {selectedMatch.job_details.isRemote && (
                                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">
                                                Remote
                                            </Badge>
                                        )}
                                        {selectedMatch.job_details.isVisaSponsored && (
                                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200">
                                                Visa Sponsored
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-start gap-6">
                                        {/* Left: Title + Company + Location + Buttons */}
                                        <div className="flex-1 space-y-3">
                                            <h1 className="text-2xl lg:text-4xl font-bold tracking-tight">{selectedMatch.job_details.jobTitle}</h1>

                                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-muted-foreground text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <IconBuilding size={16} className="text-primary" />
                                                    <span className="font-semibold text-foreground">
                                                        {selectedMatch.job_details.companyProfile?.companyName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <IconMapPin size={16} />
                                                    <span>
                                                        {[
                                                            selectedMatch.job_details.location?.city,
                                                            selectedMatch.job_details.location?.state,
                                                            selectedMatch.job_details.location?.country
                                                        ].filter(Boolean).join(", ") || selectedMatch.job_details.location?.remoteStatus}
                                                    </span>
                                                </div>
                                                {selectedMatch.job_details.datePosted && (
                                                    <div className="flex items-center gap-1.5">
                                                        <IconCalendar size={16} />
                                                        <span>Posted {selectedMatch.job_details.datePosted}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-3 pt-1">
                                                <Button
                                                    className="h-9 px-6 font-bold"
                                                    asChild
                                                    onClick={async () => {
                                                        const token = getAuthToken();
                                                        if (token && selectedMatch.match._id) {
                                                            try {
                                                                await jobsApi.markMatchApplied(selectedMatch.match._id, token);
                                                            } catch (err) {
                                                                console.error("Error marking match as applied:", err);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <a href={selectedMatch.job_details.job_url} target="_blank" rel="noopener noreferrer">
                                                        Apply Now
                                                    </a>
                                                </Button>
                                                <Button variant="outline" className="h-9 px-6" asChild>
                                                    <Link href={`/matches/${encodeURIComponent(selectedMatch.match._id || '')}`}>Full Page Mode</Link>
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Right: Score Card */}
                                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 text-center min-w-[220px] space-y-2 shrink-0">
                                            <div className="text-xs font-bold text-muted-foreground uppercase">Match Score</div>
                                            <div className="text-3xl font-black text-primary">{Math.round(selectedMatch.match.percentage_match)}%</div>
                                            <div className="flex flex-col gap-1.5 pt-1">
                                                <Button
                                                    size="sm"
                                                    className="w-full h-8 text-xs"
                                                    onClick={analyzeResume}
                                                    disabled={analyzing}
                                                >
                                                    {analyzing ? (
                                                        <>
                                                            <div className="animate-spin mr-1.5 h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
                                                            Analyzing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconChartBar className="mr-1 h-3 w-3" />
                                                            {analysisResult ? 'Analyze Again' : 'Analyze Resume'}
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full h-8 text-xs"
                                                    onClick={() => setIsCoverLetterModalOpen(true)}
                                                >
                                                    <FileText className="mr-1 h-3 w-3" />
                                                    Cover Letter
                                                </Button>
                                            </div>
                                            {selectedMatch.match._id && (
                                                <OpenJobCoverLetterModal
                                                    isOpen={isCoverLetterModalOpen}
                                                    onClose={() => setIsCoverLetterModalOpen(false)}
                                                    matchId={selectedMatch.match._id}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </header>

                                <Separator />

                                {selectedMatch.job_details.extractedKeywords && selectedMatch.job_details.extractedKeywords.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {selectedMatch.job_details.extractedKeywords.map((keyword: string, index: number) => (
                                            <Badge key={index} variant="secondary" className="bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <section className="space-y-4">
                                    <h2 className="text-2xl font-bold">Job Summary</h2>
                                    <p className="text-muted-foreground leading-relaxed text-lg italic bg-primary/5 p-4 rounded-xl border-l-4 border-primary">
                                        {selectedMatch.job_details.jobSummary || "No summary available."}
                                    </p>
                                </section>

                                {selectedMatch.job_details.keyResponsibilities && (
                                    <section className="space-y-4">
                                        <h2 className="text-2xl font-bold">Key Responsibilities</h2>
                                        <ul className="grid gap-3">
                                            {selectedMatch.job_details.keyResponsibilities.map((item, i) => (
                                                <li key={i} className="flex gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                                                    <span className="text-muted-foreground leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {selectedMatch.job_details.qualifications && (
                                    <section className="space-y-6">
                                        <h2 className="text-2xl font-bold">Qualifications</h2>
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold flex items-center gap-2"><IconRosette className="text-primary" />Required</h3>
                                            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                                                {selectedMatch.job_details.qualifications.required.map((q, i) => <li key={i}>{q}</li>)}
                                            </ul>
                                        </div>
                                    </section>
                                )}

                                {/* Resume Analysis Results (shown after analysis) */}
                                {(analyzing || analysisResult) && (
                                    <>
                                        <Separator />
                                        <section ref={analysisRef} className="space-y-4 scroll-mt-4">
                                            <h2 className="text-2xl font-bold">Resume Analysis</h2>
                                            <div className="bg-card rounded-lg p-6 border shadow-sm">
                                                {analyzing ? (
                                                    <div className="flex flex-col items-center py-4">
                                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                                                        <p className="text-sm text-muted-foreground text-center">
                                                            Analyzing your resume against this job posting...
                                                        </p>
                                                    </div>
                                                ) : analysisResult && (
                                                    <div className="space-y-6">
                                                        <div className="flex flex-col items-center">
                                                            <GaugeComponent
                                                                type="semicircle"
                                                                arc={{
                                                                    colorArray: ['#FF2121', '#FFA500', '#00FF15'],
                                                                    padding: 0.02,
                                                                    width: 0.2,
                                                                    subArcs: [
                                                                        { limit: 40 },
                                                                        { limit: 60 },
                                                                        { limit: 100 }
                                                                    ]
                                                                }}
                                                                pointer={{ type: "blob", animationDelay: 0 }}
                                                                value={Math.round(analysisResult.original_score * 100)}
                                                            />
                                                            <div className="text-center mt-4">
                                                                <p className="text-sm font-medium">Resume Score</p>
                                                                <p className="text-2xl font-bold">{Math.round(analysisResult.original_score * 100)}%</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="bg-muted/20 rounded-lg p-4">
                                                                <h4 className="font-medium mb-2">Skill Analysis</h4>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {analysisResult.skill_comparison.map((skill, index) => (
                                                                        skill.resume_mentions > 0 && (
                                                                            <Badge key={index} variant="secondary" className="justify-between">
                                                                                {skill.skill}
                                                                                <span className="ml-2 text-xs">{skill.resume_mentions}✓</span>
                                                                            </Badge>
                                                                        )
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="font-medium mb-2">Missing Skills</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {analysisResult.skill_comparison.map((skill, index) => (
                                                                        skill.resume_mentions === 0 && (
                                                                            <Badge key={index} variant="outline" className="border-red-200 text-red-500">
                                                                                {skill.skill}
                                                                            </Badge>
                                                                        )
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {analysisResult.improvements && (
                                                                <div>
                                                                    <h4 className="font-medium mb-2">Suggested Improvements</h4>
                                                                    <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                                                                        {analysisResult.improvements.slice(0, 3).map((imp, index) => (
                                                                            <li key={index}>{imp.suggestion}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </section>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-10 px-8">
                                <style>{`
                                    @keyframes cf-orbit {
                                        from { transform: rotate(0deg) translateX(72px) rotate(0deg); }
                                        to   { transform: rotate(360deg) translateX(72px) rotate(-360deg); }
                                    }
                                    @keyframes cf-orbit2 {
                                        from { transform: rotate(120deg) translateX(72px) rotate(-120deg); }
                                        to   { transform: rotate(480deg)  translateX(72px) rotate(-480deg); }
                                    }
                                    @keyframes cf-orbit3 {
                                        from { transform: rotate(240deg) translateX(72px) rotate(-240deg); }
                                        to   { transform: rotate(600deg)  translateX(72px) rotate(-600deg); }
                                    }
                                    @keyframes cf-float {
                                        0%,100% { transform: translateY(0); }
                                        50%      { transform: translateY(-10px); }
                                    }
                                    @keyframes cf-arrow {
                                        0%   { transform: translateY(6px);  opacity: 0; }
                                        50%  { transform: translateY(0);    opacity: 1; }
                                        100% { transform: translateY(-6px); opacity: 0; }
                                    }
                                    @keyframes cf-dot {
                                        0%,100% { opacity: 0.25; transform: scale(0.8); }
                                        50%      { opacity: 1;    transform: scale(1.2); }
                                    }
                                    @keyframes cf-ping-slow {
                                        0%   { transform: scale(1);   opacity: 0.5; }
                                        100% { transform: scale(1.9); opacity: 0; }
                                    }
                                `}</style>

                                {selectedResumeId ? (
                                    <>
                                        <div className="relative w-44 h-44 flex items-center justify-center">
                                            <span className="absolute inset-0 rounded-full border border-primary/30"
                                                style={{ animation: 'cf-ping-slow 2.4s ease-out infinite' }} />
                                            <span className="absolute inset-0 rounded-full border border-primary/20"
                                                style={{ animation: 'cf-ping-slow 2.4s ease-out 1.2s infinite' }} />

                                            <div className="z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shadow-lg"
                                                style={{ animation: 'cf-float 3s ease-in-out infinite' }}>
                                                <IconBriefcase size={38} className="text-primary" />
                                            </div>

                                            {[
                                                { anim: 'cf-orbit  3.6s linear infinite', color: 'bg-primary', size: 'w-3   h-3' },
                                                { anim: 'cf-orbit2 3.6s linear infinite', color: 'bg-primary/60', size: 'w-2.5 h-2.5' },
                                                { anim: 'cf-orbit3 3.6s linear infinite', color: 'bg-primary/80', size: 'w-2   h-2' },
                                            ].map((o, i) => (
                                                <span key={i}
                                                    className={`absolute rounded-full ${o.color} ${o.size} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
                                                    style={{ animation: o.anim }} />
                                            ))}
                                        </div>

                                        <div className="text-center space-y-3 max-w-sm">
                                            <p className="text-xl font-bold text-foreground">Matching in progress</p>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                We&apos;re processing your resume against {weightedCount} jobs.
                                                Please hold on for 10 seconds. This page will display the closest matching jobs...
                                            </p>
                                            <div className="flex items-center justify-center gap-1.5 pt-1">
                                                {[0, 0.4, 0.8].map((delay, i) => (
                                                    <span key={i}
                                                        className="w-2 h-2 rounded-full bg-primary/50"
                                                        style={{ animation: `cf-dot 1.2s ease-in-out ${delay}s infinite` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ animation: 'cf-float 3s ease-in-out infinite' }}>
                                            <svg width="140" height="110" viewBox="0 0 140 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M105 70 Q112 70 116 63 Q124 62 124 53 Q124 43 115 40
                                                         Q113 28 102 25 Q96 12 80 14 Q70 8 58 15
                                                         Q44 15 40 27 Q28 30 26 42 Q18 45 18 55
                                                         Q18 64 26 66 Q30 71 36 71 Z"
                                                    fill="currentColor" className="text-primary/10"
                                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

                                                <g style={{ animation: 'cf-arrow 1.6s ease-in-out infinite' }}>
                                                    <line x1="70" y1="95" x2="70" y2="57" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary" />
                                                    <polyline points="56,68 70,55 84,68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary" fill="none" />
                                                </g>

                                                <circle cx="28" cy="30" r="3" fill="currentColor" className="text-primary/30" style={{ animation: 'cf-dot 2s ease-in-out 0s infinite' }} />
                                                <circle cx="112" cy="26" r="2.5" fill="currentColor" className="text-primary/30" style={{ animation: 'cf-dot 2s ease-in-out 0.7s infinite' }} />
                                                <circle cx="120" cy="72" r="2" fill="currentColor" className="text-primary/20" style={{ animation: 'cf-dot 2s ease-in-out 1.3s infinite' }} />
                                            </svg>
                                        </div>

                                        <div className="text-center space-y-3 max-w-sm">
                                            <p className="text-xl font-bold text-foreground">Ready to find your dream job?</p>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                Upload your CV and we&apos;ll match you against thousands of relevant job openings automatically.
                                            </p>
                                            <Button size="sm" className="gap-2 mt-1" onClick={() => setSheetOpen(true)}>
                                                <IconCloudUpload size={16} />
                                                Upload your CV
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent side="right" className="data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right data-[state=open]:duration-500">
                    <SheetHeader>
                        <SheetTitle>Upload Resume</SheetTitle>
                        <SheetDescription>Upload your resume to start matching with jobs. Supports PDF and DOCX formats.</SheetDescription>
                    </SheetHeader>
                    <div className="p-4">
                        <FileUpload onUploadComplete={handleUploadSuccess} />
                    </div>
                    <SheetFooter>
                        <div className="text-xs text-muted-foreground">Resume will be uploaded and processed by our AI.</div>
                    </SheetFooter>
                    <SheetClose />
                </SheetContent>
            </Sheet>
        </AuthGuard>
    )
}