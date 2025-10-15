const PrivacyPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-xl text-gray-600">
          How we collect, use, and protect your information.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
        <p className="text-gray-600 mb-4">
          We collect minimal information necessary to provide our services:
        </p>
        <ul className="space-y-2 text-gray-600">
          <li>• Email address for account creation and authentication</li>
          <li>• Saved dashboard views and preferences</li>
          <li>• Usage analytics to improve our service</li>
          <li>• Technical logs for security and debugging purposes</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
        <ul className="space-y-2 text-gray-600">
          <li>• To provide and maintain our service</li>
          <li>• To notify you about changes to our service</li>
          <li>• To provide customer support</li>
          <li>• To detect and prevent fraud or abuse</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Protection</h2>
        <p className="text-gray-600">
          We implement appropriate security measures to protect your personal 
          information against unauthorized access, alteration, disclosure, or 
          destruction. Your data is encrypted in transit and at rest.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
        <p className="text-gray-600">
          If you have any questions about this Privacy Policy, please contact us 
          at privacy@beaconhilltracker.org.
        </p>
      </div>
    </div>
  )
}

export default PrivacyPage
