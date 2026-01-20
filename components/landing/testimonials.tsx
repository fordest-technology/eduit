"use client"

import { motion } from "framer-motion"
import Image from "next/image"

const testimonials = [
    {
        quote: "EduIT completely transformed how we manage our school. What took days now takes hours.",
        author: "Dr. Sarah Jenkins",
        role: "PRINCIPAL, LINCOLN HIGH SCHOOL",
        img: "https://i.pravatar.cc/150?u=sarah"
    },
    {
        quote: "Parent engagement has never been better. Communication is now clear, fast, and reliable.",
        author: "Marcus Thompson",
        role: "ADMINISTRATOR, GREEN VALLEY ACADEMY",
        img: "https://i.pravatar.cc/150?u=marcus"
    },
    {
        quote: "Finally, a platform teachers actually enjoy using. Clean UI and truly useful features.",
        author: "Elena Rodriguez",
        role: "HEAD TEACHER, ST. JUDE'S COLLEGE",
        img: "https://i.pravatar.cc/150?u=elena"
    }
]

export function Testimonials() {
    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                    <motion.h2
                        className="text-[13px] font-black text-orange-600 uppercase tracking-[0.3em]"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        TESTIMONIALS
                    </motion.h2>
                    <motion.h3
                        className="text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight font-sora"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        Trusted by Educators Like You
                    </motion.h3>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={t.author}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-10 rounded-[2.5rem] bg-[#f8fafc] flex flex-col justify-between hover:bg-white hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-500 group border border-transparent hover:border-slate-100"
                        >
                            <p className="text-[19px] text-[#1e293b] font-medium leading-relaxed mb-12">
                                &ldquo;{t.quote}&rdquo;
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="relative h-14 w-14 rounded-full overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                                    <Image src={t.img} alt={t.author} fill className="object-cover" />
                                </div>
                                <div>
                                    <p className="font-bold text-[#0f172a] font-sora text-[17px]">{t.author}</p>
                                    <p className="text-[11px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{t.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
