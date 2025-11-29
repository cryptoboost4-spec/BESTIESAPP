/**
 * Tests for badge utilities
 */
const { checkAndAwardBadges } = require('../badges');

describe('Badge Utilities', () => {
  describe('checkAndAwardBadges', () => {
    test('should award first check-in badge', () => {
      const userStats = {
        totalCheckIns: 1,
        completedCheckIns: 1,
        totalBesties: 0,
      };

      const badges = checkAndAwardBadges(userStats, []);

      expect(badges).toContainEqual(
        expect.objectContaining({
          type: 'first_checkin',
        })
      );
    });

    test('should award bestie badges', () => {
      const userStats = {
        totalCheckIns: 0,
        completedCheckIns: 0,
        totalBesties: 1,
      };

      const badges = checkAndAwardBadges(userStats, []);

      expect(badges).toContainEqual(
        expect.objectContaining({
          type: 'first_bestie',
        })
      );
    });

    test('should not duplicate existing badges', () => {
      const userStats = {
        totalCheckIns: 1,
        completedCheckIns: 1,
        totalBesties: 0,
      };

      const existingBadges = [{ type: 'first_checkin' }];
      const badges = checkAndAwardBadges(userStats, existingBadges);

      // Should not include first_checkin again
      const firstCheckInBadges = badges.filter(b => b.type === 'first_checkin');
      expect(firstCheckInBadges.length).toBe(0);
    });
  });
});

