from .models import Badge, UserBadge

class BadgeService:
    @staticmethod
    def check_badges(user):
        """
        Checks all badges against the user's stats and awards them if criteria are met.
        """
        # Get all badges the user doesn't have yet
        earned_badge_ids = UserBadge.objects.filter(user=user).values_list('badge_id', flat=True)
        potential_badges = Badge.objects.exclude(id__in=earned_badge_ids)

        newly_earned = []

        for badge in potential_badges:
            criteria = badge.criteria or {}
            
            # Check XP threshold
            if 'xp' in criteria:
                if user.xp >= criteria['xp']:
                    UserBadge.objects.create(user=user, badge=badge)
                    newly_earned.append(badge.name)
                    continue

            # Check Tour Count threshold
            if 'tours_completed' in criteria:
                # Assuming user.tour_count is updated elsewhere or we count here
                # For now, let's use the field on User model
                if user.tour_count >= criteria['tours_completed']:
                    UserBadge.objects.create(user=user, badge=badge)
                    newly_earned.append(badge.name)
                    continue

            # check City Tour Count 
            if 'city' in criteria and 'count' in criteria:
                city = criteria['city']
                required_count = criteria['count']
                

                completed_in_city = user.tour_progress.filter(
                    status='COMPLETED',
                    tour__city__iexact=city
                ).count()
                
                if completed_in_city >= required_count:
                    UserBadge.objects.create(user=user, badge=badge)
                    newly_earned.append(badge.name)
                    continue
        
        return newly_earned
