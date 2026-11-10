package com.projectrelay.gap;

import com.projectrelay.item.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class GapController {
    private final KnowledgeItemRepository repository;
    public GapController(KnowledgeItemRepository repository) { this.repository = repository; }

    @GetMapping("/gaps")
    public List<Gap> scan() {
        List<Gap> gaps = new ArrayList<>();
        for (KnowledgeItem item : repository.findAll()) {
            String type = item.getType() == null ? "" : item.getType().name();
            if ("TASK".equals(type)) {
                if (blank(item.getOwnerName()))
                    gaps.add(new Gap(item.getId(), item.getTitle(), "HIGH", "Task has no assigned owner.", "Assign a responsible team member."));
                if (blank(item.getDetails()))
                    gaps.add(new Gap(item.getId(), item.getTitle(), "MEDIUM", "Task has no description or context.", "Add steps, dependencies, and expected outcome."));
                if ("IN_PROGRESS".equalsIgnoreCase(item.getStatus()))
                    gaps.add(new Gap(item.getId(), item.getTitle(), "MEDIUM", "Task is still in progress.", "Record current progress and the next action."));
            }
            if ("DECISION".equals(type) && blank(item.getDecisionReason()))
                gaps.add(new Gap(item.getId(), item.getTitle(), "HIGH", "Decision has no recorded reason.", "Document why this decision was made."));
            if ("ISSUE".equals(type) && !"RESOLVED".equalsIgnoreCase(item.getStatus()))
                gaps.add(new Gap(item.getId(), item.getTitle(), "HIGH", "Issue is not marked as resolved.", "Document its owner, impact, and resolution plan."));
        }
        return gaps;
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
}
