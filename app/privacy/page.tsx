export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Harvest Hub – Privacy Policy
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              1. Information We Collect
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-4">We collect personal and transactional data when you:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Create or update your account</li>
                <li>Browse, post, or purchase products</li>
                <li>Communicate with other users or our support team</li>
              </ul>
              <p className="mb-4">This may include:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your name, email address, phone number, and delivery address</li>
                <li>Login credentials and account preferences</li>
                <li>Payment and transaction details (handled via secure payment gateways)</li>
                <li>Any other information you choose to provide</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              2. How We Use Your Information
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Operate and maintain the platform</li>
                <li>Facilitate transactions and deliveries</li>
                <li>Connect buyers with farmers and sellers</li>
                <li>Send service-related notifications (e.g. order updates)</li>
                <li>Enhance user experience and improve platform functionality</li>
                <li>Detect and prevent fraud, abuse, or unauthorized access</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              3. Information Sharing
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-4">We may share your data in the following situations:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>With other users:</strong> Public profile details and product listings are visible to others on the platform.</li>
                <li><strong>With service providers:</strong> We work with third-party partners (e.g. payment processors, logistics providers) to deliver our services.</li>
                <li><strong>For legal or business reasons:</strong> We may disclose data when required by law, to enforce our terms, or during a business transfer (e.g. merger, acquisition).</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              4. Data Security
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p>
                We implement industry-standard safeguards to protect your data against unauthorized access, 
                loss, or misuse. However, please note that no method of transmission over the internet is 
                100% secure. We encourage you to use strong passwords and keep your login credentials confidential.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              5. Your Rights & Choices
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Access, correct, or delete your personal information</li>
                <li>Manage your communication preferences (e.g. opt out of marketing emails)</li>
                <li>Request limitations on how your data is used</li>
              </ul>
              <p>
                To exercise these rights, contact us at:{" "}
                <a href="mailto:contactharvesthub2025@gmail.com" className="text-green-600 hover:text-green-800 underline">
                  contactharvesthub2025@gmail.com
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              6. Cookies & Tracking
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-4">We use cookies and similar tools to:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Analyze usage and performance</li>
                <li>Personalize content and recommendations</li>
                <li>Remember your preferences</li>
              </ul>
              <p>
                You can manage or disable cookies through your browser settings, though some features 
                may be limited as a result.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              7. Third-Party Services & External Links
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p>
                Our platform may contain links to third-party websites or services. We are not responsible 
                for the privacy practices or content of those external sites. Additionally, our platform 
                is not intended for children under the age of 13. We do not knowingly collect data from minors.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              8. Policy Updates
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p>
                We may update this Privacy Policy periodically to reflect changes in our practices or 
                legal requirements. When we do, we will update the "Effective Date" above. Continued 
                use of our services after any changes indicates your acceptance of the updated policy.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              9. Contact Us
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy, please reach out to us:
              </p>
              <p className="mt-2">
                <a href="mailto:contactharvesthub2025@gmail.com" className="text-green-600 hover:text-green-800 underline">
                  contactharvesthub2025@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <a
            href="/auth"
            className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
          >
            ← Back to Registration
          </a>
        </div>
      </div>
    </div>
  );
}
