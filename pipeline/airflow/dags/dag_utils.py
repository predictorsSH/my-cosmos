import subprocess


def _git(workdir: str, *args: str) -> str:
    """workdir에서 git 명령을 실행하고 출력을 돌려준다. 실패하면 예외를 던진다."""
    return subprocess.run(["git", *args], cwd=workdir, check=True, capture_output=True, text=True).stdout.strip()


def posts_changed_since_last_build(workdir: str) -> bool:
    """cosmos.json을 마지막으로 갱신한 커밋 이후에 글이 바뀌었는지 확인한다."""
    last_build = _git(workdir, "log", "-1", "--format=%H", "--", "src/data/cosmos.json")
    if not last_build:  # cosmos.json이 한 번도 커밋된 적 없으면 무조건 빌드
        return True
    changed = _git(workdir, "rev-list", f"{last_build}..HEAD", "--", "src/content/posts").split()
    print(f"cosmos.json 마지막 갱신 {last_build[:7]} 이후 글 변경 커밋 {len(changed)}개")
    return bool(changed)
