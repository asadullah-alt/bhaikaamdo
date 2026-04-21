"use client"

import React from "react"
import AuthGuard from '@/components/auth-guard'
import { DataTable } from "@/components/data-table"
import { EmptyJobsState } from "@/components/empty-state"
import { getCfAuthCookie } from "@/utils/cookie"
import { jobsApi } from "@/lib/api"

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
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* <SectionCards /> */}

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[200px] text-red-500">
              {error}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyJobsState />
          ) : (
            <DataTable data={jobs} />
          )}
        </div>
      </div>
    </AuthGuard>
  )
}