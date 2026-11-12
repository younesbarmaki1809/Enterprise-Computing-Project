package com.ensia.documents_service.repository;

import com.ensia.documents_service.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /**
     * Find all departments that have a given user ID in their memberIds list.
     */
    List<Department> findByMemberIdsContaining(Long memberId);
}
