# VS Code 서버 실행 및 Java 설정

## 1. Java 버전 확인

이 프로젝트는 `build.gradle`에서 Java 17을 사용하도록 설정되어 있습니다. 먼저 PowerShell에서 Java 버전을 확인합니다.

```powershell
java -version
echo $env:JAVA_HOME
```

Java 8이 표시되면 Gradle 실행이 실패합니다.

```text
Gradle requires JVM 17 or later to run.
Your build is currently configured to use JVM 8.
```

## 2. Java 17 설정

JDK가 다음 경로에 설치되어 있다면 PowerShell에서 실행합니다.
**그냥 경로 알려주고 ai한테 경로 설정해줘하면 됨**

```powershell
$jdk = "C:\Program Files\Java\jdk-17.0.20.101-hotspot"

$env:JAVA_HOME = $jdk
$env:Path = "$jdk\bin;$env:Path"
```

설정이 적용되었는지 확인합니다.

```powershell
java -version
.\gradlew.bat -version
```

Java 버전이 17 이상으로 표시되어야 합니다.

> 위 설정은 현재 PowerShell 창에만 적용됩니다. 새 터미널에서도 사용하려면 Windows 사용자 환경 변수 `JAVA_HOME`을 같은 JDK 경로로 설정하고 VS Code를 다시 시작합니다.

## 3. VS Code에서 서버 실행

프로젝트 폴더에서 실행합니다.

```powershell
cd C:\Users\zeanr\Desktop\vscode\Where_We_Meet
.\gradlew.bat bootRun
```

정상 실행 후 브라우저에서 접속합니다.

```text
http://localhost:8080
```

정적 welcome 페이지는 다음 주소로도 확인할 수 있습니다.

```text
http://localhost:8080/index.html
```

서버를 종료하려면 실행 중인 터미널에서 `Ctrl + C`를 누릅니다.

## 4. 주의 사항

- Java 8이 아니라 JDK 17 이상을 사용해야 합니다.
- `JAVA_HOME`은 `bin` 폴더가 아닌 JDK 폴더를 가리켜야 합니다.
- JRE가 아니라 JDK를 설치해야 합니다.
- Java 설정 후 기존 VS Code 터미널을 닫고 새 터미널을 열어야 합니다.
