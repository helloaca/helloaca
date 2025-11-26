import React, { useEffect, useMemo, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import { Hash } from 'lucide-react'

const Docs: React.FC = () => {
  const sections = useMemo(() => [
    { id: 'overview', title: 'Overview' },
    { id: 'quick-start', title: 'Quick Start' },
    { id: 'uploading', title: 'Uploading Documents' },
    { id: 'analysis', title: 'Analysis Results' },
    { id: 'chat', title: 'Chat with Contract' },
    { id: 'reports', title: 'Reports & Export' },
    { id: 'agreements', title: 'Supported Agreements' },
    { id: 'best-practices', title: 'Best Practices' },
    { id: 'pricing', title: 'Plans & Billing' },
    { id: 'security', title: 'Security & Privacy' },
    { id: 'troubleshooting', title: 'Troubleshooting' },
    { id: 'faq', title: 'FAQ' },
    { id: 'contact', title: 'Contact & Support' }
  ], [])

  const [active, setActive] = useState('overview')
  const [query, setQuery] = useState('')
  const refs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) {
        setActive(visible[0].target.id)
      }
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0.01 })
    sections.forEach(s => {
      const el = refs.current[s.id]
      if (el) io.observe(el)
    })
    const hash = window.location.hash?.replace('#', '')
    if (hash && refs.current[hash]) {
      refs.current[hash]?.scrollIntoView({ behavior: 'smooth' })
    }
    return () => io.disconnect()
  }, [sections])

  const filtered = sections.filter(s => s.title.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="font-space-grotesk text-3xl sm:text-4xl md:text-5xl font-bold text-black">Helloaca Documentation</h1>
            <p className="mt-3 text-lg text-gray-600">Product guide, workflows, and best practices.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <aside className="lg:col-span-3">
              <div className="sticky top-20 rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search docs"
                  className="w-full h-10 rounded-button border border-gray-300 px-3 mb-3 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <nav aria-label="Documentation" className="space-y-1">
                  {filtered.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        refs.current[s.id]?.scrollIntoView({ behavior: 'smooth' })
                        history.replaceState(null, '', `#${s.id}`)
                      }}
                      className={`w-full text-left px-3 py-2 rounded-button text-sm ${active === s.id ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}
                    >
                      {s.title}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <main className="lg:col-span-9">
              <article className="prose prose-gray max-w-none">
                <div id="overview" ref={el => refs.current['overview'] = el} className="scroll-mt-24">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Overview
                    <a href="#overview" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <p className="text-gray-700">Helloaca analyzes contracts to surface risks, obligations, protections, timelines, and summaries. It is designed for founders, lawyers, procurement, contract managers, freelancers, vendors, buyers, and teams who need fast clarity.</p>
                  <ul className="list-disc ml-5 text-gray-700">
                    <li>Upload PDFs or DOCX. OCR processes scanned files.</li>
                    <li>View instant insights and risk detection.</li>
                    <li>Ask questions with Chat and receive cited answers.</li>
                    <li>Export reports for sharing or record‑keeping.</li>
                  </ul>
                </div>

                <div id="quick-start" ref={el => refs.current['quick-start'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Quick Start
                    <a href="#quick-start" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <ol className="list-decimal ml-5 text-gray-700 space-y-2">
                    <li>Register or sign in.</li>
                    <li>From Dashboard, select Upload and add your contract.</li>
                    <li>Open the analysis to review risks, obligations, and summary.</li>
                    <li>Use Chat for clarifications and negotiation prep.</li>
                    <li>Export a PDF report from the Reports page.</li>
                  </ol>
                </div>

                <div id="uploading" ref={el => refs.current['uploading'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Uploading Documents
                    <a href="#uploading" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <ul className="list-disc ml-5 text-gray-700 space-y-2">
                    <li>Formats: PDF and DOCX. Scanned PDFs are supported via OCR.</li>
                    <li>Keep each upload to a single agreement for best results.</li>
                    <li>For very large bundles, split by agreement before uploading.</li>
                    <li>Ensure text contrast and resolution are sufficient for OCR.</li>
                  </ul>
                </div>

                <div id="analysis" ref={el => refs.current['analysis'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Analysis Results
                    <a href="#analysis" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <p className="text-gray-700">The analysis surfaces the following:</p>
                  <ul className="list-disc ml-5 text-gray-700 space-y-2">
                    <li>Risk hotspots and problematic clauses.</li>
                    <li>Key obligations, rights, and protections.</li>
                    <li>Deadlines, renewal windows, and termination triggers.</li>
                    <li>Plain‑language summary of the agreement.</li>
                  </ul>
                </div>

                <div id="chat" ref={el => refs.current['chat'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Chat with Contract
                    <a href="#chat" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <p className="text-gray-700">Ask targeted questions and receive answers with citations to the source text.</p>
                  <ul className="list-disc ml-5 text-gray-700 space-y-2">
                    <li>Examples: “What are termination conditions?”, “Is data owned by the vendor?”</li>
                    <li>Follow‑ups: “Show me the clause”, “Summarize the buyer’s obligations”.</li>
                    <li>Use for negotiation prep and due diligence.</li>
                  </ul>
                </div>

                <div id="reports" ref={el => refs.current['reports'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Reports & Export
                    <a href="#reports" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <ul className="list-disc ml-5 text-gray-700 space-y-2">
                    <li>Download summaries and clause tables as PDF.</li>
                    <li>Share a read‑only report link with teammates.</li>
                    <li>White‑label export is available for business plans.</li>
                  </ul>
                </div>

                <div id="agreements" ref={el => refs.current['agreements'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Supported Agreements
                    <a href="#agreements" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <p className="text-gray-700">NDAs, MSAs, SOWs, SaaS, vendor/procurement, licensing/IP, employment, contractor, lease/rental, partnership/joint venture, loan/financing, consulting, DPA, EULA, distribution, reseller, SLA.</p>
                </div>

                <div id="best-practices" ref={el => refs.current['best-practices'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Best Practices
                    <a href="#best-practices" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <ul className="list-disc ml-5 text-gray-700 space-y-2">
                    <li>Prefer text‑based documents. Avoid low‑resolution scans.</li>
                    <li>Keep versions organized and upload final drafts.</li>
                    <li>Use Chat to validate interpretations and avoid context drift.</li>
                  </ul>
                </div>

                <div id="pricing" ref={el => refs.current['pricing'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Plans & Billing
                    <a href="#pricing" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <p className="text-gray-700">Unlimited analysis for $3/month. One free analysis per month.</p>
                </div>

                <div id="security" ref={el => refs.current['security'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Security & Privacy
                    <a href="#security" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <ul className="list-disc ml-5 text-gray-700 space-y-2">
                    <li>Data encrypted in transit and at rest.</li>
                    <li>Secure storage with restricted access.</li>
                    <li>Delete files permanently from your dashboard.</li>
                  </ul>
                </div>

                <div id="troubleshooting" ref={el => refs.current['troubleshooting'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Troubleshooting
                    <a href="#troubleshooting" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <ul className="list-disc ml-5 text-gray-700 space-y-2">
                    <li>Upload fails: check file type and size.</li>
                    <li>OCR not accurate: increase scan resolution and contrast.</li>
                    <li>Can’t see analysis: refresh and verify the file was processed.</li>
                  </ul>
                </div>

                <div id="faq" ref={el => refs.current['faq'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    FAQ
                    <a href="#faq" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <ul className="list-disc ml-5 text-gray-700 space-y-2">
                    <li>Legal advice: not provided. Use insights for decision support.</li>
                    <li>Languages: common languages supported; quality varies with source.</li>
                    <li>Sharing: export PDFs or share report links with your team.</li>
                  </ul>
                </div>

                <div id="contact" ref={el => refs.current['contact'] = el} className="scroll-mt-24 mt-10">
                  <h2 className="flex items-center gap-2 font-space-grotesk text-2xl sm:text-3xl font-bold">
                    Contact & Support
                    <a href="#contact" className="text-gray-400 hover:text-gray-600"><Hash className="h-4 w-4" /></a>
                  </h2>
                  <p className="text-gray-700 mb-4">For assistance or feedback, reach out via the contact page.</p>
                  <Button size="md" onClick={() => window.location.assign('/contact')}>Contact Us</Button>
                </div>
              </article>
            </main>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default Docs