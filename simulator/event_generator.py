import json
import random

from simulator.event_factory import generate_event

from simulator.attacks.brute_force import simulate_brute_force

from simulator.attacks.password_spraying import simulate_password_spraying


USERS = [
    "mohammed",
    "admin",
    "john",
    "sarah",
    "alex"
]

IP_ADDRESSES = [
    "192.168.1.10",
    "192.168.1.15",
    "10.0.0.25",
    "203.0.113.45",
    "198.51.100.20"
]


def save_events(events):

    with open("simulated_events.json", "w") as file:

        json.dump(events, file, indent=4)

    print(f"[+] Generated {len(events)} events")


def main():

    events = []

    # Generate normal activity
    for _ in range(10):

        events.append(
            generate_event(
                random.choice(USERS),
                random.choice(IP_ADDRESSES),
                "user_login",
                "success",
                "Normal user authentication"
            )
        )

    # Simulate attacks
    events.extend(simulate_brute_force())

    events.extend(simulate_password_spraying())

    save_events(events)


if __name__ == "__main__":
    main()