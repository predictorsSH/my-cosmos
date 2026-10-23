import dag_utils
from airflow.sdk import Param, dag, get_current_context, task

WORKDIR = "/tmp/my-cosmos"
REPO_URL = "https://x-access-token:$GITHUB_TOKEN@github.com/predictorsSH/my-cosmos.git"


@task.bash
def clone():
    return f"rm -rf {WORKDIR} && git clone --quiet {REPO_URL} {WORKDIR} && echo {WORKDIR}"


@task.short_circuit
def posts_changed(work_dir: str) -> bool:
    ctx = get_current_context()
    if ctx["params"]["force"]:
        return True
    return dag_utils.posts_changed_since_last_build(work_dir)


@task.bash
def build_map(work_dir: str):
    return f"python {work_dir}/pipeline/cosmos/build.py"


@task.short_circuit
def outputs_changed(work_dir: str) -> bool:
    return dag_utils.is_outputs_changed(work_dir)


@task
def push_branch(work_dir: str):
    return dag_utils.push_outputs(work_dir)


@task
def open_pr():
    return dag_utils.open_pr_with_auto_merge()


@dag(schedule=None, max_active_runs=1, params={"force": Param(False, type="boolean")})
def cosmos_map():
    work_dir = clone()
    (posts_changed(work_dir) >> build_map(work_dir) >> outputs_changed(work_dir) >> push_branch(work_dir) >> open_pr())


cosmos_map()
