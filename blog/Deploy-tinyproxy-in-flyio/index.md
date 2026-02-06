---
authors: too
title: 在Fly.io中部署tinyproxy
date: 2024/10/15
tags: [docker]
toc_max_heading_level: 6
keywords: [docker,tinyproxy,fly.io]
---
![bk](./bk.png)

利用Fly.io的免费额度部署tinyproxy，获得免费vpn
<!-- truncate -->

[Fly.io](https://fly.io/) 是一个让你像部署本地 Docker 一样，把后端服务直接跑到全球边缘节点上的云平台。

每个账号有免费的3台 `shared-cpu-1x 256mb` 虚机(Firecracker microVM), 每个月`30GB`流量，`3G`存储资源。 

我就是通过***白嫖***这些免费资源来搭建一个**Proxy**， 我们选择是通过 `tinyproxy` 来实现代理服务

:::tip
国内小伙伴需要注意：注册账号需要绑定信用卡，需要支持境外支付的卡
:::

## 准备

我们需要准备3个文件

- `tinyproxy.conf`: tinyproxy的配置文件
- `Dockerfile`: Docker构建文件
- `fly.toml`: fly中应用配置文件

:::tip
推荐准备一个应用专用目录，将3个文件都放在目录中，并且保持在同一级。 
如果已经有部署到fly的应用，请不要混用目录。
:::

### tinyproxy.conf

将下列内容写入 `tinyproxy.conf`

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

:::tip
`user` & `password` 请妥善设置，尤其是`password`尽量复杂一些。 
:::


### Dockerfile

将下列内容写入 `Dockerfile`

```dockerfile
FROM alpine:3.19

RUN apk add --no-cache tinyproxy

COPY tinyproxy.conf /etc/tinyproxy/tinyproxy.conf

EXPOSE 8888

CMD ["tinyproxy", "-d", "-c", "/etc/tinyproxy/tinyproxy.conf"]
```

:::tip
不推荐使用 `latest` 标签，避免后续部署拉取最新镜像后，某些配置项失效导致应用起不来。
:::

### fly.toml

将下列内容写入 `fly.toml`

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

:::tip
 `app` 是配置应用名称，这个名称是全局唯一，通用的名字非常容易冲突。可以不填由fly随机生成，或者设置一些复杂名字
:::

## 部署

文件都准备之后我们就可以开始部署了，我们通过 `flyctl` 进行部署操作。

### 安装flyctl

#### macOS

```shell
brew install flyctl
```

或者 

```shell
curl -L https://fly.io/install.sh | sh
```

#### Linux

```shell
curl -L https://fly.io/install.sh | sh
```

:::tip
 如果是`fish`这种非`bash`的**shell**,执行安装脚本之后，脚本会询问是否自动设置fly环境变量，请选择`N`,因为安装脚本是bash的，fish中执行会报错。 需要手动执行命令来设置环境变量。
:::

#### Windows

```shell
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

:::tip
windows推荐在`wsl`中安装`flyctl`, ~~~我就是在wsl-arch中操作的~~~
:::

### 登录fly

首先我们需要先`login`才可能继续后面的操作

```bash
fly auth login
```

:::tip
如果是在`wsl`中执行的，会出现无法打开浏览器的提示，提示会给一个地址，手动打开浏览器，复制地址并访问，即可完成登录
:::

### 创建应用

我们需要先**fly**中创建一个应用。

:::note
 `fly` 命令需要在`fly.toml`等文件所在目录执行
:::

```bash
fly lauch --no-depoly
```

因为我们已经提前创建了`fly.toml`文件，命令会提示我们已有文件。

如果文件中配置了app名字，如果名字冲突命令会出现冲突提示

### 部署应用

```bash
fly depoly
```

执行命令，fly会开始build镜像，然后推送镜像，最用启动应用。

:::warning
 部署完成之后，会提示我们是否需要配置IP地址，这里要选`N`
 默认给配置的是**专用IP地址**，是计费的。我们要用免费**共享IP地址**
:::

### 配置免费IP地址

```shell
fly ips allocate-v4 --shared
```

这里一定要加`--shared`，否则就是专用地址.

### 检查状态

首先查看应用状态

```bash
fly status
```

:::tip
如果你有多个应用，为了查看指定应用需要添加`-a app-name`。 
下面的命令也是同理
:::

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

app信息中我们需要关注 `Hostname` 和 `Mechines` 

- `Hostname` : 是fly给我们分配的域名，可以通过这个域名访问到我们的代理
- `Mechines` : 是我们的代理虚机是否运行正常，以及虚机数量，避免超额

:::tip
如果超额，可以通过下列命令缩减数量, count面数量是机器总数，1表示缩减到1台机器
```bash
fly scale count 1 -a app-name
```
:::

接下来查看 `ip` 信息

```bash
fly ips list
```

```bash
VERSION IP              TYPE                    REGION  CREATED AT
v4      xx.xxx.xx.xxx  public ingress (shared)         Jan 1 0001 00:00
```

Type带`shared`就是共享IP地址。 除了hostname访问，我们也可以通过ip直接访问。


最后查看一下 `services` 信息

```bash
fly services list
```

```bash
Services
PROTOCOL        PORTS           HANDLERS        FORCE HTTPS     PROCESS GROUP   REGIONS MACHINES
TCP             xxx => xxxx     [TLS]           False           app             iad     1
```

这里我们就关注一下 `PORTS` 和 `HANDLERS` 是否和我们配置文件中的一致


### 测试连接

这个时候我们的代理已经成功启动了，现在测试一下是否可用

```bash
curl -v -x http://hostname -U 'user:password' https://ifconfig.me
```


## 浏览器配置代理

大部分情况我们只是需要代理来访问一些网站，并不需要OS全部走代理。 这时我们只需要在浏览器上配置代理，这样也能节省一些流量

这里推荐使用 `SwitchOmega` 插件。 


Happy hacking!!!