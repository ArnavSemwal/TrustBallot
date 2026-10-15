import unittest
from tally.threshold_dkg import ShamirSecretSharing, ThresholdDecryptionService

class TestThresholdDKG(unittest.TestCase):
    def test_shamir_split_and_reconstruct(self):
        secret = 12345678901234567890
        shares, prime = ShamirSecretSharing.split(secret, threshold=3, num_shares=4)
        self.assertEqual(len(shares), 4)

        # 3 shares should reconstruct secret
        subset_3 = {1: shares[1], 2: shares[2], 4: shares[4]}
        reconstructed = ShamirSecretSharing.lagrange_interpolate_zero(subset_3, prime)
        self.assertEqual(secret, reconstructed)

        # Different 3 shares
        subset_3_alt = {2: shares[2], 3: shares[3], 4: shares[4]}
        reconstructed_alt = ShamirSecretSharing.lagrange_interpolate_zero(subset_3_alt, prime)
        self.assertEqual(secret, reconstructed_alt)

    def test_threshold_decryption_service(self):
        service = ThresholdDecryptionService(threshold=3, num_nodes=4)
        pub = service.public_key

        vote1 = [pub.encrypt(1), pub.encrypt(0)]
        vote2 = [pub.encrypt(0), pub.encrypt(1)]
        vote3 = [pub.encrypt(1), pub.encrypt(0)]
        tally = [vote1[0] + vote2[0] + vote3[0], vote1[1] + vote2[1] + vote3[1]]

        shares = [service.get_node_key_share(i) for i in range(1, 5)]

        # 2 shares should fail
        with self.assertRaises(ValueError):
            service.combine_and_decrypt(tally, [shares[0], shares[1]])

        # 3 shares should succeed
        results = service.combine_and_decrypt(tally, [shares[0], shares[2], shares[3]])
        self.assertEqual(results, [2, 1])

if __name__ == '__main__':
    unittest.main()
