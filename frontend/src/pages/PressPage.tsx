import React from 'react'

const PressPage: React.FC = () => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Print button - hidden in print mode */}
      <div className="no-print flex justify-end mb-4">
        <button 
          onClick={handlePrint}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Mobile message */}
      <div className="mobile-only card bg-base-100 shadow-lg p-8 text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-ma-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Press Kit Available</h2>
        <p className="text-gray-600 mb-6">
          Our one-page press kit is optimized for desktop viewing and PDF download. 
          Please use the button above to download the PDF, or visit this page on a desktop device to preview it.
        </p>
        <button 
          onClick={handlePrint}
          className="btn btn-primary btn-lg mx-auto"
        >
          Download Press Kit PDF
        </button>
      </div>

      {/* Press Kit One-Pager */}
      <div className="press-page bg-white shadow-lg mx-auto">
        {/* Header Section */}
        <header className="press-header">
          <div className="flex items-center gap-4 mb-3">
            <div className="logo-container">
              <img src="/apple-touch-icon.png" alt="Beacon Hill Tracker" className="w-16 h-16" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-ma-blue">
                Beacon Hill Compliance Tracker
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Measuring Massachusetts Legislative Transparency
              </p>
            </div>
          </div>
          <div className="flex gap-6 text-sm text-gray-600 border-t border-b border-gray-200 py-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <a href="https://beaconhilltracker.org" className="hover:text-ma-blue">beaconhilltracker.org</a>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href="mailto:info@beaconhilltracker.org" className="hover:text-ma-blue">info@beaconhilltracker.org</a>
            </div>
          </div>
        </header>

        {/* Two-Column Layout: Summary + Key Stat */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-2">
            <h2 className="section-title">Summary</h2>
            <p className="text-gray-700 leading-relaxed">
              The Beacon Hill Compliance Tracker is an independent, citizen-built tool that measures how well the Massachusetts Legislature complies with its own procedural transparency requirements. It cross-references official legislative data—such as hearings, committee records, and bill progress—to determine where required documentation is present and where gaps remain.
            </p>
            <p className="text-gray-700 leading-relaxed mt-3">
              The project's purpose is to make legislative transparency measurable, accessible, and verifiable to the public.
            </p>
          </div>
          
          {/* Key Statistic Callout */}
          <div className="stat-callout">
            <div className="text-6xl font-bold text-ma-blue mb-2">~50%</div>
            <div className="text-lg font-semibold text-gray-700 mb-1">of Bills Meet Standards</div>
            <div className="text-sm text-gray-600">According to automated procedural checks</div>
          </div>
        </div>

        {/* How It Works - Process Flow */}
        <section className="mb-6">
          <h2 className="section-title">How It Works</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="process-step">
              <div className="step-icon bg-ma-blue">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
              <div className="step-number">1</div>
              <div className="step-title">Gather Data</div>
              <div className="step-desc">Information collected directly from Massachusetts Legislature's website</div>
            </div>

            <div className="process-step">
              <div className="step-icon bg-ma-gold">
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="step-number">2</div>
              <div className="step-title">Convert Rules</div>
              <div className="step-desc">Legislative rules converted into coded "if-then" conditions</div>
            </div>

            <div className="process-step">
              <div className="step-icon bg-ma-blue">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="step-number">3</div>
              <div className="step-title">Daily Process</div>
              <div className="step-desc">Automated matching of bills and committee materials to rules</div>
            </div>

            <div className="process-step">
              <div className="step-icon bg-ma-gold">
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="step-number">4</div>
              <div className="step-title">Flag Gaps</div>
              <div className="step-desc">Missing or incomplete items flagged for public visibility</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center italic">
            All logic and data sources are public, allowing anyone to verify or challenge the findings.
          </p>
        </section>

        {/* Purpose & Philosophy with Quote */}
        <section className="mb-6">
          <h2 className="section-title">Purpose and Philosophy</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            The Compliance Tracker was created by Massachusetts resident Drew Bowler, a software developer and civic technology volunteer.
          </p>
          
          <div className="quote-block">
            <svg className="quote-icon" fill="currentColor" viewBox="0 0 32 32">
              <path d="M10 8v8h-6l3 8h6v-8h-6l3-8z"></path>
              <path d="M24 8v8h-6l3 8h6v-8h-6l3-8z"></path>
            </svg>
            <p className="quote-text">
              Lack of transparency is a systemic issue, not a partisan one. My goal is simple — to cast a spotlight on the requirements, and give others the tools to enact change.
            </p>
            <div className="quote-attribution">— Drew Bowler, Developer</div>
          </div>

          <p className="text-gray-700 leading-relaxed mt-4">
            The project is <strong>nonpartisan</strong> and data-driven. It does not evaluate political outcomes or policy positions—only compliance with procedural rules.
          </p>
        </section>

        {/* Two-Column Bottom Section */}
        <div className="grid grid-cols-2 gap-6">
          <section>
            <h2 className="section-title">Intended Use</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              The tool is designed for journalists, researchers, civic watchdogs, and engaged citizens. It serves as:
            </p>
            <ul className="use-list">
              <li>
                <span className="use-bullet">•</span>
                <div>
                  <strong>A reference</strong> for understanding how transparency standards are met or missed
                </div>
              </li>
              <li>
                <span className="use-bullet">•</span>
                <div>
                  <strong>A starting point</strong> for further investigation and reform
                </div>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="section-title">Media Context</h2>
            <p className="text-gray-700 leading-relaxed">
            Calls for greater transparency on Beacon Hill have grown in recent years from watchdog groups, journalists, and reform advocates. The Beacon Hill Compliance Tracker adds a verifiable, data-driven lens to that discussion, offering the public a clearer view of how consistently legislative rules are followed.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="press-footer">
          <div className="text-center text-sm text-gray-500">
            <p>Email: <a href="mailto:info@beaconhilltracker.org" className="text-ma-blue hover:underline">info@beaconhilltracker.org</a> | Web: <a href="https://beaconhilltracker.org" className="text-ma-blue hover:underline">beaconhilltracker.org</a></p>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-sm text-gray-600">

            {/* Reddit */}
            <a
              href="https://old.reddit.com/user/BeaconHillTracker/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-ma-blue transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm5.485 11.261a2.027 2.027 0 0 1-.63 1.444c-1.087 1.084-3.29 1.165-4.852 1.165s-3.764-.081-4.852-1.165a2.027 2.027 0 0 1-.63-1.444 2.06 2.06 0 0 1 3.052-1.792 7.435 7.435 0 0 1 4.86 0 2.06 2.06 0 0 1 3.052 1.792ZM9.25 12.25A1.25 1.25 0 1 0 10.5 13.5a1.25 1.25 0 0 0-1.25-1.25Zm5.5 0A1.25 1.25 0 1 0 16 13.5a1.25 1.25 0 0 0-1.25-1.25Zm-2.75 5.236c1.308 0 2.48-.32 3.326-.9a.75.75 0 1 0-.852-1.238c-.626.431-1.55.638-2.474.638s-1.848-.207-2.474-.638a.75.75 0 1 0-.852 1.238c.846.58 2.018.9 3.326.9Z"/>
              </svg>
              <span>/u/BeaconHillTracker</span>
            </a>

            {/* Bluesky */}
            <a
              href="https://bsky.app/profile/beaconhilltracker.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-ma-blue transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9.95c1.582-3.146 5.236-5.737 7.443-5.737 1.264 0 1.957 1.03 1.957 2.237 0 1.582-1.028 3.185-2.059 4.36-.88 1.006-.88 1.611 0 2.617 1.03 1.175 2.059 2.778 2.059 4.36 0 1.207-.693 2.237-1.957 2.237-2.207 0-5.861-2.591-7.443-5.737-1.582 3.146-5.236 5.737-7.443 5.737-1.264 0-1.957-1.03-1.957-2.237 0-1.582 1.029-3.185 2.059-4.36.88-1.006.88-1.611 0-2.617-1.03-1.175-2.059-2.778-2.059-4.36 0-1.207.693-2.237 1.957-2.237 2.207 0 5.861 2.591 7.443 5.737Z"/>
              </svg>
              <span>@beaconhilltracker.bsky.social</span>
            </a>

            {/* X / Twitter */}
            <a
              href="https://x.com/BeaconHillTrack"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-ma-blue transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2H21l-6.51 7.445L22 22h-7.173l-4.7-6.146L4.6 22H2l7.028-8.043L2 2h7.173l4.274 5.684L18.244 2Zm-2.48 17.329h1.863L8.31 4.56H6.33l9.434 14.769Z"/>
              </svg>
              <span>@BeaconHillTrack</span>
            </a>
          </div>
        </footer>
      </div>
      {/* Print Styles */}
      <style>{`
        /* Mobile: Hide preview, show message (but not when printing) */
        @media screen and (max-width: 1024px) {
          .press-page {
            display: none !important;
          }
          
          .mobile-only {
            display: block !important;
          }
          
          /* Hide top download button on mobile since we have one in the card */
          .no-print {
            display: none !important;
          }
        }
        
        /* Desktop: Show preview, hide message */
        @media screen and (min-width: 1025px) {
          .mobile-only {
            display: none !important;
          }
        }

        /* Massachusetts Color Scheme */
        .text-ma-blue {
          color: #003366;
        }
        
        .bg-ma-blue {
          background-color: #003366;
        }
        
        .bg-ma-gold {
          background-color: #FFB81C;
        }
        
        .border-ma-blue {
          border-color: #003366;
        }

        /* Press Page Container */
        .press-page {
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.75in;
          background: white;
          box-sizing: border-box;
        }

        /* Header */
        .press-header {
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
        }

        /* Section Titles */
        .section-title {
          color: #003366;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          padding-bottom: 0.375rem;
          border-bottom: 3px solid #FFB81C;
          display: inline-block;
        }

        /* Stat Callout */
        .stat-callout {
          background: linear-gradient(135deg, #f0f4ff 0%, #fff8e1 100%);
          border: 2px solid #003366;
          border-radius: 0.75rem;
          padding: 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* Process Steps */
        .process-step {
          text-align: center;
          position: relative;
        }

        .step-icon {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 0.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .step-number {
          position: absolute;
          top: -0.5rem;
          right: calc(50% - 2.5rem);
          background: #FFB81C;
          color: #003366;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .step-title {
          font-weight: 600;
          color: #003366;
          margin-bottom: 0.25rem;
          font-size: 0.95rem;
        }

        .step-desc {
          font-size: 0.8rem;
          color: #4b5563;
          line-height: 1.3;
        }

        /* Quote Block */
        .quote-block {
          background: linear-gradient(135deg, #f0f4ff 0%, #fff8e1 100%);
          border-left: 4px solid #003366;
          padding: 1.25rem 1.5rem;
          border-radius: 0.5rem;
          position: relative;
          margin: 1rem 0;
        }

        .quote-icon {
          position: absolute;
          top: 0.75rem;
          left: 1rem;
          width: 2rem;
          height: 2rem;
          color: #FFB81C;
          opacity: 0.5;
        }

        .quote-text {
          font-size: 1.05rem;
          font-style: italic;
          color: #1f2937;
          line-height: 1.6;
          padding-left: 2rem;
          margin-bottom: 0.5rem;
        }

        .quote-attribution {
          text-align: right;
          font-weight: 600;
          color: #003366;
          font-size: 0.95rem;
        }

        /* Use List */
        .use-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .use-list li {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .use-bullet {
          color: #FFB81C;
          font-size: 1.5rem;
          line-height: 1;
          margin-right: 0.75rem;
          font-weight: bold;
        }

        /* Footer */
        .press-footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 2px solid #e5e7eb;
        }

         /* Print Styles */
         @media print {
           /* Hide navigation, buttons, and mobile message */
           .no-print,
           .mobile-only,
           nav,
           .navbar,
           footer.footer,
           button {
             display: none !important;
           }

           /* Always show desktop press page when printing */
           .press-page {
             display: block !important;
           }

           /* Remove page margins and optimize layout */
           @page {
             size: letter;
             margin: 0.4in 0.5in;
           }

           body {
             background: white !important;
             margin: 0;
             padding: 0;
           }

           .press-page {
             max-width: 100%;
             width: 100%;
             margin: 0;
             padding: 0;
             box-shadow: none;
             page-break-after: avoid;
           }

           /* Ensure single page */
           * {
             page-break-inside: avoid;
           }

           h1, h2, h3 {
             page-break-after: avoid;
           }

           /* Compress spacing for print */
           .press-header {
             margin-bottom: 0.5rem !important;
             padding-bottom: 0.15rem !important;
           }

           .press-header h1 {
             font-size: 20pt !important;
             margin-bottom: 0.15rem !important;
           }

           .press-header p {
             font-size: 9pt !important;
             margin-top: 0.15rem !important;
           }

           .press-header .flex.gap-6 {
             padding: 0.15rem 0 !important;
             gap: 1rem !important;
             font-size: 8pt !important;
           }

           section {
             margin-bottom: 0.5rem !important;
           }

           .section-title {
             font-size: 12pt !important;
             margin-bottom: 0.4rem !important;
             padding-bottom: 0.2rem !important;
             border-bottom-width: 2px !important;
           }

           .grid.grid-cols-3 {
             margin-bottom: 0.5rem !important;
             gap: 0.75rem !important;
           }

           .grid.grid-cols-4 {
             gap: 0.35rem !important;
           }

           .grid.grid-cols-2 {
             gap: 0.75rem !important;
           }
           
           /* Compress italic disclaimer */
           .text-center.italic {
             margin-top: 0.25rem !important;
             font-size: 7.5pt !important;
           }

           .stat-callout {
             padding: 0.75rem !important;
           }

           .stat-callout .text-6xl {
             font-size: 2.75rem !important;
             margin-bottom: 0.15rem !important;
             line-height: 1 !important;
           }

           .stat-callout .text-lg {
             font-size: 0.9rem !important;
             margin-bottom: 0.15rem !important;
           }
           
           .stat-callout .text-sm {
             font-size: 0.75rem !important;
           }

           .quote-block {
             padding: 0.6rem 1rem !important;
             margin: 0.4rem 0 !important;
           }

           .quote-text {
             font-size: 0.85rem !important;
             line-height: 1.35 !important;
             padding-left: 1.5rem !important;
             margin-bottom: 0.2rem !important;
           }
           
           .quote-attribution {
             font-size: 0.8rem !important;
           }

           .quote-icon {
             width: 1.5rem !important;
             height: 1.5rem !important;
           }

           .step-icon {
             width: 2.5rem !important;
             height: 2.5rem !important;
             margin-bottom: 0.25rem !important;
           }

           .step-icon svg {
             width: 1.25rem !important;
             height: 1.25rem !important;
           }

           .step-number {
             width: 1.5rem !important;
             height: 1.5rem !important;
             font-size: 0.75rem !important;
             top: -0.35rem !important;
             right: calc(50% - 2rem) !important;
           }

           .step-title {
             font-size: 0.85rem !important;
             margin-bottom: 0.15rem !important;
           }

           .step-desc {
             font-size: 0.7rem !important;
             line-height: 1.2 !important;
           }

           .use-list li {
             margin-bottom: 0.3rem !important;
           }
           
           .use-list {
             margin-bottom: 0 !important;
           }

           .press-footer {
             margin-top: 0.4rem !important;
             padding-top: 0.3rem !important;
             border-top-width: 1px !important;
           }
           
           .press-footer p {
             margin-bottom: 0.15rem !important;
             font-size: 7.5pt !important;
           }
           
           .press-footer .font-semibold {
             font-size: 8pt !important;
           }

           /* Optimize colors for print */
           .bg-ma-blue {
             background-color: #003366 !important;
             -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
           }

           .bg-ma-gold {
             background-color: #FFB81C !important;
             -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
           }

           .text-ma-blue {
             color: #003366 !important;
             -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
           }

           .stat-callout,
           .quote-block {
             -webkit-print-color-adjust: exact;
             print-color-adjust: exact;
           }

           /* Ensure links are underlined in print */
           a {
             text-decoration: underline;
           }

           /* Adjust font sizes for print */
           body {
             font-size: 9pt !important;
             line-height: 1.3 !important;
           }

           p {
             margin-top: 0 !important;
             margin-bottom: 0.4rem !important;
           }
           
           /* Tighten up last paragraph in sections */
           section p:last-of-type {
             margin-bottom: 0.3rem !important;
           }

           .text-gray-700 {
             font-size: 9pt !important;
           }

           .logo-container img {
             width: 2.5rem !important;
             height: 2.5rem !important;
           }
           
           .press-header .flex.items-center {
             gap: 0.75rem !important;
           }
         }

        /* Screen-only improvements */
        @media screen {
          .press-page {
            min-height: 11in;
          }
        }
      `}</style>
    </>
  )
}

export default PressPage


