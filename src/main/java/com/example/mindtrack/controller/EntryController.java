package com.example.mindtrack.controller;

import com.example.mindtrack.model.JournalEntry;
import com.example.mindtrack.model.User;
import com.example.mindtrack.repo.JournalEntryRepository;
import com.example.mindtrack.repo.UserRepository;
import com.example.mindtrack.service.SentimentService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/entries")
public class EntryController {

    private static final String SESSION_USER_ID = "USER_ID";

    private final UserRepository userRepository;
    private final JournalEntryRepository entryRepository;
    private final SentimentService sentimentService;

    public EntryController(UserRepository userRepository, JournalEntryRepository entryRepository, SentimentService sentimentService) {
        this.userRepository = userRepository;
        this.entryRepository = entryRepository;
        this.sentimentService = sentimentService;
    }

    private User requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId).orElse(null);
    }

    @PostMapping
    public ResponseEntity<?> createEntry(@RequestBody Map<String, String> body, HttpSession session) {
        User user = requireUser(session);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not logged in"));
        }

        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Content cannot be empty"));
        }

        SentimentService.Result result = sentimentService.analyze(content);
        JournalEntry entry = new JournalEntry(
                user,
                content,
                result.getLabel(),
                result.getScore(),
                LocalDateTime.now()
        );
        entryRepository.save(entry);

        return ResponseEntity.ok(Map.of(
                "message", "Entry saved",
                "sentimentLabel", result.getLabel(),
                "sentimentScore", result.getScore()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEntry(@PathVariable Long id, @RequestBody Map<String, String> body, HttpSession session) {
        User user = requireUser(session);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not logged in"));
        }

        Optional<JournalEntry> opt = entryRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        JournalEntry entry = opt.get();
        if (!entry.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Cannot edit others' entries"));
        }

        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Content cannot be empty"));
        }

        SentimentService.Result result = sentimentService.analyze(content);
        entry.setContent(content);
        entry.setSentimentLabel(result.getLabel());
        entry.setSentimentScore(result.getScore());
        entryRepository.save(entry);

        return ResponseEntity.ok(Map.of(
                "message", "Entry updated",
                "sentimentLabel", result.getLabel(),
                "sentimentScore", result.getScore()
        ));
    }

    @GetMapping
    public ResponseEntity<?> listEntries(HttpSession session) {
        User user = requireUser(session);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not logged in"));
        }

        List<JournalEntry> entries = entryRepository.findByUserOrderByCreatedAtDesc(user);

        List<Map<String, Object>> response = new ArrayList<>();
        for (JournalEntry e : entries) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", e.getId());
            map.put("content", e.getContent());
            map.put("sentimentLabel", e.getSentimentLabel());
            map.put("sentimentScore", e.getSentimentScore());
            map.put("createdAt", e.getCreatedAt().toString());
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEntry(@PathVariable Long id, HttpSession session) {
        User user = requireUser(session);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not logged in"));
        }

        Optional<JournalEntry> opt = entryRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        JournalEntry entry = opt.get();
        if (!entry.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Cannot delete others' entries"));
        }

        entryRepository.delete(entry);
        return ResponseEntity.ok(Map.of("message", "Entry deleted"));
    }
}