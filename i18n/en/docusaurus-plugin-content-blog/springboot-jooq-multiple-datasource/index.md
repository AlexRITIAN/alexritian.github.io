---
authors: too
title: Configure Multiple Data Sources with Spring Boot and Jooq
date: 2024/06/20
tags: [springboot, jooq, java, gradle]
toc_max_heading_level: 6
keywords: [springboot, jooq, java, datasource, spring]
---

Configuring multiple data sources in Spring Boot and using JOOQ to generate code for each data source.

:::info
This article uses `Gradle` as the project build tool.
:::

![bk](./bk.png)

<!-- truncate -->

In a Spring Boot project, if we have only one data source, `springboot` will automatically create a `DataSource`, and in this case, JOOQ will use the default data source to generate code. If we encounter a situation where multiple data sources need to be configured in the project, let’s see how to configure multiple data sources in `springboot` and use `JOOQ` to generate code for each data source.

## Environment Information

- `springboot`: `2.7.3`
- `java`: `11`
- `gradle`: `7.5`

## Configure `Build.gradle`

First, we need to configure the dependencies and the Jooq plugin (for code generation).

### Apply the `JOOQ` Plugin

```groovy
plugins {  
    id 'nu.studer.jooq' version '7.1.1'  
}
```

### Add Dependencies

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
Configure database drivers as needed.
:::

### Set Gradle Task

To use the `JOOQ` plugin to generate code, we need to make some configurations.

#### Configure Task Names

When the `JOOQ` plugin registers Gradle tasks, the naming rule is `generate` + `name` + `Jooq`.

:::tip
If you use `main` as the name, JOOQ will ignore `main`, and the task name will be `generateJooq`.
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

Here we have configured three `name`s: `greenplum`, `hana`, and `mysql`. The registered Gradle task names are `generateGreenplumJooq`, `generateHanaJooq`, and `generateMysqlJooq`.

#### Configure Code Generation

With `generationTool`, we can configure the target database, code generation strategy, target directory, etc.

```groovy
greenplum(sourceSets.main) {
    generator {
        name = 'org.jooq.codegen.DefaultGenerator'
        strategy {
            name = 'org.jooq.codegen.DefaultGeneratorStrategy'
        }
        database {
            name = 'org.jooq.meta.postgres.PostgresDatabase'
            inputSchema = 'public'
        }
        generate {
            pojos = true
            daos = true
            immutablePojos = true
        }
        target {
            packageName = 'org.moonlit.dbconnecter.dao.greenplum'
            directory = 'src/main/java'
        }
    }
}

hana(sourceSets.main) {
    generator {
        name = 'org.jooq.codegen.DefaultGenerator'
        strategy {
            name = 'org.jooq.codegen.DefaultGeneratorStrategy'
        }
        database {
            name = 'org.jooq.meta.postgres.PostgresDatabase'
            inputSchema = 'public'
        }
        generate {
            pojos = true
            daos = true
            immutablePojos = true
        }
        target {
            packageName = 'org.moonlit.dbconnecter.dao.hana'
            directory = 'src/main/java'
        }
    }
}

mysql(sourceSets.main) {
    generator {
        name = 'org.jooq.codegen.DefaultGenerator'
        strategy {
            name = 'org.jooq.codegen.DefaultGeneratorStrategy'
        }
        database {
            name = 'org.jooq.meta.mysql.MySQLDatabase'
            inputSchema = 'public'
        }
        generate {
            pojos = true
            daos = true
            immutablePojos = true
        }
        target {
            packageName = 'org.moonlit.dbconnecter.dao.mysql'
            directory = 'src/main/java'
        }
    }
}
```

## Configure Multiple Data Sources

We need to create multiple DataSources, and configure these DataSources to be used by JOOQ.

```java
@Configuration
public class DataSourceConfig {

    @Primary
    @Bean(name = "greenplumDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.greenplum")
    public DataSource greenplumDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "hanaDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.hana")
    public DataSource hanaDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean(name = "mysqlDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.mysql")
    public DataSource mysqlDataSource() {
        return DataSourceBuilder.create().build();
    }
}
```

In `application.yml`, configure multiple data sources.

```yaml
spring:
  datasource:
    greenplum:
      url: jdbc:postgresql://localhost:5432/greenplum
      username: greenplum
      password: greenplum
    hana:
      url: jdbc:sap://localhost:30015
      username: hana
      password: hana
    mysql:
      url: jdbc:mysql://localhost:3306/mysql
      username: mysql
      password: mysql
```

## Configure JOOQ

Configure JOOQ to use different configurations for different DataSources.

```java
@Configuration
public class JooqConfig {

    @Autowired
    private Map<String, DefaultConfiguration> configurationMap;

    @Bean
    @Primary
    public DefaultDSLContext dslContext() {
        return new DefaultDSLContext(configuration());
    }

    @Bean
    public DefaultConfiguration configuration() {
        return new DefaultConfiguration();
    }

    @Bean
    @Primary
    public DefaultConfiguration jooqConfiguration(@Autowired DataSource dataSource) {
        DefaultConfiguration config = new DefaultConfiguration();
        config.set(SQLDialect.POSTGRES);
        config.set(dataSource);
        return config;
    }

    @Bean
    public DefaultConfiguration greenplumConfiguration(@Autowired @Qualifier("greenplumDataSource") DataSource dataSource) {
        var config = new DefaultConfiguration();
        config.set(SQLDialect.POSTGRES);
        config.set(dataSource);
        return config;
    }

    @Bean
    public DefaultConfiguration hanaConfiguration(@Autowired @Qualifier("hanaDataSource") DataSource dataSource) {
        var config = new DefaultConfiguration();
        config.set(SQLDialect.POSTGRES);
        config.set(dataSource);
        return config;
    }

    @Bean
    public DefaultConfiguration mysqlConfiguration(@Autowired @Qualifier("mysqlDataSource") DataSource dataSource) {
        var config = new DefaultConfiguration();
        config.set(SQLDialect.POSTGRES);
        config.set(dataSource);
        return config;
    }
}
```

:::info
Here, I configure `jooqConfiguration` for each data source by judging the package name. You can use other methods to judge and configure.
:::

All configurations are complete. You can execute the `generateXXXJooq` in Gradle to generate code, and then start the project to test the connections.

Happy Coding :tada: :tada: :tada:
