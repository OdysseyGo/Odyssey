import logging

from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from apps.payments.services.stripe_service import StripeService

logger = logging.getLogger(__name__)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

    try:
        StripeService.handle_webhook(payload, sig_header)
        return HttpResponse(status=200)
    except ValueError as e:
        logger.warning("Stripe webhook error: %s", e)
        return HttpResponse(status=400)
    except Exception as e:
        logger.error("Stripe webhook unexpected error: %s", e)
        return HttpResponse(status=500)
