package com.example.mindtrack.repo;

import com.example.mindtrack.model.JournalEntry;
import com.example.mindtrack.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    List<JournalEntry> findByUserOrderByCreatedAtDesc(User user);
}
