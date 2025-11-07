"""
Example Airflow DAG for the data engineering stack.
Place your DAGs in the airflow/ directory or create new subdirectories.
"""

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta


def print_hello():
    """Example Python function"""
    print("Hello from Airflow!")
    return "Task completed successfully"


default_args = {
    'owner': 'airflow',
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
    'start_date': datetime(2024, 1, 1),
}

with DAG(
    'example_dag',
    default_args=default_args,
    description='Example DAG for the data engineering stack',
    schedule_interval=timedelta(days=1),
    catchup=False,
) as dag:

    task_1 = BashOperator(
        task_id='bash_task',
        bash_command='echo "Running Bash task"',
    )

    task_2 = PythonOperator(
        task_id='python_task',
        python_callable=print_hello,
    )

    task_3 = BashOperator(
        task_id='final_task',
        bash_command='echo "DAG execution completed"',
    )

    task_1 >> task_2 >> task_3
