from rest_framework import permissions


class IsCreatorOrReadOnly(permissions.BasePermission):
    """
    Allow reads for anyone; allow writes only for the tour's creator.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.creator == request.user


class IsTourCreatorOrReadOnly(permissions.BasePermission):
    """
    Nested step/review permission: allow reads for anyone authenticated (the viewset
    already enforces authentication). Writes require the parent tour's creator,
    or staff.

    For `create`, the target object does not exist yet, so ownership is checked
    against the `tour_pk` URL kwarg. For `update`/`partial_update`/`destroy`,
    `has_object_permission` enforces ownership on the existing step.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff:
            return True

        if view.action == "create":
            # Local import avoids a circular import if this module is ever
            # imported during app loading (signals, ready(), etc.).
            from .models import Tour

            tour_id = view.kwargs.get("tour_pk")
            return Tour.objects.filter(id=tour_id, creator=request.user).exists()

        # For detail writes, defer the ownership check to has_object_permission.
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff or obj.tour.creator == request.user
