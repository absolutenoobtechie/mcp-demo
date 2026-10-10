/**
 * Demo sample datasets for SecOps MCP Console
 * Grounded in samples/auth.log, samples/dummy-secrets.txt, and real cybersecurity incidents.
 */

export const TOOL_SAMPLES = {
  scan_secrets: [
    {
      id: "dummy-secrets",
      label: "Repo Sample (dummy-secrets.txt)",
      description: "Sample from repository with OpenAI, AWS, and GitHub tokens",
      payload: {
        text: `# These values are intentionally fake and exist only for the demo scanner.
OPENAI_API_KEY=sk-1234567890abcdefghijkl
AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF
GITHUB_TOKEN=ghp_1234567890abcdefghijkl`,
      },
    },
    {
      id: "app-env-leak",
      label: "Cloud App Config Leak",
      description: "Mixed environment config leaking Slack, OpenAI, and Private Key",
      payload: {
        text: `NODE_ENV=production
DATABASE_URL=postgres://app_user:s3cr3tP@ssw0rd123@db.internal:5432/main
OPENAI_API_KEY=sk-proj99887766554433221100aabbccddeeff
SLACK_BOT_TOKEN=xoxb-9876543210-1234567890123-abcdef123456
API_KEY=production_live_master_key_998877665544`,
      },
    },
    {
      id: "clean-code",
      label: "Clean Code (No Secrets)",
      description: "Benign Python application configuration using env references",
      payload: {
        text: `import os

def load_settings():
    return {
        "host": os.getenv("APP_HOST", "0.0.0.0"),
        "port": int(os.getenv("APP_PORT", "8080")),
        "debug": False,
        "service_name": "secops-gateway"
    }`,
      },
    },
  ],

  lookup_cve: [
    {
      id: "cve-xz",
      label: "CVE-2024-3094 (XZ Utils Backdoor)",
      description: "Critical backdoor discovered in upstream xz/liblzma packages",
      payload: {
        cve_id: "CVE-2024-3094",
      },
    },
    {
      id: "cve-log4j",
      label: "CVE-2021-44228 (Log4Shell)",
      description: "Critical remote code execution vulnerability in Apache Log4j",
      payload: {
        cve_id: "CVE-2021-44228",
      },
    },
    {
      id: "cve-runc",
      label: "CVE-2024-21626 (runc Escape)",
      description: "Container breakout flaw via leaky file descriptors in runc",
      payload: {
        cve_id: "CVE-2024-21626",
      },
    },
  ],

  search_cves: [
    {
      id: "query-openssl-ssh",
      label: "Search: 'openssl ssh'",
      description: "Recent cryptographic and remote shell advisories",
      payload: {
        keyword: "openssl ssh",
      },
    },
    {
      id: "query-runc",
      label: "Search: 'runc container'",
      description: "Container runtime containerization security advisories",
      payload: {
        keyword: "runc container",
      },
    },
    {
      id: "query-privesc",
      label: "Search: 'privilege escalation linux'",
      description: "Kernel and local system vulnerability reports",
      payload: {
        keyword: "privilege escalation linux",
      },
    },
  ],

  analyze_auth_log: [
    {
      id: "repo-auth-log",
      label: "Repo Sample (auth.log - SSH Brute Force)",
      description: "Direct sample from samples/auth.log with 5 failed attempts from 45.67.89.10",
      payload: {
        log_text: `Oct 10 10:00:01 demo sshd[1001]: Failed password for invalid user admin from 45.67.89.10 port 52101 ssh2
Oct 10 10:00:02 demo sshd[1002]: Failed password for invalid user admin from 45.67.89.10 port 52102 ssh2
Oct 10 10:00:03 demo sshd[1003]: Failed password for invalid user admin from 45.67.89.10 port 52103 ssh2
Oct 10 10:00:04 demo sshd[1004]: Failed password for invalid user admin from 45.67.89.10 port 52104 ssh2
Oct 10 10:00:05 demo sshd[1005]: Failed password for invalid user admin from 45.67.89.10 port 52105 ssh2
Oct 10 10:01:12 demo sshd[1006]: Accepted publickey for demo from 192.168.1.20 port 40222 ssh2`,
      },
    },
    {
      id: "distributed-auth-log",
      label: "Distributed Attack (Multi-IP Botnet)",
      description: "High-volume credential stuffing from multiple distinct public sources",
      payload: {
        log_text: `Oct 10 11:15:00 bastion sshd[2001]: Failed password for root from 185.220.101.5 port 42100 ssh2
Oct 10 11:15:01 bastion sshd[2002]: Failed password for root from 185.220.101.5 port 42102 ssh2
Oct 10 11:15:02 bastion sshd[2003]: Failed password for root from 185.220.101.5 port 42104 ssh2
Oct 10 11:15:03 bastion sshd[2004]: Failed password for root from 185.220.101.5 port 42106 ssh2
Oct 10 11:15:04 bastion sshd[2005]: Failed password for root from 185.220.101.5 port 42108 ssh2
Oct 10 11:15:05 bastion sshd[2006]: Failed password for root from 185.220.101.5 port 42110 ssh2
Oct 10 11:16:10 bastion sshd[2007]: Failed password for invalid user oracle from 91.240.118.12 port 51222 ssh2
Oct 10 11:16:20 bastion sshd[2008]: Failed password for invalid user test from 198.51.100.44 port 38910 ssh2
Oct 10 11:17:45 bastion sshd[2009]: Accepted publickey for secops from 10.0.0.15 port 55410 ssh2`,
      },
    },
    {
      id: "benign-auth-log",
      label: "Benign Corporate LAN Activity",
      description: "Normal logins over internal subnet with zero brute force",
      payload: {
        log_text: `Oct 10 09:00:15 gateway sshd[3001]: Accepted publickey for alice from 192.168.1.100 port 51022 ssh2
Oct 10 09:15:30 gateway sshd[3002]: Accepted publickey for bob from 192.168.1.101 port 51024 ssh2
Oct 10 09:30:45 gateway sshd[3003]: Accepted publickey for charlie from 192.168.1.102 port 51026 ssh2`,
      },
    },
  ],

  check_password_breach: [
    {
      id: "breached-pw-1",
      label: "Severely Breached ('password123')",
      description: "Extremely common credential exposed in millions of past breaches",
      payload: {
        password: "password123",
      },
    },
    {
      id: "breached-pw-2",
      label: "Compromised Policy ('admin2024!')",
      description: "Dictionary hybrid hit often targeted in spray attacks",
      payload: {
        password: "admin2024!",
      },
    },
    {
      id: "safe-passphrase",
      label: "Unbreached Passphrase ('correct horse battery staple')",
      description: "Robust Diceware passphrase with zero known database leaks",
      payload: {
        password: "correct horse battery staple",
      },
    },
  ],

  score_url: [
    {
      id: "phish-url-high",
      label: "High Risk Phishing Domain",
      description: "Spoofed brand name, suspicious tunnel subdomain, embedded login path",
      payload: {
        url: "https://paypa1-security-verification.serveo.net/login",
      },
    },
    {
      id: "ip-unencrypted-med",
      label: "Medium Risk (Plain HTTP + Direct IP)",
      description: "Direct private IP target over unencrypted HTTP protocol",
      payload: {
        url: "http://192.168.1.50/wp-admin/update.php?auth_token=temp",
      },
    },
    {
      id: "legit-url-low",
      label: "Low Risk Benign Service",
      description: "Clean standard HTTPS URL without deceptive indicators",
      payload: {
        url: "https://example.com/login",
      },
    },
  ],
};
