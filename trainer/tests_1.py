from django.test import TestCase
from django.contrib.auth.models import User
from trainer.models import TrainingResult


class TrainingResultModelTest(TestCase):

    def test_training_result_creation(self):
        user = User.objects.create_user(
            username="testuser",
            password="StrongPass123"
        )

        result = TrainingResult.objects.create(
            user=user,
            mode="trainer",
            duration_sec=60,
            typed_chars=120,
            correct_chars=110,
            errors=10,
            accuracy=91.7,
            cpm=120,
            wpm=24
        )

        self.assertEqual(result.user, user)
        self.assertEqual(result.mode, "trainer")
        self.assertEqual(result.duration_sec, 60)
        self.assertEqual(result.wpm, 24)
        self.assertEqual(result.accuracy, 91.7)
        self.assertEqual(result.errors, 10)