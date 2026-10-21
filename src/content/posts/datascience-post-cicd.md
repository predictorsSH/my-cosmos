---
title: 간단한 CI 파이프라인 실습
date: 2026-08-03
category: DataScience
image: /images/posts/datascience/teamcity/teamcity.png
excerpt: TeamCity로 Continuous Integration 파이프라인 실습
---

바야흐로 코드를 AI가 생성하는 시대다.
어쩌면 이제 모든 개발자에게 가장 중요하는 덕목은 코드를 잘 검증하는 능력이다.
생성은 AI가 잘 하니까.
지속적으로 코드를 검증하려면 CI 파이프라인을 잘 구축해둬야한다.

데이터 사이언티스트는 보통 잘 구축된 CI를 사용하는 사람이다. 지금 우리 회사는 아주 CI/CD가 아주 잘 구축 되어있고 난 역시 그냥 그 플로우에 몸을 맡기고있다.
그런데 혹시 이직 한 곳에 CI/CD가 없다면...?

그래서 TeamCity를 활용해 간단한 CI 파이프라인을 구축해보았다.
그리고 그 실습 과정을 클로드가 아래와 같이 정리 해줬다.

# TeamCity 로컬 실습 정리

로컬 Docker 환경에 TeamCity 서버+에이전트를 직접 띄우고, GitHub 저장소를 연결해서
"push하면 테스트가 도는" 최소한의 CI 파이프라인을 처음부터 끝까지 만들어본 실습 기록.

## 1. 환경 구축

`~/teamcity-local-lab/docker-compose.yml`로 서버/에이전트 2개 컨테이너를 띄움.

```yaml
services:
  teamcity-server:
    image: jetbrains/teamcity-server:latest
    ports:
      - "8111:8111"
    volumes:
      - ./server-data:/data/teamcity_server/datadir
      - ./server-logs:/opt/teamcity/logs

  teamcity-agent:
    image: jetbrains/teamcity-agent:latest
    environment:
      - SERVER_URL=http://teamcity-server:8111
    volumes:
      - ./agent-conf:/data/teamcity_agent/conf
    depends_on:
      - teamcity-server
```

- 이미지는 JetBrains가 Docker Hub에 공식 배포하는 것 (`jetbrains/teamcity-server`, `jetbrains/teamcity-agent`)
- `volumes`로 컨테이너 데이터를 로컬 폴더에 영속화 → 컨테이너를 지워도 서버 설정은 안 날아감
- `docker compose up -d`로 실행, `http://localhost:8111`로 접속

## 2. 초기 설정 마법사

1. **DB 선택**: 내장 HSQLDB 선택 (실습용, 운영 환경에서는 외부 DB 필수)
2. **라이선스 동의**: Professional(무료) 라이선스로 시작 — 에이전트 3개, 프로젝트 100개까지 무료
3. **관리자 계정** 생성 → 로그인
4. **Agents** 메뉴에서 자동 등록된 에이전트를 **Authorize** (보안상 새 에이전트는 관리자 승인 필요)

## 3. GitHub 저장소 연결해서 프로젝트 만들기

- 연습용 public 저장소 생성: `github.com/predictorsSH/teamcity-practice`
- 로컬에 clone 후 간단한 코드 추가:

```python
# app.py
def add(a, b):
    return a + b
```

```python
# test_app.py
from app import add

def test_add():
    assert add(2, 3) == 5
```

- TeamCity에서 **Create project → Any Git URL**로 저장소 연결
- **Build configuration**(단일 빌드) 생성 — TeamCity가 저장소를 스캔해서 "Python / Pytest" 빌드 스텝을 자동 제안

## 4. 첫 실패: pip이 없음

에이전트 컨테이너 안에 Python 3.12는 있었지만 **pip이 설치되어 있지 않아서** 빌드가 바로 실패.

```
/usr/bin/python3: No module named pip
```

→ **"에이전트에 어떤 도구가 깔려있는지는 보장되지 않는다"**는 걸 직접 확인한 부분.
빌드 스텝마다 필요한 도구가 이미 설치된 도커 이미지를 지정(`dockerImage`)해두면
이런 문제 자체가 안 생김.

## 5. 단순한 방식으로 성공

빌드 스텝을 **Command Line** 러너로 바꿔서, 직접 필요한 도구를 설치하는 스크립트를 작성:

```bash
curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python3 get-pip.py --user --break-system-packages
export PATH=$HOME/.local/bin:$PATH
pip install --user --break-system-packages pytest
python3 -m pytest -v test_app.py
```

- `get-pip.py`: pip 자체를 설치해주는 공식 부트스트랩 스크립트 (root 권한 불필요, `--user`로 계정 범위에만 설치)
- `--break-system-packages`: 우분투/데비안이 시스템 파이썬 보호를 위해 pip 직접 설치를 막아둔 것(PEP 668)을 우회
- `export PATH=...`: `--user` 설치 시 실행파일이 `~/.local/bin`에 생기는데 기본 PATH에 없어서 추가

→ **빌드 성공.** `push → 저장소 체크아웃 → 도구 설치 → pytest 실행` 흐름을 처음부터 끝까지 완주함.

## 6. 이번 실습 방식 vs 실제 운영 방식 비교

| | 이번 실습 | 실제 운영(`dockerImage` 지정 방식) |
|---|---|---|
| 도구 설치 시점 | 빌드할 때마다 스크립트로 매번 설치 | 도커 이미지 빌드 시점에 미리 설치 완료 |
| 빌드 스텝 내용 | pip 설치 → pytest 설치 → 테스트 실행 (5줄) | 의존성 설치 명령 → 테스트 실행 (거의 즉시 실행) |
| 속도 | 매번 다운로드/설치 시간 소요 | 이미지 재사용이라 빠름 |
| 환경 일관성 | 실행할 때마다 최신 버전을 새로 받아서 불안정할 수 있음 | 이미지 태그로 버전 고정 → 항상 동일 |

실제로 프로젝트에 CI/CD를 적용할 때는, 이번처럼 매번 설치하는 방식이 아니라
**필요한 패키지가 미리 설치된 도커 이미지를 만들어서 빌드 스텝에 지정하는 방식**을 써야 함.

## 7. 정리: 정석인 것 vs 로컬 실습이라 임시로 한 것

정석에 해당하는 것:

- `docker compose`로 서버/에이전트를 컨테이너로 구성
- 빌드 스텝을 특정 도커 이미지 안에서 실행하는 방식 자체 (`dockerImage` 지정)
- `param`으로 환경변수 주입, 실패 시에만 실행되는 스텝(`executionMode`) 구성

로컬 실습이라 임시로 한 것 (실제 운영 환경에 그대로 적용하면 안 되는 것):

- 빌드 스텝 안에서 매 빌드마다 pip을 직접 설치하는 방식
- Docker-in-Docker (에이전트 컨테이너 안에 또 Docker를 중첩해서 넣는 것) — 로컬 환경에서 시도했다가
  호환성 문제가 계속 발생해서 포기하고 단순한 방식으로 전환함

## 8. 브랜치 관련 설정

TeamCity에는 브랜치 감지와 관련된 설정이 두 겹으로 있다는 걸 확인함:

1. **Trigger의 Branch filter** (`Triggers` 탭 → VCS Trigger): 어떤 브랜치의 변경사항에 빌드를 트리거할지
2. **VCS Root의 Branch specification** (`Version Control` 탭 → VCS Root → Show advanced options): 애초에
   어떤 브랜치들을 감지 대상으로 삼을지. 비어있으면 default 브랜치(main)만 봄

두 설정이 서로 다른 레이어라, 브랜치 push가 감지 안 되는 것처럼 보일 때는 둘 다 확인해봐야 함
(`+:*` / `+:refs/heads/*` 형태로 설정).

브랜치에 push한 뒤 그 브랜치를 main에 머지하면 **또 한 번 빌드가 도는 것도 정상 동작**임
(머지 자체가 main에 새 커밋을 만드는 이벤트라 VCS Trigger가 다시 감지함 — 브랜치 검증 + 머지 후 재검증의 이중 안전장치).

## 9. Versioned Settings로 "코드로 파이프라인 관리하기" 전환

지금까지는 전부 웹 UI로 설정했는데, **`.teamcity/settings.kts` 파일로 파이프라인을 코드화**하는
"Versioned Settings" 기능을 켜봄.

1. Project 설정(프로젝트 레벨. Build configuration 레벨과 다름 주의) → **Versioned Settings**
2. **Synchronization enabled** 선택, VCS root로 저장소 지정, format은 **Kotlin**
3. **"Commit current project settings..."** 클릭 → 지금까지 UI로 만든 설정이 Kotlin 코드로 변환되어
   저장소에 `.teamcity/settings.kts`로 실제 커밋됨

생성된 코드 구조:

```kotlin
project {
    buildType(Build)
}

object Build : BuildType({
    name = "Build"
    vcs { root(DslContext.settingsRoot) }
    steps {
        script { scriptContent = "..." }
    }
    triggers {
        vcs { }
    }
})
```

`project { buildType(...) }` / `object ... : BuildType({ ... })` / `steps { script { } }` / `triggers { vcs { } }` —
이 문법 규격 자체가 TeamCity Kotlin DSL이라는 하나의 표준으로 통일되어 있음.

### 코드 직접 수정해보기

로컬 clone에서 `.teamcity/settings.kts`를 직접 열어 `triggers` 블록에 `branchFilter = "+:*"`를 추가하고 push:

```bash
cd ~/teamcity-practice
git pull
# .teamcity/settings.kts 수정
git add .teamcity/settings.kts
git commit -m "Add branch filter to trigger all branches"
git push
```

→ 웹 UI를 건드리지 않고, git push만으로 파이프라인 설정이 바뀌는 것을 확인.

**"When build starts" 옵션**(Versioned Settings 설정 안에 있음)을 "always use current settings"로 두면,
어떤 커밋이 빌드를 트리거했든 상관없이 항상 서버에 동기화된 최신 설정을 사용함 —
즉 `settings.kts`를 고친 커밋 자체의 빌드에도 그 변경사항이 바로 적용됨.

## 10. GitHub에 빌드 상태 표시하기 (Commit Status Publisher)

TeamCity 빌드 결과를 GitHub 커밋/PR 화면에 초록 체크·빨간 X로 보여주는 기능.

1. Build configuration → **Build Features** → **Add build feature** → **Commit status publisher**
2. VCS root: 저장소 선택, Publisher: **GitHub**
3. Authentication: GitHub Personal Access Token 입력 (단순 읽기 권한(`public_repo`)로는 부족해서
   **`repo`** 전체 스코프로 토큰을 새로 만들어야 했음 — 커밋 상태 "쓰기"는 더 높은 권한 필요)

→ 이후 push하면 GitHub PR 화면에 `TeamCity build failed/succeeded` 형태로 상태가 표시됨.



- 구축 된 teamcity 빌드 화면

![Teamcitiy](/images/posts/datascience/teamcity/teamcity.png)

CI는 검증을 사람이 수동으로 하지 않고, 코드가 바뀔 때마다 자동으로, 빠르게, 일관되게 한다
CI를 잘 구축하면, 사람이 놓치는 실수도 잡아주고 문제도 빨리 발견하고, 룰을 시스템으로 컨트롤 할 수 있게 된다.
CI는 있으면 좋은게 아닌 필수다.