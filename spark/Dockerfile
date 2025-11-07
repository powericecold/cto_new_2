FROM bitnami/spark:3.5.0

USER root

# Install additional Python packages and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-pip \
    && pip install --no-cache-dir \
    pyhive==0.6.5 \
    requests==2.31.0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER 1001
