import subprocess

REPO = "predictorsSH/my-cosmos"
PR_BRANCH = "bot/cosmos-map"
OUTPUTS = ["src/data/cosmos.json", "pipeline/cosmos/planet-titles.json"]


def _git(work_dir: str, *args: str) -> str:
    """workdir에서 git 명령을 실행하고 출력을 돌려준다. 실패하면 예외를 던진다."""
    return subprocess.run(["git", *args], cwd=work_dir, check=True, capture_output=True, text=True).stdout.strip()


def posts_changed_since_last_build(work_dir: str) -> bool:
    """cosmos.json을 마지막으로 갱신한 커밋 이후에 글이 바뀌었는지 확인한다."""
    last_build = _git(work_dir, "log", "-1", "--format=%H", "--", "src/data/cosmos.json")
    if not last_build:  # cosmos.json이 한 번도 커밋된 적 없으면 무조건 빌드
        return True
    changed = _git(work_dir, "rev-list", f"{last_build}..HEAD", "--", "src/content/posts").split()
    print(f"cosmos.json 마지막 갱신 {last_build[:7]} 이후 글 변경 커밋 {len(changed)}개")
    return bool(changed)


def is_outputs_changed(work_dir: str) -> bool:
    """빌드 결과물이 main과 달라졌는지 확인한다."""
    return bool(_git(work_dir, "status", "--porcelain", "--", *OUTPUTS))


def push_outputs(work_dir: str) -> None:
    """결과물을 bot 브랜치에 커밋하고 push한다."""
    _git(work_dir, "checkout", "-B", PR_BRANCH)
    _git(work_dir, "add", "--", *OUTPUTS)
    if _git(work_dir, "diff", "--cached", "--name-only"):  # 스테이징된 변경이 있을 때만 커밋
        _git(
            work_dir,
            "-c", "user.name=cosmos-map-bot",
            "-c", "user.email=cosmos-map-bot@users.noreply.github.com",
            "commit", "-m", "chore: 우주 지도 데이터 갱신",
        )  # fmt: skip
    _git(work_dir, "push", "--force", "origin", PR_BRANCH)


def _gh(*args: str) -> str:
    """GitHub CLI를 실행하고 출력을 돌려준다. 인증은 환경변수 GITHUB_TOKEN을 쓴다."""
    return subprocess.run(["gh", *args], check=True, capture_output=True, text=True).stdout.strip()


def open_pr_with_auto_merge() -> str:
    """bot 브랜치로 PR을 열고(이미 열려 있으면 재사용) auto merge를 켠다. PR 주소를 돌려준다."""
    url = _gh(
        "pr", "list", "--repo", REPO, "--head", PR_BRANCH, "--state", "open",
        "--json", "url", "--jq", ".[0].url",
    )  # fmt: skip
    if not url:
        url = _gh(
            "pr", "create", "--repo", REPO, "--head", PR_BRANCH, "--base", "main",
            "--title", "chore: 우주 지도 데이터 갱신",
            "--body", "Airflow `cosmos_map` DAG가 만든 PR입니다. CI가 통과하면 자동으로 머지됩니다.",
        )  # fmt: skip
    _gh("pr", "merge", url, "--repo", REPO, "--auto", "--squash")
    return url
