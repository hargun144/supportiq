import asyncio
import sys
import time
import httpx
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Add the backend directory to the path so we can import from database and models
sys.path.append(str(Path(__file__).parent))

try:
    from database import SessionLocal, engine
    from models import Base, Ticket, TicketStatus
    from seed import seed_database
except ImportError:
    from backend.database import SessionLocal, engine
    from backend.models import Base, Ticket, TicketStatus
    from backend.seed import seed_database

# Global variable for the server process
server_process = None


def start_server():
    global server_process
    venv_python = Path(__file__).parent / "venv" / "Scripts" / "python.exe"
    if venv_python.exists():
        cmd = [str(venv_python), "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
    else:
        cmd = ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

    server_process = subprocess.Popen(
        cmd,
        cwd=Path(__file__).parent,
    )
    time.sleep(5)
    if server_process.poll() is not None:
        raise RuntimeError("Server failed to start")
    print("Server started successfully.")


def stop_server():
    global server_process
    if server_process:
        server_process.terminate()
        server_process.wait()
        print("Server stopped.")


async def test_production_endpoints():
    base_url = "http://localhost:8000"
    async with httpx.AsyncClient(timeout=httpx.Timeout(connect=60.0, read=60.0, write=60.0, pool=60.0)) as client:
        print("=== Step 0: Health Check & Auth Token Setup ===")
        resp = await client.get(f"{base_url}/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
        print("Health check passed.")

        # Register & Login user
        user_data = {
            "email": "prod_tester@example.com",
            "password": "securepassword123",
            "full_name": "Production Tester"
        }
        resp = await client.post(f"{base_url}/auth/register", json=user_data)
        assert resp.status_code in (201, 400)

        login_data = {
            "email": "prod_tester@example.com",
            "password": "securepassword123"
        }
        resp = await client.post(f"{base_url}/auth/login", json=login_data)
        assert resp.status_code == 200
        access_token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        print("Authenticated successfully.")

        # Fetch Customer and Agent IDs
        resp = await client.get(f"{base_url}/customers", headers=headers)
        assert resp.status_code == 200
        customers = resp.json()
        assert len(customers) > 0
        valid_customer_id = customers[0]["id"]

        print("\n=== Test 1: Ticket Creation Edge Cases & Customer Validation ===")
        resp = await client.post(f"{base_url}/tickets/", json={
            "customer_id": 888888,
            "channel": "email",
            "message_text": "Test invalid customer"
        }, headers=headers)
        assert resp.status_code == 404
        print("Invalid customer correctly returned HTTP 404.")

        resp = await client.post(f"{base_url}/tickets/", json={
            "customer_id": valid_customer_id,
            "channel": "email",
            "message_text": ""
        }, headers=headers)
        assert resp.status_code == 422
        print("Empty message text correctly rejected with HTTP 422.")

        resp = await client.post(f"{base_url}/tickets/", json={
            "customer_id": valid_customer_id,
            "channel": "email",
            "message_text": "I need help with my monthly invoice payment receipt."
        }, headers=headers)
        assert resp.status_code == 201
        standard_ticket = resp.json()
        assert standard_ticket["category"] == "billing"
        assert "sentiment" in standard_ticket
        print(f"Standard ticket created ID {standard_ticket['id']}.")

        print("\n=== Test 2: Track 2 - Channel Ingestion APIs (Email, Chat, Social, Phone) ===")
        channels_to_test = [
            ("/channels/email", "email", "Email Ingest Test Message"),
            ("/channels/chat", "chat", "Live Chat Ingest Test Message"),
            ("/channels/social", "social", "Social Media Tweet Ingest Message"),
            ("/channels/phone", "phone", "Phone Call Transcript Ingest Message")
        ]
        for endpoint, channel_name, msg in channels_to_test:
            ingest_payload = {
                "customer_id": valid_customer_id,
                "message_text": msg,
                "metadata": {"test": True, "source": channel_name}
            }
            resp = await client.post(f"{base_url}{endpoint}", json=ingest_payload, headers=headers)
            assert resp.status_code == 201, f"Failed ingestion on {endpoint}: {resp.text}"
            ticket_res = resp.json()
            assert ticket_res["channel"] == channel_name
            print(f"Successfully ingested message via {endpoint} -> Created Ticket ID {ticket_res['id']}.")

        print("\n=== Test 3: Track 2 - Customer 360 Context API ===")
        resp = await client.get(f"{base_url}/customers/{valid_customer_id}/context", headers=headers)
        assert resp.status_code == 200, f"Customer context failed: {resp.text}"
        c360 = resp.json()
        assert "customer_profile" in c360
        assert "previous_tickets" in c360
        assert "conversations" in c360
        assert "interaction_timeline" in c360
        assert "sentiment_history" in c360
        assert "risk_history" in c360
        assert "unresolved_issues" in c360
        print(f"Customer 360 context verified: Profile '{c360['customer_profile']['name']}', Previous Tickets ({len(c360['previous_tickets'])}), Conversations ({len(c360['conversations'])}), Interactions ({len(c360['interaction_timeline'])}).")

        print("\n=== Test 4: Track 3 - Automated AI Response Generation (RAG Pipeline) ===")
        resp = await client.post(f"{base_url}/tickets/{standard_ticket['id']}/generate-response", headers=headers)
        assert resp.status_code == 200, f"Generate response failed: {resp.text}"
        ai_resp = resp.json()
        assert "suggested_response" in ai_resp
        assert "confidence_score" in ai_resp
        assert "sources_used" in ai_resp
        assert "reasoning" in ai_resp
        assert 0.0 <= ai_resp["confidence_score"] <= 1.0
        print(f"AI Response generated successfully (Confidence: {ai_resp['confidence_score']}, Sources: {ai_resp['sources_used']}).")
        print(f"Suggested Response snippet: {ai_resp['suggested_response'][:100]}...")

        print("\n=== Test 5: Track 4 - Predictive Support Analytics API ===")
        resp = await client.get(f"{base_url}/analytics/risk-predictions", headers=headers)
        assert resp.status_code == 200, f"Risk predictions failed: {resp.text}"
        predictions = resp.json()
        assert isinstance(predictions, list)
        assert len(predictions) > 0
        first_pred = predictions[0]
        assert "escalation_probability" in first_pred
        assert "risk_level" in first_pred
        assert "risk_factors" in first_pred
        assert "recommended_action" in first_pred
        print(f"Predictive Risk Analytics verified: Top Ticket ID {first_pred['ticket_id']} with Escalation Probability {first_pred['escalation_probability']} ({first_pred['risk_level']}). Recommended Action: '{first_pred['recommended_action']}'.")

        print("\n=== Test 6: Overdue SLA Check Endpoint ===")
        resp = await client.post(f"{base_url}/tickets/check-sla?max_hours=24", headers=headers)
        assert resp.status_code == 200
        sla_result = resp.json()
        assert "escalated_count" in sla_result
        print(f"Overdue SLA check completed: {sla_result['escalated_count']} tickets escalated.")

        print("\n=== Test 7: Dashboard Endpoint Calculations ===")
        resp = await client.get(f"{base_url}/dashboard", headers=headers)
        assert resp.status_code == 200
        dash = resp.json()
        required_dash_keys = [
            "total_tickets", "open_tickets", "resolved_tickets", "escalated_tickets",
            "avg_priority", "avg_risk", "sla_breached_count", "avg_resolution_time_minutes",
            "tickets_per_category", "tickets_per_agent", "busiest_agent", "highest_risk_ticket"
        ]
        for k in required_dash_keys:
            assert k in dash, f"Missing key '{k}' in dashboard response"

        print(f"Dashboard Stats Verified: Total={dash['total_tickets']}, Open={dash['open_tickets']}, Escalated={dash['escalated_tickets']}, Breached SLA={dash['sla_breached_count']}")

        print("\n=== All Hackathon Track Tests Passed Successfully! ===")


async def main():
    try:
        start_server()
        print("Seeding database...")
        seed_database()
        print("Database seeded.")
        time.sleep(2)

        await test_production_endpoints()

    except Exception as e:
        print(f"\n[ERROR] Error during test run: {e}")
        raise
    finally:
        stop_server()


if __name__ == "__main__":
    asyncio.run(main())