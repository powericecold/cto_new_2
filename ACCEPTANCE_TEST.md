# Acceptance Test Guide

This document outlines the acceptance criteria and testing procedures for the data engineering stack.

## Prerequisites

- Docker and Docker Compose installed and running
- 4GB+ RAM available
- 10GB+ free disk space
- `curl`, `nc` (netcat), and `bash` available on the host

## Acceptance Criteria

The following criteria must all be met for successful stack deployment:

### 1. Docker Compose Stack Starts Successfully

**Criterion**: Running `docker compose up` starts all services without crashes

**Test Steps**:
```bash
docker compose up -d
sleep 30
docker compose ps
```

**Expected Result**: All services show status "Up", no services in "Exited" state

**Verification**:
```bash
make status
```

### 2. Airflow UI Reachable on Configured Port

**Criterion**: Airflow WebServer responds on configured port (default: 8080)

**Test Steps**:
```bash
curl -f http://localhost:8080/health
```

**Expected Result**: HTTP 200 response with health status

**Manual Verification**:
- Open http://localhost:8080 in browser
- Should see Airflow login page
- Login with admin/admin
- Should access Airflow dashboard

### 3. HDFS Web UI Responds

**Criterion**: HDFS NameNode web interface responds on configured port (default: 9870)

**Test Steps**:
```bash
curl -s http://localhost:9870 | head -20
```

**Expected Result**: HTML content containing NameNode UI

**Manual Verification**:
- Open http://localhost:9870 in browser
- Should see HDFS web UI dashboard
- Should show cluster information

**Command-line Verification**:
```bash
docker compose exec hdfs-namenode hdfs dfsadmin -report
```

### 4. Spark Master UI Accessible

**Criterion**: Spark Master web interface responds on configured port (default: 8081)

**Test Steps**:
```bash
curl -s http://localhost:8081 | head -20
```

**Expected Result**: HTML content containing Spark Master UI

**Manual Verification**:
- Open http://localhost:8081 in browser
- Should see Spark cluster overview
- Should show 1 worker node connected

**Additional Verification**:
```bash
docker compose logs spark-master | grep "Started MasterUI"
```

### 5. HiveServer2 Listens on Port 10000

**Criterion**: HiveServer2 service responds on configured port (default: 10000)

**Test Steps**:
```bash
nc -z -v localhost 10000
```

**Expected Result**: Connection successful

**Alternative Verification**:
```bash
docker compose exec hive-server2 netstat -tuln | grep 10000
```

**Beeline Connection Test**:
```bash
docker compose exec hive-server2 beeline -u jdbc:hive2://localhost:10000 -e "SHOW DATABASES;"
```

### 6. Jupyter Launches with Mounted Notebooks Directory

**Criterion**: Jupyter Notebook server starts and serves on configured port (default: 8888)

**Test Steps**:
```bash
curl -s http://localhost:8888 | head -20
```

**Expected Result**: Jupyter interface loads

**Manual Verification**:
- Open http://localhost:8888 in browser (with token: jupyter_token)
- Should see Jupyter Lab interface
- Should see mounted directories:
  - /home/jovyan/work/notebooks
  - /home/jovyan/work/data
  - /home/jovyan/work/scripts

**Token Verification**:
```bash
docker compose logs jupyter | grep token
```

## Complete Acceptance Test Suite

Run these commands to verify all acceptance criteria:

```bash
#!/bin/bash

echo "=== Data Engineering Stack Acceptance Test Suite ==="
echo ""

# Test 1: All services running
echo "[1/6] Checking all services are running..."
RUNNING=$(docker compose ps | grep "Up" | wc -l)
TOTAL=$(docker compose ps | grep -E "(Up|Exited)" | wc -l)
echo "Services running: $RUNNING/$TOTAL"
[ $RUNNING -eq $TOTAL ] && echo "✓ PASS" || echo "✗ FAIL"
echo ""

# Test 2: Airflow Webserver
echo "[2/6] Checking Airflow Webserver..."
if curl -sf http://localhost:8080/health > /dev/null 2>&1; then
    echo "✓ PASS - Airflow responding on port 8080"
else
    echo "✗ FAIL - Airflow not responding"
fi
echo ""

# Test 3: HDFS NameNode
echo "[3/6] Checking HDFS NameNode..."
if curl -sf http://localhost:9870 > /dev/null 2>&1; then
    echo "✓ PASS - HDFS NameNode responding on port 9870"
else
    echo "✗ FAIL - HDFS NameNode not responding"
fi
echo ""

# Test 4: Spark Master
echo "[4/6] Checking Spark Master..."
if curl -sf http://localhost:8081 > /dev/null 2>&1; then
    echo "✓ PASS - Spark Master responding on port 8081"
else
    echo "✗ FAIL - Spark Master not responding"
fi
echo ""

# Test 5: HiveServer2
echo "[5/6] Checking HiveServer2..."
if nc -z localhost 10000 2>/dev/null; then
    echo "✓ PASS - HiveServer2 listening on port 10000"
else
    echo "✗ FAIL - HiveServer2 not listening"
fi
echo ""

# Test 6: Jupyter
echo "[6/6] Checking Jupyter..."
if curl -sf http://localhost:8888 > /dev/null 2>&1; then
    echo "✓ PASS - Jupyter responding on port 8888"
else
    echo "✗ FAIL - Jupyter not responding"
fi
echo ""

echo "=== Acceptance Test Complete ==="
```

Save this as `acceptance-test.sh` and run:

```bash
chmod +x acceptance-test.sh
./acceptance-test.sh
```

## Extended Verification Tests

### Test HDFS Functionality

```bash
# Create a directory in HDFS
docker compose exec hdfs-namenode hdfs dfs -mkdir -p /test

# List root directory
docker compose exec hdfs-namenode hdfs dfs -ls /

# Create a file
docker compose exec hdfs-namenode bash -c 'echo "test data" | hdfs dfs -put - /test/testfile.txt'

# Read the file
docker compose exec hdfs-namenode hdfs dfs -cat /test/testfile.txt
```

### Test Hive Functionality

```bash
# Connect to Hive
docker compose exec hive-server2 beeline -u jdbc:hive2://localhost:10000

# Inside beeline, run:
# SHOW DATABASES;
# CREATE TABLE test (id INT, name STRING);
# SHOW TABLES;
```

### Test Spark Functionality

```bash
# Submit a test Spark job
docker compose exec spark-master spark-submit \
  --master spark://spark-master:7077 \
  --class org.apache.spark.examples.SparkPi \
  /opt/spark/examples/jars/spark-examples_2.12-3.5.0.jar 10

# Check Spark Master UI to see the completed job
```

### Test Airflow Functionality

```bash
# Check Airflow logs
docker compose logs airflow-scheduler | head -50

# Trigger the example DAG
# 1. Open http://localhost:8080
# 2. Find "example_dag" in the DAG list
# 3. Click on it, then click the trigger button
# 4. Monitor execution in the UI
```

### Test Jupyter Functionality

```bash
# Create a simple test notebook in Jupyter:
# 1. Open http://localhost:8888?token=jupyter_token
# 2. Create a new Python notebook
# 3. Run this code:

from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .master("spark://spark-master:7077") \
    .appName("test") \
    .getOrCreate()

df = spark.createDataFrame([(1, "a"), (2, "b")], ["id", "letter"])
df.show()
```

## Health Check Using Provided Tools

The repository includes a health check script:

```bash
make health
```

This will verify all services and display results.

## Troubleshooting Failed Tests

### If services won't start:

1. Check Docker is running:
```bash
docker ps
```

2. Check system resources:
```bash
docker stats
```

3. Review full logs:
```bash
docker compose logs
```

### If a specific service fails:

```bash
# View logs for specific service
docker compose logs SERVICE_NAME

# Restart specific service
docker compose restart SERVICE_NAME

# Rebuild specific service
docker compose build --no-cache SERVICE_NAME
```

### If ports are already in use:

1. Check what's using the port:
```bash
lsof -i :PORT_NUMBER
```

2. Edit `.env` to use different ports:
```bash
cp .env.example .env
# Edit .env and change ports
docker compose down
docker compose up -d
```

## Performance Considerations

Expected startup times (from `docker compose up` to all services ready):

- PostgreSQL: 10-15 seconds
- Redis: 5-10 seconds
- Airflow Init: 30-60 seconds
- Airflow Webserver: 30-60 seconds
- HDFS NameNode: 20-30 seconds
- HDFS DataNode: 20-30 seconds
- Spark Master: 15-20 seconds
- Spark Worker: 15-20 seconds
- Hive Metastore: 30-60 seconds
- HiveServer2: 30-60 seconds
- Jupyter: 20-30 seconds

**Total expected time: 5-10 minutes** for complete bootstrap and all services to be ready.

## Success Criteria Summary

✓ All 11 services running without crashes
✓ Airflow UI accessible at http://localhost:8080
✓ HDFS web UI accessible at http://localhost:9870
✓ Spark Master UI accessible at http://localhost:8081
✓ HiveServer2 listening on port 10000
✓ Jupyter accessible at http://localhost:8888
✓ All services pass health checks
✓ HDFS commands working
✓ Spark jobs can be submitted
✓ Hive tables can be created
✓ Jupyter can connect to Spark

## Test Sign-Off

Date: _________________
Tester: ________________
Result: [ ] PASS [ ] FAIL

Notes:
