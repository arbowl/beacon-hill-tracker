const TOSPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-xl text-gray-600">
          Terms and conditions for using our service.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
        <p className="text-gray-600">
          By accessing and using the Beacon Hill Compliance Tracker, you accept 
          and agree to be bound by the terms and provision of this agreement.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Use License</h2>
        <p className="text-gray-600 mb-4">
          Permission is granted to temporarily access the materials on this website 
          for personal, non-commercial transitory viewing only. This is the grant 
          of a license, not a transfer of title, and under this license you may not:
        </p>
        <ul className="space-y-2 text-gray-600">
          <li>• Modify or copy the materials</li>
          <li>• Use the materials for commercial purposes</li>
          <li>• Attempt to reverse engineer any software</li>
          <li>• Remove any copyright or proprietary notations</li>
        </ul>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts</h2>
        <p className="text-gray-600">
          You are responsible for maintaining the confidentiality of your account 
          and password. You agree to accept responsibility for all activities that 
          occur under your account.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimer</h2>
        <p className="text-gray-600">
          The materials on this website are provided on an 'as is' basis. We make 
          no warranties, expressed or implied, and hereby disclaim all other 
          warranties including implied warranties of merchantability, fitness for 
          a particular purpose, or non-infringement.
        </p>
      </div>

      <div className="dashboard-card">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
        <p className="text-gray-600">
          If you have any questions about these Terms of Service, please contact 
          us at legal@beaconhilltracker.org.
        </p>
      </div>
    </div>
  )
}

export default TOSPage
