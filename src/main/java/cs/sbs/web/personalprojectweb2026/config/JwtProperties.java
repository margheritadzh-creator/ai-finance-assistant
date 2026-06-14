package cs.sbs.web.personalprojectweb2026.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.nio.charset.StandardCharsets;

@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(
        String secret,
        long expirationSeconds
) {

    public JwtProperties {
        if (secret == null
                || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException(
                    "JWT secret must contain at least 32 bytes"
            );
        }

        if (expirationSeconds <= 0) {
            throw new IllegalArgumentException(
                    "JWT expiration must be greater than zero"
            );
        }
    }
}