FROM bde2020/hive:latest

USER root

# Install additional dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER root
