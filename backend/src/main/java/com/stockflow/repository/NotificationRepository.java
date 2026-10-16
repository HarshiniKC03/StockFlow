package com.stockflow.repository;

import com.stockflow.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop50ByOrderByCreatedAtDesc();
    List<Notification> findByReadFalseOrderByCreatedAtDesc();
    long countByReadFalse();
}
