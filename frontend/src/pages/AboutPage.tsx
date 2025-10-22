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

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">About Me</h2>
          <p className="text-base-content/80 mb-4">
            My name is Drew Bowler. I'm an independent engineer and civic technologist focused on improving public access to legislative data and government accountability.
          </p>
          <p className="text-base-content/80 mb-4">
            I developed the Beacon Hill Compliance Tracker as an independent project, collaborating with the executive directors of two Massachusetts grassroots political organizations who provided input on design and functionality.
          </p>
          <p className="text-base-content/80 mb-4">
            I believe technology should serve the public interest, especially when it comes to transparency, oversight, and civic participation.
          </p>
          <p className="text-base-content/80">
            <i>Special thanks to the grassroots leaders whose feedback and direction made this tool possible. I handled the code, but the clarity and logic came from many thoughtful conversations along the way.</i>
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
                If notice is less than 10 days, the bill is <span className="badge badge-error">Non-Compliant</span> regardless of other factors.</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                If notice is adequate and at least one requirement is met, the bill is <span className="badge badge-success badge-outline">Provisional</span> (counts toward compliance).</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>
                If notice data is missing or no progress is shown, the bill is being <span className="badge">Monitored</span> (excluded from compliance rate).</span>
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
                <span>All evidence requirements (reported out, votes posted, summaries posted) plus 10 days of advance notice of a hearing must be present for a bill to be <span className="badge badge-success">Compliant</span>.</span>
              </li>
            </ul>
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">The Decision-Making Logic (Step-by-Step)</h2>
          <p className="text-base-content/80 mb-6">
            Here's the exact order in which the system evaluates each bill:
          </p>
          
          {/* Step 1 */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="badge badge-primary badge-lg">Step 1</div>
              <h3 className="font-semibold text-lg">Check if there was a hearing</h3>
            </div>
            <div className="ml-20 pl-4 border-l-2 border-primary/30">
              <p className="text-base-content/80">
                If no hearing date exists → <span className="badge badge-success badge-outline">Provisional</span> <span className="text-sm opacity-70">(can't evaluate without a hearing)</span>
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="badge badge-primary badge-lg">Step 2</div>
              <h3 className="font-semibold text-lg">Check the hearing notice</h3>
            </div>
            <div className="ml-20 pl-4 border-l-2 border-primary/30 space-y-4">
              <p className="text-base-content/80 mb-3">
                The system looks for the "Hearing scheduled for [date]" announcement on the bill's page.
              </p>
              
              <div className="bg-base-200 p-4 rounded-lg">
                <p className="font-semibold mb-2">For hearings announced <strong>BEFORE June 26, 2025:</strong></p>
                <p className="text-base-content/80">
                  Automatically considered compliant with notice requirements (exempt from 10-day rule)
                </p>
              </div>

              <div className="bg-base-200 p-4 rounded-lg">
                <p className="font-semibold mb-2">For hearings announced <strong>ON or AFTER June 26, 2025:</strong></p>
                <ul className="space-y-2 text-base-content/80">
                  <li>• Calculate the gap between announcement date and hearing date</li>
                  <li>• If gap is less than 10 days → <span className="badge badge-error">Non-Compliant</span> <span className="text-sm opacity-70">(deal-breaker, stops here)</span></li>
                  <li>• If gap is 10+ days → Continue to Step 3</li>
                </ul>
              </div>

              <div className="bg-base-200 p-4 rounded-lg">
                <p className="font-semibold mb-2">If announcement not found:</p>
                <ul className="space-y-2 text-base-content/80">
                  <li>• If we also can't find any summaries or votes → <span className="badge badge-success badge-outline">Provisional</span> <span className="text-sm opacity-70">(not enough info)</span></li>
                  <li>• If we found summaries or votes → <span className="badge badge-error">Non-Compliant</span> <span className="text-sm opacity-70">(evidence exists but no announcement)</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="badge badge-primary badge-lg">Step 3</div>
              <h3 className="font-semibold text-lg">Calculate the deadline</h3>
            </div>
            <div className="ml-20 pl-4 border-l-2 border-primary/30 space-y-3">
              <div className="bg-base-200 p-4 rounded-lg">
                <p className="font-semibold mb-2">For House bills:</p>
                <p className="text-base-content/80">60 days (or extension date if approved, capped at 90 days)</p>
              </div>
              <div className="bg-base-200 p-4 rounded-lg">
                <p className="font-semibold mb-2">For Senate bills:</p>
                <p className="text-base-content/80">First Wednesday of December of the legislative year (or extension date if approved)</p>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="badge badge-primary badge-lg">Step 4</div>
              <h3 className="font-semibold text-lg">Check what the committee has done</h3>
            </div>
            <div className="ml-20 pl-4 border-l-2 border-primary/30">
              <p className="text-base-content/80 mb-3">Count how many of these three things are true:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <div>
                    <span className="font-semibold">Reported Out:</span>
                    <span className="text-base-content/80 ml-1">The bill page shows the committee made a decision (keywords like "reported favorably," "reported adversely," "study," "discharge")</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <div>
                    <span className="font-semibold">Summary Posted:</span>
                    <span className="text-base-content/80 ml-1">The system found and confirmed a bill summary document</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <div>
                    <span className="font-semibold">Votes Posted:</span>
                    <span className="text-base-content/80 ml-1">The system found and confirmed a vote record document</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="mb-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="badge badge-primary badge-lg">Step 5</div>
              <h3 className="font-semibold text-lg">Apply the compliance rules</h3>
            </div>
            <div className="ml-20 pl-4 border-l-2 border-primary/30 space-y-3">
              <div className="bg-success/10 border-l-4 border-success p-4 rounded">
                <p className="text-base-content/80">
                  If all 3 things are true (reported out + summary + votes):
                  <br />
                  → <span className="badge badge-success">Compliant</span>
                </p>
              </div>
              <div className="bg-success/10 border-l-4 border-success/50 p-4 rounded">
                <p className="text-base-content/80">
                  If notice is adequate and at least 1 of the 3 requirements is met:
                  <br />
                  → <span className="badge badge-success badge-outline">Provisional</span> <span className="text-sm opacity-70">(on track, counts toward compliance)</span>
                </p>
              </div>
              <div className="bg-success/10 border-l-4 border-success/30 p-4 rounded">
                <p className="text-base-content/80">
                  If no hearing or no evidence of progress:
                  <br />
                  → <span className="badge badge-success badge-outline">Provisional</span> <span className="text-sm opacity-70">(insufficient data, excluded from stats)</span>
                </p>
              </div>
              <div className="bg-error/10 border-l-4 border-error p-4 rounded">
                <p className="text-base-content/80">
                  If notice failed or deadline passed without completion:
                  <br />
                  → <span className="badge badge-error">Non-Compliant</span>
                </p>
              </div>
            </div>
          </div>
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


