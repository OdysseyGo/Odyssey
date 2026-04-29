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
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]