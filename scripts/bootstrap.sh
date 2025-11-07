#!/bin/bash

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting bootstrap of data engineering stack...${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}.env file created${NC}"
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo -e "${YELLOW}Starting all services...${NC}"
docker compose up -d

echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Wait for PostgreSQL
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
for i in {1..30}; do
    if docker compose exec -T postgres pg_isready -U ${POSTGRES_USER:-airflow} > /dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL is ready${NC}"
        break
    fi
    echo "Waiting for PostgreSQL... ($i/30)"
    sleep 1
done

# Wait for HDFS Namenode
echo -e "${YELLOW}Waiting for HDFS Namenode to be ready...${NC}"
for i in {1..30}; do
    if docker compose exec -T hdfs-namenode curl -s http://localhost:9870 > /dev/null 2>&1; then
        echo -e "${GREEN}HDFS Namenode is ready${NC}"
        break
    fi
    echo "Waiting for HDFS Namenode... ($i/30)"
    sleep 1
done

# Format HDFS (only if not already formatted)
echo -e "${YELLOW}Checking HDFS format status...${NC}"
if [ ! -d "hdfs_namenode_volume" ]; then
    echo -e "${YELLOW}Formatting HDFS...${NC}"
    docker compose exec -T hdfs-namenode hdfs namenode -format -force || true
    sleep 5
    echo -e "${GREEN}HDFS formatted${NC}"
fi

# Create Hive warehouse directory
echo -e "${YELLOW}Creating Hive warehouse directories...${NC}"
docker compose exec -T hdfs-namenode hdfs dfs -mkdir -p /user/hive/warehouse || true
docker compose exec -T hdfs-namenode hdfs dfs -chmod -R 777 /user/hive/warehouse || true
docker compose exec -T hdfs-namenode hdfs dfs -mkdir -p /tmp || true
docker compose exec -T hdfs-namenode hdfs dfs -chmod -R 777 /tmp || true
echo -e "${GREEN}Hive warehouse directories created${NC}"

# Create data directories
echo -e "${YELLOW}Creating data directories...${NC}"
docker compose exec -T hdfs-namenode hdfs dfs -mkdir -p /data || true
docker compose exec -T hdfs-namenode hdfs dfs -chmod -R 777 /data || true
echo -e "${GREEN}Data directories created${NC}"

# Wait for Airflow Webserver
echo -e "${YELLOW}Waiting for Airflow Webserver to be ready...${NC}"
for i in {1..60}; do
    if curl -s http://localhost:${AIRFLOW_WEBSERVER_PORT:-8080}/health > /dev/null 2>&1; then
        echo -e "${GREEN}Airflow Webserver is ready${NC}"
        break
    fi
    echo "Waiting for Airflow Webserver... ($i/60)"
    sleep 1
done

# Wait for Spark Master
echo -e "${YELLOW}Waiting for Spark Master to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:${SPARK_MASTER_WEBUI_PORT:-8081} > /dev/null 2>&1; then
        echo -e "${GREEN}Spark Master is ready${NC}"
        break
    fi
    echo "Waiting for Spark Master... ($i/30)"
    sleep 1
done

# Wait for HiveServer2
echo -e "${YELLOW}Waiting for HiveServer2 to be ready...${NC}"
for i in {1..30}; do
    if nc -z localhost ${HIVESERVER2_PORT:-10000} > /dev/null 2>&1; then
        echo -e "${GREEN}HiveServer2 is ready${NC}"
        break
    fi
    echo "Waiting for HiveServer2... ($i/30)"
    sleep 1
done

# Wait for Jupyter
echo -e "${YELLOW}Waiting for Jupyter to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:${JUPYTER_PORT:-8888} > /dev/null 2>&1; then
        echo -e "${GREEN}Jupyter is ready${NC}"
        break
    fi
    echo "Waiting for Jupyter... ($i/30)"
    sleep 1
done

echo -e "${GREEN}=== Bootstrap completed successfully ===${NC}"
echo ""
echo -e "${YELLOW}Access URLs:${NC}"
echo -e "  Airflow UI: http://localhost:${AIRFLOW_WEBSERVER_PORT:-8080} (admin/admin)"
echo -e "  HDFS NameNode UI: http://localhost:${HDFS_NAMENODE_WEBUI_PORT:-9870}"
echo -e "  Spark Master UI: http://localhost:${SPARK_MASTER_WEBUI_PORT:-8081}"
echo -e "  Spark Worker UI: http://localhost:${SPARK_WORKER_WEBUI_PORT:-8082}"
echo -e "  HiveServer2: localhost:${HIVESERVER2_PORT:-10000}"
echo -e "  Jupyter: http://localhost:${JUPYTER_PORT:-8888} (token: ${JUPYTER_TOKEN:-jupyter_token})"
echo ""
