"use client"

import React from "react"
import { useRouter } from "next/navigation"
import AuthGuard from '@/components/auth-guard'
import { EmptyJobsState } from "@/components/empty-state"
import { getCfAuthCookie } from "@/utils/cookie"
import { jobsApi } from "@/lib/api"
// ... (rest of the interfaces)

interface CompanyProfile {
  companyName: string;
  industry: string | null;
  website: string | null;
  description: string | null;
}

interface Location {
  city: string | null;
  state: string | null;
  country: string | null;
  remoteStatus: string | null;
}

interface Qualifications {
  required: string[] | null;
  preferred: string[] | null;
}

interface ApplicationInfo {
  howToApply: string | null;
  applyLink: string | null;
  contactEmail: string | null;
}

interface ProcessedJob {
  user_id: string;
  job_id: string;
  jobTitle: string | null;
  companyProfile: CompanyProfile | string;
  location: Location;
  datePosted: string | null;
  employmentType: string | null;
  jobSummary: string | null;
  keyResponsibilities: string[];
  qualifications: Qualifications;
  compensationAndBenefits: string | null;
  applicationInfo: ApplicationInfo;
  extractedKeywords: string[];
  processed_at: string;
  updated_at: string;
  job_url: string;
  isVisaSponsored?: boolean | null;
  isRemote?: boolean | null;
}

interface ApiResponse {
  success: boolean;
  jobs: ProcessedJob[];
}

interface TransformedJob {
  id: number;
  jobTitle: string;
  job_id: string;
  jobSummary: string;
  employmentType: string;
  keyResponsibilities: string[];
  companyProfile: {
    companyName: string;
    industry: string | null;
    website: string | null;
    description: string | null;
  };
  maxSalary: string;
  location: Location;
  qualifications: Qualifications;
  applicationInfo: ApplicationInfo;
  extractedKeywords: string[];
  job_url: string;
  status: string;
  dateSaved: string;
  deadline: string | null;
  dateApplied: string | null;
  followUp: string | null;
  isVisaSponsored: boolean | null;
  isRemote: boolean | null;
}

export default function Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(true)
  const [jobs, setJobs] = React.useState<TransformedJob[]>([])
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = getCfAuthCookie()
        if (!token) {
          setError("Authentication token not found")
          setIsLoading(false)
          return
        }

        const data = await jobsApi.getAllJobs(token) as ApiResponse

        // Transform the API response to match the DataTable schema
        const transformedJobs = data.jobs.map((job: ProcessedJob) => {
          // Parse companyProfile if it's a string
          let companyProfile: CompanyProfile | null = null
          if (typeof job.companyProfile === "string") {
            try {
              companyProfile = JSON.parse(job.companyProfile)
            } catch (e) {
              console.log("Error parsing companyProfile:", e)
              companyProfile = null
            }
          } else {
            companyProfile = job.companyProfile as CompanyProfile
          }

          const companyName = companyProfile?.companyName || 'Unknown Company'

          return {
            job_id: job.job_id,
            jobSummary: job.jobSummary || '',
            id: parseInt(job.job_id) || Math.floor(Math.random() * 1000000),
            jobTitle: job.jobTitle || 'Untitled Position',
            employmentType: job.employmentType || 'Not specified',
            keyResponsibilities: job.keyResponsibilities || [],
            companyProfile: {
              companyName: companyName,
              industry: companyProfile?.industry || null,
              website: companyProfile?.website || null,
              description: companyProfile?.description || null,
            },
            qualifications: {
              required: job.qualifications?.required || [],
              preferred: job.qualifications?.preferred || []
            },
            maxSalary: job.compensationAndBenefits || 'Not specified',
            location: job.location,
            status: job.applicationInfo.howToApply || 'Bookmarked',
            dateSaved: new Date(job.processed_at).toISOString().split('T')[0],
            deadline: null,
            dateApplied: null,
            followUp: null,
            job_url: job.job_url,
            applicationInfo: job.applicationInfo,
            extractedKeywords: job.extractedKeywords || [],
            isVisaSponsored: job.isVisaSponsored ?? null,
            isRemote: job.isRemote ?? null
          } satisfies TransformedJob
        })

        setJobs(transformedJobs)
        setError("")
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [])

  return (
    <AuthGuard>
      <div className="flex flex-1 flex-col p-4 sm:p-6 md:p-8 pt-24 gap-6 md:gap-8">
        {/* Dashboard Header / Welcome */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight italic">Identity <span className="text-primary italic">Center</span></h1>
            <p className="text-sm md:text-base text-muted-foreground font-medium uppercase tracking-widest hidden xs:block">Global market alignment metrics.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
             <div className="glass flex-1 md:flex-none px-6 py-3 rounded-2xl flex flex-col items-center border-white/20">
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Market Pulse</span>
                <span className="text-xl sm:text-2xl font-bold text-primary italic">High Precision</span>
             </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main Sync Panel */}
          <div className="md:col-span-3 space-y-6 order-2 md:order-1">
            <div className="glass-panel p-4 sm:p-6 min-h-[300px] sm:min-h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight">Recent Network Syncs</h2>
                <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest hidden sm:inline">Vector: All Domains</span>
              </div>

              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative size-12">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center text-red-500/80 font-medium">
                  {error}
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <EmptyJobsState />
                </div>
              ) : (
                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* We need to fetch matching data for these jobs if we want to show JobMatchCards. 
                      However, currently the jobs API returns processed jobs without match details.
                      I'll use the job data to show them as glass rows for now.
                   */}
                  {jobs.map((job) => (
                    <div key={job.job_id} className="glass bg-white/5 hover:bg-white/10 p-4 rounded-2xl border-white/10 transition-all group cursor-pointer" 
                         onClick={() => router.push(`/matches?jobId=${job.job_id}`)}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 overflow-hidden">
                          <h3 className="font-bold truncate group-hover:text-primary transition-colors">{job.jobTitle}</h3>
                          <p className="text-xs text-muted-foreground font-medium truncate">{job.companyProfile.companyName}</p>
                        </div>
                        <div className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-1 rounded-md shrink-0">
                          Sync
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side Bento Panel */}
          <div className="md:col-span-1 space-y-6">
            <div className="glass-panel p-6 flex flex-col gap-6 bg-gradient-to-br from-primary/10 to-transparent">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-primary">Vector Coverage</span>
                <h3 className="text-2xl font-bold">Resumes</h3>
              </div>
              <div className="flex flex-col gap-3">
                 <div className="glass bg-white/20 p-4 rounded-xl border-white/10">
                    <span className="text-xs font-bold block mb-1">Eng. Senior Lead</span>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-4/5" />
                    </div>
                 </div>
                 <div className="glass bg-white/20 p-4 rounded-xl border-white/10 opacity-50">
                    <span className="text-xs font-bold block mb-1">Architecture v2</span>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-2/5" />
                    </div>
                 </div>
              </div>
            </div>

            <div className="glass-panel p-6 border-l-4 border-l-primary/50">
              <h3 className="font-bold mb-2">Market Alert</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                3 New high-alignment roles detected in your current vector space.
              </p>
              <button className="mt-4 text-[10px] font-black uppercase text-primary tracking-widest hover:underline" onClick={() => router.push('/matches')}>
                Run Diagnostic →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}