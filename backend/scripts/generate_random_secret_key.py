# python
import secrets
import string


def generate_secret_key(length: int = 64) -> str:
    """Generate a cryptographically secure random secret key."""

    alphabet = string.ascii_letters + string.digits + "!@$%^&*()-_+[]{}|;:,.<>?"

    return "".join(secrets.choice(alphabet) for _ in range(length))


if __name__ == "__main__":
    print("=" * 72)
    print("Generated secret keys for JWT_SECRET_KEY:")
    print("=" * 72)
    for i in range(3):
        print(f"  [{i + 1}]  {generate_secret_key()}")
    print("=" * 72)
    print("Copy one of the keys above into your .env file:")
    print("  JWT_SECRET_KEY=<key>")
    print("=" * 72)
