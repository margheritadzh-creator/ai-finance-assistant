package cs.sbs.web.personalprojectweb2026;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PersonalProjectWeb2026ApplicationTests {

    public static void main(String[] args) {
        SpringApplication.run(
                PersonalProjectWeb2026Application.class,
                args
        );
    }
}