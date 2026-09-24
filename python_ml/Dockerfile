FROM python:3.12-slim

WORKDIR /app

# Temporarily bypassing heavy PyTorch installs because user's disk is full
# RUN apt-get update ...
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

# Keep container alive without python running
CMD ["tail", "-f", "/dev/null"]
