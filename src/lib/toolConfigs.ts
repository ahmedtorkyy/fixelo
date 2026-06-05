import type { LucideIcon } from "lucide-react"
import { Gamepad2, Shield, ShieldCheck, Monitor, Rocket, Wifi, CalendarCheck, WifiOff, RefreshCw, Gauge, AlertTriangle, Volume2, MonitorSmartphone, FileWarning, HardDrive, Printer, Usb, Battery, Zap, Moon, LayoutDashboard, Timer, FolderSync, Cpu, Package, Code, Lock, Search, Bluetooth, FolderSearch, Clock, Wrench, Store, Keyboard, Camera, List, Router, KeyRound, Binary, Type, Fingerprint, CalendarDays, AppWindow, FileType, SlidersHorizontal, History, Mic, Power, Cloud } from "lucide-react"

export interface ToolOption {
  id: string
  label: string
  description: string
  defaultValue?: boolean
  type?: "checkbox" | "text" | "time"
  placeholder?: string
  inputDefaultValue?: string
}

export interface ToolConfig {
  slug: string
  title: string
  icon: LucideIcon
  description: string
  longDescription: string
  category: string
  options: ToolOption[]
}

export const TOOLS: Record<string, ToolConfig> = {
  "gaming-boost": {
    slug: "gaming-boost",
    title: "Gaming Boost Pack",
    icon: Gamepad2,
    description: "Optimize your PC for gaming with a single click.",
    longDescription:
      "Enable Game Mode, set GPU to max performance, optimize network for low latency, and disable unnecessary background processes. Select the optimizations you want and download your custom gaming boost script.",
    category: "Performance",
    options: [
      { id: "game-mode", label: "Enable Game Mode", description: "Turns on Windows Game Mode to prioritize gaming resources", defaultValue: true },
      { id: "gpu-max", label: "Set GPU to Max Performance", description: "Sets your GPU power plan to maximum performance for best frame rates", defaultValue: true },
      { id: "network-low-latency", label: "Optimize Network for Low Latency", description: "Disables Nagle's algorithm and optimizes TCP for gaming", defaultValue: true },
      { id: "disable-game-bar", label: "Disable Xbox Game Bar", description: "Removes the Game Bar overlay which can cause FPS drops", defaultValue: false },
      { id: "disable-bg-apps", label: "Disable Background Apps", description: "Prevents unnecessary apps from running in the background while gaming", defaultValue: true },
      { id: "high-perf-power", label: "Set Power Plan to High Performance", description: "Switches Windows power plan to maximum performance mode", defaultValue: true },
    ],
  },
  "privacy-protector": {
    slug: "privacy-protector",
    title: "Privacy Protector",
    icon: Shield,
    description: "Disable Windows telemetry, tracking, and data collection.",
    longDescription:
      "Windows collects a significant amount of your data by default. This tool disables telemetry services, blocks Microsoft tracking domains, turns off the advertising ID, and more. Select what you want to protect and download your script.",
    category: "Privacy & Security",
    options: [
      { id: "disable-telemetry", label: "Disable Telemetry Services", description: "Turns off Windows telemetry and data collection services", defaultValue: true },
      { id: "block-tracking", label: "Block Microsoft Tracking in Hosts File", description: "Adds known Microsoft tracking domains to the hosts file", defaultValue: true },
      { id: "disable-ads-id", label: "Disable Advertising ID", description: "Turns off the Windows advertising ID that tracks you across apps", defaultValue: true },
      { id: "disable-cortana", label: "Disable Cortana", description: "Completely disables Cortana and its web search integration", defaultValue: false },
      { id: "disable-location", label: "Disable Location Tracking", description: "Turns off location services for all apps", defaultValue: true },
      { id: "disable-clipboard-cloud", label: "Disable Clipboard Cloud Sync", description: "Stops Windows from syncing your clipboard to the cloud", defaultValue: true },
    ],
  },
  "new-pc-setup": {
    slug: "new-pc-setup",
    title: "New PC Setup Wizard",
    icon: Monitor,
    description: "Remove bloatware, install software, and optimize your new PC.",
    longDescription:
      "Just got a new PC? This wizard removes manufacturer bloatware, installs your choice of essential software via Winget, applies privacy and performance settings, and sets up Dark Mode. Pick what you want and download a single setup script.",
    category: "Setup & Installation",
    options: [
      { id: "remove-bloatware", label: "Remove Bloatware", description: "Unlocks and removes common manufacturer bloatware and pre-installed junk apps", defaultValue: true },
      { id: "install-software", label: "Install Essential Software via Winget", description: "Installs browsers, media players, utilities, and productivity apps", defaultValue: true },
      { id: "privacy-settings", label: "Apply Privacy Settings", description: "Disables telemetry, advertising ID, and tracking (same as Privacy Protector)", defaultValue: true },
      { id: "performance-settings", label: "Apply Performance Settings", description: "Disables unnecessary visual effects, background apps, and scheduled tasks", defaultValue: true },
      { id: "dark-mode", label: "Enable Dark Mode", description: "Sets system-wide dark mode for all Windows elements and apps", defaultValue: true },
      { id: "disable-onedrive", label: "Disable OneDrive at Startup", description: "Prevents OneDrive from launching at startup if you don't use it", defaultValue: false },
    ],
  },
  "startup-manager": {
    slug: "startup-manager",
    title: "Startup Manager",
    icon: Rocket,
    description: "Scan and disable unnecessary startup programs for faster boot.",
    longDescription:
      "Programs that launch at startup slow down your boot time and waste resources. This tool scans common startup locations and presents them with plain English descriptions. Select which ones to disable and download your script.",
    category: "Performance",
    options: [
      { id: "disable-onedrive", label: "Disable OneDrive at Startup", description: "Prevents OneDrive from auto-launching (only if you don't use it)", defaultValue: true },
      { id: "disable-teams", label: "Disable Microsoft Teams at Startup", description: "Stops Teams from launching at boot — you can still open it manually", defaultValue: true },
      { id: "disable-skype", label: "Disable Skype at Startup", description: "Prevents Skype from auto-starting with Windows", defaultValue: true },
      { id: "disable-discord", label: "Disable Discord at Startup", description: "Stops Discord from launching at boot", defaultValue: true },
      { id: "disable-spotify", label: "Disable Spotify at Startup", description: "Prevents Spotify from launching at boot", defaultValue: false },
      { id: "disable-steam", label: "Disable Steam at Startup", description: "Stops Steam from auto-launching with Windows", defaultValue: false },
      { id: "disable-edge", label: "Disable Edge Background Processes", description: "Prevents Microsoft Edge from running in the background", defaultValue: true },
    ],
  },
  "network-optimizer": {
    slug: "network-optimizer",
    title: "Network Speed Optimizer",
    icon: Wifi,
    description: "Switch DNS, optimize TCP, and remove bandwidth throttling.",
    longDescription:
      "Windows limits your network speed by default. This tool switches your DNS to the fastest servers, optimizes TCP settings for throughput, removes Windows bandwidth throttling, and resets your network stack. Select the optimizations you want.",
    category: "Performance",
    options: [
      { id: "fast-dns", label: "Switch to Fastest DNS Servers", description: "Sets DNS to Cloudflare (1.1.1.1) and Google (8.8.8.8) for faster browsing", defaultValue: true },
      { id: "optimize-tcp", label: "Optimize TCP Settings", description: "Tunes TCP window size, enable auto-tuning, and disable congestion limits", defaultValue: true },
      { id: "remove-throttle", label: "Remove Windows Bandwidth Throttle", description: "Disables the Windows reserved bandwidth limit (20% by default)", defaultValue: true },
      { id: "reset-network", label: "Reset Network Stack", description: "Flushes DNS, resets TCP/IP stack, and clears ARP cache", defaultValue: false },
      { id: "disable-nagle", label: "Disable Nagle's Algorithm", description: "Reduces network latency for real-time applications and gaming", defaultValue: true },
      { id: "disable-power-throttle", label: "Disable Network Power Throttling", description: "Prevents Windows from limiting network adapter speed to save power", defaultValue: true },
    ],
  },
  "monthly-maintenance": {
    slug: "monthly-maintenance",
    title: "Monthly Maintenance Pack",
    icon: CalendarCheck,
    description: "Run all safe maintenance tasks to keep your PC healthy.",
    longDescription:
      "Run this pack once a month to keep your PC running smoothly. It cleans temporary files, clears all caches, verifies startup items, checks disk health, and runs system file verification. Select which tasks to include and download your maintenance script.",
    category: "Performance",
    options: [
      { id: "clean-temp", label: "Clean Temporary Files", description: "Deletes all temp files from Windows temp folders and user temp folders", defaultValue: true },
      { id: "clear-caches", label: "Clear All Caches", description: "Clears DNS cache, icon cache, thumbnail cache, and font cache", defaultValue: true },
      { id: "disk-health", label: "Check Disk Health", description: "Runs SMART diagnostics and checks disk for errors", defaultValue: true },
      { id: "verify-startup", label: "Verify Startup Items", description: "Lists current startup items and flags suspicious or unnecessary ones", defaultValue: false },
      { id: "empty-recycle", label: "Empty Recycle Bin", description: "Permanently deletes all files in the Recycle Bin", defaultValue: true },
      { id: "sfc-scan", label: "Run System File Checker", description: "Scans Windows system files and repairs any corrupted ones", defaultValue: true },
    ],
  },
  "wifi-network-fixer": {
    slug: "wifi-network-fixer",
    title: "WiFi and Network Fixer",
    icon: WifiOff,
    description: "Resets network adapter, DNS, TCP stack. Fixes disconnections and slow internet.",
    longDescription:
      "If your WiFi keeps disconnecting, your internet is slow, or websites won't load, this tool resets your network adapter, flushes DNS, resets the TCP/IP stack, clears the ARP cache, and re-enables the WiFi adapter. It systematically fixes the most common causes of network problems.",
    category: "Fix Tools",
    options: [
      { id: "reset-adapter", label: "Reset WiFi Adapter", description: "Disables and re-enables the WiFi adapter to fix connection issues", defaultValue: true },
      { id: "flush-dns", label: "Flush DNS Cache", description: "Clears the DNS resolver cache to fix website loading problems", defaultValue: true },
      { id: "reset-tcp", label: "Reset TCP/IP Stack", description: "Resets the TCP/IP protocol stack to fix network communication errors", defaultValue: true },
      { id: "release-renew", label: "Release and Renew IP", description: "Releases the current IP address and gets a new one from the router", defaultValue: true },
      { id: "reset-winsock", label: "Reset Winsock Catalog", description: "Resets the Winsock catalog to fix socket errors and connection failures", defaultValue: true },
      { id: "clear-arp", label: "Clear ARP Cache", description: "Clears the Address Resolution Protocol cache to fix device discovery issues", defaultValue: false },
    ],
  },
  "windows-update-fixer": {
    slug: "windows-update-fixer",
    title: "Windows Update Fixer",
    icon: RefreshCw,
    description: "Repairs broken Windows Update service, clears cache, re-registers components.",
    longDescription:
      "When Windows Update gets stuck downloading, fails to install, or shows error codes like 0x800f081f, this tool stops the update services, clears the SoftwareDistribution and catroot2 cache folders, re-registers the update DLLs, and restarts the services fresh.",
    category: "Fix Tools",
    options: [
      { id: "stop-services", label: "Stop Update Services", description: "Stops Windows Update and BITS services for a clean restart", defaultValue: true },
      { id: "clear-cache", label: "Clear Update Cache", description: "Deletes the SoftwareDistribution download folder to remove corrupted updates", defaultValue: true },
      { id: "clear-catroot", label: "Clear Catroot2 Folder", description: "Clears the catroot2 folder which can cause update installation failures", defaultValue: true },
      { id: "reregister-dlls", label: "Re-register Update DLLs", description: "Re-registers all core Windows Update DLL files to fix component errors", defaultValue: true },
      { id: "reset-store", label: "Reset Windows Store", description: "Resets the Microsoft Store cache which can block updates", defaultValue: false },
      { id: "restart-services", label: "Restart Update Services", description: "Starts the update services back up after cleaning", defaultValue: true },
    ],
  },
  "slow-pc-fix": {
    slug: "slow-pc-fix",
    title: "Slow PC Fix",
    icon: Gauge,
    description: "Cleans startup programs, clears all cache types, optimizes memory and power plan.",
    longDescription:
      "If your PC feels slow and sluggish, this fix disables unnecessary startup programs, clears temp files and system caches, optimizes the power plan for performance, disables visual effects, and cleans up the Recycle Bin. It targets the most common causes of slow Windows performance.",
    category: "Fix Tools",
    options: [
      { id: "clean-startup", label: "Clean Startup Programs", description: "Disables common unnecessary startup programs to speed up boot time", defaultValue: true },
      { id: "clear-temp", label: "Clear Temporary Files", description: "Deletes all temporary files from Windows and user temp folders", defaultValue: true },
      { id: "clear-caches", label: "Clear System Caches", description: "Clears DNS, icon, thumbnail, and font caches", defaultValue: true },
      { id: "perf-power", label: "Set High Performance Power Plan", description: "Switches power plan to High Performance for maximum speed", defaultValue: true },
      { id: "disable-effects", label: "Disable Visual Effects", description: "Turns off unnecessary animations and visual effects for faster response", defaultValue: true },
      { id: "empty-recycle", label: "Empty Recycle Bin", description: "Permanently deletes all files in the Recycle Bin to free disk space", defaultValue: true },
    ],
  },
  "blue-screen-recovery": {
    slug: "blue-screen-recovery",
    title: "Blue Screen Recovery",
    icon: AlertTriangle,
    description: "Reads Windows error logs, identifies BSOD cause, applies targeted fix.",
    longDescription:
      "Blue screen errors (BSOD) can be caused by driver issues, memory problems, or disk errors. This tool reads your Windows error event logs to identify the specific cause, then applies a targeted fix. It also runs System File Checker and verifies driver health.",
    category: "Fix Tools",
    options: [
      { id: "scan-errors", label: "Scan Error Logs", description: "Reads Windows event logs to identify the specific blue screen error cause", defaultValue: true },
      { id: "sfc-repair", label: "Run System File Checker", description: "Scans and repairs corrupted system files that can cause blue screens", defaultValue: true },
      { id: "check-drivers", label: "Verify Driver Health", description: "Lists recently updated or problematic drivers that may be causing crashes", defaultValue: true },
      { id: "memory-check", label: "Schedule Memory Check", description: "Schedules Windows Memory Diagnostic to run on next boot", defaultValue: false },
      { id: "disk-check", label: "Schedule Disk Check", description: "Schedules CHKDSK to verify disk integrity on next boot", defaultValue: false },
      { id: "system-restore", label: "Create Restore Point", description: "Creates a system restore point before making any changes", defaultValue: true },
    ],
  },
  "audio-fix": {
    slug: "audio-fix",
    title: "Audio Fix",
    icon: Volume2,
    description: "Resets audio services, reinstalls audio drivers, fixes common sound issues.",
    longDescription:
      "When your speakers or headphones stop producing sound, this fix restarts the Windows Audio service, re-registers the audio DLL, reinstalls the default audio driver, and resets audio enhancements. It resolves the most common audio problems including no sound, crackling, and missing playback devices.",
    category: "Fix Tools",
    options: [
      { id: "restart-audio", label: "Restart Audio Service", description: "Stops and restarts the Windows Audio service to fix sound issues", defaultValue: true },
      { id: "reregister-dll", label: "Re-register Audio DLLs", description: "Re-registers core audio DLL files to fix component errors", defaultValue: true },
      { id: "reinstall-driver", label: "Reinstall Audio Driver", description: "Removes and reinstalls the default audio driver", defaultValue: true },
      { id: "disable-enhancements", label: "Disable Audio Enhancements", description: "Turns off audio enhancements that can cause crackling or no sound", defaultValue: true },
      { id: "set-default", label: "Set Default Playback Device", description: "Sets the correct device as the default playback device", defaultValue: true },
      { id: "reset-volume", label: "Reset Volume Levels", description: "Resets all volume levels and unmutes audio output", defaultValue: true },
    ],
  },
  "display-resolution-fix": {
    slug: "display-resolution-fix",
    title: "Display and Resolution Fix",
    icon: MonitorSmartphone,
    description: "Resets display settings, fixes resolution problems, restores default GPU output.",
    longDescription:
      "When your display is stuck at the wrong resolution, everything looks blurry, or you can't find the right resolution in settings, this fix reinstalls your display adapter driver, resets the display configuration, and restores the recommended resolution for your monitor.",
    category: "Fix Tools",
    options: [
      { id: "reinstall-gpu", label: "Reinstall Display Driver", description: "Removes and reinstalls the display adapter driver", defaultValue: true },
      { id: "reset-resolution", label: "Reset to Native Resolution", description: "Sets the display to its native recommended resolution", defaultValue: true },
      { id: "clear-cache", label: "Clear Display Cache", description: "Clears the display settings cache that can cause resolution problems", defaultValue: true },
      { id: "reset-color", label: "Reset Color Calibration", description: "Resets color profile to default Windows settings", defaultValue: false },
      { id: "disable-hdr", label: "Disable HDR (if causing issues)", description: "Turns off HDR which can cause black screens on some monitors", defaultValue: false },
      { id: "detect-monitors", label: "Redetect All Monitors", description: "Forces Windows to redetect connected monitors", defaultValue: true },
    ],
  },
  "corrupted-files-fix": {
    slug: "corrupted-files-fix",
    title: "Corrupted Files Fix",
    icon: FileWarning,
    description: "Runs Windows System File Checker and DISM repair tools silently.",
    longDescription:
      "When Windows system files are corrupted, you might see random errors, crashes, or missing features. This fix runs SFC (System File Checker) and DISM to scan and repair all corrupted system files. It also creates a restore point before starting.",
    category: "Fix Tools",
    options: [
      { id: "restore-point", label: "Create Restore Point", description: "Creates a system restore point before making any changes", defaultValue: true },
      { id: "sfc-scan", label: "Run System File Checker (SFC)", description: "Scans all protected system files and replaces corrupted ones", defaultValue: true },
      { id: "dism-health", label: "Run DISM Health Check", description: "Checks the component store for corruption", defaultValue: true },
      { id: "dism-restore", label: "Run DISM Restore Health", description: "Repairs the Windows image using Windows Update as the source", defaultValue: true },
      { id: "clear-cbs", label: "Clear CBS Logs", description: "Clears the Component-Based Servicing logs that can block repairs", defaultValue: false },
    ],
  },
  "disk-error-fix": {
    slug: "disk-error-fix",
    title: "Disk Error Fix",
    icon: HardDrive,
    description: "Runs CHKDSK on selected drive, repairs file system errors, reports findings.",
    longDescription:
      "Disk errors can cause blue screens, slow performance, and data loss. This fix runs CHKDSK on your drive to scan for and repair file system errors, bad sectors, and cross-linked files. It schedules the scan for the next reboot since the drive is in use.",
    category: "Fix Tools",
    options: [
      { id: "chkdsk-scan", label: "Run CHKDSK on System Drive", description: "Scans the C: drive for file system errors and repairs them", defaultValue: true },
      { id: "bad-sectors", label: "Check for Bad Sectors", description: "Includes a full surface scan to find and mark bad sectors", defaultValue: true },
      { id: "smart-check", label: "Read SMART Data", description: "Reads the drive's self-monitoring data to check overall health", defaultValue: true },
      { id: "report-findings", label: "Report Findings", description: "Shows a detailed report of what was found and repaired", defaultValue: true },
    ],
  },
  "printer-fix": {
    slug: "printer-fix",
    title: "Printer Fix",
    icon: Printer,
    description: "Resets print spooler, clears print queue, reinstalls printer drivers.",
    longDescription:
      "When your printer won't print, shows offline, or has stuck jobs in the queue, this fix stops the print spooler, clears the print queue, re-registers printer DLLs, and restarts the spooler service. It also removes and reinstalls the default printer driver.",
    category: "Fix Tools",
    options: [
      { id: "restart-spooler", label: "Restart Print Spooler", description: "Stops and restarts the print spooler service", defaultValue: true },
      { id: "clear-queue", label: "Clear Print Queue", description: "Deletes all stuck print jobs from the queue", defaultValue: true },
      { id: "reregister-dlls", label: "Re-register Printer DLLs", description: "Re-registers core printing DLL files", defaultValue: true },
      { id: "reinstall-driver", label: "Reinstall Printer Driver", description: "Removes and reinstalls the default printer driver", defaultValue: true },
      { id: "restart-service", label: "Restart Print Service", description: "Stops and starts all print-related services", defaultValue: true },
    ],
  },
  "usb-device-fix": {
    slug: "usb-device-fix",
    title: "USB Device Fix",
    icon: Usb,
    description: "Resets USB controllers, clears device cache, fixes unrecognized USB devices.",
    longDescription:
      "When Windows shows 'USB device not recognized' or a USB device stops working, this fix resets all USB controllers, clears the USB device cache, and reinstalls USB drivers. It resolves the most common USB problems without affecting your files or settings.",
    category: "Fix Tools",
    options: [
      { id: "reset-controllers", label: "Reset USB Controllers", description: "Disables and re-enables all USB controllers in Device Manager", defaultValue: true },
      { id: "clear-cache", label: "Clear USB Device Cache", description: "Removes cached USB device information that can cause conflicts", defaultValue: true },
      { id: "reinstall-drivers", label: "Reinstall USB Drivers", description: "Removes and reinstalls USB controller drivers", defaultValue: true },
      { id: "power-management", label: "Disable USB Power Management", description: "Stops Windows from turning off USB ports to save power", defaultValue: true },
      { id: "reinstall-hubs", label: "Reinstall USB Root Hubs", description: "Reinstalls all USB root hub devices", defaultValue: false },
    ],
  },
  "battery-optimizer": {
    slug: "battery-optimizer",
    title: "Battery Life Optimizer",
    icon: Battery,
    description: "Applies laptop-specific power settings and disables battery-draining services.",
    longDescription:
      "If your laptop battery dies too quickly, this tool applies power-saving settings that actually make a difference. It switches to a balanced power plan, disables battery-draining background services, reduces screen timeout, and stops unnecessary background activity.",
    category: "Performance",
    options: [
      { id: "balanced-power", label: "Switch to Balanced Power Plan", description: "Changes power plan from High Performance to Balanced for better battery life", defaultValue: true },
      { id: "screen-timeout", label: "Reduce Screen Timeout", description: "Sets screen to turn off after 3 minutes on battery", defaultValue: true },
      { id: "disable-bg-apps", label: "Disable Background Apps on Battery", description: "Prevents apps from running in the background when on battery power", defaultValue: true },
      { id: "disable-bluetooth", label: "Disable Bluetooth (when not needed)", description: "Turns off Bluetooth to save battery when not connected to devices", defaultValue: false },
      { id: "disable-indexing", label: "Pause Search Indexing on Battery", description: "Stops Windows Search indexing from running on battery power", defaultValue: true },
      { id: "dim-screen", label: "Lower Screen Brightness", description: "Sets screen brightness to 50% when on battery", defaultValue: true },
    ],
  },
  "ssd-optimizer": {
    slug: "ssd-optimizer",
    title: "SSD Optimizer",
    icon: Zap,
    description: "Enables TRIM, disables disk defragmentation on SSD, optimizes write caching.",
    longDescription:
      "This fix enables TRIM for all SSD drives, disables scheduled defragmentation on SSDs, optimizes write caching, and disables SSD-unfriendly services. It ensures your SSD runs at maximum speed and lasts longer.",
    category: "Performance",
    options: [
      { id: "enable-trim", label: "Enable TRIM", description: "Ensures TRIM is enabled on all SSDs for optimal performance and longevity", defaultValue: true },
      { id: "disable-defrag", label: "Disable Defragmentation on SSDs", description: "Stops Windows from scheduling defragmentation on SSD drives (which is harmful)", defaultValue: true },
      { id: "write-caching", label: "Optimize Write Caching", description: "Enables write caching on the SSD for faster write performance", defaultValue: true },
      { id: "disable-superfetch", label: "Disable Superfetch/Prefetch on SSD", description: "Stops Superfetch from wearing out SSDs with unnecessary reads", defaultValue: true },
      { id: "disable-indexing", label: "Disable Search Indexing on SSD", description: "Stops Windows Search from constantly indexing the SSD", defaultValue: false },
    ],
  },
  "dark-mode-setup": {
    slug: "dark-mode-setup",
    title: "Dark Mode Setup",
    icon: Moon,
    description: "Enables system-wide dark mode for all Windows elements and apps.",
    longDescription:
      "This tool enables dark mode for the taskbar, Start Menu, Settings, File Explorer, and all supported apps. It also sets the default app mode to dark and disables the light theme for a consistent dark experience across your entire system.",
    category: "Customization",
    options: [
      { id: "system-dark", label: "Enable System Dark Mode", description: "Sets Windows to dark mode for taskbar, Start Menu, and Settings", defaultValue: true },
      { id: "app-dark", label: "Set Default App Mode to Dark", description: "Makes all supported apps use dark theme", defaultValue: true },
      { id: "file-explorer", label: "Dark Mode for File Explorer", description: "Applies dark theme to File Explorer windows", defaultValue: true },
      { id: "disable-light", label: "Disable Light Theme Entirely", description: "Removes the light theme option so no apps can accidentally switch to light mode", defaultValue: false },
      { id: "wallpaper", label: "Set Dark Wallpaper", description: "Sets a dark wallpaper that matches the dark theme", defaultValue: true },
    ],
  },
  "taskbar-customizer": {
    slug: "taskbar-customizer",
    title: "Taskbar Customizer",
    icon: LayoutDashboard,
    description: "Moves taskbar, removes search bar, adds custom shortcuts, pins or unpins apps.",
    longDescription:
      "Customize your Windows taskbar exactly how you want it. Move the taskbar, remove the search bar and Cortana button, hide the Task View button, pin or unpin default apps, and configure system tray icons. Select your preferences and download the script.",
    category: "Customization",
    options: [
      { id: "hide-search", label: "Hide Search Bar", description: "Removes the search bar from the taskbar to save space", defaultValue: true },
      { id: "hide-task-view", label: "Hide Task View Button", description: "Removes the Task View button from the taskbar", defaultValue: true },
      { id: "hide-cortana", label: "Hide Cortana Button", description: "Removes the Cortana button from the taskbar", defaultValue: true },
      { id: "hide-widgets", label: "Hide Widgets Button", description: "Removes the Widgets button (Windows 11)", defaultValue: true },
      { id: "hide-chat", label: "Hide Chat Icon", description: "Removes the Teams Chat icon from the taskbar (Windows 11)", defaultValue: true },
      { id: "small-icons", label: "Use Small Taskbar Icons", description: "Makes taskbar icons smaller to save vertical space", defaultValue: false },
    ],
  },
  "auto-shutdown": {
    slug: "auto-shutdown",
    title: "Auto Shutdown Scheduler",
    icon: Timer,
    description: "Sets PC to shut down automatically at a specified time on selected days.",
    longDescription:
      "Configure your PC to shut down, restart, or hibernate at a specific time. This tool creates a Windows scheduled task that runs automatically on the days you choose. Select the action, time, and days, then download the script.",
    category: "Automation",
    options: [
      { id: "action", label: "Action: Shut Down", description: "Choose shutdown, restart, or hibernate (default: shutdown)", defaultValue: true },
      { id: "shutdown-time", label: "Shutdown Time", description: "The time to automatically shut down (24-hour format, e.g. 23:00)", type: "time", placeholder: "23:00", inputDefaultValue: "23:00" },
      { id: "daily", label: "Run Every Day", description: "Schedules the task to run every day at the specified time", defaultValue: true },
      { id: "weekdays", label: "Run on Weekdays Only", description: "Schedules the task to run Monday through Friday only", defaultValue: false },
      { id: "force-close", label: "Force Close Applications", description: "Forces running applications to close before shutdown (no waiting)", defaultValue: true },
      { id: "warning", label: "Show 5-Minute Warning", description: "Displays a warning message 5 minutes before shutdown", defaultValue: true },
    ],
  },
  "auto-backup": {
    slug: "auto-backup",
    title: "Auto Backup Setup",
    icon: FolderSync,
    description: "Monitors a selected folder and backs it up to a target drive on a schedule.",
    longDescription:
      "Set up automatic file backups to keep your important data safe. This tool creates a scheduled task that copies files from your chosen source folder to a backup destination on a regular schedule. It uses robocopy for fast, reliable incremental backups.",
    category: "Automation",
    options: [
      { id: "source-folder", label: "Source Folder", description: "The folder to back up (e.g. C:\\Users\\YourName\\Documents)", type: "text", placeholder: "C:\\Users\\YourName\\Documents", inputDefaultValue: "Documents" },
      { id: "backup-destination", label: "Backup Destination", description: "Where to store the backup (e.g. D:\\Backup)", type: "text", placeholder: "D:\\Backup", inputDefaultValue: "D:\\Backup" },
      { id: "daily-backup", label: "Daily Backup", description: "Runs the backup task every day at the specified time", defaultValue: true },
      { id: "incremental", label: "Incremental Backups Only", description: "Only copies files that have changed since the last backup (faster)", defaultValue: true },
      { id: "mirror", label: "Mirror Mode", description: "Keeps the backup folder as an exact mirror of the source (deletes removed files)", defaultValue: false },
      { id: "retain-deleted", label: "Keep Deleted Files for 30 Days", description: "Moves deleted files to a separate folder instead of permanently deleting them", defaultValue: true },
      { id: "create-log", label: "Create Backup Log", description: "Saves a detailed log of what was backed up each time", defaultValue: true },
    ],
  },
  "driver-manager": {
    slug: "driver-manager",
    title: "Driver Manager",
    icon: Cpu,
    description: "Scans for outdated drivers, shows device names, generates update scripts.",
    longDescription:
      "Outdated drivers can cause crashes, blue screens, and hardware problems. This tool scans your system for all installed drivers, identifies which ones are outdated, and updates them via Windows Update's built-in driver delivery — no third-party tools needed.",
    category: "Setup & Installation",
    options: [
      { id: "scan-all", label: "Scan All Drivers", description: "Lists all installed drivers with their versions and dates", defaultValue: true },
      { id: "identify-outdated", label: "Identify Outdated Drivers", description: "Flags drivers that are significantly outdated", defaultValue: false },
      { id: "update-gpu", label: "Update GPU Driver", description: "Downloads and installs the latest GPU driver from Windows Update", defaultValue: true },
      { id: "update-network", label: "Update Network Driver", description: "Downloads and installs the latest network driver from Windows Update", defaultValue: true },
      { id: "update-audio", label: "Update Audio Driver", description: "Downloads and installs the latest audio driver from Windows Update", defaultValue: false },
    ],
  },
  "winget-installer": {
    slug: "winget-installer",
    title: "Winget Software Installer",
    icon: Package,
    description: "User selects apps from a list. One BAT file installs all via Winget.",
    longDescription:
      "Select the apps you want and download a single script that installs all of them silently using Windows Package Manager (Winget). Winget is built into Windows 10 and 11, so no additional software is needed. Select your preferred apps and click Generate.",
    category: "Setup & Installation",
    options: [
      { id: "browsers", label: "Browsers (Firefox, Chrome, Brave)", description: "Installs popular web browsers", defaultValue: true },
      { id: "media", label: "Media (VLC, Spotify, iTunes)", description: "Installs media players and streaming apps", defaultValue: true },
      { id: "utils", label: "Utilities (7-Zip, Everything, PowerToys)", description: "Installs essential utility tools", defaultValue: true },
      { id: "communication", label: "Communication (Discord, Zoom, Telegram)", description: "Installs messaging and video call apps", defaultValue: false },
      { id: "productivity", label: "Productivity (Notion, Obsidian, LibreOffice)", description: "Installs productivity and office tools", defaultValue: false },
      { id: "dev-tools", label: "Dev Tools (Git, VS Code, Python, Node.js)", description: "Installs development tools and languages", defaultValue: false },
    ],
  },
  "dev-environment": {
    slug: "dev-environment",
    title: "Developer Environment Setup",
    icon: Code,
    description: "Installs Git, Node.js, Python, VS Code, and configures WSL via Winget.",
    longDescription:
      "Set up a complete development environment in one script. This tool installs Git, Node.js, Python, VS Code, Windows Terminal, and optionally configures WSL (Windows Subsystem for Linux). Everything is installed via Winget for a clean, automated setup.",
    category: "Setup & Installation",
    options: [
      { id: "git", label: "Install Git", description: "Installs Git for version control", defaultValue: true },
      { id: "nodejs", label: "Install Node.js (LTS)", description: "Installs Node.js LTS for JavaScript development", defaultValue: true },
      { id: "python", label: "Install Python", description: "Installs Python 3 for scripting and development", defaultValue: true },
      { id: "vscode", label: "Install VS Code", description: "Installs Visual Studio Code with recommended extensions", defaultValue: true },
      { id: "terminal", label: "Install Windows Terminal", description: "Installs the modern Windows Terminal", defaultValue: true },
      { id: "wsl", label: "Install WSL with Ubuntu", description: "Sets up Windows Subsystem for Linux with Ubuntu distribution", defaultValue: false },
    ],
  },
  "parental-controls": {
    slug: "parental-controls",
    title: "Parental Controls Setup",
    icon: Lock,
    description: "Sets up time limits, app restrictions, and website blocking for a child account.",
    longDescription:
      "Set up parental controls on Windows to manage screen time, restrict apps, and block inappropriate websites for a child account. This tool configures Windows Family Safety settings, sets time limits, and blocks specific applications.",
    category: "Privacy & Security",
    options: [
      { id: "time-limits", label: "Set Screen Time Limits", description: "Limits computer usage to specific hours (e.g., 8 AM to 8 PM)", defaultValue: true },
      { id: "block-apps", label: "Block Specific Apps", description: "Prevents access to specified applications like games or social media", defaultValue: true },
      { id: "web-filter", label: "Enable Web Filtering", description: "Blocks inappropriate websites and enables SafeSearch", defaultValue: true },
      { id: "block-store", label: "Block Microsoft Store Purchases", description: "Prevents purchases and downloads from the Microsoft Store", defaultValue: true },
      { id: "activity-reports", label: "Enable Activity Reports", description: "Turns on weekly activity reports so you can see what the child account did", defaultValue: true },
    ],
  },
  "virus-scanner": {
    slug: "virus-scanner",
    title: "Virus & Malware Scanner",
    icon: ShieldCheck,
    description: "Runs Windows Defender scans (quick, full, or custom folder) and updates virus definitions.",
    longDescription:
      "Scan your system for viruses, malware, and suspicious files using Windows Defender's built-in command-line scanner (MpCmdRun.exe). This tool can run a quick scan of active malware locations, a full system scan, or scan a specific folder. It also updates virus definitions before scanning to catch the latest threats.",
    category: "Privacy & Security",
    options: [
      { id: "quick-scan", label: "Quick Scan", description: "Scans active malware locations (fastest)", defaultValue: true },
      { id: "full-scan", label: "Full System Scan", description: "Scans every file and running program on your system (slowest but most thorough)", defaultValue: false },
      { id: "custom-scan", label: "Scan a Specific Folder", description: "Scans a folder path you specify for threats", defaultValue: false, type: "text", placeholder: "C:\\Path\\To\\Folder" },
      { id: "update-defs", label: "Update Virus Definitions", description: "Downloads the latest virus definitions before scanning", defaultValue: true },
      { id: "check-status", label: "Check Defender Status", description: "Verifies Windows Defender is running and up to date", defaultValue: false },
    ],
  },
  "windows-search-fix": {
    slug: "windows-search-fix",
    title: "Windows Search Fix",
    icon: Search,
    description: "Rebuilds the search index, restarts WSearch service, and clears search history.",
    longDescription:
      "If Windows Search is not finding files or is slow, this tool rebuilds the search index, restarts the Windows Search service, and clears recent search history. No data is deleted — only the index is rebuilt for better performance.",
    category: "Fix Tools",
    options: [
      { id: "rebuild-index", label: "Rebuild Search Index", description: "Stops WSearch, clears the index, restarts the service to force a full rebuild", defaultValue: true },
      { id: "restart-wsearch", label: "Restart Search Service", description: "Restarts the Windows Search service (fixes temporary glitches)", defaultValue: true },
      { id: "clear-history", label: "Clear Search History", description: "Clears recent search queries from Windows Search", defaultValue: false },
    ],
  },
  "bluetooth-fix": {
    slug: "bluetooth-fix",
    title: "Bluetooth Troubleshooter",
    icon: Bluetooth,
    description: "Restarts Bluetooth service, resets the adapter, and scans for devices.",
    longDescription:
      "If Bluetooth is not finding devices, keeps disconnecting, or the adapter is missing, this tool restarts the Bluetooth service, resets the Bluetooth adapter, and scans for hardware changes to bring it back.",
    category: "Fix Tools",
    options: [
      { id: "restart-bthserv", label: "Restart Bluetooth Service", description: "Restarts the Bluetooth Support Service", defaultValue: true },
      { id: "reset-adapter", label: "Reset Bluetooth Adapter", description: "Disables and re-enables the Bluetooth radio to force a fresh start", defaultValue: true },
      { id: "scan-devices", label: "Scan for Bluetooth Hardware", description: "Triggers a hardware scan so Windows re-detects Bluetooth devices", defaultValue: true },
    ],
  },
  "explorer-fix": {
    slug: "explorer-fix",
    title: "File Explorer Fixer",
    icon: FolderSearch,
    description: "Clears thumbnail cache, restarts File Explorer, and repairs folder view settings.",
    longDescription:
      "If File Explorer is crashing, thumbnails are not showing, folder views are messed up, or the interface feels sluggish, this tool clears the thumbnail cache, restarts Explorer, and resets corrupted folder view settings.",
    category: "Fix Tools",
    options: [
      { id: "clear-thumbcache", label: "Clear Thumbnail Cache", description: "Deletes the thumbnail cache so Windows regenerates thumbnails fresh", defaultValue: true },
      { id: "restart-explorer", label: "Restart File Explorer", description: "Terminates and restarts Explorer.exe (fixes UI glitches and crashes)", defaultValue: true },
      { id: "repair-views", label: "Reset Folder Views", description: "Resets corrupted per-folder view settings (layout, sort, grouping) to defaults", defaultValue: false },
    ],
  },
  "clock-sync": {
    slug: "clock-sync",
    title: "Clock Sync Fix",
    icon: Clock,
    description: "Resync your PC clock, restart Windows Time service, and configure reliable time servers.",
    longDescription:
      "If your clock keeps losing time, showing the wrong date, or time sync keeps failing, this tool resyncs with an internet time server, restarts the Windows Time service, sets reliable NTP servers, and enables automatic sync so your clock stays accurate.",
    category: "Fix Tools",
    options: [
      { id: "resync-time", label: "Resync Clock with Time Server", description: "Forces an immediate sync with your configured internet time server", defaultValue: true },
      { id: "restart-w32time", label: "Restart Windows Time Service", description: "Stops and restarts the W32Time service (fixes stuck time sync)", defaultValue: true },
      { id: "change-server", label: "Set Reliable Time Servers", description: "Configures time.windows.com and pool.ntp.org as fallback servers", defaultValue: false },
      { id: "enable-auto", label: "Enable Automatic Time Sync", description: "Ensures W32Time auto-starts and syncs periodically", defaultValue: true },
    ],
  },
  "troubleshooter-runner": {
    slug: "troubleshooter-runner",
    title: "Windows Troubleshooter Runner",
    icon: Wrench,
    description: "Launch Microsoft's built-in troubleshooters for network, audio, printer, and more.",
    longDescription:
      "Windows includes built-in troubleshooters that can automatically detect and fix many common problems. This tool lets you launch the Network, Audio, Printer, or Windows Update troubleshooters directly, or run all of them in sequence.",
    category: "Fix Tools",
    options: [
      { id: "run-network", label: "Run Network Troubleshooter", description: "Diagnoses and fixes network adapter and internet connection issues", defaultValue: true },
      { id: "run-audio", label: "Run Audio Troubleshooter", description: "Detects and fixes audio playback problems", defaultValue: false },
      { id: "run-printer", label: "Run Printer Troubleshooter", description: "Finds and resolves printer driver and connection problems", defaultValue: false },
      { id: "run-update", label: "Run Windows Update Troubleshooter", description: "Fixes Windows Update stuck or failing downloads", defaultValue: false },
      { id: "run-all", label: "Run All Common Troubleshooters", description: "Runs network, audio, printer, update, and maintenance troubleshooters in sequence", defaultValue: false },
    ],
  },
  "store-fix": {
    slug: "store-fix",
    title: "Microsoft Store Fix",
    icon: Store,
    description: "Reset Store cache, re-register the Store app, and fix download errors.",
    longDescription:
      "If the Microsoft Store won't open, apps won't download or install, or the Store is stuck loading, this tool resets the Store cache using wsreset.exe, re-registers the Store app package, and restarts Store-related services to get it working again.",
    category: "Fix Tools",
    options: [
      { id: "reset-cache", label: "Reset Store Cache", description: "Runs wsreset.exe to clear the Store's temporary cache", defaultValue: true },
      { id: "reregister-store", label: "Re-register Microsoft Store", description: "Re-registers the Store app via PowerShell to fix broken installations", defaultValue: true },
      { id: "fix-store-service", label: "Fix Store Install Service", description: "Restarts and enables the Store Install Service (InstallService)", defaultValue: true },
    ],
  },
  "network-stack-reset": {
    slug: "network-stack-reset",
    title: "Network Stack Reset",
    icon: Router,
    description: "Flush DNS, reset Winsock, reset TCP/IP stack, and renew IP configuration.",
    longDescription:
      "If your internet is completely broken, DNS is not resolving, you're getting network errors, or nothing else has fixed connectivity, this tool flushes the DNS resolver cache, resets the Winsock catalog, resets the TCP/IP stack to default, and releases/renews your IP address. This is the nuclear option for network issues.",
    category: "Fix Tools",
    options: [
      { id: "flush-dns", label: "Flush DNS Cache", description: "Clears the DNS resolver cache so Windows re-queries DNS servers", defaultValue: true },
      { id: "reset-winsock", label: "Reset Winsock", description: "Resets the Winsock catalog to a clean state (fixes socket errors)", defaultValue: true },
      { id: "reset-tcpip", label: "Reset TCP/IP Stack", description: "Resets the entire TCP/IP stack to Windows defaults", defaultValue: true },
      { id: "release-renew", label: "Release & Renew IP", description: "Releases current IP and requests a new one from DHCP", defaultValue: false },
    ],
  },
  "activation-fix": {
    slug: "activation-fix",
    title: "Windows Activation Fix",
    icon: KeyRound,
    description: "Check activation status, force online activation, and refresh your Windows license.",
    longDescription:
      "If you see 'Activate Windows' watermark, get activation errors, or Windows was deactivated after a hardware change, this tool checks your current activation status, attempts online activation with Microsoft's servers, and refreshes the license state.",
    category: "Fix Tools",
    options: [
      { id: "check-status", label: "Check Activation Status", description: "Displays your current Windows activation state and product key details", defaultValue: true },
      { id: "activate-online", label: "Attempt Online Activation", description: "Forces Windows to contact Microsoft servers to activate", defaultValue: true },
      { id: "refresh-license", label: "Refresh License State", description: "Checks status first, then attempts activation if not activated", defaultValue: false },
    ],
  },
  "keyboard-mouse-fix": {
    slug: "keyboard-mouse-fix",
    title: "Keyboard & Mouse Fix",
    icon: Keyboard,
    description: "Reset keyboard, mouse, and touchpad drivers; fix stuck keys and HID services.",
    longDescription:
      "If your keyboard is not typing, mouse cursor is frozen, touchpad stopped working, or keys are stuck, this tool resets the keyboard and mouse drivers, restarts HID services, clears sticky/filter key states, and re-enables the touchpad.",
    category: "Fix Tools",
    options: [
      { id: "reset-keyboard", label: "Reset Keyboard Driver", description: "Disables and re-enables the keyboard to force driver reinstall", defaultValue: true },
      { id: "reset-mouse", label: "Reset Mouse Driver", description: "Disables and re-enables the mouse to force driver reinstall", defaultValue: true },
      { id: "reset-hid", label: "Restart HID Services", description: "Restarts Human Interface Device services for both keyboard and mouse", defaultValue: true },
      { id: "fix-sticky-keys", label: "Clear Stuck Key Settings", description: "Resets StickyKeys, FilterKeys, and ToggleKeys to defaults", defaultValue: false },
      { id: "check-touchpad", label: "Re-enable Touchpad", description: "Checks if touchpad is disabled and re-enables it", defaultValue: false },
    ],
  },
  "runtime-installer": {
    slug: "runtime-installer",
    title: "Windows Runtime Installer",
    icon: Binary,
    description: "One-click install .NET Desktop Runtime, VC++ Redist, and DirectX.",
    longDescription:
      "Many games and applications require the latest .NET Desktop Runtime, Visual C++ Redistributables, and DirectX to run properly. This tool installs all essential Windows runtimes using winget and official Microsoft download links so your software stops complaining about missing DLLs.",
    category: "Setup & Installation",
    options: [
      { id: "install-dotnet", label: "Install .NET Desktop Runtime", description: "Installs the latest .NET Desktop Runtime via winget (required for WPF apps)", defaultValue: true },
      { id: "install-vcredist", label: "Install VC++ Redistributable", description: "Installs the latest Visual C++ Redistributable (2015-2022) via winget", defaultValue: true },
      { id: "install-directx", label: "Install DirectX Runtime", description: "Downloads and runs the DirectX End-User Runtime Web Installer", defaultValue: true },
    ],
  },
  "font-cache-fix": {
    slug: "font-cache-fix",
    title: "Windows Font Cache Fix",
    icon: Type,
    description: "Rebuild font cache, reset font registry, and fix missing/corrupt fonts.",
    longDescription:
      "If fonts are showing as squares, text looks wrong, characters are missing, or fonts appear corrupt in apps, this tool stops the Font Cache service, deletes corrupted cache files, and resets font-related registry entries so Windows rebuilds the font cache fresh.",
    category: "Fix Tools",
    options: [
      { id: "rebuild-cache", label: "Rebuild Font Cache", description: "Stops FontCache service, deletes cache files, and restarts it", defaultValue: true },
      { id: "reset-font-registry", label: "Reset Font Registry", description: "Cleans up corrupted font entries in the Windows registry", defaultValue: true },
    ],
  },
  "windows-hello-fix": {
    slug: "windows-hello-fix",
    title: "Windows Hello & PIN Fix",
    icon: Fingerprint,
    description: "Restart biometric service, check TPM, and fix PIN sign-in issues.",
    longDescription:
      "If Windows Hello fingerprint, facial recognition, or PIN sign-in stops working after an update, this tool restarts the Windows Biometric Service, checks TPM status, restarts the Credential Manager, and detects Hello hardware so you can sign in again.",
    category: "Fix Tools",
    options: [
      { id: "restart-biometric", label: "Restart Biometric Service", description: "Restarts the Windows Biometric Service (WbioSrvc)", defaultValue: true },
      { id: "check-tpm", label: "Check TPM Status", description: "Checks if your TPM chip is enabled and ready for Windows Hello", defaultValue: true },
      { id: "restart-credential-manager", label: "Restart Credential Manager", description: "Restarts VaultSvc to resolve PIN credential issues", defaultValue: true },
      { id: "detect-hello", label: "Detect Hello Hardware", description: "Scans for biometric hardware (fingerprint, IR camera) and enables them", defaultValue: false },
    ],
  },
  "date-time-format-fix": {
    slug: "date-time-format-fix",
    title: "Date & Time Format Fix",
    icon: CalendarDays,
    description: "Reset region settings, fix date/time format, and set calendar preferences.",
    longDescription:
      "If dates show in the wrong format (MM/DD vs DD/MM), time is in 12-hour when you want 24-hour, or the calendar starts on the wrong day, this tool resets your region and locale settings, configures date and time format, and sets calendar preferences like the first day of the week.",
    category: "Customization",
    options: [
      { id: "reset-region", label: "Reset Region Settings", description: "Resets region, locale, and format settings to system defaults", defaultValue: true },
      { id: "fix-date-format", label: "Set Short Date Format", description: "Sets short date to DD/MM/YYYY format (common international format)", defaultValue: true },
      { id: "fix-time-format", label: "Set 24-Hour Format", description: "Sets time to 24-hour format (HH:mm) instead of 12-hour", defaultValue: false },
      { id: "fix-first-day", label: "Set Monday as First Day", description: "Sets Monday as the first day of the week in calendar settings", defaultValue: false },
    ],
  },
  "windows-apps-repair": {
    slug: "windows-apps-repair",
    title: "Windows Apps Repair",
    icon: AppWindow,
    description: "Re-register all built-in Windows apps, reset caches, and fix crashing apps.",
    longDescription:
      "If built-in Windows apps like Calculator, Photos, Mail, or Alarms won't open, crash on launch, or show blank screens, this tool re-registers all built-in app packages, resets their cached data, and re-registers at the system level so Windows rebuilds the app packages fresh.",
    category: "Fix Tools",
    options: [
      { id: "reinstall-all-apps", label: "Re-register All Apps", description: "Re-registers ALL built-in Windows app packages for your user account", defaultValue: true },
      { id: "reset-app-caches", label: "Reset App Caches", description: "Clears cached data for Calculator, Photos, Mail, Alarms, and more", defaultValue: true },
      { id: "system-apps-fix", label: "Fix System-Level Apps", description: "Re-registers app packages for ALL users on this PC (admin required)", defaultValue: false },
    ],
  },
  "file-association-guardian": {
    slug: "file-association-guardian",
    title: "File Association Guardian",
    icon: FileType,
    description: "Backup, restore, and scan file associations to stop apps from hijacking your defaults.",
    longDescription:
      "Every time you install a new app, it can hijack your file associations — suddenly .pdf opens in Edge, .mp3 in a new player, .html in a different browser. This tool backs up every file extension → app mapping, lets you restore them all with one click, and scans for changes since your last backup.",
    category: "Customization",
    options: [
      { id: "backup-associations", label: "Backup All Associations", description: "Saves every file extension and app mapping to a .reg file + JSON snapshot", defaultValue: true },
      { id: "restore-backup", label: "Restore from Backup", description: "Restores all file associations from the most recent backup", defaultValue: false },
      { id: "scan-hijacks", label: "Scan for Changes", description: "Compares current associations against backup to detect hijacks", defaultValue: false },
    ],
  },
  "camera-fix": {
    slug: "camera-fix",
    title: "Camera & Webcam Fix",
    icon: Camera,
    description: "Restart camera service, reinstall driver, and enable privacy permissions.",
    longDescription:
      "If your webcam or camera is not detected, showing a black screen, or not working in apps, this tool restarts the Windows Camera Frame Server, reinstalls the camera driver, enables camera access in privacy settings, and scans for hardware changes.",
    category: "Fix Tools",
    options: [
      { id: "restart-camera-service", label: "Restart Camera Service", description: "Restarts the Windows Camera Frame Server (FrameServer)", defaultValue: true },
      { id: "reset-camera-driver", label: "Reinstall Camera Driver", description: "Disables and re-enables the camera device to force driver refresh", defaultValue: true },
      { id: "check-privacy-permissions", label: "Enable Camera Privacy", description: "Ensures camera access is allowed in Windows privacy settings", defaultValue: true },
      { id: "scan-camera-hardware", label: "Scan for Camera Hardware", description: "Triggers a hardware scan to detect unrecognized cameras", defaultValue: false },
    ],
  },
  "system-tweaks": {
    slug: "system-tweaks",
    title: "System Tweaks",
    icon: SlidersHorizontal,
    description: "Power-user Windows tweaks: show hidden files, disable animations, clean up taskbar, and more. All reversible.",
    longDescription:
      "Tweak Windows to work the way you want. This tool includes power-user favorites like showing hidden files and file extensions, opening Explorer to 'This PC', disabling animations for a snappier UI, removing the Copilot and Widgets buttons, disabling OneDrive and Cortana, and more. Every change is reversible — original registry values are backed up before modification, and you can restore all defaults with one click.",
    category: "Customization",
    options: [
      { id: "show-hidden-files", label: "Show Hidden Files + Extensions", description: "Shows hidden files, protected OS files, and file extensions in File Explorer", defaultValue: true },
      { id: "show-full-path", label: "Show Full Path in Explorer Title Bar", description: "Displays the full folder path (e.g. C:\\Users\\Name\\Documents) in Explorer's title bar", defaultValue: true },
      { id: "open-to-this-pc", label: "Open Explorer to 'This PC'", description: "Skips Quick Access and opens File Explorer directly to 'This PC' view", defaultValue: true },
      { id: "disable-animations", label: "Disable Minimize/Maximize Animations", description: "Speeds up the UI by turning off window minimize/maximize animations — helpful for screen readers too", defaultValue: false },
      { id: "disable-transparency", label: "Disable Transparency Effects", description: "Turns off acrylic blur effects for better performance", defaultValue: false },
      { id: "disable-sticky-keys", label: "Disable Sticky / Filter Keys Prompts", description: "Stops the annoying 'press one key at a time' popups from accessibility settings", defaultValue: true },
      { id: "disable-search-highlights", label: "Disable Search Highlights / Bing Ads", description: "Removes trending searches, Bing ads, and 'search highlights' from Windows Search", defaultValue: true },
      { id: "disable-startup-sound", label: "Disable Windows Startup Sound", description: "Turns off the Windows 11 startup sound (Microsoft removed the toggle in Settings)", defaultValue: false },
      { id: "disable-game-bar", label: "Disable Xbox Game Bar", description: "Prevents Xbox Game Bar from recording in the background and eating resources", defaultValue: false },
      { id: "disable-onedrive", label: "Disable OneDrive Auto-Start", description: "Prevents OneDrive from launching at boot — frees up startup time", defaultValue: false },
      { id: "disable-lock-screen", label: "Disable Lock Screen", description: "Bypasses the lock screen and goes straight to the login prompt", defaultValue: false },
      { id: "disable-cortana", label: "Disable Cortana", description: "Completely disables Cortana assistant and its web search integration", defaultValue: false },
      { id: "disable-copilot", label: "Disable Copilot Button", description: "Removes the Copilot (Windows + C) button from the taskbar", defaultValue: true },
      { id: "disable-widgets", label: "Disable Widgets Button", description: "Removes the Widgets (weather/news) button from the taskbar", defaultValue: true },
      { id: "restore-defaults", label: "★ Restore All Defaults", description: "Undoes all tweaks applied by this tool and restores original registry values from backup", defaultValue: false },
    ],
  },
  "free-up-space": {
    slug: "free-up-space",
    title: "Free Up Disk Space",
    icon: HardDrive,
    description: "Clean temp files, empty Recycle Bin, remove Windows.old, and disable hibernation to reclaim GBs of space.",
    longDescription:
      "Running low on disk space is the most common Windows complaint. This tool safely removes temporary files, Windows Update cache, Delivery Optimization files, and optionally clears Windows.old (previous installation) and disables hibernation. Only junk is deleted — never your personal files.",
    category: "Performance",
    options: [
      { id: "clean-temp", label: "Clean Temporary Files", description: "Deletes files in user TEMP and Windows Temp older than 1 day", defaultValue: true },
      { id: "empty-recyclebin", label: "Empty Recycle Bin", description: "Permanently empties the Recycle Bin — cannot be undone", defaultValue: true },
      { id: "clean-update-cache", label: "Clean Windows Update Cache", description: "Clears the SoftwareDistribution download folder to free GBs", defaultValue: true },
      { id: "clean-windows-old", label: "Remove Windows.old", description: "Removes previous Windows installation folder (safe after upgrade). Cannot be undone.", defaultValue: false },
      { id: "disable-hibernation", label: "Disable Hibernation", description: "Turns off hibernation and removes hiberfil.sys (multi-GB file)", defaultValue: false },
      { id: "clean-delivery-optimization", label: "Clean Delivery Optimization Cache", description: "Clears Windows Update Delivery Optimization peer cache", defaultValue: true },
    ],
  },
  "restore-point-manager": {
    slug: "restore-point-manager",
    title: "Restore Point Manager",
    icon: History,
    description: "Create, list, and open System Restore points — your safety net before making changes.",
    longDescription:
      "System Restore points let you roll back system files and registry to a previous state. This tool creates restore points, lists existing ones, enables protection on drive C, and opens the restore wizard so you can roll back safely.",
    category: "Backup",
    options: [
      { id: "enable-protection", label: "Enable System Protection on C:", description: "Turns on System Restore for the C: drive", defaultValue: true },
      { id: "create-point", label: "Create a Restore Point Now", description: "Creates a restore point named 'Fixelo Restore Point' (forces creation by temporarily disabling the 24h throttle)", defaultValue: true },
      { id: "list-points", label: "List Existing Restore Points", description: "Read-only — logs all available restore points", defaultValue: false },
      { id: "open-restore", label: "Open System Restore Wizard", description: "Opens rstrui.exe so you can pick a restore point and roll back", defaultValue: false },
    ],
  },
  "microphone-fix": {
    slug: "microphone-fix",
    title: "Microphone Fix",
    icon: Mic,
    description: "Fix mic issues: restart audio services, enable privacy permissions, re-enable the mic device.",
    longDescription:
      "Microphone not working in Teams, Zoom, or Discord? This tool restarts audio services, ensures mic privacy access is allowed, and re-enables the mic device. Use the 'Open Recording Settings' option to pick your default microphone.",
    category: "Hardware",
    options: [
      { id: "restart-audio", label: "Restart Audio Services", description: "Restarts Audiosrv and AudioEndpointBuilder (fixes many mic issues)", defaultValue: true },
      { id: "enable-mic-access", label: "Enable Microphone Privacy Access", description: "Allows microphone access in Windows privacy settings", defaultValue: true },
      { id: "enable-mic-device", label: "Re-enable Microphone Device", description: "Finds and re-enables disabled microphone devices", defaultValue: true },
      { id: "open-recording-settings", label: "Open Recording Settings", description: "Opens the Sound recording tab so you can pick your default mic", defaultValue: false },
    ],
  },
  "power-sleep-fix": {
    slug: "power-sleep-fix",
    title: "Power & Sleep Fix",
    icon: Power,
    description: "Fix sleep/wake issues: diagnose wake sources, disable wake timers, disable fast startup.",
    longDescription:
      "PC won't sleep, keeps waking randomly, or won't shut down? This tool diagnoses what's blocking sleep, disables wake timers, disables fast startup (a common culprit), and can restore sane sleep defaults.",
    category: "Performance",
    options: [
      { id: "diagnose-sleep", label: "Diagnose Sleep Issues", description: "Logs what's blocking sleep and what last woke the PC (read-only)", defaultValue: true },
      { id: "stop-random-wake", label: "Stop Random Wake", description: "Disables wake timers and wake-armed devices. Fully reversible.", defaultValue: true },
      { id: "disable-fast-startup", label: "Disable Fast Startup", description: "Disables hybrid shutdown (fixes 'won't shut down' and boot quirks)", defaultValue: true },
      { id: "restore-sleep-defaults", label: "Restore Sleep Defaults", description: "Resets sleep timeouts to sane defaults (30min AC, 15min DC)", defaultValue: false },
    ],
  },
  "onedrive-fix": {
    slug: "onedrive-fix",
    title: "OneDrive Fix",
    icon: Cloud,
    description: "Pause OneDrive sync, disable startup, reset or unlink OneDrive.",
    longDescription:
      "OneDrive won't stop syncing, won't start, or you just want it off your PC? This tool pauses sync, removes OneDrive from startup, resets the sync engine, or can uninstall OneDrive entirely. Your cloud files are never deleted.",
    category: "Apps",
    options: [
      { id: "pause-sync", label: "Pause OneDrive Sync", description: "Stops the OneDrive sync process immediately", defaultValue: true },
      { id: "disable-startup", label: "Disable OneDrive from Startup", description: "Prevents OneDrive from launching automatically at boot", defaultValue: true },
      { id: "reset-onedrive", label: "Reset OneDrive", description: "Resets the OneDrive sync engine (useful for stuck sync)", defaultValue: false },
      { id: "uninstall-onedrive", label: "Uninstall OneDrive", description: "Removes the OneDrive app (cloud files stay safe online). Reinstall option available.", defaultValue: false },
    ],
  },
  "context-menu-cleaner": {
    slug: "context-menu-cleaner",
    title: "Right Click Menu Cleaner",
    icon: List,
    description: "Clean up cluttered context menus by removing unwanted shell extensions.",
    longDescription:
      "If your right-click menu is slow, has too many items, or takes forever to open, this tool cleans out unwanted shell extensions from File Explorer, clears the Send To menu, and can restore your previous menu state from a backup.",
    category: "Customization",
    options: [
      { id: "clean-sendto", label: "Clean Send To Menu", description: "Removes unnecessary items from the Send To context menu", defaultValue: true },
      { id: "clean-extensions", label: "Remove Junk Shell Extensions", description: "Removes known bloat extensions with automatic registry backup", defaultValue: true },
      { id: "restore-backup", label: "Restore from Backup", description: "Restores context menu to state before the last cleanup (undo)", defaultValue: false },
    ],
  },
}

export function getToolConfig(slug: string): ToolConfig | undefined {
  return TOOLS[slug]
}

export function getAllToolSlugs(): string[] {
  return Object.keys(TOOLS)
}

export const TOOL_CATEGORIES = [
  "Fix Tools",
  "Performance",
  "Privacy & Security",
  "Customization",
  "Automation",
  "Setup & Installation",
  "Hardware",
  "Backup",
  "Apps",
]