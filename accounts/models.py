from django.conf import settings
from django.db import models


class Profile(models.Model):
    LANG_CHOICES = [
        ("uk", "Українська"),
        ("en", "English"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    learning_language = models.CharField(
        max_length=2,
        choices=LANG_CHOICES,
        default="uk"
    )

    def __str__(self):
        return f"{self.user.username} ({self.learning_language})"
