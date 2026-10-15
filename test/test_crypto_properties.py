import unittest
import random
from phe import paillier
from tally.threshold_dkg import ShamirSecretSharing, ThresholdDecryptionService

class TestCryptoPropertyInvariants(unittest.TestCase):
    """
    C19: Property-based cryptographic tests for homomorphic invariants,
    Shamir sharing boundaries, and threshold guarantees.
    """
    @classmethod
    def setUpClass(cls):
        cls.pub, cls.priv = paillier.generate_paillier_keypair()

    def test_homomorphic_addition_commutativity(self):
        """Property: Enc(a) + Enc(b) == Enc(b) + Enc(a)"""
        for _ in range(5):
            a = random.randint(0, 100)
            b = random.randint(0, 100)
            enc_a = self.pub.encrypt(a)
            enc_b = self.pub.encrypt(b)

            sum_ab = self.priv.decrypt(enc_a + enc_b)
            sum_ba = self.priv.decrypt(enc_b + enc_a)
            self.assertEqual(sum_ab, sum_ba)
            self.assertEqual(sum_ab, a + b)

    def test_homomorphic_addition_zero_identity(self):
        """Property: Enc(a) + Enc(0) == a"""
        for _ in range(5):
            a = random.randint(0, 100)
            enc_a = self.pub.encrypt(a)
            enc_zero = self.pub.encrypt(0)

            self.assertEqual(self.priv.decrypt(enc_a + enc_zero), a)

    def test_homomorphic_scalar_multiplication(self):
        """Property: k * Enc(a) == k * a"""
        for _ in range(5):
            a = random.randint(1, 10)
            k = random.randint(2, 5)
            enc_a = self.pub.encrypt(a)

            self.assertEqual(self.priv.decrypt(enc_a * k), k * a)

    def test_threshold_tampered_share_rejection(self):
        """Property: Corrupted or tampered share must trigger validation error"""
        service = ThresholdDecryptionService(threshold=3, num_nodes=4)
        pub = service.public_key
        tally = [pub.encrypt(1), pub.encrypt(2)]
        shares = [service.get_node_key_share(i) for i in range(1, 4)]

        # Corrupt one share
        corrupted_share = dict(shares[0])
        corrupted_share["share_p"] = corrupted_share["share_p"] ^ 0xDEADBEEF

        with self.assertRaises(ValueError):
            service.combine_and_decrypt(tally, [corrupted_share, shares[1], shares[2]])

if __name__ == '__main__':
    unittest.main()
