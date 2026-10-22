from airflow.sdk import Param, dag, get_current_context, task
from dag_utils import posts_changed_since_last_build

WORKDIR = "/tmp/my-cosmos"
REPO_URL = "https://x-access-token:$GITHUB_TOKEN@github.com/predictorsSH/my-cosmos.git"


@task.bash
def clone():
    return f"rm -rf {WORKDIR} && git clone --quiet {REPO_URL} {WORKDIR} && echo {WORKDIR}"


@task.short_circuit
def is_posts_changed(work_dir: str) -> bool:
    ctx = get_current_context()
    if ctx["params"]["force"]:
        return True
    return posts_changed_since_last_build(work_dir)


@task.bash
def embedding(work_dir: str):
    return f"python {work_dir}/pipeline/cosmos/build.py"


@dag(schedule=None, max_active_runs=1, params={"force": Param(False, type="boolean")})
def cosmos_map():
    work_dir = clone()
    is_posts_changed(work_dir) >> embedding(work_dir)


cosmos_map()
