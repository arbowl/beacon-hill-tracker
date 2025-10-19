const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">About The Project</h1>
        <p className="text-xl text-base-content/70">
          How I track legislative transparency with precision and impartiality.
        </p>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">My Mission</h2>
          <p className="text-base-content/80 mb-4">
            The Beacon Hill Compliance Tracker promotes transparency and accountability 
            in the Massachusetts legislative process by automatically tracking committee 
            compliance with legislative deadlines and requirements.
          </p>
          <p className="text-base-content/80 mb-4">
            I believe that citizens have the right to know how their representatives 
            are managing the legislative process and whether committees are meeting 
            their obligations under state law.
          </p>
          <p className="text-base-content/80">
            There are thousands of bills, each bill has multiple compliance requirements,
            those requirements are scattered in multiple different places, and each item
            can take the form of multiple different formats. Doing this by hand is impossible,
            because it takes an immense amount of time to search for all the information, and
            in that time, deadlines are shifting and new information is being posted. This tool
            employs a variety of automation tools to efficiently compile an ongoing analysis of the overall
            rate of compliance in the Massachusetts legislature.
          </p>
        </div>
      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">What I Track</h2>
            <ul className="space-y-3 text-base-content/80">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Committee compliance with 60-day reporting deadlines</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Extension orders and deadline modifications</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Plain-English bill summaries</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Availability of vote records</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Hearing notice requirements and scheduling</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Data Sources</h2>
            <p className="text-base-content/80 mb-4">
              I use an algorithm that searches likely MA legislature pages and all known formats
              for legislative data, learning and going faster as it creates committee "profiles".
              Locations include bill pages, tabs and tables, committee pages, hearing pages, and
              official calendars. Formats include HTML, PDF, DOCX, and Excel.
            </p>
            <div className="bg-base-200 p-3 rounded-lg">
              <p className="text-sm text-base-content/70">
                <strong>Note:</strong> I track procedural compliance, not legislative content. 
                This analysis is purely factual and non-partisan.
              </p>
            </div>
          </div>
        </div>
      </div>

        <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Compliance Rules</h2>
          <p className="text-base-content/80 mb-4">
            To be compliant, a bill must satisfy the following requirements:
            <ul className="space-y-3 text-base-content/80 mt-4">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Hearing notice must be at least 10 days in advance, unless the announcement was made before June 26, 2025 (exempt).</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                If notice is less than 10 days (or missing entirely), the bill is <div className="badge badge-error">Non-Compliant</div> regardless of other factors.</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                If notice is missing, the bill's status is <div className="badge">Unknown</div> and being <div className="badge">Monitored</div>.</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>If notice is adequate, compliance is measured as such:</span>
                <ul className="space-y-3 text-base-content/80">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span><strong>Senate bills:</strong> Summaries and votes are checked, with deadlines following the "first Wednesday in December" rule.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span><strong>House bills:</strong> Must be reported out within 60 days (with the possibility of a one-time extension to 90 days), have summaries posted, and votes posted.</span>
                  </li>
                </ul>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>If a bill is not marked as "reported out" but the votes are present, it's assumed to be "reported out".</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                If exactly one piece of any kind of evidence is missing, I mark it as <div className="badge badge-warning">Incomplete</div>. This status doesn't count toward
                  compliance, but marks non-compliant bills which may be worthy of extra scrutiny for identifying trends (or even for finding gaps in my automation pipeline).
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>All evidence requirements (reported out, votes posted, summaries posted) plus 10 days of advance notice of a hearing must be present for a bill to be <div className="badge badge-success">Compliant</div>.</span>
              </li>
            </ul>
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Automated Collection Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🕷️</div>
              <h3 className="font-semibold mb-2">Web Scraping</h3>
              <p className="text-sm opacity-90">
                First, I scrape official legislative websites for raw data,
                searching for keywords, dates, and document links. Next, I scan that data for
                critical keywords that give clues as to what kind of info it contains.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">⚙️</div>
              <h3 className="font-semibold mb-2">Data Processing</h3>
              <p className="text-sm opacity-90">
                Depending on the confidence level of a compliance item, I either auto-process
                the data, filter it through a locally trained reasoning LLM, or flag
                it for manual review.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <h3 className="font-semibold mb-2">Real-time Updates</h3>
              <p className="text-sm opacity-90">
                Each completed analysis of a committee updates internal algorithms,
                refreshes the committee's profile with the latest evaluation,
                encrypts the results, and sends it to the dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">My Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-success">✅ What I strive to do</h3>
              <ul className="space-y-2 text-base-content/80">
                <li>• Cross-reference multiple official sources</li>
                <li>• Validate data against legislative calendars</li>
                <li>• Track changes over time for accuracy</li>
                <li>• Provide transparent methodology</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-warning">⚠️ What I don't do</h3>
              <ul className="space-y-2 text-base-content/80">
                <li>• Apply a partisan spin</li>
                <li>• Analyze or evaluate bill merit</li>
                <li>• Advocate for specific policies</li>
                <li>• Interpret legislative intent</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body text-center">
          <h2 className="card-title text-2xl mb-4 justify-center">Disclaimer</h2>
          <p className="text-base-content/80 mb-6">
            This dashboard and the underlying data collection methods are put together in good faith with
            an honest attempt to find all present compliance factors and grade them fairly. However, factors such as
            human error, automation gaps, and inconsistent data sources inevitably lead to edge cases,
            false positives, and missed evidence. As such, I present all evidence I find in the details of
            each bill row, and encourage you to email or submit a ticket on GitHub if you find any mistakes.
            Despite the possibility of errors, the utmost care has been taken to ensure basic accuracy across
            the thousands of processed bills, and though I don't guarantee 100% accuracy, I do believe this dashboard
            provides an accurate snapshot of compliance across the board, and gives you the tools to confirm non-compliance for yourself.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/dashboard" className="btn btn-primary">
              View Dashboard
            </a>
            <a href="/contact" className="btn btn-outline">
              Contact
            </a>
            <a 
              href="https://github.com/arbowl/beacon-hill-compliance-tracker" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              View Source
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutPage


