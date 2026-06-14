package cs.sbs.web.personalprojectweb2026.security;

import cs.sbs.web.personalprojectweb2026.config.JwtProperties;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class JwtService {

    public static final String ISSUER = "personal-project-web2026";

    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    public JwtService(
            JwtEncoder jwtEncoder,
            JwtProperties jwtProperties
    ) {
        this.jwtEncoder = jwtEncoder;
        this.jwtProperties = jwtProperties;
    }

    public String generateToken(AppUserPrincipal principal) {
        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plusSeconds(
                jwtProperties.expirationSeconds()
        );

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(ISSUER)
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .subject(principal.getUserId().toString())
                .claim("email", principal.getUsername())
                .claim("name", principal.getDisplayName())
                .claim("role", principal.getRole().name())
                .build();

        JwsHeader header = JwsHeader
                .with(MacAlgorithm.HS256)
                .build();

        return jwtEncoder
                .encode(JwtEncoderParameters.from(header, claims))
                .getTokenValue();
    }

    public long getExpirationSeconds() {
        return jwtProperties.expirationSeconds();
    }
}