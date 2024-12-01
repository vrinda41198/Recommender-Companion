import sys
import subprocess
import argparse
import os

def start_application(tenant_id: str, client_id: str, client_secret: str):
    """Start the application using docker-compose with environment variables"""
    try:
        env = {
            'MICROSOFT_TENANT_ID': tenant_id,
            'MICROSOFT_CLIENT_ID': client_id,
            'MICROSOFT_CLIENT_SECRET': client_secret,
            **os.environ  # Include existing environment variables
        }
        
        subprocess.run(
            ['docker-compose', 'up', '--build'],
            env=env,
            check=True
        )
    except subprocess.CalledProcessError as e:
        print(f"Error starting Docker Compose: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("Error: Docker Compose not found. Please make sure Docker Desktop is installed and running.")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description='Start Recommender Companion application')
    parser.add_argument('tenant_id', help='Microsoft Azure Tenant ID')
    parser.add_argument('client_id', help='Microsoft Azure Client ID')
    parser.add_argument('client_secret', help='Microsoft Azure Client Secret')
    
    args = parser.parse_args()
    
    try:
        print("Starting application...")
        start_application(args.tenant_id, args.client_id, args.client_secret)
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()