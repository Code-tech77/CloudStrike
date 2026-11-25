import uuid
from datetime import datetime, timezone


def generate_event(
    username,
    source_ip,
    event_type,
    outcome,
    description
):

    return {
        "event_id": str(uuid.uuid4()),

        "@timestamp": datetime.now(
            timezone.utc
        ).isoformat(),

        "user": {
            "name": username
        },

        "source": {
            "ip": source_ip
        },

        "event": {
            "category": ["authentication"],
            "action": event_type,
            "outcome": outcome,
            "kind": "event"
        },

        "message": description
    }