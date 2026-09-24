from typing import override

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class DirectoryPagination(PageNumberPagination):
    """Shared response contract for Administration directory endpoints."""

    page_size: int | None = 20
    page_size_query_param: str | None = "page_size"
    max_page_size: int | None = 100

    @override
    def get_paginated_response(self, data: object) -> Response:
        page = self.page
        request = self.request

        if page is None:
            raise AssertionError("Pagination page has not been initialized.")

        if request is None:
            raise AssertionError("Pagination request has not been initialized.")

        page_size = self.get_page_size(request)

        return Response(
            {
                "total": page.paginator.count,
                "page": page.number,
                "page_size": page_size,
                "total_pages": page.paginator.num_pages,
                "results": data,
            }
        )
