---
authors: too
title: Learning SpringBoot + Temporal --- 01
date: 2026/01/27
tags: [springboot, temporal]
toc_max_heading_level: 6
keywords: [springboot, temporal, ai, agent]
---

![bk](./bk.png)

---

Learning Spring Boot + Temporal to build Agent workflows: first write a small demo to verify environment connectivity

---

<!-- truncate -->

## I. Learning Goals and Overall Environment

### Learning Goals

* Run **Temporal + Spring Boot** end-to-end locally
* Understand Temporal’s basic model of **Worker / Workflow / Activity**
* Solve real networking and debugging issues in a **WSL2 + Windows hybrid environment**
* Obtain a reusable minimal runnable demo and troubleshooting experience

### Actual Environment

* OS: Windows 11
* Subsystem: WSL2 (Arch Linux)
* Shell: fish
* Java: Java 25
* Build tool: Gradle (9.3.0)
* Temporal Server: running in WSL (CLI dev server)
* Spring Boot (3.5.10): running on the Windows host

---

## II. Installing Temporal CLI (WSL2 / Arch)

### 1. Use the officially recommended installation method

Run in **WSL (Arch)**:

```bash
curl -sSf https://temporal.download/cli.sh | bash
```

It will be installed by default to:

```
~/.temporalio/bin/temporal
```

### 2. Configure PATH (fish shell)

```fish
set -U fish_user_paths $HOME/.temporalio/bin $fish_user_paths
```

Verify:

```bash
temporal --version
```

If the version is printed correctly, the CLI installation is successful.

---

## III. Starting the Temporal Dev Server (learning mode)

### 1. Start the server

```bash
temporal server start-dev
```

This command will:

* Start a local Temporal Server (Frontend / History / Matching combined)
* Listen on `127.0.0.1:7233` by default
* Automatically create the `default` namespace
* Be suitable for learning and local development (not production)

### 2. Verify server status

```bash
temporal operator cluster health
```

Output:

```
SERVING
```

This means the Temporal Server is providing services normally.

---

## IV. Minimal Spring Boot + Temporal Worker Demo

### 1. Dependencies and technology selection

* Spring Boot: 3.5.10
* Gradle: 9.3.0
* Temporal Starter:

  ```gradle
  implementation "io.temporal:temporal-spring-boot-starter:1.32.1"
  ```

### 2. Key configuration in `application.yml`

```yaml
spring:
  application:
    name: demo

spring.temporal:
  namespace: default
  connection:
    target: 127.0.0.1:7233

  workers:
    - task-queue: greeting-task-queue
      workflow-classes:
        - org.ai.demo.GreetingWorkflowImpl
      activity-beans:
        - greetingActivityImpl
```

**Key points:**

* The configuration prefix must be `spring.temporal` (not `temporal`)
* The worker `task-queue` must exactly match the client’s configuration

---

## V. Correct Way to Write Workflow / Activity (critical pitfall)

### Wrong approach (application will fail to start)

```java
// ❌ Calling in constructor or field initialization
Workflow.newActivityStub(...)
```

It will throw:

```
Called from non workflow or workflow callback thread
```

### Correct approach (must follow)

```java
@Override
public String greet(String name) {
    GreetingActivity activity =
        Workflow.newActivityStub(
            GreetingActivity.class,
            ActivityOptions.newBuilder()
                .setStartToCloseTimeout(Duration.ofSeconds(10))
                .build()
        );
    return activity.compose(name);
}
```

**Core principle:**

> All `Workflow.*` APIs can only be called inside the Workflow execution thread.
> They must not be called during Spring Bean initialization.

---

## VI. Triggering the Workflow via REST API (synchronous validation)

```java
@PostMapping("/greet")
public String greet(@RequestParam String name) {
    GreetingWorkflow workflow =
        client.newWorkflowStub(
            GreetingWorkflow.class,
            WorkflowOptions.newBuilder()
                .setTaskQueue("greeting-task-queue")
                .build()
        );
    return workflow.greet(name);
}
```

Used to verify:

* Whether `WorkflowClient` is injected successfully
* Whether the Worker is polling the task queue
* Whether Workflow / Activity are actually executed

---

## VII. Full Summary of WSL2 ↔ Windows Network Debugging

### 1. Problem symptoms

* Spring Boot listens on `0.0.0.0:8080` on Windows
* In WSL, run:

  ```bash
  curl http://localhost:8080
  ```

  **Connection fails**

### 2. Key understanding (very important)

* WSL2 is an **independent virtual machine**
* `localhost` in WSL ≠ `localhost` in Windows
* WSL → Windows must use the **Windows host IP in the WSL NAT network**

---

### 3. Wrong but common attempt

```bash
awk '/nameserver/ {print $2}' /etc/resolv.conf
```

The obtained IP (e.g., `xx.xxx.xx.xx`):

* Is not guaranteed to access Windows user-space services
* In this environment, the connection was **refused**

---

### 4. Correct and stable solution (fish shell)

#### Get the Windows host IP (recommended)

```fish
set WIN_HOST (ip route | awk '/default/ {print $3; exit}')
```

Example output:

```
172.25.112.1
```

#### Access Spring Boot via this IP

```fish
curl -v -X POST "http://$WIN_HOST:8080/api/greet?name=Alex"
```

Successful response:

```
HTTP/1.1 200
Hello Alex @2026-01-27T09:20:39.294459200Z
```

---

## VIII. Facts Confirmed from the Successful Result

From this single successful `curl` response, we can **confirm all of the following**:

1. WSL → Windows network link is working
2. Spring Boot service is externally accessible
3. The Controller works correctly
4. `WorkflowClient` has successfully connected to the Temporal Server
5. The Worker is polling the task queue
6. The full flow of Workflow → Activity → result return is working

This is a **real Temporal Workflow execution**, not a fake success.

---

## IX. Complete Call Chain Review (one successful request)

```
WSL curl
  ↓
Windows Spring Boot (/api/greet)
  ↓
WorkflowClient
  ↓
Temporal Server (WSL, 7233)
  ↓
Worker polls task queue
  ↓
Workflow execution
  ↓
Activity execution
  ↓
Result returned
```

---

## X. Recommended Daily Development Habits (WSL2 + fish)

```fish
# Get Windows host IP (most reliable)
set WIN_HOST (ip route | awk '/default/ {print $3; exit}')

# Call the service running on Windows
curl http://$WIN_HOST:8080
```

Avoid relying on:

* `localhost`
* the nameserver in `/etc/resolv.conf`
* PowerShell’s `curl` alias
