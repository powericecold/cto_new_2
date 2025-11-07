.PHONY: help bootstrap up down logs stop restart clean format-hdfs init-airflow create-hive-dirs status health

help:
    @echo "Data Engineering Stack - Available Commands"
    @echo ""
    @echo "  make bootstrap       - Initialize the stack for first time (creates .env, builds, and starts services)"
    @echo "  make up              - Start the stack (docker compose up)"
    @echo "  make down            - Stop the stack (docker compose down)"
    @echo "  make stop            - Stop the stack without removing volumes"
    @echo "  make restart         - Restart the stack"
    @echo "  make logs            - View logs from all services"
    @echo "  make logs-airflow    - View Airflow logs"
    @echo "  make logs-spark      - View Spark logs"
    @echo "  make logs-hdfs       - View HDFS logs"
    @echo "  make logs-hive       - View Hive logs"
    @echo "  make status          - Show status of all services"
    @echo "  make health          - Check health of all services"
    @echo "  make format-hdfs     - Format HDFS namenode"
    @echo "  make init-airflow    - Initialize Airflow database"
    @echo "  make create-hive-dirs - Create Hive warehouse directories"
    @echo "  make clean           - Remove all containers and volumes"
    @echo "  make shell-hdfs      - Open shell in HDFS namenode"
    @echo "  make shell-spark     - Open shell in Spark master"

bootstrap: .env
    @echo "Building images..."
    docker compose build --no-cache
    @echo "Starting services..."
    docker compose up -d
    @echo "Running bootstrap script..."
    bash ./scripts/bootstrap.sh

.env:
    @echo "Creating .env file from .env.example..."
    cp .env.example .env
    @echo ".env file created. Update it as needed."

up:
    @echo "Starting services..."
    docker compose up -d
    @echo "Services started. Use 'make logs' to view logs."

down:
    @echo "Stopping and removing containers..."
    docker compose down

stop:
    @echo "Stopping containers (preserving volumes)..."
    docker compose stop

restart:
    @echo "Restarting services..."
    docker compose restart

logs:
    docker compose logs -f

logs-airflow:
    docker compose logs -f airflow-webserver airflow-scheduler airflow-triggerer

logs-spark:
    docker compose logs -f spark-master spark-worker

logs-hdfs:
    docker compose logs -f hdfs-namenode hdfs-datanode

logs-hive:
    docker compose logs -f hive-metastore hive-server2

status:
    @echo "Stack status:"
    docker compose ps

health:
    @bash ./scripts/health-check.sh

format-hdfs:
    @echo "Formatting HDFS namenode..."
    docker compose exec -T hdfs-namenode hdfs namenode -format -force

init-airflow:
    @echo "Initializing Airflow database..."
    docker compose exec -T airflow-webserver airflow db migrate
    docker compose exec -T airflow-webserver airflow users create --firstname Admin --lastname User --email admin@example.com --username admin --password admin --role Admin || true

create-hive-dirs:
    @echo "Creating Hive warehouse directories..."
    docker compose exec -T hdfs-namenode hdfs dfs -mkdir -p /user/hive/warehouse || true
    docker compose exec -T hdfs-namenode hdfs dfs -chmod -R 777 /user/hive/warehouse || true
    docker compose exec -T hdfs-namenode hdfs dfs -mkdir -p /data || true
    docker compose exec -T hdfs-namenode hdfs dfs -chmod -R 777 /data || true
    @echo "Directories created"

clean:
    @echo "Removing containers and volumes..."
    docker compose down -v
    @echo "Stack cleaned"

shell-hdfs:
    docker compose exec hdfs-namenode bash

shell-spark:
    docker compose exec spark-master bash

.PHONY: build
build:
    @echo "Building all images..."
    docker compose build --no-cache
