package cs.sbs.web.personalprojectweb2026.repository;

import cs.sbs.web.personalprojectweb2026.entity.AiMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage>
    findAllByConversation_IdAndConversation_User_IdOrderByCreatedAtAscIdAsc(
            Long conversationId,
            Long userId
    );

    Page<AiMessage>
    findAllByConversation_IdAndConversation_User_IdOrderByCreatedAtDescIdDesc(
            Long conversationId,
            Long userId,
            Pageable pageable
    );
}