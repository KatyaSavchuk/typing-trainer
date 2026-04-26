from django.db import models


class TestTopic(models.Model):
    LANG_CHOICES = [
        ("uk", "Українська"),
        ("en", "English"),
    ]

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    active = models.BooleanField(default=True)

    language = models.CharField(
        max_length=2,
        choices=LANG_CHOICES,
        default="uk"
    )

    def __str__(self):
        return f"[{self.language}] {self.name}"


class TestText(models.Model):
    topic = models.ForeignKey(
        TestTopic,
        related_name="texts",
        on_delete=models.CASCADE
    )

    title = models.CharField(max_length=255)
    text = models.TextField()

    active = models.BooleanField(default=True)
    difficulty = models.PositiveSmallIntegerField(default=1)

    language = models.CharField(
        max_length=2,
        choices=TestTopic.LANG_CHOICES,
        default="uk"
    )

    def __str__(self):
        return f"[{self.language}] {self.title}"
