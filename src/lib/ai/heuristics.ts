import { AnalyzeRequest, FixItResponse, SupportedOS } from "@/types";
import { inspectCommandSafety } from "./safety";

interface ErrorPattern {
  name: string;
  technology: string;
  match: (error: string) => boolean;
  generate: (req: AnalyzeRequest) => FixItResponse;
}

function getPkgManager(os?: SupportedOS): { install: string; check: string; name: string } {
  switch (os) {
    case "Fedora":
      return { install: "sudo dnf install -y", check: "dnf list installed", name: "dnf" };
    case "Arch":
      return { install: "sudo pacman -S --needed", check: "pacman -Q", name: "pacman" };
    case "Debian":
    case "Ubuntu":
    default:
      return { install: "sudo apt-get install -y", check: "dpkg -l", name: "apt" };
  }
}

export const ERROR_PATTERNS: ErrorPattern[] = [
  {
    name: "Apt Lock Held",
    technology: "Debian/Ubuntu APT",
    match: (err) => /Could not get lock|Unable to acquire the dpkg frontend lock|is another process using it/i.test(err),
    generate: () => ({
      summary: "APT package manager cannot acquire lock because another process or background updater (unattended-upgrades) is using dpkg.",
      cause: "Debian and Ubuntu lock the package database to prevent concurrent write operations. Another apt, dpkg, or automated software update task is currently running.",
      fix: "Check for active apt or unattended-upgrades processes. If a previous installation crashed, clean up the stale lock files safely after verifying no process is active.",
      technology: "APT / dpkg",
      commands: [
        inspectCommandSafety({
          command: "ps aux | grep -i '[a]pt\\|[d]pkg'",
          explanation: "Non-destructive diagnostic: identify any currently running package management processes.",
        }),
        inspectCommandSafety({
          command: "sudo fuser -vki -TERM /var/lib/dpkg/lock /var/lib/dpkg/lock-frontend",
          explanation: "Interactively request running processes holding the dpkg lock to terminate gracefully.",
        }),
        inspectCommandSafety({
          command: "sudo dpkg --configure -a",
          explanation: "Repair and configure any partially installed packages left from an interrupted transaction.",
        }),
      ],
      nextSteps: [
        "Wait 1-2 minutes if an automated unattended-upgrade is in progress.",
        "Ensure no software center or GUI update utility is open in the background.",
        "Re-run your original apt command once the lock is released.",
      ],
      confidence: "high",
    }),
  },
  {
    name: "Pacman DB Lock",
    technology: "Arch Linux Pacman",
    match: (err) => /db\.lck|failed to init transaction \(unable to lock database\)/i.test(err),
    generate: () => ({
      summary: "Pacman database is locked by another instance or a leftover `/var/lib/pacman/db.lck` file.",
      cause: "Pacman creates `/var/lib/pacman/db.lck` during transactions. If a previous pacman command was interrupted or aborted (Ctrl+C, crash, reboot), the lock file remains.",
      fix: "Verify no pacman process is currently executing, then remove the stale lock file safely.",
      technology: "Arch Linux / Pacman",
      commands: [
        inspectCommandSafety({
          command: "pgrep -l pacman",
          explanation: "Diagnostic: Verify whether any pacman process is actually running.",
        }),
        inspectCommandSafety({
          command: "sudo rm /var/lib/pacman/db.lck",
          explanation: "Remove the lock file once you have confirmed no pacman process is running.",
          isDangerous: false,
        }),
        inspectCommandSafety({
          command: "sudo pacman -Syu",
          explanation: "Synchronize repository databases and resume full system update.",
        }),
      ],
      nextSteps: [
        "If packages are corrupted due to interrupted downloads, run `sudo pacman -Sc` to clean package cache.",
        "Avoid terminating pacman mid-transaction with SIGKILL.",
      ],
      confidence: "high",
    }),
  },
  {
    name: "Docker Socket Permission Denied",
    technology: "Docker",
    match: (err) => /permission denied while trying to connect to the Docker daemon socket/i.test(err) || /got permission denied.*\/var\/run\/docker\.sock/i.test(err),
    generate: () => ({
      summary: "User account lacks permission to communicate with the Docker daemon UNIX socket at `/var/run/docker.sock`.",
      cause: "By default, the Docker daemon socket is owned by `root:docker`. Non-root users must belong to the `docker` group to interact with the daemon without `sudo`.",
      fix: "Add your current user account to the `docker` group and refresh your group membership.",
      technology: "Docker",
      commands: [
        inspectCommandSafety({
          command: "sudo usermod -aG docker $USER",
          explanation: "Add the current active user to the docker supplementary group.",
        }),
        inspectCommandSafety({
          command: "newgrp docker",
          explanation: "Activate the new group membership in the current shell session without logging out.",
        }),
        inspectCommandSafety({
          command: "docker run hello-world",
          explanation: "Verify Docker engine connectivity and permissions.",
        }),
      ],
      nextSteps: [
        "If using a desktop environment (GNOME, KDE), log out and log back in for system-wide effect across all terminals.",
        "Verify the Docker service is running with `sudo systemctl status docker`.",
      ],
      confidence: "high",
    }),
  },
  {
    name: "Port Already In Use (EADDRINUSE)",
    technology: "Networking / Linux Sockets",
    match: (err) => /EADDRINUSE|address already in use|bind: address already in use/i.test(err),
    generate: (req) => {
      const portMatch = req.errorText.match(/:\s*(\d{2,5})\b|port\s*(\d{2,5})\b/i);
      const port = portMatch ? portMatch[1] || portMatch[2] : "3000";
      return {
        summary: `Network socket binding failed because port ${port} is already being used by another process.`,
        cause: `Another application, zombie background server, or previously crashed instance is still bound to TCP port ${port}.`,
        fix: `Identify the PID occupying port ${port} and terminate it cleanly or reconfigure your app to use a different port.`,
        technology: "Linux Networking",
        commands: [
          inspectCommandSafety({
            command: `ss -tulpn | grep :${port}`,
            explanation: `Diagnostic: List the exact process name and PID listening on port ${port}.`,
          }),
          inspectCommandSafety({
            command: `lsof -i :${port}`,
            explanation: `Alternative diagnostic: Show open network files and command name for port ${port}.`,
          }),
          inspectCommandSafety({
            command: `fuser -k -TERM ${port}/tcp`,
            explanation: `Gracefully send SIGTERM to the process listening on port ${port}.`,
          }),
        ],
        nextSteps: [
          `Specify an alternative port (e.g. PORT=${Number(port) + 1}) if the occupying process is a necessary service.`,
          "Ensure dev servers are stopped with Ctrl+C rather than suspending terminal jobs with Ctrl+Z.",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "Git Merge Conflict or Overwritten Changes",
    technology: "Git",
    match: (err) => /CONFLICT \(content\)|fatal: refusing to merge unrelated histories|Your local changes to the following files would be overwritten by merge|Automatic merge failed/i.test(err),
    generate: () => ({
      summary: "Git detected conflicting changes between branches or working tree modifications that would be overwritten.",
      cause: "The incoming branch touches the same lines of code that were modified locally, or uncommitted local edits collide with incoming commits.",
      fix: "Inspect conflicting files with `git status`, resolve or stash local modifications, and complete the merge cleanly.",
      technology: "Git",
      commands: [
        inspectCommandSafety({
          command: "git status",
          explanation: "Diagnostic: Check which files are currently in conflict or unmerged.",
        }),
        inspectCommandSafety({
          command: "git diff --name-only --diff-filter=U",
          explanation: "Diagnostic: List all filenames with unresolved merge conflict markers.",
        }),
        inspectCommandSafety({
          command: "git stash",
          explanation: "Safely save uncommitted local changes to the stash stack before pulling.",
        }),
        inspectCommandSafety({
          command: "git merge --abort",
          explanation: "Safely abort the in-progress merge and return to the pre-merge branch state.",
        }),
      ],
      nextSteps: [
        "Open the conflicting files and resolve the `<<<<<<<`, `=======`, and `>>>>>>>` markers.",
        "After editing conflicts, run `git add <resolved-files>` and `git commit`.",
      ],
      confidence: "high",
    }),
  },
  {
    name: "Out of Memory (OOM) / Heap Limit Exceeded",
    technology: "Memory / Resource Limits",
    match: (err) => /JavaScript heap out of memory|Out of memory: Killed process|CUDA out of memory|Fatal error: Allowed memory size of|std::bad_alloc/i.test(err),
    generate: () => ({
      summary: "The application or system ran out of allocated memory and was terminated by the OOM killer or runtime heap manager.",
      cause: "Process memory consumption exceeded available RAM, swap space, or the language runtime's default maximum memory heap limit.",
      fix: "Inspect memory consumption, increase runtime memory limits (e.g., Node's `--max-old-space-size`), or configure swap space.",
      technology: "System Resources",
      commands: [
        inspectCommandSafety({
          command: "free -h && swapon --show",
          explanation: "Diagnostic: Check total, used, available physical RAM and active swap partitions.",
        }),
        inspectCommandSafety({
          command: "ps --sort=-%mem -eo pid,ppid,cmd,%mem,%cpu | head -n 10",
          explanation: "Diagnostic: List the top 10 memory-consuming processes on the machine.",
        }),
        inspectCommandSafety({
          command: "export NODE_OPTIONS=\"--max-old-space-size=4096\"",
          explanation: "Allocate up to 4GB heap memory for Node.js builds and processes.",
        }),
      ],
      nextSteps: [
        "If running on a VPS with 1GB-2GB RAM, create a 2GB-4GB swapfile (`sudo fallocate -l 2G /swapfile`).",
        "Profile your application for unbounded memory leaks or large unstreamed file buffers.",
      ],
      confidence: "high",
    }),
  },
  {
    name: "Out of Disk Space / No Space Left on Device (ENOSPC)",
    technology: "Linux Storage / Filesystem",
    match: (err) => /No space left on device|ENOSPC: no space left on device|write \/dev\/[a-z0-9]+: no space left on device/i.test(err),
    generate: (req) => {
      const pkg = getPkgManager(req.os);
      return {
        summary: "Filesystem write failed because the target partition is full or inode capacity is exhausted.",
        cause: "The disk partition has 0 available blocks, or all available inode numbers are exhausted by millions of tiny files.",
        fix: "Inspect disk usage across mounts and clean package manager caches and systemd journal logs safely.",
        technology: "Filesystem",
        commands: [
          inspectCommandSafety({
            command: "df -h",
            explanation: "Diagnostic: View disk usage and percent full for all mounted partitions.",
          }),
          inspectCommandSafety({
            command: "df -i",
            explanation: "Diagnostic: Check inode usage (if df -h shows free space, inodes might be 100% full).",
          }),
          inspectCommandSafety({
            command: "sudo journalctl --vacuum-time=3d",
            explanation: "Safely truncate systemd journal logs older than 3 days to free disk space.",
          }),
          inspectCommandSafety({
            command: req.os === "Fedora"
              ? "sudo dnf clean all"
              : req.os === "Arch"
              ? "sudo pacman -Sc"
              : "sudo apt-get clean && sudo apt-get autoremove -y",
            explanation: `Clean cached package downloads with ${pkg.name}.`,
          }),
        ],
        nextSteps: [
          "Use `sudo ncdu /` or `sudo du -ahx / | sort -rh | head -n 20` to locate large culprit directories.",
          "Check Docker image/volume usage with `docker system df`.",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "DNS Resolution / Network Hostname Failure",
    technology: "DNS / Networking",
    match: (err) => /getaddrinfo ENOTFOUND|Could not resolve host|Temporary failure in name resolution|Name or service not known/i.test(err),
    generate: () => ({
      summary: "Domain name resolution (DNS) failed to resolve the hostname to an IP address.",
      cause: "DNS server misconfiguration, disconnected network interface, firewall drop, or incorrect target URL/domain name.",
      fix: "Verify local DNS resolver status and check internet connectivity via raw IP ping.",
      technology: "DNS / Networking",
      commands: [
        inspectCommandSafety({
          command: "cat /etc/resolv.conf",
          explanation: "Diagnostic: Check configured nameserver addresses for the system.",
        }),
        inspectCommandSafety({
          command: "resolvectl status 2>/dev/null || systemd-resolve --status 2>/dev/null || ip route show",
          explanation: "Diagnostic: View systemd-resolved DNS link status and default network gateway.",
        }),
        inspectCommandSafety({
          command: "ping -c 3 1.1.1.1",
          explanation: "Diagnostic: Ping Cloudflare public IP to verify raw internet connectivity without DNS.",
        }),
      ],
      nextSteps: [
        "If raw IP ping succeeds but domain names fail, add a fallback nameserver (`nameserver 1.1.1.1` or `8.8.8.8`).",
        "Restart networking with `sudo systemctl restart NetworkManager` or `systemd-resolved`.",
      ],
      confidence: "high",
    }),
  },
  {
    name: "SSL / TLS Certificate Expired or Verification Failed",
    technology: "SSL / TLS / Security",
    match: (err) => /certificate has expired|SSL: CERTIFICATE_VERIFY_FAILED|SEC_ERROR_EXPIRED_CERTIFICATE|certificate signed by unknown authority|UNABLE_TO_VERIFY_LEAF_SIGNATURE/i.test(err),
    generate: (req) => {
      const isRhel = req.os === "Fedora";
      const isArch = req.os === "Arch";
      return {
        summary: "TLS/SSL handshake failed because the remote certificate is expired, self-signed, or untrusted by system CA store.",
        cause: "System root certificate authorities are outdated, system clock is skewed into past/future, or an intercepting proxy/firewall is present.",
        fix: "Check system time synchronization and update root CA certificate bundles.",
        technology: "TLS / SSL",
        commands: [
          inspectCommandSafety({
            command: "timedatectl status",
            explanation: "Diagnostic: Verify system clock and NTP time synchronization status.",
          }),
          inspectCommandSafety({
            command: isRhel
              ? "sudo update-ca-trust"
              : isArch
              ? "sudo update-ca-trust"
              : "sudo update-ca-certificates --fresh",
            explanation: `Update system root CA certificates bundle for ${req.os || "Linux"}.`,
          }),
        ],
        nextSteps: [
          "If the clock is incorrect, run `sudo timedatectl set-ntp on`.",
          "Check the remote server certificate validity with `openssl s_client -connect <host>:443 -servername <host>`.",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "Permission Denied (EACCES / Linux File Permissions)",
    technology: "Linux Permissions",
    match: (err) => /EACCES: permission denied|Permission denied|Operation not permitted/i.test(err) && !/docker\.sock/i.test(err),
    generate: () => ({
      summary: "File or directory access was denied due to standard Linux POSIX file ownership or permissions mismatch.",
      cause: "The executing user lacks read, write, or execute permission for the target path, or the target is owned by root.",
      fix: "Inspect path ownership and grant user ownership or appropriate permissions without using insecure blanket overrides like `chmod 777`.",
      technology: "Linux Security",
      commands: [
        inspectCommandSafety({
          command: "ls -ld target_path_or_file",
          explanation: "Diagnostic: Check current owner, group, and permissions for the target file or folder.",
        }),
        inspectCommandSafety({
          command: "sudo chown -R $USER:$USER ./",
          explanation: "Reclaim ownership of the project folder for your current user.",
        }),
      ],
      nextSteps: [
        "Avoid running development package managers (npm, pip, cargo) with `sudo` directly in your workspace.",
        "Check if SELinux or AppArmor is enforcing restrictions if standard file permissions appear correct.",
      ],
      confidence: "medium",
    }),
  },
  {
    name: "Systemd Unit Failed or Not Found",
    technology: "systemd",
    match: (err) => /Failed to (start|restart|enable) [a-zA-Z0-9_\-.]+\.service|Unit [a-zA-Z0-9_\-.]+\.service not found|systemctl status/i.test(err),
    generate: (req) => {
      const unitMatch = req.errorText.match(/([a-zA-Z0-9_\-]+\.service)/i);
      const unit = unitMatch ? unitMatch[1] : "<service-name>.service";
      return {
        summary: `systemd service unit ${unit} failed to start or configuration is missing/inactive.`,
        cause: `The service process exited with an error code, encountered missing dependencies or invalid environment variables, or the unit file has not been loaded.`,
        fix: `Inspect unit status and recent journalctl execution logs to pinpoint the exact failure reason.`,
        technology: "systemd",
        commands: [
          inspectCommandSafety({
            command: `systemctl status ${unit}`,
            explanation: `Diagnostic: View recent execution status, exit code, and active state of ${unit}.`,
          }),
          inspectCommandSafety({
            command: `journalctl -u ${unit} -e --no-pager -n 50`,
            explanation: `Diagnostic: Read the last 50 log lines emitted by ${unit} for full error traces.`,
          }),
          inspectCommandSafety({
            command: "sudo systemctl daemon-reload",
            explanation: "Reload systemd configuration if you recently edited unit files.",
          }),
        ],
        nextSteps: [
          "Check service configuration files in `/etc/systemd/system/`.",
          "Verify the target executable exists and has execute permissions.",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "SELinux / AppArmor Access Restrictions",
    technology: "Linux Security (SELinux / AppArmor)",
    match: (err) => /SELinux is preventing|type=AVC msg=audit|apparmor="DENIED"/i.test(err),
    generate: () => ({
      summary: "Kernel mandatory access control (SELinux or AppArmor) blocked the requested operation.",
      cause: "Even with root or file permissions granted, the security profile policy denies the process type from accessing the target resource or port.",
      fix: "Inspect AVC audit messages and adjust security contexts or generate custom policy rules.",
      technology: "SELinux / AppArmor",
      commands: [
        inspectCommandSafety({
          command: "sestatus 2>/dev/null || sudo aa-status 2>/dev/null",
          explanation: "Diagnostic: Check if SELinux or AppArmor is currently enforcing policies.",
        }),
        inspectCommandSafety({
          command: "sudo ausearch -m AVC,USER_AVC -ts recent | audit2why 2>/dev/null",
          explanation: "Diagnostic: Analyze recent audit denials with audit2why to see suggested context changes.",
        }),
      ],
      nextSteps: [
        "Use `restorecon -Rv /path/to/files` to restore default SELinux file contexts.",
        "Avoid disabling SELinux globally with `setenforce 0` in production environments.",
      ],
      confidence: "high",
    }),
  },
  {
    name: "Rust Compiler Error / Linker cc Not Found",
    technology: "Rust / Cargo",
    match: (err) => /error\[E[0-9]{4}\]:|linker `cc` not found|cargo: command not found/i.test(err),
    generate: (req) => {
      const pkg = getPkgManager(req.os);
      return {
        summary: "Rust compiler (rustc/cargo) encountered a type/borrow error or missing C linker toolchain.",
        cause: "Rust requires a native C linker (gcc/clang) for binary creation, or code violates lifetime/borrowing rules.",
        fix: `Install the native build toolchain using ${pkg.name} and inspect compiler diagnostics.`,
        technology: "Rust",
        commands: [
          inspectCommandSafety({
            command: req.os === "Arch"
              ? "sudo pacman -S --needed base-devel"
              : req.os === "Fedora"
              ? "sudo dnf groupinstall -y 'Development Tools'"
              : "sudo apt-get update && sudo apt-get install -y build-essential",
            explanation: `Install C compiler and linker toolchain for ${req.os || "Linux"}.`,
          }),
          inspectCommandSafety({
            command: "cargo check",
            explanation: "Diagnostic: Fast syntax and type checking without full binary compilation.",
          }),
        ],
        nextSteps: [
          "Run `rustup update` to ensure compiler toolchains and components are up to date.",
          "Use `cargo clippy` for automated code improvements.",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "Python ModuleNotFoundError",
    technology: "Python",
    match: (err) => /ModuleNotFoundError: No module named/i.test(err),
    generate: (req) => {
      const modMatch = req.errorText.match(/No module named ['"]([^'"]+)['"]/i);
      const modName = modMatch ? modMatch[1] : "package_name";
      return {
        summary: `Python runtime cannot find the required module '${modName}'.`,
        cause: `The library '${modName}' is not installed in the currently active Python interpreter environment, or you are running outside your virtual environment.`,
        fix: `Activate your virtual environment and install '${modName}' with pip.`,
        technology: "Python",
        commands: [
          inspectCommandSafety({
            command: "python3 -m venv .venv && source .venv/bin/activate",
            explanation: "Create and activate an isolated Python virtual environment (PEP 668 compliant).",
          }),
          inspectCommandSafety({
            command: `pip install ${modName}`,
            explanation: `Install '${modName}' inside the activated virtual environment.`,
          }),
        ],
        nextSteps: [
          "If a `requirements.txt` or `pyproject.toml` exists, run `pip install -r requirements.txt`.",
          "On modern Linux (Ubuntu 24.04+, Fedora, Arch), avoid `pip install --break-system-packages`.",
        ],
        confidence: "high",
      };
    },
  },
  {
    name: "Missing Shared Library / Command Not Found / GCC Header",
    technology: "Linux Toolchain / Packages",
    match: (err) => /cannot open shared object file: No such file or directory|command not found|fatal error: [a-zA-Z0-9_\-.]+\.h: No such file/i.test(err),
    generate: (req) => {
      const pkg = getPkgManager(req.os);
      return {
        summary: "A required command, header file, or shared library (.so) is missing from the system.",
        cause: "Development packages, build essentials, or native runtime libraries required by the compiler or executable are not installed.",
        fix: `Install the development tools and required libraries using your distribution package manager (${pkg.name}).`,
        technology: "Linux Toolchain",
        commands: [
          inspectCommandSafety({
            command: req.os === "Arch"
              ? "sudo pacman -S --needed base-devel"
              : req.os === "Fedora"
              ? "sudo dnf groupinstall -y 'Development Tools' 'C Development Tools and Libraries'"
              : "sudo apt-get update && sudo apt-get install -y build-essential pkg-config",
            explanation: `Install standard C/C++ build tools and headers for ${req.os || "Linux"}.`,
          }),
        ],
        nextSteps: [
          req.os === "Arch"
            ? "Use `pkgfile <file>` or `pacman -F <file>` to search which package owns a missing file."
            : req.os === "Fedora"
            ? "Use `dnf provides '*/<missing-file>'` to locate the missing package."
            : "Use `apt-file search <missing-file>` to find which deb package provides it.",
        ],
        confidence: "medium",
      };
    },
  },
];

export function analyzeWithHeuristics(req: AnalyzeRequest): FixItResponse | null {
  const errorText = req.errorText.trim();
  if (!errorText) return null;

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.match(errorText)) {
      return pattern.generate(req);
    }
  }

  return null;
}
