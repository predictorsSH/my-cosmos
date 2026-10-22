from airflow.sdk import dag, task

WORKDIR = "/tmp/my-cosmos"
REPO_URL = "https://x-access-token:$GITHUB_TOKEN@github.com/predictorsSH/my-cosmos.git"


@task.bash
def clone():
    return f"rm -rf {WORKDIR} && git clone --quiet {REPO_URL} {WORKDIR} && echo {WORKDIR}"


@dag(schedule=None, max_active_runs=1)
def cosmos_map():
    clone()


cosmos_map()
