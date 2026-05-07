from django.test import TestCase
from django.contrib.auth.models import User
from accounts.forms import RegisterForm


class RegisterFormTest(TestCase):
    def test_register_form_valid(self):
        form = RegisterForm(data={
            "username": "testuser",
            "email": "test@example.com",
            "password1": "StrongPass123",
            "password2": "StrongPass123",
        })

        self.assertTrue(form.is_valid())

    def test_user_creation(self):
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="StrongPass123"
        )

        self.assertEqual(user.username, "testuser")
        self.assertTrue(user.check_password("StrongPass123"))