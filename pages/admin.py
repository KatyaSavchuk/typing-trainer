from django.contrib import admin
from .models import TestTopic, TestText

@admin.register(TestTopic)
class TestTopicAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "active")
    list_filter = ("active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}  # slug сам заполняется


@admin.register(TestText)
class TestTextAdmin(admin.ModelAdmin):
    list_display = ("title", "topic", "language", "difficulty", "active")
    list_filter = ("topic", "language", "difficulty", "active")
    search_fields = ("title", "text")
