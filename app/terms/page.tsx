export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Harvest Hub – Terms and Conditions
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              1. Account Registration & Responsibilities
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-4">By creating an account, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Provide accurate, current, and complete information.</li>
                <li>Maintain the confidentiality of your login credentials.</li>
                <li>Be fully responsible for all activities under your account.</li>
              </ul>
              <p>
                Harvest Hub facilitates the purchase and delivery of fresh produce and products 
                directly from local farms. You must be at least 18 years old or have the consent 
                of a legal guardian to use our services.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              2. Orders & Payments
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <ul className="list-disc list-inside space-y-2">
                <li>All prices displayed include applicable taxes and may include delivery fees.</li>
                <li>Payments are processed securely through trusted third-party providers.</li>
                <li>Due to the perishable nature of our products, orders cannot be canceled, modified, or refunded once confirmed.</li>
                <li>Ensure your order details are accurate before finalizing your purchase.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              3. Delivery & Returns
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Delivery schedules are provided as estimates and may vary based on location and availability.</li>
                <li>We only offer refunds or replacements for:
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Spoiled, damaged, or incorrect items.</li>
                    <li>Claims made within 24 hours of delivery, with supporting photo evidence.</li>
                  </ul>
                </li>
              </ul>
              <p>
                It is your responsibility to provide a complete and accurate delivery address. 
                Harvest Hub is not liable for failed deliveries due to incorrect or incomplete information.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              4. User Conduct
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Use the platform for unlawful, fraudulent, or harmful activities.</li>
                <li>Impersonate any person or entity.</li>
                <li>Attempt to gain unauthorized access or disrupt the security of the platform.</li>
              </ul>
              <p>
                Violation of these terms may result in suspension or termination of your account.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              5. Privacy and Intellectual Property
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <ul className="list-disc list-inside space-y-2">
                <li>We value your privacy and handle your data in accordance with our Privacy Policy.</li>
                <li>All content, including trademarks, logos, and media, is the property of Harvest Hub or its licensors.</li>
                <li>By continuing to use our services, you accept any updates to these Terms.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              6. Limitation of Liability & Contact
            </h2>
            <div className="text-gray-700 leading-relaxed">
              <p className="mb-4">
                Harvest Hub is not liable for any indirect, incidental, or consequential damages 
                arising from your use of the platform.
              </p>
              <p>
                For support or inquiries, contact us at:{" "}
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
