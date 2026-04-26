from django.contrib import admin
from .models import TrainingText, TrainingResult


@admin.register(TrainingText)
class TrainingTextAdmin(admin.ModelAdmin):
    list_display = ("id", "language", "title", "active", "created_at")
    list_filter = ("language", "active")
    search_fields = ("title", "text")
    ordering = ("-created_at",)


@admin.register(TrainingResult)
class TrainingResultAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "mode", "duration_sec", "wpm", "accuracy", "errors", "created_at")
    list_filter = ("mode",)
    ordering = ("-created_at",)
