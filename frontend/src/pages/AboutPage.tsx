const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">About Our Methodology</h1>
        <p className="text-xl text-base-content/70">
          How we track legislative transparency with precision and impartiality.
        </p>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">🎯 Our Mission</h2>
          <p className="text-base-content/80 mb-4">
            The Beacon Hill Compliance Tracker promotes transparency and accountability 
            in the Massachusetts legislative process by automatically tracking committee 
            compliance with legislative deadlines and requirements.
          </p>
          <p className="text-base-content/80">
            We believe that citizens have the right to know how their representatives 
            are managing the legislative process and whether committees are meeting 
            their obligations under state law.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">🔍 What We Track</h2>
            <ul className="space-y-3 text-base-content/80">
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Committee compliance with 60-day reporting deadlines</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Availability of bill summaries and voting records</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Hearing notice requirements and scheduling</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Extension orders and deadline modifications</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary mr-2">•</span>
                <span>Overall legislative process transparency</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">📊 Data Sources</h2>
            <p className="text-base-content/80 mb-4">
              All data is collected from official Massachusetts Legislature websites 
              and public records through automated systems that run continuously.
            </p>
            <div className="bg-base-200 p-3 rounded-lg">
              <p className="text-sm text-base-content/70">
                <strong>Note:</strong> We track procedural compliance, not legislative content. 
                Our analysis is purely factual and non-partisan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-primary text-primary-content shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">🤖 Automated Collection Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🕷️</div>
              <h3 className="font-semibold mb-2">Web Scraping</h3>
              <p className="text-sm opacity-90">
                Automated bots collect data from official legislature websites 24/7
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">⚙️</div>
              <h3 className="font-semibold mb-2">Data Processing</h3>
              <p className="text-sm opacity-90">
                Smart algorithms parse documents and extract compliance information
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <h3 className="font-semibold mb-2">Real-time Updates</h3>
              <p className="text-sm opacity-90">
                Dashboard reflects the latest data with minimal delay
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">🔬 Quality Assurance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 text-success">✅ What We Do</h3>
              <ul className="space-y-2 text-base-content/80">
                <li>• Cross-reference multiple official sources</li>
                <li>• Validate data against legislative calendars</li>
                <li>• Track changes over time for accuracy</li>
                <li>• Provide transparent methodology</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 text-warning">⚠️ What We Don't Do</h3>
              <ul className="space-y-2 text-base-content/80">
                <li>• Make political judgments</li>
                <li>• Analyze bill content or merit</li>
                <li>• Advocate for specific policies</li>
                <li>• Interpret legislative intent</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow-md">
        <div className="card-body text-center">
          <h2 className="card-title text-2xl mb-4 justify-center">🚀 Get Started</h2>
          <p className="text-base-content/80 mb-6">
            Ready to explore legislative transparency data? Start with our interactive dashboard.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/dashboard" className="btn btn-primary">
              View Dashboard
            </a>
            <a href="/contact" className="btn btn-outline">
              Contact Us
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
