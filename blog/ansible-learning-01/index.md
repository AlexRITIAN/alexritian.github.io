---
authors: too
title: Ansible学习笔记-01
date: 2025/01/10
tags: [ansible]
toc_max_heading_level: 6
keywords: [ansible]
---

![bk](./bk.png)

## 什么是Ansible

Ansible 是一个开源的自动化工具，用于简化 IT 基础架构的配置管理、应用程序部署和任务自动化。

开始使用Ansible之前，让我们先了解几个核心概念.

- `Control node` : 安装Ansible，并且执行Ansible命令的机器。通过Ansible我们可以在controle node上对多台机器进行操作
- `Managed node` : 远程机器，被管理的机器。 我们需要操作的机器
- `inventroy` : 对被管理机器进行分组，方便管理
- `playbook` : 自动化蓝图，定义，编排需要进行的操作

<!-- truncate -->

## 上手试试

写一个简单的ansbile脚本，体验一下Ansible的基础功能

### 环境准备

 - 一台机器(linux/windows/mac), PC或者服务器都可以
 - linux或者windows服务器

## 安装Ansible

首先我们需要在控制节点(control node)上安装Ansible

### 确认python版本

```bash
python3 -V
```

或者

```bash
python -V
```

输出：

```bash
Python 3.9.18
```

:::note
Ansible需要使用`python 3`
:::

:::tip
如果是Rocky linux 9，系统默认的版本是 `python 3.9.x`
:::

### 确认pip版本

```bash
python3 -m pip -V
```

如果出现版本信息，说明 `pip` 已安装

```bash
pip 21.2.3 from /usr/local/lib/python3.9/site-packages/pip (python 3.9)
```

如果出现 `No module named pip`, 我们需要先安装 `pip`

```bash
/bin/python3: No module named pip
```

安装 `pip`

```bash
python3 -m ensurepip --default-pip
```

```bash
Looking in links: /tmp/tmpa0mr30_1
Requirement already satisfied: setuptools in /usr/lib/python3.9/site-packages (53.0.0)
Processing /tmp/tmpa0mr30_1/pip-21.2.3-py3-none-any.whl
Installing collected packages: pip
Successfully installed pip-21.2.3
WARNING: Running pip as the 'root' user can result in broken permissions and conflicting behaviour with the system package manager. It is recommended to use a virtual environment instead: https://pip.pypa.io/warnings/venv
```

### 安装Ansible

```bash
python3 -m pip install --user ansible
```

### 安装pywinrm模块

Ansible管理windows服务器，需要使用到python的 `pywinrm` 模块

```bash
python3 -m pip install pywinrm
```

## 创建inventory

### 什么是Inventory文件
Ansible 的 **Inventory 文件** 用于定义管理的主机以及它们的连接信息。这个文件通常以 YAML 或 INI 格式编写，告诉 Ansible 哪些主机需要进行管理，以及如何连接到这些主机。

Inventory 文件主要包含以下部分：

- **主机组**：主机的分类，例如 `windows` 或 `linux`。
- **主机**：具体的服务器或机器，通常包括主机名和连接信息。



现在我们来创建一个 `inventory.yaml` 文件

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
    win03:
      ansible_host: 1.1.1.4
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

- `windows` 和 `linux` 是组的名字
- `win01`,`win02`,`win03`,`linux01`是服务器的名字，或者说节点的名字
- `ansible_`开头的为关键字
	- `ansible_user` : 连接服务器使用的用户名
	- `ansible_password` : 连接服务器使用的密码
	- `ansible_connection` : 连接方式
	- `ansible_winrm_` : winrm连接的配置参数

:::note
可以看到linux的服务器并没有配置password，因为我已经配置了ssh-key。如果没有没有配置过ssh-key，可以添加`ansible_password`或者配置ssh-key来省去配置密码
:::

:::tip
除了`ansible`关键字之外，也可以设置客制化的属性和对应的值
:::

写好`inventory`文件之后，我们可以先验证一下文件内容

```bash
ansible-inventory -i inventory.yaml --list
```

```bash
{
    "_meta": {
        "hostvars": {
            "linux01": {
                ...
            },
            "win01": {
                ...
            },
            "win02": {
                ...
            },
            "win03": {
                ...
            }
        }
    },
    "all": {
        "children": [
            "ungrouped",
            "windows",
            "linux"
        ]
    },
    "linux": {
        "hosts": [
            "linux01"
        ]
    },
    "windows": {
        "hosts": [
            "win01",
            "win02",
            "win03"
        ]
    }
}
```

:::tip
`all`，`ungrouped` 这两个组为`ansible`的默认组。
所有的组都会被配置到`all`组，当我们没有给host设置组的时候，这个host就会被配置到`ungrouped`组.
这两个默认组都可以直接在`playbook`中使用
:::

没有错误信息表示我们的内容语法上是正确的，下面让我测试一下联通性。

```bash
ansible windows -m win_ping -i inventory.yaml
ansible linux -m ping -i inventory.yaml
```

```bash
win03 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
win01 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}
win02 | SUCCESS => {
    "changed": false,
    "ping": "pong"
}

linux01 | SUCCESS => {
    "ansible_facts": {
        "discovered_interpreter_python": "/usr/bin/python"
    },
    "changed": false,
    "ping": "pong"
}
```

连接成功，现在我们就可以开始操作服务器了。

## 创建playbook

`playbook` 就是我们要对服务器所进行的操作的指令集合，操作顺序，操作逻辑都在这里定义。

创建一个`playbook.yaml`文件

### 基础概念

1. **Playbook**  
    Playbook 是多组任务的集合，定义了如何在目标主机上执行操作。包含多个Play

2. **Play**
    Play 是一组任务的集合，指定这组任务的目标主机。
    
2. **任务（Task）**  
    每个任务描述了一个具体操作，比如检查文件是否存在、上传文件等。
    
3. **模块（Module）**  
    Ansible 提供了很多模块，用于执行特定的任务，例如：
    
    - `win_stat`：用于检查 Windows 上文件的状态。
    - `stat`：用于检查 Linux 上文件的状态。
    - `win_copy`：用于将文件从控制机复制到 Windows 主机。
    - `copy`：用于将文件从控制机复制到 Linux 主机。

---

让我们通过一个简单的例子来了解一下playbook

```yaml
- name: Upload file to windows server
  hosts: windows
  tasks:
    - name: Check if the file exists on the remote server
      ansible.builtin.win_stat:
        path: "C:\Users\ark\Documents\test.txt"
      register: file_stat
  
    - name: Upload file if it does not exist
      ansible.builtin.win_copy:
        src: 'test.txt'
        dest: "C:\Users\ark\Documents\test.txt"
      when: not file_stat.stat.exists

- name: Upload file to linux server
  hosts: linux
  tasks:
    - name: Check if the file exists
      ansible.builtin.stat:
        path: "/home/basisadmin/test.txt"
      register: file_stat

    - name: Upload file if it does not exist
      ansible.builtin.copy:
        src: "test.txt"
        dest: "/home/basisadmin/test.txt"
	  when: not file_stat.stat.exists
```

### Playbook 分解讲解

#### 1. **Windows 文件上传部分**

```yaml
- name: Upload file to windows server
  hosts: windows
  tasks:
    - name: Check if the file exists on the remote server
      ansible.builtin.win_stat:
        path: "C:\Users\ark\Documents\test.txt"
      register: file_stat
  
    - name: Upload file if it does not exist
      ansible.builtin.win_copy:
        src: 'test.txt'
        dest: "C:\Users\ark\Documents\test.txt"
      when: not file_stat.stat.exists
```

##### 讲解：

1. `- name: Upload file to windows server`  
    定义一个 Play，目标主机组为 `windows`。
    
2. `hosts: windows`  
    指定此部分任务运行在 `windows` 主机组上（需要在 inventory 文件中定义该主机组）。
    
3. **检查文件是否存在**  
    使用 `win_stat` 模块检查目标路径 `C:\Users\ark\Documents\test.txt` 上的文件是否存在，并将结果存储到变量 `file_stat` 中。
    
4. **条件执行上传文件**  
    使用 `win_copy` 模块将本地文件 `test.txt` 上传到目标路径，但只在文件不存在时执行（`when: not file_stat.stat.exists`）。
    

---

#### 2. **Linux 文件上传部分**

```yaml
- name: Upload file to linux server
  hosts: linux
  tasks:
    - name: Check if the file exists
      ansible.builtin.stat:
        path: "/home/basisadmin/test.txt"
      register: file_stat

    - name: Upload file if it does not exist
      ansible.builtin.copy:
        src: "test.txt"
        dest: "/home/basisadmin/test.txt"
      when: not file_stat.stat.exists
```

##### 讲解：

1. `- name: Upload file to linux server`  
    定义另一个 Play，目标主机组为 `linux`。
    
2. `hosts: linux`  
    指定此部分任务运行在 `linux` 主机组上。
    
3. **检查文件是否存在**  
    使用 `stat` 模块检查目标路径 `/home/basisadmin/test.txt` 上的文件是否存在，并将结果存储到变量 `file_stat` 中。
    
4. **条件执行上传文件**  
    使用 `copy` 模块将本地文件 `test.txt` 上传到目标路径，条件同样是文件不存在时才执行。
    

在playbook.yaml所在的目录创建一个名字为`test.txt` 的文件

现在我们来运行一下

```bash
ansible-playbook playbook.yaml -i inventory.yaml
```

```bash
PLAY [Upload file to windows server] *******************************************************************************************************************************************************************************************************************

TASK [Gathering Facts] *********************************************************************************************************************************************************************************************************************************
ok: [win03]
ok: [win01]
ok: [win02]

TASK [Check if the file exists on the remote server] ***************************************************************************************************************************************************************************************************
ok: [win03]
ok: [win01]
ok: [win02]

TASK [Upload file if it does not exist] ****************************************************************************************************************************************************************************************************************
changed: [win03]
changed: [win01]
changed: [win02]

PLAY [Uploadfiletolinuxserver] *************************************************************************************************************************************************************************************************************************

TASK [Gathering Facts] *********************************************************************************************************************************************************************************************************************************
ok: [linux01]

TASK [Check if the file exists] ************************************************************************************************************************************************************************************************************************
ok: [linux01]

TASK [Upload file if it does not exist] ****************************************************************************************************************************************************************************************************************
changed: [linux01]

PLAY RECAP *********************************************************************************************************************************************************************************************************************************************
linux01                    : ok=3    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
win01                      : ok=3    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
win02                      : ok=3    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   
win03                      : ok=3    changed=1    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   

```


可以看到每个task在指定host上的运行情况，`ok` 表示运行成功， `changed` 表示运行成功，并且进行了对应的变更操作。登录到服务器上查看一下文件是否上传了。

到此我们已经可以执行简单的ansible脚本了！！！

Happy Coding !!!
