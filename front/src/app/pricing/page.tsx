"use client"

import React from 'react'
import { PricingSection } from '@/components/pricing-section'
import { HeroHeader } from '@/components/hero-section-1'
import { CheckIcon } from '@radix-ui/react-icons'

const sampleTiers = [
    {
    name: 'Job Seeker',
    price: { monthly: 0, yearly: 0 },
    description: 'For individuals getting started',
    features: [
      { name: 'Profile', description: 'Basic profile', included: true },
      { name: 'Email sync', description: 'Sync one email', included: false },
      { name: 'Job Tracker', description: 'Track 5 applications', included: false },
    ],
    highlight: false,
    icon: <CheckIcon />,
  },
  {
    name: 'Causally Looking',
    price: { monthly: 9, yearly: 90 },
    description: 'For fresh graduates or freshly fired individuals',
    features: [
      { name: 'Profile', description: 'Basic profile', included: true },
      { name: 'Email sync', description: 'Sync one email', included: false },
      { name: 'Job Tracker', description: 'Track 25 applications', included: false },
    ],
    highlight: true,
    badge: 'Recommended',
    icon: <CheckIcon />,
  },
  {
    name: 'I need a Job',
    price: { monthly: 29, yearly: 290 },
    description: 'For job seekers who mean business',
    features: [
      { name: 'Profile', description: 'Advanced profile', included: true },
      { name: 'Email sync', description: 'Sync multiple emails', included: true },
      { name: 'Job Tracker', description: 'Track 50 applications', included: false },
    ],
    highlight: true,
    badge: 'Popular',
    icon: <CheckIcon />,
  },{
    name: 'Are you Serious?',
    price: { monthly: 49, yearly: 490 },
    description: 'For job seekers who just want to apply to as many jobs as possible',
    features: [
      { name: 'Profile', description: 'Advanced profile', included: true },
      { name: 'Email sync', description: 'Sync multiple emails', included: true },
      { name: 'Job Tracker', description: 'Track 150 applications', included: false },
    ],
    highlight: false,
    
    icon: <CheckIcon />,
  },
]

export default function PricingPage() {
  return (
    <>
      <HeroHeader />
      <PricingSection tiers={sampleTiers} />
    </>
  )
}
