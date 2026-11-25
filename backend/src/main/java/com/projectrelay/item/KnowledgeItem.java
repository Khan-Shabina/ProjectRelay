
package com.projectrelay.item;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "knowledge_items",
        indexes = {
                @Index(name = "idx_item_title", columnList = "title")
        }
)
public class KnowledgeItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String title;

    @Column(length = 3000)
    private String details;

    @Enumerated(EnumType.STRING)
    private ItemType type;

    private String ownerName;

    private String status;

    private String importance = "MEDIUM";

    @Column(length = 1500)
    private String decisionReason;

    private LocalDateTime createdAt;

    private LocalDateTime lastUpdatedAt;

    // Calculated by the backend; these are not database columns.
    @Transient
    private Integer riskScore;

    @Transient
    private String riskLevel;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        lastUpdatedAt = createdAt;

        if (importance == null || importance.isBlank()) {
            importance = "MEDIUM";
        }
    }

    @PreUpdate
    void onUpdate() {
        lastUpdatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public ItemType getType() { return type; }
    public void setType(ItemType type) { this.type = type; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getImportance() { return importance; }
    public void setImportance(String importance) { this.importance = importance; }

    public String getDecisionReason() { return decisionReason; }
    public void setDecisionReason(String decisionReason) { this.decisionReason = decisionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getLastUpdatedAt() { return lastUpdatedAt; }

    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
}
