const TOSPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-xl text-gray-600">
          Last Updated: October 17, 2024
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
        <p className="text-gray-600 mb-4">
          Welcome to Beacon Hill Compliance Tracker ("Service," "we," "our," or "us"). These Terms of Service 
          ("Terms") govern your access to and use of our web application that tracks legislative compliance 
          with Massachusetts transparency requirements.
        </p>
        <p className="text-gray-600 mb-4">
          By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy. 
          If you do not agree to these Terms, please do not use our Service.
        </p>
        <p className="text-gray-600">
          We reserve the right to modify these Terms at any time. Your continued use of the Service after 
          changes are posted constitutes your acceptance of the modified Terms.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
        <p className="text-gray-600 mb-4">
          Beacon Hill Compliance Tracker provides:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• Public access to Massachusetts legislative compliance data</li>
          <li>• Interactive dashboard with filtering and visualization tools</li>
          <li>• Committee and bill compliance tracking</li>
          <li>• Data export capabilities</li>
          <li>• User accounts with saved dashboard views (for registered users)</li>
          <li>• Cryptographic signing keys for authorized data submitters (privileged users)</li>
          <li>• Administrative tools for user and system management (admin users)</li>
        </ul>
        <p className="text-gray-600">
          The Service is provided for informational and transparency purposes. We aggregate and display 
          publicly available legislative compliance information but are not affiliated with any government entity.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Types</h3>
        <p className="text-gray-600 mb-2">Our Service offers three user levels:</p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• <strong>Guest:</strong> Access to public dashboard, data viewing, and export features (no account required)</li>
          <li>• <strong>Registered User:</strong> All guest features plus ability to save custom dashboard views</li>
          <li>• <strong>Privileged User:</strong> All registered features plus ability to generate signing keys for data submission</li>
          <li>• <strong>Administrator:</strong> All features plus user management and system administration</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Registration Requirements</h3>
        <p className="text-gray-600 mb-2">To create an account, you must:</p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• Provide a valid email address</li>
          <li>• Create a password of at least 8 characters</li>
          <li>• Verify your email address within 24 hours of registration</li>
          <li>• Be at least 13 years of age</li>
          <li>• Comply with all applicable laws and regulations</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Account Security</h3>
        <p className="text-gray-600 mb-2">You are responsible for:</p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• Maintaining the confidentiality of your password and account credentials</li>
          <li>• All activities that occur under your account</li>
          <li>• Notifying us immediately of any unauthorized access or security breach</li>
          <li>• Logging out from your account at the end of each session (especially on shared computers)</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">3.4 Email Verification</h3>
        <p className="text-gray-600">
          You must verify your email address to activate your account. Verification links expire after 
          24 hours. Unverified accounts may be deleted after a reasonable period of inactivity.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Permitted Uses</h3>
        <p className="text-gray-600 mb-2">You may use our Service to:</p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• View and analyze legislative compliance data</li>
          <li>• Export data for personal, educational, research, or journalistic purposes</li>
          <li>• Save and manage custom dashboard views (registered users)</li>
          <li>• Submit verified compliance data using authorized signing keys (privileged users)</li>
          <li>• Share information about legislative compliance with proper attribution</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Prohibited Activities</h3>
        <p className="text-gray-600 mb-2">You agree NOT to:</p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• Violate any applicable laws, regulations, or third-party rights</li>
          <li>• Use the Service for any illegal or unauthorized purpose</li>
          <li>• Attempt to gain unauthorized access to our systems or other user accounts</li>
          <li>• Engage in any form of automated data scraping, crawling, or harvesting without permission</li>
          <li>• Overload, disrupt, or impair the Service's infrastructure or servers</li>
          <li>• Upload viruses, malware, or any malicious code</li>
          <li>• Impersonate any person or entity or misrepresent your affiliation</li>
          <li>• Interfere with other users' ability to use the Service</li>
          <li>• Attempt to bypass rate limiting, security measures, or authentication mechanisms</li>
          <li>• Reverse engineer, decompile, or disassemble any software used in the Service</li>
          <li>• Use another user's account without permission</li>
          <li>• Share, sell, or distribute signing keys or access credentials</li>
          <li>• Submit false, misleading, or intentionally inaccurate data</li>
          <li>• Use the Service for any commercial purposes without prior written consent</li>
          <li>• Remove, obscure, or alter any legal notices, copyright, or proprietary markings</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Submissions (Privileged Users)</h2>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Signing Keys</h3>
        <p className="text-gray-600 mb-4">
          Privileged and administrator users may generate cryptographic signing keys to submit compliance 
          data to the Service. You are responsible for:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• Keeping your signing key secret secure and confidential</li>
          <li>• Not sharing your signing keys with unauthorized parties</li>
          <li>• Revoking compromised keys immediately</li>
          <li>• Ensuring all data submitted is accurate and verifiable</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Data Accuracy</h3>
        <p className="text-gray-600 mb-4">
          Users submitting compliance data represent and warrant that:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• All submitted data is accurate to the best of their knowledge</li>
          <li>• Data is obtained from legitimate, verifiable sources</li>
          <li>• They have the right to submit the data</li>
          <li>• The data complies with all applicable laws and regulations</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. User Content (Saved Views)</h2>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Your Content</h3>
        <p className="text-gray-600 mb-4">
          Registered users may create and save custom dashboard views. You retain all rights to your 
          saved views, but grant us a limited license to store and display them as necessary to provide 
          the Service.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Content Management</h3>
        <p className="text-gray-600 mb-4">
          You may create, view, update, and delete your saved views at any time. We are not responsible 
          for the loss of saved views due to technical issues, though we make reasonable efforts to 
          maintain data integrity.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Storage Limits</h3>
        <p className="text-gray-600">
          We reserve the right to impose reasonable limits on the number and size of saved views per user 
          to ensure fair use and system performance.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Our Content</h3>
        <p className="text-gray-600 mb-4">
          The Service, including its design, features, functionality, and underlying code, is owned by 
          Beacon Hill Compliance Tracker and is protected by copyright, trademark, and other intellectual 
          property laws.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Public Legislative Data</h3>
        <p className="text-gray-600 mb-4">
          The legislative compliance data displayed on our Service is derived from public records and 
          official government sources. This data is generally in the public domain and can be used in 
          accordance with applicable public records laws.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Attribution</h3>
        <p className="text-gray-600">
          If you use or reference data from our Service in publications, articles, or other works, we 
          appreciate (but do not require) attribution to Beacon Hill Compliance Tracker.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Rate Limiting and Fair Use</h2>
        <p className="text-gray-600 mb-4">
          To ensure fair access for all users and protect our infrastructure, we implement rate limiting:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• API requests are limited to 100 requests per hour per IP address (default)</li>
          <li>• Authentication endpoints have stricter limits (5 requests per minute)</li>
          <li>• Excessive automated requests may result in temporary or permanent blocking</li>
        </ul>
        <p className="text-gray-600">
          If you have legitimate needs that exceed these limits, please contact us to discuss options.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Privacy and Data Protection</h2>
        <p className="text-gray-600 mb-4">
          Your use of the Service is also governed by our Privacy Policy, which is incorporated into 
          these Terms by reference. Please review our Privacy Policy to understand how we collect, use, 
          and protect your information.
        </p>
        <p className="text-gray-600">
          Key points:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mt-2">
          <li>• We collect minimal personal information (email, saved preferences)</li>
          <li>• Passwords are cryptographically hashed and never stored in plain text</li>
          <li>• We do not sell your personal data to third parties</li>
          <li>• You can request deletion of your account and data at any time</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Account Termination and Suspension</h2>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">10.1 Termination by User</h3>
        <p className="text-gray-600 mb-4">
          You may terminate your account at any time by contacting us. Upon termination, your account 
          and saved views will be deleted or anonymized in accordance with our Privacy Policy.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">10.2 Termination by Us</h3>
        <p className="text-gray-600 mb-2">
          We reserve the right to suspend or terminate your account and access to the Service, without 
          notice, for:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• Violation of these Terms of Service</li>
          <li>• Fraudulent, abusive, or illegal activity</li>
          <li>• Prolonged inactivity (unverified accounts after 30 days)</li>
          <li>• Security concerns or suspected unauthorized access</li>
          <li>• Legal or regulatory requirements</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">10.3 Effect of Termination</h3>
        <p className="text-gray-600">
          Upon termination, your right to access and use the Service immediately ceases. Sections of these 
          Terms that by their nature should survive termination will remain in effect (including disclaimers, 
          limitations of liability, and dispute resolution provisions).
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Disclaimers and Warranties</h2>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">11.1 "As Is" Service</h3>
        <p className="text-gray-600 mb-4">
          THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, 
          EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
          FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">11.2 Data Accuracy</h3>
        <p className="text-gray-600 mb-4">
          We strive to provide accurate and up-to-date legislative compliance information. However, we do 
          not warrant or guarantee:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• The accuracy, completeness, or timeliness of any data displayed</li>
          <li>• That the Service will be uninterrupted, secure, or error-free</li>
          <li>• That defects will be corrected</li>
          <li>• That the Service or servers are free from viruses or harmful components</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">11.3 No Legal Advice</h3>
        <p className="text-gray-600 mb-4">
          The Service provides informational content only and does not constitute legal advice. You should 
          not rely on the Service as a substitute for professional legal consultation.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">11.4 Third-Party Sources</h3>
        <p className="text-gray-600">
          Our Service may link to or reference third-party websites and data sources. We are not responsible 
          for the accuracy, availability, or content of any third-party resources.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Limitation of Liability</h2>
        <p className="text-gray-600 mb-4">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, BEACON HILL COMPLIANCE TRACKER AND ITS AFFILIATES, 
          OFFICERS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• Any indirect, incidental, special, consequential, or punitive damages</li>
          <li>• Loss of profits, data, use, goodwill, or other intangible losses</li>
          <li>• Damages resulting from unauthorized access to or alteration of your transmissions or data</li>
          <li>• Statements or conduct of any third party on the Service</li>
          <li>• Any interruption or cessation of the Service</li>
          <li>• Bugs, viruses, or the like transmitted through the Service by any third party</li>
          <li>• Errors or omissions in any content or data</li>
        </ul>
        <p className="text-gray-600 mb-4">
          WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, 
          AND WHETHER OR NOT WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p className="text-gray-600">
          IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES, OR CAUSES OF ACTION 
          EXCEED THE AMOUNT YOU HAVE PAID US IN THE LAST TWELVE (12) MONTHS, OR ONE HUNDRED DOLLARS 
          ($100), WHICHEVER IS GREATER.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Indemnification</h2>
        <p className="text-gray-600 mb-4">
          You agree to indemnify, defend, and hold harmless Beacon Hill Compliance Tracker and its 
          affiliates, officers, directors, employees, agents, and licensors from and against any and all 
          claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' 
          fees) arising from:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• Your use or misuse of the Service</li>
          <li>• Your violation of these Terms</li>
          <li>• Your violation of any rights of another party</li>
          <li>• Your violation of any applicable laws or regulations</li>
          <li>• Any data or content you submit to the Service</li>
          <li>• Unauthorized use of your account by third parties due to your negligence</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Service Modifications and Availability</h2>
        <p className="text-gray-600 mb-4">
          We reserve the right to:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• Modify, suspend, or discontinue any part of the Service at any time</li>
          <li>• Change features, functionality, or content</li>
          <li>• Impose limits on certain features or restrict access to parts of the Service</li>
          <li>• Perform maintenance that may temporarily limit or prevent access</li>
        </ul>
        <p className="text-gray-600">
          We will make reasonable efforts to notify users of significant changes but are not obligated 
          to do so. We shall not be liable for any modification, suspension, or discontinuance of the Service.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Changes to Terms of Service</h2>
        <p className="text-gray-600 mb-4">
          We may revise these Terms from time to time. We will notify users of material changes by:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• Updating the "Last Updated" date at the top of these Terms</li>
          <li>• Posting a notice on our website</li>
          <li>• Sending an email notification (for significant changes)</li>
        </ul>
        <p className="text-gray-600">
          Your continued use of the Service after any changes indicates your acceptance of the modified 
          Terms. If you do not agree to the modified Terms, you must stop using the Service.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Dispute Resolution and Governing Law</h2>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">16.1 Governing Law</h3>
        <p className="text-gray-600 mb-4">
          These Terms shall be governed by and construed in accordance with the laws of the Commonwealth 
          of Massachusetts, United States, without regard to its conflict of law provisions.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">16.2 Dispute Resolution</h3>
        <p className="text-gray-600 mb-4">
          Before filing any formal claim, you agree to first contact us and attempt to resolve the dispute 
          informally. We will attempt to resolve disputes in good faith.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">16.3 Jurisdiction</h3>
        <p className="text-gray-600">
          You agree that any legal action or proceeding relating to your access to or use of the Service 
          shall be instituted in a state or federal court in Massachusetts. You agree to submit to the 
          jurisdiction of such courts and waive any objection to venue.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Severability</h2>
        <p className="text-gray-600">
          If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining 
          provisions shall continue in full force and effect. The invalid provision shall be modified to the 
          minimum extent necessary to make it valid and enforceable.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Entire Agreement</h2>
        <p className="text-gray-600">
          These Terms, together with our Privacy Policy, constitute the entire agreement between you and 
          Beacon Hill Compliance Tracker regarding the use of the Service and supersede all prior or 
          contemporaneous communications and proposals.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">19. Waiver</h2>
        <p className="text-gray-600">
          Our failure to enforce any right or provision of these Terms shall not constitute a waiver of 
          such right or provision. Any waiver of any provision will be effective only if in writing and 
          signed by an authorized representative.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">20. Assignment</h2>
        <p className="text-gray-600">
          You may not assign or transfer these Terms or your rights hereunder without our prior written 
          consent. We may assign these Terms without restriction. Any attempted assignment in violation 
          of this section shall be null and void.
        </p>
      </div>

      <div className="dashboard-card bg-blue-50 border-blue-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">21. Contact Information</h2>
        <p className="text-gray-600 mb-4">
          If you have any questions, concerns, or feedback regarding these Terms of Service, please 
          contact us:
        </p>
        <div className="space-y-2 text-gray-700">
          <p><strong>Email:</strong> legal@beaconhilltracker.org</p>
          <p><strong>Contact Form:</strong> <a href="/contact" className="text-blue-600 hover:underline">Available on our website</a></p>
        </div>
        <p className="text-gray-600 mt-4">
          We will respond to your inquiry within a reasonable timeframe.
        </p>
      </div>

      <div className="dashboard-card bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">22. Acknowledgment</h2>
        <p className="text-gray-600 mb-4">
          BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, UNDERSTAND 
          THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT USE 
          THE SERVICE.
        </p>
        <p className="text-gray-600">
          These Terms of Service apply to all users of the Service, including guests, registered users, 
          privileged users, and administrators.
        </p>
      </div>

      <div className="text-center text-gray-500 text-sm mt-8 p-4">
        <p>These Terms of Service are effective as of October 17, 2024</p>
        <p className="mt-2">Beacon Hill Compliance Tracker</p>
      </div>
    </div>
  )
}

export default TOSPage
