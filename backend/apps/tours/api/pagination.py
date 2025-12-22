from rest_framework.pagination import PageNumberPagination


class TourPagination(PageNumberPagination):
    """Custom pagination that allows clients to set page_size."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100
