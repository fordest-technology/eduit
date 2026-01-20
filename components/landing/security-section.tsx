"use client"

import { motion } from "framer-motion"
import { Shield, Globe, ShieldCheck, HeadphonesIcon } from "lucide-react"

const features = [
    {
        title: "Zero-Trust Security Architecture",
        desc: "End-to-end encryption with full data ownership and role-based access control.",
        icon: <Shield className="h-6 w-6" />
    },
    {
        title: "Distributed Cloud Infrastructure",
        desc: "High availability with global edge performance and ultra-low latency.",
        icon: <Globe className="h-6 w-6" />
    },
    {
        title: "Compliance-Ready by Design",
        desc: "Built to support FERPA, GDPR, and local education data regulations.",
        icon: <ShieldCheck className="h-6 w-6" />
    },
    {
        title: "Expert Architectural Support",
        desc: "Direct access to senior engineers and education technology specialists.",
        icon: <HeadphonesIcon className="h-6 w-6" />
    }
]

export function SecuritySection() {
    return (
        <section className="py-24 bg-[#0a0f1c] text-white overflow-hidden relative">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid lg:grid-cols-2 gap-20 items-center max-w-7xl mx-auto">
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <motion.h2
                                className="text-[13px] font-black text-orange-400 uppercase tracking-[0.3em]"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                            >
                                SECURITY, COMPLIANCE & INFRASTRUCTURE
                            </motion.h2>
                            <motion.h3
                                className="text-4xl md:text-6xl font-black tracking-tight font-sora leading-[1.1]"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                            >
                                Institutional-Grade <br />Technology You Can Trust
                            </motion.h3>
                            <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-xl">
                                EduIT is engineered to meet the highest global standards for reliability and data protection.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-10">
                            {features.map((f, i) => (
                                <motion.div
                                    key={f.title}
                                    className="space-y-4"
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 text-orange-400 flex items-center justify-center">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-[19px] font-bold font-sora leading-snug">{f.title}</h4>
                                    <p className="text-slate-500 text-[15px] leading-relaxed font-medium">{f.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="absolute inset-0 bg-orange-600/10 blur-[120px] rounded-full"></div>
                        <div className="bg-[#131a2b]/80 backdrop-blur-2xl p-10 md:p-12 rounded-[3.5rem] border border-white/5 relative z-10 shadow-2xl">
                            <div className="space-y-10">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-2xl font-black font-sora">System Status</h4>
                                    <div className="flex items-center gap-2 text-[#4ade80] font-black text-xs uppercase tracking-widest">
                                        <span className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></span>
                                        Operational
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-5">
                                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">UPTIME</p>
                                        <p className="text-2xl font-black font-sora text-orange-400">99.99%</p>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/5 pb-5">
                                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">AVERAGE LATENCY</p>
                                        <p className="text-2xl font-black font-sora">256ms</p>
                                    </div>
                                    <div className="flex items-center justify-between border-b border-white/5 pb-5">
                                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">REQUESTS / HR</p>
                                        <p className="text-2xl font-black font-sora">2.4M</p>
                                    </div>
                                </div>

                                <div className="relative pt-2">
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                                            initial={{ width: 0 }}
                                            whileInView={{ width: "92%" }}
                                            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
