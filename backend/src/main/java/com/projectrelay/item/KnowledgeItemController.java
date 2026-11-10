
package com.projectrelay.item;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/items")
public class KnowledgeItemController {

    private final KnowledgeItemRepository repository;

    public KnowledgeItemController(
            KnowledgeItemRepository repository) {
        this.repository = repository;
    }

    // Both Admin and Team Members can view knowledge
    @GetMapping
    public List<KnowledgeItem> all() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    // Both Admin and Team Members can add knowledge
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public KnowledgeItem create(
            @Valid @RequestBody KnowledgeItem item) {

        if (item.getType() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Type is required"
            );
        }

        if (item.getStatus() == null ||
                item.getStatus().isBlank()) {
            item.setStatus("OPEN");
        }

        return repository.save(item);
    }

    // Both Admin and Team Members can edit knowledge
    @PutMapping("/{id}")
    public KnowledgeItem update(
            @PathVariable Long id,
            @Valid @RequestBody KnowledgeItem input) {

        KnowledgeItem item = repository.findById(id)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Item not found"
                        )
                );

        item.setTitle(input.getTitle());
        item.setDetails(input.getDetails());
        item.setType(input.getType());
        item.setOwnerName(input.getOwnerName());
        item.setStatus(input.getStatus());
        item.setDecisionReason(input.getDecisionReason());

        return repository.save(item);
    }

    // Only Admin can delete knowledge
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {

        if (!repository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Item not found"
            );
        }

        repository.deleteById(id);
    }
}
