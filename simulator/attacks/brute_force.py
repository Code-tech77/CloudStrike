from simulator.event_factory import generate_event


def simulate_brute_force():

    events = []

    attacker_ip = "203.0.113.100"
    target_user = "admin"

    for attempt in range(10):

        event = generate_event(
            username=target_user,
            source_ip=attacker_ip,
            event_type="user_login",
            outcome="failure",
            description=f"Failed login attempt {attempt + 1}"
        )

        events.append(event)

    print("[!] Brute-force attack simulated")

    return events