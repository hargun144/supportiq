import asyncio
import sys
import time
import httpx
import subprocess
import signal
import os
from pathlib import Path

# Add the backend directory to the path so we can import from database and models
sys.path.append(str(Path(__file__).parent))

from database import SessionLocal, engine
from models import Base
from seed import seed_database

# Global variable for the server process
server_process = None

def start_server():
    global server_process
    # Start the server using uvicorn from the virtual environment via python -m
    # We use the module path: main:app
    venv_python = Path(__file__).parent / "venv" / "Scripts" / "python.exe"
    server_process = subprocess.Popen(
        [str(venv_python), "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=Path(__file__).parent,
        # Remove stdout and stderr pipes to let output go to console
    )
    # Wait a bit for the server to start
    time.sleep(15)  # Increased wait time
    # Check if the process is still running
    if server_process.poll() is not None:
        raise RuntimeError("Server failed to start")
    print("Server started")

def stop_server():
    global server_process
    if server_process:
        server_process.terminate()
        server_process.wait()
        print("Server stopped")

async def test_auth_flow():
    base_url = "http://localhost:8000"
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("=== Testing Auth Flow ===")

        # 1. Register a new user
        print("\n1. Registering a new user...")
        test_email = f"auth_tester_{int(time.time())}@example.com"
        user_data = {
            "email": test_email,
            "password": "securepassword123",
            "full_name": "Test User"
        }
        print(f"   Sending user data: {user_data}")
        try:
            resp = await client.post(f"{base_url}/auth/register", json=user_data)
            print(f"   Status: {resp.status_code}")
            if resp.status_code == 201:
                user = resp.json()
                print(f"   Success: User registered with ID {user['id']}")
                print(f"   Email: {user['email']}")
                print(f"   Full Name: {user['full_name']}")
                print(f"   Role: {user['role']}")
            else:
                print(f"   Error: {resp.text}")
                return
        except Exception as e:
            print(f"   Exception: {type(e).__name__}: {e}")

            return

        # 2. Login to get token
        print("\n2. Logging in to get access token...")
        login_data = {
            "email": "test@example.com",
            "password": "securepassword123"
        }
        try:
            resp = await client.post(f"{base_url}/auth/login", json=login_data)
            print(f"   Status: {resp.status_code}")
            if resp.status_code == 200:
                token_data = resp.json()
                access_token = token_data["access_token"]
                token_type = token_data["token_type"]
                print(f"   Success: Got {token_type} token")
                print(f"   Token (first 20 chars): {access_token[:20]}...")
            else:
                print(f"   Error: {resp.text}")
                return
        except Exception as e:
            print(f"   Exception: {e}")
            return

        # 3. Access /me with token
        print("\n3. Accessing /auth/me with token...")
        headers = {"Authorization": f"Bearer {access_token}"}
        try:
            resp = await client.get(f"{base_url}/auth/me", headers=headers)
            print(f"   Status: {resp.status_code}")
            if resp.status_code == 200:
                user = resp.json()
                print(f"   Success: Retrieved user info")
                print(f"   ID: {user['id']}")
                print(f"   Email: {user['email']}")
                print(f"   Full Name: {user['full_name']}")
                print(f"   Role: {user['role']}")
                print(f"   Created At: {user['created_at']}")
            else:
                print(f"   Error: {resp.text}")
                return
        except Exception as e:
            print(f"   Exception: {e}")
            return

        # 4. Test ticket endpoint without token (should be 401)
        print("\n4. Testing GET /tickets without token (expect 401)...")
        try:
            resp = await client.get(f"{base_url}/tickets/")
            print(f"   Status: {resp.status_code}")
            if resp.status_code == 401:
                print("   Success: Unauthorized as expected")
                print(f"   Detail: {resp.json().get('detail', 'No detail')}")
            else:
                print(f"   Unexpected status: {resp.status_code}")
                print(f"   Response: {resp.text}")
        except Exception as e:
            print(f"   Exception: {e}")

        # 5. Test ticket endpoint with token (should be 200)
        print("\n5. Testing GET /tickets with token (expect 200)...")
        headers = {"Authorization": f"Bearer {access_token}"}
        try:
            resp = await client.get(f"{base_url}/tickets/", headers=headers)
            print(f"   Status: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                print(f"   Success: Retrieved tickets")
                print(f"   Total tickets: {data.get('total', 'N/A')}")
                print(f"   Number of tickets in this page: {len(data.get('tickets', []))}")
                if data.get('tickets'):
                    first_ticket = data['tickets'][0]
                    print(f"   First ticket ID: {first_ticket.get('id')}")
                    print(f"   First ticket message: {first_ticket.get('message_text', '')[:50]}...")
            else:
                print(f"   Error: {resp.text}")
        except Exception as e:
            print(f"   Exception: {e}")

async def main():
    try:
        # Start the server
        start_server()

        # Seed the database (this will reset the data and populate)
        print("Seeding database...")
        seed_database()
        print("Database seeded.")

        # Wait a moment for the seed to commit
        time.sleep(2)

        # Run the auth flow tests
        await test_auth_flow()

        print("\n=== All tests completed ===")

    except Exception as e:
        print(f"An error occurred: {e}")
        raise
    finally:
        # Stop the server
        stop_server()

if __name__ == "__main__":
    asyncio.run(main())