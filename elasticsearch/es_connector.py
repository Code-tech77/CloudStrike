from elasticsearch import Elasticsearch


class ElasticsearchConnector:
    def __init__(self):
        self.es = Elasticsearch(
            "http://localhost:9200",
            basic_auth=(
                "elastic",
                "SbsTjJod",
            ),
        )

    def check_connection(self):
        if self.es.ping():
            print("[+] Elasticsearch connected successfully")
            return True

        print("[-] Elasticsearch connection failed")
        return False

    def index_event(self, event):
        response = self.es.index(
            index="cloudstrike-events",
            document=event,
        )

        print(f"[+] Event indexed: {response['_id']}")
        return response