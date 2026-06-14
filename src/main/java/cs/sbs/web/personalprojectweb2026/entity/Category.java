package cs.sbs.web.personalprojectweb2026.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "category")
public class Category extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name_zh", nullable = false, length = 50)
    private String nameZh;

    @Column(name = "name_en", nullable = false, length = 50)
    private String nameEn;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Category parent;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "system_defined", nullable = false)
    private boolean systemDefined = true;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getNameZh() {
        return nameZh;
    }

    public String getNameEn() {
        return nameEn;
    }

    public Category getParent() {
        return parent;
    }

    public String getIcon() {
        return icon;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public boolean isSystemDefined() {
        return systemDefined;
    }

    public boolean isActive() {
        return active;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public void setNameZh(String nameZh) {
        this.nameZh = nameZh;
    }

    public void setNameEn(String nameEn) {
        this.nameEn = nameEn;
    }

    public void setParent(Category parent) {
        this.parent = parent;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public void setSystemDefined(boolean systemDefined) {
        this.systemDefined = systemDefined;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}