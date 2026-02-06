---
authors: too
title: 在Fly.io中部署tinyproxy
date: 2024/10/15
tags: [docker]
toc_max_heading_level: 6
keywords: [docker,tinyproxy,fly.io]
---
![bk](./bk.png)

## Deploy tinyproxy on Fly.io Using the Free Tier to Get a Free VPN

<!-- truncate -->

[Fly.io](https://fly.io/) is a cloud platform that lets you run backend services on global edge nodes as easily as deploying a local Docker container.

Each account includes **3 free `shared-cpu-1x 256MB` virtual machines** (Firecracker microVMs), **30GB outbound traffic per month**, and **3GB of storage**.

I use these ***free*** resources to set up a **proxy service**, implemented with `tinyproxy`.

## Preparation

We need to prepare three files:

* `tinyproxy.conf`: configuration file for tinyproxy
* `Dockerfile`: Docker build file
* `fly.toml`: application configuration file for Fly.io

### tinyproxy.conf

Write the following content into `tinyproxy.conf`:

```conf
User nobody
Group nogroup

Listen 0.0.0.0
Port 8888

Timeout 600

MaxClients 100

DisableViaHeader Yes

Allow 0.0.0.0/0

ConnectPort 443
ConnectPort 563

LogLevel Info

BasicAuth user password
```

### Dockerfile

Write the following content into `Dockerfile`:

```dockerfile
FROM alpine:3.19

RUN apk add --no-cache tinyproxy

COPY tinyproxy.conf /etc/tinyproxy/tinyproxy.conf

EXPOSE 8888

CMD ["tinyproxy", "-d", "-c", "/etc/tinyproxy/tinyproxy.conf"]
```

### fly.toml

Write the following content into `fly.toml`:

```toml
app = 'app-name'
primary_region = 'iad'
swap_size_mb = 512

[build]
  dockerfile = 'Dockerfile'

[[services]]
  internal_port = 8888
  protocol = "tcp"
  processes = ['app']

  [[services.ports]]
    port = 443
    handlers = ["tls"]

[[vm]]
  cpu_kind = 'shared'
  cpus = 1
  memory_mb = 256
```

## Deployment

Once all files are ready, we can start deploying using `flyctl`.

### Install flyctl

#### macOS

```shell
brew install flyctl
```

or

```shell
curl -L https://fly.io/install.sh | sh
```

#### Linux

```shell
curl -L https://fly.io/install.sh | sh
```

#### Windows

```shell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Log in to Fly.io

You must log in before continuing:

```bash
fly auth login
```

### Create the Application

First, create an application on Fly.io.

```bash
fly launch --no-deploy
```

Since we already created `fly.toml`, Fly will detect the existing file.

If the `app` name in the file conflicts with an existing application, Fly will report an error.

### Deploy the Application

```bash
fly deploy
```

Fly will build the Docker image, push it, and start the application.

### Allocate a Free Shared IP

```shell
fly ips allocate-v4 --shared
```

The `--shared` flag is mandatory.
Without it, Fly will allocate a paid dedicated IP.

### Check Status

First, check the application status:

```bash
fly status
```

```bash
App
  Name     = app-name
  Owner    = personal
  Hostname = app-name.fly.dev
  Image    = app-name:deployment-xxxxxxxxxxxxxx

Machines
PROCESS ID              VERSION REGION  STATE   ROLE    CHECKS  LAST UPDATED
app     xxxxxxxxxxxxxx  14      iad     started                 2026-01-23T06:53:45Z
```

Pay attention to `Hostname` and `Machines`:

* `Hostname`: the domain name assigned by Fly, used to access the proxy
* `Machines`: whether the VM is running correctly and how many instances exist (to avoid exceeding free limits)

Next, check IP information:

```bash
fly ips list
```

```bash
VERSION IP              TYPE                    REGION  CREATED AT
v4      xx.xxx.xx.xxx  public ingress (shared)         Jan 1 0001 00:00
```

An IP with `shared` in the `TYPE` column indicates a shared (free) IP.
Besides accessing via the hostname, you can also connect directly using this IP.

Finally, check the services:

```bash
fly services list
```

```bash
Services
PROTOCOL        PORTS           HANDLERS        FORCE HTTPS     PROCESS GROUP   REGIONS MACHINES
TCP             xxx => xxxx     [TLS]           False           app             iad     1
```

Ensure that `PORTS` and `HANDLERS` match your configuration.

### Test the Connection

At this point, the proxy should be running. Test it:

```bash
curl -v -x http://hostname -U 'user:password' https://ifconfig.me
```

## Configure Browser Proxy

In most cases, we only need a proxy for browser traffic rather than the entire operating system.
Configuring the proxy at the browser level also helps conserve bandwidth.

The recommended browser extension is **SwitchOmega**.

Happy hacking!!!

