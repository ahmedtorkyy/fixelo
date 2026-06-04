# Fixelo — Tool Script Issues & Fix Guide (`src/lib/cache/toolBlocks.ts`)

For the developer. The tool scripts are **safe overall** (no destructive disk/format commands, registry changes are reversible, services get restored, everything logs). But correctness is uneven: several blocks use a WMI method that doesn't exist, a few do nothing despite their label, and **two tools can disable input/display devices**. Fix these before selling the tools to the audience.

There are 26 tools / 149 blocks. This guide gives (1) global fixes to apply everywhere, (2) the specific broken blocks I found, (3) two real hazards, (4) a recovery caveat, and (5) a test plan. I could not run these — my environment is Linux — so all of this must be verified on a real Windows machine or VM.

---

## 1. Global fixes (apply to every block)

### 1a. `.Enable()` / `.Disable()` on `Win32_PnPEntity` does NOT work — replace it
13 blocks call `$device.Enable()` / `$device.Disable()` on objects from `Get-WmiObject Win32_PnPEntity`. `Win32_PnPEntity` has **no such methods** — these throw "method not found" at runtime. (Note: `Win32_NetworkAdapter.Enable()/Disable()` DO exist, so the WiFi adapter block is fine — leave it.)

Replace the PnPEntity pattern with the real `PnpDevice` cmdlets:

```powershell
# WRONG (current):
$devs = Get-WmiObject Win32_PnPEntity | Where-Object { $_.Name -match "Bluetooth" -and $_.ConfigManagerErrorCode -eq 0 }
foreach ($d in $devs) { $d.Disable() | Out-Null }

# CORRECT (Windows 8+, requires admin):
$devs = Get-PnpDevice -FriendlyName "*Bluetooth*" -Status OK -ErrorAction SilentlyContinue
foreach ($d in $devs) {
  Disable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
}
# To re-enable: Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue
```

For undo, capture the InstanceIds you disabled (log them) so the undo can re-enable exactly those.

### 1b. Wrap every block in try/catch
There is **no try/catch in any of the 149 blocks**. Because blocks are concatenated into one script, a single throwing line (like the `.Enable()` calls above) aborts everything after it. Wrap each block body:

```powershell
try {
  # ... the block's work ...
} catch {
  Write-Log "Error: $($_.Exception.Message)" "Red"
}
```

### 1c. Verify after changing, then log the truth
Only 3 of 149 blocks verify their change — the rest log "X done" whether or not it worked. This breaks your own safety rule #13 AND your "paste the log for a smarter fix #2" feature (the log lies). Pattern:

```powershell
Set-ItemProperty -Path $p -Name $n -Value 0 -Type DWord
$check = (Get-ItemProperty -Path $p -Name $n -ErrorAction SilentlyContinue).$n
if ($check -eq 0) { Write-Log "Verified: setting applied" "Green" }
else { Write-Log "Could not verify: setting not applied" "Yellow" }
```

---

## 2. Specific broken / no-op blocks

### `audio-fix` (weakest tool — several blocks don't do what they claim)
- **`reinstall-driver`** — calls `$device.Enable()` on `Win32_PnPEntity` (invalid, see 1a). Label says "removes and reinstalls" but the code only tries to enable. Fix with `Disable-PnpDevice`/`Enable-PnpDevice`, or relabel to "Restart audio device."
- **`disable-enhancements`** — writes to `HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Audio\Effects\Disable`, which is **not a real Windows setting**, so it does nothing. Real audio enhancements live per-endpoint under `HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\MMDevices\Audio\Render\{guid}\FxProperties`. Implement correctly or remove the option.
- **`set-default`** — uses `WMPlayer.OCX`, which controls Windows Media Player, **not the system default device**. There is no built-in cmdlet for default playback device. Either open Sound settings for the user (`rundll32.exe shell32.dll,Control_RunDLL mmsys.cpl,,0`) and guide them, or remove this option.
- **`reset-volume`** — also `WMPlayer.OCX`; sets WMP's volume, not system volume. Same fix as above or remove.
- **`reregister-dll`** — `regsvr32` is run on `audiosrv.dll`, `ksuser.dll`, `wdmaud.drv`, which are **not COM-registerable**, so they silently no-op (only `mmdevapi.dll` is valid). Trim the list or accept it's partly cosmetic.

### `battery-optimizer`
- **`disable-bluetooth`** — `.Disable()`/`.Enable()` on `Win32_PnPEntity` (invalid, see 1a). Fix with PnpDevice cmdlets.

### `display-resolution-fix`
- **`reinstall-gpu`** — `.Enable()` on `Win32_PnPEntity` (invalid). Label misleading. Fix or relabel.
- **`reset-color`** — `Remove-Item "HKCU:\...\ICM\*" -Recurse -Force` wipes color-management registry and the block itself says it can't be undone. Consider exporting the keys to a `.reg` backup first.

### `usb-device-fix`
- **`reset-controllers`, `reinstall-drivers`, `reinstall-hubs`** — all use `.Disable()`/`.Enable()` on `Win32_PnPEntity` (invalid). See hazard #3 below — these need more than a cmdlet swap.
- **`power-management`** — writes `PowerManagementEnabled` under `Enum\...\Device Parameters`; that isn't the standard value name, so it likely has no effect (it is at least guarded and has a real undo). Verify the correct key on a test machine.

---

## 3. Two real hazards (treat as high priority)

### 3a. USB: disabling controllers / root hubs can kill the keyboard and mouse
`usb-device-fix` → `reset-controllers` and `reinstall-hubs` disable USB controllers and root hubs. On a desktop with a USB keyboard/mouse, **disabling these mid-script can leave the user with no input** until reboot. Even once the `.Enable()` calls are fixed to real cmdlets, this is dangerous. Recommendation: do **not** disable USB controllers/hubs. Replace with a safe rescan: `pnputil /scan-devices` (re-enumerates devices without disabling input), or restart only the specific non-input device the user is troubleshooting.

### 3b. Display: disabling the GPU can black-screen the machine
`display-resolution-fix` → `detect-monitors` disables and re-enables the display adapter. Disabling the active GPU can cause a black screen with no easy recovery. Replace with a non-destructive redetect (e.g. `pnputil /scan-devices`, or just open `ms-settings:display`); never disable the active display adapter.

---

## 4. Recovery caveat — diff against your working copy
`toolBlocks.ts` reached me corrupted with null bytes and I recovered it by stripping them. It compiles cleanly, so the structure is intact, but if any null had overwritten a real character, a single line could be subtly wrong. **Please diff this file against your own working copy** (or just read each block once) before trusting it.

---

## 5. Test plan (on a Windows VM — use a snapshot you can roll back)

Test in this order. For each: run the fix, open `Fixelo_Log.txt` on the Desktop, confirm the change actually happened (not just a "done" line), then run the Undo and confirm it reverted.

1. **Expected to work — test first:** `startup-manager`, `wifi-network-fixer`, `slow-pc-fix`, `privacy-protector`, `windows-update-fixer`, `monthly-maintenance`, `network-optimizer`.
2. **Expected to fail / no-op — fix then retest:** `audio-fix`, `display-resolution-fix`, `usb-device-fix`, `battery-optimizer` (bluetooth), `printer-fix` (audit its `regsvr32` block), `driver-manager`.
3. **Audit the ones not covered above** for the same three global issues (PnPEntity methods, missing try/catch, missing verify): `corrupted-files-fix`, `disk-error-fix`, `ssd-optimizer`, `blue-screen-recovery`, `new-pc-setup`, `winget-installer`, `dev-environment`, `dark-mode-setup`, `taskbar-customizer`, `parental-controls`, `auto-shutdown`, `auto-backup`, `gaming-boost`.

Always run on a VM with a snapshot first — the device tools in particular can require a reboot to recover if something goes wrong.
