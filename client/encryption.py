import base64
from Cryptodome import Random
from Cryptodome.Hash import SHA256
from Cryptodome.Cipher import AES

def _cipherAES(password, iv):
    key = SHA256.new(password).digest()
    return AES.new(key, AES.MODE_CFB, iv)

def encode(plaintext, password):
    plaintext = str.encode(plaintext)
    password = str.encode(password)

    iv = Random.new().read(AES.block_size)
    return base64.b64encode(iv + _cipherAES(password, iv).encrypt(plaintext))

def decode(ciphertext, password):
    ciphertext = str.encode(ciphertext)
    password = str.encode(password)

    try:
        d = base64.b64decode(ciphertext)
        iv, ciphertext = d[:AES.block_size], d[AES.block_size:]
    except:
        return None

    return _cipherAES(password, iv).decrypt(ciphertext).decode("utf-8")