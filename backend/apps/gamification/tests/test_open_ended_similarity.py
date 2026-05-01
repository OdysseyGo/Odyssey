from django.test import SimpleTestCase

from apps.gamification.open_ended_similarity import is_open_ended_answer_accepted


class OpenEndedSimilarityTests(SimpleTestCase):
    def assertAccepted(self, submitted_answer, correct_answer):
        accepted, score = is_open_ended_answer_accepted(
            submitted_answer, correct_answer
        )
        self.assertTrue(
            accepted,
            f"Expected {submitted_answer!r} to match {correct_answer!r}, got {score}",
        )

    def assertRejected(self, submitted_answer, correct_answer):
        accepted, score = is_open_ended_answer_accepted(
            submitted_answer, correct_answer
        )
        self.assertFalse(
            accepted,
            f"Expected {submitted_answer!r} not to match {correct_answer!r}, got {score}",
        )

    def test_accepts_answer_inside_natural_language_phrase(self):
        self.assertAccepted("the answer is Byzantine Empire", "Byzantine Empire")

    def test_accepts_articles_accents_and_plural_variants(self):
        self.assertAccepted("the cafe histories", "Cafe History")

    def test_accepts_numeric_answer_inside_sentence(self):
        self.assertAccepted("it was completed in 537 AD", "537")

    def test_accepts_initialism_for_multi_word_answers(self):
        self.assertAccepted("usa", "United States of America")

    def test_accepts_configured_aliases(self):
        self.assertAccepted("Ayasofya", "Hagia Sophia | Ayasofya")
        self.assertAccepted("Constantinople", "Istanbul or Constantinople")

    def test_accepts_parenthetical_aliases(self):
        self.assertAccepted("Ayasofya", "Hagia Sophia (Ayasofya)")

    def test_rejects_partial_answer_that_misses_required_words(self):
        self.assertRejected("Empire", "Byzantine Empire")

    def test_rejects_unrelated_answer(self):
        self.assertRejected("Topkapi Palace", "Byzantine Empire")
