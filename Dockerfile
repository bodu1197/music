# Python 3.9 Slim Image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Run the application using Uvicorn
# Pointing to 'api.index:app' as defined in api/index.py
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "8080"]
