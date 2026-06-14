package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}