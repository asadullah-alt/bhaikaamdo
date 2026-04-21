"use client"

import React from 'react'
import { Features } from '@/components/features'
import { HeroHeader } from '@/components/hero-section-1'
import { Zap, Cpu, Users } from 'lucide-react'

const sampleFeatures = [
  {
    id: 1,
    icon: Zap,
    title: 'AI-Powered Custom CV Generation',
    description: 'Analyzes job requirements against your existing profile (CV, LinkedIn, GitHub) to craft a perfectly tailored, genuine resume.',
    image: '/ai_powered_custom_cv.png',
  },
  {
    id: 2,
    icon: Cpu,
    title: 'Intelligent Fit Assessment',
    description: "We check the job fit before creating a CV. If the requirements don't align with your skills, we transparently notify you, saving wasted time.",
    image: '/intelligent_fit_assessment.png',
  },
  {
    id: 3,
    icon: Users,
    title: 'Centralized Application Inbox',
    description: 'Connect your email and see only the essential responses from companies. Our platform filters out inbox clutter.',
    image: '/application_inbox.png',
  },
  {
    id: 4,
    icon: Users,
    title: 'One-Click Job Data Import',
    description: 'Paste a job URL, and our system instantly extracts all requirements for immediate comparison and customization.',
    image: '/one-click-data-import-u-r-a-jackass.png',
  },
  {
    id: 5,
    icon: Users,
    title: 'Application Response Analysis',
    description: 'Our AI interprets company replies, providing you with a clear, concise summary and the status of your application on your dashboard.',
    image: '/application-response-analysis.png',
  },
]

export default function FeaturesPage() {
  return (
    <>
      <HeroHeader />
      
        <Features features={sampleFeatures} progressGradientLight="bg-sky-400" progressGradientDark="bg-sky-600" />
      
    </>
  )
}
