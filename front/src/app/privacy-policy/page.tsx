
import React from 'react'
import { HeroHeader } from '@/components/hero-section-1'
export default function PrivacyPolicy() {
    return (
        <>
            <HeroHeader />
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="bg-card text-card-foreground shadow-sm border rounded-lg p-8">
                    <h1 className="text-3xl font-bold mb-6 tracking-tight">Privacy Policy</h1>

                    <div className="space-y-6 text-muted-foreground">
                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
                            <p className="leading-relaxed">
                                We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we handle your information when you use our services. By using our platform, you agree to the collection and use of information in accordance with this policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
                            <p className="leading-relaxed">
                                Our data collection is strictly limited to the information necessary to provide our analysis services. Specifically, we collect:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Curriculum Vitae (CV) / Resumes that you upload.</li>
                                <li>Job descriptions and related job data that you submit for analysis.</li>
                            </ul>
                            <p className="leading-relaxed mt-2">
                                We do not track your browsing history outside of our application, nor do we sell your personal data to third parties.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Data</h2>
                            <p className="leading-relaxed">
                                The data you provide is used exclusively for the purpose of:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Analyzing the compatibility between your CV and specific job descriptions.</li>
                                <li>Providing you with insights and feedback to improve your job application materials.</li>
                                <li>Improving the accuracy of our matching algorithms.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Retention and Account Deletion</h2>
                            <p className="leading-relaxed">
                                You retain full control over your data. You may delete your account at any time. Upon deletion, all your personal data, including uploaded CVs and job descriptions, will be permanently removed from our servers in accordance with applicable data protection laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-foreground mb-3">5. Contact Us</h2>
                            <p className="leading-relaxed">
                                If you have any questions about this Privacy Policy, please contact us through our support channels.
                            </p>
                        </section>

                        <div className="pt-6 mt-6 border-t border-border">
                            <p className="text-sm">
                                Last updated: {new Date().toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

