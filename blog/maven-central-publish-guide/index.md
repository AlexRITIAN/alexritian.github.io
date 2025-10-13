---
authors: too
title: 将你的项目发布到 Maven Central 全指南（Gradle 篇）
date: 2025/10/13
tags: [springboot, maven, gradle]
toc_max_heading_level: 6
keywords: [springboot, maven, java, gradle, spring]
---

![bk](./bk.png)

当我们在项目中开发了某些通用的工具类或依赖库时，往往希望其他人也能直接引用这些成果。  
这时，我们有两种选择：

- **私有发布**：将依赖发布到团队或公司内部的私有 Maven 仓库，供内部项目共享使用；
- **公开发布**：将依赖发布到互联网上的公共仓库，例如 [Maven Central](https://central.sonatype.com)，让全球开发者都可以使用你的开源成果。

本文将详细介绍如何将你的 Gradle 项目发布到 **Maven Central**。

<!-- truncate -->

## 🧰 前期准备

在开始发布前，除了已经写好的项目，你还需要准备以下内容：

- 一个 **GitHub 账号**（推荐）
- 一个 **Maven Central 账号**
	- `User Token`（用于发布认证）
	- `namespace`（对应你的 `groupId`）
- 一对 **GPG 密钥**（用于签名）

:::tip 💡 **小贴士**  
 使用 GitHub 账号注册 Maven Central 是最便捷的方式。Maven Central 会自动为你创建一个 `io.github.<GitHub 用户名>` 的 `namespace`，并自动完成验证。
:::

---

## 🔐 生成 User Token

Maven Central 不再使用账号密码，而是通过 **User Token** 进行发布认证。  

1. 登录 [Maven Central](https://central.sonatype.com)  
2. 点击左上角的用户名  
3. 选择 **View User Tokens**  
4. 点击 **Generate User Token** 按钮

:::caution ⚠️ **注意**  
Token 只会在生成后的页面显示一次，请务必及时保存 Token，一旦关闭将无法再次查看。
:::

---

## 🧭 Win11 安装 GPG

:::tip 
💡 如果你的系统中已经安装了 Git，那么 Git Bash 中自带 `gpg` 命令，可直接跳过安装步骤。
:::

1. 前往 [Gpg4win 官网](https://gpg4win.org/download.html) 下载并安装  
2. 安装完成后，`gpg` 会自动加入 PATH  
3. 通过以下命令验证安装是否成功：

```bash
gpg --version
```

如输出以下内容，则说明安装成功：

```
gpg (GnuPG) 2.4.8
libgcrypt 1.11.1
...
```

---

## 📝 创建 GPG 密钥

Maven Central 要求发布的制品必须使用 GPG 签名，因此我们需要创建一对密钥：

```bash
gpg --full-generate-key
```

:::tip
📌 推荐选择加密算法：`RSA and RSA`  
📌 `Real Name` 与 `Email` 建议使用 GitHub 的用户名与邮箱  
📌 设置的密码（passphrase）请务必妥善保存，后续签名会用到
:::

---

## 🌐 发布 GPG 公钥

发布公钥的目的是让 Maven Central 和其他用户能够验证你发布的签名文件。

```bash
gpg --keyserver keyserver.ubuntu.com --send-keys <key id>
```

`key id` 可在生成密钥后命令输出的 `pub` 一行中找到，例如：

```
pub   ed25519 2024-10-23 [SC]
      6CFB87829FC240EFA68E5F05E54502EB8D393E8C
```

其中 `6CFB87829FC240EFA68E5F05E54502EB8D393E8C` 即为 `key id`。

支持的 Key Server 包括：
- `keyserver.ubuntu.com` ✅（推荐）
- `keys.openpgp.org`
- `pgp.mit.edu`

---

## ⚙️ 配置 `gradle.properties`

### 获取 Key ID（短 ID）

Maven Central 要求配置 **8 位短 Key ID**：

```bash
gpg --list-keys --keyid-format short
```

输出示例：

```
pub   ed25519/8D393E8C 2024-10-23 [SC]
      6CFB87829FC240EFA68E5F05E54502EB8D393E8C
```

这里的 `8D393E8C` 即为短 ID。


将配置写入本地的 `gradle.properties` 文件中：

```properties
mavenCentralUsername=<user token name>
mavenCentralPassword=<user token>

signing.gnupg.keyName=<key id>
signing.gnupg.executable=gpg
signing.gnupg.passphrase=<password>
```

---

## 🚀 配置 Gradle 发布插件

首先在 `build.gradle.kts` 中添加插件：

```kotlin
plugins {
    signing
    id("com.vanniktech.maven.publish") version "0.30.0"
}
```

:::tip
📘 官方尚无 Gradle 官方发布插件，目前推荐使用社区的 [vanniktech/gradle-maven-publish-plugin](https://vanniktech.github.io/gradle-maven-publish-plugin/what/)
:::

---

## 🌍 配置 Maven Central 发布信息

```kotlin
mavenPublishing {
    publishToMavenCentral(SonatypeHost.CENTRAL_PORTAL)
    signAllPublications()
}
```

`SonatypeHost` 枚举：
- `DEFAULT`: https://oss.sonatype.org
- `S01`: https://s01.oss.sonatype.org
- `CENTRAL_PORTAL`: https://central.sonatype.com ✅（推荐）

---

## 🧾 配置 POM 元数据

Maven Central 要求 POM 必须包含以下信息：

- 项目坐标（group、name、version）
- 项目名称、描述、URL
- License 信息
- 开发者信息
- SCM（源码仓库）信息

示例配置：

```kotlin
mavenPublishing {
    coordinates(project.group.toString(), project.name, project.version.toString())

    pom {
        name.set("${project.group}:${project.name}")
        description.set("This project provides runtime support libraries required by Codegen-gradle-plugin")
        url.set("https://github.com/AlexRITIAN/codegn-gradle-plugin-runtime")

        licenses {
            license {
                name.set("The Apache License, Version 2.0")
                url.set("http://www.apache.org/licenses/LICENSE-2.0.txt")
            }
        }

        developers {
            developer {
                id.set("AlexRITIAN")
                name.set("Too_Young")
                email.set("yhritianfq@gmail.com")
            }
        }

        scm {
            url.set("https://github.com/AlexRITIAN/codegn-gradle-plugin-runtime")
            connection.set("scm:git:git://github.com/AlexRITIAN/codegn-gradle-plugin-runtime")
            developerConnection.set("scm:git:ssh://git@github.com:AlexRITIAN/codegn-gradle-plugin-runtime.git")
        }
    }
}
```

---

## 📨 发布到 Maven Central

完成上述所有步骤后，就可以愉快地执行发布命令了：

```bash
./gradlew publish
```

或者：

```bash
./gradlew publishAllPublicationsToMavenCentralRepository
```

:::caution
⚠️ Maven Central Portal **不支持 SNAPSHOT 版本** 发布，请确保版本号不是 `-SNAPSHOT` 结尾。
:::

发布成功之后，登录到[Maven Central](https://central.sonatype.com/publishing),找到刚发布的项目，点击一下`Publish`,等待几分钟后，项目状态为`Published`就说名已经成功发布到maven仓库了，可以被其他项目使用了。
---

## 🏁 结语

至此，你已经完成了从准备工作、GPG 配置、Gradle 插件设置到最终发布的全过程！  
一旦发布成功，全球的开发者都可以通过以下方式直接使用你的库👇

```kotlin
implementation("io.github.<your-username>:your-artifact:<version>")
```

这不仅能让你的项目获得更多用户，也能帮助你在开源社区中树立影响力。  
未来你还可以结合 GitHub Actions 实现 **自动发布**，进一步提升开发效率 🚀
