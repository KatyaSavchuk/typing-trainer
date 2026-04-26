from django.db import models
from django.conf import settings


LANG_CHOICES = [
    ("uk", "Українська"),
    ("en", "English"),
]


class Lesson(models.Model):
    order = models.PositiveIntegerField(default=0, db_index=True)
    language = models.CharField(max_length=2, choices=LANG_CHOICES, default="uk", db_index=True)

    title = models.CharField(max_length=255)
    short_description = models.CharField(max_length=255, blank=True, default="")
    instruction = models.TextField(blank=True, default="")
    keys_covered = models.CharField(max_length=255, blank=True, default="")

    duration_sec = models.PositiveIntegerField(default=60)
    level = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"[{self.language}] {self.title}"


class LessonText(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="texts")
    language = models.CharField(max_length=2, choices=LANG_CHOICES, default="uk", db_index=True)

    title = models.CharField(max_length=255, blank=True, default="")
    text = models.TextField()
    difficulty = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.lesson.title} / {self.title or 'Text'} ({self.language})"


class LessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE)

    completed = models.BooleanField(default=False, db_index=True)

    # когда именно урок отметили выполненным
    completed_at = models.DateTimeField(null=True, blank=True)

    # просто "последнее обновление записи"
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "lesson"], name="uniq_user_lesson_progress")
        ]

    def __str__(self):
        status = "done" if self.completed else "in progress"
        return f"{self.user.username} - {self.lesson.title} ({status})"
