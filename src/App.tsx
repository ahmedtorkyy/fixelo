import { BrowserRouter, Routes, Route } from "react-router"
import { Layout } from "@/components/layout/Layout"
import HomePage from "@/pages/Home"
import HistoryPage from "@/pages/History"
import TermsPage from "@/pages/Terms"
import PrivacyPage from "@/pages/Privacy"
import DisclaimerPage from "@/pages/Disclaimer"
import ToolsPage from "@/pages/Tools"
import DiagnosePage from "@/pages/Diagnose"
import AgentPage from "@/pages/Agent"
import CommunityPage from "@/pages/Community"
import CommunityFixPage from "@/pages/CommunityFixPage"
import GamingBoostPage from "@/pages/tools/GamingBoost"
import PrivacyProtectorPage from "@/pages/tools/PrivacyProtector"
import NewPCSetupPage from "@/pages/tools/NewPCSetup"
import StartupManagerPage from "@/pages/tools/StartupManager"
import NetworkOptimizerPage from "@/pages/tools/NetworkOptimizer"
import MonthlyMaintenancePage from "@/pages/tools/MonthlyMaintenance"
import WifiNetworkFixerPage from "@/pages/tools/WifiNetworkFixer"
import WindowsUpdateFixerPage from "@/pages/tools/WindowsUpdateFixer"
import SlowPCFixPage from "@/pages/tools/SlowPCFix"
import BlueScreenRecoveryPage from "@/pages/tools/BlueScreenRecovery"
import AudioFixPage from "@/pages/tools/AudioFix"
import DisplayResolutionFixPage from "@/pages/tools/DisplayResolutionFix"
import CorruptedFilesFixPage from "@/pages/tools/CorruptedFilesFix"
import DiskErrorFixPage from "@/pages/tools/DiskErrorFix"
import PrinterFixPage from "@/pages/tools/PrinterFix"
import USBDeviceFixPage from "@/pages/tools/USBDeviceFix"
import BatteryOptimizerPage from "@/pages/tools/BatteryOptimizer"
import SSDOptimizerPage from "@/pages/tools/SSDOptimizer"
import DarkModeSetupPage from "@/pages/tools/DarkModeSetup"
import TaskbarCustomizerPage from "@/pages/tools/TaskbarCustomizer"
import AutoShutdownPage from "@/pages/tools/AutoShutdown"
import AutoBackupPage from "@/pages/tools/AutoBackup"
import DriverManagerPage from "@/pages/tools/DriverManager"
import WingetInstallerPage from "@/pages/tools/WingetInstaller"
import DevEnvironmentPage from "@/pages/tools/DevEnvironment"
import ParentalControlsPage from "@/pages/tools/ParentalControls"
import VirusScannerPage from "@/pages/tools/VirusScanner"
import WindowsSearchFixPage from "@/pages/tools/WindowsSearchFix"
import BluetoothFixPage from "@/pages/tools/BluetoothFix"
import ExplorerFixPage from "@/pages/tools/ExplorerFix"
import ClockSyncPage from "@/pages/tools/ClockSync"
import TroubleshooterRunnerPage from "@/pages/tools/TroubleshooterRunner"
import StoreFixPage from "@/pages/tools/StoreFix"
import NetworkStackResetPage from "@/pages/tools/NetworkStackReset"
import ActivationFixPage from "@/pages/tools/ActivationFix"
import KeyboardMouseFixPage from "@/pages/tools/KeyboardMouseFix"
import CameraFixPage from "@/pages/tools/CameraFix"
import RuntimeInstallerPage from "@/pages/tools/RuntimeInstaller"
import FontCacheFixPage from "@/pages/tools/FontCacheFix"
import WindowsHelloFixPage from "@/pages/tools/WindowsHelloFix"
import DateTimeFormatFixPage from "@/pages/tools/DateTimeFormatFix"
import WindowsAppsRepairPage from "@/pages/tools/WindowsAppsRepair"
import FileAssociationGuardianPage from "@/pages/tools/FileAssociationGuardian"
import ContextMenuCleanerPage from "@/pages/tools/ContextMenuCleaner"
import SystemTweaksPage from "@/pages/tools/SystemTweaks"
import ErrorTranslatorPage from "@/pages/ErrorTranslator"
import ScriptScannerPage from "@/pages/ScriptScanner"
import NotFoundPage from "@/pages/NotFound"

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  )
}