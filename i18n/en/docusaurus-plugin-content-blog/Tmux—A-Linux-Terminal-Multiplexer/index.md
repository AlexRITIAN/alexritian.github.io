---
authors: too
title: Tmux---A Linux Termainal Multiplexer
date: 2024/06/28
tags: [linux, tmux]
toc_max_heading_level: 6
keywords: [linux, tmux, ssh]
---

![bk](./bk.png)

---
In the process of remotely connecting to a server via **SSH**, we may encounter situations where a command is running but the connection is suddenly interrupted, or we have to disconnect for some reason. However, we want the command to continue running after the connection is closed, and we also want to be able to view its output after reconnecting. In such cases, we can achieve this by using a **terminal multiplexer** — `tmux`.

---

<!-- truncate -->

## Basic Concepts

* **Session**: A tmux instance that carries all content

* **Window**: Similar to a browser tab

* **Pane**: Split areas within a window

**SSH** disconnection and reconnection are handled through a `Session`. Each `Session` can contain multiple `Window`s, and each `Window` can be split into multiple `Pane`s.

---

## Installing tmux

### Debian / Ubuntu Series

```bash
sudo apt update
sudo apt install -y tmux
```

### CentOS 7 / Rocky 8+

```bash
sudo yum install -y tmux
```

Or on newer systems:

```bash
sudo dnf install -y tmux
```

### SUSE / openSUSE Series

```bash
sudo zypper install tmux
```

:::note
On some SUSE 12 systems, `tmux` cannot be installed. In this case, you can use `screen` as an alternative, or try installing tmux from source.
:::

### Alpine Linux (Common in Container Environments)

```bash
apk add tmux
```

### Arch Linux

```bash
sudo pacman -S tmux
```

---

## Verifying tmux

```bash
tmux -V
```

---

## Basic Operations

Within a `Session`, **almost all operations** in tmux are triggered through a ***prefix key***.

* Default prefix key: `Ctrl+b`

The key sequence is as follows:

> **Ctrl+b → release → then press another key**

---

### Session

#### Creating a Session

All operations are performed within a `Session`, so we first need to create one.

```bash
tmux new -S <name>
```

This creates a named `Session`.

:::tip
It is highly recommended to use `-S` to create a named `Session` for easier management.
If you don’t want to specify a name, simply run the command without parameters:

```bash
tmux
```
:::

#### Listing All Sessions

View all currently active `Session`s:

```bash
tmux ls
```

#### Reattaching to a Session

Reconnect (resume) a `Session`:

```bash
tmux attach -t <name>
```

:::tip
If there is only one `Session`, you can use the shorthand:

```bash
tmux attach
```
:::

#### Detaching from a Session (The Soul of tmux)

Since this operation is performed inside a `Session`, it requires the ***prefix key***:

```bash
Ctrl+b, d
```

This operation does not close (terminate) the `Session`. When you need to close an **SSH** connection, you can detach from the `Session` using this command.

#### Closing a Session

When all `Window`s are closed, the `Session` will automatically terminate.

---

### Window

After entering a `Session`, there is a default `Window` with index **0**. Let’s see how to operate on a `Window`.

#### Creating a Window

```bash
Ctrl+b c
```

The index of newly created `Window`s will increment.

:::tip
If you have three `Window`s with indices 0, 1, and 2, and you close window 1, window 2 will still keep its index. When you create a new window afterward, it will take index 1.
:::

#### Switching Windows

* Next: `Ctrl+b n`

* Previous: `Ctrl+b p`

* Specify index: `Ctrl+b 0` ～ `Ctrl+b 9`

:::tip
The maximum number of `Window`s is not limited to **9**.
However, windows beyond **9** cannot be switched to using `Ctrl+b + number`.
:::

#### Listing Windows

When there are many `Window`s, switching sequentially may not be efficient. In this case, you can quickly locate a window from the list.

#### Renaming a Window

```bash
Ctrl+b ,
```

Give a `Window` a meaningful name to make it easier to identify during use.

:::tip
By default, when no command is running, a `Window` is named after the shell, such as **bash**, **zsh**, or **fish**.
If a command is running, the window name will display the running command.
:::

#### Closing a Window

```bash
exit
```

Typing **exit** will close the current `Window`.

---

### Pane

A `Pane` allows you to split a window into multiple areas. You can split panes vertically or horizontally, and by repeatedly splitting, you can achieve various layouts.

:::tip
`Pane` splitting operations are applied to the current `Pane`.
Each `Window` has one `Pane` by default.
:::

#### Vertical Split

```bash
Ctrl+b %
```

This splits the current `Pane` into two panes side by side (left and right).

#### Horizontal Split

```bash
Ctrl+b "
```

This splits the current `Pane` into two panes stacked vertically (top and bottom).

#### Closing the Current Pane

```bash
Ctrl+b x
```

tmux will prompt you for confirmation before closing.

#### Automatic Layout Adjustment

```bash
Ctrl+b Space
```

When you don’t want to **fine-tune** layouts manually, you can use **automatic layouts** to save mental effort.

:::tip
`Space` refers to the spacebar.
Pressing it repeatedly cycles through the *5* built-in tmux layouts.
:::

1. **Tiled**: Panes are tiled based on quantity. Each row contains as many panes as possible; extra panes go into the last row, and the last pane occupies all remaining space.
2. **Even Vertical**: All panes are arranged from left to right, each with equal size.
3. **Even Horizontal**: All panes are arranged from top to bottom, each with equal size.
4. **Main Horizontal**: One pane is placed at the top, with other panes arranged horizontally below it. The main pane occupies more height.
5. **Main Vertical**: One pane is placed on the left, with other panes arranged vertically on the right. The main pane occupies more width.

---

### Copy Mode (Viewing Historical Output)

By default, `tmux` does not support scrolling with the **mouse wheel**. To view historical output, you need to enter **copy mode**.

```bash
Ctrl+b [
```

After entering copy mode, you can scroll using the `Arrow keys` / `Page Up` / `Page Down`.

Press `q` to exit.

---

### Killing a Session (Use with Caution)

```bash
tmux kill-session -t <name>
```

It is not recommended to end a `Session` this way. Once a `Session` is killed, it cannot be recovered. Please operate with caution.
If you want to close a `Session`, you can close all `Window`s instead. When all `Window`s are closed, the `Session` will exit automatically.

At this point, we have mastered the basic operations of `tmux`. Wish you a pleasant experience~

Happy hacking!!!

:::tip A Word
Rippling with the waves for thousands of miles, where is the spring river without moonlight! — *“Spring River, Flower, Moon, Night”* · Tang Dynasty · Zhang Ruoxu
:::

<details>
  <summary>Full Text</summary>
The spring river tides rise to meet the sea,  
On the sea the bright moon rises with the tide.  
Rippling with the waves for thousands of miles,  
Where is the spring river without moonlight!  
The river winds around fragrant islets,  
Moonlight on flower forests looks like falling frost.  
In the empty air, flowing frost seems unseen,  
On the shoals, white sand cannot be discerned.  
River and sky merge in one pure hue,  
A solitary bright moon hangs in the vast sky.  
Who by the river first beheld the moon?  
In what year did the moon first shine upon mankind?  
Life passes on generation after generation,  
Yet the river moon looks the same year after year.  
I wonder whom the river moon awaits,  
Only seeing the long river sending flowing waters away.  
A single cloud drifts leisurely,  
Endless sorrow at Green Maple Islet.  
Who tonight is the boatman adrift?  
Where is the longing at the moonlit tower?  
Pitifully the moon lingers over the tower,  
Shining on the mirror stand of the departed.  
Through jade doors and curtains it cannot be rolled away,  
From washing stones it brushes past again.  
At this moment we gaze at each other but cannot hear,  
I wish to follow the moonlight and shine upon you.  
Wild geese fly far, yet their light does not pass,  
Fish and dragons leap, water forming patterns.  
Last night I dreamed of falling flowers by a quiet pool,  
Pitiful that spring is half gone and I have not returned home.  
The river carries spring away, soon to be gone,  
The moon sinks westward over the river pool.  
The slanting moon sinks deep into sea mist,  
Endless roads toward Jieshi and Xiaoxiang.  
Who knows how many return by moonlight?  
The setting moon stirs emotion across the river trees.
</details>
