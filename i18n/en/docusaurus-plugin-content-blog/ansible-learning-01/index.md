---
authors: too
title: Ansible Study Notes - 01
date: 2025/01/10
tags: [ansible]
toc_max_heading_level: 6
keywords: [ansible]
---

![bk](./bk.png)

以下是翻译并润色后的英文版本：

---

## What is Ansible?

Ansible is an open-source automation tool designed to simplify IT infrastructure management, application deployment, and task automation.

Before diving into Ansible, let's familiarize ourselves with some core concepts:

- **`Control node`**: A machine where Ansible is installed and commands are executed. From the control node, we can manage and operate multiple machines.
- **`Managed node`**: The remote machine or target being managed. These are the servers or devices you wish to operate on.
- **`Inventory`**: A way to group managed machines for easier management.
- **`Playbook`**: A blueprint for automation, defining and orchestrating the tasks to be performed.

<!-- truncate -->

---

## Getting Started

Let’s write a simple Ansible script to experience the basics of Ansible.

### Prerequisites

- A machine (Linux/Windows/macOS), either a PC or a server
- A Linux or Windows server

---

## Installing Ansible

First, we need to install Ansible on the control node.

### Check Python Version

Run one of the following commands:

```bash
python3 -V
```

or 

```bash
python -V
```

Sample output:

```bash
Python 3.9.18
```

:::note
Ansible requires **Python 3**.
:::

:::tip
On Rocky Linux 9, the default version is `Python 3.9.x`.
:::

### Verify pip Installation

Run:

```bash
python3 -m pip -V
```

If pip is installed, you’ll see its version:

```bash
pip 21.2.3 from /usr/local/lib/python3.9/site-packages/pip (python 3.9)
```

If not, you'll see an error:

```bash
/bin/python3: No module named pip
```

To install pip:

```bash
python3 -m ensurepip --default-pip
```

Example output:

```bash
Successfully installed pip-21.2.3
```

### Install Ansible

Run the following command:

```bash
python3 -m pip install --user ansible
```

### Install the pywinrm Module

If you plan to manage Windows servers with Ansible, install the `pywinrm` module:

```bash
python3 -m pip install pywinrm
```

---

## Creating an Inventory

### What Is an Inventory File?

An **inventory file** in Ansible defines the hosts to manage and their connection details. It is typically written in YAML or INI format and specifies the machines Ansible will manage and how to connect to them.

Inventory files include:

- **Host groups**: Categories like `windows` or `linux`.
- **Hosts**: Specific machines or servers, including connection details.

Create an `inventory.yaml` file as follows:

```yaml
windows:
  hosts:
    win01:
      ansible_host: 1.1.1.2
      ansible_user: username
      ansible_password: password
      ansible_connection: winrm
      ansible_winrm_transport: basic
      ansible_winrm_server_cert_validation: ignore
    win02:
      ansible_host: 1.1.1.3
      ansible_user: username
      ansible_password: password
      ansible_connection: winrm
      ansible_winrm_transport: basic
      ansible_winrm_server_cert_validation: ignore

linux:
  hosts:
    linux01:
      ansible_host: 1.1.1.5
      ansible_user: username
```

Key details:

- `windows` and `linux` are group names.
- `win01`, `win02`, and `linux01` are hostnames.
- **Ansible keywords**:
  - `ansible_user`: The username for connection.
  - `ansible_password`: The password for connection.
  - `ansible_connection`: Connection type (e.g., SSH or WinRM).

:::note
Linux hosts don’t require `ansible_password` if you use SSH keys. If SSH keys are not set up, you can provide a password instead.
:::

### Verify Inventory Syntax

Run:

```bash
ansible-inventory -i inventory.yaml --list
```

You should see output like this:

```json
{
  "all": {
    "children": ["ungrouped", "windows", "linux"]
  },
  "windows": {
    "hosts": ["win01", "win02"]
  },
  "linux": {
    "hosts": ["linux01"]
  }
}
```

:::tip
`all` and `ungrouped` are default Ansible groups. Hosts without explicit groups are assigned to `ungrouped`.
:::

### Test Connectivity

Run:

```bash
ansible windows -m win_ping -i inventory.yaml
ansible linux -m ping -i inventory.yaml
```

Sample output:

```bash
win01 | SUCCESS => { "ping": "pong" }
linux01 | SUCCESS => { "ping": "pong" }
```

---

## Writing a Playbook

A **playbook** is a collection of instructions and logic for tasks to execute on servers.

Here’s an example `playbook.yaml`:

```yaml
- name: Upload file to Windows servers
  hosts: windows
  tasks:
    - name: Check if file exists
      ansible.builtin.win_stat:
        path: "C:\\Users\\test\\file.txt"
      register: file_stat

    - name: Upload file if not present
      ansible.builtin.win_copy:
        src: "file.txt"
        dest: "C:\\Users\\test\\file.txt"
      when: not file_stat.stat.exists

- name: Upload file to Linux servers
  hosts: linux
  tasks:
    - name: Check if file exists
      ansible.builtin.stat:
        path: "/home/test/file.txt"
      register: file_stat

    - name: Upload file if not present
      ansible.builtin.copy:
        src: "file.txt"
        dest: "/home/test/file.txt"
      when: not file_stat.stat.exists
```

### Explanation

1. **Windows Section**:
   - Checks if the file exists using `win_stat` and registers the result.
   - Uploads the file only if it doesn’t exist (`when: not file_stat.stat.exists`).

2. **Linux Section**:
   - Uses the `stat` module to check the file status.
   - Copies the file conditionally if it’s missing.

### Run the Playbook

Place a `file.txt` in the same directory and execute:

```bash
ansible-playbook playbook.yaml -i inventory.yaml
```

Output:

```bash
PLAY [Upload file to Windows servers] ...

TASK [Upload file if not present] ...
changed: [win01]

PLAY [Upload file to Linux servers] ...

TASK [Upload file if not present] ...
changed: [linux01]
```

You’ve now successfully executed a basic Ansible script!

**Happy Coding!** 🎉