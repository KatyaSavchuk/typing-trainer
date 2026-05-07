from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from lessons.models import Lesson, LessonText


class LessonsTests(TestCase):

    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="testuser",
            password="StrongPass123"
        )

        self.lesson = Lesson.objects.create(
            title="Test lesson",
            short_description="Test description",
            instruction="Type the text",
            keys_covered="f j",
            language="uk",
            order=1,
            duration_sec=60
        )

        self.lesson_text = LessonText.objects.create(
            lesson=self.lesson,
            language="uk",
            title="Test text",
            text="Sample text for typing",
            difficulty=1
        )

    def test_lessons_list_page(self):
        response = self.client.get(reverse("lessons_list"))
        self.assertEqual(response.status_code, 200)

    def test_lesson_detail_page(self):
        response = self.client.get(reverse("lesson_start", args=[self.lesson.id]))
        self.assertEqual(response.status_code, 200)

    def test_lesson_text_created(self):
        self.assertEqual(self.lesson.texts.count(), 1)
        self.assertEqual(self.lesson_text.text, "Sample text for typing")