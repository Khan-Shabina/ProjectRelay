package com.projectrelay.item;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KnowledgeItemRepository extends JpaRepository<KnowledgeItem, Long> {
    List<KnowledgeItem> findAllByOrderByCreatedAtDesc();
}
