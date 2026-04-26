from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),

    path("login/", views.login_page, name="login"),
    
    path("trainer/", views.trainer, name="trainer"),
    path("trainer/save/", views.trainer_save, name="trainer_save"),  

    path("testing/", views.testing, name="testing"),
    path("testing/<slug:topic_slug>/", views.testing, name="testing_topic"),
    path("testing/<slug:topic_slug>/<int:text_id>/", views.testing, name="testing_text"),
    path("testing/save/", views.test_save, name="test_save"),  

    path("profile/", views.profile, name="profile"),
    path("stats/", views.stats, name="stats"),

    path("games/", views.games, name="games"),
    path("games/space-typing/", views.space_typing, name="space_typing"),
    path("games/space-race/", views.space_race, name="space_race"),
]
