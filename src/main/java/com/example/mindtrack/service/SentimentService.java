package com.example.mindtrack.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@Service
public class SentimentService {

    private final Set<String> positiveWords = new HashSet<>(Arrays.asList(
            "happy", "good", "great", "awesome", "love", "excited",
            "calm", "relaxed", "thankful", "grateful", "hopeful"
    ));

    private final Set<String> negativeWords = new HashSet<>(Arrays.asList(
            "sad", "bad", "terrible", "angry", "upset", "tired",
            "anxious", "worried", "stressed", "lonely", "depressed"
    ));

    public Result analyze(String text) {
        if (text == null || text.isBlank()) {
            return new Result(0.0, "Neutral");
        }

        String lower = text.toLowerCase();
        int pos = 0;
        int neg = 0;

        for (String word : positiveWords) {
            if (lower.contains(word)) {
                pos++;
            }
        }
        for (String word : negativeWords) {
            if (lower.contains(word)) {
                neg++;
            }
        }

        int total = pos + neg;

        double score;
        String label;

        if (total == 0) {
            score = 0.0;
            label = "Neutral";
        } else {
            score = (double) (pos - neg) / total;
            if (score > 0.2) {
                label = "Positive";
            } else if (score < -0.2) {
                label = "Negative";
            } else {
                label = "Neutral";
            }
        }

        return new Result(score, label);
    }

    public static class Result {
        private final double score;
        private final String label;

        public Result(double score, String label) {
            this.score = score;
            this.label = label;
        }

        public double getScore() {
            return score;
        }

        public String getLabel() {
            return label;
        }
    }
}