package com.projectrelay.report;

import com.projectrelay.gap.*;
import com.projectrelay.item.*;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api")
public class ReportController {
    private final KnowledgeItemRepository repository;
    private final GapController gapController;

    public ReportController(KnowledgeItemRepository repository, GapController gapController) {
        this.repository = repository;
        this.gapController = gapController;
    }

    @GetMapping("/report")
    public Map<String, Object> report() {
        List<KnowledgeItem> items = repository.findAllByOrderByCreatedAtDesc();
        List<Gap> gaps = gapController.scan();
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("generatedAt", LocalDateTime.now());
        report.put("totalItems", items.size());
        report.put("totalGaps", gaps.size());
        report.put("tasks", items.stream().filter(i -> i.getType() == ItemType.TASK).toList());
        report.put("decisions", items.stream().filter(i -> i.getType() == ItemType.DECISION).toList());
        report.put("issues", items.stream().filter(i -> i.getType() == ItemType.ISSUE).toList());
        report.put("knowledgeGaps", gaps);
        return report;
    }
}
