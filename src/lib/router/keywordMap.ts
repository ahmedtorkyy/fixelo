import { getAllToolSlugs } from "@/lib/toolConfigs"

export interface ToolSuggestion {
  slug: string
  confidence: number
}

const KEYWORD_TO_SLUG: Record<string, string[]> = {
  // Slow PC
  "slow": ["slow-pc-fix"],
  "lag": ["slow-pc-fix", "gaming-boost"],
  "laggy": ["slow-pc-fix"],
  "sluggish": ["slow-pc-fix"],
  "stutter": ["slow-pc-fix", "gaming-boost"],
  "stuttering": ["slow-pc-fix", "gaming-boost"],
  "startup": ["startup-manager", "slow-pc-fix"],
  "boot": ["startup-manager", "slow-pc-fix"],
  "temp": ["slow-pc-fix", "monthly-maintenance"],
  "cache": ["slow-pc-fix", "monthly-maintenance"],
  "junk": ["slow-pc-fix", "monthly-maintenance"],
  "clean": ["slow-pc-fix", "monthly-maintenance"],
  "power": ["slow-pc-fix", "battery-optimizer"],
  "speed": ["gaming-boost", "slow-pc-fix"],
  "faster": ["gaming-boost", "slow-pc-fix"],
  "improve": ["gaming-boost", "slow-pc-fix", "audio-fix", "display-resolution-fix"],
  "performance": ["gaming-boost", "slow-pc-fix"],

  // Gaming
  "gaming": ["gaming-boost"],
  "game": ["gaming-boost"],
  "fps": ["gaming-boost"],
  "gpu": ["gaming-boost"],
  "boost": ["gaming-boost", "slow-pc-fix"],
  "optimize": ["gaming-boost", "slow-pc-fix", "ssd-optimizer"],

  // Network/WiFi
  "network": ["network-optimizer", "wifi-network-fixer"],
  "wifi": ["wifi-network-fixer"],
  "wi-fi": ["wifi-network-fixer"],
  "wireless": ["wifi-network-fixer"],
  "dns": ["network-optimizer", "wifi-network-fixer"],
  "internet": ["network-optimizer", "wifi-network-fixer"],
  "connection": ["network-optimizer", "wifi-network-fixer"],

  // Audio
  "audio": ["audio-fix"],
  "sound": ["audio-fix"],
  "speaker": ["audio-fix"],
  "headphone": ["audio-fix"],
  "microphone": ["audio-fix"],
  "mic": ["audio-fix"],
  "volume": ["audio-fix"],
  "quiet": ["audio-fix"],
  "low": ["audio-fix"],
  "mute": ["audio-fix"],
  "echo": ["audio-fix"],
  "crackle": ["audio-fix"],
  "distortion": ["audio-fix", "display-resolution-fix"],
  "noise": ["audio-fix"],
  "buzzing": ["audio-fix"],
  "static": ["audio-fix"],
  "narrator": ["audio-fix"],
  "hear": ["audio-fix"],

  // Printer
  "printer": ["printer-fix"],
  "print": ["printer-fix"],
  "printing": ["printer-fix"],
  "spooler": ["printer-fix"],

  // USB
  "usb": ["usb-device-fix"],
  "plug": ["usb-device-fix"],
  "unplug": ["usb-device-fix"],

  // Blue Screen
  "blue screen": ["blue-screen-recovery"],
  "bsod": ["blue-screen-recovery"],
  "crash": ["blue-screen-recovery", "corrupted-files-fix", "explorer-fix"],
  "freeze": ["blue-screen-recovery", "slow-pc-fix"],

  // Windows Update
  "update": ["windows-update-fixer"],
  "stuck": ["windows-update-fixer"],

  // Disk / SSD
  "disk": ["disk-error-fix", "ssd-optimizer"],
  "drive": ["disk-error-fix"],
  "ssd": ["ssd-optimizer"],
  "storage": ["disk-error-fix", "monthly-maintenance"],
  "space": ["disk-error-fix", "monthly-maintenance"],
  "trim": ["ssd-optimizer"],
  "hdd": ["disk-error-fix"],

  // Battery
  "battery": ["battery-optimizer"],
  "draining": ["battery-optimizer"],
  "charge": ["battery-optimizer"],

  // Display
  "screen": ["display-resolution-fix"],
  "display": ["display-resolution-fix"],
  "resolution": ["display-resolution-fix"],
  "monitor": ["display-resolution-fix"],
  "flicker": ["display-resolution-fix"],
  "blurry": ["display-resolution-fix"],
  "blur": ["display-resolution-fix", "system-tweaks"],
  "pixel": ["display-resolution-fix"],
  "brightness": ["display-resolution-fix"],
  "contrast": ["display-resolution-fix"],
  "glare": ["display-resolution-fix"],
  "orientation": ["display-resolution-fix"],
  "rotation": ["display-resolution-fix"],
  "scaling": ["display-resolution-fix"],
  "refresh": ["display-resolution-fix"],
  "hz": ["display-resolution-fix"],
  "zoom": ["display-resolution-fix"],
  "dpi": ["display-resolution-fix"],

  // Corrupted Files
  "corrupted": ["corrupted-files-fix"],
  "corrupt": ["corrupted-files-fix"],
  "sfc": ["corrupted-files-fix"],
  "dism": ["corrupted-files-fix"],

  // Privacy
  "privacy": ["privacy-protector"],
  "telemetry": ["privacy-protector"],
  "tracking": ["privacy-protector"],
  "spyware": ["privacy-protector"],

  // Virus Scanner
  "virus": ["virus-scanner"],
  "malware": ["virus-scanner"],
  "scan": ["virus-scanner"],
  "defender": ["virus-scanner"],
  "trojan": ["virus-scanner"],
  "ransomware": ["virus-scanner"],
  "antivirus": ["virus-scanner"],
  "quarantine": ["virus-scanner"],

  // New PC Setup
  "bloatware": ["new-pc-setup"],
  "preinstalled": ["new-pc-setup"],

  // Dark Mode
  "dark": ["dark-mode-setup"],
  "theme": ["dark-mode-setup"],
  "appearance": ["dark-mode-setup"],

  // Taskbar
  "taskbar": ["taskbar-customizer"],

  // Shutdown
  "shutdown": ["auto-shutdown"],
  "sleep": ["auto-shutdown"],
  "hibernate": ["auto-shutdown"],
  "timer": ["auto-shutdown"],

  // Backup
  "backup": ["auto-backup"],
  "restore": ["auto-backup"],
  "restore point": ["auto-backup"],

  // Driver
  "driver": ["driver-manager"],

  // Parental Controls
  "parental": ["parental-controls"],
  "child": ["parental-controls"],
  "kids": ["parental-controls"],
  "children": ["parental-controls"],
  "restrict": ["parental-controls"],

  // Winget Installer
  "winget": ["winget-installer"],
  "install": ["winget-installer"],
  "software": ["winget-installer"],
  "package": ["winget-installer"],
  "app": ["winget-installer"],

  // Dev Environment
  "developer": ["dev-environment"],
  "programming": ["dev-environment"],
  "coding": ["dev-environment"],

  // Monthly Maintenance
  "maintenance": ["monthly-maintenance"],
  "cleanup": ["monthly-maintenance", "disk-error-fix"],

  // Generic "fixing" action (helps vague queries reach threshold)
  "fixing": ["display-resolution-fix", "audio-fix", "slow-pc-fix", "printer-fix", "usb-device-fix", "driver-manager"],

  // Windows Search
  "search": ["windows-search-fix"],
  "finding": ["windows-search-fix"],
  "index": ["windows-search-fix"],
  "indexing": ["windows-search-fix"],

  // Bluetooth
  "bluetooth": ["bluetooth-fix"],
  "bt": ["bluetooth-fix"],
  "pair": ["bluetooth-fix"],
  "pairing": ["bluetooth-fix"],

  // File Explorer
  "explorer": ["explorer-fix"],
  "thumbnail": ["explorer-fix"],
  "thumbnails": ["explorer-fix"],

  // Multi-word keywords (score ×3)
  "delete temp": ["monthly-maintenance", "slow-pc-fix"],
  "clean temp": ["monthly-maintenance", "slow-pc-fix"],
  "clear cache": ["monthly-maintenance"],
  "delete junk": ["monthly-maintenance", "slow-pc-fix"],
  "clean junk": ["monthly-maintenance", "slow-pc-fix"],
  "free space": ["monthly-maintenance", "disk-error-fix"],
  "disk cleanup": ["monthly-maintenance", "disk-error-fix"],
  "delete file": ["disk-error-fix"],
  "new pc": ["new-pc-setup"],
  "new computer": ["new-pc-setup"],
  "install software": ["winget-installer"],
  "install app": ["winget-installer"],
  "dev environment": ["dev-environment"],
  "developer setup": ["dev-environment"],
  "programming environment": ["dev-environment"],
  "not booting": ["blue-screen-recovery", "startup-manager"],
  "black screen": ["display-resolution-fix", "blue-screen-recovery"],
  "screen flicker": ["display-resolution-fix"],
  "screen flickering": ["display-resolution-fix"],
  "blurry screen": ["display-resolution-fix"],
  "pixel screen": ["display-resolution-fix"],
  "no sound": ["audio-fix"],
  "sound not working": ["audio-fix"],
  "audio not working": ["audio-fix"],
  "microphone quiet": ["audio-fix"],
  "microphone low": ["audio-fix"],
  "microphone not working": ["audio-fix"],
  "speaker crackle": ["audio-fix"],
  "speaker static": ["audio-fix"],
  "buzzing sound": ["audio-fix"],
  "game speed": ["gaming-boost"],
  "game performance": ["gaming-boost"],
  "improve speed": ["gaming-boost", "slow-pc-fix"],
  "pc speed": ["slow-pc-fix"],
  "computer speed": ["slow-pc-fix"],
  "make faster": ["gaming-boost", "slow-pc-fix"],
  "run faster": ["gaming-boost", "slow-pc-fix"],
  "slow internet": ["network-optimizer", "wifi-network-fixer"],
  "no internet": ["network-optimizer", "wifi-network-fixer"],
  "no network": ["network-optimizer", "wifi-network-fixer"],
  "can't connect": ["network-optimizer", "wifi-network-fixer"],
  "no audio": ["audio-fix"],
  "can't hear": ["audio-fix"],
  "can't print": ["printer-fix"],
  "add printer": ["printer-fix"],
  "device not recognized": ["usb-device-fix"],
  "usb not working": ["usb-device-fix"],
  "not detected": ["usb-device-fix", "bluetooth-fix"],
  "blue screen of death": ["blue-screen-recovery"],
  "system crash": ["blue-screen-recovery"],
  "screen flickering": ["display-resolution-fix"],
  "screen size": ["display-resolution-fix"],
  "system file": ["corrupted-files-fix"],
  "system files": ["corrupted-files-fix"],
  "file corrupted": ["corrupted-files-fix"],
  "update stuck": ["windows-update-fixer"],
  "can't update": ["windows-update-fixer"],
  "update failed": ["windows-update-fixer"],
  "slow boot": ["startup-manager", "slow-pc-fix"],
  "boot time": ["startup-manager", "slow-pc-fix"],
  "uninstall program": ["winget-installer"],
  "install programs": ["winget-installer"],
  "batch install": ["winget-installer"],
  "bulk install": ["winget-installer"],
  "update driver": ["driver-manager"],
  "driver update": ["driver-manager"],
  "backup files": ["auto-backup"],
  "backup now": ["auto-backup"],
  "schedule shutdown": ["auto-shutdown"],
  "auto shutdown": ["auto-shutdown"],
  "screen time": ["parental-controls"],
  "family safety": ["parental-controls"],
  "search not working": ["windows-search-fix"],
  "search not finding": ["windows-search-fix"],
  "find files": ["windows-search-fix"],
  "bluetooth not working": ["bluetooth-fix"],
  "bluetooth not finding": ["bluetooth-fix"],
  "can't pair": ["bluetooth-fix"],
  "explorer crash": ["explorer-fix"],
  "explorer crashes": ["explorer-fix"],
  "file explorer": ["explorer-fix"],
  "folder view": ["explorer-fix"],
  "thumbnail not showing": ["explorer-fix"],
  "windows defender": ["virus-scanner"],
  "full scan": ["virus-scanner"],
  "virus scan": ["virus-scanner"],
  "battery drain": ["battery-optimizer"],
  "dying fast": ["battery-optimizer"],
  "data collection": ["privacy-protector"],
  "slow pc": ["slow-pc-fix"],
  "pc slow": ["slow-pc-fix"],
  "computer slow": ["slow-pc-fix"],
  "hanging": ["slow-pc-fix"],
  "unresponsive": ["slow-pc-fix"],
  "clock": ["clock-sync"],
  "time": ["clock-sync"],
  "date": ["clock-sync"],
  "sync": ["clock-sync"],
  "troubleshoot": ["troubleshooter-runner"],
  "troubleshooter": ["troubleshooter-runner"],
  "msdt": ["troubleshooter-runner"],
  "wrong time": ["clock-sync"],
  "time sync": ["clock-sync"],
  "wrong date": ["clock-sync"],
  "clock wrong": ["clock-sync"],
  "time is wrong": ["clock-sync"],
  "losing time": ["clock-sync"],
  "set time zone": ["clock-sync"],
  "fix network": ["troubleshooter-runner"],
  "fix audio": ["troubleshooter-runner"],
  "fix printer": ["troubleshooter-runner"],
  "windows troubleshoot": ["troubleshooter-runner"],
  "run troubleshooter": ["troubleshooter-runner"],
  "network troubleshooter": ["troubleshooter-runner"],
  "audio troubleshooter": ["troubleshooter-runner"],
  "printer troubleshooter": ["troubleshooter-runner"],

  // === GENERAL CATCH-ALL (routes vague queries to built-in troubleshooter) ===
  "windows problem": ["troubleshooter-runner"],
  "windows issue": ["troubleshooter-runner"],
  "windows trouble": ["troubleshooter-runner"],
  "windows help": ["troubleshooter-runner"],
  "windows error": ["troubleshooter-runner"],
  "troubleshoot windows": ["troubleshooter-runner"],
  "repair windows": ["troubleshooter-runner"],
  "fix windows": ["troubleshooter-runner"],
  "fix my pc": ["troubleshooter-runner"],
  "fix my computer": ["troubleshooter-runner"],
  "diagnose problem": ["troubleshooter-runner"],
  "diagnose issue": ["troubleshooter-runner"],
  "system troubleshooter": ["troubleshooter-runner"],
  "microsoft troubleshooter": ["troubleshooter-runner"],
  "built in troubleshooter": ["troubleshooter-runner"],

  // === CLOCK SYNC ===
  "clock is off": ["clock-sync"],
  "date is off": ["clock-sync"],
  "time is off": ["clock-sync"],
  "clock keeps resetting": ["clock-sync"],
  "clock not syncing": ["clock-sync"],
  "time not syncing": ["clock-sync"],
  "wrong time zone": ["clock-sync"],
  "time zone wrong": ["clock-sync"],
  "system clock": ["clock-sync"],
  "set clock": ["clock-sync"],
  "set time": ["clock-sync"],
  "set date": ["clock-sync"],
  "time server": ["clock-sync"],
  "ntp server": ["clock-sync"],
  "automatic time": ["clock-sync"],

  // === AUDIO ===
  "headphone not working": ["audio-fix"],
  "headphones not working": ["audio-fix"],
  "speaker not working": ["audio-fix"],
  "speakers not working": ["audio-fix"],
  "headphone jack": ["audio-fix"],
  "audio jack": ["audio-fix"],
  "audio device": ["audio-fix"],
  "sound device": ["audio-fix"],
  "no audio device": ["audio-fix"],
  "sound card": ["audio-fix"],
  "audio driver": ["audio-fix", "driver-manager"],
  "no volume": ["audio-fix"],
  "low volume": ["audio-fix"],
  "sound problem": ["audio-fix"],
  "audio problem": ["audio-fix"],
  "sound issue": ["audio-fix"],
  "audio issue": ["audio-fix"],
  "can't hear": ["audio-fix"],
  "can't hear anything": ["audio-fix"],
  "hear nothing": ["audio-fix"],
  "realtek": ["audio-fix"],
  "listen": ["audio-fix"],

  // === DISPLAY ===
  "external monitor": ["display-resolution-fix"],
  "second monitor": ["display-resolution-fix"],
  "monitor not detected": ["display-resolution-fix"],
  "monitor not working": ["display-resolution-fix"],
  "external display": ["display-resolution-fix"],
  "dual monitor": ["display-resolution-fix"],
  "dual screen": ["display-resolution-fix"],
  "extend display": ["display-resolution-fix"],
  "extend screen": ["display-resolution-fix"],
  "duplicate display": ["display-resolution-fix"],
  "project screen": ["display-resolution-fix"],
  "projector": ["display-resolution-fix"],
  "wrong resolution": ["display-resolution-fix"],
  "display settings": ["display-resolution-fix"],
  "monitor settings": ["display-resolution-fix"],
  "screen settings": ["display-resolution-fix"],
  "screen ratio": ["display-resolution-fix"],
  "aspect ratio": ["display-resolution-fix"],
  "display problem": ["display-resolution-fix"],
  "screen problem": ["display-resolution-fix"],

  // === SLOW PC ===
  "freezing": ["slow-pc-fix"],
  "freezes": ["slow-pc-fix"],
  "computer freeze": ["slow-pc-fix"],
  "pc freeze": ["slow-pc-fix"],
  "system freeze": ["slow-pc-fix"],
  "not responding": ["slow-pc-fix"],
  "program not responding": ["slow-pc-fix"],
  "too slow": ["slow-pc-fix"],
  "very slow": ["slow-pc-fix"],
  "running slow": ["slow-pc-fix"],
  "pc sluggish": ["slow-pc-fix"],
  "system sluggish": ["slow-pc-fix"],
  "computer freeze": ["slow-pc-fix"],
  "system lag": ["slow-pc-fix"],
  "pc lagging": ["slow-pc-fix"],
  "computer lagging": ["slow-pc-fix"],
  "everything slow": ["slow-pc-fix"],

  // === VIRUS SCANNER ===
  "security": ["virus-scanner"],
  "threat": ["virus-scanner"],
  "infected": ["virus-scanner"],
  "infection": ["virus-scanner"],
  "remove virus": ["virus-scanner"],
  "remove malware": ["virus-scanner"],
  "pc infected": ["virus-scanner"],
  "computer infected": ["virus-scanner"],
  "virus detected": ["virus-scanner"],
  "malware detected": ["virus-scanner"],
  "security threat": ["virus-scanner"],
  "threat detected": ["virus-scanner"],
  "windows security": ["virus-scanner"],
  "virus protection": ["virus-scanner"],
  "malware protection": ["virus-scanner"],
  "scan pc": ["virus-scanner"],
  "scan computer": ["virus-scanner"],
  "quick scan": ["virus-scanner"],

  // === WINDOWS SEARCH ===
  "cortana": ["windows-search-fix", "system-tweaks"],
  "search bar": ["windows-search-fix"],
  "search box": ["windows-search-fix"],
  "can't search": ["windows-search-fix"],
  "search broken": ["windows-search-fix"],
  "search problem": ["windows-search-fix"],
  "search index": ["windows-search-fix"],
  "index not working": ["windows-search-fix"],
  "rebuild index": ["windows-search-fix"],
  "search not finding files": ["windows-search-fix"],

  // === BLUETOOTH ===
  "bluetooth adapter": ["bluetooth-fix"],
  "bluetooth device": ["bluetooth-fix"],
  "bluetooth off": ["bluetooth-fix"],
  "bluetooth on": ["bluetooth-fix"],
  "turn on bluetooth": ["bluetooth-fix"],
  "no bluetooth": ["bluetooth-fix"],
  "bluetooth error": ["bluetooth-fix"],
  "add device": ["bluetooth-fix"],
  "connect device": ["bluetooth-fix"],
  "bluetooth not connecting": ["bluetooth-fix"],
  "bluetooth disconnected": ["bluetooth-fix"],
  "wireless device": ["bluetooth-fix"],

  // === FILE EXPLORER ===
  "explorer not responding": ["explorer-fix"],
  "windows explorer": ["explorer-fix"],
  "explorer keeps crashing": ["explorer-fix"],
  "folder not opening": ["explorer-fix"],
  "file explorer crash": ["explorer-fix"],
  "explorer freezing": ["explorer-fix"],
  "icons missing": ["explorer-fix"],
  "desktop not showing": ["explorer-fix"],
  "desktop icons": ["explorer-fix"],
  "explorer problem": ["explorer-fix"],
  "file explorer not responding": ["explorer-fix"],

  // === GAMING ===
  "gaming mode": ["gaming-boost"],
  "game mode": ["gaming-boost"],
  "low fps": ["gaming-boost"],
  "fps drop": ["gaming-boost"],
  "gaming lag": ["gaming-boost"],
  "game stutter": ["gaming-boost"],
  "game freezing": ["gaming-boost"],
  "gaming slow": ["gaming-boost"],
  "boost fps": ["gaming-boost"],
  "increase fps": ["gaming-boost"],
  "game ready": ["gaming-boost"],
  "gaming performance": ["gaming-boost"],
  "optimize games": ["gaming-boost"],

  // === PRIVACY ===
  "stop tracking": ["privacy-protector"],
  "disable telemetry": ["privacy-protector"],
  "advertising id": ["privacy-protector"],
  "location tracking": ["privacy-protector"],
  "diagnostic data": ["privacy-protector"],
  "privacy settings": ["privacy-protector"],
  "cortana tracking": ["privacy-protector"],
  "microsoft tracking": ["privacy-protector"],
  "telemetry off": ["privacy-protector"],

  // === BATTERY ===
  "battery life": ["battery-optimizer"],
  "battery health": ["battery-optimizer"],
  "save battery": ["battery-optimizer"],
  "power save": ["battery-optimizer"],
  "battery saver": ["battery-optimizer"],
  "laptop battery": ["battery-optimizer"],
  "battery dies": ["battery-optimizer"],
  "battery dying": ["battery-optimizer"],
  "improve battery": ["battery-optimizer"],
  "battery report": ["battery-optimizer"],
  "power consumption": ["battery-optimizer"],
  "extend battery": ["battery-optimizer"],

  // === NETWORK ===
  "network speed": ["network-optimizer"],
  "high ping": ["network-optimizer"],
  "latency": ["network-optimizer"],
  "network lag": ["network-optimizer"],
  "packet loss": ["network-optimizer"],
  "slow connection": ["network-optimizer"],
  "bandwidth": ["network-optimizer"],
  "improve network": ["network-optimizer"],
  "network slow": ["network-optimizer"],
  "speed test": ["network-optimizer"],

  // === WIFI ===
  "wifi adapter": ["wifi-network-fixer", "driver-manager"],
  "wifi driver": ["wifi-network-fixer", "driver-manager"],
  "wifi keeps dropping": ["wifi-network-fixer"],
  "wifi signal": ["wifi-network-fixer"],
  "wifi connected no internet": ["wifi-network-fixer"],
  "wifi no internet": ["wifi-network-fixer"],
  "no wifi": ["wifi-network-fixer"],
  "wifi not showing": ["wifi-network-fixer"],
  "can't connect to wifi": ["wifi-network-fixer"],
  "wifi disconnected": ["wifi-network-fixer"],
  "wireless connection": ["wifi-network-fixer"],
  "wifi problem": ["wifi-network-fixer"],

  // === DISK ===
  "hard drive error": ["disk-error-fix"],
  "disk error": ["disk-error-fix"],
  "check disk": ["disk-error-fix"],
  "hard drive failing": ["disk-error-fix"],
  "disk failure": ["disk-error-fix"],
  "drive error": ["disk-error-fix"],
  "disk repair": ["disk-error-fix"],
  "fix disk": ["disk-error-fix"],
  "storage drive": ["disk-error-fix"],
  "hard drive problem": ["disk-error-fix"],
  "disk problem": ["disk-error-fix"],
  "drive failing": ["disk-error-fix"],

  // === PRINTER ===
  "printer offline": ["printer-fix"],
  "printer error": ["printer-fix"],
  "print spooler": ["printer-fix"],
  "cannot print": ["printer-fix"],
  "printer driver": ["printer-fix", "driver-manager"],
  "printer not responding": ["printer-fix"],
  "network printer": ["printer-fix"],
  "printer problem": ["printer-fix"],
  "print not working": ["printer-fix"],
  "printer not printing": ["printer-fix"],

  // === USB ===
  "flash drive": ["usb-device-fix"],
  "usb drive": ["usb-device-fix"],
  "external hard drive": ["usb-device-fix"],
  "usb not detected": ["usb-device-fix"],
  "usb error": ["usb-device-fix"],
  "usb port": ["usb-device-fix"],
  "usb not recognized": ["usb-device-fix"],
  "usb device not working": ["usb-device-fix"],
  "external drive": ["usb-device-fix"],

  // === BLUE SCREEN ===
  "blue screen error": ["blue-screen-recovery"],
  "stop error": ["blue-screen-recovery"],
  "stop code": ["blue-screen-recovery"],
  "critical error": ["blue-screen-recovery"],
  "pc crashed": ["blue-screen-recovery"],
  "computer crashed": ["blue-screen-recovery"],
  "windows crashed": ["blue-screen-recovery"],
  "unexpected shutdown": ["blue-screen-recovery"],
  "kernel error": ["blue-screen-recovery"],
  "system crash": ["blue-screen-recovery"],
  "machine crash": ["blue-screen-recovery"],

  // === CORRUPTED FILES ===
  "repair files": ["corrupted-files-fix"],
  "fix files": ["corrupted-files-fix"],
  "file error": ["corrupted-files-fix"],
  "scan files": ["corrupted-files-fix"],
  "system repair": ["corrupted-files-fix"],
  "windows repair": ["corrupted-files-fix"],
  "repair system": ["corrupted-files-fix"],
  "file damage": ["corrupted-files-fix"],
  "corrupt system": ["corrupted-files-fix"],
  "integrity violation": ["corrupted-files-fix"],

  // === DRIVER ===
  "device driver": ["driver-manager"],
  "graphics driver": ["driver-manager"],
  "gpu driver": ["driver-manager"],
  "network driver": ["driver-manager"],
  "audio driver": ["driver-manager", "audio-fix"],
  "driver problem": ["driver-manager"],
  "driver error": ["driver-manager"],
  "driver conflict": ["driver-manager"],
  "update drivers": ["driver-manager"],
  "install driver": ["driver-manager"],
  "outdated driver": ["driver-manager"],
  "driver issue": ["driver-manager"],

  // === WINDOWS UPDATE ===
  "windows update error": ["windows-update-fixer"],
  "update not working": ["windows-update-fixer"],
  "update download": ["windows-update-fixer"],
  "update install": ["windows-update-fixer"],
  "windows update stuck": ["windows-update-fixer"],
  "check for updates": ["windows-update-fixer"],
  "update service": ["windows-update-fixer"],
  "update problem": ["windows-update-fixer"],
  "windows update problem": ["windows-update-fixer"],
  "update error": ["windows-update-fixer"],

  // === SHUTDOWN ===
  "turn off": ["auto-shutdown"],
  "auto power off": ["auto-shutdown"],
  "shutdown computer": ["auto-shutdown"],
  "shutdown pc": ["auto-shutdown"],
  "sleep timer": ["auto-shutdown"],
  "hibernate pc": ["auto-shutdown"],
  "schedule power off": ["auto-shutdown"],
  "pc turn off": ["auto-shutdown"],
  "power off timer": ["auto-shutdown"],

  // === BACKUP ===
  "system restore": ["auto-backup"],
  "file backup": ["auto-backup"],
  "backup settings": ["auto-backup"],
  "data backup": ["auto-backup"],
  "restore files": ["auto-backup"],
  "restore system": ["auto-backup"],
  "file history": ["auto-backup"],
  "backup drive": ["auto-backup"],
  "windows backup": ["auto-backup"],
  "backup computer": ["auto-backup"],
  "backup data": ["auto-backup"],

  // === PARENTAL ===
  "child account": ["parental-controls"],
  "child lock": ["parental-controls"],
  "kid safe": ["parental-controls"],
  "content filter": ["parental-controls"],
  "web filter": ["parental-controls"],
  "limit screen time": ["parental-controls"],
  "restrict content": ["parental-controls"],
  "child protection": ["parental-controls"],
  "parental settings": ["parental-controls"],
  "family settings": ["parental-controls"],
  "limit usage": ["parental-controls"],

  // === STARTUP ===
  "startup programs": ["startup-manager"],
  "disable startup": ["startup-manager"],
  "startup items": ["startup-manager"],
  "boot programs": ["startup-manager"],
  "startup settings": ["startup-manager"],
  "task manager startup": ["startup-manager"],
  "startup slow": ["startup-manager", "slow-pc-fix"],

  // === TASKBAR ===
  "taskbar settings": ["taskbar-customizer"],
  "taskbar icons": ["taskbar-customizer"],
  "customize taskbar": ["taskbar-customizer"],
  "taskbar color": ["taskbar-customizer"],
  "taskbar transparent": ["taskbar-customizer"],
  "start menu settings": ["taskbar-customizer"],
  "taskbar not working": ["taskbar-customizer"],

  // === DARK MODE ===
  "dark theme": ["dark-mode-setup"],
  "light theme": ["dark-mode-setup"],
  "windows theme": ["dark-mode-setup"],
  "color scheme": ["dark-mode-setup"],
  "system theme": ["dark-mode-setup"],
  "appearance settings": ["dark-mode-setup"],
  "dark mode windows": ["dark-mode-setup"],

  // === NEW PC ===
  "setup pc": ["new-pc-setup"],
  "first time": ["new-pc-setup"],
  "initial setup": ["new-pc-setup"],
  "pc setup": ["new-pc-setup"],
  "configure windows": ["new-pc-setup"],
  "windows setup": ["new-pc-setup"],
  "out of box": ["new-pc-setup"],
  "new laptop": ["new-pc-setup"],
  "just got": ["new-pc-setup"],

  // === DEV ENVIRONMENT ===
  "code editor": ["dev-environment"],
  "visual studio": ["dev-environment"],
  "development tools": ["dev-environment"],
  "dev setup": ["dev-environment"],
  "developer tools": ["dev-environment"],
  "coding environment": ["dev-environment"],
  "programming tools": ["dev-environment"],

  // === WINGET ===
  "package manager": ["winget-installer"],
  "install applications": ["winget-installer"],
  "bulk software": ["winget-installer"],
  "automated install": ["winget-installer"],
  "winget command": ["winget-installer"],
  "install many": ["winget-installer"],

  // === MAINTENANCE ===
  "system clean": ["monthly-maintenance"],
  "pc maintenance": ["monthly-maintenance"],
  "computer maintenance": ["monthly-maintenance"],
  "windows clean": ["monthly-maintenance"],
  "optimize system": ["monthly-maintenance"],
  "health check": ["monthly-maintenance"],
  "system health": ["monthly-maintenance"],
  "pc cleanup": ["monthly-maintenance"],
  "clean pc": ["monthly-maintenance"],

  // === SSD ===
  "ssd health": ["ssd-optimizer"],
  "ssd optimization": ["ssd-optimizer"],
  "trim drive": ["ssd-optimizer"],
  "optimize disk": ["ssd-optimizer"],
  "drive optimizer": ["ssd-optimizer"],
  "ssd speed": ["ssd-optimizer"],
  "drive optimization": ["ssd-optimizer"],

  // === SINGLE-WORD ADDITIONS ===
  "repair": ["corrupted-files-fix", "troubleshooter-runner"],
  "glitch": ["display-resolution-fix", "audio-fix"],
  "glitchy": ["display-resolution-fix", "audio-fix"],
  "broken": ["troubleshooter-runner", "driver-manager"],
  "settings": ["display-resolution-fix", "taskbar-customizer", "dark-mode-setup"],
  "respond": ["slow-pc-fix"],
  "responding": ["slow-pc-fix"],
  "connect": ["wifi-network-fixer", "bluetooth-fix"],
  "connecting": ["wifi-network-fixer", "bluetooth-fix"],
  "setup": ["new-pc-setup", "winget-installer"],
  "configure": ["new-pc-setup"],
  "offline": ["printer-fix", "wifi-network-fixer"],
  "disconnect": ["wifi-network-fixer", "bluetooth-fix"],
  "disconnected": ["wifi-network-fixer", "bluetooth-fix"],
  "enable": ["troubleshooter-runner"],
  "disable": ["startup-manager", "privacy-protector"],

  // === MICROSOFT STORE ===
  "store": ["store-fix"],
  "microsoft store": ["store-fix"],
  "store not working": ["store-fix"],
  "store won't open": ["store-fix"],
  "store stuck": ["store-fix"],
  "store error": ["store-fix"],
  "can't open store": ["store-fix"],
  "store not loading": ["store-fix"],
  "apps won't download": ["store-fix"],
  "apps won't install": ["store-fix"],
  "store crashing": ["store-fix"],
  "microsoft store problem": ["store-fix"],

  // === NETWORK STACK RESET ===
  "winsock": ["network-stack-reset"],
  "dns": ["network-stack-reset"],
  "reset network": ["network-stack-reset"],
  "network stack": ["network-stack-reset"],
  "flush dns": ["network-stack-reset"],
  "reset winsock": ["network-stack-reset"],
  "reset tcp ip": ["network-stack-reset"],
  "tcp ip": ["network-stack-reset"],
  "ipconfig": ["network-stack-reset"],
  "internet not working": ["network-stack-reset"],
  "no internet connection": ["network-stack-reset"],
  "dns problem": ["network-stack-reset"],
  "dns error": ["network-stack-reset"],
  "ip address": ["network-stack-reset"],
  "release ip": ["network-stack-reset"],
  "renew ip": ["network-stack-reset"],

  // === WINDOWS ACTIVATION ===
  "activate": ["activation-fix"],
  "activation": ["activation-fix"],
  "license": ["activation-fix"],
  "product key": ["activation-fix"],
  "activate windows": ["activation-fix"],
  "windows activation": ["activation-fix"],
  "activation error": ["activation-fix"],
  "windows not activated": ["activation-fix"],
  "activate watermark": ["activation-fix"],
  "windows license": ["activation-fix"],
  "genuine windows": ["activation-fix"],
  "activation failed": ["activation-fix"],
  "product key error": ["activation-fix"],
  "slmgr": ["activation-fix"],

  // === KEYBOARD & MOUSE ===
  "keyboard": ["keyboard-mouse-fix"],
  "mouse": ["keyboard-mouse-fix"],
  "touchpad": ["keyboard-mouse-fix"],
  "touch pad": ["keyboard-mouse-fix"],
  "keyboard not working": ["keyboard-mouse-fix"],
  "mouse not working": ["keyboard-mouse-fix"],
  "keyboard not typing": ["keyboard-mouse-fix"],
  "mouse not clicking": ["keyboard-mouse-fix"],
  "mouse cursor": ["keyboard-mouse-fix"],
  "keyboard stuck": ["keyboard-mouse-fix"],
  "mouse freeze": ["keyboard-mouse-fix"],
  "key not working": ["keyboard-mouse-fix"],
  "sticky keys": ["keyboard-mouse-fix", "system-tweaks"],
  "input device": ["keyboard-mouse-fix"],
  "hid device": ["keyboard-mouse-fix"],

  // === CAMERA & WEBCAM ===
  "camera": ["camera-fix"],
  "webcam": ["camera-fix"],
  "camera not working": ["camera-fix"],
  "webcam not working": ["camera-fix"],
  "camera not detected": ["camera-fix"],
  "no camera": ["camera-fix"],
  "camera black screen": ["camera-fix"],
  "webcam black screen": ["camera-fix"],
  "camera problem": ["camera-fix"],
  "webcam problem": ["camera-fix"],
  "video camera": ["camera-fix"],
  "camera not found": ["camera-fix"],

  // === CONTEXT MENU ===
  "right click": ["context-menu-cleaner"],
  "context menu": ["context-menu-cleaner"],
  "right click menu": ["context-menu-cleaner"],
  "context menu slow": ["context-menu-cleaner"],
  "right click slow": ["context-menu-cleaner"],
  "right click delay": ["context-menu-cleaner"],
  "shell extension": ["context-menu-cleaner"],
  "send to menu": ["context-menu-cleaner"],
  "menu too many": ["context-menu-cleaner"],
  "right click not working": ["context-menu-cleaner"],

  // === RUNTIME INSTALLER ===
  "runtime": ["runtime-installer"],
  "redistributable": ["runtime-installer"],
  "directx": ["runtime-installer"],
  "vc redist": ["runtime-installer"],
  "vc++": ["runtime-installer"],
  "visual c++": ["runtime-installer"],
  ".net": ["runtime-installer"],
  "dotnet": ["runtime-installer"],
  "net runtime": ["runtime-installer"],
  "missing dll": ["runtime-installer"],
  "dll error": ["runtime-installer"],
  "dll missing": ["runtime-installer"],
  "install runtime": ["runtime-installer"],
  "windows runtime": ["runtime-installer"],
  "msvc": ["runtime-installer"],

  // === FONT CACHE ===
  "font": ["font-cache-fix"],
  "fonts": ["font-cache-fix"],
  "font cache": ["font-cache-fix"],
  "missing font": ["font-cache-fix"],
  "fonts missing": ["font-cache-fix"],
  "font corrupt": ["font-cache-fix"],
  "square characters": ["font-cache-fix"],
  "font problem": ["font-cache-fix"],
  "text display": ["font-cache-fix"],
  "character missing": ["font-cache-fix"],
  "square boxes": ["font-cache-fix"],
  "glyph missing": ["font-cache-fix"],

  // === WINDOWS HELLO ===
  "hello": ["windows-hello-fix"],
  "biometric": ["windows-hello-fix"],
  "fingerprint": ["windows-hello-fix"],
  "pin": ["windows-hello-fix"],
  "win hello": ["windows-hello-fix"],
  "windows hello": ["windows-hello-fix"],
  "hello not working": ["windows-hello-fix"],
  "fingerprint not working": ["windows-hello-fix"],
  "pin not working": ["windows-hello-fix"],
  "pin sign in": ["windows-hello-fix"],
  "face unlock": ["windows-hello-fix"],
  "facial recognition": ["windows-hello-fix"],
  "iris scanner": ["windows-hello-fix"],
  "tpm": ["windows-hello-fix"],
  "hello problem": ["windows-hello-fix"],

  // === DATE & TIME FORMAT ===
  "region": ["date-time-format-fix"],
  "locale": ["date-time-format-fix"],
  "date format": ["date-time-format-fix"],
  "time format": ["date-time-format-fix"],
  "regional settings": ["date-time-format-fix"],
  "date wrong": ["date-time-format-fix"],
  "wrong date format": ["date-time-format-fix"],
  "wrong time format": ["date-time-format-fix"],
  "12 hour": ["date-time-format-fix"],
  "24 hour": ["date-time-format-fix"],
  "first day of week": ["date-time-format-fix"],
  "calendar week": ["date-time-format-fix"],
  "time wrong": ["date-time-format-fix"],

  // === WINDOWS APPS REPAIR ===
  "appx": ["windows-apps-repair"],
  "built in app": ["windows-apps-repair"],
  "windows app": ["windows-apps-repair"],
  "calculator": ["windows-apps-repair"],
  "photos": ["windows-apps-repair"],
  "mail app": ["windows-apps-repair"],
  "app not opening": ["windows-apps-repair"],
  "app crashing": ["windows-apps-repair"],
  "app won't open": ["windows-apps-repair"],
  "built in apps": ["windows-apps-repair"],
  "store app": ["windows-apps-repair"],
  "metro app": ["windows-apps-repair"],
  "microsoft app": ["windows-apps-repair"],
  "reinstall app": ["windows-apps-repair"],
  "reset app": ["windows-apps-repair"],

  // === FILE ASSOCIATION ===
  "file association": ["file-association-guardian"],
  "default program": ["file-association-guardian"],
  "default app": ["file-association-guardian"],
  "open with": ["file-association-guardian"],
  "file type": ["file-association-guardian"],
  "file extension": ["file-association-guardian"],
  "file hijack": ["file-association-guardian"],
  "pdf opens": ["file-association-guardian"],
  "html opens": ["file-association-guardian"],
  "program association": ["file-association-guardian"],
  "extension hijack": ["file-association-guardian"],
  "reset file type": ["file-association-guardian"],

  // === SYSTEM TWEAKS ===
  "hidden files": ["system-tweaks"],
  "show hidden": ["system-tweaks"],
  "file extensions": ["system-tweaks"],
  "extensions": ["system-tweaks"],
  "full path": ["system-tweaks"],
  "title bar": ["system-tweaks"],
  "explorer path": ["system-tweaks"],
  "this pc": ["system-tweaks"],
  "quick access": ["system-tweaks"],
  "animations": ["system-tweaks"],
  "minimize animation": ["system-tweaks"],
  "maximize animation": ["system-tweaks"],
  "transparency": ["system-tweaks"],
  "acrylic": ["system-tweaks"],
  "filter keys": ["system-tweaks"],
  "toggle keys": ["system-tweaks"],
  "accessibility popup": ["system-tweaks"],
  "press one key": ["system-tweaks"],
  "search highlights": ["system-tweaks"],
  "bing ads": ["system-tweaks"],
  "trending search": ["system-tweaks"],
  "startup sound": ["system-tweaks"],
  "boot sound": ["system-tweaks"],
  "game bar": ["system-tweaks"],
  "xbox record": ["system-tweaks"],
  "onedrive": ["system-tweaks"],
  "lock screen": ["system-tweaks"],
  "login screen": ["system-tweaks"],
  "copilot": ["system-tweaks"],
  "copilot button": ["system-tweaks"],
  "widgets": ["system-tweaks"],
  "widgets button": ["system-tweaks"],
  "weather widget": ["system-tweaks"],
  "news widget": ["system-tweaks"],
  "taskbar widget": ["system-tweaks"],
  "tweak": ["system-tweaks"],
  "tweaks": ["system-tweaks"],
  "power user": ["system-tweaks"],
  "customize windows": ["system-tweaks"],
  "windows customization": ["system-tweaks"],
  "system tweak": ["system-tweaks"],
  "windows tweak": ["system-tweaks"],
  "disable animation": ["system-tweaks"],
  "disable transparency": ["system-tweaks"],
  "disable cortana": ["system-tweaks"],
  "disable copilot": ["system-tweaks"],
  "disable widgets": ["system-tweaks"],
  "disable onedrive": ["system-tweaks"],
  "disable lock screen": ["system-tweaks"],
  "disable game bar": ["system-tweaks"],
  "disable sticky keys": ["system-tweaks"],
  "disable startup sound": ["system-tweaks"],
  "disable search highlights": ["system-tweaks"],
  "no lock screen": ["system-tweaks"],
  "remove copilot": ["system-tweaks"],
  "remove widgets": ["system-tweaks"],
  "remove cortana": ["system-tweaks"],
  "remove onedrive": ["system-tweaks"],
  "remove animation": ["system-tweaks"],
  "show file extensions": ["system-tweaks"],
  "show hidden files": ["system-tweaks"],
  "open to this pc": ["system-tweaks"],
  "explorer opens to": ["system-tweaks"],
}

const STOP_WORDS = new Set([
  "my", "the", "a", "an", "is", "are", "was", "were", "it", "its", "i",
  "me", "we", "us", "our", "am", "been", "being", "have", "has", "had",
  "do", "does", "did", "will", "would", "shall", "should", "may", "might",
  "can", "could", "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "that", "this", "these", "those", "and", "or", "but", "not", "no", "so",
  "if", "then", "than", "too", "very", "just", "about", "also", "really",
  "keeps", "keep", "getting", "got", "always", "still", "very", "quite",
  "some", "any", "all", "each", "every", "much", "more", "most",
  "pc", "computer", "laptop", "desktop", "please", "help",
  "fix", "issue", "problem", "error", "not", "wont", "cant", "dont",
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
}

// Levenshtein distance for fuzzy matching (handles typos/misspellings)
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
        dp[j] + 1,
        dp[j - 1] + 1
      )
      prev = tmp
    }
  }
  return dp[n]
}

function fuzzyMatchKeyword(token: string, keyword: string): boolean {
  if (token === keyword) return true
  // Only fuzzy match on keywords that are single words (no spaces)
  if (keyword.includes(" ")) return false
  // Don't fuzzy match very short tokens (too many false positives)
  if (token.length < 4 || keyword.length < 4) return false
  const maxDist = token.length >= 7 || keyword.length >= 7 ? 2 : 1
  return levenshtein(token, keyword) <= maxDist
}

function containsAllTokens(text: string, phrase: string): boolean {
  const lower = text.toLowerCase()
  return tokenize(phrase).every((t) => lower.includes(t))
}

export function suggestTools(problem: string): ToolSuggestion[] {
  const tokens = tokenize(problem)
  if (tokens.length === 0) return []

  const slugScores = new Map<string, number>()
  const matchedSingleKeywords = new Set<string>() // track exact-matched single-word keywords

  for (const [keyword, slugs] of Object.entries(KEYWORD_TO_SLUG)) {
    if (containsAllTokens(problem, keyword)) {
      const increment = keyword.includes(" ") ? 3 : 1
      for (const slug of slugs) {
        slugScores.set(slug, (slugScores.get(slug) ?? 0) + increment)
      }
      if (!keyword.includes(" ")) matchedSingleKeywords.add(keyword)
    }
  }

  // Fuzzy match: for each problem token, try to match against unmatched single-word keywords
  for (const token of tokens) {
    for (const [keyword, slugs] of Object.entries(KEYWORD_TO_SLUG)) {
      if (keyword.includes(" ")) continue // skip multi-word keywords
      if (matchedSingleKeywords.has(keyword)) continue // already matched
      if (fuzzyMatchKeyword(token, keyword)) {
        for (const slug of slugs) {
          slugScores.set(slug, (slugScores.get(slug) ?? 0) + 1)
        }
      }
    }
  }

  // Boost for exact match with tool title
  const allSlugs = getAllToolSlugs()
  for (const slug of allSlugs) {
    const titleWords = slug.replace(/-/g, " ")
    const kwTokens = tokenize(titleWords)
    const matchCount = kwTokens.filter((t) => tokens.includes(t)).length
    if (matchCount > 0) {
      slugScores.set(slug, (slugScores.get(slug) ?? 0) + matchCount)
    }
  }

  return [...slugScores.entries()]
    .map(([slug, score]) => ({ slug, confidence: Math.min(1, score / 5) }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
}
