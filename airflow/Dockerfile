FROM apache/airflow:2.8.0-python3.11

# Install additional Python packages
RUN pip install --no-cache-dir \
    pyspark==3.5.0 \
    apache-airflow-providers-apache-spark==4.5.0 \
    apache-airflow-providers-apache-hadoop==4.5.0 \
    apache-airflow-providers-postgres==5.9.0 \
    pyhive==0.6.5 \
    requests==2.31.0

USER airflow
