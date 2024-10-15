---
authors: too
title: Developing a Gradle plugin
date: 2024/10/15
tags: [java,gradle]
toc_max_heading_level: 6
keywords: [java, gradle, kotlin]
---
![bk](./bk.jpg)


I've recently been learning how to write a `Gradle plugin` and want to document my insights.

## Types of Plugins

There are three ways to implement a `Gradle` plugin: `Script plugins`, `Precompiled script plugins`, and `Binary plugins`.

- **`Script plugins`**: The plugin logic is implemented directly in the `build.gradle` file and can only be used in the current build.
- **`Precompiled script plugins`**: The plugin logic is implemented in a separate file (either `.gradle` or `.gradle.kts`) within the project and can be used across multiple builds in the project.
- **`Binary plugins`**: The plugin logic is implemented in a standalone project and packaged as a JAR file, which can be referenced and used in other projects by including the JAR file.

In this article, we'll create a `Binary plugin` using a separate project.
<!-- truncate -->

## Environment Setup

You'll need to install `Java` and `Gradle`.

:::tip
For this guide, we are using `Java 21.0.3` and `Gradle 8.10.2`.
:::

## Initializing the Project

Run the following command:

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

After running the `init` command, you'll be prompted to answer three questions:

- `Project name`: Set the project name (default is the current directory name).
- `Build script DSL`: Choose the language for the build script (default is `Kotlin`).
- `New APIs and behavior`: Whether to enable new APIs and features (default is `no`).

:::tip
Every Gradle project has a build file (`build.gradle`). The file extension differs depending on the scripting language: `Groovy` uses `build.gradle`, while `Kotlin` uses `build.gradle.kts`.
:::

After initialization, the project structure will look like this:

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

- **`gradle`**: Contains configuration for the `gradle-wrapper` and defines the version of Gradle used in the project. `libs.versions.toml` is a version management file for dependencies, another way of using the [Gradle Version Catalog](https://docs.gradle.org/current/userguide/platforms.html#sec:using_version_catalog).
- **`plugin`**: Directory for the plugin's code, including core and test code.
- **`settings.gradle.kts`**: Configuration file for the `Gradle` project.

## Plugin ID

In the `build.gradle.kts` file, you will find the following content:

```kotlin
gradlePlugin {  
    // Define the plugin  
    val greeting by plugins.creating {  
        id = "org.example.greeting"  
        implementationClass = "org.example.GradlePluginDemoPlugin"  
    }  
}
```

This defines the `id` for our plugin, which serves as the unique identifier of the plugin.

## Entry Class

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

The class that implements `Plugin<Project>` is the **entry point** of the plugin. When the plugin is applied in `Gradle`, the `apply(Project)` method is executed.

```java
project.getTasks().register("greeting", task -> {  
            task.doLast(s -> System.out.println("Hello from plugin 'org.example.greeting'"));  
        });
```

Here, a task named `greeting` is registered to the `Gradle` build. When executed, it outputs "Hello from plugin 'org.example.greeting'" to the console.

Now, we can run the `org.example.GradlePluginDemoPluginFunctionalTest#canRunTask()` test method to see the actual result.

```bash
> Task :greeting
Hello from plugin 'org.example.greeting'
```

As you can see, the `greeting` task has been executed and it outputs "Hello from plugin 'org.example.greeting'".

This is the "Hello World" of our `Gradle plugin` created using the `init` command.

## Extension

Currently, our plugin is not configurable—it only outputs fixed content. **Extensions** allow plugins to become configurable.

An **extension** enables the plugin to add a custom configuration block to the `project` object, allowing for extra options or behavior in the build script.

Now let's define an extension for our plugin:

```java
package org.example;  
  
import org.gradle.api.model.ObjectFactory;  
import org.gradle.api.provider.Property;  
  
import javax.inject.Inject;  
  
/**  
 * A simple extension with a greeting property.
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

This is a simple `Extension` class with one property, `greeting`, which is initialized with a default value of "Default greeting".

> [!tip]
> - `Property<String>`: Represents a **lazy-evaluated** value.
> - `ObjectFactory`: Used to create different types of objects in `Gradle`.
>
> `Lazy evaluation` is a feature in `Gradle` that delays the calculation of the value in a `Property` until it is called.

Now that we have an `Extension`, we need to add it to `Gradle` so that it can be used in the build file:

```java
package org.example;  
  
import org.gradle.api.Project;  
import org.gradle.api.Plugin;  
  
public class GradlePluginDemoPlugin implements Plugin<Project> {  
    public void apply(Project project) {  
        // Add extension  
        var extension = project.getExtensions().create("demo", DemoExtension.class);  
        var greeting = extension.getGreeting();  
        // Register a task  
        project.getTasks().register("greeting", task -> {  
            task.doLast(s -> System.out.println(greeting.get()));  
        });  
    }  
}
```

In the **entry class**, we add an extension named `demo` to `Gradle` using `project.getExtensions().create("demo", DemoExtension.class)`.

:::tip
Regarding **lazy evaluation**, `greeting.get()` is evaluated when the task is executed, not when the extension is created.
:::

Now that the plugin has an extension named `demo`, let's see how to use it in the build file:

```kotlin
plugins {  
    id("org.example.greeting")
}  
  
demo {  
    greeting = "greeting from build.gradle.kts"
}
```

By adding the plugin reference in the `Gradle` build file, we can use the extension provided by the plugin.

Let’s modify the `GradlePluginDemoPluginFunctionalTest` class to test if our extension works:

```java
package org.example;  
  
import java.io.File;  
import java.io.IOException;  
import java.io.Writer;  
import java.io.FileWriter;  
import org.gradle.testkit.runner.GradleRunner;  
import org.gradle.testkit.runner.Build

Result;  
import org.junit.jupiter.api.Test;  
import org.junit.jupiter.api.io.TempDir;  
import static org.junit.jupiter.api.Assertions.*;  
  
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
        }  
    }  
}
```

:::tip
By default, the test class uses `Groovy` build files, but I prefer `Kotlin`, so I modified it to use `build.gradle.kts`.
:::

Now let's run the test to see the result:

```bash
> Task :greeting
greeting from build.gradle.kts

BUILD SUCCESSFUL in 3s
```

## Abstract Task Class

Now that our plugin can be configured using an extension, let’s move on to creating more functionality beyond just printing a greeting.

We can create a custom task by extending `org.gradle.api.DefaultTask`. Let's give it a try:

```java
package org.example;  
  
import org.gradle.api.DefaultTask;  
import org.gradle.api.provider.Property;  
import org.gradle.api.tasks.TaskAction;  
  
import java.util.Objects;  
  
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

Using the `@TaskAction` annotation, we define the core logic of the task, which acts like an entry method for the task.

:::tip
You can have multiple `@TaskAction` annotations, but Gradle doesn’t guarantee the order of execution, so it's recommended to have only one.
:::

In the task, we added a check: if the greeting is the default value, it outputs "greeting not set!!!", otherwise, it prints the greeting.

Let’s update the `GradlePluginDemoPluginFunctionalTest` class to test this behavior:

```java
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
        }  
    }  
}
```

Here, we added a test method to check the default greeting and another method to test the configured greeting.

Result of `canRunTask()`:

```bash
> Task :greeting
greeting not set!!!

BUILD SUCCESSFUL in 1s
```

Result of `canExtension()`:

```bash
> Task :greeting
greeting from build.gradle.kts

BUILD SUCCESSFUL in 3s
```

At this point, we have successfully created a `Gradle plugin` project.

Happy Coding!!!