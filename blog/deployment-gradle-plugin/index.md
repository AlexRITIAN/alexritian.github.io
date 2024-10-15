---
authors: too
title: 开发Gradle plugin
date: 2024/10/15
tags: [java,gradle]
toc_max_heading_level: 6
keywords: [java, gradle, kotlin]
---
![bk](./bk.jpg)


最近在学习如何编写 `Gradle plugin`, 记录一下学习心得

## 插件分类

`Gradle` 插件有三种实现方式 `Script plugins`、`Precomplied script plugins` 和 `Binary plugins`

- `Script plugins` ： 在 `build.gradle` 中直接实现插件逻辑，只能在当前构建中使用。
- `Precomplied script plugins` : 在项目中的独立文件(`.gradle` 或 `.gradle.kts` )中实现插件逻辑,可以在项目中的多个构建中使用。
- `Binary plugins`: 使用独立项目实现插件逻辑，并打包为jar文件，在项目中通过引用jar文件来使用。

本文使用独立项目来制作 `Binary plugins`.
<!-- truncate -->

## 环境准备

需要安装 `Java` 和 `Gradle`

:::tip
文中使用的是 `Java 21.0.3` 和 `Gradle 8.10.2`
:::

## 初始化项目

```bash
gradle init --type java-gradle-plugin
```

```bash
Welcome to Gradle 8.10.2!

Here are the highlights of this release:
 - Support for Java 23
 - Faster configuration cache
 - Better configuration cache reports

For more details see https://docs.gradle.org/8.10.2/release-notes.html

Starting a Gradle Daemon (subsequent builds will be faster)

Project name (default: gradle-plugin-demo):

Select build script DSL:
  1: Kotlin
  2: Groovy
Enter selection (default: Kotlin) [1..2]

Generate build using new APIs and behavior (some features may change in the next minor release)? (default: no) [yes, no]


> Task :init
For more information, please refer to https://docs.gradle.org/8.10.2/userguide/custom_plugins.html in the Gradle documentation.

BUILD SUCCESSFUL in 1m 5s
1 actionable task: 1 executed
```

运行 `init` 命令之后会需要回答3个问题

- `Project name` ： 设置项目名字，（默认是当前目录的名字）
- `Build script DSL` ：选择构建脚本的语言，默认是 `Kotlin` 
- `New APIs and behavior` : 是否启用新的API和特性，默认是 `no` 

:::tip
gradle的项目都有一个构建文件 `build.gradle` 根据构建语言的不同文件的后缀名有所区别
`Groovy` 的是 `build.gradle` , `Kotlin` 的是 `build.gradle.kts`
:::

初始化之后的目录结构如下：

```bash
.
├── .gitattributes
├── .gitignore
├── gradle
│   ├── libs.versions.toml
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradlew
├── gradlew.bat
├── plugin
│   ├── build.gradle.kts
│   └── src
│       ├── functionalTest
│       │   └── java
│       │       └── org
│       │           └── example
│       │               └── GradlePluginDemoPluginFunctionalTest.java
│       ├── main
│       │   ├── java
│       │   │   └── org
│       │   │       └── example
│       │   │           └── GradlePluginDemoPlugin.java
│       │   └── resources
│       └── test
│           ├── java
│           │   └── org
│           │       └── example
│           │           └── GradlePluginDemoPluginTest.java
│           └── resources
└── settings.gradle.kts

19 directories, 12 files
```


- `grale` : 配置gradle-wrapper用来定义项目使用的gradle的版本， `libs.versions.toml` 是 `gradle` 的依赖版本管理文件是 [[Gradle版本目录（Version Catalogs）]] 的另一种实现方式
- `plugin` : 插件代码的目录，包含核心代码，测试代码
- `settings.gradle.kts`：`Gradle` 的配置文件

## Plugin id

我们可以在 `build.gradle.kts` 文件中看到如下内容

```kotlin
gradlePlugin {  
    // Define the plugin  
    val greeting by plugins.creating {  
        id = "org.example.greeting"  
        implementationClass = "org.example.GradlePluginDemoPlugin"  
    }  
}
```

这里定义我们的插件的 `id` , 这个 `id` 就是插件的唯一标识。

## 入口类

```java
public class GradlePluginDemoPlugin implements Plugin<Project> {  
    public void apply(Project project) {  
        // Register a task  
        project.getTasks().register("greeting", task -> {  
            task.doLast(s -> System.out.println("Hello from plugin 'org.example.greeting'"));  
        });  
    }  
}
```

实现 `Plugin<Project>` 的类将作为插件的**入口类** , 在一个插件在 `Gradle` 中被使用将会执行**入口类**的 `apply(Project)` 方法。

```java
project.getTasks().register("greeting", task -> {  
            task.doLast(s -> System.out.println("Hello from plugin 'org.example.greeting'"));  
        });
```

通过 `register` 我们可以注册一个名字叫做 `greeting` 的 `task` 到 `Gradle` 的构建中. 这个task在运行的时候会在控制台输出 `Hello from plugin 'org.example.greeting'`

现在我们可以运行一下 `org.example.GradlePluginDemoPluginFunctionalTest#canRunTask()` 这个测试方法来看看一下实际效果

```bash
> Task :greeting
Hello from plugin 'org.example.greeting'
```

可以看到名字叫做 `greeting` 的插件被执行了，然后输出了 `Hello form plugin 'org.example.greeting'`

这就是我们通过 `init` 命令创建的 `Gradle plugin` 的 `Hello world`

## Extension

当前我们的插件不能配置，只能输出固定的内容。`Extension` 可以让插件变的可配置。

`Extension` 允许插件向 `project` 对象添加自定义的配置块，从而在构建脚本中定义额外的配置选项或行为。



现在让我们给插件定义一个 `Extension` 

```java
package org.example;  
  
import org.gradle.api.model.ObjectFactory;  
import org.gradle.api.provider.Property;  
  
import javax.inject.Inject;  
  
/**  
 * @author Too_young  
 */
public class DemoExtension {  
    private final Property<String> greeting;  
  
    @Inject  
    public DemoExtension(ObjectFactory objects) {  
        this.greeting = objects.property(String.class).convention("Default greeting");  
    }  
  
    public Property<String> getGreeting() {  
        return greeting;  
    }  
}
```

这是一个简单的 `Extension` 类，它只有一个属性 `greeting`,我们在初始化的时候给它设置了一个默认值 `Default greeting`.

>[!tip]
>- `Property<String>` : 表示一个**延迟计算**的值
>- `ObjectFactory`: 用以创建 `Gradle` 的各种类型的对象
>
> `延迟计算` 是 `Gradle` 的一个特性，它的作用就是在 `Property` 对象中的值在被调用的时候才会计算 `Property` 中的值。


我们有了一个 `Extension` , 现在我们需要将 `Extension` 加入到 `Gradle` 中，这样我们就能在构建文件(build.gradle)中使用它

```java
/*  
 * This source file was generated by the Gradle 'init' task 
 */
 
package org.example;  
  
import org.gradle.api.Project;  
import org.gradle.api.Plugin;  
  
/**  
 * A simple 'hello world' plugin. 
 */
public class GradlePluginDemoPlugin implements Plugin<Project> {  
    public void apply(Project project) {  
        // add Extension  
        var extension = project.getExtensions().create("demo", DemoExtension.class);  
        var greeting = extension.getGreeting();  
        // Register a task  
        project.getTasks().register("greeting", task -> {  
            task.doLast(s -> System.out.println(greeting.get()));  
        });  
    }  
}
```

在**入口类**中我们通过 `project.getExtensions().create("demo", DemoExtension.class)` 向 `Gradle` 中添加了一个名字为 `demo` 的 `Extension`。

:::tip
关于**延迟计算**, 当代码运行到 `greeting.get()` 的时候，`Gradle` 才会开始计算 `greeting` 的值
:::

现在我们的插件一个有了一个 `Extension` 并且已经加入到了 `Gradle` 中它的名字是 `demo`，我们来看已一下要如何使用这个 `Extension` .

```kotlin
plugins {  
    id("org.example.greeting")
}  
  
demo {  
    greeting = "greeting from build.gradle.kts"
}
```

在 `Gradle` 的构建文件中添加插件的引用，我们就可以在文件中使用我们插件的 `Extension`.

让我们来测试一下，修改一下 `GradlePluginDemoPluginFunctionalTest` 来试试我们的 `Extension` 是否可用

```java
/*  
 * This source file was generated by the Gradle 'init' task 
 */
package org.example;  
  
import java.io.File;  
import java.io.IOException;  
import java.io.Writer;  
import java.io.FileWriter;  
import java.nio.file.Files;  
import org.gradle.testkit.runner.GradleRunner;  
import org.gradle.testkit.runner.BuildResult;  
import org.junit.jupiter.api.Test;  
import org.junit.jupiter.api.io.TempDir;  
import static org.junit.jupiter.api.Assertions.*;  
  
/**  
 * A simple functional test for the 'org.example.greeting' plugin. 
 */
class GradlePluginDemoPluginFunctionalTest {  
    @TempDir  
    File projectDir;  
  
    private File getBuildFile() {  
        return new File(projectDir, "build.gradle.kts");  
    }  
  
    private File getSettingsFile() {  
        return new File(projectDir, "settings.gradle");  
    }  
  
    @Test void canRunTask() throws IOException {  
        writeString(getSettingsFile(), "");  
        writeString(getBuildFile(),  
                """  
                        plugins {                            id("org.example.greeting")                        }                                     demo {  
                            greeting = "greeting from build.gradle.kts"                        }                        """);  
  
        // Run the build  
        GradleRunner runner = GradleRunner.create();  
        runner.forwardOutput();  
        runner.withPluginClasspath();  
        runner.withArguments("greeting");  
        runner.withProjectDir(projectDir);  
        BuildResult result = runner.build();  
  
        // Verify the result  
        assertTrue(result.getOutput().contains("greeting from build.gradle.kts"));  
    }  
  
    private void writeString(File file, String string) throws IOException {  
        try (Writer writer = new FileWriter(file)) {  
            writer.write(string);  
        }    }  
}
```

:::tip
默认的测试类中定义的是 `Groovy` 语言的构建文件，我更喜欢用 `kotlin` 一些就改成了 `build.gradle.kts`.
:::

现在我们运行一下看看效果

```bash
> Task :greeting
greeting from build.gradle.kts

BUILD SUCCESSFUL in 3s
```

## 抽象Task类

现在我们的插件可以通过 `Extension` 来进行配置了，但是我们插件的功能还只是输入，这可不能满足我们开发插件的初衷。

我们可以用通过继承 `org.gradle.api.DefaultTask` 来自定义任务。让我们来尝试一下

```java
package org.example;  
  
import org.gradle.api.DefaultTask;  
import org.gradle.api.provider.Property;  
import org.gradle.api.tasks.TaskAction;  
  
import java.util.Objects;  
  
/**  
 * @author Too_young  
 */
public abstract class DemoTask extends DefaultTask {  
  
    public abstract Property<String> getGreeting();  
  
    @TaskAction  
    public void run() {  
        var greeting = getGreeting().get();  
  
        if (Objects.equals("Default greeting", greeting)) {  
            System.out.println("greeting not set!!!");  
        } else {  
            System.out.println(greeting);  
        }    
    }  
}
```

通过 `@TaskAction` 来定义task的执行的核心逻辑，类似于task的入口方法。

:::tip
`@TaskAction` 可以配置多个，但是 `Gradle` 不能保证其运行顺序，推荐只配置一个 `@TaskAction`
:::

我们在task中设置一个判断，如果是默认的greeting就输出 `greeting not set!!!` , 如果不是就输出原内容

让我们来测试一下,还是修改一下 `GradlePluginDemoPluginFunctionalTest` 测试类

```java
/*  
 * This source file was generated by the Gradle 'init' task 
 */
package org.example;  
  
import org.gradle.testkit.runner.BuildResult;  
import org.gradle.testkit.runner.GradleRunner;  
import org.junit.jupiter.api.Test;  
import org.junit.jupiter.api.io.TempDir;  
  
import java.io.File;  
import java.io.FileWriter;  
import java.io.IOException;  
import java.io.Writer;  
  
import static org.junit.jupiter.api.Assertions.assertTrue;  
  
/**  
 * A simple functional test for the 'org.example.greeting' plugin. 
 */
class GradlePluginDemoPluginFunctionalTest {  
    @TempDir  
    File projectDir;  
  
    private File getBuildFile() {  
        return new File(projectDir, "build.gradle.kts");  
    }  
  
    private File getSettingsFile() {  
        return new File(projectDir, "settings.gradle");  
    }  
  
    @Test void canRunTask() throws IOException {  
        writeString(getSettingsFile(), "");  
        writeString(getBuildFile(),  
                """  
                        plugins {                            id("org.example.greeting")                        }                        """);  
  
        // Run the build  
        GradleRunner runner = GradleRunner.create();  
        runner.forwardOutput();  
        runner.withPluginClasspath();  
        runner.withArguments("greeting");  
        runner.withProjectDir(projectDir);  
        BuildResult result = runner.build();  
  
        // Verify the result  
        assertTrue(result.getOutput().contains("greeting not set!!!"));  
    }  
    @Test void canExtension() throws IOException {  
        writeString(getSettingsFile(), "");  
        writeString(getBuildFile(),  
                """  
                        plugins {                            id("org.example.greeting")                        }                                                demo {  
                            greeting = "greeting from build.gradle.kts"                        }                        """);  
  
        // Run the build  
        GradleRunner runner = GradleRunner.create();  
        runner.forwardOutput();  
        runner.withPluginClasspath();  
        runner.withArguments("greeting");  
        runner.withProjectDir(projectDir);  
        BuildResult result = runner.build();  
  
        // Verify the result  
        assertTrue(result.getOutput().contains("greeting from build.gradle.kts"));  
    }  
  
    private void writeString(File file, String string) throws IOException {  
        try (Writer writer = new FileWriter(file)) {  
            writer.write(string);  
        }    }  
}
```

这里增加一个测试方法用来测试配置了 `greeting` 的情况，另一个方法用来测试 `greeting` 默认状态的情况

`canRunTask()` 的结果

```bash
> Task :greeting
greeting not set!!!

BUILD SUCCESSFUL in 1s
```

`canExtension()` 的结果

```bash
> Task :greeting
greeting from build.gradle.kts

BUILD SUCCESSFUL in 3s
```

到此我们已经成功的创建了一个 `Gradle plugin` 项目了。

Happy Coding！！！