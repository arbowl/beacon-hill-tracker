import React, { useState, useEffect, useRef } from 'react'

interface FAQItem {
  id: string
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    id: 'what-is-compliance',
    question: 'What does "compliance" mean?',
    answer: 'Compliance in this context refers to procedural transparency, i.e. whether documents, notices, and votes were posted within official deadlines. It does not refer to the political content or outcome of a bill.'
  },
  {
    id: 'why-compliance-matters',
    question: 'Why does compliance matter?',
    answer: 'Compliance is a measure of transparency, and transparency helps us track our Legislature. Citizens, journalists, and legislators deserve to have access to the decision-making process.'
  },
  {
    id: 'data-accuracy',
    question: 'How accurate is this data?',
    answer: 'I strive for complete daily accuracy and continuously audit my code for logical errors. I don\'t publish anything I don\'t feel confident in. That said, anyone who finds an issue is invited to contact me so I can fix it.'
  },
  {
    id: 'how-it-works',
    question: 'How does this work?',
    answer: 'Every day, I oversee an automated process that ingests Massachusetts Legislature website content and calculates compliance for every committee. I manually review any ambiguous data, then upload it to the dashboard. I limit uploads to just myself for security and data integrity, but I post the algorithm code so others could run it if they wish.'
  },
  {
    id: 'finding-errors',
    question: 'What if I find an error?',
    answer: 'I provide a contact form and an email address to send bug reports to. In addition, I provide a link to the algorithm source code for tech-savvy users to audit and add to if they find any issues. If I fix a bug, I will reflect it in the changelog in the About page.'
  },
  {
    id: 'upload-frequency',
    question: 'How often is the data uploaded?',
    answer: 'The site automatically refreshes once daily; I aim to complete the upload by 10am each day. I post the time of the last successful data upload on the homepage and the dashboard.'
  },
  {
    id: 'official-sources',
    question: 'What are the "official sources"?',
    answer: 'I gather all data from the official Massachusetts Legislature website. I only process information which the public can readily access; I don\'t use third-party aggregators or summarizers.'
  },
  {
    id: 'using-data',
    question: 'Can others use this data?',
    answer: 'Yes. The summary statistics and methodology are public. Journalists, researchers, and civic groups may cite or republish findings with attribution to Beacon Hill Compliance Tracker and a link to the original page.'
  },
  {
    id: 'automated-decisions',
    question: 'Why are some compliance decisions automated?',
    answer: 'Certain checks, such as whether a page has an embedded summary or vote count, can be confirmed objectively by verifiable checks. I leverage local language models to help determine document types where simple code checks fail, which generates a comprehensive audit log I closely monitor for anomalies. Any items which fall below a sufficient computer-generated confidence threshold are subject to manual review prior to being uploaded. All analysis types are audited regularly for accuracy. This multi-tiered waterfall approach ensures regular, timely, accurate data uploads.'
  },
  {
    id: 'automation-requirement',
    question: 'Why does this need to be automated at all?',
    answer: 'The Legislature produces and updates thousands of pages across dozens of committees every session, and the data isn\'t standardized or searchable. Some committees post summaries in bulk under the hearing page in Word documents; others post each summary in its own PDF. Some votes are recorded in plaintext on the bill page, and others are recorded in a table format. A human could spot-check a few bills every day, but not all bills, for all committees, every day, with timestamps precise enough to verify compliance. Because bills are added and deadlines are crossed every day, automation is the only way to ensure compliance is tracked accurately and consistently.',
  },
  {
    id: 'reported-out-compliance',
    question: 'Why are some bills marked as "Compliant" when they haven\'t been reported out?',
    answer: 'If votes are present for a bill, it has necessarily been reported out. The purpose of tracking reported-out status is to ensure the Legislature has met its procedural deadline. If we do not detect the usual reported-out markers, but the votes are present within the required timeframe, it has satisfied the reported-out requirement.'
  },
  {
    id: 'bill-not-showing',
    question: 'Why hasn\'t a bill shown up yet?',
    answer: 'The dashboard updates once per day with a snapshot of exactly what information the Legislature has provided. As such, movement within the day can get lost, delays in posted material translates to delays in compliance tracking, and sometimes the Legislature\'s website is partially or fully down, preventing analysis.'
  },
  {
    id: 'provisional-bills',
    question: 'What is the purpose of counting "Provisional" bills as "Compliant"?',
    answer: 'Bills can fall out of compliance before final deadlines have been met under certain conditions; as such, it only seems fair, in the spirit of accountability, to allow bills to count towards compliance until they fail out. However, so as to not artificially boost compliance numbers, I clearly denote which ones are fully compliant and which ones are compliant-so-far, so users can draw their own lines.'
  },
  {
    id: 'duplicate-bills',
    question: 'Why do some bills show up multiple times in the bill table?',
    answer: 'This grades committee compliance, not bill compliance. Bills which show up multiple times were handled by multiple committees, and so it gets graded for each window of time that a committee handled it.'
  },
  {
    id: 'trend-analysis',
    question: 'When will the site feature trend analysis?',
    answer: 'I only got the algorithm working well and updated daily in November 2025; the intent is to add trend analysis over specified time windows, but first, I need to continue building a database of verified information.'
  },
  {
    id: 'download-data',
    question: 'Can you make the raw data downloadable?',
    answer: 'You can download your current view via the "Export CSV" button at the top of the dashboard. This will convert the graphical representation into a spreadsheet, which can be used for auditing, traceability, further research, or your own projects.'
  },
  {
    id: 'affiliation',
    question: 'Does this project have any affiliation with the Legislature or a political group?',
    answer: 'No. The Beacon Hill Compliance Tracker is an independent civic technology project with no official relationship to the Massachusetts Legislature or any political organization. I receive no funding and obtained no sponsorships. I received invaluable help from civic volunteers, and I couldn\'t have done this without their feedback and guidance. That said, all data is collected from publicly available sources, and I post my evaluation logic for all to see.'
  },
  {
    id: 'misuse',
    question: 'What constitutes misuse of this data?',
    answer: 'The purpose of this tool is to measuare systemic compliance, not to support partisan narratives. No political party advertises opacity as a foundational principle; it\'s a problem that sits outside of binary party dynamics. Users of the tracker are encourgaed to use it for what it is: an aggregator of documentation and tracker of compliance.'
  },
  {
    id: 'whats-next',
    question: 'What\'s next for this project?',
    answer: 'Right now, the main goal is simply to continue building consistent data and making general improvements to the site and algorithm. However, I\'m always accepting feedback, and hope to make this tool useful to as broad an audience as I can. I hope this tool can be useful for journalists, researchers, legislators, and everyday citizens such as myself.'
  }
]

const FAQPage: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [activeId, setActiveId] = useState<string>('')
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const tocRef = useRef<HTMLDivElement>(null)

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const scrollToItem = (id: string) => {
    const element = itemRefs.current[id]
    if (element) {
      const offset = 100 // Offset for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      // Open the item if it's closed
      if (!openItems.has(id)) {
        setTimeout(() => toggleItem(id), 300)
      }
    }
  }

  // Track active question based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150 // Offset for sticky header

      for (let i = faqData.length - 1; i >= 0; i--) {
        const item = faqData[i]
        const element = itemRefs.current[item.id]
        if (element) {
          const elementTop = element.offsetTop
          if (scrollPosition >= elementTop) {
            setActiveId(item.id)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle hash navigation on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash && faqData.some(item => item.id === hash)) {
      setTimeout(() => scrollToItem(hash), 100)
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-xl text-base-content/70">
          Everything you need to know about the Beacon Hill Compliance Tracker
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sticky Table of Contents */}
        <div className="lg:w-64 flex-shrink-0">
          <div
            ref={tocRef}
            className="sticky top-24 bg-base-100 rounded-lg shadow-md p-4 max-h-[calc(100vh-8rem)] overflow-y-auto"
          >
            <h2 className="font-semibold text-lg mb-4 text-primary">Questions</h2>
            <nav className="space-y-2">
              {faqData.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => scrollToItem(item.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                    activeId === item.id
                      ? 'bg-primary text-primary-content font-medium'
                      : 'hover:bg-base-200 text-base-content/80'
                  }`}
                >
                  <span className="text-primary/60 mr-2">Q{index + 1}:</span>
                  {item.question}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* FAQ Items */}
        <div className="flex-1 space-y-4">
          {faqData.map((item, index) => (
            <div
              key={item.id}
              id={item.id}
              ref={el => (itemRefs.current[item.id] = el)}
              className="card bg-base-100 shadow-md"
            >
              <div
                className={`collapse collapse-plus ${openItems.has(item.id) ? 'collapse-open' : ''}`}
                tabIndex={0}
              >
                <input
                  type="checkbox"
                  checked={openItems.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                />
                <div className="collapse-title text-xl font-semibold text-primary">
                  <div className="flex items-start gap-3">
                    <span className="text-primary/60 font-normal">Q{index + 1}:</span>
                    <span>{item.question}</span>
                  </div>
                </div>
                <div className="collapse-content">
                  <div className="pt-2 pb-4 px-4">
                    <p className="text-base-content/80 leading-relaxed whitespace-pre-line">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-12 card bg-base-100 shadow-md">
        <div className="card-body text-center">
          <h2 className="card-title text-2xl justify-center mb-4">
            Still have questions?
          </h2>
          <p className="text-base-content/80 mb-6">
            Can't find what you're looking for? Feel free to reach out to us.
          </p>
          <div className="card-actions justify-center">
            <a href="/contact" className="btn btn-primary">
              Contact Us
            </a>
            <a href="/about" className="btn btn-ghost">
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQPage


