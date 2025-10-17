const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-xl text-gray-600">
          Last Updated: October 17, 2024
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
        <p className="text-gray-600 mb-4">
          Beacon Hill Compliance Tracker ("we," "our," or "us") is committed to protecting your privacy. 
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
          you use our web application that tracks legislative compliance with Massachusetts transparency requirements.
        </p>
        <p className="text-gray-600">
          By using our service, you agree to the collection and use of information in accordance with this policy. 
          If you do not agree with our policies and practices, please do not use our service.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
        <p className="text-gray-600 mb-4">
          We collect only the minimal information necessary to provide our services. The types of information 
          we collect include:
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1 Account Information</h3>
        <p className="text-gray-600 mb-2">When you create an account, we collect:</p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• Email address (used for authentication and communication)</li>
          <li>• Password (stored as a cryptographic hash, never in plain text)</li>
          <li>• Account role (user, privileged, or admin)</li>
          <li>• Account status (active or inactive)</li>
          <li>• Account creation date</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Dashboard Preferences</h3>
        <p className="text-gray-600 mb-2">For registered users who save custom views, we store:</p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• Saved view names and configurations (filters, committee selections, display preferences)</li>
          <li>• View creation and modification timestamps</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 Authentication Tokens</h3>
        <p className="text-gray-600 mb-2">We generate temporary tokens for:</p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• Email verification (expires after 24 hours)</li>
          <li>• Password reset (expires after 1 hour)</li>
          <li>• Session authentication (JWT tokens, configurable expiration)</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.4 Signing Keys (Privileged Users Only)</h3>
        <p className="text-gray-600 mb-2">For users authorized to submit compliance data, we generate and store:</p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• Cryptographic key pairs (key ID and secret) for HMAC signature verification</li>
          <li>• Key creation and revocation timestamps</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.5 Contact Form Data</h3>
        <p className="text-gray-600 mb-2">When you submit our contact form, we collect:</p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• Your name</li>
          <li>• Your email address</li>
          <li>• Message subject</li>
          <li>• Message content</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.6 Technical and Security Data</h3>
        <p className="text-gray-600 mb-2">To maintain security and service quality, we automatically collect:</p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• IP addresses (for rate limiting and abuse prevention)</li>
          <li>• Request timestamps</li>
          <li>• User agent strings (browser and device information)</li>
          <li>• Error logs and system diagnostics</li>
          <li>• Authentication attempt logs</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.7 Public Legislative Data</h3>
        <p className="text-gray-600">
          Our service displays publicly available Massachusetts legislative compliance data (committee information, 
          bill statuses, compliance reports). This data is not personal information and is sourced from official 
          public records.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
        <p className="text-gray-600 mb-4">
          We use the information we collect for the following purposes:
        </p>
        <ul className="space-y-2 text-gray-600">
          <li>• <strong>Account Management:</strong> To create, maintain, and authenticate your user account</li>
          <li>• <strong>Email Verification:</strong> To verify your email address and send account-related notifications</li>
          <li>• <strong>Password Reset:</strong> To process password reset requests securely</li>
          <li>• <strong>Service Delivery:</strong> To provide dashboard functionality, save your preferences, and display legislative compliance data</li>
          <li>• <strong>Communication:</strong> To respond to your contact form submissions and provide customer support</li>
          <li>• <strong>Data Integrity:</strong> To authenticate data submissions from authorized users via signing keys</li>
          <li>• <strong>Security:</strong> To protect against fraud, abuse, unauthorized access, and other security threats</li>
          <li>• <strong>Rate Limiting:</strong> To prevent service abuse and ensure fair usage for all users</li>
          <li>• <strong>Technical Maintenance:</strong> To diagnose technical issues, improve service performance, and maintain system reliability</li>
          <li>• <strong>Legal Compliance:</strong> To comply with applicable laws and legal obligations</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Storage and Retention</h2>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Storage Location</h3>
        <p className="text-gray-600 mb-4">
          Your data is stored in secure databases maintained by our service. We use two separate databases:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• <strong>Authentication Database:</strong> Stores user accounts, saved views, signing keys, and email tokens</li>
          <li>• <strong>Compliance Database:</strong> Stores public legislative compliance data</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Retention Period</h3>
        <p className="text-gray-600 mb-2">We retain your information as follows:</p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• <strong>Account Information:</strong> Retained for the duration of your account and for a reasonable period after account deletion for legal compliance</li>
          <li>• <strong>Saved Views:</strong> Retained until you delete them or your account is deleted</li>
          <li>• <strong>Email Verification Tokens:</strong> Automatically deleted after 24 hours or upon use</li>
          <li>• <strong>Password Reset Tokens:</strong> Automatically deleted after 1 hour or upon use</li>
          <li>• <strong>Signing Keys:</strong> Retained until revoked by you or an administrator</li>
          <li>• <strong>Contact Form Messages:</strong> Retained only as long as necessary to respond to your inquiry</li>
          <li>• <strong>Technical Logs:</strong> Retained for up to 90 days for security and debugging purposes</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
        <p className="text-gray-600 mb-4">
          We implement industry-standard security measures to protect your personal information:
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Encryption</h3>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• <strong>In Transit:</strong> All data transmitted between your browser and our servers is encrypted using HTTPS/TLS</li>
          <li>• <strong>At Rest:</strong> Passwords are stored using cryptographic hashing (Werkzeug security)</li>
          <li>• <strong>Tokens:</strong> All authentication and verification tokens are generated using secure random methods</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Access Controls</h3>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• JWT-based authentication for all protected endpoints</li>
          <li>• Role-based access control (user, privileged, admin)</li>
          <li>• HMAC signature verification for data ingestion</li>
          <li>• Users can only access and modify their own saved views and data</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Security Features</h3>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• Rate limiting to prevent brute force attacks</li>
          <li>• CORS (Cross-Origin Resource Sharing) protection</li>
          <li>• Content Security Policy (CSP) headers</li>
          <li>• XSS (Cross-Site Scripting) protection</li>
          <li>• Clickjacking protection (X-Frame-Options)</li>
          <li>• MIME type sniffing prevention</li>
          <li>• Input validation and sanitization</li>
          <li>• Request size limits to prevent denial-of-service attacks</li>
          <li>• Suspicious user agent blocking</li>
        </ul>

        <p className="text-gray-600 mt-4">
          While we strive to protect your personal information, no method of transmission over the internet or 
          electronic storage is 100% secure. We cannot guarantee absolute security but continuously work to 
          improve our security measures.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Information Sharing and Disclosure</h2>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 We Do Not Sell Your Data</h3>
        <p className="text-gray-600 mb-4">
          We do not sell, rent, or trade your personal information to third parties for marketing purposes.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Service Providers</h3>
        <p className="text-gray-600 mb-4">
          We may share your information with trusted service providers who assist us in operating our service:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• <strong>Email Service:</strong> We use SMTP email services to send verification emails, password reset emails, 
          and contact form notifications. Your email address is shared only for the purpose of delivering these messages.</li>
          <li>• <strong>Hosting Providers:</strong> Our application and databases are hosted on secure servers.</li>
        </ul>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 Legal Requirements</h3>
        <p className="text-gray-600 mb-2">
          We may disclose your information if required to do so by law or in response to:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• Valid legal processes (subpoenas, court orders, etc.)</li>
          <li>• Government or law enforcement requests</li>
          <li>• Protection of our rights, property, or safety</li>
          <li>• Protection of the rights, property, or safety of our users or the public</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
        <p className="text-gray-600 mb-4">
          You have the following rights regarding your personal information:
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 Access and Update</h3>
        <p className="text-gray-600 mb-4">
          You can access and view your account information by logging into your account. You can update your 
          email address and password through the account settings.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">7.2 Saved Views Management</h3>
        <p className="text-gray-600 mb-4">
          You can create, view, update, and delete your saved dashboard views at any time through the 
          application interface.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">7.3 Signing Keys Management</h3>
        <p className="text-gray-600 mb-4">
          If you have privileged or admin access, you can view, generate, and revoke your signing keys 
          through the Keys page.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">7.4 Account Deletion</h3>
        <p className="text-gray-600 mb-4">
          You may request deletion of your account by contacting us. Upon account deletion, we will delete 
          or anonymize your personal information, except as required for legal compliance or legitimate 
          business purposes (such as fraud prevention).
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">7.5 Email Communications</h3>
        <p className="text-gray-600 mb-4">
          We send transactional emails (verification, password reset) that are necessary for the operation 
          of your account. You cannot opt out of these messages while maintaining an active account.
        </p>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">7.6 Do Not Track</h3>
        <p className="text-gray-600 mb-4">
          Our service does not track users across third-party websites and does not respond to Do Not Track 
          signals.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
        <p className="text-gray-600 mb-4">
          Our service uses minimal cookies and tracking:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• <strong>Authentication Tokens:</strong> We use JWT (JSON Web Tokens) stored in your browser's 
          local storage to maintain your login session</li>
          <li>• <strong>No Third-Party Tracking:</strong> We do not use third-party analytics, advertising cookies, 
          or tracking pixels</li>
          <li>• <strong>Essential Functionality Only:</strong> Any data stored locally is essential for the 
          application to function properly</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
        <p className="text-gray-600">
          Our service is not directed to individuals under the age of 13. We do not knowingly collect personal 
          information from children under 13. If you become aware that a child has provided us with personal 
          information, please contact us, and we will take steps to delete such information.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Users</h2>
        <p className="text-gray-600 mb-4">
          Our service is hosted in the United States and is intended for users in the United States. If you 
          access our service from outside the United States, please be aware that your information may be 
          transferred to, stored, and processed in the United States where our servers are located.
        </p>
        <p className="text-gray-600">
          By using our service, you consent to the transfer of your information to the United States and 
          the processing of your information in accordance with this Privacy Policy.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
        <p className="text-gray-600 mb-4">
          We may update this Privacy Policy from time to time to reflect changes in our practices, 
          technology, legal requirements, or other factors. We will notify users of any material changes by:
        </p>
        <ul className="space-y-2 text-gray-600 ml-4 mb-4">
          <li>• Updating the "Last Updated" date at the top of this Privacy Policy</li>
          <li>• Posting a notice on our website or sending an email notification for significant changes</li>
        </ul>
        <p className="text-gray-600">
          Your continued use of our service after any changes indicates your acceptance of the updated 
          Privacy Policy. We encourage you to review this Privacy Policy periodically.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Data Breach Notification</h2>
        <p className="text-gray-600">
          In the event of a data breach that affects your personal information, we will notify you in 
          accordance with applicable law. We will take reasonable steps to remediate the breach and protect 
          your information from further unauthorized access.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Third-Party Links</h2>
        <p className="text-gray-600">
          Our service may contain links to external websites, including official Massachusetts legislative 
          websites. We are not responsible for the privacy practices of these third-party sites. We encourage 
          you to review the privacy policies of any external websites you visit.
        </p>
      </div>

      <div className="dashboard-card bg-blue-50 border-blue-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Us</h2>
        <p className="text-gray-600 mb-4">
          If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy 
          practices, please contact us:
        </p>
        <div className="space-y-2 text-gray-700">
          <p><strong>Email:</strong> privacy@beaconhilltracker.org</p>
          <p><strong>Contact Form:</strong> <a href="/contact" className="text-blue-600 hover:underline">Available on our website</a></p>
        </div>
        <p className="text-gray-600 mt-4">
          We will respond to your inquiry within a reasonable timeframe.
        </p>
      </div>

      <div className="dashboard-card bg-gray-50">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. California Privacy Rights</h2>
        <p className="text-gray-600 mb-4">
          If you are a California resident, you may have additional rights under the California Consumer 
          Privacy Act (CCPA):
        </p>
        <ul className="space-y-2 text-gray-600 ml-4">
          <li>• <strong>Right to Know:</strong> You have the right to request information about the personal 
          information we collect, use, and disclose</li>
          <li>• <strong>Right to Delete:</strong> You have the right to request deletion of your personal 
          information, subject to certain exceptions</li>
          <li>• <strong>Right to Opt-Out:</strong> We do not sell personal information, so there is no need 
          to opt out of sale</li>
          <li>• <strong>Right to Non-Discrimination:</strong> We will not discriminate against you for 
          exercising your privacy rights</li>
        </ul>
        <p className="text-gray-600 mt-4">
          To exercise these rights, please contact us using the information in Section 14.
        </p>
      </div>

      <div className="text-center text-gray-500 text-sm mt-8 p-4">
        <p>This Privacy Policy is effective as of October 17, 2024</p>
        <p className="mt-2">Beacon Hill Compliance Tracker</p>
      </div>
    </div>
  )
}

export default PrivacyPage
