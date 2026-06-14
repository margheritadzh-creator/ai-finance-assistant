import type { ReactNode } from "react";

import {
    Landmark,
    LineChart,
    ShieldCheck,
    Sparkles,
} from "lucide-react";

interface AuthShellProps {
    eyebrow: string;
    title: string;
    description: string;
    children: ReactNode;
    footer: ReactNode;
}

export function AuthShell({
                              eyebrow,
                              title,
                              description,
                              children,
                              footer,
                          }: AuthShellProps) {
    return (
        <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
            <div className="finance-surface mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl overflow-hidden rounded-[30px] lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.08fr_0.92fr]">
                <section className="relative hidden overflow-hidden bg-[linear-gradient(145deg,#071126_0%,#102445_55%,#09152f_100%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#c4a36a]/16 blur-3xl" />

                    <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#5475ad]/14 blur-3xl" />

                    <div className="absolute inset-0 opacity-25">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 700 700"
                            className="h-full w-full"
                            preserveAspectRatio="none"
                        >
                            <defs>
                                <linearGradient
                                    id="auth-line-gradient"
                                    x1="0"
                                    x2="1"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="#c4a36a"
                                        stopOpacity="0"
                                    />
                                    <stop
                                        offset="50%"
                                        stopColor="#c4a36a"
                                        stopOpacity="0.9"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#ead9b8"
                                        stopOpacity="0.15"
                                    />
                                </linearGradient>
                            </defs>

                            <path
                                d="M-20 490 C 80 500, 110 420, 190 445 S 310 365, 390 385 S 490 265, 590 310 S 670 220, 740 190"
                                fill="none"
                                stroke="url(#auth-line-gradient)"
                                strokeWidth="2"
                            />

                            <path
                                d="M-20 525 C 100 530, 155 495, 220 500 S 340 445, 420 460 S 540 380, 620 405 S 690 350, 740 335"
                                fill="none"
                                stroke="#ffffff"
                                strokeOpacity="0.12"
                                strokeWidth="1"
                            />
                        </svg>
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#c4a36a]/35 bg-[#c4a36a]/12 text-[#ead9b8]">
                                <Landmark size={21} />
                            </div>

                            <div>
                                <p className="text-sm font-semibold tracking-[0.18em]">
                                    AI FINANCE
                                </p>

                                <p className="mt-1 text-[10px] tracking-[0.18em] text-white/42">
                                    INTELLIGENT WEALTH MANAGEMENT
                                </p>
                            </div>
                        </div>

                        <div className="mt-24 max-w-lg">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#c4a36a]/25 bg-[#c4a36a]/9 px-3 py-1.5 text-xs font-medium text-[#ead9b8]">
                                <Sparkles size={13} />
                                AI 驱动的个人财务系统
                            </div>

                            <h2 className="mt-7 text-[42px] font-semibold leading-[1.15] tracking-[-0.045em]">
                                看清资金流向，
                                <br />
                                做出更好的决定。
                            </h2>

                            <p className="mt-6 max-w-md text-[15px] leading-7 text-white/58">
                                将每一笔账单转化为清晰的支出结构、趋势预测和可执行的财务建议。
                            </p>
                        </div>
                    </div>

                    <div className="relative grid grid-cols-3 gap-3">
                        <Feature
                            icon={<LineChart size={17} />}
                            title="趋势洞察"
                            text="预测未来支出"
                        />

                        <Feature
                            icon={<Sparkles size={17} />}
                            title="智能解析"
                            text="自然语言记账"
                        />

                        <Feature
                            icon={<ShieldCheck size={17} />}
                            title="安全隔离"
                            text="独立账户数据"
                        />
                    </div>
                </section>

                <section className="flex items-center bg-white/56 px-7 py-12 sm:px-12 lg:px-16">
                    <div className="mx-auto w-full max-w-[420px]">
                        <div className="mb-10 lg:hidden">
                            <div className="flex items-center gap-3 text-[#09152f]">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#09152f] text-[#ead9b8]">
                                    <Landmark size={20} />
                                </div>

                                <div>
                                    <p className="font-semibold tracking-[0.16em]">
                                        AI FINANCE
                                    </p>

                                    <p className="text-[9px] tracking-[0.15em] text-[#87909f]">
                                        WEALTH MANAGEMENT
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="finance-kicker">{eyebrow}</p>

                        <h1 className="mt-4 text-[34px] font-semibold tracking-[-0.04em] text-[#111827]">
                            {title}
                        </h1>

                        <p className="mt-3 max-w-sm text-[15px] leading-7 text-[#70798a]">
                            {description}
                        </p>

                        <div className="mt-9">{children}</div>

                        <div className="mt-8 text-center text-sm text-[#737c8c]">
                            {footer}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

interface FeatureProps {
    icon: ReactNode;
    title: string;
    text: string;
}

function Feature({
                     icon,
                     title,
                     text,
                 }: FeatureProps) {
    return (
        <div className="rounded-[17px] border border-white/9 bg-white/[0.055] p-4 backdrop-blur-sm">
            <div className="text-[#dec79f]">{icon}</div>

            <p className="mt-3 text-[13px] font-medium text-white/90">
                {title}
            </p>

            <p className="mt-1 text-[11px] text-white/38">
                {text}
            </p>
        </div>
    );
}