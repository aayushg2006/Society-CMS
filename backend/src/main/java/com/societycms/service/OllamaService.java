package com.societycms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.societycms.enums.ComplaintPriority;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class OllamaService {

    private final String OLLAMA_API_URL = "http://localhost:11434/api/generate";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ComplaintPriority analyzePriority(String title, String description, String category) {
        try {
            String prompt = String.format(
                "You are an AI assistant that classifies the priority of housing society complaints. " +
                "You must respond with EXACTLY ONE WORD from this list: CRITICAL, HIGH, MEDIUM, LOW. " +
                "Do not include any other text, explanation, or punctuation. " +
                "Context: Title='%s', Description='%s', Category='%s'", 
                title, description != null ? description : "", category != null ? category : "OTHER"
            );

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "tinyllama");
            requestBody.put("prompt", prompt);
            requestBody.put("stream", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(OLLAMA_API_URL, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String aiResponse = root.path("response").asText().toUpperCase().trim();
                
                log.info("Ollama AI determined priority: {}", aiResponse);
                
                if (aiResponse.contains("CRITICAL")) return ComplaintPriority.CRITICAL;
                if (aiResponse.contains("HIGH")) return ComplaintPriority.HIGH;
                if (aiResponse.contains("MEDIUM")) return ComplaintPriority.MEDIUM;
                if (aiResponse.contains("LOW")) return ComplaintPriority.LOW;
            }
        } catch (Exception e) {
            log.error("Failed to analyze priority using Ollama: {}", e.getMessage());
        }
        
        return ComplaintPriority.LOW; // Default fallback if AI fails
    }
}
