#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo -e "${YELLOW}Checking data engineering stack health...${NC}"
echo ""

# Function to check service
check_service() {
    local service=$1
    local check_cmd=$2
    local description=$3
    
    if eval "$check_cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $description"
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        return 1
    fi
}

# Initialize counters
total=0
healthy=0

# Check Airflow Webserver
total=$((total + 1))
if check_service "airflow-webserver" "curl -s http://localhost:${AIRFLOW_WEBSERVER_PORT:-8080}/health" "Airflow Webserver (http://localhost:${AIRFLOW_WEBSERVER_PORT:-8080})"; then
    healthy=$((healthy + 1))
fi

# Check HDFS NameNode
total=$((total + 1))
if check_service "hdfs-namenode" "curl -s http://localhost:${HDFS_NAMENODE_WEBUI_PORT:-9870}" "HDFS NameNode (http://localhost:${HDFS_NAMENODE_WEBUI_PORT:-9870})"; then
    healthy=$((healthy + 1))
fi

# Check HDFS DataNode
total=$((total + 1))
if check_service "hdfs-datanode" "nc -z localhost ${HDFS_DATANODE_PORT:-9864}" "HDFS DataNode (localhost:${HDFS_DATANODE_PORT:-9864})"; then
    healthy=$((healthy + 1))
fi

# Check Spark Master
total=$((total + 1))
if check_service "spark-master" "curl -s http://localhost:${SPARK_MASTER_WEBUI_PORT:-8081}" "Spark Master UI (http://localhost:${SPARK_MASTER_WEBUI_PORT:-8081})"; then
    healthy=$((healthy + 1))
fi

# Check Spark Worker
total=$((total + 1))
if check_service "spark-worker" "curl -s http://localhost:${SPARK_WORKER_WEBUI_PORT:-8082}" "Spark Worker UI (http://localhost:${SPARK_WORKER_WEBUI_PORT:-8082})"; then
    healthy=$((healthy + 1))
fi

# Check PostgreSQL (Airflow)
total=$((total + 1))
if check_service "postgres-airflow" "docker compose exec -T postgres pg_isready -U ${POSTGRES_USER:-airflow}" "PostgreSQL - Airflow (localhost:${POSTGRES_PORT:-5432})"; then
    healthy=$((healthy + 1))
fi

# Check PostgreSQL (Hive)
total=$((total + 1))
if check_service "postgres-hive" "docker compose exec -T postgres-hive pg_isready -U ${HIVE_METASTORE_USER:-hive}" "PostgreSQL - Hive (localhost:5433)"; then
    healthy=$((healthy + 1))
fi

# Check Redis
total=$((total + 1))
if check_service "redis" "docker compose exec -T redis redis-cli ping | grep -q PONG" "Redis (localhost:6379)"; then
    healthy=$((healthy + 1))
fi

# Check HiveServer2
total=$((total + 1))
if check_service "hive-server2" "nc -z localhost ${HIVESERVER2_PORT:-10000}" "HiveServer2 (localhost:${HIVESERVER2_PORT:-10000})"; then
    healthy=$((healthy + 1))
fi

# Check Jupyter
total=$((total + 1))
if check_service "jupyter" "curl -s http://localhost:${JUPYTER_PORT:-8888}" "Jupyter Notebook (http://localhost:${JUPYTER_PORT:-8888})"; then
    healthy=$((healthy + 1))
fi

# Check Hive Metastore
total=$((total + 1))
if check_service "hive-metastore" "nc -z localhost 9083" "Hive Metastore (localhost:9083)"; then
    healthy=$((healthy + 1))
fi

echo ""
echo -e "${YELLOW}Summary: ${healthy}/${total} services healthy${NC}"

if [ $healthy -eq $total ]; then
    echo -e "${GREEN}All services are healthy!${NC}"
    exit 0
else
    echo -e "${RED}Some services are not responding. Check logs with 'make logs'${NC}"
    exit 1
fi
