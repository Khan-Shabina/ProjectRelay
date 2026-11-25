
package com.projectrelay.item;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/items")
public class KnowledgeItemController {

    private final KnowledgeItemRepository repository;

    public KnowledgeItemController(KnowledgeItemRepository repository) {
        this.repository = repository;
    }

    // Calculate knowledge loss risk
    private KnowledgeItem calculateRisk(KnowledgeItem item) {

        int score = 0;

        // 1. Importance points
        String importance = item.getImportance();

        if ("HIGH".equalsIgnoreCase(importance)) {
            score += 30;
        } else if ("MEDIUM".equalsIgnoreCase(importance)) {
            score += 20;
        } else {
            score += 10;
        }

        // 2. Age points: based on last updated date
        LocalDateTime lastUpdated = item.getLastUpdatedAt();

        if (lastUpdated != null) {
            long days = ChronoUnit.DAYS.between(
                    lastUpdated,
                    LocalDateTime.now()
            );

            if (days > 60) {
                score += 60;
            } else if (days > 30) {
                score += 40;
            } else if (days > 7) {
                score += 20;
            }
        }

        // 3. Status points
        String status = item.getStatus();

        if ("BLOCKED".equalsIgnoreCase(status)) {
            score += 10;
        } else if ("OPEN".equalsIgnoreCase(status)
                || "IN_PROGRESS".equalsIgnoreCase(status)) {
            score += 5;
        }

        // Keep score between 0 and 100
        score = Math.min(score, 100);

        item.setRiskScore(score);

        if (score >= 60) {
            item.setRiskLevel("HIGH");
        } else if (score >= 30) {
            item.setRiskLevel("MEDIUM");
        } else {
            item.setRiskLevel("LOW");
        }

        return item;
    }


    // Both Admin and Team Members can view and search knowledge
    @GetMapping
    public List<KnowledgeItem> all(
            @RequestParam(required = false) String search) {

        List<KnowledgeItem> items;

        if (search == null || search.isBlank()) {
            items = repository.findAllByOrderByCreatedAtDesc();
        } else {
            items = repository.findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(search.trim());
        }

        return items.stream()
                .map(this::calculateRisk)
                .toList();
    }


    // Both Admin and Team Members can add knowledge
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public KnowledgeItem create(@Valid @RequestBody KnowledgeItem item) {

        if (item.getType() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Type is required"
            );
        }

        if (item.getImportance() == null
                || item.getImportance().isBlank()) {
            item.setImportance("MEDIUM");
        }

        if (!List.of("LOW", "MEDIUM", "HIGH")
                .contains(item.getImportance().toUpperCase())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid importance"
            );
        }

        if (item.getStatus() == null || item.getStatus().isBlank()) {
            item.setStatus("OPEN");
        }

        KnowledgeItem saved = repository.save(item);

        return calculateRisk(saved);
    }

    // Both Admin and Team Members can edit knowledge
    @PutMapping("/{id}")
    public KnowledgeItem update(
            @PathVariable Long id,
            @Valid @RequestBody KnowledgeItem input) {

        KnowledgeItem item = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Item not found"
                ));

        item.setTitle(input.getTitle());
        item.setDetails(input.getDetails());
        item.setType(input.getType());
        item.setOwnerName(input.getOwnerName());
        item.setStatus(input.getStatus());
        item.setDecisionReason(input.getDecisionReason());

        if (input.getImportance() != null
                && !input.getImportance().isBlank()) {

            if (!List.of("LOW", "MEDIUM", "HIGH")
                    .contains(input.getImportance().toUpperCase())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Invalid importance"
                );
            }

            item.setImportance(input.getImportance().toUpperCase());
        }

        KnowledgeItem saved = repository.save(item);

        return calculateRisk(saved);
    }

    // Only Admin can delete knowledge
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {

        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Item not found"
            );
        }

        repository.deleteById(id);
    }
}
