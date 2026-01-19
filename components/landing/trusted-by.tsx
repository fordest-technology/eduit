"use client"

import { motion } from "framer-motion"

export function TrustedBy() {
    const schools = [
        "School Alpha",
        "Green Valley Academy",
        "Riverside College",
        "Future Scholars Institute",
        "Global International School"
    ]

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-4 text-center">
                <motion.p
                    className="text-[14px] font-black text-orange-600 uppercase tracking-[0.3em] mb-16"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    POWERING SCHOOLS, COLLEGES, AND EDUCATION NETWORKS WORLDWIDE.
                </motion.p>

                <div className="flex flex-col gap-y-12 max-w-5xl mx-auto">
                    <motion.div
                        className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {schools.slice(0, 4).map((school) => (
                            <span
                                key={school}
                                className="text-2xl md:text-3xl font-black tracking-tight text-slate-400 font-sora hover:text-slate-900 transition-colors cursor-default"
                            >
                                {school}
                            </span>
                        ))}
                    </motion.div>

                    <motion.div
                        className="flex justify-center"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <span className="text-2xl md:text-3xl font-black tracking-tight text-slate-400 font-sora hover:text-slate-900 transition-colors cursor-default">
                            {schools[4]}
                        </span>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
