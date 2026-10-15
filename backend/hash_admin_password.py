from bcrypt import hashpw, gensalt

def hash_password(password: str) -> str:
    return hashpw(password.encode("utf-8"), gensalt()).decode("utf-8")

if __name__ == "__main__":
    pwd = input("Enter admin password to hash: ").strip()
    if not pwd:
        print("Password cannot be empty.")
    else:
        print("\nGenerated bcrypt hash:")
        print(hash_password(pwd))
