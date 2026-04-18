from rest_framework.permissions import BasePermission

from apps.users.models.User import User


class IsCreatorUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.user_type == User.CREATOR
        )
