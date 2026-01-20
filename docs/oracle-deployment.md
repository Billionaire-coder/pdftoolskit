# Oracle Cloud Deployment Guide (Free Tier)

This guide walks you through deploying **PDFToolkit** to an Oracle Cloud "Always Free" ARM instance using Docker.

## Prerequisites

1.  **Oracle Cloud Account**: Sign up at [cloud.oracle.com](https://www.oracle.com/cloud/free/).
2.  **SSH Client**: Terminal (Mac/Linux) or PowerShell/PuTTY (Windows).

---

## Step 1: Create the Instance

1.  **Login** to OCI Console.
2.  Go to **Compute > Instances** and click **Create Instance**.
3.  **Name**: `pdftoolkit-server`
4.  **Image & Shape**:
    *   **Image**: Canonical Ubuntu 22.04 or 24.04 (Always Free).
    *   **Shape**: Change Shape -> **Ampere** -> **VM.Standard.A1.Flex**.
    *   **OCPUs**: 4, **Memory**: 24 GB (Maximize the free tier!).
5.  **Networking**: Create new virtual cloud network (default settings are usually fine).
    *   **IMPORTANT**: Ensure "Assign a public IPv4 address" is checked.
6.  **SSH Keys**:
    *   Select "Generate a key pair for me" -> **Save Private Key**.
    *   **KEEP THIS KEY SAFE. THIS IS YOUR PASSPORT TO THE SERVER.**
7.  Click **Create**.

---

## Step 2: Open Firewall Ports (Ingress Rules)

By default, Oracle blocks everything except SSH (port 22). We need port 80 (HTTP) and 443 (HTTPS).

1.  In the Instance details page, click the **Subnet** link (e.g., `subnet-xxxx`).
2.  Click the **Security List** (e.g., `Default Security List...`).
3.  Click **Add Ingress Rules**:
    *   **Source CIDR**: `0.0.0.0/0` (Anywhere)
    *   **Protocol**: TCP
    *   **Dest Port Range**: `80,443`
    *   *(Optional)* Add `3000` temporarily if you want to test direct access without HTTPS.
4.  Click **Add Ingress Rules**.

---

## Step 3: Connect to Server

Move your key to a safe folder (e.g., `~/.ssh/oracle.key`) and set permissions (Linux/Mac only: `chmod 400 oracle.key`).

```bash
# Replace 1.2.3.4 with your Instance Public IP
ssh -i /path/to/oracle.key ubuntu@1.2.3.4
```

---

## Step 4: Server Setup (Run these on the server)

### 4.1 Update & Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Allow 'ubuntu' user to run docker commands
sudo usermod -aG docker $USER
```

*Log out (`exit`) and log back in for changes to take effect.*

### 4.2 Clone the Repo

```bash
# Install git
sudo apt install git -y

# Clone your repo (Use HTTPS if public, or setup SSH keys for private)
git clone https://github.com/Start-Up-Software/pdf-tools.git
cd pdf-tools
```

---

## Step 5: Build & Run

### 5.1 Build the Image

*(Note: This might take a few minutes)*

```bash
# Build the docker image
docker build -t pdftoolkit .
```

### 5.2 Run the Container

```bash
# Run in background (-d) on port 80 (-p 80:3000)
docker run -d -p 80:3000 --name pdftoolkit --restart always pdftoolkit
```

Now, visit `http://<YOUR_SERVER_IP>` in your browser. You should see the site!

---

## Step 6: HTTPS & Domain (When you are ready)

Once you buy a domain:

1.  **DNS**: Point your domain's **A Record** to the Oracle Server IP.
2.  **Caddy (Easiest SSL)**:
    *   Stop the current container: `docker stop pdftoolkit && docker rm pdftoolkit`
    *   Run Caddy as a reverse proxy (it handles SSL automatically).

    *Example Caddy setup coming in next phase.*
