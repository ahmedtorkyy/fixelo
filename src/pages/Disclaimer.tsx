export default function DisclaimerPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-bold text-white mb-8">Disclaimer</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-surface-300 leading-relaxed">

        <div className="bg-amber-950/30 border border-amber-800/40 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-amber-300 mb-2">Important Notice</h2>
          <p className="text-amber-200/80">Please read this disclaimer carefully before using any script from Fixelo.</p>
        </div>

        <h2 className="text-xl font-semibold text-white">Not Affiliated with Microsoft</h2>
        <p>Fixelo is an independent platform and is not affiliated with, endorsed by, or sponsored by Microsoft Corporation. Windows, PowerShell, and Winget are trademarks of Microsoft Corporation. All scripts provided by Fixelo use publicly documented Windows features and APIs.</p>

        <h2 className="text-xl font-semibold text-white">Use at Your Own Risk</h2>
        <p>All scripts are provided as-is without warranty of any kind. Users run scripts entirely at their own risk. Fixelo is not responsible for any damage to your computer, loss of data, or any other issues that may result from running these scripts.</p>

        <h2 className="text-xl font-semibold text-white">System Restore Point</h2>
        <p>Users are strongly advised to create a system restore point before running any script. While Fixelo provides undo scripts for every fix, complete reversal cannot be guaranteed in all Windows configurations.</p>

        <p className="text-white font-medium">By downloading and running any script from Fixelo, the user accepts full responsibility for any changes made to their system.</p>

        <h2 className="text-xl font-semibold text-white">Advertising</h2>
        <p>Fixelo is monetized through Google AdSense advertising and user subscriptions in full compliance with Google AdSense program policies. All ad placements comply with Google's publisher policies regarding content and user experience.</p>
      </div>
    </div>
  )
}