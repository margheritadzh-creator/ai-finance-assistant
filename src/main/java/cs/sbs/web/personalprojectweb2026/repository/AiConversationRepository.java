package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.AiConversation;
import cs.sbs.web.personalprojectweb2026.entity.enums.AiConversationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiConversationRepository
        extends JpaRepository<AiConversation, Long> {

    Optional<AiConversation> findByIdAndUser_Id(
            Long id,
            Long userId
    );

    Page<AiConversation>
    findAllByUser_IdOrderByUpdatedAtDesc(
            Long userId,
            Pageable pageable
    );

    Page<AiConversation>
    findAllByUser_IdAndStatusOrderByUpdatedAtDesc(
            Long userId,
            AiConversationStatus status,
            Pageable pageable
    );
}