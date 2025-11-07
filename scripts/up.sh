#!/bin/bash

set -e

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo -e "${YELLOW}Bringing up the data engineering stack...${NC}"
docker compose up -d

echo -e "${GREEN}Stack is starting. Use 'docker compose logs -f' to view logs${NC}"
echo -e "${YELLOW}Services will be available at:${NC}"
echo -e "  Airflow UI: http://localhost:${AIRFLOW_WEBSERVER_PORT:-8080}"
echo -e "  HDFS NameNode UI: http://localhost:${HDFS_NAMENODE_WEBUI_PORT:-9870}"
echo -e "  Spark Master UI: http://localhost:${SPARK_MASTER_WEBUI_PORT:-8081}"
echo -e "  Jupyter: http://localhost:${JUPYTER_PORT:-8888}"
