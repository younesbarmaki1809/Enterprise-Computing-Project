import json
import os
import time
import uuid
from datetime import datetime, timezone
from typing import Any

import requests
from kafka import KafkaConsumer, KafkaProducer


class TranslatorService:
    def __init__(self) -> None:
        self.bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:29092")
        self.consumer_group = os.getenv("KAFKA_CONSUMER_GROUP", "translator-service")
        self.input_topic = os.getenv("KAFKA_INPUT_TOPIC", "dms.documents.uploaded")
        self.output_topic = os.getenv("KAFKA_OUTPUT_TOPIC", "dms.documents.translated")
        self.auto_offset_reset = os.getenv("KAFKA_AUTO_OFFSET_RESET", "earliest")

        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
        self.target_language = os.getenv("TARGET_LANGUAGE", "French")
        self.max_retries = int(os.getenv("GEMINI_MAX_RETRIES", "3"))
        self.retry_backoff_seconds = float(os.getenv("GEMINI_RETRY_BACKOFF_SECONDS", "2"))

        if not self.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required")

        self.consumer = KafkaConsumer(
            self.input_topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.consumer_group,
            enable_auto_commit=False,
            auto_offset_reset=self.auto_offset_reset,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
            key_deserializer=lambda m: m.decode("utf-8") if m else None,
        )

        self.producer = KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            acks="all",
            retries=3,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
        )

    def run(self) -> None:
        print(
            f"Translator started. group={self.consumer_group}, input={self.input_topic}, "
            f"output={self.output_topic}, bootstrap={self.bootstrap_servers}"
        )

        for message in self.consumer:
            try:
                self._process_message(message.value)
                self.consumer.commit()
            except Exception as ex:
                print(f"Fatal processing error: {ex}")
                raise

    def _process_message(self, uploaded_event: dict[str, Any]) -> None:
        document_id = uploaded_event.get("documentId")
        source_text = (uploaded_event.get("title") or uploaded_event.get("fileName") or "").strip()

        if not document_id:
            raise ValueError("Incoming event is missing documentId")

        if not source_text:
            raise ValueError("Incoming event has no translatable text in title/fileName")

        translated_text = self._translate_with_retries(source_text)

        translated_event = {
            "eventId": str(uuid.uuid4()),
            "eventType": "DocumentTranslated",
            "occurredAt": datetime.now(timezone.utc).isoformat(),
            "sourceEventId": uploaded_event.get("eventId"),
            "documentId": document_id,
            "sourceLanguage": "auto",
            "targetLanguage": self.target_language,
            "sourceText": source_text,
            "translatedText": translated_text,
            "model": self.gemini_model,
            "fileName": uploaded_event.get("fileName"),
            "fileKey": uploaded_event.get("fileKey"),
            "storageBucket": uploaded_event.get("storageBucket"),
            "contentType": uploaded_event.get("contentType"),
            "fileSize": uploaded_event.get("fileSize"),
        }

        message_key = str(document_id)
        future = self.producer.send(self.output_topic, key=message_key, value=translated_event)
        future.get(timeout=15)
        self.producer.flush()

        print(
            f"Translated documentId={document_id} and published to {self.output_topic} "
            f"with key={message_key}"
        )

    def _translate_with_retries(self, source_text: str) -> str:
        last_error: Exception | None = None

        for attempt in range(1, self.max_retries + 1):
            try:
                return self._call_gemini(source_text)
            except Exception as ex:
                last_error = ex
                if attempt < self.max_retries:
                    wait_seconds = self.retry_backoff_seconds * attempt
                    print(
                        f"Gemini call failed (attempt {attempt}/{self.max_retries}). "
                        f"Retrying in {wait_seconds:.1f}s. Error: {ex}"
                    )
                    time.sleep(wait_seconds)

        raise RuntimeError(f"Gemini unreachable after {self.max_retries} attempts") from last_error

    def _call_gemini(self, source_text: str) -> str:
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{self.gemini_model}:generateContent?key={self.gemini_api_key}"
        )

        prompt = (
            f"Translate the following text to {self.target_language}. "
            "Return only the translated text without explanations.\n"
            f"Text: {source_text}"
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2},
        }

        response = requests.post(url, json=payload, timeout=30)
        response.raise_for_status()

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError(f"Gemini response missing candidates: {data}")

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            raise RuntimeError(f"Gemini response missing parts: {data}")

        text = (parts[0].get("text") or "").strip()
        if not text:
            raise RuntimeError(f"Gemini returned empty translation: {data}")

        return text


if __name__ == "__main__":
    service = TranslatorService()
    service.run()
