from django.urls import path
from . import views

urlpatterns = [
    path("lessons/", views.lessons_list, name="lessons_list"),
    path("lessons/<int:lesson_id>/start/", views.lesson_start, name="lesson_start"),
    path("lessons/<int:lesson_id>/complete/", views.lesson_complete, name="lesson_complete"),
]
