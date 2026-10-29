package com.example.carservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
public class KafkaProducerService {
    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private static final String TOPIC = "car_events";

    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void sendCarEvent(String action, Object carData) {
        Map<String, Object> event = new HashMap<>();
        event.put("action", action); // Hành động: "CREATE", "UPDATE", "DELETE"
        event.put("data", carData);

        kafkaTemplate.send(TOPIC, event);
        logger.info("🚀 Đã bắn event Kafka lên topic {}: Action = {}", TOPIC, action);
    }
}