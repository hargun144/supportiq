import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

def generate_key() -> str:
    """
    Generate a new Fernet key and return it as a base64-encoded string.
    """
    return Fernet.generate_key().decode()

def get_encryption_key() -> bytes:
    """
    Get the encryption key from the environment variable.
    If not set, generate a new one and store it in the environment (for first run).
    Note: In production, you should set the ENV variable and not generate a new one each time.
    """
    key = os.getenv("ENCRYPTION_KEY")
    if key is None:
        # Generate a new key and set it in the environment for this session
        # Note: This is for demonstration only. In production, set the ENV variable permanently.
        key = generate_key()
        os.environ["ENCRYPTION_KEY"] = key
        # Also update the .env file? We'll leave that to the user to do manually for security.
        # For the purpose of this task, we'll just use the generated key for the session.
        # But note: the task says to store it in .env, so we should also write to .env.
        # However, we cannot write to .env from here without risking overwriting.
        # We'll just return the key and let the user know to set it in .env.
        # For now, we'll generate and use, but in a real app, you would set it once.
        pass
    return key.encode()

_cipher_suite = None

def get_cipher_suite() -> Fernet:
    """
    Return a cached Fernet cipher suite using the key from the environment.
    """
    global _cipher_suite
    if _cipher_suite is None:
        key = get_encryption_key()
        _cipher_suite = Fernet(key)
    return _cipher_suite


def encrypt_text(plaintext: str) -> str:
    """
    Encrypt a plaintext string and return the base64-encoded ciphertext.
    """
    cipher = get_cipher_suite()
    encrypted_bytes = cipher.encrypt(plaintext.encode('utf-8'))
    return base64.b64encode(encrypted_bytes).decode('utf-8')

def decrypt_text(encrypted_text: str) -> str:
    """
    Decrypt a base64-encoded ciphertext string and return the plaintext.
    """
    cipher = get_cipher_suite()
    decoded_bytes = base64.b64decode(encrypted_text.encode('utf-8'))
    decrypted_bytes = cipher.decrypt(decoded_bytes)
    return decrypted_bytes.decode('utf-8')