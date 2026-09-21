# Deploy Paramount Direct to Ubuntu 26.04

Target: **https://pd2-dev.paramount.com.ph**

This repository contains a React/Vite frontend (`paramountdirect_v2/`) and an
Express/Prisma/PostgreSQL API (`server/`). This guide uses PM2 for both, as requested:

```text
Browser -> Nginx :443
             /        -> PM2 static frontend 127.0.0.1:3000
             /api/*   -> PM2 Express API     127.0.0.1:4000 -> AWS RDS
             /health  -> API liveness
```

**Current application limitation:** the frontend still uses in-memory sample data
and a hardcoded demo login in `src/components/login.tsx`. It has no API fetch calls.
Hosting it does not connect its screens to PostgreSQL. Backend authentication and
frontend CRUD integration remain separate work before real operational use.
Treat this deployment as a demo until that integration is complete.

**Do not run `npm run seed` against this RDS database.** The existing seed deletes
all applications in four tables and resets a demo user's password. A fresh database
will need an intentionally provisioned API user/role; migrations do not create users.

## 1. What you need

- Server IP, SSH username/key, and sudo access.
- DNS access: point the `pd2-dev.paramount.com.ph` A record to the server IPv4.
  Only create an AAAA record if IPv6 is configured and reachable.
- Inbound TCP 80/443 to the server; SSH restricted to your administration IP.
  Keep 3000/4000 private. Preserve any custom SSH port when configuring firewalls.
- Node.js **24 LTS**, npm, PM2, Nginx, Certbot, Git, rsync, Python 3,
  CA certificates, OpenSSL, and build tools.
- Access from this server to the RDS endpoint on TCP 5432. Its security group
  must permit the app server security group (when supported) or its exact source
  IP. A private RDS instance also requires VPC routing/VPN/private connectivity;
  changing security groups alone does not make it reachable.
- Database migration privileges and a backup/snapshot before migrating existing data.
- The correct iPeak URL/private key for the intended environment, if using those features.

PostgreSQL runs on RDS: you do **not** need to install a local database server.
No Redis or Docker dependency was found in this project.
The supplied password should remain in the server's private environment file.
Rotate it before real use because it was shared in chat.

## 2. Install server packages

Run on the **Ubuntu server**, using your normal sudo-enabled SSH account:

```bash
sudo apt update
sudo apt install -y nginx git rsync curl ca-certificates openssl build-essential python3 snapd
sudo systemctl enable --now nginx
```

Install Node 24 for that same non-root account. One option is nvm:

```bash
git clone --branch v0.40.3 --depth 1 https://github.com/nvm-sh/nvm.git "$HOME/.nvm"
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm install 24
nvm alias default 24
nvm use 24
npm install -g pm2
node --version
npm --version
pm2 --version
```

If nvm already exists, skip the clone. Add these lines to `~/.bashrc` if absent:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

Use the same account for deployment and every PM2 command. Do not use `sudo pm2 start`.
If UFW is enabled, allow your actual SSH port and `Nginx Full` before changing rules.
Apply equivalent rules in the hosting provider's firewall.

## 3. Copy the project

On the server:

```bash
sudo mkdir -p /home/ubuntu/paramountdirect_v2.0
sudo chown "$(id -un):$(id -gn)" /home/ubuntu/paramountdirect_v2.0
```

From your **local WSL terminal**, replace SSH_USER and SERVER_IP:

```bash
cd ~/paramount/paramountdirect_v2.0
rsync -av --exclude='.git/' --exclude='node_modules/' --exclude='dist/' \
  --exclude='.env' --exclude='.env.*' --exclude='log/' \
  --exclude='playwright-report/' --exclude='test-results/' \
  ./ SSH_USER@SERVER_IP:/home/ubuntu/paramountdirect_v2.0/
```

The deployment template `deploy/server.env.example` is included by this command.
Do not copy node_modules from Windows/WSL to the server; install there.

## 4. Set the private server environment

On the **server**:

```bash
cd /home/ubuntu/paramountdirect_v2.0
test ! -e server/.env && (umask 077; cp deploy/server.env.example server/.env)
chmod 600 server/.env
```

For a new environment file, this helper prompts for the database password without
echoing it, URL-encodes special characters, and generates the JWT secret.
Enter the password from the supplied connection string, **not the whole URL**.
It refuses to overwrite an already configured environment file.

```bash
python3 - <<'PY'
from pathlib import Path
from urllib.parse import quote
from getpass import getpass
import secrets

path = Path("server/.env")
text = path.read_text()
if "REPLACE_WITH_ENCODED_PASSWORD" not in text or "REPLACE_WITH_RANDOM_SECRET" not in text:
    raise SystemExit("Already configured: edit server/.env intentionally instead.")
password = getpass("RDS password: ")
if not password:
    raise SystemExit("Password must not be empty.")
text = text.replace("REPLACE_WITH_ENCODED_PASSWORD", quote(password, safe=""))
text = text.replace("REPLACE_WITH_RANDOM_SECRET", secrets.token_hex(48))
path.write_text(text)
path.chmod(0o600)
print("Environment configured; secrets were not printed.")
PY
```

The template already uses your RDS hostname, username `pd_dev_v2`, database
`postgres`, TLS (`sslmode=require`), and the HTTPS CORS origin.
The password contains `?` and `$`: a raw pasted URL can be parsed incorrectly.
Never put DATABASE_URL or JWT_SECRET in the frontend or any `VITE_*` variable.

Edit `server/.env` privately to set iPeak credentials. Leave them blank if unused;
submission/issuance integrations will not work until configured.
For certificate identity verification, configure Prisma with the current AWS RDS
CA bundle and its supported certificate validation parameters; TLS-required alone
should not be treated as proof of server identity.

## 5. Install and build

Run on the server. Stop if any command fails:

```bash
(
set -e
cd /home/ubuntu/paramountdirect_v2.0/server
npm ci
npm run prisma:generate
npm run build

cd ../paramountdirect_v2
npm ci
npm run build
)
```

Build dependencies are needed, so do not use `npm ci --omit=dev` before building.
The root package.json is not the frontend application.

Inspect migration status and take an RDS snapshot/backup before applying migrations:

```bash
cd /home/ubuntu/paramountdirect_v2.0/server
npx prisma migrate status
```

Pending migrations can produce a nonzero status. Review the output. If this is an
existing populated database without Prisma migration history, stop and baseline
the existing schema correctly; do not reset it or blindly mark migrations applied.
Once the database/schema and backup are confirmed:

```bash
npm run prisma:deploy
npx prisma migrate status
```

Use `migrate deploy`, never `migrate dev`, `migrate reset`, or `db push` for deployment.
No migration or connection to your RDS database was performed while preparing this guide.

## 6. Start frontend and API with PM2

```bash
cd /home/ubuntu/paramountdirect_v2.0
pm2 start deploy/ecosystem.config.cjs
pm2 status
curl -fsS http://127.0.0.1:4000/health
curl -I http://127.0.0.1:3000/
pm2 startup
```

Execute the sudo command printed by `pm2 startup`, then:

```bash
pm2 save
pm2 install pm2-logrotate
```

The frontend process serves only the compiled `dist/` directory, with SPA fallback.
It does not run the Vite development or preview server. The API reads
`server/.env` because its PM2 working directory is `server/`.
After upgrading Node, regenerate PM2 startup configuration for the new Node path.

## 7. Enable Nginx and HTTPS

First verify DNS resolves to this server and ports 80/443 are reachable:

```bash
getent ahosts pd2-dev.paramount.com.ph
sudo cp /home/ubuntu/paramountdirect_v2.0/deploy/nginx.conf /etc/nginx/sites-available/pd2-dev.paramount.com.ph
sudo ln -s /etc/nginx/sites-available/pd2-dev.paramount.com.ph /etc/nginx/sites-enabled/pd2-dev.paramount.com.ph
sudo nginx -t && sudo systemctl reload nginx
curl -fsS -H 'Host: pd2-dev.paramount.com.ph' http://127.0.0.1/health
```

Skip the symlink command if that exact symlink already exists. Ensure no other
Nginx server block claims this hostname. Existing unrelated sites can remain.

For a server without an existing Certbot installation:

```bash
sudo snap install --classic certbot
sudo /snap/bin/certbot --nginx -d pd2-dev.paramount.com.ph --redirect
sudo /snap/bin/certbot renew --dry-run
```

Enter your certificate notification email when prompted. Certbot adds HTTPS
configuration and automatic renewal. Do not overwrite its edited Nginx config with
the HTTP template on later deployments.

## 8. Verify

```bash
curl -I https://pd2-dev.paramount.com.ph
curl -fsS https://pd2-dev.paramount.com.ph/health
curl -i https://pd2-dev.paramount.com.ph/api/auth/me
pm2 status
ss -ltn | grep -E ':(3000|4000) '
```

Expect frontend HTTP 200, health `{"status":"ok"}`, and an unauthenticated 401 from
`/api/auth/me`. Both application ports should listen on 127.0.0.1.
The health endpoint checks the process, **not database availability**. Migration
status checks DB connectivity; a successful authenticated API request is still
needed to verify the full login/database path after an API account exists.
The browser demo login is not evidence of API/database integration.

## 9. Updates, troubleshooting, and rollback

`deploy.sh` (repo root) and `.github/workflows/deploy-pd2-dev.yml` implement the
update flow below. The GitHub Actions workflow SSHes into the server and runs
`deploy.sh` automatically on every push to `pdv2_dev` - it is **not active** until
these repo secrets are set (GitHub -> Settings -> Secrets and variables -> Actions):

- `DEPLOY_SSH_HOST` - server hostname or IP
- `DEPLOY_SSH_USER` - the `ubuntu` deploy account (not root)
- `DEPLOY_SSH_KEY` - private key for a deploy-only SSH keypair (add the matching
  public key to that account's `~/.ssh/authorized_keys` on the server)
- `DEPLOY_SSH_PORT` - optional, defaults to 22
- `DEPLOY_PROJECT_DIR` - optional, defaults to `/home/ubuntu/paramountdirect_v2.0`

Until those secrets exist, every run of that workflow fails at its SSH step -
that's expected, not a bug - and updates stay manual: push your changes to
`origin/pdv2_dev`, then run on the server as `ubuntu` (without sudo):

```bash
cd /home/ubuntu/paramountdirect_v2.0
bash deploy.sh
```

The script loads nvm/Node 24, requires a clean checkout on `pdv2_dev`, fetches
`origin/pdv2_dev`, and applies only a fast-forward update. It installs locked
dependencies, generates Prisma, builds both applications, applies pending
migrations, restarts both PM2 processes, retries local health checks, and saves
the PM2 process list. It never seeds data or overwrites your private `server/.env`.
Initial Nginx, HTTPS, environment setup, and `pm2 startup` remain one-time steps.

To obtain this script on the server for the first time, after committing and
pushing it from your development machine:

```bash
cd /home/ubuntu/paramountdirect_v2.0
git switch pdv2_dev
git pull --ff-only origin pdv2_dev
bash deploy.sh
```


You can also keep the script at `/home/ubuntu/deploy.sh`:

```bash
cp /home/ubuntu/paramountdirect_v2.0/deploy.sh /home/ubuntu/deploy.sh
bash /home/ubuntu/deploy.sh
```

When outside the project, it defaults to `/home/ubuntu/paramountdirect_v2.0`.
Your current working directory does not matter. To use a different project path:

```bash
DEPLOY_PROJECT_DIR=/path/to/project bash /home/ubuntu/deploy.sh
```

The external copy does not update itself when Git pulls a newer script. Repeat
the copy command when `deploy.sh` changes, or use a wrapper at
`/home/ubuntu/deploy.sh` containing these two lines to always run the tracked copy:

```bash
#!/usr/bin/env bash
exec bash /home/ubuntu/paramountdirect_v2.0/deploy.sh "$@"
```

The server must be a Git checkout with read access to the origin repository.
If you copied the project using rsync without `.git`, first set up a clone of
`pdv2_dev` and move your private environment file into that checkout.
Resolve local edits/untracked files before running; the script will not discard
them or switch branches automatically. Use `bash deploy.sh`, not `source deploy.sh`.

Review new migrations and take an RDS snapshot/backup **before** running the script
when schema changes are included. Migrations run automatically after both builds.
A failure stops subsequent steps and prints the failing line. The checkout,
dependencies, or build files may already have changed; there is no automatic
rollback, and a failed health check does not undo migrations.
Use `pm2 logs pdv2-api --lines 80 --nostream` to investigate API startup failures.
The API health endpoint is liveness only; these checks do not test authenticated
database operations or public Nginx/TLS connectivity.

This simple in-place workflow can briefly interrupt requests. For zero-downtime
releases, use separate release directories and a tested cutover process.

- 502: inspect `pm2 logs pdv2-api`, `pm2 logs pdv2-web`, and
  `sudo tail -n 100 /var/log/nginx/error.log`.
- RDS timeout: check routing, outbound connectivity, and RDS security group port 5432.
- Authentication/URL errors: verify username/database and password URL encoding privately.
- Prisma engine/OpenSSL errors: confirm OpenSSL is installed and regenerate Prisma
  on the target Ubuntu server; do not reuse generated Windows binaries.
- iPeak failures: verify URL/key and network access to the configured service.
- UI changes disappear after refresh: current frontend uses mock state; finish API integration.
- Rollback: restore the prior compatible source/build and restart PM2. Database
  migrations are not reversed by rolling back code; use a reviewed forward repair
  or tested snapshot restore when necessary.

When replacing the temporary hostname, update DNS, Nginx server_name, CORS_ORIGIN,
and the TLS certificate; restart the API after editing its environment.

## References

- [Node.js downloads and LTS](https://nodejs.org/en/download)
- [nvm installation](https://github.com/nvm-sh/nvm#installing-and-updating)
- [PM2 static SPA hosting](https://pm2.keymetrics.io/docs/usage/expose/)
- [PM2 startup persistence](https://pm2.keymetrics.io/docs/usage/startup/)
- [Vite production builds](https://vite.dev/guide/static-deploy.html)
- [Certbot with Nginx](https://certbot.eff.org/instructions?ws=nginx&os=snap)

## Local validation performed

Both production builds passed with Node 24.15.0 after removing existing unused
frontend imports/state setters. The compiled API returned {"status":"ok"} on a
temporary localhost port. PM2 configuration syntax was checked.
Nginx/Certbot/PM2 service operation and Ubuntu 26.04 Prisma compatibility still
need verification on the target server; the local build ran in WSL.

The frontend build reports a large JavaScript bundle warning. Backend npm audit
reported three high-severity findings in the dependency chain
prisma -> @prisma/config -> deepmerge-ts (GHSA-ggr8-5vv4-36mx).
Review and test a compatible dependency fix before production; no automatic
dependency upgrades were applied as part of deployment configuration.
