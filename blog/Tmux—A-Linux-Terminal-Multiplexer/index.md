---
authors: too
title: Tmux---Linux终端复用器
date: 2025/12/30
tags: [linux, tmux]
toc_max_heading_level: 6
keywords: [linux, tmux, ssh]
---

![bk](./bk.png)

---

在我们通过**SSH**远程到服务器上时候，可能会遇到正在运行命令，但是连接突然中断了，或者因为某些原因我们必须断开连接。但是我们想要命令在断开连接之后还能继续运行，并且在我们恢复连接之后还可以继续查看运行的输出，这个时候我们就可以通过**终端复用器** --- `tmux`来实现。

---

<!-- truncate -->

## 基本概念

- **Session**：一个 tmux 实例，承载所有内容
    
- **Window**：类似浏览器 Tab
    
- **Pane**：窗口内的分屏

**SSH**的断开和恢复都是通过`Session`来实现的，每个`Session`可以包含多个`Window`,每个`Window`中可以通过多个`Pane`来实现分屏。

---

## 安装tmux

### Debian / Ubuntu 系列

```bash
sudo apt update
sudo apt install -y tmux
```

### CentOS 7 / Rocky 8+

```bash
sudo yum install -y tmux
```

或在新系统上：
```bash
sudo dnf install -y tmux
```

### SUSE / openSUSE 系列

```bash
sudo zypper install tmux
```

:::note
有些SUSE12没有无法安装`tmux`，可以使用 `Screen`来平替。也可以尝试通过源代码安装的方式来安装
:::

### Alpine Linux（容器环境常见）

```bash
apk add tmux
```

### Arch Linux

```bash
sudo pacman -S tmux
```

---

## 验证tmux

```bash
tmux -V
```


---

## 基本操作

tmux在`Seesion`中 **几乎所有操作** 都通过一个***前缀键***触发。

- 默认前缀键：`Ctrl+b`
    

按法如下：

> **Ctrl+b → 松手 → 再按一个键**

---

### Session

#### 创建Session

所有的操作都是在 `Session` 中进行的，所以我们需要先创建一个 `Session`

```bash
tmux new -S <name>
```

创建一个带名字的`Session`

:::tip
这里强烈推荐使用 `-S` 来创建一个带有名字的的`Session`方便我们管理. 如果不想要指定名字，直接运行不带参数的命令即可
```bash
tmux
```
:::


#### 列出所有Session

查看当前存活的所有`Session`

```bash
tmux ls
```

#### 重连Session

重新(恢复)连接到`Session`

```bash
tmux attach -t <name>
```

:::tip
如果只有一个`Session`, 可以简写:
```bash
tmux attach
```
:::

#### 离开Session(灵魂操作)

因为是在`Session`中，所以操作需要用到***前缀键***
```bash
Ctrl+b, d
```

这个操作不会关闭(中断)`Session`, 这样在需要关闭**SSH**连接的时候，我们可通过这个操作来离开`Session`


#### 关闭Session

当所有`Window`都关闭了，`Session`自动关闭

---

### Window

在我们进入 `Session` 后会默认有一个 编号为 **0** 的 `window`。让我们来看看该如何操作 `Windwo`

#### 创建Window

```bash
Ctrl+b c
```

创建的 `Window` 编号会递增。

:::tip
如果你有3个`Window`,编号为 0,1,2。 当你关闭1号的时候，2号还是保持2号编号不变。这时你再创建新的窗口会使用1号编号。
:::

#### 切换Window

- 下一个：`Ctrl+b n`
    
- 上一个：`Ctrl+b p`
    
- 指定编号：`Ctrl+b 0` ～ `Ctrl+b 9`

:::tip
`Window`上限不是**9**，只是超过**9**之后的`Window`就不能通过`Ctrl+b 序号` 来切换了。
:::

#### 列出Window

`Window` 太多的时候通过切换操作可能无法快速定位，这时可以在列表中快速定位。


#### 重命名Window

```bash
Ctrl+b ,
```

给`Window`起一个有意义的名字，在使用的时候更容易分辨

:::tip
`window`默认的命名，没有命令在运行的时候使用**bash**名字，例如 **Bash**,**zsh**,**fish**。 如果有命令正在运行，会显示运行的命令。
:::

#### 关闭Window

```bash
exit
```

**退出**就会关闭当前Window

---

### Pane

`Pane`可以将窗口分割为多块，可以垂直分割和水平分割。通过不断地分割，可以实现多种布局

:::tip
`Pane`的分割操作实际是对`Pane`进行操作，每个`Window`默认有一个`Pane`
:::

#### 垂直分割

```bash
Ctrl+b %
```

这个操作会将当前`Pane`分割为左右2个


#### 水平分割

```bash
Ctrl+b "
```

这个操作会将当前`Pane`分割为上下2个

#### 关闭当前Pane

```bash
Ctrl+b x
```

关闭的时候`tmux`会提示你是否要关闭


#### 自动布局调整

```bash
Ctrl+b Space
```

不想要**精雕细琢**的设置布局的时候，可以用**自动布局**来节省脑力

:::tip
`Space`是空格键。
反复按，会在`tmux`内置的*5*种布局之间切换
:::

1. **平铺**： 将`Pane`平铺，通过数量计算每行放下的`Pane`的数量，多余的放在最后一行，最后一个`Pane`会占据剩下的的所有位置
2. **垂直平均**: 将所有`Pane`从左到右排列，每个`Pane`大小一样
3. **水平平均**: 将所有`Pane`从上到下排列，每个`Pane`大小一样
4. **主窗格在上**: 一个`Pane`在上方，其他`Pane`在下方横向排列。主窗格占据更多的高度
5. **主窗格在左**:  一个`Pane`在左边，其他`Pane`在右边纵向排列。主窗格占据更多的宽度

---

### 复制模式(查看历史输出)

`tmux`默认不支持**鼠标滚轮**来上下滚动，需要查看历史输出需要进入`复制模式`

```bash
Ctrl+b [
```

进入复制模式后可以通过 `方向键` / `Page Up` / `Page Down` 来上下滚动

通过 `q` 退出

---

### 杀掉Session(慎用)

```bash
tmux kill-session -t <name>
```

不推荐这样结束`Session`，杀掉`Session`之后无法恢复，请谨慎操作。如果需要关闭`Session`，可以将`Window`全部关闭，当`Window`都关闭了，`Session`会自动退出。


`tmux` 的基本操作到这里我们就都掌握了，祝大家使用愉快~

Happy hacking！！！


：：：tip 一言
滟滟随波千万里，何处春江无月明！ --- 《春江花月夜》 · 唐代 张若虚
：：：

<details>
  <summary>全文</summary>
春江潮水连海平，海上明月共潮生。<br/>滟滟随波千万里，何处春江无月明！<br/>江流宛转绕芳甸，月照花林皆似霰。<br/>空里流霜不觉飞，汀上白沙看不见。<br/>江天一色无纤尘，皎皎空中孤月轮。<br/>江畔何人初见月，江月何年初照人？<br/>人生代代无穷已，江月年年只相似。<br/>不知江月待何人，但见长江送流水。<br/>白云一片去悠悠，青枫浦上不胜愁。<br/>谁家今夜扁舟子，何处相思明月楼？<br/>可怜楼上月徘徊，应照离人妆镜台。<br/>玉户帘中卷不去，捣衣砧上拂还来。<br/>此时相望不相闻，愿逐月华流照君。<br/>鸿雁长飞光不度，鱼龙潜跃水成文。<br/>昨夜闲潭梦落花，可怜春半不还家。<br/>江水流春去欲尽，江潭落月复西斜。<br/>斜月沉沉藏海雾，碣石潇湘无限路。<br/>不知乘月几人归，落月摇情满江树。
</details>
