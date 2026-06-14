import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
    content: string;
}

export function MarkdownContent({
                                    content,
                                }: MarkdownContentProps) {
    return (
        <div className="min-w-0 text-sm leading-7 text-[#344054]">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ children }) => (
                        <h1 className="mb-3 mt-2 text-xl font-semibold text-[#172033]">
                            {children}
                        </h1>
                    ),

                    h2: ({ children }) => (
                        <h2 className="mb-3 mt-5 text-lg font-semibold text-[#172033]">
                            {children}
                        </h2>
                    ),

                    h3: ({ children }) => (
                        <h3 className="mb-2 mt-4 font-semibold text-[#273147]">
                            {children}
                        </h3>
                    ),

                    p: ({ children }) => (
                        <p className="mb-3 whitespace-pre-wrap last:mb-0">
                            {children}
                        </p>
                    ),

                    ul: ({ children }) => (
                        <ul className="mb-4 list-disc space-y-1.5 pl-5">
                            {children}
                        </ul>
                    ),

                    ol: ({ children }) => (
                        <ol className="mb-4 list-decimal space-y-1.5 pl-5">
                            {children}
                        </ol>
                    ),

                    li: ({ children }) => (
                        <li className="pl-1">
                            {children}
                        </li>
                    ),

                    strong: ({ children }) => (
                        <strong className="font-semibold text-[#172033]">
                            {children}
                        </strong>
                    ),

                    blockquote: ({ children }) => (
                        <blockquote className="my-4 rounded-r-[12px] border-l-4 border-[#c4a36a] bg-[#f8f4ec] px-4 py-3 text-[#596273]">
                            {children}
                        </blockquote>
                    ),

                    table: ({ children }) => (
                        <div className="my-5 max-w-full overflow-x-auto rounded-[15px] border border-[#dfe3e8]">
                            <table className="min-w-full border-collapse bg-white text-left text-sm">
                                {children}
                            </table>
                        </div>
                    ),

                    thead: ({ children }) => (
                        <thead className="bg-[#f5f1e8] text-[#5f4b2e]">
                        {children}
                        </thead>
                    ),

                    tbody: ({ children }) => (
                        <tbody className="divide-y divide-[#e7e9ed]">
                        {children}
                        </tbody>
                    ),

                    tr: ({ children }) => (
                        <tr className="transition hover:bg-[#fbfaf7]">
                            {children}
                        </tr>
                    ),

                    th: ({ children }) => (
                        <th className="whitespace-nowrap border-r border-[#e2e4e8] px-4 py-3 font-semibold last:border-r-0">
                            {children}
                        </th>
                    ),

                    td: ({ children }) => (
                        <td className="border-r border-[#eceef1] px-4 py-3 align-top text-[#4f5969] last:border-r-0">
                            {children}
                        </td>
                    ),

                    code: ({ children }) => (
                        <code className="rounded bg-[#eef0f3] px-1.5 py-0.5 text-[13px] text-[#7a5626]">
                            {children}
                        </code>
                    ),

                    pre: ({ children }) => (
                        <pre className="my-4 overflow-x-auto rounded-[14px] bg-[#101827] p-4 text-sm leading-6 text-[#e5e7eb]">
              {children}
            </pre>
                    ),

                    a: ({
                            href,
                            children,
                        }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#8a642f] underline underline-offset-2"
                        >
                            {children}
                        </a>
                    ),

                    hr: () => (
                        <hr className="my-5 border-[#e3e5e9]" />
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}