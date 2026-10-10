# Feature Specification — {{FEATURE_NAME}}

**Feature ID:** `{{FEATURE_ID}}`  
**Status:** Draft / Approved / In Progress / Done  
**Owner:** {{OWNER}}  
**Last updated:** {{DATE}}

---

## 1. Goal

{{FEATURE_GOAL}}

---

## 2. User Value

As a `{{USER}}`, I want `{{ACTION}}`, so that `{{BENEFIT}}`.

---

## 3. Scope

### In Scope

- {{ITEM}}

### Out of Scope

- {{ITEM}}

---

## 4. Requirements

| ID | Requirement | Priority |
|---|---|---|
| `{{FEATURE_ID}}-R1` | {{REQUIREMENT}} | Must |

---

## 5. User Flow

1. {{STEP}}
2. {{STEP}}
3. {{STEP}}

Success:
{{SUCCESS}}

Failure:
{{FAILURE}}

---

## 6. UI / Screens

Affected screens:
- {{SCREEN}}

States:
- loading;
- empty;
- error;
- success;
- disabled where relevant.

Design references:
{{REFERENCE}}

---

## 7. API Changes

New/changed endpoints:
- `{{METHOD}} {{PATH}}`

Contract changes:
{{CHANGES}}

If none, write `None`.

---

## 8. Database Changes

Entities/tables affected:
{{CHANGES}}

Migration required:
Yes / No

If none, write `None`.

---

## 9. Authorization

Who can use this feature:
{{ROLE_OR_RULE}}

Ownership restrictions:
{{RULE}}

---

## 10. Validation & Edge Cases

- {{EDGE_CASE}}
- {{VALIDATION_RULE}}

---

## 11. Security Considerations

- {{SECURITY_CONSIDERATION}}

---

## 12. Testing

Required:
- [ ] happy path;
- [ ] validation;
- [ ] authorization;
- [ ] error handling;
- [ ] regression;
- [ ] E2E if critical.

Specific cases:
- {{TEST_CASE}}

---

## 13. Implementation Plan

1. {{STEP}}
2. {{STEP}}
3. {{STEP}}

Likely files/modules:
- {{AREA}}

---

## 14. Acceptance Criteria

- [ ] {{CRITERION_1}}
- [ ] {{CRITERION_2}}
- [ ] {{CRITERION_3}}

---

## 15. Documentation Updates

- [ ] PRD if product behavior changes
- [ ] APP_FLOW if navigation changes
- [ ] API if contract changes
- [ ] DATABASE if schema changes
- [ ] ARCHITECTURE if design changes
- [ ] CURRENT_STATE after implementation
