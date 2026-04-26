from django.db import models
from django.conf import settings

class TrainingText(models.Model):
    LANG_CHOICES = [
        ("uk", "Українська"),
        ("en", "English"),
    ]

    language = models.CharField(max_length=2, choices=LANG_CHOICES, default="uk")
    title = models.CharField(max_length=255, blank=True, default="")
    text = models.TextField()

    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "id"]

    def __str__(self):
        name = self.title or "Training text"
        return f"[{self.language}] {name}"


class TrainingResult(models.Model):
    MODE_CHOICES = [
        ("trainer", "Trainer"),
        ("test", "Test"),
        ("lesson", "Lesson"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default="trainer")

    duration_sec = models.PositiveIntegerField(default=60)
    typed_chars = models.PositiveIntegerField(default=0)
    correct_chars = models.PositiveIntegerField(default=0)
    errors = models.PositiveIntegerField(default=0)

    accuracy = models.FloatField(default=0.0)
    cpm = models.FloatField(default=0.0)
    wpm = models.FloatField(default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.user or 'Guest'} - {self.mode} - {self.wpm:.1f} WPM"
