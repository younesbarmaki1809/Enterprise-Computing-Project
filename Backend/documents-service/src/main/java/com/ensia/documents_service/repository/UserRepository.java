package com.ensia.documents_service.repository;

import com.ensia.documents_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    List<User> findByEmailAndPassword(String email, String password);
}
