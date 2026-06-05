import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router"
import { HelmetProvider } from "react-helmet-async"
import { Layout } from "@/components/layout/Layout"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"

const HomePage = lazy(() => import("@/pages/Home"))
const HistoryPage = lazy(() => import("@/pages/History"))
const TermsPage = lazy(() => import("@/pages/Terms"))
const PrivacyPage = lazy(() => import("@/pages/Privacy"))
const DisclaimerPage = lazy(() => import("@/pages/Disclaimer"))
const ToolsPage = lazy(() => import("@/pages/Tools"))
const DiagnosePage = lazy(() => import("@/pages/Diagnose"))
const AgentPage = lazy(() => import("@/pages/Agent"))
const CommunityPage = lazy(() => import("@/pages/Community"))
const CommunityFixPage = lazy(() => import("@/pages/CommunityFixPage"))
const GamingBoostPage = lazy(() => import("@/pages/tools/GamingBoost"))
const PrivacyProtectorPage = lazy(() => import("@/pages/tools/PrivacyProtector"))
const NewPCSetupPage = lazy(() => import("@/pages/tools/NewPCSetup"))
const StartupManagerPage = lazy(() => import("@/pages/tools/StartupManager"))
const NetworkOptimizerPage = lazy(() => import("@/pages/tools/NetworkOptimizer"))
const MonthlyMaintenancePage = lazy(() => import("@/pages/tools/MonthlyMaintenance"))
const WifiNetworkFixerPage = lazy(() => import("@/pages/tools/WifiNetworkFixer"))
const WindowsUpdateFixerPage = lazy(() => import("@/pages/tools/WindowsUpdateFixer"))
const SlowPCFixPage = lazy(() => import("@/pages/tools/SlowPCFix"))
const BlueScreenRecoveryPage = lazy(() => import("@/pages/tools/BlueScreenRecovery"))
const AudioFixPage = lazy(() => import("@/pages/tools/AudioFix"))
const DisplayResolutionFixPage = lazy(() => import("@/pages/tools/DisplayResolutionFix"))
const CorruptedFilesFixPage = lazy(() => import("@/pages/tools/CorruptedFilesFix"))
const DiskErrorFixPage = lazy(() => import("@/pages/tools/DiskErrorFix"))
const PrinterFixPage = lazy(() => import("@/pages/tools/PrinterFix"))
const USBDeviceFixPage = lazy(() => import("@/pages/tools/USBDeviceFix"))
const BatteryOptimizerPage = lazy(() => import("@/pages/tools/BatteryOptimizer"))
const SSDOptimizerPage = lazy(() => import("@/pages/tools/SSDOptimizer"))
const DarkModeSetupPage = lazy(() => import("@/pages/tools/DarkModeSetup"))
const TaskbarCustomizerPage = lazy(() => import("@/pages/tools/TaskbarCustomizer"))
const AutoShutdownPage = lazy(() => import("@/pages/tools/AutoShutdown"))
const AutoBackupPage = lazy(() => import("@/pages/tools/AutoBackup"))
const DriverManagerPage = lazy(() => import("@/pages/tools/DriverManager"))
const WingetInstallerPage = lazy(() => import("@/pages/tools/WingetInstaller"))
const DevEnvironmentPage = lazy(() => import("@/pages/tools/DevEnvironment"))
const ParentalControlsPage = lazy(() => import("@/pages/tools/ParentalControls"))
const VirusScannerPage = lazy(() => import("@/pages/tools/VirusScanner"))
const WindowsSearchFixPage = lazy(() => import("@/pages/tools/WindowsSearchFix"))
const BluetoothFixPage = lazy(() => import("@/pages/tools/BluetoothFix"))
const ExplorerFixPage = lazy(() => import("@/pages/tools/ExplorerFix"))
const ClockSyncPage = lazy(() => import("@/pages/tools/ClockSync"))
const TroubleshooterRunnerPage = lazy(() => import("@/pages/tools/TroubleshooterRunner"))
const StoreFixPage = lazy(() => import("@/pages/tools/StoreFix"))
const NetworkStackResetPage = lazy(() => import("@/pages/tools/NetworkStackReset"))
const ActivationFixPage = lazy(() => import("@/pages/tools/ActivationFix"))
const KeyboardMouseFixPage = lazy(() => import("@/pages/tools/KeyboardMouseFix"))
const CameraFixPage = lazy(() => import("@/pages/tools/CameraFix"))
const RuntimeInstallerPage = lazy(() => import("@/pages/tools/RuntimeInstaller"))
const FontCacheFixPage = lazy(() => import("@/pages/tools/FontCacheFix"))
const WindowsHelloFixPage = lazy(() => import("@/pages/tools/WindowsHelloFix"))
const DateTimeFormatFixPage = lazy(() => import("@/pages/tools/DateTimeFormatFix"))
const WindowsAppsRepairPage = lazy(() => import("@/pages/tools/WindowsAppsRepair"))
const FileAssociationGuardianPage = lazy(() => import("@/pages/tools/FileAssociationGuardian"))
const ContextMenuCleanerPage = lazy(() => import("@/pages/tools/ContextMenuCleaner"))
const SystemTweaksPage = lazy(() => import("@/pages/tools/SystemTweaks"))
const FreeUpSpacePage = lazy(() => import("@/pages/tools/FreeUpSpace"))
const RestorePointManagerPage = lazy(() => import("@/pages/tools/RestorePointManager"))
const MicrophoneFixPage = lazy(() => import("@/pages/tools/MicrophoneFix"))
const PowerSleepFixPage = lazy(() => import("@/pages/tools/PowerSleepFix"))
const OneDriveFixPage = lazy(() => import("@/pages/tools/OneDriveFix"))
const SoftwareInstallerPage = lazy(() => import("@/pages/tools/SoftwareInstaller"))
const DllRuntimeFixPage = lazy(() => import("@/pages/tools/DllRuntimeFix"))
const ErrorTranslatorPage = lazy(() => import("@/pages/ErrorTranslator"))
const ScriptScannerPage = lazy(() => import("@/pages/ScriptScanner"))
const NotFoundPage = lazy(() => import("@/pages/NotFound"))

export default function App() {
  return (
    <HelmetProvider>
    <BrowserRouter>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><LoadingSpinner message="Loading..." /></div>}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/gaming-boost" element={<GamingBoostPage />} />
          <Route path="/tools/privacy-protector" element={<PrivacyProtectorPage />} />
          <Route path="/tools/new-pc-setup" element={<NewPCSetupPage />} />
          <Route path="/tools/startup-manager" element={<StartupManagerPage />} />
          <Route path="/tools/network-optimizer" element={<NetworkOptimizerPage />} />
          <Route path="/tools/monthly-maintenance" element={<MonthlyMaintenancePage />} />
          <Route path="/tools/wifi-network-fixer" element={<WifiNetworkFixerPage />} />
          <Route path="/tools/windows-update-fixer" element={<WindowsUpdateFixerPage />} />
          <Route path="/tools/slow-pc-fix" element={<SlowPCFixPage />} />
          <Route path="/tools/blue-screen-recovery" element={<BlueScreenRecoveryPage />} />
          <Route path="/tools/audio-fix" element={<AudioFixPage />} />
          <Route path="/tools/display-resolution-fix" element={<DisplayResolutionFixPage />} />
          <Route path="/tools/corrupted-files-fix" element={<CorruptedFilesFixPage />} />
          <Route path="/tools/disk-error-fix" element={<DiskErrorFixPage />} />
          <Route path="/tools/printer-fix" element={<PrinterFixPage />} />
          <Route path="/tools/usb-device-fix" element={<USBDeviceFixPage />} />
          <Route path="/tools/battery-optimizer" element={<BatteryOptimizerPage />} />
          <Route path="/tools/ssd-optimizer" element={<SSDOptimizerPage />} />
          <Route path="/tools/dark-mode-setup" element={<DarkModeSetupPage />} />
          <Route path="/tools/taskbar-customizer" element={<TaskbarCustomizerPage />} />
          <Route path="/tools/auto-shutdown" element={<AutoShutdownPage />} />
          <Route path="/tools/auto-backup" element={<AutoBackupPage />} />
          <Route path="/tools/driver-manager" element={<DriverManagerPage />} />
          <Route path="/tools/winget-installer" element={<WingetInstallerPage />} />
          <Route path="/tools/dev-environment" element={<DevEnvironmentPage />} />
          <Route path="/tools/parental-controls" element={<ParentalControlsPage />} />
          <Route path="/tools/virus-scanner" element={<VirusScannerPage />} />
          <Route path="/tools/windows-search-fix" element={<WindowsSearchFixPage />} />
          <Route path="/tools/bluetooth-fix" element={<BluetoothFixPage />} />
          <Route path="/tools/explorer-fix" element={<ExplorerFixPage />} />
          <Route path="/tools/clock-sync" element={<ClockSyncPage />} />
          <Route path="/tools/troubleshooter-runner" element={<TroubleshooterRunnerPage />} />
          <Route path="/tools/store-fix" element={<StoreFixPage />} />
          <Route path="/tools/network-stack-reset" element={<NetworkStackResetPage />} />
          <Route path="/tools/activation-fix" element={<ActivationFixPage />} />
          <Route path="/tools/keyboard-mouse-fix" element={<KeyboardMouseFixPage />} />
          <Route path="/tools/camera-fix" element={<CameraFixPage />} />
          <Route path="/tools/runtime-installer" element={<RuntimeInstallerPage />} />
          <Route path="/tools/font-cache-fix" element={<FontCacheFixPage />} />
          <Route path="/tools/windows-hello-fix" element={<WindowsHelloFixPage />} />
          <Route path="/tools/date-time-format-fix" element={<DateTimeFormatFixPage />} />
          <Route path="/tools/windows-apps-repair" element={<WindowsAppsRepairPage />} />
          <Route path="/tools/file-association-guardian" element={<FileAssociationGuardianPage />} />
          <Route path="/tools/context-menu-cleaner" element={<ContextMenuCleanerPage />} />
          <Route path="/tools/system-tweaks" element={<SystemTweaksPage />} />
          <Route path="/tools/free-up-space" element={<FreeUpSpacePage />} />
          <Route path="/tools/restore-point-manager" element={<RestorePointManagerPage />} />
          <Route path="/tools/microphone-fix" element={<MicrophoneFixPage />} />
          <Route path="/tools/power-sleep-fix" element={<PowerSleepFixPage />} />
          <Route path="/tools/onedrive-fix" element={<OneDriveFixPage />} />
          <Route path="/tools/software-installer" element={<SoftwareInstallerPage />} />
          <Route path="/tools/dll-runtime-fix" element={<DllRuntimeFixPage />} />
          <Route path="/diagnose" element={<DiagnosePage />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/community/:slug" element={<CommunityFixPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/error-translator" element={<ErrorTranslatorPage />} />
          <Route path="/script-scanner" element={<ScriptScannerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
    </HelmetProvider>
  )
}