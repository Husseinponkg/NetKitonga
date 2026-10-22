from bcrypt import hashpw, gensalt

password = "A002#tz1"
hashed = hashpw(password.encode("utf-8"), gensalt()).decode("utf-8")
print(hashed)
