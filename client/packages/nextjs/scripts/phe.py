import sys
import json
from lightphe import LightPHE
from lightphe import Fraction
from lightphe import EncryptedTensor
from lightphe import Paillier


def fraction_to_string(frac):
    return f"{frac.sign}/{frac.abs_dividend}/{frac.divisor}/{frac.dividend}"


def string_to_fraction(frac_str):
    sign, abs_dividend, divisor, dividend = map(int, frac_str.split("/"))
    return Fraction(dividend, abs_dividend, divisor, sign)


def encrypt_array(array, g, n):
    # convert public key string to json
    cs = LightPHE(algorithm_name="Paillier")
    cs.cs.keys["public_key"]["g"] = g
    cs.cs.keys["public_key"]["n"] = n
    # remove first and last character
    # array = array[0:-1]
    array = array.split("|")
    array = [float(item) for item in array]
    encrypted = cs.encrypt(plaintext=array)
    fraction_strings = [fraction_to_string(frac) for frac in encrypted.fractions]
    return "|".join(fraction_strings)


def decrypt_array(encrypted_array, phi, n):
    cs = LightPHE(algorithm_name="Paillier")
    cs.cs.keys["private_key"]["phi"] = int(phi)
    cs.cs.keys["public_key"]["n"] = int(n)
    # convert encrypted_array to EncryptedTensor
    # convert encrypted_array from str to list
    encrypted_array = encrypted_array.split("|")
    fraction = [string_to_fraction(frac_str) for frac_str in encrypted_array]
    encrypted_tensor = EncryptedTensor(fraction, cs)
    decrypted = cs.decrypt(encrypted_tensor)
    return "|".join(map(str, decrypted))


def generate_keypair():
    cs = LightPHE(algorithm_name="Paillier")
    keys = [
        str(cs.cs.keys["private_key"]["phi"]),
        str(cs.cs.keys["public_key"]["g"]),
        str(cs.cs.keys["public_key"]["n"]),
    ]
    return "|".join(keys)


def homomorphic_addition(encrypted_arrays, n):
    cs = Paillier(
        keys={
            "public_key": {"n": int(n)},
            "private_key": {},  # Empty private key, as we only need public key for addition
        }
    )

    encrypted_arrays = encrypted_arrays.split("&")

    # get the length of encrypted_arrays
    length = len(
        encrypted_arrays
    )  # this is number of submission/participants, at the end we need to divide the result by this number

    encrypted_array = encrypted_arrays[0].split("|")
    fraction1 = [string_to_fraction(frac_str) for frac_str in encrypted_array]
    encrypted_tensor_result = EncryptedTensor(fraction1, cs)

    for i in range(1, len(encrypted_arrays)):
        encrypted_array2 = encrypted_arrays[i].split("|")
        fraction2 = [string_to_fraction(frac_str) for frac_str in encrypted_array2]
        encrypted_tensor2 = EncryptedTensor(fraction2, cs)
        encrypted_tensor_result = encrypted_tensor_result + encrypted_tensor2

    encrypted_tensor_result = encrypted_tensor_result * (1 / length)

    fraction_strings = [
        fraction_to_string(frac) for frac in encrypted_tensor_result.fractions
    ]
    return "|".join(fraction_strings)


if __name__ == "__main__":
    operation = sys.argv[1]
    if operation == "encrypt":
        array = sys.argv[2]
        g = json.loads(sys.argv[3])
        n = json.loads(sys.argv[4])

        # return encrypted array
        encrypted_array = encrypt_array(array, g, n)
        sys.stdout.write(encrypted_array)
        sys.stdout.flush()
    elif operation == "generate_keypair":
        result = generate_keypair()
        sys.stdout.write(json.dumps(result))
        sys.stdout.flush()
    elif operation == "decrypt":
        encrypted_array = sys.argv[2]
        phi = sys.argv[3]
        n = sys.argv[4]
        decrypted_array = decrypt_array(encrypted_array, phi, n)
        sys.stdout.write(json.dumps(decrypted_array))
        sys.stdout.flush()
    elif operation == "homomorphic_addition":
        encrypted_arrays = sys.argv[2]
        n = sys.argv[3]
        result = homomorphic_addition(encrypted_arrays, n)
        sys.stdout.write(result)
        sys.stdout.flush()
