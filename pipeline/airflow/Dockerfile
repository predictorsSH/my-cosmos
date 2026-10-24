FROM apache/airflow:3.3.2

RUN pip install --no-cache-dir \
    "apache-airflow==3.3.2" \
    "sentence-transformers>=5" \
    "networkx>=3" \
    "numpy>=2" \
    "python-frontmatter>=1.1"


USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends gh \
    && rm -rf /var/lib/apt/lists/*
USER airflow
