'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Menu, X, Target, Sparkles, TrendingUp, BarChart3, CheckCircle2, Clock, Zap, Moon, Sun, Globe } from 'lucide-react'
import { Button } from '@/components/ui/buttonHome'
import { AnimatedGroup } from '@/components/ui/animated-group'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { Variants } from 'framer-motion'
import { useTheme } from '@/context/theme-context'
import PageAssemblyAnimationWithProps from '@/components/analysis-matcher/page-assembly-with-props'
const transitionVariants: {
    container?: Variants;
    item: Variants;
} = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}
const jobDetails = {
    jobTitle: "Data Scientist",
    company: "AI Corp",
    location: "Boston, MA",
    matchScore: 82
}
const platforms = [
    { name: 'LinkedIn', icon: '/linkedin.svg' },
    { name: 'Indeed', icon: '/indeed.svg' },
    { name: 'Glassdoor', icon: '/glassdoor.svg' },
    { name: 'Monster', icon: '/monster.svg' },
    { name: 'ZipRecruiter', icon: '' },
    { name: 'AngelList', icon: '/wellfound.svg' },
    { name: 'Company Sites', icon: null },
    { name: 'Any Board', icon: null }
]

export function HeroSection() {
    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden">
                <div
                    aria-hidden
                    className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
                    <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-[80rem] -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-24 md:pt-36">

                        <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                                <AnimatedGroup variants={transitionVariants}>
                                    <Link
                                        href="#link"
                                        className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
                                        <span className="text-foreground text-sm">Introducing AI-Powered Career Tools</span>
                                        <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                                        <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                                            <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3" />
                                                </span>
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>



                                </AnimatedGroup>



                                {/* Trust badges */}
                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.1,
                                                    delayChildren: 1,
                                                },
                                            },
                                        },
                                        item: transitionVariants.item,
                                    }}
                                    className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="size-4 text-green-500" />
                                        <span>Free to start</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="size-4 text-blue-500" />
                                        <span>Save 10+ hours per week</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Zap className="size-4 text-yellow-500" />
                                        <span>Land jobs 3x faster</span>
                                    </div>
                                </AnimatedGroup>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Key Features Section */}
                <section className="bg-background pb-16 pt-24 md:pb-32 md:pt-32">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
                                Everything you need to land your dream job
                            </h2>
                            {/* <div className="mt-8 mb-12 max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-border/50 aspect-video relative group">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/H7viGpV0XEo?autoplay=1&mute=1&controls=0&loop=1&playlist=H7viGpV0XEo&modestbranding=1&rel=0"
                                    title="Bhai Kaam Do Product Demo"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                ></iframe>
                                <div className="absolute inset-0 bg-transparent pointer-events-none group-hover:bg-black/5 transition-colors duration-300" />
                            </div> */}
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Powerful AI-driven tools that work together to streamline your entire job search journey
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="bg-muted/50 rounded-2xl border p-6 hover:border-foreground/20 transition-all duration-300 hover:shadow-lg">
                                    <div className="bg-background rounded-xl size-12 flex items-center justify-center mb-4">
                                        <feature.icon className="size-6 text-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="bg-muted/30 py-16 md:py-32">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
                                How Bhai Kaam Do Works
                            </h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                A simple three-step process to transform your job search
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                            {steps.map((step, index) => (
                                <div key={index} className="relative text-center">
                                    <div className="bg-foreground text-background rounded-full size-16 flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                                        {index + 1}
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                                    <p className="text-muted-foreground">{step.description}</p>
                                    {index < steps.length - 1 && (
                                        <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Page Assembly Animation */}
                <section className="bg-background py-16 md:py-32 overflow-hidden">
                    <div className="mx-auto max-w-7xl px-6">
                        <PageAssemblyAnimationWithProps
                            {...jobDetails}
                            autoPlay={false}
                            playOnScroll={true}
                        />
                    </div>
                </section>

                {/* Universal Compatibility Section */}
                <section className="bg-gradient-to-br from-foreground/5 via-background to-foreground/5 py-16 md:py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(74,222,128,0.1),transparent_50%)]" />

                    <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 bg-foreground/10 rounded-full px-4 py-2 mb-6">
                            <Globe className="size-4 text-foreground" />
                            <span className="text-sm font-semibold">Industry First Technology</span>
                        </div>

                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent">
                            Works With Every Job Board. Everywhere.
                        </h2>

                        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                            We&apos;re the <span className="font-semibold text-foreground">only platform on the planet</span> that seamlessly integrates with job postings from <span className="font-semibold text-foreground">any website, anywhere in the world</span>. LinkedIn, Indeed, Glassdoor, company career pages—even that niche industry board nobody&apos;s heard of. If it&apos;s online, we&apos;ve got you covered.
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-12">
                            {platforms.map((platform, index) => (
                                <div
                                    key={index}
                                    className="bg-background/50 backdrop-blur-sm rounded-xl border p-4 hover:border-foreground/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                                    <div className="h-8 mb-3 flex items-center justify-center">
                                        {platform.icon ? (
                                            <Image
                                                src={platform.icon}
                                                alt={`${platform.name} logo`}
                                                width={32}
                                                height={32}
                                                className="h-8 w-auto object-contain dark:invert"
                                            />
                                        ) : (
                                            <Globe className="size-8 text-foreground/60" />
                                        )}
                                    </div>
                                    <p className="font-semibold text-sm text-center mb-2">{platform.name}</p>
                                    <CheckCircle2 className="size-5 text-green-500 mx-auto" />
                                </div>
                            ))}
                        </div>

                        <p className="text-sm text-muted-foreground mt-8 italic">
                            Install one extension. No manual copying. Just pure magic.
                        </p>
                    </div>
                </section>


                {/* Final CTA Section */}
                <section className="bg-muted/30 py-16 md:py-32">
                    <div className="mx-auto max-w-4xl px-6 text-center">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-6">
                            Ready to transform your job search?
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                            Start building tailored resumes, tracking applications, and landing interviews faster—all for free.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                asChild
                                size="lg"
                                className="rounded-xl px-8 text-base">
                                <Link href="/dashboard">
                                    <span>Get Started Free</span>
                                </Link>
                            </Button>
                            <Button
                                asChild
                                size="lg"
                                variant="outline"
                                className="rounded-xl px-8 text-base">
                                <Link href="/pricing">
                                    <span>View Pricing</span>
                                </Link>
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-6">
                            No credit card required
                        </p>
                    </div>
                </section>
            </main>
        </>
    )
}

const features = [
    {
        icon: Target,
        title: 'AI Resume Builder',
        description: 'Create tailored resumes that match job descriptions perfectly. Our AI analyzes keywords and optimizes your content for ATS systems.'
    },
    // {
    //     icon: FileText,
    //     title: 'Job Application Tracker',
    //     description: 'Track every application in one place. Save jobs from 40+ job boards, monitor status, and never lose track of opportunities.'
    // },
    {
        icon: Sparkles,
        title: 'AI Cover Letter Generator',
        description: 'Generate compelling, personalized cover letters in seconds. Using your Resume and Job Description create a tailored cover letter.'
    },
    {
        icon: TrendingUp,
        title: 'Resume Match Score',
        description: 'Get instant match scores comparing your resume to job descriptions with personalized recommendations.'
    },
    {
        icon: BarChart3,
        title: 'Keyword Analyzer',
        description: 'Extract essential keywords from job descriptions and optimize your resume to get noticed by recruiters.'
    },
    // {
    //     icon: Zap,
    //     title: 'Autofill Applications',
    //     description: 'Automate your application process with AI-powered autofill for job application questions and forms.'
    // }
]

const steps = [
    {
        title: 'Upload Your Resume',
        description: 'Add your resume or LinkedIn profile. Our AI learns about your experience and skills.'
    },
    {
        title: 'Find & Save Jobs',
        description: 'Use our extension to save opportunities from any job board. Track everything in one place.'
    },
    {
        title: 'Apply with AI',
        description: 'Generate tailored resumes and cover letters for each role. Track applications and follow up automatically.'
    }
]



const menuItems = [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
]

export const HeroHeader = () => {
    const { theme, toggle } = useTheme()
    const [menuState, setMenuState] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2 group">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12', isScrolled && 'bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggle}
                                    className={cn("border border-gray-200 dark:border-gray-700 rounded-md px-2 flex items-center", isScrolled && 'lg:hidden')}>
                                    {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                                    <span className="ml-2">Theme</span>
                                </Button>
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className={cn(isScrolled && 'lg:hidden')}>
                                    <Link href="/signin">
                                        <span>Login</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className={cn(isScrolled && 'lg:hidden')}>
                                    <Link href="/signup">
                                        <span>Sign Up</span>
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                                    <Link href="/signup">
                                        <span>Get Started</span>
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}

const Logo = ({ className }: { className?: string }) => {
    return (
        <Image
            src="/output_image.png"
            alt="Bhai Kaam Do Logo"
            width={50}
            height={50}
            className={className}
        />
    )

}