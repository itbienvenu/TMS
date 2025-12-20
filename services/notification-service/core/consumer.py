
import asyncio
import json
import logging
import os
import aio_pika

logger = logging.getLogger("NotificationConsumer")
RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")

async def process_message(message: aio_pika.IncomingMessage):
    async with message.process():
        try:
            data = json.loads(message.body.decode())
            event_type = message.routing_key
            
            logger.info(f"Received Event: {event_type} | Data: {data}")
            
            if event_type == "ticket.sold" or event_type == "ticket.paid":
                email = data.get("user_email")
                phone = data.get("user_phone")
                route = data.get("route")
                logger.info(f"📧 Sending Payment Confirmation to {email} for route {route}")

            elif event_type == "bus.swapped":
                logger.info(f"Bus Swap Alert: Triggering alerts for Schedule {data.get('schedule_id')}")

        except Exception as e:
            logger.error(f"Error processing message: {e}")

async def start_rabbitmq_consumer():
    while True:
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            channel = await connection.channel()
            
            exchange = await channel.declare_exchange("ticketing_events", aio_pika.ExchangeType.TOPIC)
            
            queue = await channel.declare_queue("notification_queue", durable=True)
            
            await queue.bind(exchange, routing_key="ticket.#")
            await queue.bind(exchange, routing_key="bus.#") 
            
            logger.info("🐰 API Consumer Connected to RabbitMQ")
            
            await queue.consume(process_message)
            
            await asyncio.Future()
            
        except Exception as e:
            logger.error(f"RabbitMQ Connection failed, retrying in 5s... {e}")
            await asyncio.sleep(5)
