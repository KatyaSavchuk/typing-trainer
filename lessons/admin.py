from django.contrib import admin
from .models import Lesson, LessonText, LessonProgress


class LessonTextInline(admin.TabularInline):
    model = LessonText
    extra = 1
    fields = ("language", "title", "difficulty", "text")
    show_change_link = True


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("order", "title", "language", "duration_sec", "level", "updated_at")
    list_filter = ("language", "level")
    search_fields = ("title", "short_description", "keys_covered")
    ordering = ("order", "id")
    inlines = [LessonTextInline]
    fields = (
        "order",
        "language",
        "title",
        "short_description",
        "instruction",
        "keys_covered",
        "duration_sec",
        "level",
        "description",
    )


@admin.register(LessonText)
class LessonTextAdmin(admin.ModelAdmin):
    list_display = ("lesson", "language", "title", "difficulty")
    list_filter = ("language", "difficulty")
    search_fields = ("lesson__title", "title", "text")


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "lesson", "completed", "updated_at")
    list_filter = ("completed", "lesson__language")
    search_fields = ("user__username", "lesson__title")
