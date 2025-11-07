# Quick Start Guide

Get the data engineering stack up and running in 5 minutes.

## Prerequisites

- Docker and Docker Compose installed
- 4GB+ RAM available
- 10GB+ free disk space

## Steps

### 1. Create .env File

```bash
cp .env.example .env
```

No changes needed for default setup, but you can customize ports and credentials if desired.

### 2. Bootstrap the Stack

```bash
make bootstrap
```

This single command will:
- Build all Docker images
- Start all services
- Initialize databases
- Format HDFS
- Create necessary directories
- Wait for all services to be healthy

### 3. Verify Services Are Running

```bash
make status
```

You should see all services with status "Up".

### 4. Access Services

Open these URLs in your browser:

| Service | URL | Credentials |
|---------|-----|-------------|
| Airflow | http://localhost:8080 | admin / admin |
| HDFS NameNode | http://localhost:9870 | - |
| Spark Master | http://localhost:8081 | - |
| Jupyter | http://localhost:8888 | Token: jupyter_token |

## Common Tasks

### View Logs

```bash
make logs          # All services
make logs-airflow  # Airflow only
make logs-spark    # Spark only
```

### Stop the Stack

```bash
make down
```

Data is preserved in volumes.

### Restart the Stack

```bash
make up
```

### Full Cleanup

```bash
make clean
```

Removes all containers and volumes.

## First DAG

1. Navigate to `http://localhost:8080` (Airflow UI)
2. Create a DAG file in the `airflow/` directory named `hello_world.py`:

```python
from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime

with DAG(
    'hello_world',
    start_date=datetime(2024, 1, 1),
    schedule_interval='@daily',
    catchup=False,
) as dag:
    task = BashOperator(
        task_id='hello',
        bash_command='echo "Hello from Airflow!"'
    )
```

3. The DAG will appear in Airflow within 30 seconds
4. Click it to view and trigger manually

## First Jupyter Notebook

1. Open http://localhost:8888 (token: jupyter_token)
2. Create a new Python notebook
3. Test PySpark:

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .master("spark://spark-master:7077") \
    .appName("test") \
    .getOrCreate()

df = spark.createDataFrame([(1, "a"), (2, "b")], ["id", "letter"])
df.show()
```

## Troubleshooting

### Services won't start

Check logs:
```bash
docker compose logs
```

Ensure Docker has enough resources (check Docker Desktop settings).

### Can't connect to Jupyter

Verify port 8888 is not in use, or change `JUPYTER_PORT` in `.env`.

### HDFS issues

Check namenode status:
```bash
docker compose exec hdfs-namenode hdfs dfsadmin -report
```

### Airflow database issues

Reinitialize:
```bash
make clean
make bootstrap
```

## Next Steps

- Read [README.md](README.md) for detailed documentation
- Explore Airflow at http://localhost:8080
- Create your first DAG in the `airflow/` directory
- Write notebooks in `notebooks/` (available in Jupyter)
- Submit Spark jobs using `spark-submit`

## Help

For issues, check:
1. Service logs: `make logs`
2. Docker status: `docker compose ps`
3. Full README: [README.md](README.md)
