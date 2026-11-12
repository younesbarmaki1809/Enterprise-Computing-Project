package com.ensia.documents_service.repository;

import com.ensia.documents_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    List<User> findByEmailAndPassword(String email, String password);

    Optional<User> findByEmail(String email);
}
