package cs.sbs.web.personalprojectweb2026.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiClientConfig {

    @Bean
    public ChatClient chatClient(
            ChatClient.Builder builder
    ) {
        return builder.build();
    }
}