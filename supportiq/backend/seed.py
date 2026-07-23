import random
from datetime import datetime, timedelta, timezone
try:
    from database import SessionLocal, engine, Base
    from models import (
        Customer, CustomerTier,
        Agent, AgentSpecialty,
        Ticket, TicketChannel, TicketStatus, TicketCategory,
        AuditLog, KnowledgeDocument, Conversation, InteractionHistory,
        User, Role
    )

except ImportError:
    from backend.database import SessionLocal, engine, Base
    from backend.models import (
        Customer, CustomerTier,
        Agent, AgentSpecialty,
        Ticket, TicketChannel, TicketStatus, TicketCategory,
        AuditLog, KnowledgeDocument, Conversation, InteractionHistory
    )

BILLING_MESSAGES = [
    "I was double charged on my subscription invoice #INV-9021 this month. Please issue a refund for the extra $49.99 charge.",
    "Why did my monthly billing amount jump from $29 to $79 without any email notification? I need an explanation immediately.",
    "My credit card was updated last week but the payment failed again today. Can someone help update my payment method on file?",
    "I canceled my subscription two weeks ago before the renewal date, yet I was still charged today. Please process a full refund.",
    "We need a formal VAT invoice for our accounting department for Q2 payments. Where can I download official receipts?",
    "Can we get a custom billing schedule? We prefer annual invoicing via ACH/wire transfer rather than monthly credit card charges.",
    "Our team upgraded to Enterprise tier last week, but our account dashboard still shows Free tier limitations. Please fix.",
    "Requesting a refund for the add-on package that was accidentally activated by one of our sub-account users.",
    "There is an unknown line item for 'Overage Charges' on our recent bill. We stayed well within our API call limits.",
    "How do I apply a promotional discount code to our existing active subscription?",
]

TECHNICAL_MESSAGES = [
    "The API is returning HTTP 500 Internal Server Error when sending POST requests to /v1/tickets/batch endpoint.",
    "Our webhooks stopped delivering payloads to our server around 03:00 UTC today. Are there ongoing gateway delays?",
    "The iOS app crashes every time a user opens a ticket attachment over 5MB. Crash report logs attached.",
    "Database connection pooling seems broken after the latest v2.4 update. We are seeing connection timeout exceptions.",
    "SSO SAML authentication with Okta is failing with error 'Invalid SAML Assertion Signature'. Please assist.",
    "Exporting user audit logs to CSV fails when the record count exceeds 10,000 rows. Page just hangs infinitely.",
    "We are noticing severe latency on dashboard analytics page. Queries take over 15 seconds to load.",
    "The Python SDK throws a TypeError when parsing response payloads containing null customer fields.",
    "Automated ticket routing rules are ignoring custom tag filters and assigning tickets to offline agents.",
    "Is there a WebSocket connection limit per IP address? Our frontend client drops connections every few minutes.",
]

GENERAL_MESSAGES = [
    "How do I add new team members to our workspace and assign them custom role permissions?",
    "Does SupportIQ offer a native integration with Jira or Slack for internal ticket escalation?",
    "Where can I find the latest API documentation and OpenAPI spec for v2 endpoints?",
    "Can we customize the customer portal theme with our corporate brand colors and custom domain?",
    "Is there a way to export historical ticket metrics for our internal quarterly performance review?",
    "What are the default rate limits for API calls under the Premium customer tier?",
    "Does SupportIQ support multi-language ticket handling and automated machine translation?",
    "How do I set up automated auto-responder emails outside of business operating hours?",
    "Where can I view our current monthly usage stats for active agents and storage volume?",
    "Is there a mobile app available for agents to respond to urgent tickets on the go?",
]

ANGRY_MESSAGES = [
    "URGENT: Your platform has been DOWN for 3 hours! Our entire support operations are halted and customers are furious!",
    "This is completely unacceptable! Third time this week that real-time chat notifications failed! Elevate to management NOW!",
    "I have submitted 4 tickets regarding our data sync issue and received ZERO replies! We are paying $50k/year for this???",
    "Your recent update wiped out our agent routing settings without warning! Fix this immediately or we cancel our Enterprise contract!",
    "I demand an immediate phone call from your VP of Customer Success. Your system bug caused us to breach SLA with our enterprise clients!",
    "CRITICAL BUG: Customer PII data was briefly visible in public ticket search! This is a severe compliance violation!",
    "Your support is a joke. Promised 1-hour SLA on critical issues and it's been 12 hours with no response! Put a senior engineer on this!",
    "Fix this billing error TODAY or I am filing a chargeback with our bank and switching to your competitor!",
    "Our account is locked for no apparent reason during our peak sales event! Unlock it RIGHT NOW!",
    "We lost 200 customer support transcripts due to your broken export tool. I need a data recovery specialist immediately!",
]


def seed_database(reset_db: bool = False):
    db = SessionLocal()
    try:
        if reset_db:
            print("Re-creating database tables with updated schema and indexes...")
            try:
                Base.metadata.drop_all(bind=engine)
            except Exception as e:
                print(f"Warning during drop_all: {e}")
        Base.metadata.create_all(bind=engine)

        print("Seeding 15 customers...")
        customer_data = [
            ("Acme Corporation", "support@acme.com", CustomerTier.ENTERPRISE),
            ("TechStart Global", "admin@techstart.io", CustomerTier.PREMIUM),
            ("Globex Systems", "it@globex.com", CustomerTier.ENTERPRISE),
            ("Initech LLC", "help@initech.org", CustomerTier.FREE),
            ("Umbrella Corp", "contact@umbrella.com", CustomerTier.PREMIUM),
            ("Stark Industries", "devs@stark.com", CustomerTier.ENTERPRISE),
            ("Wayne Enterprises", "tech@wayne.com", CustomerTier.ENTERPRISE),
            ("Cyberdyne Systems", "ops@cyberdyne.net", CustomerTier.PREMIUM),
            ("Soylent Corp", "info@soylent.com", CustomerTier.FREE),
            ("Hooli Inc", "support@hooli.com", CustomerTier.PREMIUM),
            ("Pied Piper", "richard@piedpiper.com", CustomerTier.FREE),
            ("Dunder Mifflin", "michael@dundermifflin.com", CustomerTier.FREE),
            ("Sterling Cooper", "don@sterlingcooper.com", CustomerTier.FREE),
            ("Aperture Science", "cave@aperture.com", CustomerTier.PREMIUM),
            ("Massive Dynamic", "info@massivedynamic.com", CustomerTier.FREE),
        ]

        customers = []
        for name, email, tier in customer_data:
            cust = Customer(name=name, email=email, tier=tier)
            db.add(cust)
            customers.append(cust)
        db.commit()
        for c in customers:
            db.refresh(c)

        print("Seeding 8 agents...")
        agent_data = [
            ("Alex Rivera", AgentSpecialty.BILLING),
            ("Blake Taylor", AgentSpecialty.BILLING),
            ("Casey Chen", AgentSpecialty.TECHNICAL),
            ("Dana White", AgentSpecialty.TECHNICAL),
            ("Morgan Smith", AgentSpecialty.COMPLAINT),
            ("Riley Jones", AgentSpecialty.COMPLAINT),
            ("Sam Avery", AgentSpecialty.GENERAL),
            ("Jordan Lee", AgentSpecialty.GENERAL),
        ]

        agents = []
        for name, specialty in agent_data:
            ag = Agent(name=name, specialty=specialty, current_load=0)
            db.add(ag)
            agents.append(ag)
        db.commit()

        print("Seeding Knowledge Base Documents...")
        kb_docs = [
            KnowledgeDocument(
                title="Refund and Billing Invoice Policy",
                category="billing",
                content="Refunds for duplicate charges or unused billing cycles are processed within 3-5 business days. Customers can download official VAT invoices directly under Account Settings > Invoices.",
                tags="refund, invoice, vat, billing, credit card"
            ),
            KnowledgeDocument(
                title="API 500 Internal Server Error & Rate Limits Troubleshooting",
                category="troubleshooting",
                content="API 500 errors during batch requests indicate payload size limits exceeding 10MB or database connection pool exhaustion. Use backoff retry policies and stay within tier rate limits (Premium: 1,000 req/min, Enterprise: 10,000 req/min).",
                tags="api, 500, error, limits, latency, connection"
            ),
            KnowledgeDocument(
                title="SAML SSO Okta Integration Guide",
                category="troubleshooting",
                content="When Okta SAML authentication fails with 'Invalid SAML Assertion Signature', ensure your identity provider X.509 certificate is updated in SupportIQ SSO Settings and assertion signing algorithm is set to SHA-256.",
                tags="sso, saml, okta, auth, signature, login"
            ),
            KnowledgeDocument(
                title="Enterprise SLA and Escalation Policy",
                category="policy",
                content="Enterprise customers receive guaranteed 1-hour response SLA. High risk tickets (risk_score >= 80) and unresolved tickets exceeding 24 hours are automatically escalated to senior engineering leads.",
                tags="sla, escalation, policy, enterprise, priority"
            ),
        ]
        db.add_all(kb_docs)
        db.commit()

        print("Seeding 150 tickets...")
        channels = [TicketChannel.EMAIL, TicketChannel.CHAT, TicketChannel.PHONE, TicketChannel.SOCIAL]
        message_pools = [BILLING_MESSAGES, TECHNICAL_MESSAGES, GENERAL_MESSAGES, ANGRY_MESSAGES]

        now = datetime.now(timezone.utc)
        tickets = []

        random.seed(42)

        try:
            from services.ai_service import classify_ticket
        except ImportError:
            from backend.services.ai_service import classify_ticket

        agent_specialty_map = {
            TicketCategory.BILLING: AgentSpecialty.BILLING,
            TicketCategory.TECHNICAL: AgentSpecialty.TECHNICAL,
            TicketCategory.COMPLAINT: AgentSpecialty.COMPLAINT,
            TicketCategory.GENERAL: AgentSpecialty.GENERAL
        }

        for i in range(150):
            customer = random.choice(customers)
            channel = random.choice(channels)
            pool = random.choice(message_pools)
            base_msg = random.choice(pool)
            message_text = f"{base_msg} (Ref #{1000 + i})"

            days_ago = random.uniform(0, 14)
            created_time = now - timedelta(days=days_ago)

            ai_res = classify_ticket(message_text)

            target_specialty = agent_specialty_map.get(ai_res.category, AgentSpecialty.GENERAL)
            eligible_agents = [a for a in agents if a.specialty == target_specialty]
            if not eligible_agents:
                eligible_agents = [a for a in agents if a.specialty == AgentSpecialty.GENERAL] or agents

            eligible_agents.sort(key=lambda a: (a.current_load, a.id))
            assigned_agent = eligible_agents[0] if eligible_agents else None

            ticket = Ticket(
                customer_id=customer.id,
                agent_id=assigned_agent.id if assigned_agent else None,
                channel=channel,
                message_text=message_text,
                category=ai_res.category,
                priority_score=ai_res.priority_score,
                risk_score=ai_res.risk_score,
                sentiment=ai_res.sentiment,
                status=TicketStatus.OPEN,
                created_at=created_time,
                updated_at=created_time,
            )
            tickets.append(ticket)

            if assigned_agent:
                assigned_agent.current_load += 1

        db.add_all(agents)
        db.add_all(tickets)
        db.commit()

        print("Seeding Conversations & Interactions...")
        for c in customers[:5]:
            conv = Conversation(
                customer_id=c.id,
                channel=TicketChannel.EMAIL,
                message=f"Initial query from {c.name}: Requesting account setup guidance.",
                sender_type="customer",
                timestamp=now - timedelta(days=3)
            )
            interaction = InteractionHistory(
                customer_id=c.id,
                interaction_type="inbound_email",
                interaction_metadata={"channel": "email", "subject": "Account Inquiry"},
                timestamp=now - timedelta(days=3)
            )
        print("Seeding Demo Users...")
        try:
            from utils.auth import hash_password
        except ImportError:
            from backend.utils.auth import hash_password

        demo_users = [
            User(
                email="prod_tester@example.com",
                hashed_password=hash_password("securepassword123"),
                full_name="Support Agent",
                role=Role.AGENT
            ),
            User(
                email="admin@supportiq.com",
                hashed_password=hash_password("securepassword123"),
                full_name="Operations Admin",
                role=Role.ADMIN
            ),
            User(
                email="test@example.com",
                hashed_password=hash_password("securepassword123"),
                full_name="Test User",
                role=Role.AGENT
            )
        ]
        db.add_all(demo_users)
        db.commit()

        print(f"Successfully seeded {len(customers)} customers, {len(agents)} agents, {len(tickets)} tickets, demo users, KB docs, and interactions!")


    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
