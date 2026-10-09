import json
from datetime import datetime
import logging

class StructuredJSONLogger:
    def log(self, level: str, node: str, event: str, **fields):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": level,
            "node": node,
            "event": event,
            "fields": fields
        }
        print(json.dumps(log_entry))

logger = StructuredJSONLogger()
