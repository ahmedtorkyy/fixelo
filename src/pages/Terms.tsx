export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-surface-300 leading-relaxed">
        <p className="text-surface-400 text-sm">Last updated: June 2, 2026</p>

        <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
        <p>By accessing and using Fixelo, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.</p>

        <h2 className="text-xl font-semibold text-white">2. Description of Service</h2>
        <p>Fixelo provides AI-generated Windows automation and repair scripts based on user-described problems. Scripts are generated in the user's browser and downloaded directly — no files are stored on any server.</p>

        <h2 className="text-xl font-semibold text-white">3. Use at Your Own Risk</h2>
        <p>Fixelo provides scripts for informational and utility purposes only. Users run all scripts entirely at their own risk and discretion. Fixelo is not responsible for any data loss, system damage, or unintended consequences resulting from running any script.</p>

        <h2 className="text-xl font-semibold text-white">4. User Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Users must have administrator rights on the device they are modifying.</li>
          <li>Scripts must only be run on devices owned by the user or devices the user has explicit permission to modify.</li>
          <li>Users should create a system restore point before running any script.</li>
          <li>Users are encouraged to review the script code before running it.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">5. No Guarantee</h2>
        <p>Fixelo does not guarantee that any script will work on every Windows configuration. Windows systems vary widely and results may differ based on hardware, software, and configuration differences.</p>

        <h2 className="text-xl font-semibold text-white">6. Script Content</h2>
        <p>Fixelo reserves the right to update, modify, or remove any script from the platform at any time. All generated scripts use publicly documented Windows features and APIs.</p>

        <h2 className="text-xl font-semibold text-white">7. Intellectual Property</h2>
        <p>Generated scripts are provided for personal use. The Fixelo platform, branding, and underlying AI prompt system are the property of Fixelo and may not be reproduced or redistributed without permission.</p>

        <h2 className="text-xl font-semibold text-white">8. Modifications</h2>
        <p>Fixelo reserves the right to modify these Terms of Service at any time. Continued use of the platform after modifications constitutes acceptance of the updated terms.</p>
      </div>
    </div>
  )
}