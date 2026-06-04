export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-surface-300 leading-relaxed">
        <p className="text-surface-400 text-sm">Last updated: June 2, 2026</p>

        <h2 className="text-xl font-semibold text-white">1. Data Collection</h2>
        <p>Fixelo does not collect, store, or transmit any user data from scripts run on user devices. Scripts run entirely on the user's local machine — no data is sent back to Fixelo servers.</p>

        <h2 className="text-xl font-semibold text-white">2. Script Logs</h2>
        <p>The log that is copied to the user's clipboard contains only Windows system configuration data — no personal files, passwords, or private information. If the user chooses to paste their log on the website for diagnosis, that data is processed by Google Gemini API and is subject to Google's privacy policy.</p>

        <h2 className="text-xl font-semibold text-white">3. AI Processing</h2>
        <p>When you describe a problem, your description is sent to Google Gemini API for script generation. This processing is subject to <a href="https://ai.google.dev/privacy" className="text-brand-400 hover:text-brand-300 underline">Google's AI privacy policy</a>. Fixelo does not store your problem descriptions after the script is generated.</p>

        <h2 className="text-xl font-semibold text-white">4. Local Storage</h2>
        <p>Fixelo uses browser localStorage to save your fix history (up to 10 recent fixes). This data is stored only on your device and is never transmitted to any server. You can clear this data at any time by clicking "Clear All" on the My Fixes page.</p>

        <h2 className="text-xl font-semibold text-white">5. Cookies</h2>
        <p>Cookies are used only for session management. In the future, Google AdSense may use cookies to serve relevant ads — users can opt out through Google's ad settings.</p>

        <h2 className="text-xl font-semibold text-white">6. No Data Sales</h2>
        <p>Fixelo does not sell user data to any third party.</p>

        <h2 className="text-xl font-semibold text-white">7. Third-Party Services</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Google Gemini API</strong> — processes problem descriptions to generate scripts</li>
          <li><strong>Cloudflare Pages</strong> — hosts the website</li>
        </ul>
      </div>
    </div>
  )
}