# Data Engineering Stack

A comprehensive Docker Compose-based data engineering platform designed to run on resource-constrained laptops with support for multi-architecture deployments (including ARM64).

## Features

- **Apache Airflow**: Workflow orchestration with webserver, scheduler, and triggerer
- **Apache Spark**: Distributed processing with master and worker nodes
- **Hadoop HDFS**: Distributed file system with namenode and datanode
- **Apache Hive**: Data warehouse with HiveServer2 and PostgreSQL metastore
- **Jupyter Notebook**: Interactive notebook environment with PySpark integration
- **PostgreSQL**: Metadata storage for Airflow and Hive
- **Redis**: Message broker for Airflow Celery executor

## System Requirements

- Docker and Docker Compose
- Minimum 4GB RAM available
- Minimum 10GB disk space for volumes
- Supported architectures: x86_64, arm64 (Apple Silicon, etc.)

## Quick Start

### 1. First Time Setup

Clone or navigate to the project directory and run:

```bash
make bootstrap
```

This will:
- Create a `.env` file from `.env.example`
- Build all Docker images
- Start all services
- Format HDFS and initialize directories
- Wait for all services to be healthy

### 2. Access the Services

After bootstrap completes, access the UIs:

- **Airflow UI**: http://localhost:8080 (login: admin/admin)
- **HDFS NameNode UI**: http://localhost:9870
- **Spark Master UI**: http://localhost:8081
- **Spark Worker UI**: http://localhost:8082
- **HiveServer2**: localhost:10000 (via Beeline or JDBC)
- **Jupyter Notebook**: http://localhost:8888 (token: jupyter_token)

## Common Commands

### Start the Stack

```bash
make up
```

Or use Docker Compose directly:

```bash
docker compose up -d
```

### Stop the Stack

```bash
make down
```

Stops and removes containers but preserves volumes.

```bash
make stop
```

Stops containers without removing them.

### View Logs

```bash
# All services
make logs

# Specific services
make logs-airflow
make logs-spark
make logs-hdfs
make logs-hive
```

### Check Status

```bash
make status
```

### Restart Services

```bash
make restart
```

### Clean Up Everything

```bash
make clean
```

Removes all containers and volumes.

## Configuration

Edit `.env` to customize:

- Ports for each service
- Database credentials
- Resource limits (CPU and memory)
- Jupyter token
- HDFS configuration (replication factor, block size)

### Important Environment Variables

```
AIRFLOW_WEBSERVER_PORT=8080          # Airflow UI port
AIRFLOW_UID=50000                     # Airflow user ID
POSTGRES_USER=airflow                 # Database user
POSTGRES_PASSWORD=airflow             # Database password
SPARK_MASTER_PORT=7077                # Spark master port
HDFS_NAMENODE_PORT=9000               # HDFS port
HIVESERVER2_PORT=10000                # HiveServer2 port
JUPYTER_PORT=8888                     # Jupyter port
JUPYTER_TOKEN=jupyter_token            # Jupyter access token
CPU_LIMIT=2.0                         # CPU limit per service
MEMORY_LIMIT=2g                       # Memory limit per service
```

## Directory Structure

```
.
├── airflow/              # Airflow Dockerfile and configuration
├── spark/                # Spark Dockerfile and configuration
├── hive/                 # Hive Dockerfile and configuration
├── infra/                # Infrastructure Dockerfiles (Hadoop)
├── notebooks/            # Jupyter notebooks directory
├── data/                 # Shared data directory
├── scripts/              # Helper scripts
├── docker-compose.yml    # Main compose file
├── Makefile              # Task automation
├── .env.example          # Environment variables template
└── README.md             # This file
```

## Docker Compose Services

### Databases

- **postgres**: PostgreSQL for Airflow metadata (port 5432)
- **postgres-hive**: PostgreSQL for Hive metastore (port 5433)
- **redis**: Redis broker for Celery (port 6379)

### Airflow

- **airflow-init**: Initialization job (runs once)
- **airflow-webserver**: UI server (port 8080)
- **airflow-scheduler**: DAG scheduler
- **airflow-triggerer**: Async trigger handler

### Spark

- **spark-master**: Spark master node (port 7077, UI 8081)
- **spark-worker**: Spark worker node (UI 8082)

### Hadoop HDFS

- **hdfs-namenode**: HDFS namenode (port 9000, UI 9870)
- **hdfs-datanode**: HDFS datanode (port 9864)

### Hive

- **hive-metastore**: Hive metastore service (port 9083)
- **hive-server2**: HiveServer2 (port 10000)

### Jupyter

- **jupyter**: Jupyter Lab with PySpark (port 8888)

## Advanced Tasks

### Manually Format HDFS

```bash
make format-hdfs
```

### Initialize Airflow Database

```bash
make init-airflow
```

### Create Hive Directories

```bash
make create-hive-dirs
```

### Shell Access

```bash
# HDFS namenode shell
make shell-hdfs

# Spark master shell
make shell-spark
```

## Troubleshooting

### Services Fail to Start

Check logs:
```bash
docker compose logs -f
```

Ensure you have enough disk space and RAM available.

### HDFS Not Responding

Verify HDFS namenode is healthy:
```bash
docker compose exec hdfs-namenode hdfs dfsadmin -report
```

### Airflow Can't Connect to Database

Verify PostgreSQL is running:
```bash
docker compose ps postgres
```

Check database connectivity:
```bash
docker compose exec postgres psql -U airflow -d airflow -c "SELECT version();"
```

### Jupyter Token Not Working

The token is set in the `.env` file. Default is `jupyter_token`. To access Jupyter, use:

```
http://localhost:8888?token=jupyter_token
```

Or check the logs:
```bash
docker compose logs jupyter
```

## Resource Management

All services have CPU and memory limits defined to work on resource-constrained systems:

- Airflow: 1 CPU, 512MB RAM
- Spark Master: 1 CPU, 512MB RAM
- Spark Worker: 1 CPU, 512MB RAM
- HDFS Namenode: 1 CPU, 512MB RAM
- HDFS Datanode: 1 CPU, 512MB RAM
- Hive: 0.5 CPU, 256MB RAM
- Jupyter: 2 CPU, 1GB RAM

You can adjust these in `.env` or `docker-compose.yml`.

## Data Persistence

All data is persisted in Docker volumes:

- `postgres_data`: Airflow metadata
- `postgres_hive_data`: Hive metastore
- `hdfs_namenode`: HDFS name node data
- `hdfs_datanode`: HDFS data node data
- `hive_warehouse`: Hive warehouse data
- `airflow_dags`: Airflow DAG files
- `shared_data`, `shared_notebooks`, `shared_scripts`: Shared across services

Volumes are preserved when using `make down` or `docker compose down`. Use `make clean` to remove them.

## Writing DAGs

Place DAG files in the `airflow/dags/` directory. They will be automatically picked up by Airflow.

Example:

```python
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'airflow',
    'start_date': datetime(2024, 1, 1),
}

with DAG(
    'example_dag',
    default_args=default_args,
    schedule_interval=timedelta(days=1),
) as dag:
    task1 = BashOperator(
        task_id='hello',
        bash_command='echo "Hello from Airflow"',
    )
```

## Submitting Spark Jobs

Connect to Spark master at `spark://spark-master:7077` from Airflow or submit jobs directly:

```bash
docker compose exec spark-master spark-submit \
  --master spark://spark-master:7077 \
  /path/to/job.py
```

## Using HiveServer2

Connect via Beeline:

```bash
docker compose exec hive-server2 beeline -u jdbc:hive2://hive-server2:10000
```

Or connect from Spark:

```python
df = spark.sql("SELECT * FROM my_table")
```

## Connecting to Jupyter

Access Jupyter at: http://localhost:8888

Mount points available in Jupyter:
- `/home/jovyan/work/notebooks` - Notebooks directory
- `/home/jovyan/work/data` - Shared data
- `/home/jovyan/work/scripts` - Scripts directory

## Building Custom Images

To rebuild all images:

```bash
make build
```

Or rebuild specific service:

```bash
docker compose build --no-cache airflow
```

## Performance Tuning

For better performance on resource-constrained systems:

1. Increase CPU/Memory limits in `.env`
2. Reduce Spark worker memory in `docker-compose.yml`
3. Enable HDFS caching if available
4. Use appropriate Spark configurations for your workload

## Support

For issues or questions, check:

1. Docker Compose logs: `docker compose logs -f`
2. Service-specific logs: `make logs-<service>`
3. Docker Desktop Dashboard (if using Docker Desktop)

## License

This project is provided as-is for educational and development purposes.
