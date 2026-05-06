FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
  build-essential \
  libpq-dev \
  postgresql-client \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements/base.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x entrypoint.sh
RUN groupadd --system app && useradd --system --gid app --home /app app
RUN mkdir -p /staticfiles /media && chown -R app:app /app /staticfiles /media
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
USER app
ENTRYPOINT ["/app/entrypoint.sh"]
