from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
import hashlib
import base64
import os
import json

# Must match Frontend logic
# Frontend uses CryptoJS.SHA256(RAW_KEY) to derive the key
RAW_KEY = os.environ.get("ENCRYPTION_KEY", "default_super_secret_key_change_me")
# SHA256 digest gives 32 bytes
KEY = hashlib.sha256(RAW_KEY.encode()).digest()

def decrypt_payload(payload: str):
    """
    Decrypts payload format: "iv_hex:ciphertext_b64"
    """
    try:
        if ":" not in payload:
            return None
            
        iv_hex, ciphertext_b64 = payload.split(":")
        iv = bytes.fromhex(iv_hex)
        ciphertext = base64.b64decode(ciphertext_b64)
        
        if len(iv) != 16:
            raise ValueError("Invalid IV length")

        cipher = Cipher(algorithms.AES(KEY), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        padded_data = decryptor.update(ciphertext) + decryptor.finalize()
        
        unpadder = padding.PKCS7(128).unpadder()
        data = unpadder.update(padded_data) + unpadder.finalize()
        
        return json.loads(data.decode())
    except Exception as e:
        # print(f"Decryption error: {e}")
        return None

def encrypt_payload(data: dict) -> str:
    """
    Encrypts data to format: "iv_hex:ciphertext_b64"
    """
    try:
        json_data = json.dumps(data)
        iv = os.urandom(16)
        
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(json_data.encode()) + padder.finalize()
        
        cipher = Cipher(algorithms.AES(KEY), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()
        
        iv_hex = iv.hex()
        ciphertext_b64 = base64.b64encode(ciphertext).decode()
        
        return f"{iv_hex}:{ciphertext_b64}"
    except Exception as e:
        # print(f"Encryption error: {e}")
        raise e
