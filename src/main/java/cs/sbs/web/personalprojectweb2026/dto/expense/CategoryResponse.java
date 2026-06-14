package cs.sbs.web.personalprojectweb2026.dto.expense;

import cs.sbs.web.personalprojectweb2026.entity.Category;

public record CategoryResponse(
        Long id,
        String code,
        String nameZh,
        String nameEn,
        Long parentId,
        String icon,
        int sortOrder
) {

    public static CategoryResponse from(Category category) {
        Long parentId = category.getParent() == null
                ? null
                : category.getParent().getId();

        return new CategoryResponse(
                category.getId(),
                category.getCode(),
                category.getNameZh(),
                category.getNameEn(),
                parentId,
                category.getIcon(),
                category.getSortOrder()
        );
    }
}