# 🚀 Deployment guide

PSLE Otter is **one stateless container**. It serves static files; all student data lives in each student's browser.
That makes it very cheap to host: it needs ~64 MB RAM, no database, no volume, and can sleep (scale to zero) when nobody is studying.

> **Pricing note.** Free tiers change often. The "cost" notes below were accurate to the best of my knowledge when this was
> written — **check each provider's current pricing page before you commit**.

## Contents

1. [Which option should I choose?](#1-which-option-should-i-choose)
2. [Run it on your own computer (2 minutes)](#2-run-it-on-your-own-computer)
3. [Option A – Google Cloud Run (recommended: scales to zero, Singapore region)](#3-option-a--google-cloud-run)
4. [Option B – Render (easiest, free but sleepy)](#4-option-b--render)
5. [Option C – Fly.io (Singapore, tiny monthly cost)](#5-option-c--flyio)
6. [Option D – Oracle Cloud "Always Free" VM (truly free, a bit more setup)](#6-option-d--oracle-cloud-always-free-vm)
7. [Option E – Home server / Raspberry Pi + free Cloudflare Tunnel](#7-option-e--home-server--cloudflare-tunnel)
8. [Optional: skip containers entirely (static hosting)](#8-optional-static-hosting-without-docker)
9. [Configuration reference](#9-configuration-reference)
10. [Updating, monitoring, backups](#10-updating-monitoring-backups)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Which option should I choose?

| Option | Typical cost | Setup | Notes |
|---|---|---|---|
| **Your own PC / Pi at home** | $0 | ★☆☆ | Only reachable at home unless you add a tunnel (Option E). |
| **A. Cloud Run** | ~$0 for family use (free tier) | ★★☆ | Needs a Google Cloud account with billing enabled. Scales to zero; first request after idle takes ~1–2 s. Singapore region available. |
| **B. Render (free web service)** | $0 | ★☆☆ | No credit card for the free plan. Sleeps after ~15 min idle; the first load can take 30–60 s. |
| **C. Fly.io** | a few cents to ~US$2/month | ★★☆ | Singapore region, fast; no longer a free plan for new accounts. |
| **D. Oracle Always Free VM** | $0 | ★★★ | Always-on, you manage the VM. Singapore region exists, but free-tier VM capacity is not always available. |
| **E. Cloudflare Tunnel** | $0 | ★★☆ | Put your home server on the internet with HTTPS, no port-forwarding. |

**Important:** use a host that gives you **HTTPS**. The offline mode (service worker), microphone dictation and "install to home screen" all require HTTPS (or `localhost`). Every option above provides it.

All hosts below need the container to listen on the port in the `PORT` environment variable — PSLE Otter already does (default `8080`).

---

## 2. Run it on your own computer

Prerequisite: [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine on Linux).

```bash
git clone https://github.com/yrabin/random-a.git psle-otter
cd psle-otter
docker compose up -d
```

Open **http://localhost:8080**. To stop: `docker compose down`.

Other devices on your Wi-Fi can use `http://<your-computer's-IP>:8080` (e.g. `http://192.168.1.20:8080`), but note that
offline/install/microphone features need HTTPS, so for tablets use Option E or a cloud option.

Without Docker: install Node 20+ and run `npm start`.

Using the pre-built image (built automatically by GitHub Actions on every push to `main`):

```bash
docker run -d --name psle-otter --restart unless-stopped -p 8080:8080 ghcr.io/yrabin/random-a:latest
```

> The package is private by default on GitHub. In the repo: **Packages → psle-otter/random-a → Package settings → Change visibility → Public**,
> or `docker login ghcr.io` with a personal access token (`read:packages`).

---

## 3. Option A – Google Cloud Run

Cloud Run runs your container only while requests arrive, and has a monthly free allowance that a family-sized app should stay within.

1. Create a Google Cloud project and **enable billing** (a card is required even if you stay within the free tier). Consider setting a **budget alert** (Billing → Budgets & alerts) at e.g. US$1.
2. Install the [gcloud CLI](https://cloud.google.com/sdk/docs/install) and log in: `gcloud auth login`.
3. From the repo root:

```bash
./deploy/cloudrun.sh YOUR_PROJECT_ID            # defaults to Singapore (asia-southeast1)
# or: ./deploy/cloudrun.sh YOUR_PROJECT_ID us-central1 psle-otter
```

That script enables the required APIs and runs:

```bash
gcloud run deploy psle-otter --source . --region asia-southeast1 \
  --allow-unauthenticated --port 8080 --memory 128Mi \
  --min-instances 0 --max-instances 2
```

It prints a `https://psle-otter-xxxxx-as.a.run.app` URL. Open it on the tablet and use **Add to Home Screen**.

**Keep it private-ish:** add a password gate with `--set-env-vars BASIC_AUTH=family:a-long-password` (see [configuration](#9-configuration-reference)),
or remove `--allow-unauthenticated` and use IAM/identity-aware access.

**Custom domain:** Cloud Run → *Manage custom domains*. Free managed HTTPS certificates are included.

**Cost control:** `--max-instances 2` caps scale; keep `--min-instances 0`; set a budget alert.

---

## 4. Option B – Render

1. Fork or use this GitHub repo. Create a free account at <https://render.com> and connect your GitHub.
2. **New + → Blueprint**, pick the repo. Render reads [`render.yaml`](../render.yaml) (Docker runtime, free plan, Singapore region, health check `/healthz`).
   *Or* **New + → Web Service → Docker**, choose the repo, region **Singapore**, instance type **Free**.
3. Wait for the first build (a few minutes). You get `https://psle-otter.onrender.com`.

Notes: the free plan **spins down after ~15 minutes of inactivity**, so the first visit after a quiet spell is slow. Once the page has
loaded, the app works offline, so a student with the app installed is rarely affected. Auto-deploys on each push to `main`.

---

## 5. Option C – Fly.io

```bash
curl -L https://fly.io/install.sh | sh         # or: brew install flyctl
fly auth signup                                 # or: fly auth login
fly launch --copy-config --no-deploy            # accept fly.toml; pick a unique app name
fly deploy
fly open
```

[`fly.toml`](../fly.toml) uses region `sin` (Singapore), a `shared-cpu-1x` 256 MB machine, and **stops the machine when idle**
(`auto_stop_machines`), so you pay only for the seconds it runs plus (at the time of writing) any minimum monthly charge. Check <https://fly.io/docs/about/pricing/>.

---

## 6. Option D – Oracle Cloud "Always Free" VM

Oracle's Always Free tier includes small VMs (including ARM Ampere) with no time limit. The image is multi-arch, so ARM works.

1. Sign up at <https://www.oracle.com/cloud/free/> (credit card required for verification). Pick a **Singapore** home region if you can (it can't be changed later).
2. Create a compute instance (Ubuntu 22.04/24.04, Always-Free-eligible shape). Download the SSH key. In the VCN's security list, open ports **80** and **443** (ingress TCP).
3. SSH in and install Docker:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
```

4. Run the app plus Caddy for automatic HTTPS (replace the domain; point its DNS A-record at the VM's public IP):

```bash
mkdir -p ~/otter && cd ~/otter
cat > compose.yml <<'EOF'
services:
  app:
    image: ghcr.io/yrabin/random-a:latest
    restart: unless-stopped
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes: ["./Caddyfile:/etc/caddy/Caddyfile:ro", "caddy_data:/data"]
volumes:
  caddy_data:
EOF
echo 'otter.example.com { reverse_proxy app:8080 }' > Caddyfile
docker compose up -d
```

5. Also open the OS firewall if needed: `sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT; sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT` (Oracle's Ubuntu images block them by default).

No domain? Use a free DNS name from DuckDNS, or use Option E instead.

---

## 7. Option E – Home server / Cloudflare Tunnel

Great for an old laptop or Raspberry Pi (64-bit OS; the image supports `arm64`).

1. Run the app: `docker compose up -d` (Section 2).
2. Create a free Cloudflare account and add a domain you own (or use `cloudflared` quick tunnels for a temporary URL: `cloudflared tunnel --url http://localhost:8080`).
3. Permanent tunnel with a hostname:

```bash
cloudflared tunnel login
cloudflared tunnel create otter
cloudflared tunnel route dns otter otter.yourdomain.com
cat > ~/.cloudflared/config.yml <<'EOF'
tunnel: otter
credentials-file: /home/YOU/.cloudflared/<TUNNEL-ID>.json
ingress:
  - hostname: otter.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
EOF
cloudflared service install      # starts on boot
```

For **family-only** access with no public exposure at all, install [Tailscale](https://tailscale.com) on the server and the tablet, then use `http://<tailscale-name>:8080`
(or `tailscale serve` for HTTPS).

---

## 8. Optional: static hosting without Docker

Because the front end is plain static files, you can *also* host the `public/` folder on **Cloudflare Pages**, **Netlify** or **Vercel** (free tiers) — just publish the `public` directory with no build command. This is the cheapest and fastest setup, but you asked for a container, so Docker remains the primary path.
(GitHub Pages works only with a custom domain because the app uses root-relative URLs.)

---

## 9. Configuration reference

All settings are optional environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | Port to listen on (hosts like Cloud Run/Render set this for you). |
| `HOST` | `0.0.0.0` | Interface to bind. |
| `BASIC_AUTH` | *(off)* | `user:password` — require a login for everything except `/healthz`. Handy on a public URL. Use HTTPS so the password isn't sent in clear text. |
| `EXTRA_CONNECT_SRC` | *(none)* | Extra origins the browser may call (space/comma separated), e.g. `http://192.168.1.50:11434` for a home Ollama server. By default the CSP allows `https:`, `localhost` and `127.0.0.1`. |

Health check: `GET /healthz` → `200 ok`.

Security defaults: runs as non-root `node`, strict Content-Security-Policy (no inline scripts/styles, no third-party scripts), `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`,
only `GET`/`HEAD` accepted, path-traversal protected. Compose file also drops all Linux capabilities and uses a read-only filesystem.

---

## 10. Updating, monitoring, backups

* **Updating**: pull the latest code and redeploy (`docker compose up -d --build`, `gcloud run deploy ...`, `fly deploy`, or push to `main` for Render). Browsers pick up new files automatically (network-first service worker).
* **Image publishing**: `.github/workflows/publish.yml` builds `linux/amd64` + `linux/arm64` images to `ghcr.io/<owner>/<repo>` on every push to `main` and on `v*` tags.
* **Monitoring**: point UptimeRobot (free) or your host's health check at `/healthz`.
* **Backups**: the server holds **no student data**. Students export a JSON backup from **Settings → Download backup**. Nothing to back up server-side.
* **Logs**: the server logs only startup/shutdown and errors — no request logs, no IP addresses.

---

## 11. Troubleshooting

| Symptom | Fix |
|---|---|
| Page loads but is blank | Open the browser console (F12). A strict CSP blocks inline scripts — don't edit `index.html` to add inline `<script>`. |
| "Add to Home Screen" missing / no offline mode | You're on plain `http://` (not localhost). Use an HTTPS host. |
| AI says "Could not reach the AI service" | Check internet; for *Custom/local* providers the local server must allow browser requests (CORS), e.g. Ollama: `OLLAMA_ORIGINS=*`, and if the app is on HTTPS you cannot call plain `http://` servers (browser mixed-content rule) — use the HTTPS host or run the app locally. |
| AI says key not accepted (401/403) | Re-copy the key (no spaces); check the provider account has credit; check the model name in Settings. |
| Progress vanished | Browser data was cleared or a private window was used. Restore from a backup (Settings → Restore backup). |
| Cloud Run 503 on first request | Cold start; retry. If persistent, check logs: `gcloud run services logs read psle-otter --region asia-southeast1`. |
| Render site very slow first time | Free plan wake-up; wait up to a minute. |
| Port already in use locally | `PORT=3000 npm start` or change the left side of `ports: "8080:8080"`. |
