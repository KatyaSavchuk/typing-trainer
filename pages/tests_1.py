from django.test import TestCase, Client
from django.urls import reverse


class PagesTests(TestCase):

    def setUp(self):
        self.client = Client()

    def test_home_page(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)

    def test_trainer_page(self):
        response = self.client.get(reverse('trainer'))
        self.assertEqual(response.status_code, 200)

    def test_testing_page(self):
        response = self.client.get(reverse('testing'))
        self.assertEqual(response.status_code, 200)

    def test_games_page(self):
        response = self.client.get(reverse('games'))
        self.assertEqual(response.status_code, 200)