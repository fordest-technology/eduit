"use client"

import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const plans = [
    {
        name: "Professional",
        price: "2,000",
        period: "student / term",
        desc: "Ideal for schools needing full automation, insights and management.",
        features: [
            "Up to 2,000 students",
            "Advanced analytics",
            "Financial hub",
            "Priority support",
            "Mobile access",
            "Custom branding"
        ],
        popular: true,
        cta: "Join Waitlist"
    },
    {
        name: "Enterprise",
        price: "Custom",
        period: "",
        desc: "For large institutions and expansive education networks.",
        features: [
            "Unlimited students",
            "Dedicated account manager",
            "Custom integrations & APIs",
            "On-site training",
            "24/7 phone support",
            "SLA guarantees"
        ],
        cta: "Join Waitlist"
    }
]

export function PricingSection() {
    return (
        <section id="pricing" className="py-32 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <motion.h2
                        className="text-[13px] font-black text-orange-600 uppercase tracking-[0.3em]"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        PRICING
                    </motion.h2>
                    <motion.h3
                        className="text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight font-sora"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        Flexible Plans for Every Institution
                    </motion.h3>
                    <p className="text-lg text-slate-500 font-medium pt-2">
                        Transparent pricing that grows with your school.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto justify-center">
                    {plans.map((p, i) => (
                        <motion.div
                            key={p.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`flex-1 p-10 md:p-12 rounded-[3.5rem] flex flex-col justify-between transition-all duration-500 border ${p.popular
                                    ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-[0_30px_60px_-15px_rgba(15,23,42,0.3)] scale-[1.05] z-10'
                                    : 'bg-white border-slate-100 hover:border-orange-500/30'
                                }`}
                        >
                            <div className="space-y-10">
                                <div className="space-y-4">
                                    {p.popular && (
                                        <span className="bg-[#f97316] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] inline-block mb-2">
                                            MOST POPULAR
                                        </span>
                                    )}
                                    <h4 className={`text-2xl font-black font-sora ${p.popular ? 'text-white' : 'text-[#0f172a]'}`}>
                                        {p.name}
                                    </h4>
                                </div>

                                <div>
                                    <div className="flex items-baseline gap-1">
                                        {p.price !== "Custom" && (
                                            <span className={`text-[28px] font-black mr-1 ${p.popular ? 'text-white/60' : 'text-[#0f172a]/40'}`}>₦</span>
                                        )}
                                        <span className={`text-6xl font-black font-sora tracking-tighter ${p.popular ? 'text-white' : 'text-[#0f172a]'}`}>
                                            {p.price}
                                        </span>
                                        {p.period && (
                                            <span className={`text-sm font-bold ml-2 ${p.popular ? 'text-white/50' : 'text-slate-400'}`}>
                                                / {p.period}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`mt-6 text-[15px] font-medium leading-relaxed italic ${p.popular ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {p.desc}
                                    </p>
                                </div>

                                <div className="space-y-5">
                                    {p.features.map((f) => (
                                        <div key={f} className="flex gap-4 items-center">
                                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${p.popular ? 'bg-orange-500/10' : 'bg-green-50'}`}>
                                                <CheckCircle2 className={`h-4 w-4 ${p.popular ? 'text-orange-500' : 'text-green-500'}`} />
                                            </div>
                                            <span className={`text-[15px] font-bold ${p.popular ? 'text-slate-300' : 'text-slate-600'}`}>{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-14">
                                <Link href="#waitlist">
                                    <Button
                                        className={`w-full h-16 rounded-[1.25rem] text-[17px] font-black transition-all hover:scale-[1.02] active:scale-95 shadow-lg ${p.popular
                                                ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-900/20'
                                                : 'bg-[#0f172a] hover:bg-[#1e293b] text-white shadow-slate-900/10'
                                            }`}
                                    >
                                        {p.cta}
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
