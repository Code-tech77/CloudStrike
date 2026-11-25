from simulator.event_factory import generate_event


def simulate_password_spraying():

    events = []

    attacker_ip = "198.51.100.50"

    targets = [
        "john",
        "sarah",
        "alex",
        "admin",
        "mohammed"
    ]

    for username in targets:

        event = generate_event(
            username=username,
            source_ip=attacker_ip,
            event_type="user_login",
            outcome="failure",
            description="Suspicious authentication attempt"
        )

        events.append(event)

    print("[!] Password spraying simulated")

    return events