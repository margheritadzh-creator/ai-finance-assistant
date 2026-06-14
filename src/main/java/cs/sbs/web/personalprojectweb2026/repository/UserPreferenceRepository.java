package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.UserPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserPreferenceRepository extends JpaRepository<UserPreference, Long> {

    Optional<UserPreference> findByUser_Id(Long userId);

    boolean existsByUser_Id(Long userId);
}