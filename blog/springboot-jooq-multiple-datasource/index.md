---
authors: too
title: Springboot+Jooq配置多数据源
date: 2024/06/20
tags: [springboot, jooq, java, gradle]
toc_max_heading_level: 6
keywords: [springboot, jooq, java, datasource, spring]
---

在Springboot中配置多数据源，并使用JOOQ为每个数据源生成代码

:::info
文中使用 `Gradle` 作为项目构建工具
:::

![bk](./bk.png)

<!-- truncate -->

在Springboot项目中，如果我们只有一个数据源，`springboot` 会自动创建 `DataSource` , 这个时候使用JOOQ来生成代码，JOOQ就会自动使用默认的数据源。在项目中遇到一个需要配置多个数据源的情况，下面就让我们看一下如何给 `springboot` 配置多个数据源，并且使用 `JOOQ` 为每个数据源生成代码

## 环境信息

- `springboot`: `2.7.3`
- `java`: `11`
- `gradle`: `7.5`

## 配置 `Build.gradle`

首先我们需要先配置依赖, Jooq插件(生成代码用)

### 应用 `JOOQ` 插件

```groovy
plugins {  
    id 'nu.studer.jooq' version '7.1.1'  
}
```

### 添加依赖

```groovy
dependencies {  
    implementation 'org.springframework.boot:spring-boot-starter-jooq'  
    implementation 'org.jooq:jooq:3.17.4'  
    implementation 'org.jooq:jooq-codegen:3.17.3'  
    implementation 'com.sap.cloud.db.jdbc:ngdbc:2.13.9'  
    implementation 'org.realityforge.org.jetbrains.annotations:org.jetbrains.annotations:1.7.0'  
    implementation 'org.postgresql:postgresql:42.5.0'  
    implementation 'mysql:mysql-connector-java:8.0.30'   
    jooqGenerator 'com.sap.cloud.db.jdbc:ngdbc:2.13.9'  
    jooqGenerator 'jakarta.xml.bind:jakarta.xml.bind-api:4.0.0'  
    jooqGenerator 'org.postgresql:postgresql:42.5.0'  
    jooqGenerator 'mysql:mysql-connector-java:8.0.30'  
}
```
:::tip
数据库驱动根据自己的需求来配置
:::

### 设置Gradle Task

要使用 `JOOQ` 的插件来生成代码，我们需要进行一些配置

#### 配置task名字

`JOOQ` 插件注册 Gradle task的时候使用的命名规则为 `generate` + `name` + `Jooq`

:::tip
如果使用 `main` 作为name，这时JOOQ会忽略main，生成的task名字为 `generateJooq`
:::

```groovy
jooq {  
    configurations {  
        greenplum {...}
        hana {...}
        mysql {...}
    }
}
```
这里我们分别配置了3个 `name` 分别是 `greenplum`, `hana` 和 `mysql`，注册的Gradle task的名字分别是 `generateGreenplumJooq`, `generateHanaJooq` 和 `generateMysqlJooq`

#### 配置代码生成

通过 `generationTool` 我们可以配置目标数据库，代码生成策略，目标目录等内容

##### 设置目标数据库

通过配置 `jdbc` 来指定为哪个数据库来生成代码

```groovy
jooq {
    configurations {  
        greenplum {  
            generationTool {  
                logging = org.jooq.meta.jaxb.Logging.WARN  
                jdbc {  
                    driver = 'org.postgresql.Driver'  
                    url = 'jdbc:postgresql://<ip>:<port>/postgres'  
                    user = '<username>'  
                    password = '<password>'  
                }
            }
        }
    }
}
```
:::tip
`jdbc` 中包含 `properties` 属性，可以通过配置 `properties` 来配置连接数据库所需要的额外属性值

```groovy
jdbc{
    ....
    properties {
        property {
            key = 'PAGE_SIZE'
            value = 2048
        }
    }
}
```
:::

##### 配置代码生成策略

这里分为3块内容，数据库相关，生成策略，目标目录

###### database

配置使用的 `schema` , 针对哪些表生成代码，忽略哪些表

```groovy
database {
    inputSchema = '<schema>'
    includes = '.*'
    excludes = ''
}
```
- `inputSchema`: 指定使用的 `schema` 
- `includes`: 指定包含的表
- `excludes`: 执行排除的表

:::info
`includes` 和 `excludes` 仅支持正则表达式
:::

###### generate

`generate` 负责生成策略

```groovy
generate {  
    pojosEqualsAndHashCode = true  
    relations = true  
    deprecated = false  
    records = true  
    pojos = true  
    immutablePojos = false  
    fluentSetters = true  
    springAnnotations = true  
}  
```
- `pojosEqualsAndHashCode`: 为POJO生成 `equals` 和 `hashCode` 方法。
- `relations`: 为生成的代码添加关系（如外键关系）的元数据。
- `deprecated`: 生成被标记为已弃用的代码。 `false` 表示不生成。
- `records`: 为每个表生成 `Record` 类型。
- `pojos`: 为每个表生成 `POJO` 类。
- `immutablePojos`: 生成不可变的 `POJO` 类。 `false` 表示生成可变的 `POJO` 类
- `fluentSetters`: 生成使用流式 API 的 setter 方法。
- `springAnnotations`: 在生成的代码中添加 Spring 框架的注解。

###### target

`target` 配置生成代码所在包名和目录

```groovy
target {  
    packageName = 'org.moonlit.dbconnecter.gen.greenplum'  
    directory = 'build/generated/source/greenplum'  
}  
```

- `packageName`: 指定包名
- `directory`: 指定代码目录

:::warning
`jooq` 在生成代码的时候会先清楚目录下的代码，然后再生成新的代码。 所以每个task中的配置的 `directory` 要为不同的目录。
:::

#### 示例

这是 `jooq` task配置的完整示例

```groovy
jooq {  
    configurations {  
        greenplum {  
            generationTool {  
                logging = org.jooq.meta.jaxb.Logging.WARN  
                jdbc {  
                    driver = 'org.postgresql.Driver'  
                    url = 'jdbc:postgresql://<IP:port>/<database name>'  
                    user = '<username>'  
                    password = '<password>'  
                }  
                generator {  
                    database {  
                        inputSchema = 'public'  
                        includes = '.*'  
                        excludes = ''  
                    }  
                    generate {  
                        pojosEqualsAndHashCode = true  
                        relations = true  
                        deprecated = false  
                        records = true  
                        pojos = true  
                        immutablePojos = false  
                        fluentSetters = true  
                        springAnnotations = true  
                    }  
                    target {  
                        packageName = 'org.moonlit.dbconnecter.gen.greenplum'  
                        directory = 'build/generated/source/greenplum'  
                    }  
                }  
            }  
        }  
        hana {  
            generationTool {  
                logging = org.jooq.meta.jaxb.Logging.WARN  
                jdbc {  
                    driver = 'com.sap.db.jdbc.Driver'  
                    url = 'jdbc:sap://<IP:port>/'  
                    user = '<username>'  
                    password = '<password>' 
                }  
                generator {  
//                    name = 'org.jooq.codegen.DefaultGenerator'  
                    database {  
                        inputSchema = '<schema>'  
                        includes = '.*'  
                        excludes = ''  
                    }  
                    generate {  
                        pojosEqualsAndHashCode = true  
                        relations = true  
                        deprecated = false  
                        records = true  
                        pojos = true  
                        immutablePojos = false  
                        fluentSetters = true  
                        springAnnotations = true  
                    }  
                    target {  
                        packageName = 'org.moonlit.dbconnecter.gen.hana'  
                        directory = 'build/generated/source/hana'  
                    }  
                }  
            }  
        }  
        mysql {  
            generationTool {  
                logging = org.jooq.meta.jaxb.Logging.WARN  
                jdbc {  
                    driver = 'com.mysql.cj.jdbc.Driver'  
                    url = 'jdbc:mysql://<IP:port>/<databse name>'  
                    user = '<username>'  
                    password = '<password>'  
                }  
                generator {  
                    database {  
                        inputSchema = '<schema>'  
                        includes = '.*'  
                        excludes = ''  
                    }  
                    generate {  
                        pojosEqualsAndHashCode = true  
                        relations = true  
                        deprecated = false  
                        records = true  
                        pojos = true  
                        immutablePojos = false  
                        fluentSetters = true  
                        springAnnotations = true  
                    }  
                    target {  
                        packageName = 'org.moonlit.dbconnecter.gen.mysql'  
                        directory = 'build/generated/source/mysql'  
                    }  
                }  
            }  
        }  
    }  
}
```
:::info
这里只进行了基础的配置，有些配置项未列出，详情可以参考[gradle-jooq-plugin](https://github.com/etiennestuder/gradle-jooq-plugin/blob/main/example/use_groovy_dsl/build.gradle)
:::

## 设置源目录

将 `jooq` 生成的代码目录设置为源目录，在构建的时候可以识别到这些代码

```groovy
sourceSets {  
    main{  
        java {  
            srcDir 'src/main/java'  
            srcDir 'build/generated/source/hana'  
            srcDir 'build/generated/source/greenplum'  
            srcDir 'build/generated/source/mysql'  
        }  
    }  
}
```


## 配置springboot

在 `srpingboot` 中要使用多个数据源，就需要为每个数据源生成对应的 `datasource`,并将 `datasource` 配置到 `jooqConfiguration` 中。

### 添加数据源信息

在 `application.yml` 中添加数据库连接信息

```yaml
greenplum:
  jdbc:
    url: jdbc:postgresql://<ip:port>/<databse name>
    username: <username>
    password: <password>
    driver-class-name: org.postgresql.Driver
hana:
  jdbc:
    url: jdbc:sap://<ip:port>/<databse name>
    username: <username>
    password: <password>
    driver-class-name: com.sap.db.jdbc.Driver
    schema: <schema>
mysql:
  jdbc:
    url: jdbc:mysql://<ip:port>/<database name>
    username: <username>
    password: <password>
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 关闭jooqAutoConfiguration

首先要关闭 `springboot` 自动配置 `jooqConfiguration`, 自动配置中只会配置一个数据源(主数据源)到 `jooqConfiguration`.
通过 `exclude = JooqAutoConfiguration.class` 排除自动配置

```java
@SpringBootApplication(exclude = JooqAutoConfiguration.class)
public class DbConnecterApplication {

    public static void main(String[] args) {
        SpringApplication.run(DbConnecterApplication.class, args);
    }
}
```

### 生成 `DataSource`

为每个数据源生成一个 `DataSource`

```java
@Configuration  
@EnableTransactionManagement  
public class DataSourceConfig {  
  
    @Bean  
    public PlatformTransactionManager greenplumTransactionManager(@Autowired @Qualifier("greenplumDataSource") DataSource dataSource){  
        return new DataSourceTransactionManager(dataSource);  
    }  
  
    @Bean  
    public PlatformTransactionManager hanaTransactionManager(@Autowired @Qualifier("hanaDataSource") DataSource dataSource){  
        return new DataSourceTransactionManager(dataSource);  
    }  
  
    @Bean  
    public PlatformTransactionManager mysqlTransactionManager(@Autowired @Qualifier("mysqlDataSource") DataSource dataSource){  
        return new DataSourceTransactionManager(dataSource);  
    }  
  
    @Bean  
    public DataSource greenplumDataSource(  
            @Value("${greenplum.jdbc.url}")  
            String url,  
            @Value("${greenplum.jdbc.username}")  
            String username,  
            @Value("${greenplum.jdbc.password}")  
            String password,  
            @Value("${greenplum.jdbc.driver-class-name}")  
            String driverClassName  
    ){  
        var config = new HikariConfig();  
        config.setJdbcUrl(url);  
        config.setUsername(username);  
        config.setPassword(password);  
        config.setDriverClassName(driverClassName);  
        return new TransactionAwareDataSourceProxy(new HikariDataSource(config));  
    }  
  
    @Bean  
    public DataSource hanaDataSource(  
            @Value("${hana.jdbc.url}")  
            String url,  
            @Value("${hana.jdbc.username}")  
            String username,  
            @Value("${hana.jdbc.password}")  
            String password,  
            @Value("${hana.jdbc.driver-class-name}")  
            String driverClassName  
    ){  
        var config = new HikariConfig();  
        config.setJdbcUrl(url);  
        config.setUsername(username);  
        config.setPassword(password);  
        config.setDriverClassName(driverClassName);  
        return new TransactionAwareDataSourceProxy(new HikariDataSource(config));  
    }  
  
    @Bean  
    public DataSource mysqlDataSource(  
            @Value("${mysql.jdbc.url}")  
            String url,  
            @Value("${mysql.jdbc.username}")  
            String username,  
            @Value("${mysql.jdbc.password}")  
            String password,  
            @Value("${mysql.jdbc.driver-class-name}")  
            String driverClassName  
    ){  
        var config = new HikariConfig();  
        config.setJdbcUrl(url);  
        config.setUsername(username);  
        config.setPassword(password);  
        config.setDriverClassName(driverClassName);  
        return new TransactionAwareDataSourceProxy(new HikariDataSource(config));  
    }  
  
}
```

### 配置Jooq Configuration

为每个数据源配置 `jooqConfiguration`

```java
@Configuration  
@Import(DataSourceConfig.class)  
public class JooqConfig {  
  
    @Bean  
    @Primary    
    @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)  
    public org.jooq.Configuration configuration(Map<String,DefaultConfiguration> configurationMap, InjectionPoint injectionPoint){  
        var annotatedElement = injectionPoint.getAnnotatedElement();  
        if (Constructor.class.isAssignableFrom(annotatedElement.getClass())){  
            var declaringClass = ((Constructor) annotatedElement).getDeclaringClass();  
            var packageName = declaringClass.getPackageName();  
            org.jooq.Configuration configuration;  
            switch (packageName){  
                case "org.moonlit.dbconnecter.dao.greenplum":  
                    configuration = configurationMap.get("greenplumConfiguration");  
                    break;  
                case "org.moonlit.dbconnecter.dao.hana":  
                    configuration = configurationMap.get("hanaConfiguration");  
                    break;  
                case "org.moonlit.dbconnecter.dao.mysql":  
                    configuration = configurationMap.get("mysqlConfiguration");  
                    break;  
                default:  
                    throw new NoSuchBeanDefinitionException("no target switch");  
            }  
            return configuration;  
        }        throw new NoSuchBeanDefinitionException("no target switch");  
    }  
  
    @Bean  
    public DefaultConfiguration greenplumConfiguration(@Autowired @Qualifier("greenplumDataSource") DataSource dataSource){  
        var config = new DefaultConfiguration();  
        config.set(SQLDialect.POSTGRES);  
        config.set(dataSource);  
        return config;  
    }  
  
    @Bean  
    public DefaultConfiguration hanaConfiguration(@Autowired @Qualifier("hanaDataSource") DataSource dataSource){  
        var config = new DefaultConfiguration();  
        config.set(SQLDialect.POSTGRES);  
        config.set(dataSource);  
        return config;  
    }  
  
    @Bean  
    public DefaultConfiguration mysqlConfiguration(@Autowired @Qualifier("mysqlDataSource") DataSource dataSource){  
        var config = new DefaultConfiguration();  
        config.set(SQLDialect.POSTGRES);  
        config.set(dataSource);  
        return config;  
    }  
  
  
}
```

:::info
我这里通过判断包名来为每个数据源配置 `jooqConfiguration`, 可以通过其他方式来判断和配置。
:::

到此所有配置均已完成，可以执行gradle中的 `generateXXXJooq` 来生成代码，然后启动项目来测试连接了。

Happy Coding :tada: :tada: :tada: