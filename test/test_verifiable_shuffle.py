import unittest
from phe import paillier
from tally.verifiable_shuffle import VerifiableShuffleEngine

class TestVerifiableShuffle(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pub, cls.priv = paillier.generate_paillier_keypair()
        cls.engine = VerifiableShuffleEngine(cls.pub)

    def test_shuffle_multiset_preservation(self):
        original = [1, 2, 2, 3, 1, 4]
        encrypted = [self.pub.encrypt(x) for x in original]

        shuffled, proof = self.engine.shuffle_and_prove(encrypted)
        self.assertEqual(len(shuffled), len(original))

        decrypted = [self.priv.decrypt(c) for c in shuffled]
        self.assertEqual(sorted(decrypted), sorted(original))

        is_valid = self.engine.verify_shuffle_proof(encrypted, shuffled, proof, self.priv)
        self.assertTrue(is_valid)

    def test_tampered_batch_fails_verification(self):
        original = [1, 2, 3]
        encrypted = [self.pub.encrypt(x) for x in original]

        shuffled, proof = self.engine.shuffle_and_prove(encrypted)

        # Alter one vote in the shuffled batch
        tampered_shuffled = list(shuffled)
        tampered_shuffled[0] = tampered_shuffled[0] + self.pub.encrypt(5)

        is_valid = self.engine.verify_shuffle_proof(encrypted, tampered_shuffled, proof, self.priv)
        self.assertFalse(is_valid)

if __name__ == '__main__':
    unittest.main()
